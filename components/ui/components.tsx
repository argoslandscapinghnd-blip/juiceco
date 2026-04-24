// ─────────────────────────────────────────────
//  JUICE CO. — Componentes UI Reutilizables
//  Header, Row, Divider, etc.
// ─────────────────────────────────────────────
import { colors } from "./styles";

// ── Encabezado con botón atrás ──
export function Header({
  titulo,
  onBack,
}: {
  titulo: string;
  onBack: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          fontSize: 22,
          cursor: "pointer",
          color: colors.primary,
          padding: 0,
          lineHeight: 1,
        }}
      >
        ←
      </button>
      <h2 style={{ margin: 0, fontSize: 18, color: colors.textPrimary }}>{titulo}</h2>
    </div>
  );
}

// ── Fila de dato etiqueta / valor ──
export function Row({ label, valor }: { label: string; valor: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: "bold", fontSize: 16, color: colors.textPrimary }}>{valor}</div>
    </div>
  );
}

// ── Separador horizontal ──
export function Divider() {
  return (
    <hr
      style={{
        border: "none",
        borderTop: `1px solid ${colors.border}`,
        margin: "12px 0",
      }}
    />
  );
}

// ── Logo Juice Co. ──
export function Logo({ size = "normal" }: { size?: "small" | "normal" | "large" }) {
  const sizes = {
    small:  { emoji: 20, text: 14 },
    normal: { emoji: 24, text: 18 },
    large:  { emoji: 48, text: 28 },
  };
  const s = sizes[size];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: s.emoji }}>🍋</span>
      <span style={{ fontWeight: "bold", fontSize: s.text, color: colors.primaryDark, letterSpacing: 2 }}>
        JUICE CO.
      </span>
    </div>
  );
}
