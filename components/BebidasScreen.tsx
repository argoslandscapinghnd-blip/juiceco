"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Lista de Bebidas (Admin)
// ─────────────────────────────────────────────
import { useEffect, useState } from "react";
import { Header } from "./ui/components";
import { colors, btnPrimary, cardStyle } from "./ui/styles";
import { supabase } from "@/supabase";

interface Producto {
  id:     number;
  nombre: string;
  emoji:  string;
  precio: number;
  activo: boolean;
}

interface Props {
  onNuevo:  () => void;
  onEditar: (p: Producto) => void;
  onBack:   () => void;
}

export default function BebidasScreen({ onNuevo, onEditar, onBack }: Props) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando,  setCargando]  = useState(true);

  const cargar = async () => {
    setCargando(true);
    const { data } = await supabase.from("productos").select("*").order("nombre");
    setProductos((data as Producto[]) ?? []);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const toggleActivo = async (p: Producto) => {
    await supabase.from("productos").update({ activo: !p.activo }).eq("id", p.id);
    cargar();
  };

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2 });

  return (
    <section>
      <Header titulo="Bebidas" onBack={onBack} />

      <button style={{ ...btnPrimary, marginBottom: 16 }} onClick={onNuevo}>
        + NUEVA BEBIDA
      </button>

      {cargando ? (
        <div style={{ textAlign: "center", color: colors.textMuted, padding: 40 }}>Cargando...</div>
      ) : productos.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", color: colors.textMuted, padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🍹</div>
          <p>No hay bebidas registradas</p>
        </div>
      ) : (
        productos.map((p) => (
          <div key={p.id} style={{ ...cardStyle, opacity: p.activo ? 1 : 0.55, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {/* Info */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                <span style={{ fontSize: 36 }}>{p.emoji}</span>
                <div>
                  <div style={{ fontWeight: "bold", fontSize: 15, color: colors.textPrimary }}>
                    {p.nombre}
                  </div>
                  <div style={{ fontSize: 14, color: colors.primary, fontWeight: "bold", marginTop: 2 }}>
                    L {fmt(p.precio)}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: "bold", padding: "2px 8px", borderRadius: 20, marginTop: 4, display: "inline-block",
                    background: p.activo ? colors.primaryLight : "#fdecea",
                    color: p.activo ? colors.primary : colors.danger,
                  }}>
                    {p.activo ? "Activa" : "Inactiva"}
                  </span>
                </div>
              </div>

              {/* Acciones */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginLeft: 12 }}>
                <button onClick={() => onEditar(p)} style={accionBtn("#e8f5e9", colors.primary)}>
                  ✏️ Editar
                </button>
                <button onClick={() => toggleActivo(p)} style={accionBtn(p.activo ? "#fdecea" : "#e8f5e9", p.activo ? colors.danger : colors.primary)}>
                  {p.activo ? "🚫 Inhabilitar" : "✅ Habilitar"}
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
