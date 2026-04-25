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
  const [cargando, setCargando] = useState(true);
  const [verInhabilitadas, setVerInhabilitadas] = useState(false);

  useEffect(() => {
    cargar();
  }, [verInhabilitadas]);

  const cargar = async () => {
    setCargando(true);

    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .eq("activo", !verInhabilitadas)
      .order("nombre");

    if (!error) setBebidas(data ?? []);

    setCargando(false);
  };

  const toggleActivo = async (b: Producto) => {
    const { error } = await supabase
      .from("productos")
      .update({ activo: !b.activo })
      .eq("id", b.id);

    if (!error) cargar();
  };

  return (
    <section>
      <Header titulo="Bebidas" onBack={onBack} />

      {/* Toggle */}
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

      {/* Nueva bebida */}
      {!verInhabilitadas && (
        <button style={{ ...btnPrimary, marginBottom: 14 }} onClick={onNuevo}>
          + NUEVA BEBIDA
        </button>
      )}

      {/* Lista */}
      {cargando ? (
        <p style={{ textAlign: "center" }}>Cargando...</p>
      ) : bebidas.length === 0 ? (
        <p style={{ textAlign: "center", color: colors.textMuted }}>
          {verInhabilitadas
            ? "No hay bebidas inhabilitadas."
            : "No hay bebidas activas."}
        </p>
      ) : (
        bebidas.map((b) => (
          <div key={b.id} style={{ ...cardStyle, marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              
              {/* Imagen */}
              <img
                src={b.imagen_url || ""}
                alt=""
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 10,
                  objectFit: "cover",
                  background: "#eee",
                }}
              />

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold", fontSize: 15 }}>
                  {b.nombre}
                </div>

                <div style={{ color: colors.primary, fontWeight: "bold" }}>
                  L {Number(b.precio).toFixed(2)}
                </div>

                <span
                  style={{
                    fontSize: 12,
                    padding: "2px 8px",
                    borderRadius: 10,
                    background: b.activo ? "#e8f5e9" : "#fdecea",
                    color: b.activo ? "#2e7d32" : "#c62828",
                  }}
                >
                  {b.activo ? "Activa" : "Inhabilitada"}
                </span>
              </div>

              {/* Acciones */}
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
        ))
      )}
    </section>
  );
}

// ─────────── estilos ───────────

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