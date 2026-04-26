// ─────────────────────────────────────────────
//  Lemon Lab — Componentes UI Reutilizables
//  Header, Row, Divider, etc.
// ─────────────────────────────────────────────
import Image from "next/image";
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

// ── Logo Lemon Lab ──
export function Logo({ size = "normal" }: { size?: "small" | "normal" | "large" }) {
  const dims = {
    small:  { width: 90,  height: 60  },
    normal: { width: 150, height: 100 },
    large:  { width: 210, height: 140 },
  };
  const { width, height } = dims[size];
  return (
    <Image
      src="/Logo.png"
      alt="Lemon Lab"
      width={width}
      height={height}
      style={{ objectFit: "contain" }}
    />
  );
}