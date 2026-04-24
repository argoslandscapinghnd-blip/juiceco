// ─────────────────────────────────────────────
//  JUICE CO. — Design Tokens & Estilos Base
//  Edita aquí para cambiar colores/fuentes globales
// ─────────────────────────────────────────────
import React from "react";

export const colors = {
  primary:       "#087a2b",  // verde principal
  primaryDark:   "#0b6b2b",  // verde oscuro (títulos)
  primaryLight:  "#e8f5e9",  // verde claro (fondos suaves)
  accent:        "#f5a623",  // naranja (carrito, alertas)
  danger:        "#e53935",  // rojo (eliminar)
  background:    "#f0f4f1",  // fondo general
  white:         "#ffffff",
  border:        "#e0e0e0",
  textPrimary:   "#222222",
  textSecondary: "#555555",
  textMuted:     "#aaaaaa",
};

// ── Inputs ──
export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 14,
  marginBottom: 12,
  borderRadius: 10,
  border: `1px solid ${colors.border}`,
  fontSize: 16,
  boxSizing: "border-box",
  outline: "none",
  fontFamily: "inherit",
};

// ── Botón principal verde ──
export const btnPrimary: React.CSSProperties = {
  width: "100%",
  padding: 16,
  borderRadius: 10,
  border: "none",
  background: colors.primary,
  color: colors.white,
  fontWeight: "bold",
  fontSize: 16,
  cursor: "pointer",
  fontFamily: "inherit",
};

// ── Botón secundario (outline verde) ──
export const btnSecondary: React.CSSProperties = {
  width: "100%",
  padding: 16,
  borderRadius: 10,
  border: `1px solid ${colors.primary}`,
  background: colors.primaryLight,
  color: colors.primary,
  fontWeight: "bold",
  fontSize: 16,
  cursor: "pointer",
  fontFamily: "inherit",
};

// ── Botón de acento naranja ──
export const btnAccent: React.CSSProperties = {
  width: "100%",
  padding: 16,
  borderRadius: 10,
  border: "none",
  background: colors.accent,
  color: colors.white,
  fontWeight: "bold",
  fontSize: 16,
  cursor: "pointer",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontFamily: "inherit",
};

// ── Botón numérico pequeño (teclado) ──
export const btnNumeric: React.CSSProperties = {
  padding: 18,
  borderRadius: 10,
  border: `1px solid ${colors.border}`,
  background: colors.white,
  fontWeight: "bold",
  fontSize: 18,
  cursor: "pointer",
  fontFamily: "inherit",
};

// ── Botón +/- grande ──
export const btnPlusMinus: React.CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: 10,
  border: "none",
  background: colors.primary,
  color: colors.white,
  fontWeight: "bold",
  fontSize: 28,
  cursor: "pointer",
};

// ── Tarjeta blanca con sombra ──
export const cardStyle: React.CSSProperties = {
  background: colors.white,
  borderRadius: 16,
  padding: 20,
  marginBottom: 12,
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
};

// ── Botón tipo tarjeta (lista de puntos) ──
export const cardBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "16px 18px",
  marginBottom: 10,
  borderRadius: 12,
  border: `1px solid ${colors.border}`,
  background: colors.white,
  fontWeight: "bold",
  fontSize: 15,
  cursor: "pointer",
  textAlign: "left",
  display: "flex",
  flexDirection: "column",
  gap: 2,
  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  fontFamily: "inherit",
};

// ── Tarjeta de producto (menú grid) ──
export const productCardStyle: React.CSSProperties = {
  padding: "20px 12px",
  borderRadius: 14,
  border: `1px solid ${colors.border}`,
  background: colors.white,
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 8,
  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  fontFamily: "inherit",
};
