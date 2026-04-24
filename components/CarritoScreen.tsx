"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Pantalla 6: Carrito de Venta
// ─────────────────────────────────────────────
import { Header, Divider } from "./ui/components";
import { colors, btnPrimary, cardStyle } from "./ui/styles";
import { ItemCarrito } from "./ui/types";

interface Props {
  carrito:          ItemCarrito[];
  onEliminarItem:   (nombre: string) => void;
  onVaciarCarrito:  () => void;
  onFinalizarVenta: () => void;
  onBack:           () => void;
}

export default function CarritoScreen({
  carrito,
  onEliminarItem,
  onVaciarCarrito,
  onFinalizarVenta,
  onBack,
}: Props) {
  const total = carrito.reduce((s, i) => s + i.cantidad * i.precio, 0);

  return (
    <section>
      {/* Header con botón vaciar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <Header titulo="Venta actual" onBack={onBack} />
        </div>
        {carrito.length > 0 && (
          <button
            onClick={onVaciarCarrito}
            style={{ background: "none", border: "none", color: colors.danger, cursor: "pointer", fontSize: 22 }}
            title="Vaciar carrito"
          >
            🗑️
          </button>
        )}
      </div>

      {/* Carrito vacío */}
      {carrito.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", color: colors.textMuted, padding: 40 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🛒</div>
          <p style={{ marginBottom: 20 }}>El carrito está vacío</p>
          <button style={btnPrimary} onClick={onBack}>AGREGAR PRODUCTOS</button>
        </div>
      ) : (
        <div style={cardStyle}>
          {/* Encabezado tabla */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 50px 90px 30px", gap: 8, color: colors.textMuted, fontSize: 13, fontWeight: "bold", marginBottom: 8 }}>
            <span>Producto</span>
            <span style={{ textAlign: "center" }}>Cant.</span>
            <span style={{ textAlign: "right" }}>Total</span>
            <span />
          </div>

          <Divider />

          {/* Items */}
          {carrito.map((item) => (
            <div
              key={item.nombre}
              style={{ display: "grid", gridTemplateColumns: "1fr 50px 90px 30px", gap: 8, alignItems: "center", marginBottom: 12 }}
            >
              <span style={{ fontSize: 14 }}>{item.nombre}</span>
              <span style={{ textAlign: "center", fontWeight: "bold" }}>{item.cantidad}</span>
              <span style={{ textAlign: "right", fontWeight: "bold" }}>
                L {(item.cantidad * item.precio).toFixed(2)}
              </span>
              <button
                onClick={() => onEliminarItem(item.nombre)}
                style={{ background: "none", border: "none", color: colors.danger, cursor: "pointer", fontSize: 20, padding: 0, lineHeight: 1 }}
              >
                ×
              </button>
            </div>
          ))}

          <Divider />

          {/* Totales */}
          <div style={{ display: "flex", justifyContent: "space-between", color: colors.textMuted, fontSize: 14, marginBottom: 4 }}>
            <span>Subtotal</span><span>L {total.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: colors.textMuted, fontSize: 14, marginBottom: 16 }}>
            <span>Descuento</span><span>L 0.00</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: 20, marginBottom: 20, color: colors.primary }}>
            <span>TOTAL</span>
            <span>L {total.toFixed(2)}</span>
          </div>

          <button style={btnPrimary} onClick={onFinalizarVenta}>
            ✅ FINALIZAR VENTA
          </button>
        </div>
      )}
    </section>
  );
}
