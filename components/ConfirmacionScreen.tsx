"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Pantalla 10: Confirmación de Venta
// ─────────────────────────────────────────────
import { colors, btnPrimary, btnSecondary, cardStyle } from "./ui/styles";
import { MetodoPago } from "./ui/types";

interface Props {
  total:          number;
  metodo:         MetodoPago;
  montoRecibido?: number;
  onNuevaVenta:   () => void;
  onImprimir:     () => void;
}

const METODO_LABEL: Record<MetodoPago, string> = {
  efectivo:      "Efectivo",
  tarjeta:       "Tarjeta",
  transferencia: "Transferencia",
};

export default function ConfirmacionScreen({
  total,
  metodo,
  montoRecibido,
  onNuevaVenta,
  onImprimir,
}: Props) {
  const cambio = metodo === "efectivo" && montoRecibido
    ? Math.max(0, montoRecibido - total)
    : null;

  return (
    <section>
      <div style={{ ...cardStyle, textAlign: "center", padding: "40px 24px" }}>

        {/* Ícono de éxito */}
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: colors.primaryLight,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
          fontSize: 36,
        }}>
          ✅
        </div>

        <h2 style={{ color: colors.primary, fontSize: 22, marginTop: 0, marginBottom: 24 }}>
          ¡Venta realizada!
        </h2>

        {/* Resumen */}
        <div style={{ textAlign: "left", marginBottom: 28 }}>
          <FilaResumen label="Total"  valor={`L ${total.toFixed(2)}`} />
          <FilaResumen label="Pago"   valor={METODO_LABEL[metodo]} />
          {cambio !== null && (
            <FilaResumen
              label="Cambio"
              valor={`L ${cambio.toFixed(2)}`}
              color={colors.primary}
            />
          )}
        </div>

        {/* Botones */}
        <button style={{ ...btnSecondary, marginBottom: 12 }} onClick={onImprimir}>
          🖨️ IMPRIMIR TICKET
        </button>

        <button style={btnPrimary} onClick={onNuevaVenta}>
          NUEVA VENTA
        </button>
      </div>
    </section>
  );
}

// ── Sub-componente fila de resumen ──
function FilaResumen({
  label, valor, color,
}: {
  label: string;
  valor: string;
  color?: string;
}) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      padding: "10px 0",
      borderBottom: "1px solid #f0f0f0",
    }}>
      <span style={{ color: "#888", fontSize: 15 }}>{label}</span>
      <span style={{ fontWeight: "bold", fontSize: 15, color: color ?? "#222" }}>{valor}</span>
    </div>
  );
}
