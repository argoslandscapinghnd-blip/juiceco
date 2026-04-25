"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Pantalla: Menú Admin
// ─────────────────────────────────────────────
import { Logo } from "./ui/components";
import { colors, cardStyle } from "./ui/styles";

interface Props {
  usuario:        string;
  onUsuarios:     () => void;
  onInventario:   () => void;
  onReportes:     () => void;
  onCerrarSesion: () => void;
}

const modulos = [
  { emoji: "👥", titulo: "Usuarios",   desc: "Crear, editar e inhabilitar usuarios",  key: "usuarios"   },
  { emoji: "📦", titulo: "Inventario", desc: "Insumos, stock y movimientos",           key: "inventario" },
  { emoji: "📊", titulo: "Reportes",   desc: "Ventas, caja y dashboard",               key: "reportes"   },
];

export default function AdminMenuScreen({
  usuario, onUsuarios, onInventario, onReportes, onCerrarSesion,
}: Props) {
  const handlers: Record<string, () => void> = {
    usuarios:   onUsuarios,
    inventario: onInventario,
    reportes:   onReportes,
  };

  return (
    <section>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Logo size="normal" />
        <button
          onClick={onCerrarSesion}
          style={{ background: "none", border: "none", color: colors.danger, cursor: "pointer", fontSize: 13, fontWeight: "bold" }}
        >
          Cerrar sesión
        </button>
      </div>

      {/* Bienvenida */}
      <div style={{ ...cardStyle, background: colors.primaryLight, marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: colors.primary, marginBottom: 2 }}>Bienvenido,</div>
        <div style={{ fontWeight: "bold", fontSize: 18, color: colors.primaryDark }}>🛡️ {usuario}</div>
        <div style={{ fontSize: 12, color: colors.primary, marginTop: 4 }}>Panel de Administrador</div>
      </div>

      {/* Módulos */}
      {modulos.map((m) => (
        <button
          key={m.key}
          onClick={handlers[m.key]}
          style={{
            ...cardStyle,
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 16,
            cursor: "pointer",
            border: "none",
            textAlign: "left",
            marginBottom: 10,
          }}
        >
          <span style={{
            fontSize: 32, width: 56, height: 56, borderRadius: 14,
            background: colors.primaryLight,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            {m.emoji}
          </span>
          <div>
            <div style={{ fontWeight: "bold", fontSize: 16, color: colors.textPrimary, marginBottom: 2 }}>
              {m.titulo}
            </div>
            <div style={{ fontSize: 13, color: colors.textMuted }}>
              {m.desc}
            </div>
          </div>
          <span style={{ marginLeft: "auto", color: colors.textMuted, fontSize: 20 }}>›</span>
        </button>
      ))}
    </section>
  );
}
