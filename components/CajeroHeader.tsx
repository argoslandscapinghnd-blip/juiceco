"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Header del Cajero
// ─────────────────────────────────────────────
import { useState } from "react";
import { colors } from "./ui/styles";

interface Props {
  usuario:        string;
  sucursal:       string;
  tieneItems:     boolean;
  onVerTurno:     () => void;
  onCerrarSesion: () => void;
}

export default function CajeroHeader({ usuario, sucursal, tieneItems, onVerTurno, onCerrarSesion }: Props) {
  const [confirmar, setConfirmar] = useState(false);

  if (confirmar) {
    return (
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.5)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}>
        <div style={{ background: "white", borderRadius: 16, maxWidth: 400, width: "100%", textAlign: "center", padding: "32px 24px" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <h3 style={{ marginTop: 0, color: colors.textPrimary }}>¿Cerrar sesión?</h3>
          <p style={{ color: colors.textMuted, fontSize: 14, marginBottom: 24 }}>
            Tienes productos en el carrito. Si cierras sesión se perderán.
            Tu caja seguirá abierta y podrás volver a ingresar.
          </p>
          <button onClick={onCerrarSesion} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: colors.danger, color: "white", fontWeight: "bold", fontSize: 15, cursor: "pointer", marginBottom: 10 }}>
            SÍ, CERRAR SESIÓN
          </button>
          <button onClick={() => setConfirmar(false)} style={{ width: "100%", padding: 14, borderRadius: 10, border: `1px solid ${colors.border}`, background: "white", fontWeight: "bold", fontSize: 15, cursor: "pointer" }}>
            CANCELAR
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      background: "white", borderRadius: 12, padding: "10px 14px",
      marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      {/* Clickear nombre abre Mi Turno */}
      <button onClick={onVerTurno} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
        <div style={{ fontWeight: "bold", fontSize: 14, color: colors.primary }}>
          👤 {usuario} <span style={{ fontSize: 11, color: colors.textMuted }}>ver turno →</span>
        </div>
        <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>
          🏪 {sucursal}
        </div>
      </button>

      <button
        onClick={() => tieneItems ? setConfirmar(true) : onCerrarSesion()}
        style={{ background: "none", border: `1px solid ${colors.danger}`, color: colors.danger, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: "bold", cursor: "pointer" }}
      >
        Cerrar sesión
      </button>
    </div>
  );
}
