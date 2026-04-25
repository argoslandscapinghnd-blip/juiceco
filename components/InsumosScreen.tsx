"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Lista de Insumos/Empaque (Admin)
// ─────────────────────────────────────────────
import { useEffect, useState } from "react";
import { Header } from "./ui/components";
import { colors, btnPrimary, cardStyle } from "./ui/styles";
import { supabase } from "@/supabase";

interface Insumo {
  id:                    number;
  nombre:                string;
  unidad:                string;
  tipo:                  "ingrediente" | "empaque";
  costo_unitario:        number;
  activo:                boolean;
  costo_actualizado_en?: string;
}

interface Props {
  onNuevo:  () => void;
  onEditar: (i: Insumo) => void;
  onBack:   () => void;
}

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2 });

const tiempoDesde = (fecha?: string): string => {
  if (!fecha) return "Sin registro";
  const diff = Date.now() - new Date(fecha).getTime();
  const mins  = Math.floor(diff / 60000);
  const hrs   = Math.floor(mins / 60);
  const dias  = Math.floor(hrs / 24);
  const meses = Math.floor(dias / 30);
  if (meses >= 1)  return `Hace ${meses} mes${meses > 1 ? "es" : ""}`;
  if (dias >= 1)   return `Hace ${dias} día${dias > 1 ? "s" : ""}`;
  if (hrs >= 1)    return `Hace ${hrs} hora${hrs > 1 ? "s" : ""}`;
  if (mins >= 1)   return `Hace ${mins} min`;
  return "Hace un momento";
};

export default function InsumosScreen({ onNuevo, onEditar, onBack }: Props) {
  const [insumos,          setInsumos]          = useState<Insumo[]>([]);
  const [cargando,         setCargando]         = useState(true);
  const [filtro,           setFiltro]           = useState<"todos" | "ingrediente" | "empaque">("todos");
  const [verInhabilitados, setVerInhabilitados] = useState(false);

  useEffect(() => { cargar(); }, [verInhabilitados]);

  const cargar = async () => {
    setCargando(true);
    const { data } = await supabase
      .from("insumos_maestro")
      .select("*")
      .eq("activo", !verInhabilitados)
      .order("tipo").order("nombre");
    setInsumos((data as Insumo[]) ?? []);
    setCargando(false);
  };

  const toggleActivo = async (i: Insumo) => {
    await supabase.from("insumos_maestro").update({ activo: !i.activo }).eq("id", i.id);
    cargar();
  };

  const filtrados = insumos.filter(i => filtro === "todos" || i.tipo === filtro);

  return (
    <section>
      <Header titulo="Insumos y Empaque" onBack={onBack} />

      {/* Tabs activos/inhabilitados */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setVerInhabilitados(false)} style={{
          flex: 1, padding: "10px", borderRadius: 10, border: "none", fontWeight: "bold", cursor: "pointer",
          background: !verInhabilitados ? colors.primary : "#eee",
          color: !verInhabilitados ? "white" : "#555",
        }}>Activos</button>
        <button onClick={() => setVerInhabilitados(true)} style={{
          flex: 1, padding: "10px", borderRadius: 10, border: "none", fontWeight: "bold", cursor: "pointer",
          background: verInhabilitados ? colors.danger : "#eee",
          color: verInhabilitados ? "white" : "#555",
        }}>Inhabilitados</button>
      </div>

      {!verInhabilitados && (
        <button style={{ ...btnPrimary, marginBottom: 12 }} onClick={onNuevo}>
          + NUEVO INSUMO
        </button>
      )}

      {/* Filtro tipo */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["todos", "ingrediente", "empaque"] as const).map((f) => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
            fontWeight: "bold", fontSize: 12,
            background: filtro === f ? colors.primary : "#e8e8e8",
            color: filtro === f ? "white" : colors.textSecondary,
          }}>
            {f === "todos" ? "Todos" : f === "ingrediente" ? "🧪 Ingredientes" : "📦 Empaque"}
          </button>
        ))}
      </div>

      {cargando ? (
        <div style={{ textAlign: "center", color: colors.textMuted, padding: 40 }}>Cargando...</div>
      ) : filtrados.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", color: colors.textMuted, padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <p>{verInhabilitados ? "No hay insumos inhabilitados." : "No hay insumos registrados."}</p>
        </div>
      ) : (
        filtrados.map((ins) => (
          <div key={ins.id} style={{ ...cardStyle, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 20 }}>{ins.tipo === "ingrediente" ? "🧪" : "📦"}</span>
                  <span style={{ fontWeight: "bold", fontSize: 15, color: colors.textPrimary }}>{ins.nombre}</span>
                </div>

                <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 2 }}>
                  Unidad: <strong>{ins.unidad}</strong> · Costo: <strong style={{ color: colors.primary }}>L {fmt(ins.costo_unitario)}</strong>
                </div>

                {/* Última actualización de costo */}
                <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 6, fontStyle: "italic" }}>
                  🕐 Costo actualizado: {tiempoDesde(ins.costo_actualizado_en)}
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: "bold", padding: "3px 10px", borderRadius: 20, background: ins.tipo === "ingrediente" ? "#e3f2fd" : "#fff3e0", color: ins.tipo === "ingrediente" ? "#1565c0" : "#e65100" }}>
                    {ins.tipo === "ingrediente" ? "Ingrediente" : "Empaque"}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: "bold", padding: "3px 10px", borderRadius: 20, background: ins.activo ? colors.primaryLight : "#fdecea", color: ins.activo ? colors.primary : colors.danger }}>
                    {ins.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginLeft: 12 }}>
                {!verInhabilitados && (
                  <button onClick={() => onEditar(ins)} style={accionBtn("#e8f5e9", colors.primary)}>✏️ Editar</button>
                )}
                <button onClick={() => toggleActivo(ins)} style={accionBtn(verInhabilitados ? "#e8f5e9" : "#fdecea", verInhabilitados ? colors.primary : colors.danger)}>
                  {verInhabilitados ? "✔ Activar" : "🚫 Inhabilitar"}
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
