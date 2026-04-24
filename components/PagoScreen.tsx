"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Pantalla 8 & 9: Método de Pago + Efectivo
// ─────────────────────────────────────────────
import { useState } from "react";
import { Header } from "./ui/components";
import { colors, btnPrimary, cardStyle, btnNumeric } from "./ui/styles";
import { MetodoPago } from "./ui/types";

interface Props {
  total:       number;
  onConfirmar: (metodo: MetodoPago, montoRecibido?: number) => void;
  onBack:      () => void;
}

export default function PagoScreen({ total, onConfirmar, onBack }: Props) {
  const [paso,          setPaso]          = useState<"metodo" | "efectivo">("metodo");
  const [montoTexto,    setMontoTexto]    = useState("");
  const [error,         setError]         = useState("");

  const monto   = parseFloat(montoTexto) || 0;
  const cambio  = Math.max(0, monto - total);

  const presionar = (val: string) => {
    if (val === "CE") { setMontoTexto("");  return; }
    if (val === "⌫") { setMontoTexto((m) => m.slice(0, -1)); return; }
    // Máximo 7 dígitos
    if (montoTexto.replace(".", "").length >= 7) return;
    setMontoTexto((m) => m + val);
  };

  const handleConfirmarEfectivo = () => {
    if (monto < total) {
      setError(`El monto recibido debe ser al menos L ${total.toFixed(2)}`);
      return;
    }
    setError("");
    onConfirmar("efectivo", monto);
  };

  const TECLAS = ["1","2","3","4","5","6","7","8","9","CE","0","⌫"];

  // ── Paso 1: Elegir método ──
  if (paso === "metodo") {
    return (
      <section>
        <Header titulo="Método de pago" onBack={onBack} />

        <div style={{ ...cardStyle, padding: "24px 20px" }}>
          <p style={{ textAlign: "center", color: colors.textMuted, marginTop: 0, fontSize: 14 }}>
            Seleccione método de pago
          </p>

          {[
            { metodo: "efectivo"      as MetodoPago, emoji: "💵", label: "EFECTIVO" },
            { metodo: "tarjeta"       as MetodoPago, emoji: "💳", label: "TARJETA" },
            { metodo: "transferencia" as MetodoPago, emoji: "📲", label: "TRANSFERENCIA" },
          ].map(({ metodo, emoji, label }) => (
            <button
              key={metodo}
              style={metodoBtnStyle}
              onClick={() => {
                if (metodo === "efectivo") {
                  setPaso("efectivo");
                } else {
                  onConfirmar(metodo);
                }
              }}
            >
              <span style={{ fontSize: 28 }}>{emoji}</span>
              <span style={{ fontWeight: "bold", fontSize: 16 }}>{label}</span>
            </button>
          ))}

          <button
            style={{ background: "none", border: "none", color: colors.textMuted, cursor: "pointer", marginTop: 8, fontSize: 15, width: "100%" }}
            onClick={onBack}
          >
            CANCELAR
          </button>
        </div>
      </section>
    );
  }

  // ── Paso 2: Pago en efectivo ──
  return (
    <section>
      <Header titulo="Pago en efectivo" onBack={() => { setPaso("metodo"); setMontoTexto(""); setError(""); }} />

      <div style={cardStyle}>
        {/* Resumen */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 15 }}>
          <span style={{ color: colors.textMuted }}>Total a pagar</span>
          <span style={{ fontWeight: "bold" }}>L {total.toFixed(2)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 15 }}>
          <span style={{ color: colors.textMuted }}>Monto recibido</span>
          <span style={{ fontWeight: "bold", fontSize: 20 }}>
            {montoTexto ? `L ${parseFloat(montoTexto).toLocaleString("es-HN", { minimumFractionDigits: 2 })}` : "—"}
          </span>
        </div>

        {/* Cambio */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          padding: "12px 16px", borderRadius: 10,
          background: monto >= total ? colors.primaryLight : "#f5f5f5",
          marginBottom: 20,
        }}>
          <span style={{ fontWeight: "bold", color: monto >= total ? colors.primary : colors.textMuted }}>
            Cambio
          </span>
          <span style={{ fontWeight: "bold", fontSize: 20, color: monto >= total ? colors.primary : colors.textMuted }}>
            L {cambio.toFixed(2)}
          </span>
        </div>

        {/* Teclado */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
          {TECLAS.map((k) => (
            <button
              key={k}
              onClick={() => presionar(k)}
              style={{
                ...btnNumeric,
                background:
                  k === "CE" ? "#fff3cd" :
                  k === "⌫" ? "#fdecea" :
                  colors.white,
              }}
            >
              {k}
            </button>
          ))}
        </div>

        {error && (
          <p style={{ color: colors.danger, fontSize: 14, marginBottom: 12 }}>⚠️ {error}</p>
        )}

        <button
          style={{ ...btnPrimary, opacity: monto >= total ? 1 : 0.5 }}
          onClick={handleConfirmarEfectivo}
        >
          CONFIRMAR PAGO
        </button>
      </div>
    </section>
  );
}

// ── Estilos locales ──
const metodoBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "18px 20px",
  marginBottom: 10,
  borderRadius: 12,
  border: "1px solid #e0e0e0",
  background: "#fafafa",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 16,
  fontSize: 16,
};
