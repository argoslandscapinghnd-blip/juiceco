"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Lista de Insumos/Empaque (Admin)
// ─────────────────────────────────────────────
import { useEffect, useState } from "react";
import { Header } from "./ui/components";
import { colors, btnPrimary, cardStyle } from "./ui/styles";
import { supabase } from "@/supabase";

interface Insumo {
  id: number;
  nombre: string;
  unidad: string;
  tipo: "ingrediente" | "empaque";
  costo_unitario: number;
  activo: boolean;
}

interface Props {
  onNuevo: () => void;
  onEditar: (i: Insumo) => void;
  onBack: () => void;
}

export default function InsumosScreen({ onNuevo, onEditar, onBack }: Props) {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<"todos" | "ingrediente" | "empaque">("todos");
  const [verInhabilitados, setVerInhabilitados] = useState(false);

  useEffect(() => {
    cargar();
  }, [verInhabilitados]);

  const cargar = async () => {
    setCargando(true);

    const { data } = await supabase
      .from("insumos_maestro")
      .select("*")
      .eq("activo", !verInhabilitados)
      .order("tipo")
      .order("nombre");

    setInsumos((data as Insumo[]) ?? []);
    setCargando(false);
  };

  const toggleActivo = async (i: Insumo) => {
    await supabase
      .from("insumos_maestro")
      .update({ activo: !i.activo })
      .eq("id", i.id);

    cargar();
  };

  const fmt = (n: number) => {
    const valor = Number(n || 0);

    if (valor > 0 && valor < 0.01) {
      return valor.toFixed(6);
    }

    return valor.toFixed(2);
  };

  const filtrados = insumos.filter((i) => filtro === "todos" || i.tipo === filtro);

  return (
    <section>
      <Header titulo="Insumos y Empaque" onBack={onBack} />

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setVerInhabilitados(false)}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: 10,
            border: "none",
            fontWeight: "bold",
            background: !verInhabilitados ? colors.primary : "#eee",
            color: !verInhabilitados ? "white" : "#555",
            cursor: "pointer",
          }}
        >
          Activos
        </button>

        <button
          onClick={() => setVerInhabilitados(true)}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: 10,
            border: "none",
            fontWeight: "bold",
            background: verInhabilitados ? colors.danger : "#eee",
            color: verInhabilitados ? "white" : "#555",
            cursor: "pointer",
          }}
        >
          Inhabilitados
        </button>
      </div>

      {!verInhabilitados && (
        <button style={{ ...btnPrimary, marginBottom: 16 }} onClick={onNuevo}>
          + NUEVO INSUMO
        </button>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["todos", "ingrediente", "empaque"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            style={{
              padding: "6px 16px",
              borderRadius: 20,
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 12,
              background: filtro === f ? colors.primary : "#e8e8e8",
              color: filtro === f ? "white" : colors.textSecondary,
            }}
          >
            {f === "todos" ? "Todos" : f === "ingrediente" ? "🧪 Ingredientes" : "📦 Empaque"}
          </button>
        ))}
      </div>

      {cargando ? (
        <div style={{ textAlign: "center", color: colors.textMuted, padding: 40 }}>
          Cargando...
        </div>
      ) : filtrados.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", color: colors.textMuted, padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <p>
            {verInhabilitados
              ? "No hay insumos inhabilitados."
              : "No hay insumos activos registrados."}
          </p>
        </div>
      ) : (
        filtrados.map((ins) => (
          <div key={ins.id} style={{ ...cardStyle, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 20 }}>
                    {ins.tipo === "ingrediente" ? "🧪" : "📦"}
                  </span>

                  <span style={{ fontWeight: "bold", fontSize: 15, color: colors.textPrimary }}>
                    {ins.nombre}
                  </span>
                </div>

                <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 4 }}>
                  Unidad: <strong>{ins.unidad}</strong> · Costo:{" "}
                  <strong style={{ color: colors.primary }}>
                    L {fmt(ins.costo_unitario)}
                  </strong>
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: "bold",
                      padding: "3px 10px",
                      borderRadius: 20,
                      background: ins.tipo === "ingrediente" ? "#e3f2fd" : "#fff3e0",
                      color: ins.tipo === "ingrediente" ? "#1565c0" : "#e65100",
                    }}
                  >
                    {ins.tipo === "ingrediente" ? "Ingrediente" : "Empaque"}
                  </span>

                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: "bold",
                      padding: "3px 10px",
                      borderRadius: 20,
                      background: ins.activo ? colors.primaryLight : "#fdecea",
                      color: ins.activo ? colors.primary : colors.danger,
                    }}
                  >
                    {ins.activo ? "Activo" : "Inhabilitado"}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginLeft: 12 }}>
                {!verInhabilitados && (
                  <button onClick={() => onEditar(ins)} style={btnEditar}>
                    ✏️ Editar
                  </button>
                )}

                <button
                  onClick={() => toggleActivo(ins)}
                  style={verInhabilitados ? btnActivar : btnInhabilitar}
                >
                  {verInhabilitados ? "✅ Activar" : "🚫 Inhabilitar"}
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </section>
  );
}

const btnEditar: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 8,
  border: "none",
  background: "#e8f5e9",
  color: "#2e7d32",
  fontWeight: "bold",
  fontSize: 12,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const btnInhabilitar: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 8,
  border: "none",
  background: "#fdecea",
  color: "#c62828",
  fontWeight: "bold",
  fontSize: 12,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const btnActivar: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 8,
  border: "none",
  background: "#e8f5e9",
  color: "#2e7d32",
  fontWeight: "bold",
  fontSize: 12,
  cursor: "pointer",
  whiteSpace: "nowrap",
};