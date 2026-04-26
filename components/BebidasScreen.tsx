"use client";
import { useEffect, useState } from "react";
import { Header } from "./ui/components";
import { colors, cardStyle, btnPrimary } from "./ui/styles";
import { Producto } from "./ui/types";
import { supabase } from "@/supabase";

const PAGE_SIZE = 20;

interface Props {
  onNuevo:  () => void;
  onEditar: (b: Producto) => void;
  onBack:   () => void;
}

export default function BebidasScreen({ onNuevo, onEditar, onBack }: Props) {
  const [bebidas,          setBebidas]          = useState<Producto[]>([]);
  const [costos,           setCostos]           = useState<Record<number, number>>({});
  const [cargando,         setCargando]         = useState(true);
  const [error,            setError]            = useState("");
  const [verInhabilitadas, setVerInhabilitadas] = useState(false);
  const [pagina,           setPagina]           = useState(0);

  useEffect(() => { setPagina(0); cargar(); }, [verInhabilitadas]);

  const cargar = async () => {
    setCargando(true);
    setError("");

    const { data: productos, error: errProd } = await supabase
      .from("productos")
      .select("*")
      .eq("activo", !verInhabilitadas)
      .order("nombre");

    if (errProd) { setError("Error cargando bebidas: " + errProd.message); setCargando(false); return; }

    setBebidas(productos ?? []);

    const { data: recetas } = await supabase.from("recetas").select("producto_id, costo_total");
    const mapaCostos: Record<number, number> = {};
    (recetas ?? []).forEach((r: any) => {
      mapaCostos[r.producto_id] = (mapaCostos[r.producto_id] || 0) + Number(r.costo_total || 0);
    });
    setCostos(mapaCostos);
    setCargando(false);
  };

  const toggleActivo = async (b: Producto) => {
    setError("");
    const { error: err } = await supabase.from("productos").update({ activo: !b.activo }).eq("id", b.id);
    if (err) { setError("Error actualizando bebida: " + err.message); return; }
    cargar();
  };

  const fmt = (n: number) => Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const totalPaginas = Math.ceil(bebidas.length / PAGE_SIZE);
  const paginadas    = bebidas.slice(pagina * PAGE_SIZE, (pagina + 1) * PAGE_SIZE);

  return (
    <section>
      <Header titulo="Bebidas" onBack={onBack} />

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setVerInhabilitadas(false)} style={{
          flex: 1, padding: "10px", borderRadius: 10, border: "none", fontWeight: "bold", cursor: "pointer",
          background: !verInhabilitadas ? colors.primary : "#eee",
          color: !verInhabilitadas ? "white" : "#555",
        }}>Activas</button>
        <button onClick={() => setVerInhabilitadas(true)} style={{
          flex: 1, padding: "10px", borderRadius: 10, border: "none", fontWeight: "bold", cursor: "pointer",
          background: verInhabilitadas ? colors.danger : "#eee",
          color: verInhabilitadas ? "white" : "#555",
        }}>Inhabilitadas</button>
      </div>

      {!verInhabilitadas && (
        <button style={{ ...btnPrimary, marginBottom: 14 }} onClick={onNuevo}>
          + NUEVA BEBIDA
        </button>
      )}

      {error && (
        <div style={{ background: "#fdecea", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: colors.danger }}>
          ⚠️ {error}
        </div>
      )}

      {cargando ? (
        <p style={{ textAlign: "center" }}>Cargando...</p>
      ) : bebidas.length === 0 ? (
        <p style={{ textAlign: "center", color: colors.textMuted }}>
          {verInhabilitadas ? "No hay bebidas inhabilitadas." : "No hay bebidas activas."}
        </p>
      ) : (
        <>
          {paginadas.map((b) => {
            const costo    = costos[b.id] || 0;
            const utilidad = Number(b.precio) - costo;
            return (
              <div key={b.id} style={{ ...cardStyle, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 78, height: 96, borderRadius: 12, background: "#fff",
                    border: `1px solid ${colors.border}`, overflow: "hidden",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {b.imagen_url ? (
                      <img src={b.imagen_url} alt={b.nombre}
                        style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4, display: "block" }} />
                    ) : (
                      <span style={{ fontSize: 34 }}>{b.emoji || "🍹"}</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", fontSize: 15 }}>{b.nombre}</div>
                    <div style={{ color: colors.primary, fontWeight: "bold" }}>L {fmt(b.precio)}</div>
                    <div style={{ fontSize: 12, color: colors.textMuted }}>Costo: L {fmt(costo)}</div>
                    <div style={{ fontSize: 12, color: utilidad >= 0 ? colors.primary : colors.danger }}>
                      Utilidad: L {fmt(utilidad)}
                    </div>
                    <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 10, marginTop: 4, display: "inline-block",
                      background: b.activo ? "#e8f5e9" : "#fdecea", color: b.activo ? "#2e7d32" : "#c62828" }}>
                      {b.activo ? "Activa" : "Inhabilitada"}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {!verInhabilitadas && (
                      <button onClick={() => onEditar(b)} style={btnEditar}>✏️ Editar</button>
                    )}
                    <button onClick={() => toggleActivo(b)} style={verInhabilitadas ? btnActivar : btnInhabilitar}>
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

const btnEditar:     React.CSSProperties = { padding: "6px 10px", borderRadius: 8, border: "none", background: "#e0f2f1", color: "#00695c", cursor: "pointer", fontSize: 12 };
const btnInhabilitar: React.CSSProperties = { padding: "6px 10px", borderRadius: 8, border: "none", background: "#fdecea", color: "#c62828", cursor: "pointer", fontSize: 12 };
const btnActivar:    React.CSSProperties = { padding: "6px 10px", borderRadius: 8, border: "none", background: "#e8f5e9", color: "#2e7d32", cursor: "pointer", fontSize: 12 };
const paginaBtn:     React.CSSProperties = { padding: "6px 14px", borderRadius: 8, border: "1px solid #ddd", background: "white", cursor: "pointer", fontWeight: "bold" };
