"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Recetas de Bebidas (Admin)
// ─────────────────────────────────────────────
import { useEffect, useState } from "react";
import { Header, Divider } from "./ui/components";
import { colors, cardStyle, btnPrimary, btnSecondary, inputStyle } from "./ui/styles";
import { supabase } from "@/supabase";

interface Producto { id: number; nombre: string; emoji: string; precio: number; }
interface Insumo   { id: number; nombre: string; unidad: string; tipo: string; costo_unitario: number; }
interface LineaReceta {
  id?:         number;
  insumo_id:   number;
  insumo:      Insumo;
  cantidad:    number;
  costo_linea: number;
}

interface Props { onBack: () => void; }

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2 });

export default function RecetasScreen({ onBack }: Props) {
  const [bebidas,          setBebidas]          = useState<Producto[]>([]);
  const [insumos,          setInsumos]          = useState<Insumo[]>([]);
  const [bebidaSelec,      setBebidaSelec]      = useState<Producto | null>(null);
  const [lineas,           setLineas]           = useState<LineaReceta[]>([]);
  const [cargando,         setCargando]         = useState(true);
  const [guardando,        setGuardando]        = useState(false);
  const [mensaje,          setMensaje]          = useState("");

  // Para agregar nueva línea
  const [insumoSelec,  setInsumoSelec]  = useState<number>(0);
  const [cantidad,     setCantidad]     = useState("");

  useEffect(() => {
    Promise.all([
      supabase.from("productos").select("*").eq("activo", true).order("nombre"),
      supabase.from("insumos_maestro").select("*").eq("activo", true).order("tipo").order("nombre"),
    ]).then(([{ data: b }, { data: i }]) => {
      setBebidas((b as Producto[]) ?? []);
      setInsumos((i as Insumo[]) ?? []);
      setCargando(false);
    });
  }, []);

  const cargarReceta = async (bebida: Producto) => {
    setBebidaSelec(bebida);
    setLineas([]);
    const { data } = await supabase
      .from("recetas")
      .select("id, insumo_id, cantidad, insumos_maestro(id, nombre, unidad, tipo, costo_unitario)")
      .eq("producto_id", bebida.id);

    const lineasCargadas: LineaReceta[] = (data ?? []).map((r: any) => ({
      id:          r.id,
      insumo_id:   r.insumo_id,
      insumo:      r.insumos_maestro,
      cantidad:    r.cantidad,
      costo_linea: r.cantidad * r.insumos_maestro.costo_unitario,
    }));
    setLineas(lineasCargadas);
  };

  const agregarLinea = () => {
    if (!insumoSelec || !cantidad || parseFloat(cantidad) <= 0) return;
    const ins = insumos.find(i => i.id === insumoSelec);
    if (!ins) return;
    // No duplicar insumo
    if (lineas.find(l => l.insumo_id === insumoSelec)) {
      setMensaje("⚠️ Ese insumo ya está en la receta.");
      setTimeout(() => setMensaje(""), 2000);
      return;
    }
    const cant = parseFloat(cantidad);
    setLineas(prev => [...prev, {
      insumo_id:   ins.id,
      insumo:      ins,
      cantidad:    cant,
      costo_linea: cant * ins.costo_unitario,
    }]);
    setCantidad("");
    setInsumoSelec(0);
  };

  const eliminarLinea = (insumo_id: number) => {
    setLineas(prev => prev.filter(l => l.insumo_id !== insumo_id));
  };

  const guardarReceta = async () => {
    if (!bebidaSelec) return;
    setGuardando(true);

    // Borrar receta existente
    await supabase.from("recetas").delete().eq("producto_id", bebidaSelec.id);

    // Insertar nuevas líneas
    if (lineas.length > 0) {
      await supabase.from("recetas").insert(
        lineas.map(l => ({
          producto_id: bebidaSelec.id,
          insumo_id:   l.insumo_id,
          cantidad:    l.cantidad,
          unidad:      l.insumo.unidad,
          costo_total: l.costo_linea,
        }))
      );
    }

    setGuardando(false);
    setMensaje("✅ Receta guardada correctamente.");
    setTimeout(() => setMensaje(""), 3000);
  };

  const costoTotal  = lineas.reduce((s, l) => s + l.costo_linea, 0);
  const utilidad    = bebidaSelec ? bebidaSelec.precio - costoTotal : 0;
  const margen      = bebidaSelec && bebidaSelec.precio > 0 ? (utilidad / bebidaSelec.precio) * 100 : 0;

  // ── Vista 1: Seleccionar bebida ──
  if (!bebidaSelec) {
    return (
      <section>
        <Header titulo="Recetas" onBack={onBack} />
        <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 16 }}>
          Selecciona una bebida para ver o editar su receta:
        </p>
        {cargando ? (
          <div style={{ textAlign: "center", color: colors.textMuted, padding: 40 }}>Cargando...</div>
        ) : (
          bebidas.map((b) => (
            <button key={b.id} onClick={() => cargarReceta(b)} style={{
              ...cardStyle, width: "100%", display: "flex", alignItems: "center",
              gap: 14, cursor: "pointer", border: "none", textAlign: "left", marginBottom: 10,
            }}>
              <span style={{ fontSize: 32 }}>{b.emoji}</span>
              <div>
                <div style={{ fontWeight: "bold", fontSize: 15 }}>{b.nombre}</div>
                <div style={{ fontSize: 13, color: colors.primary }}>Precio: L {fmt(b.precio)}</div>
              </div>
              <span style={{ marginLeft: "auto", color: colors.textMuted, fontSize: 20 }}>›</span>
            </button>
          ))
        )}
      </section>
    );
  }

  // ── Vista 2: Editar receta ──
  return (
    <section>
      <Header titulo={`Receta: ${bebidaSelec.nombre}`} onBack={() => setBebidaSelec(null)} />

      {/* Resumen costos */}
      <div style={{ ...cardStyle, background: colors.primaryLight, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: colors.primary }}>Precio de venta</span>
          <span style={{ fontWeight: "bold", color: colors.primary }}>L {fmt(bebidaSelec.precio)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: colors.textMuted }}>Costo total</span>
          <span style={{ fontWeight: "bold", color: colors.danger }}>L {fmt(costoTotal)}</span>
        </div>
        <Divider />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14, fontWeight: "bold", color: utilidad >= 0 ? colors.primary : colors.danger }}>
            Utilidad ({margen.toFixed(1)}%)
          </span>
          <span style={{ fontSize: 16, fontWeight: "bold", color: utilidad >= 0 ? colors.primary : colors.danger }}>
            L {fmt(utilidad)}
          </span>
        </div>
      </div>

      {/* Líneas de receta */}
      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, color: colors.textPrimary }}>Ingredientes y empaque</h3>

        {lineas.length === 0 ? (
          <p style={{ color: colors.textMuted, fontSize: 13, textAlign: "center", padding: "16px 0" }}>
            No hay insumos en esta receta aún.
          </p>
        ) : (
          lineas.map((l) => (
            <div key={l.insumo_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${colors.border}` }}>
              <div>
                <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 10, marginRight: 6, background: l.insumo.tipo === "ingrediente" ? "#e3f2fd" : "#fff3e0", color: l.insumo.tipo === "ingrediente" ? "#1565c0" : "#e65100", fontWeight: "bold" }}>
                  {l.insumo.tipo === "ingrediente" ? "🧪" : "📦"}
                </span>
                <span style={{ fontSize: 14, fontWeight: "bold" }}>{l.insumo.nombre}</span>
                <span style={{ fontSize: 12, color: colors.textMuted, marginLeft: 6 }}>
                  {l.cantidad} {l.insumo.unidad} × L {fmt(l.insumo.costo_unitario)}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: "bold", color: colors.danger }}>L {fmt(l.costo_linea)}</span>
                <button onClick={() => eliminarLinea(l.insumo_id)} style={{ background: "none", border: "none", color: colors.danger, cursor: "pointer", fontSize: 18 }}>×</button>
              </div>
            </div>
          ))
        )}

        {/* Agregar insumo */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: "bold", color: colors.textSecondary, marginBottom: 8 }}>+ Agregar insumo</div>
          <select
            value={insumoSelec}
            onChange={(e) => setInsumoSelec(parseInt(e.target.value))}
            style={{ ...inputStyle, marginBottom: 8 }}
          >
            <option value={0}>Selecciona un insumo...</option>
            <optgroup label="🧪 Ingredientes">
              {insumos.filter(i => i.tipo === "ingrediente").map(i => (
                <option key={i.id} value={i.id}>{i.nombre} (L {fmt(i.costo_unitario)}/{i.unidad})</option>
              ))}
            </optgroup>
            <optgroup label="📦 Empaque">
              {insumos.filter(i => i.tipo === "empaque").map(i => (
                <option key={i.id} value={i.id}>{i.nombre} (L {fmt(i.costo_unitario)}/{i.unidad})</option>
              ))}
            </optgroup>
          </select>

          <div style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="Cantidad"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              type="number"
              min="0"
              style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
            />
            <button
              onClick={agregarLinea}
              disabled={!insumoSelec || !cantidad}
              style={{ padding: "14px 20px", borderRadius: 10, border: "none", background: insumoSelec && cantidad ? colors.primary : "#ccc", color: "white", fontWeight: "bold", cursor: insumoSelec && cantidad ? "pointer" : "not-allowed" }}
            >
              + Agregar
            </button>
          </div>
        </div>
      </div>

      {mensaje && (
        <p style={{ textAlign: "center", fontSize: 14, marginTop: 8, color: mensaje.startsWith("✅") ? colors.primary : colors.danger }}>
          {mensaje}
        </p>
      )}

      <button style={{ ...btnPrimary, marginTop: 16, opacity: guardando ? 0.7 : 1 }} onClick={guardarReceta} disabled={guardando}>
        {guardando ? "Guardando..." : "💾 GUARDAR RECETA"}
      </button>
      <button style={{ ...btnSecondary, marginTop: 10 }} onClick={() => setBebidaSelec(null)}>
        VOLVER A BEBIDAS
      </button>
    </section>
  );
}
