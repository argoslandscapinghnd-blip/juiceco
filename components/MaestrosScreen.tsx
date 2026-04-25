"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Submenú: Maestros
// ─────────────────────────────────────────────
import { Header } from "./ui/components";
import { colors, cardStyle } from "./ui/styles";

interface Props {
  onBebidas:  () => void;
  onUnidades: () => void;
  onInsumos:  () => void;
  onRecetas:  () => void;
  onBack:     () => void;
}

const modulos = [
  { emoji: "🍹", titulo: "Bebidas",         desc: "Crear, editar e inhabilitar bebidas",      key: "bebidas"   },
  { emoji: "📐", titulo: "Unidades",        desc: "Unidades de medida para insumos",           key: "unidades"  },
  { emoji: "🧪", titulo: "Insumos/Empaque", desc: "Ingredientes y materiales con costos",      key: "insumos"   },
  { emoji: "📋", titulo: "Recetas",         desc: "Ingredientes por bebida y costo/utilidad",  key: "recetas"   },
];

export default function MaestrosScreen({ onBebidas, onUnidades, onInsumos, onRecetas, onBack }: Props) {
  const handlers: Record<string, () => void> = {
    bebidas: onBebidas, unidades: onUnidades, insumos: onInsumos, recetas: onRecetas,
  };

  return (
    <section>
      <Header titulo="Maestros" onBack={onBack} />

      <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 16 }}>
        Configura las bebidas, insumos y recetas del sistema.
      </p>

      {modulos.map((m) => (
        <button key={m.key} onClick={handlers[m.key]} style={{
          ...cardStyle, width: "100%", display: "flex", alignItems: "center",
          gap: 16, cursor: "pointer", border: "none", textAlign: "left", marginBottom: 10,
        }}>
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
