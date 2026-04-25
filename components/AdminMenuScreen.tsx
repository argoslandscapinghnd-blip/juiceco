"use client";
import { Logo } from "./ui/components";
import { colors, cardStyle, btnPrimary } from "./ui/styles";

interface Props {
  usuario:        string;
  onUsuarios:     () => void;
  onSucursales:   () => void;
  onBebidas:      () => void;
  onInsumos:      () => void;
  onReportes:     () => void;
  onModoCajero:   () => void;
  onCerrarSesion: () => void;
}

const modulos = [
  { emoji: "👥", titulo: "Usuarios",        desc: "Crear, editar e inhabilitar usuarios",        key: "usuarios"   },
  { emoji: "🏪", titulo: "Sucursales",      desc: "Crear, editar e inhabilitar sucursales",       key: "sucursales" },
  { emoji: "🍹", titulo: "Bebidas",         desc: "Crear, editar e inhabilitar bebidas",          key: "bebidas"    },
  { emoji: "🧪", titulo: "Insumos/Empaque", desc: "Ingredientes y materiales con costos",         key: "insumos"    },
  { emoji: "📊", titulo: "Reportes",        desc: "Ventas, caja y dashboard",                     key: "reportes"   },
];

export default function AdminMenuScreen({
  usuario, onUsuarios, onSucursales, onBebidas, onInsumos, onReportes, onModoCajero, onCerrarSesion,
}: Props) {
  const handlers: Record<string, () => void> = {
    usuarios: onUsuarios, sucursales: onSucursales, bebidas: onBebidas,
    insumos: onInsumos, reportes: onReportes,
  };

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Logo size="normal" />
        <button onClick={onCerrarSesion} style={{ background: "none", border: "none", color: colors.danger, cursor: "pointer", fontSize: 13, fontWeight: "bold" }}>
          Cerrar sesión
        </button>
      </div>
      <div style={{ ...cardStyle, background: colors.primaryLight, marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: colors.primary, marginBottom: 2 }}>Bienvenido,</div>
        <div style={{ fontWeight: "bold", fontSize: 18, color: colors.primaryDark }}>🛡️ {usuario}</div>
        <div style={{ fontSize: 12, color: colors.primary, marginTop: 4 }}>Panel de Administrador</div>
      </div>
      <button style={{ ...btnPrimary, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }} onClick={onModoCajero}>
        <span style={{ fontSize: 20 }}>🧾</span><span>MODO CAJERO — Iniciar venta</span>
      </button>
      <div style={{ fontSize: 12, fontWeight: "bold", color: colors.textMuted, marginBottom: 10, letterSpacing: 1 }}>ADMINISTRACIÓN</div>
      {modulos.map((m) => (
        <button key={m.key} onClick={handlers[m.key]} style={{ ...cardStyle, width: "100%", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", border: "none", textAlign: "left", marginBottom: 10 }}>
          <span style={{ fontSize: 28, width: 52, height: 52, borderRadius: 12, background: colors.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {m.emoji}
          </span>
          <div>
            <div style={{ fontWeight: "bold", fontSize: 15, color: colors.textPrimary, marginBottom: 2 }}>{m.titulo}</div>
            <div style={{ fontSize: 13, color: colors.textMuted }}>{m.desc}</div>
          </div>
          <span style={{ marginLeft: "auto", color: colors.textMuted, fontSize: 20 }}>›</span>
        </button>
      ))}
    </section>
  );
}
