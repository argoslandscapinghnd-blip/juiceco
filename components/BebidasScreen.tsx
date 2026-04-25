"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Lista de Bebidas
// ─────────────────────────────────────────────
import { useEffect, useState } from "react";
import { Header } from "./ui/components";
import { colors, cardStyle, btnPrimary } from "./ui/styles";
import { Producto } from "./ui/types";
import { supabase } from "@/supabase";

interface Props {
  onNuevo: () => void;
  onEditar: (b: Producto) => void;
  onBack: () => void;
}

export default function BebidasScreen({ onNuevo, onEditar, onBack }: Props) {
  const [bebidas, setBebidas] = useState<Producto[]>([]);
  const [costos, setCostos] = useState<Record<number, number>>({});
  const [cargando, setCargando] = useState(true);
  const [verInhabilitadas, setVerInhabilitadas] = useState(false);

  useEffect(() => {
    cargar();
  }, [verInhabilitadas]);

  const cargar = async () => {
    setCargando(true);

    const { data: productos } = await supabase
      .from("productos")
      .select("*")
      .eq("activo", !verInhabilitadas)
      .order("nombre");

    const bebidasData = productos ?? [];
    setBebidas(bebidasData);

    const { data: recetas } = await supabase
      .from("recetas")
      .select("producto_id, costo_total");

    const mapaCostos: Record<number, number> = {};

    (recetas ?? []).forEach((r: any) => {
      const id = r.producto_id;
      const costo = Number(r.costo_total || 0);
      mapaCostos[id] = (mapaCostos[id] || 0) + costo;
    });

    setCostos(mapaCostos);
    setCargando(false);
  };

  const toggleActivo = async (b: Producto) => {
    await supabase
      .from("productos")
      .update({ activo: !b.activo })
      .eq("id", b.id);

    cargar();
  };

  const fmt = (n: number) =>
    Number(n || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <section>
      <Header titulo="Bebidas" onBack={onBack} />

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setVerInhabilitadas(false)}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: 10,
            border: "none",
            fontWeight: "bold",
            background: !verInhabilitadas ? colors.primary : "#eee",
            color: !verInhabilitadas ? "white" : "#555",
            cursor: "pointer",
          }}
        >
          Activas
        </button>

        <button
          onClick={() => setVerInhabilitadas(true)}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: 10,
            border: "none",
            fontWeight: "bold",
            background: verInhabilitadas ? colors.danger : "#eee",
            color: verInhabilitadas ? "white" : "#555",
            cursor: "pointer",
          }}
        >
          Inhabilitadas
        </button>
      </div>

      {!verInhabilitadas && (
        <button style={{ ...btnPrimary, marginBottom: 14 }} onClick={onNuevo}>
          + NUEVA BEBIDA
        </button>
      )}

      {cargando ? (
        <p style={{ textAlign: "center" }}>Cargando...</p>
      ) : bebidas.length === 0 ? (
        <p style={{ textAlign: "center", color: colors.textMuted }}>
          {verInhabilitadas ? "No hay bebidas inhabilitadas." : "No hay bebidas activas."}
        </p>
      ) : (
        bebidas.map((b) => {
          const costo = costos[b.id] || 0;
          const utilidad = Number(b.precio) - costo;

          return (
            <div key={b.id} style={{ ...cardStyle, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 78,
                    height: 96,
                    borderRadius: 12,
                    background: "#fff",
                    border: `1px solid ${colors.border}`,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {b.imagen_url ? (
                    <img
                      src={b.imagen_url}
                      alt={b.nombre}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        padding: 4,
                        display: "block",
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 34 }}>{b.emoji || "🍹"}</span>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "bold", fontSize: 15 }}>{b.nombre}</div>

                  <div style={{ color: colors.primary, fontWeight: "bold" }}>
                    L {fmt(b.precio)}
                  </div>

                  <div style={{ fontSize: 12, color: colors.textMuted }}>
                    Costo: L {fmt(costo)}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: utilidad >= 0 ? colors.primary : colors.danger,
                    }}
                  >
                    Utilidad: L {fmt(utilidad)}
                  </div>

                  <span
                    style={{
                      fontSize: 12,
                      padding: "2px 8px",
                      borderRadius: 10,
                      background: b.activo ? "#e8f5e9" : "#fdecea",
                      color: b.activo ? "#2e7d32" : "#c62828",
                      marginTop: 4,
                      display: "inline-block",
                    }}
                  >
                    {b.activo ? "Activa" : "Inhabilitada"}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {!verInhabilitadas && (
                    <button onClick={() => onEditar(b)} style={btnEditar}>
                      ✏️ Editar
                    </button>
                  )}

                  <button
                    onClick={() => toggleActivo(b)}
                    style={verInhabilitadas ? btnActivar : btnInhabilitar}
                  >
                    {verInhabilitadas ? "✔ Activar" : "🚫 Inhabilitar"}
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}

const btnEditar: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "none",
  background: "#e0f2f1",
  color: "#00695c",
  cursor: "pointer",
  fontSize: 12,
};

const btnInhabilitar: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "none",
  background: "#fdecea",
  color: "#c62828",
  cursor: "pointer",
  fontSize: 12,
};

const btnActivar: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "none",
  background: "#e8f5e9",
  color: "#2e7d32",
  cursor: "pointer",
  fontSize: 12,
};