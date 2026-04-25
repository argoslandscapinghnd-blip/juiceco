"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Dashboard de Reportes (Admin)
//  Auto-actualiza cada 60 segundos
// ─────────────────────────────────────────────
import { useEffect, useState, useCallback } from "react";
import { Header, Divider } from "./ui/components";
import { colors, cardStyle } from "./ui/styles";
import { supabase } from "@/supabase";

interface Props { onBack: () => void; }

interface VentaSucursal  { nombre: string; codigo: string; total: number; ventas: number; }
interface VentaCajero    { nombre: string; total: number; ventas: number; }
interface VentaProducto  { nombre: string; cantidad: number; total: number; }
interface VentaMetodo    { metodo: string; total: number; ventas: number; }

const fmt    = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2 });
const fmtNum = (n: number) => n.toLocaleString("en-US");

const PERIODOS = [
  { label: "Hoy",    value: "hoy"   },
  { label: "Semana", value: "semana"},
  { label: "Mes",    value: "mes"   },
];

const METODO_LABEL: Record<string, string> = {
  efectivo: "💵 Efectivo", tarjeta: "💳 Tarjeta", transferencia: "📲 Transferencia",
};

function fechaDesde(periodo: string): string {
  const now = new Date();
  if (periodo === "hoy") {
    now.setHours(0, 0, 0, 0);
  } else if (periodo === "semana") {
    const day = now.getDay();
    now.setDate(now.getDate() - day);
    now.setHours(0, 0, 0, 0);
  } else {
    now.setDate(1);
    now.setHours(0, 0, 0, 0);
  }
  return now.toISOString();
}

export default function DashboardScreen({ onBack }: Props) {
  const [periodo,       setPeriodo]       = useState("hoy");
  const [cargando,      setCargando]      = useState(true);
  const [ultimaActual,  setUltimaActual]  = useState("");

  const [totalGeneral,  setTotalGeneral]  = useState(0);
  const [numVentas,     setNumVentas]     = useState(0);
  const [sucursales,    setSucursales]    = useState<VentaSucursal[]>([]);
  const [cajeros,       setCajeros]       = useState<VentaCajero[]>([]);
  const [productos,     setProductos]     = useState<VentaProducto[]>([]);
  const [metodos,       setMetodos]       = useState<VentaMetodo[]>([]);

  const cargar = useCallback(async () => {
    setCargando(true);
    const desde = fechaDesde(periodo);

    // Traer todas las ventas del período
    const { data: ventas } = await supabase
      .from("ventas")
      .select("id, total, metodo_pago, usuario_id, sucursal_id, creada_en")
      .gte("creada_en", desde);

    const { data: items } = await supabase
      .from("venta_items")
      .select("venta_id, nombre_producto, cantidad, subtotal");

    const { data: sucData } = await supabase
      .from("sucursales")
      .select("id, nombre, codigo");

    const { data: usrData } = await supabase
      .from("usuarios")
      .select("id, nombre");

    const v = ventas ?? [];
    const it = items ?? [];

    // Total general
    setTotalGeneral(v.reduce((s: number, x: any) => s + Number(x.total), 0));
    setNumVentas(v.length);

    // Por sucursal
    const sucMap: Record<number, VentaSucursal> = {};
    (sucData ?? []).forEach((s: any) => {
      sucMap[s.id] = { nombre: s.nombre, codigo: s.codigo, total: 0, ventas: 0 };
    });
    v.forEach((x: any) => {
      if (sucMap[x.sucursal_id]) {
        sucMap[x.sucursal_id].total  += Number(x.total);
        sucMap[x.sucursal_id].ventas += 1;
      }
    });
    setSucursales(Object.values(sucMap).filter(s => s.ventas > 0).sort((a, b) => b.total - a.total));

    // Por cajero
    const cajMap: Record<string, VentaCajero> = {};
    (usrData ?? []).forEach((u: any) => {
      cajMap[u.id] = { nombre: u.nombre, total: 0, ventas: 0 };
    });
    v.forEach((x: any) => {
      if (cajMap[x.usuario_id]) {
        cajMap[x.usuario_id].total  += Number(x.total);
        cajMap[x.usuario_id].ventas += 1;
      }
    });
    setCajeros(Object.values(cajMap).filter(c => c.ventas > 0).sort((a, b) => b.total - a.total));

    // Por producto
    const ventaIds = new Set(v.map((x: any) => x.id));
    const prodMap: Record<string, VentaProducto> = {};
    it.filter((i: any) => ventaIds.has(i.venta_id)).forEach((i: any) => {
      if (!prodMap[i.nombre_producto]) {
        prodMap[i.nombre_producto] = { nombre: i.nombre_producto, cantidad: 0, total: 0 };
      }
      prodMap[i.nombre_producto].cantidad += i.cantidad;
      prodMap[i.nombre_producto].total    += Number(i.subtotal);
    });
    setProductos(Object.values(prodMap).sort((a, b) => b.cantidad - a.cantidad));

    // Por método de pago
    const metMap: Record<string, VentaMetodo> = {};
    v.forEach((x: any) => {
      if (!metMap[x.metodo_pago]) metMap[x.metodo_pago] = { metodo: x.metodo_pago, total: 0, ventas: 0 };
      metMap[x.metodo_pago].total  += Number(x.total);
      metMap[x.metodo_pago].ventas += 1;
    });
    setMetodos(Object.values(metMap).sort((a, b) => b.total - a.total));

    setUltimaActual(new Date().toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" }));
    setCargando(false);
  }, [periodo]);

  // Cargar al montar y cuando cambia el período
  useEffect(() => { cargar(); }, [cargar]);

  // Auto-actualizar cada 60 segundos
  useEffect(() => {
    const interval = setInterval(() => { cargar(); }, 60000);
    return () => clearInterval(interval);
  }, [cargar]);

  const maxProducto = productos[0]?.cantidad ?? 1;
  const maxSucursal = sucursales[0]?.total ?? 1;

  return (
    <section>
      <Header titulo="Dashboard" onBack={onBack} />

      {/* Selector de período */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {PERIODOS.map((p) => (
          <button key={p.value} onClick={() => setPeriodo(p.value)} style={{
            flex: 1, padding: "10px", borderRadius: 10, border: "none",
            fontWeight: "bold", fontSize: 13, cursor: "pointer",
            background: periodo === p.value ? colors.primary : "#eee",
            color: periodo === p.value ? "white" : "#555",
          }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Última actualización */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: colors.textMuted }}>
          🕐 Actualizado: {ultimaActual || "—"}
        </span>
        <button onClick={cargar} style={{ background: "none", border: `1px solid ${colors.border}`, borderRadius: 8, padding: "4px 10px", fontSize: 12, cursor: "pointer", color: colors.primary, fontWeight: "bold" }}>
          🔄 Actualizar
        </button>
      </div>

      {cargando ? (
        <div style={{ textAlign: "center", color: colors.textMuted, padding: 40 }}>Cargando...</div>
      ) : (
        <>
          {/* KPIs principales */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <KpiCard label="Total vendido" valor={`L ${fmt(totalGeneral)}`} color={colors.primary} />
            <KpiCard label="Nº de ventas"  valor={fmtNum(numVentas)} />
          </div>

          {/* Ventas por sucursal */}
          <div style={{ ...cardStyle, marginBottom: 14 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>🏪 Por sucursal</h3>
            {sucursales.length === 0 ? (
              <p style={{ color: colors.textMuted, fontSize: 13, textAlign: "center" }}>Sin ventas en este período</p>
            ) : sucursales.map((s) => (
              <div key={s.codigo} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: "bold" }}>{s.codigo} - {s.nombre}</span>
                  <span style={{ fontSize: 13, color: colors.primary, fontWeight: "bold" }}>L {fmt(s.total)}</span>
                </div>
                <div style={{ background: "#f0f0f0", borderRadius: 6, height: 8, overflow: "hidden" }}>
                  <div style={{ background: colors.primary, height: "100%", width: `${(s.total / maxSucursal) * 100}%`, borderRadius: 6, transition: "width 0.5s" }} />
                </div>
                <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{s.ventas} ventas</div>
              </div>
            ))}
          </div>

          {/* Ventas por producto */}
          <div style={{ ...cardStyle, marginBottom: 14 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>🍹 Por producto</h3>
            {productos.length === 0 ? (
              <p style={{ color: colors.textMuted, fontSize: 13, textAlign: "center" }}>Sin ventas en este período</p>
            ) : productos.map((p, i) => (
              <div key={p.nombre} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {i === 0 && <span style={{ fontSize: 14 }}>🏆</span>}
                    <span style={{ fontSize: 13, fontWeight: i === 0 ? "bold" : "normal" }}>{p.nombre}</span>
                  </div>
                  <span style={{ fontSize: 13, color: colors.primary, fontWeight: "bold" }}>{fmtNum(p.cantidad)} uds</span>
                </div>
                <div style={{ background: "#f0f0f0", borderRadius: 6, height: 8, overflow: "hidden" }}>
                  <div style={{ background: i === 0 ? "#f59e0b" : colors.primary, height: "100%", width: `${(p.cantidad / maxProducto) * 100}%`, borderRadius: 6, transition: "width 0.5s" }} />
                </div>
                <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>L {fmt(p.total)}</div>
              </div>
            ))}
          </div>

          {/* Ventas por cajero */}
          <div style={{ ...cardStyle, marginBottom: 14 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>👤 Por cajero</h3>
            {cajeros.length === 0 ? (
              <p style={{ color: colors.textMuted, fontSize: 13, textAlign: "center" }}>Sin ventas en este período</p>
            ) : cajeros.map((c) => (
              <div key={c.nombre} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${colors.border}` }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: "bold" }}>👤 {c.nombre}</div>
                  <div style={{ fontSize: 12, color: colors.textMuted }}>{c.ventas} ventas</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: "bold", color: colors.primary }}>L {fmt(c.total)}</div>
                  <div style={{ fontSize: 12, color: colors.textMuted }}>
                    Prom: L {fmt(c.total / (c.ventas || 1))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Ventas por método de pago */}
          <div style={{ ...cardStyle, marginBottom: 14 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>💳 Por método de pago</h3>
            {metodos.length === 0 ? (
              <p style={{ color: colors.textMuted, fontSize: 13, textAlign: "center" }}>Sin ventas en este período</p>
            ) : metodos.map((m) => {
              const pct = totalGeneral > 0 ? (m.total / totalGeneral) * 100 : 0;
              return (
                <div key={m.metodo} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: "bold" }}>{METODO_LABEL[m.metodo] ?? m.metodo}</span>
                    <span style={{ fontSize: 13, color: colors.primary, fontWeight: "bold" }}>L {fmt(m.total)}</span>
                  </div>
                  <div style={{ background: "#f0f0f0", borderRadius: 6, height: 8, overflow: "hidden" }}>
                    <div style={{ background: colors.primary, height: "100%", width: `${pct}%`, borderRadius: 6, transition: "width 0.5s" }} />
                  </div>
                  <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{pct.toFixed(1)}% · {m.ventas} ventas</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

function KpiCard({ label, valor, color }: { label: string; valor: string; color?: string }) {
  return (
    <div style={{ background: colors.primaryLight, borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: "bold", fontSize: 17, color: color ?? colors.textPrimary }}>{valor}</div>
    </div>
  );
}
