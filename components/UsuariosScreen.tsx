"use client";
import { useEffect, useState } from "react";
import { Header } from "./ui/components";
import { colors, btnPrimary, cardStyle } from "./ui/styles";
import { Usuario } from "./ui/types";
import { supabase } from "@/supabase";

const PAGE_SIZE = 20;

interface Props {
  onNuevo:  () => void;
  onEditar: (u: Usuario) => void;
  onBack:   () => void;
}

export default function UsuariosScreen({ onNuevo, onEditar, onBack }: Props) {
  const [usuarios,          setUsuarios]          = useState<Usuario[]>([]);
  const [cargando,          setCargando]          = useState(true);
  const [error,             setError]             = useState("");
  const [verInhabilitados,  setVerInhabilitados]  = useState(false);
  const [pagina,            setPagina]            = useState(0);

  useEffect(() => { setPagina(0); cargar(); }, [verInhabilitados]);

  const cargar = async () => {
    setCargando(true);
    setError("");
    const { data, error: err } = await supabase
      .from("usuarios")
      .select("*")
      .eq("activo", !verInhabilitados)
      .order("nombre");
    if (err) { setError("Error cargando usuarios: " + err.message); setCargando(false); return; }
    setUsuarios((data as Usuario[]) ?? []);
    setCargando(false);
  };

  const toggleActivo = async (u: Usuario) => {
    setError("");
    const { error: err } = await supabase.from("usuarios").update({ activo: !u.activo }).eq("id", u.id);
    if (err) { setError("Error actualizando usuario: " + err.message); return; }
    cargar();
  };

  const totalPaginas = Math.ceil(usuarios.length / PAGE_SIZE);
  const paginados    = usuarios.slice(pagina * PAGE_SIZE, (pagina + 1) * PAGE_SIZE);

  return (
    <section>
      <Header titulo="Usuarios" onBack={onBack} />

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setVerInhabilitados(false)} style={{
          flex: 1, padding: "10px", borderRadius: 10, border: "none", fontWeight: "bold", cursor: "pointer",
          background: !verInhabilitados ? colors.primary : "#eee",
          color: !verInhabilitados ? "white" : "#555",
        }}>
          Activos
        </button>
        <button onClick={() => setVerInhabilitados(true)} style={{
          flex: 1, padding: "10px", borderRadius: 10, border: "none", fontWeight: "bold", cursor: "pointer",
          background: verInhabilitados ? colors.danger : "#eee",
          color: verInhabilitados ? "white" : "#555",
        }}>
          Inhabilitados
        </button>
      </div>

      {!verInhabilitados && (
        <button style={{ ...btnPrimary, marginBottom: 14 }} onClick={onNuevo}>
          + NUEVO USUARIO
        </button>
      )}

      {error && (
        <div style={{ background: "#fdecea", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: colors.danger }}>
          ⚠️ {error}
        </div>
      )}

      {cargando ? (
        <div style={{ textAlign: "center", color: colors.textMuted, padding: 40 }}>Cargando...</div>
      ) : usuarios.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", color: colors.textMuted, padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
          <p>{verInhabilitados ? "No hay usuarios inhabilitados." : "No hay usuarios activos."}</p>
        </div>
      ) : (
        <>
          {paginados.map((u) => (
            <div key={u.id} style={{ ...cardStyle, marginBottom: 10 }}>
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
                  {!verInhabilitados && (
                    <button onClick={() => onEditar(u)} style={accionBtn("#e8f5e9", colors.primary)}>
                      ✏️ Editar
                    </button>
                  )}
                  <button onClick={() => toggleActivo(u)} style={accionBtn(verInhabilitados ? "#e8f5e9" : "#fdecea", verInhabilitados ? colors.primary : colors.danger)}>
                    {verInhabilitados ? "✔ Activar" : "🚫 Inhabilitar"}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {totalPaginas > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", fontSize: 13, color: colors.textMuted }}>
              <button onClick={() => setPagina(p => Math.max(0, p - 1))} disabled={pagina === 0}
                style={{ ...paginaBtn, opacity: pagina === 0 ? 0.4 : 1 }}>← Anterior</button>
              <span>{pagina + 1} / {totalPaginas}</span>
              <button onClick={() => setPagina(p => Math.min(totalPaginas - 1, p + 1))} disabled={pagina >= totalPaginas - 1}
                style={{ ...paginaBtn, opacity: pagina >= totalPaginas - 1 ? 0.4 : 1 }}>Siguiente →</button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

const accionBtn = (bg: string, color: string): React.CSSProperties => ({
  padding: "6px 12px", borderRadius: 8, border: "none", background: bg,
  color, fontWeight: "bold", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap",
});

const paginaBtn: React.CSSProperties = {
  padding: "6px 14px", borderRadius: 8, border: `1px solid #ddd`,
  background: "white", cursor: "pointer", fontWeight: "bold",
};
