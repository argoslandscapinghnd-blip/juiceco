"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Pantalla 2: Selección Punto de Venta
// ─────────────────────────────────────────────
import { Header } from "./ui/components";
import { colors, btnSecondary, cardBtnStyle } from "./ui/styles";
import { PUNTOS } from "./ui/types";

interface Props {
  onSeleccionar: (punto: string) => void;
  onBack:        () => void;
}

export default function PuntoVentaScreen({ onSeleccionar, onBack }: Props) {
  return (
    <section>
      <Header titulo="Seleccione punto de venta" onBack={onBack} />

      {PUNTOS.map((p) => (
        <button
          key={p.codigo}
          style={cardBtnStyle}
          onClick={() => onSeleccionar(`${p.codigo} - ${p.nombre}`)}
        >
          <span style={{ fontWeight: "bold", color: colors.textPrimary }}>
            {p.codigo} - {p.nombre}
          </span>
          <span style={{ fontSize: 13, color: colors.textMuted, fontWeight: "normal" }}>
            {p.ciudad}
          </span>
        </button>
      ))}

      <button style={btnSecondary}>
        🔄 SINCRONIZAR DATOS
      </button>
    </section>
  );
}
