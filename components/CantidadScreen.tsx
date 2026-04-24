"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Pantalla 5: Selección de Cantidad
// ─────────────────────────────────────────────
import { useState } from "react";
import { Header } from "./ui/components";
import { colors, btnPrimary, btnNumeric, btnPlusMinus, cardStyle } from "./ui/styles";

interface Props {
  producto:  string;
  onAgregar: (cantidad: number) => void;
  onBack:    () => void;
}

export default function CantidadScreen({ producto, onAgregar, onBack }: Props) {
  const [cantidad, setCantidad] = useState(1);

  const presionar = (val: string) => {
    if (val === "CE") { setCantidad(1); return; }
    if (val === "⌫") { setCantidad((c) => Math.max(1, Math.floor(c / 10))); return; }
    const nuevo = parseInt(`${cantidad === 1 ? "" : cantidad}${val}`);
    setCantidad(nuevo > 99 ? 99 : nuevo || 1);
  };

  const TECLAS = ["1","2","3","4","5","6","7","8","9","CE","0","⌫"];

  return (
    <section>
      <Header titulo={producto} onBack={onBack} />

      <div style={cardStyle}>
        <p style={{ textAlign: "center", color: colors.textMuted, marginTop: 0 }}>
          Seleccione cantidad
        </p>

        {/* Contador */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 24, margin: "16px 0 24px" }}>
          <button style={btnPlusMinus} onClick={() => setCantidad((c) => Math.max(1, c - 1))}>−</button>
          <span style={{ fontSize: 56, fontWeight: "bold", minWidth: 72, textAlign: "center", color: colors.primary }}>
            {cantidad}
          </span>
          <button style={btnPlusMinus} onClick={() => setCantidad((c) => Math.min(99, c + 1))}>+</button>
        </div>

        {/* Teclado numérico */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 20 }}>
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

        <button style={btnPrimary} onClick={() => onAgregar(cantidad)}>
          🛒 AGREGAR AL CARRITO
        </button>
      </div>
    </section>
  );
}
