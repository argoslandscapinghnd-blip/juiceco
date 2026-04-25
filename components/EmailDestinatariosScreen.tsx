"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Maestro de Destinatarios de Email
// ─────────────────────────────────────────────
import { useEffect, useState } from "react";
import { Header } from "./ui/components";
import { colors, cardStyle, btnPrimary, inputStyle } from "./ui/styles";
import { supabase } from "@/supabase";

interface Destinatario { id: number; nombre: string; email: string; activo: boolean; }
interface Props { onBack: () => void; }

export default function EmailDestinatariosScreen({ onBack }: Props) {
  const [lista,    setLista]    = useState<Destinatario[]>([]);
  const [nombre,   setNombre]   = useState("");
  const [email,    setEmail]    = useState("");
  const [error,    setError]    = useState("");
  const [cargando, setCargando] = useState(false);

  const cargar = async () => {
    const { data } = await supabase.from("email_destinatarios").select("*").order("nombre");
    setLista((data as Destinatario[]) ?? []);
  };

  useEffect(() => { cargar(); }, []);

  const handleAgregar = async () => {
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return; }
    if (!email.trim() || !email.includes("@")) { setError("Ingresa un email válido."); return; }
    setCargando(true); setError("");
    const { error: err } = await supabase.from("email_destinatarios").insert({ nombre, email, activo: true });
    if (err) { setError(err.message.includes("unique") ? "Ese email ya existe." : err.message); setCargando(false); return; }
    setNombre(""); setEmail("");
    setCargando(false);
    cargar();
  };

  const toggleActivo = async (d: Destinatario) => {
    await supabase.from("email_destinatarios").update({ activo: !d.activo }).eq("id", d.id);
    cargar();
  };

  const eliminar = async (id: number) => {
    await supabase.from("email_destinatarios").delete().eq("id", id);
    cargar();
  };

  return (
    <section>
      <Header titulo="Destinatarios de Email" onBack={onBack} />

      {/* Formulario agregar */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>+ Agregar destinatario</h3>
        <label style={labelStyle}>Nombre</label>
        <input placeholder="Ej: Carlos Chavez" value={nombre} onChange={e => setNombre(e.target.value)} style={inputStyle} />
        <label style={labelStyle}>Email</label>
        <input placeholder="correo@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} type="email" style={inputStyle} />
        {error && <p style={{ color: colors.danger, fontSize: 13, marginBottom: 8 }}>⚠️ {error}</p>}
        <button style={{ ...btnPrimary, opacity: cargando ? 0.7 : 1 }} onClick={handleAgregar} disabled={cargando}>
          {cargando ? "Guardando..." : "AGREGAR"}
        </button>
      </div>

      {/* Lista */}
      <div style={{ fontSize: 12, fontWeight: "bold", color: colors.textMuted, marginBottom: 8, letterSpacing: 1 }}>
        DESTINATARIOS CONFIGURADOS
      </div>

      {lista.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", color: colors.textMuted, padding: 30 }}>
          <p>No hay destinatarios aún.</p>
          <p style={{ fontSize: 12 }}>Los reportes se enviarán a las personas que agregues aquí.</p>
        </div>
      ) : (
        lista.map(d => (
          <div key={d.id} style={{ ...cardStyle, marginBottom: 10, opacity: d.activo ? 1 : 0.55 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: "bold", fontSize: 14 }}>📧 {d.nombre}</div>
                <div style={{ fontSize: 13, color: colors.textMuted }}>{d.email}</div>
                <span style={{ fontSize: 11, fontWeight: "bold", padding: "2px 8px", borderRadius: 20, marginTop: 4, display: "inline-block", background: d.activo ? colors.primaryLight : "#fdecea", color: d.activo ? colors.primary : colors.danger }}>
                  {d.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <button onClick={() => toggleActivo(d)} style={accionBtn(d.activo ? "#fdecea" : "#e8f5e9", d.activo ? colors.danger : colors.primary)}>
                  {d.activo ? "🚫 Pausar" : "✅ Activar"}
                </button>
                <button onClick={() => eliminar(d.id)} style={accionBtn("#fdecea", colors.danger)}>
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      {lista.filter(d => d.activo).length > 0 && (
        <div style={{ background: "#e3f2fd", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#1565c0" }}>
          📬 {lista.filter(d => d.activo).length} destinatario(s) activo(s) recibirán los reportes.
        </div>
      )}
    </section>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: "bold", color: "#555", marginBottom: 6 };
const accionBtn = (bg: string, color: string): React.CSSProperties => ({
  padding: "6px 12px", borderRadius: 8, border: "none", background: bg,
  color, fontWeight: "bold", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap",
});
