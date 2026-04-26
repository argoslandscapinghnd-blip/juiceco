"use client";
import { useEffect, useState } from "react";
import { Header } from "./ui/components";
import { colors, btnPrimary, cardStyle } from "./ui/styles";
import { Sucursal } from "./ui/types";
import { supabase } from "@/supabase";

const PAGE_SIZE = 20;

interface Props {
  onNueva:  () => void;
  onEditar: (s: Sucursal) => void;
  onBack:   () => void;
}

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2 });

export default function SucursalesScreen({ onNueva, onEditar, onBack }: Props) {
  const [sucursales,       setSucursales]       = useState<Sucursal[]>([]);
  const [facturado,        setFacturado]        = useState<Record<number, { total: number; ventas: number }>>({});
  const [cargando,         setCargando]         = useState(true);
  const [error,            setError]            = useState("");
  const [verInhabilitadas, setVerInhabilitadas] = useState(false);
  const [pagina,           setPagina]           = useState(0);

  useEffect(() => { setPagina(0); cargar(); }, [verInhabilitadas]);

  const cargar = async () => {
    setCargando(true);
    setError("");

    const { data: suc, error: errSuc } = await supabase
      .from("sucursales")
      .select("*")
      .eq("activo", !verInhabilitadas)
      .order("codigo");

    if (errSuc) { setError("Error cargando sucursales: " + errSuc.message); setCargando(false); return; }

    const { data: ventas } = await supabase.from("ventas").select("sucursal_id, total");
    const mapa: Record<number, { total: number; ventas: number }> = {};
    (ventas ?? []).forEach((v: any) => {
      if (!mapa[v.sucursal_id]) mapa[v.sucursal_id] = { total: 0, ventas: 0 };
      mapa[v.sucursal_id].total  += Number(v.total);
      mapa[v.sucursal_id].ventas += 1;
    });

    setSucursales((suc as Sucursal[]) ?? []);
    setFacturado(mapa);
    setCargando(false);
  };

  const toggleActivo = async (s: Sucursal) => {
    setError("");
    const { error: err } = await supabase.from("sucursales").update({ activo: !s.activo }).eq("id", s.id);
    if (err) { setError("Error actualizando sucursal: " + err.message); return; }
    cargar();
  };

  const totalPaginas = Math.ceil(sucursales.length / PAGE_SIZE);
  const paginadas    = sucursales.slice(pagina * PAGE_SIZE, (pagina + 1) * PAGE_SIZE);

  return (
    <section>
      <Header titulo="Sucursales" onBack={onBack} />

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setVerInhabilitadas(false)} style={{
          flex: 1, padding: "10px", borderRadius: 10, border: "none", fontWeight: "bold", cursor: "pointer",
          background: !verInhabilitadas ? colors.primary : "#eee", color: !verInhabilitadas ? "white" : "#555",
        }}>Activas</button>
        <button onClick={() => setVerInhabilitadas(true)} style={{
          flex: 1, padding: "10px", borderRadius: 10, border: "none", fontWeight: "bold", cursor: "pointer",
          background: verInhabilitadas ? colors.danger : "#eee", color: verInhabilitadas ? "white" : "#555",
        }}>Inhabilitadas</button>
      </div>

      {!verInhabilitadas && (
        <button style={{ ...btnPrimary, marginBottom: 14 }} onClick={onNueva}>
          + NUEVA SUCURSAL
        </button>
      )}

      {error && (
        <div style={{ background: "#fdecea", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: colors.danger }}>
          ⚠️ {error}
        </div>
      )}

      {cargando ? (
        <div style={{ textAlign: "center", color: colors.textMuted, padding: 40 }}>Cargando...</div>
      ) : sucursales.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", color: colors.textMuted, padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
          <p>{verInhabilitadas ? "No hay sucursales inhabilitadas." : "No hay sucursales activas."}</p>
        </div>
      ) : (
        <>
          {paginadas.map((s) => {
            const stats = facturado[s.id] ?? { total: 0, ventas: 0 };
            return (
              <div key={s.id} style={{ ...cardStyle, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 22 }}>🏪</span>
                      <span style={{ fontWeight: "bold", fontSize: 16 }}>{s.nombre}</span>
                    </div>
                    <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 2 }}>📍 {s.ciudad}</div>
                    <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 8 }}>Código: {s.codigo}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                      <div style={{ background: colors.primaryLight, borderRadius: 8, padding: "6px 12px", fontSize: 12 }}>
                        <span style={{ color: colors.textMuted }}>Facturado </span>
                        <span style={{ fontWeight: "bold", color: colors.primary }}>L {fmt(stats.total)}</span>
                      </div>
                      <div style={{ background: "#f5f5f5", borderRadius: 8, padding: "6px 12px", fontSize: 12 }}>
                        <span style={{ color: colors.textMuted }}>Ventas </span>
                        <span style={{ fontWeight: "bold", color: colors.textPrimary }}>{stats.ventas}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: "bold", padding: "3px 10px", borderRadius: 20, background: s.activo ? colors.primaryLight : "#fdecea", color: s.activo ? colors.primary : colors.danger }}>
                      {s.activo ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginLeft: 12 }}>
                    {!verInhabilitadas && (
                      <button onClick={() => onEditar(s)} style={accionBtn("#e8f5e9", colors.primary)}>✏️ Editar</button>
                    )}
                    <button onClick={() => toggleActivo(s)} style={accionBtn(verInhabilitadas ? "#e8f5e9" : "#fdecea", verInhabilitadas ? colors.primary : colors.danger)}>
                      {verInhabilitadas ? "✔ Activar" : "🚫 Inhabilitar"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

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
  padding: "6px 14px", borderRadius: 8, border: "1px solid #ddd", background: "white", cursor: "pointer", fontWeight: "bold",
};
