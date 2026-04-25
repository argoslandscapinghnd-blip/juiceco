"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Pantalla 6: Carrito de Venta
// ─────────────────────────────────────────────
import { Header, Divider } from "./ui/components";
import { colors, btnPrimary, cardStyle } from "./ui/styles";
import { ItemCarrito } from "./ui/types";
import CajeroHeader from "./CajeroHeader";

interface Props {
  carrito:          ItemCarrito[];
  usuario:          string;
  sucursal:         string;
  onEliminarItem:   (nombre: string) => void;
  onVaciarCarrito:  () => void;
  onFinalizarVenta: () => void;
  onBack:           () => void;
  onVerTurno:       () => void;
  onCerrarSesion:   () => void;
}

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CarritoScreen({
  carrito, usuario, sucursal,
  onEliminarItem, onVaciarCarrito,
  onFinalizarVenta, onBack, onVerTurno, onCerrarSesion,
}: Props) {
  const total = carrito.reduce((s, i) => s + i.cantidad * i.precio, 0);

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
        <div style={{ flex: 1 }}>
          <Header titulo="Venta actual" onBack={onBack} />
        </div>
        {carrito.length > 0 && (
          <button onClick={onVaciarCarrito} style={{ background: "none", border: "none", color: colors.danger, cursor: "pointer", fontSize: 22 }}>🗑️</button>
        )}
      </div>

      {carrito.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", color: colors.textMuted, padding: 40 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🛒</div>
          <p style={{ marginBottom: 20 }}>El carrito está vacío</p>
          <button style={btnPrimary} onClick={onBack}>AGREGAR PRODUCTOS</button>
        </div>
      ) : (
        <div style={cardStyle}>
          {/* Encabezado tabla */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 44px 90px 28px", gap: 8, color: colors.textMuted, fontSize: 13, fontWeight: "bold", marginBottom: 8 }}>
            <span>Producto</span>
            <span style={{ textAlign: "center" }}>Cant.</span>
            <span style={{ textAlign: "right" }}>Total</span>
            <span />
          </div>
          <Divider />

          {/* Items */}
          {carrito.map((item) => (
            <div key={item.nombre} style={{ display: "grid", gridTemplateColumns: "1fr 44px 90px 28px", gap: 8, alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14 }}>{item.nombre}</span>
              <span style={{ textAlign: "center", fontSize: 14, fontWeight: "bold" }}>{item.cantidad}</span>
              <span style={{ textAlign: "right", fontSize: 14, fontWeight: "bold" }}>L {fmt(item.cantidad * item.precio)}</span>
              <button onClick={() => onEliminarItem(item.nombre)} style={{ background: "none", border: "none", color: colors.danger, cursor: "pointer", fontSize: 20, padding: 0 }}>×</button>
            </div>
          ))}

          <Divider />

          {/* Totales */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: colors.textMuted, marginBottom: 6 }}>
            <span>Subtotal</span>
            <span>L {fmt(total)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: colors.textMuted, marginBottom: 16 }}>
            <span>Descuento</span>
            <span>L 0.00</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: "bold", marginBottom: 20, color: colors.primary }}>
            <span style={{ fontSize: 16 }}>TOTAL</span>
            <span style={{ fontSize: 16 }}>L {fmt(total)}</span>
          </div>

          <button style={btnPrimary} onClick={onFinalizarVenta}>✅ FINALIZAR VENTA</button>
        </div>
      )}
    </section>
  );
}
