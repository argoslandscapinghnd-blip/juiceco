"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Pantalla 3: Apertura de Caja
// ─────────────────────────────────────────────
import { useState } from "react";
import { Header, Row } from "./ui/components";
import { colors, inputStyle, btnPrimary, cardStyle } from "./ui/styles";

interface Props {
  punto:   string;
  usuario: string;
  onAbrir: (fondo: number) => void;
  onBack:  () => void;
}

export default function AperturaCajaScreen({ punto, usuario, onAbrir, onBack }: Props) {
  const [fondo, setFondo] = useState("");

  const fecha = new Date().toLocaleDateString("es-HN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  }) + "  " + new Date().toLocaleTimeString("es-HN", {
    hour: "2-digit", minute: "2-digit",
  });

  const handleAbrir = () => {
    const valor = parseFloat(fondo);
    if (!fondo.trim() || isNaN(valor) || valor < 0) return;
    onAbrir(valor);
  };

  return (
    <section>
      <Header titulo="Apertura de caja" onBack={onBack} />

      <div style={cardStyle}>
        <Row label="Punto de venta" valor={punto} />
        <Row label="Usuario"        valor={usuario} />
        <Row label="Fecha"          valor={fecha} />

        <label style={{ display: "block", marginTop: 16, marginBottom: 6, fontWeight: "bold", fontSize: 14, color: colors.textPrimary }}>
          Fondo inicial de caja (L.)
        </label>

        <input
          placeholder="0.00"
          value={fondo}
          onChange={(e) => setFondo(e.target.value)}
          type="number"
          min="0"
          style={{ ...inputStyle, fontSize: 28, fontWeight: "bold", textAlign: "center" }}
        />

        <button style={btnPrimary} onClick={handleAbrir}>
          ABRIR CAJA
        </button>
      </div>
    </section>
  );
}
