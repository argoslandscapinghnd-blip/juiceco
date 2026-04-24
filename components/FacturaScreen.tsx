"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Pantalla 7: Tipo de Factura
// ─────────────────────────────────────────────
import { useState } from "react";
import { Header } from "./ui/components";
import { colors, btnPrimary, cardStyle, inputStyle } from "./ui/styles";
import { DatosFactura } from "./ui/types";

interface Props {
  onContinuar: (conFactura: boolean, datos?: DatosFactura) => void;
  onBack:      () => void;
}

export default function FacturaScreen({ onContinuar, onBack }: Props) {
  const [paso,     setPaso]     = useState<"elegir" | "datos">("elegir");
  const [rtn,      setRtn]      = useState("");
  const [nombre,   setNombre]   = useState("");
  const [correo,   setCorreo]   = useState("");
  const [error,    setError]    = useState("");

  const handleFacturaFormal = () => setPaso("datos");

  const handleContinuarConDatos = () => {
    if (!rtn.trim())    { setError("El RTN es obligatorio.");           return; }
    if (!nombre.trim()) { setError("El nombre o razón social es obligatorio."); return; }
    setError("");
    onContinuar(true, { rtn, nombre, correo });
  };

  // ── Paso 1: ¿Desea factura? ──
  if (paso === "elegir") {
    return (
      <section>
        <Header titulo="Factura" onBack={onBack} />

        <div style={{ ...cardStyle, textAlign: "center", padding: "32px 20px" }}>
          <h2 style={{ marginTop: 0, marginBottom: 28, fontSize: 20, color: colors.textPrimary }}>
            ¿Desea factura?
          </h2>

          {/* Opción SÍ */}
          <button
            style={opcionBtn}
            onClick={handleFacturaFormal}
          >
            <span style={{ fontSize: 36, marginBottom: 8 }}>🧾</span>
            <span style={{ fontWeight: "bold", fontSize: 18, color: colors.textPrimary }}>SÍ</span>
            <span style={{ fontSize: 13, color: colors.textMuted }}>Factura formal</span>
          </button>

          {/* Opción NO */}
          <button
            style={{ ...opcionBtn, marginTop: 12 }}
            onClick={() => onContinuar(false)}
          >
            <span style={{ fontSize: 36, marginBottom: 8 }}>👤</span>
            <span style={{ fontWeight: "bold", fontSize: 18, color: colors.textPrimary }}>NO</span>
            <span style={{ fontSize: 13, color: colors.textMuted }}>Consumidor final</span>
          </button>

          <button
            style={{ background: "none", border: "none", color: colors.textMuted, cursor: "pointer", marginTop: 20, fontSize: 15, width: "100%" }}
            onClick={onBack}
          >
            CANCELAR
          </button>
        </div>
      </section>
    );
  }

  // ── Paso 2: Datos fiscales ──
  return (
    <section>
      <Header titulo="Factura formal" onBack={() => setPaso("elegir")} />

      <div style={cardStyle}>
        <label style={labelStyle}>RTN</label>
        <input
          placeholder="08011987012345"
          value={rtn}
          onChange={(e) => setRtn(e.target.value)}
          style={inputStyle}
          type="number"
          maxLength={14}
        />

        <label style={labelStyle}>Nombre / Razón Social</label>
        <input
          placeholder="Juan Pérez"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          style={inputStyle}
        />

        <label style={labelStyle}>Correo (opcional)</label>
        <input
          placeholder="juanperez@gmail.com"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          style={inputStyle}
          type="email"
        />

        {error && (
          <p style={{ color: colors.danger, fontSize: 14, marginBottom: 12, marginTop: 0 }}>
            ⚠️ {error}
          </p>
        )}

        <button style={btnPrimary} onClick={handleContinuarConDatos}>
          CONTINUAR
        </button>
      </div>
    </section>
  );
}

// ── Estilos locales (solo afectan esta pantalla) ──
const opcionBtn: React.CSSProperties = {
  width: "100%",
  padding: "20px 16px",
  borderRadius: 14,
  border: `1px solid #e0e0e0`,
  background: "#fafafa",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
  transition: "background 0.15s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: "bold",
  color: "#555",
  marginBottom: 6,
};

