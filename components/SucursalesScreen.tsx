"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Lista de Sucursales (Admin)
// ─────────────────────────────────────────────
import { useEffect, useState } from "react";
import { Header } from "./ui/components";
import { colors, btnPrimary, cardStyle } from "./ui/styles";
import { Sucursal } from "./ui/types";
import { supabase } from "@/supabase";

interface Props {
  onNueva:  () => void;
  onEditar: (s: Sucursal) => void;
  onBack:   () => void;
}

export default function SucursalesScreen({ onNueva, onEditar, onBack }: Props) {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [cargando,   setCargando]   = useState(true);

  const cargar = async () => {
    setCargando(true);
    const { data } = await supabase.from("sucursales").select("*").order("codigo");
    setSucursales((data as Sucursal[]) ?? []);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const toggleActivo = async (s: Sucursal) => {
    await supabase.from("sucursales").update({ activo: !s.activo }).eq("id", s.id);
    cargar();
  };

  return (
    <section>
      <Header titulo="Sucursales" onBack={onBack} />

      <button style={{ ...btnPrimary, marginBottom: 16 }} onClick={onNueva}>
        + NUEVA SUCURSAL
      </button>

      {cargando ? (
        <div style={{ textAlign: "center", color: colors.textMuted, padding: 40 }}>Cargando...</div>
      ) : sucursales.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", color: colors.textMuted, padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
          <p>No hay sucursales registradas</p>
        </div>
      ) : (
        sucursales.map((s) => (
          <div key={s.id} style={{ ...cardStyle, opacity: s.activo ? 1 : 0.55, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 22 }}>🏪</span>
                  <span style={{ fontWeight: "bold", fontSize: 16 }}>{s.nombre}</span>
                </div>
                <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 2 }}>
                  📍 {s.ciudad}
                </div>
                <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 6 }}>
                  Código: {s.codigo}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{
                    fontSize: 12, fontWeight: "bold", padding: "3px 10px", borderRadius: 20,
                    background: s.activo ? colors.primaryLight : "#fdecea",
                    color: s.activo ? colors.primary : colors.danger,
                  }}>
                    {s.activo ? "Activa" : "Inactiva"}
                  </span>
                </div>
              </div>

              {/* Acciones */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginLeft: 12 }}>
                <button onClick={() => onEditar(s)} style={accionBtn("#e8f5e9", colors.primary)}>
                  ✏️ Editar
                </button>
                <button onClick={() => toggleActivo(s)} style={accionBtn(s.activo ? "#fdecea" : "#e8f5e9", s.activo ? colors.danger : colors.primary)}>
                  {s.activo ? "🚫 Inhabilitar" : "✅ Habilitar"}
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
