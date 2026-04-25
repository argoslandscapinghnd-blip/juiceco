"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Maestro de Unidades (Admin)
// ─────────────────────────────────────────────
import { useEffect, useState } from "react";
import { Header } from "./ui/components";
import { colors, btnPrimary, cardStyle, inputStyle } from "./ui/styles";
import { supabase } from "@/supabase";

interface Unidad { id: number; nombre: string; abreviatura: string; activo: boolean; }
interface Props { onBack: () => void; }

export default function UnidadesScreen({ onBack }: Props) {
  const [unidades,  setUnidades]  = useState<Unidad[]>([]);
  const [cargando,  setCargando]  = useState(true);
  const [nombre,    setNombre]    = useState("");
  const [abrev,     setAbrev]     = useState("");
  const [error,     setError]     = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    const { data } = await supabase.from("unidades").select("*").order("nombre");
    setUnidades((data as Unidad[]) ?? []);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const toggleActivo = async (u: Unidad) => {
    await supabase.from("unidades").update({ activo: !u.activo }).eq("id", u.id);
    cargar();
  };

  const handleCrear = async () => {
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return; }
    if (!abrev.trim())  { setError("La abreviatura es obligatoria."); return; }
    setGuardando(true); setError("");
    const { error: err } = await supabase.from("unidades").insert({ nombre, abreviatura: abrev, activo: true });
    if (err) {
      setError(err.message.includes("unique") ? "Esa unidad ya existe." : err.message);
      setGuardando(false); return;
    }
    setNombre(""); setAbrev("");
    setGuardando(false);
    cargar();
  };

  return (
    <section>
      <Header titulo="Unidades de Medida" onBack={onBack} />

      {/* Formulario rápido para crear */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, color: colors.textPrimary }}>+ Nueva unidad</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 8, marginBottom: 8 }}>
          <input
            placeholder="Nombre (Ej: Onza)"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={{ ...inputStyle, marginBottom: 0 }}
          />
          <input
            placeholder="Abrev."
            value={abrev}
            onChange={(e) => setAbrev(e.target.value)}
            style={{ ...inputStyle, marginBottom: 0 }}
            maxLength={5}
          />
        </div>
        {error && <p style={{ color: colors.danger, fontSize: 13, marginBottom: 8 }}>⚠️ {error}</p>}
        <button
          style={{ ...btnPrimary, opacity: guardando ? 0.7 : 1 }}
          onClick={handleCrear}
          disabled={guardando}
        >
          {guardando ? "Guardando..." : "CREAR UNIDAD"}
        </button>
      </div>

      {/* Lista */}
      {cargando ? (
        <div style={{ textAlign: "center", color: colors.textMuted, padding: 40 }}>Cargando...</div>
      ) : (
        unidades.map((u) => (
          <div key={u.id} style={{ ...cardStyle, opacity: u.activo ? 1 : 0.55, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontWeight: "bold", fontSize: 15 }}>{u.nombre}</span>
                <span style={{ fontSize: 13, color: colors.textMuted, marginLeft: 8 }}>({u.abreviatura})</span>
                <span style={{ fontSize: 11, fontWeight: "bold", padding: "2px 8px", borderRadius: 20, marginLeft: 8, background: u.activo ? colors.primaryLight : "#fdecea", color: u.activo ? colors.primary : colors.danger }}>
                  {u.activo ? "Activa" : "Inactiva"}
                </span>
              </div>
              <button
                onClick={() => toggleActivo(u)}
                style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: u.activo ? "#fdecea" : "#e8f5e9", color: u.activo ? colors.danger : colors.primary, fontWeight: "bold", fontSize: 12, cursor: "pointer" }}
              >
                {u.activo ? "🚫 Inhabilitar" : "✅ Habilitar"}
              </button>
            </div>
          </div>
        ))
      )}
    </section>
  );
}
