"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Crear / Editar Insumo
// ─────────────────────────────────────────────
import { useEffect, useState } from "react";
import { Header } from "./ui/components";
import { colors, inputStyle, btnPrimary, btnSecondary, cardStyle } from "./ui/styles";
import { supabase } from "@/supabase";

interface Insumo {
  id: number; nombre: string; unidad: string;
  tipo: "ingrediente" | "empaque"; costo_unitario: number; activo: boolean;
}
interface Unidad { id: number; nombre: string; abreviatura: string; }
interface Props { insumoEditar?: Insumo; onGuardar: () => void; onBack: () => void; }

export default function FormInsumoScreen({ insumoEditar, onGuardar, onBack }: Props) {
  const editando = !!insumoEditar;

  const [nombre,   setNombre]   = useState(insumoEditar?.nombre         ?? "");
  const [unidad,   setUnidad]   = useState(insumoEditar?.unidad         ?? "");
  const [tipo,     setTipo]     = useState<"ingrediente" | "empaque">(insumoEditar?.tipo ?? "ingrediente");
  const [costo,    setCosto]    = useState(insumoEditar?.costo_unitario?.toString() ?? "");
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [error,    setError]    = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    supabase.from("unidades").select("*").eq("activo", true).order("nombre")
      .then(({ data }) => setUnidades((data as Unidad[]) ?? []));
  }, []);

  const handleGuardar = async () => {
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return; }
    if (!unidad)        { setError("Selecciona una unidad."); return; }
    if (!costo.trim() || isNaN(parseFloat(costo)) || parseFloat(costo) < 0) {
      setError("Ingresa un costo válido."); return;
    }
    setCargando(true); setError("");

    if (editando) {
      const { error: err } = await supabase.from("insumos_maestro")
        .update({ nombre, unidad, tipo, costo_unitario: parseFloat(costo) })
        .eq("id", insumoEditar.id);
      if (err) { setError("Error: " + err.message); setCargando(false); return; }
    } else {
      const { error: err } = await supabase.from("insumos_maestro")
        .insert({ nombre, unidad, tipo, costo_unitario: parseFloat(costo), activo: true });
      if (err) { setError("Error: " + err.message); setCargando(false); return; }
    }
    setCargando(false);
    onGuardar();
  };

  const unidadSelec = unidades.find(u => u.abreviatura === unidad);

  return (
    <section>
      <Header titulo={editando ? "Editar insumo" : "Nuevo insumo"} onBack={onBack} />
      <div style={cardStyle}>

        {/* Tipo */}
        <label style={labelStyle}>Tipo</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {(["ingrediente", "empaque"] as const).map((t) => (
            <button key={t} onClick={() => setTipo(t)} style={{
              padding: "14px 10px", borderRadius: 12,
              border: `2px solid ${tipo === t ? colors.primary : colors.border}`,
              background: tipo === t ? colors.primaryLight : "white",
              cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            }}>
              <span style={{ fontSize: 28 }}>{t === "ingrediente" ? "🧪" : "📦"}</span>
              <span style={{ fontWeight: "bold", fontSize: 13, color: tipo === t ? colors.primary : colors.textSecondary }}>
                {t === "ingrediente" ? "Ingrediente" : "Empaque"}
              </span>
            </button>
          ))}
        </div>

        {/* Nombre */}
        <label style={labelStyle}>Nombre</label>
        <input
          placeholder={tipo === "ingrediente" ? "Ej: Limón, Azúcar..." : "Ej: Vaso, Pajilla..."}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          style={inputStyle}
        />

        {/* Unidad */}
        <label style={labelStyle}>Unidad de medida</label>
        {unidades.length === 0 ? (
          <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 12 }}>Cargando unidades...</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {unidades.map((u) => (
              <button key={u.id} onClick={() => setUnidad(u.abreviatura)} style={{
                padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                fontWeight: "bold", fontSize: 12,
                background: unidad === u.abreviatura ? colors.primary : "#e8e8e8",
                color: unidad === u.abreviatura ? "white" : colors.textSecondary,
              }}>
                {u.nombre} <span style={{ opacity: 0.7 }}>({u.abreviatura})</span>
              </button>
            ))}
          </div>
        )}

        {/* Costo */}
        <label style={labelStyle}>
          Costo por {unidadSelec ? `${unidadSelec.nombre.toLowerCase()} (${unidadSelec.abreviatura})` : "unidad"} (L.)
        </label>
        <input
          placeholder="0.00"
          value={costo}
          onChange={(e) => setCosto(e.target.value)}
          type="number" min="0"
          style={{ ...inputStyle, fontSize: 20, fontWeight: "bold" }}
        />

        {/* Preview */}
        {costo && parseFloat(costo) > 0 && unidad && (
          <div style={{ background: colors.primaryLight, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: colors.primary }}>
            💰 <strong>L {parseFloat(costo).toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong> por {unidadSelec?.nombre.toLowerCase() ?? unidad}
          </div>
        )}

        {error && <p style={{ color: colors.danger, fontSize: 14, marginBottom: 12 }}>⚠️ {error}</p>}

        <button style={{ ...btnPrimary, opacity: cargando ? 0.7 : 1 }} onClick={handleGuardar} disabled={cargando}>
          {cargando ? "Guardando..." : `💾 ${editando ? "GUARDAR CAMBIOS" : "CREAR INSUMO"}`}
        </button>
        <button style={{ ...btnSecondary, marginTop: 10 }} onClick={onBack}>CANCELAR</button>
      </div>
    </section>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: "bold", color: "#555", marginBottom: 6,
};
