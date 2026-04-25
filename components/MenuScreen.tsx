"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Pantalla 4: Menú de Sabores
// ─────────────────────────────────────────────
import { Logo } from "./ui/components";
import { colors, btnAccent, productCardStyle } from "./ui/styles";
import { SABORES, ItemCarrito } from "./ui/types";
import CajeroHeader from "./CajeroHeader";

interface Props {
  carrito:            ItemCarrito[];
  usuario:            string;
  sucursal:           string;
  onSeleccionarSabor: (nombre: string) => void;
  onVerCarrito:       () => void;
  onVerTurno:         () => void;
  onCerrarSesion:     () => void;
}

export default function MenuScreen({
  carrito, usuario, sucursal,
  onSeleccionarSabor, onVerCarrito, onVerTurno, onCerrarSesion,
}: Props) {
  const unidades = carrito.reduce((s, i) => s + i.cantidad, 0);
  const total    = carrito.reduce((s, i) => s + i.cantidad * i.precio, 0);

  return (
    <section>
      <CajeroHeader
        usuario={usuario}
        sucursal={sucursal}
        tieneItems={carrito.length > 0}
        onVerTurno={onVerTurno}
        onCerrarSesion={onCerrarSesion}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Logo size="normal" />
        {unidades > 0 && (
          <div style={{ background: colors.primary, color: colors.white, borderRadius: 20, padding: "4px 14px", fontSize: 14, fontWeight: "bold" }}>
            🛒 {unidades}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        {SABORES.map((s) => (
          <button key={s.nombre} style={productCardStyle} onClick={() => onSeleccionarSabor(s.nombre)}>
            <span style={{ fontSize: 34 }}>{s.emoji}</span>
            <span style={{ fontSize: 13, fontWeight: "bold", textAlign: "center", color: colors.textPrimary }}>{s.nombre}</span>
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[{ emoji: "📦", label: "OTROS PRODUCTOS" }, { emoji: "💧", label: "AGUA" }].map((item) => (
          <button key={item.label} style={{ ...productCardStyle, opacity: 0.65 }}>
            <span style={{ fontSize: 30 }}>{item.emoji}</span>
            <span style={{ fontSize: 13, fontWeight: "bold", color: colors.textSecondary }}>{item.label}</span>
          </button>
        ))}
      </div>

      {unidades > 0 && (
        <button style={btnAccent} onClick={onVerCarrito}>
          <span>🛒 VER CARRITO ({unidades})</span>
          <span>L {total.toFixed(2)}</span>
        </button>
      )}
    </section>
  );
}
