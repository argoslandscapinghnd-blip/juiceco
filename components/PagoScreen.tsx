"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Pantalla: Método de Pago + Efectivo
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

// Formatea número con comas: 1500.50 → "1,500.50"
const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function PagoScreen({ total, onConfirmar, onBack }: Props) {
  const [paso,       setPaso]       = useState<"metodo" | "efectivo">("metodo");
  const [montoTexto, setMontoTexto] = useState("");
  const [error,      setError]      = useState("");

  const monto  = parseFloat(montoTexto) || 0;
  const cambio = Math.max(0, monto - total);

  const presionar = (val: string) => {
    if (val === "CE") { setMontoTexto(""); return; }
    if (val === "⌫")  { setMontoTexto((m) => m.slice(0, -1)); return; }
    if (montoTexto.replace(".", "").length >= 7) return;
    setMontoTexto((m) => m + val);
  };

  const handleConfirmarEfectivo = () => {
    if (monto < total) {
      setError(`El monto debe ser al menos L ${fmt(total)}`);
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
            Total a cobrar: <strong style={{ color: colors.primary, fontSize: 18 }}>L {fmt(total)}</strong>
          </p>

          {[
            { metodo: "efectivo"      as MetodoPago, emoji: "💵", label: "EFECTIVO" },
            { metodo: "tarjeta"       as MetodoPago, emoji: "💳", label: "TARJETA" },
            { metodo: "transferencia" as MetodoPago, emoji: "📲", label: "TRANSFERENCIA" },
          ].map(({ metodo, emoji, label }) => (
            <button
              key={metodo}
              style={metodoBtnStyle}
              onClick={() => metodo === "efectivo" ? setPaso("efectivo") : onConfirmar(metodo)}
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
        {/* Resumen — misma fuente para todos los valores */}
        <div style={filaStyle}>
          <span style={{ color: colors.textMuted, fontSize: 15 }}>Total a pagar</span>
          <span style={{ fontWeight: "bold", fontSize: 15 }}>L {fmt(total)}</span>
        </div>
        <div style={filaStyle}>
          <span style={{ color: colors.textMuted, fontSize: 15 }}>Monto recibido</span>
          <span style={{ fontWeight: "bold", fontSize: 15 }}>
            {montoTexto ? `L ${fmt(parseFloat(montoTexto))}` : "—"}
          </span>
        </div>

        {/* Cambio */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 16px", borderRadius: 10, marginBottom: 20,
          background: monto >= total ? colors.primaryLight : "#f5f5f5",
        }}>
          <span style={{ fontWeight: "bold", fontSize: 15, color: monto >= total ? colors.primary : colors.textMuted }}>
            Cambio
          </span>
          <span style={{ fontWeight: "bold", fontSize: 15, color: monto >= total ? colors.primary : colors.textMuted }}>
            L {fmt(cambio)}
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
                background: k === "CE" ? "#fff3cd" : k === "⌫" ? "#fdecea" : colors.white,
              }}
            >
              {k}
            </button>
          ))}
        </div>

        {error && <p style={{ color: colors.danger, fontSize: 14, marginBottom: 12 }}>⚠️ {error}</p>}

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

const metodoBtnStyle: React.CSSProperties = {
  width: "100%", padding: "18px 20px", marginBottom: 10,
  borderRadius: 12, border: "1px solid #e0e0e0", background: "#fafafa",
  cursor: "pointer", display: "flex", alignItems: "center", gap: 16, fontSize: 16,
};

const filaStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between",
  alignItems: "center", marginBottom: 12,
};
