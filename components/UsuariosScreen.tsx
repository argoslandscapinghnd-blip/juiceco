"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Lista de Usuarios (con Supabase)
// ─────────────────────────────────────────────
import { useEffect, useState } from "react";
import { Header } from "./ui/components";
import { colors, btnPrimary, cardStyle } from "./ui/styles";
import { Usuario } from "./ui/types";
import { supabase } from "@/supabase";

interface Props {
  onNuevo:  () => void;
  onEditar: (u: Usuario) => void;
  onBack:   () => void;
}

export default function UsuariosScreen({ onNuevo, onEditar, onBack }: Props) {
  const [usuarios,  setUsuarios]  = useState<Usuario[]>([]);
  const [cargando,  setCargando]  = useState(true);

  const cargarUsuarios = async () => {
    setCargando(true);
    const { data } = await supabase.from("usuarios").select("*").order("nombre");
    setUsuarios((data as Usuario[]) ?? []);
    setCargando(false);
  };

  useEffect(() => { cargarUsuarios(); }, []);

  const toggleActivo = async (u: Usuario) => {
    await supabase.from("usuarios").update({ activo: !u.activo }).eq("id", u.id);
    cargarUsuarios();
  };

  return (
    <section>
      <Header titulo="Usuarios" onBack={onBack} />

      <button style={{ ...btnPrimary, marginBottom: 16 }} onClick={onNuevo}>
        + NUEVO USUARIO
      </button>

      {cargando ? (
        <div style={{ textAlign: "center", color: colors.textMuted, padding: 40 }}>Cargando...</div>
      ) : usuarios.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", color: colors.textMuted, padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
          <p>No hay usuarios registrados</p>
        </div>
      ) : (
        usuarios.map((u) => (
          <div key={u.id} style={{ ...cardStyle, opacity: u.activo ? 1 : 0.55, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 22 }}>{u.rol === "administrador" ? "🛡️" : "👤"}</span>
                  <span style={{ fontWeight: "bold", fontSize: 16 }}>{u.nombre}</span>
                </div>
                <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 2 }}>@{u.usuario}</div>
                {u.telefono && <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 4 }}>📞 {u.telefono}</div>}
                <div style={{ marginTop: 4, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, fontWeight: "bold", padding: "3px 10px", borderRadius: 20, background: u.rol === "administrador" ? "#e3f2fd" : colors.primaryLight, color: u.rol === "administrador" ? "#1565c0" : colors.primary }}>
                    {u.rol === "administrador" ? "Administrador" : "Cajero"}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: "bold", padding: "3px 10px", borderRadius: 20, background: u.activo ? colors.primaryLight : "#fdecea", color: u.activo ? colors.primary : colors.danger }}>
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginLeft: 12 }}>
                <button onClick={() => onEditar(u)} style={accionBtn("#e8f5e9", colors.primary)}>✏️ Editar</button>
                <button onClick={() => toggleActivo(u)} style={accionBtn(u.activo ? "#fdecea" : "#e8f5e9", u.activo ? colors.danger : colors.primary)}>
                  {u.activo ? "🚫 Inhabilitar" : "✅ Habilitar"}
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </section>
  );
}

const accionBtn = (bg: string, color: string): React.CSSProperties => ({
  padding: "6px 12px", borderRadius: 8, border: "none", background: bg,
  color, fontWeight: "bold", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap",
});
