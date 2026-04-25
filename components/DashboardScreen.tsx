"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/supabase";

interface KPI { totalVentas: number; numVentas: number; ticketPromedio: number; utilidadEstimada: number; unidades: number; }
interface VentaSucursal { sucursal_id: string; nombre: string; total: number; num_ventas: number; cajeros: string[]; }
interface VentaCajero   { usuario_id: string; nombre: string; total: number; num_ventas: number; sucursales: string[]; }
interface VentaProducto { nombre_producto: string; cantidad: number; subtotal: number; }
interface VentaMetodo   { metodo_pago: string; total: number; num_ventas: number; }

const fmt = (n: number) => "L " + n.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const toDateStr = (d: Date) => d.toISOString().split("T")[0];
const startOfWeek = (d: Date) => { const c = new Date(d); c.setDate(c.getDate() - c.getDay()); return c; };
const endOfWeek   = (d: Date) => { const c = new Date(d); c.setDate(c.getDate() + (6 - c.getDay())); return c; };

const COLORS = ["#16a34a","#7c3aed","#ea580c","#0284c7","#dc2626","#ca8a04","#0891b2","#9333ea"];

// ── Pie Chart SVG ──
function PieChart({ data, total }: { data: VentaProducto[]; total: number }) {
  if (total === 0) return <div style={{ textAlign: "center", color: "#9ca3af", padding: 20 }}>Sin datos</div>;

  let cumAngle = -Math.PI / 2;
  const cx = 80, cy = 80, r = 70;

  const slices = data.slice(0, 6).map((p, i) => {
    const pct   = p.cantidad / total;
    const angle = pct * 2 * Math.PI;
    const x1    = cx + r * Math.cos(cumAngle);
    const y1    = cy + r * Math.sin(cumAngle);
    cumAngle   += angle;
    const x2    = cx + r * Math.cos(cumAngle);
    const y2    = cy + r * Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;
    return { path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, color: COLORS[i % COLORS.length], pct, ...p };
  });

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
      <svg width={160} height={160} viewBox="0 0 160 160">
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke="#fff" strokeWidth={2} />)}
      </svg>
      <div style={{ flex: 1, minWidth: 140 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, flex: 1, color: "#374151" }}>{s.nombre_producto}</span>
            <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{s.cantidad} ({(s.pct * 100).toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { fontSize: 12, border: "1px solid #d1d5db", borderRadius: 8, padding: "4px 8px", outline: "none", color: "#111827", background: "#f9fafb", cursor: "pointer" };

export default function DashboardScreen({ onBack }: { onBack: () => void }) {
  const today    = new Date();
  const todayStr = toDateStr(today);

  const [tab,        setTab]        = useState<"hoy" | "semana" | "mes">("hoy");
  const [weekFrom,   setWeekFrom]   = useState(toDateStr(startOfWeek(today)));
  const [weekTo,     setWeekTo]     = useState(toDateStr(endOfWeek(today)));
  const [monthValue, setMonthValue] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`);
  const [sucFiltro,  setSucFiltro]  = useState<string>("todas");
  const [sucOpciones, setSucOpciones] = useState<{ id: string; nombre: string }[]>([]);

  const [kpi,        setKpi]        = useState<KPI | null>(null);
  const [kpiAyer,    setKpiAyer]    = useState<KPI | null>(null);
  const [sucursales, setSucursales] = useState<VentaSucursal[]>([]);
  const [cajeros,    setCajeros]    = useState<VentaCajero[]>([]);
  const [productos,  setProductos]  = useState<VentaProducto[]>([]);
  const [metodos,    setMetodos]    = useState<VentaMetodo[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const getRange = useCallback((): { from: string; to: string } => {
    if (tab === "hoy") return { from: todayStr, to: todayStr };
    if (tab === "semana") return { from: weekFrom, to: weekTo };
    const [y, m] = monthValue.split("-").map(Number);
    return { from: `${y}-${String(m).padStart(2, "0")}-01`, to: toDateStr(new Date(y, m, 0)) };
  }, [tab, todayStr, weekFrom, weekTo, monthValue]);

  const calcKPI = (ventas: any[], items: any[]): KPI => {
    const totalVentas      = ventas.reduce((s, v) => s + (v.total || 0), 0);
    const numVentas        = ventas.length;
    const ticketPromedio   = numVentas > 0 ? totalVentas / numVentas : 0;
    const utilidadEstimada = totalVentas * 0.36;
    const ventaIds         = new Set(ventas.map(v => v.id));
    const unidades         = items.filter((i: any) => ventaIds.has(i.venta_id)).reduce((s: number, i: any) => s + (i.cantidad || 0), 0);
    return { totalVentas, numVentas, ticketPromedio, utilidadEstimada, unidades };
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Cargar sucursales para filtro
      const { data: sucData } = await supabase.from("sucursales").select("id, nombre, codigo");
      const { data: usrData  } = await supabase.from("usuarios").select("id, nombre");
      setSucOpciones((sucData || []).map((s: any) => ({ id: String(s.id), nombre: `${s.codigo} - ${s.nombre}` })));

      const sucMap: Record<string, string> = {};
      (sucData || []).forEach((s: any) => { sucMap[String(s.id)] = `${s.codigo} - ${s.nombre}`; });
      const usrMap: Record<string, string> = {};
      (usrData || []).forEach((u: any) => { usrMap[u.id] = u.nombre; });

      const { from, to } = getRange();
      const fromTs = `${from}T00:00:00`;
      const toTs   = `${to}T23:59:59`;

      // Ayer para comparativo
      const ayer     = new Date(today); ayer.setDate(ayer.getDate() - 1);
      const ayerStr  = toDateStr(ayer);
      const ayerFrom = `${ayerStr}T00:00:00`;
      const ayerTo   = `${ayerStr}T23:59:59`;

      let ventasQ = supabase.from("ventas").select("id, total, metodo_pago, sucursal_id, usuario_id, creada_en").gte("creada_en", fromTs).lte("creada_en", toTs);
      if (sucFiltro !== "todas") ventasQ = ventasQ.eq("sucursal_id", sucFiltro);

      const { data: ventas } = await ventasQ;
      const { data: ventasAyer } = await supabase.from("ventas").select("id, total, metodo_pago, sucursal_id, usuario_id, creada_en").gte("creada_en", ayerFrom).lte("creada_en", ayerTo);
      const { data: allItems }   = await supabase.from("venta_items").select("venta_id, nombre_producto, cantidad, subtotal");

      const v  = ventas || [];
      const va = ventasAyer || [];
      const it = allItems || [];

      setKpi(calcKPI(v, it));
      setKpiAyer(calcKPI(va, it));

      if (v.length === 0) {
        setSucursales([]); setCajeros([]); setProductos([]); setMetodos([]);
        setLoading(false); return;
      }

      // Sucursales
      const sucAgg: Record<string, { total: number; num: number; usuarios: Set<string> }> = {};
      v.forEach((x: any) => {
        const sid = String(x.sucursal_id);
        if (!sucAgg[sid]) sucAgg[sid] = { total: 0, num: 0, usuarios: new Set() };
        sucAgg[sid].total += x.total || 0; sucAgg[sid].num += 1;
        if (x.usuario_id) sucAgg[sid].usuarios.add(x.usuario_id);
      });
      setSucursales(Object.entries(sucAgg).map(([id, d]) => ({
        sucursal_id: id, nombre: sucMap[id] || id, total: d.total, num_ventas: d.num,
        cajeros: [...d.usuarios].map(uid => usrMap[uid] || uid),
      })).sort((a, b) => b.total - a.total));

      // Cajeros
      const usrAgg: Record<string, { total: number; num: number; suc: Set<string> }> = {};
      v.forEach((x: any) => {
        if (!x.usuario_id) return;
        if (!usrAgg[x.usuario_id]) usrAgg[x.usuario_id] = { total: 0, num: 0, suc: new Set() };
        usrAgg[x.usuario_id].total += x.total || 0; usrAgg[x.usuario_id].num += 1;
        if (x.sucursal_id) usrAgg[x.usuario_id].suc.add(String(x.sucursal_id));
      });
      setCajeros(Object.entries(usrAgg).map(([id, d]) => ({
        usuario_id: id, nombre: usrMap[id] || id, total: d.total, num_ventas: d.num,
        sucursales: [...d.suc].map(sid => sucMap[sid] || sid),
      })).sort((a, b) => b.total - a.total));

      // Productos
      const ventaIds = new Set(v.map((x: any) => x.id));
      const prodAgg: Record<string, { cantidad: number; subtotal: number }> = {};
      it.filter((i: any) => ventaIds.has(i.venta_id)).forEach((i: any) => {
        if (!prodAgg[i.nombre_producto]) prodAgg[i.nombre_producto] = { cantidad: 0, subtotal: 0 };
        prodAgg[i.nombre_producto].cantidad += i.cantidad || 0;
        prodAgg[i.nombre_producto].subtotal += i.subtotal || 0;
      });
      setProductos(Object.entries(prodAgg).map(([nombre_producto, d]) => ({ nombre_producto, ...d })).sort((a, b) => b.cantidad - a.cantidad).slice(0, 8));

      // Métodos
      const metAgg: Record<string, { total: number; num_ventas: number }> = {};
      v.forEach((x: any) => {
        const m = x.metodo_pago || "Otro";
        if (!metAgg[m]) metAgg[m] = { total: 0, num_ventas: 0 };
        metAgg[m].total += x.total || 0; metAgg[m].num_ventas += 1;
      });
      setMetodos(Object.entries(metAgg).map(([metodo_pago, d]) => ({ metodo_pago, ...d })).sort((a, b) => b.total - a.total));

      setLastUpdate(new Date());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [getRange, sucFiltro]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { const i = setInterval(fetchData, 60_000); return () => clearInterval(i); }, [fetchData]);

  const maxSuc  = sucursales[0]?.total   || 1;
  const maxProd = productos[0]?.cantidad || 1;
  const totalUnidades = productos.reduce((s, p) => s + p.cantidad, 0);

  const delta = (curr: number, prev: number) => {
    if (!prev) return null;
    const pct = ((curr - prev) / prev) * 100;
    return { pct: pct.toFixed(1), positive: pct >= 0 };
  };

  const periodLabel = () => {
    if (tab === "hoy")    return todayStr;
    if (tab === "semana") return `${weekFrom} → ${weekTo}`;
    return monthValue;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0fdf4", fontFamily: "'Segoe UI', system-ui, sans-serif", paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ background: "#14532d", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52, position: "sticky", top: 0, zIndex: 100 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", padding: 4 }}>←</button>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>Dashboard</span>
        <button onClick={fetchData} disabled={loading} style={{ background: "none", border: "none", color: "#86efac", fontSize: 18, cursor: "pointer", opacity: loading ? 0.5 : 1 }}>🔄</button>
      </div>

      <div style={{ maxWidth: 540, margin: "0 auto", padding: "0 12px" }}>

        {/* Filtros: fecha + sucursal */}
        <div style={{ display: "flex", gap: 8, margin: "14px 0 10px", flexWrap: "wrap" }}>
          {/* Tabs período */}
          <div style={{ display: "flex", background: "#fff", borderRadius: 10, padding: 3, border: "1px solid #e5e7eb", flex: 1 }}>
            {(["hoy","semana","mes"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "6px 0", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12, background: tab === t ? "#16a34a" : "transparent", color: tab === t ? "#fff" : "#6b7280" }}>
                {t === "hoy" ? "Hoy" : t === "semana" ? "Semana" : "Mes"}
              </button>
            ))}
          </div>
          {/* Filtro sucursal */}
          <select value={sucFiltro} onChange={e => setSucFiltro(e.target.value)} style={{ ...inputStyle, borderRadius: 10, padding: "6px 10px", fontSize: 12 }}>
            <option value="todas">📍 Todos los puntos</option>
            {sucOpciones.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>

        {/* Sub-filtros para semana/mes */}
        {tab === "semana" && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 12px", marginBottom: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>📅</span>
            <input type="date" value={weekFrom} max={weekTo} onChange={e => setWeekFrom(e.target.value)} style={inputStyle} />
            <span style={{ fontSize: 12, color: "#6b7280" }}>→</span>
            <input type="date" value={weekTo} min={weekFrom} onChange={e => setWeekTo(e.target.value)} style={inputStyle} />
          </div>
        )}
        {tab === "mes" && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 12px", marginBottom: 10 }}>
            <input type="month" value={monthValue} onChange={e => setMonthValue(e.target.value)} style={{ ...inputStyle, fontSize: 13 }} />
          </div>
        )}

        {/* Período activo */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>📅 {periodLabel()}</span>
          {!loading && <span style={{ fontSize: 10, color: "#9ca3af" }}>↺ {lastUpdate.toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" })}</span>}
        </div>

        {loading && <div style={{ textAlign: "center", padding: "30px 0", color: "#16a34a", fontWeight: 600 }}>Cargando...</div>}

        {!loading && kpi && (
          <>
            {/* KPI Cards — 2x2 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              {[
                { icon: "💵", label: "VENTAS DEL DÍA",    value: fmt(kpi.totalVentas),      prev: kpiAyer?.totalVentas },
                { icon: "📦", label: "UNIDADES VENDIDAS",  value: String(kpi.unidades),       prev: kpiAyer?.unidades, noFmt: true },
                { icon: "🧾", label: "TICKET PROMEDIO",    value: fmt(kpi.ticketPromedio),    prev: kpiAyer?.ticketPromedio },
                { icon: "📊", label: "UTILIDAD ESTIMADA",  value: fmt(kpi.utilidadEstimada),  prev: kpiAyer?.utilidadEstimada },
              ].map(({ icon, label, value, prev }) => {
                const d = prev !== undefined ? delta(parseFloat(value.replace(/[^0-9.-]/g, "")), prev) : null;
                return (
                  <div key={label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <span style={{ background: "#dcfce7", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{icon}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, lineHeight: 1.2 }}>{label}</span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#16a34a", lineHeight: 1.1 }}>{value}</div>
                    {d && (
                      <div style={{ fontSize: 10, color: d.positive ? "#16a34a" : "#dc2626", marginTop: 3 }}>
                        vs. Ayer {d.positive ? "+" : ""}{d.pct}%
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Ventas por sucursal */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "14px 16px", marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #f3f4f6" }}>🏪 Ventas por punto de venta</div>
              {sucursales.length === 0 ? <EmptyRow /> : sucursales.map(s => (
                <div key={s.sucursal_id} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ flex: 1, fontSize: 12, color: "#374151" }}>{s.nombre}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>{fmt(s.total)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ flex: 1, height: 8, background: "#e5e7eb", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ width: `${(s.total / maxSuc) * 100}%`, height: "100%", background: "#16a34a", borderRadius: 999, transition: "width 0.5s" }} />
                    </div>
                    <span style={{ fontSize: 10, color: "#9ca3af", minWidth: 50 }}>{s.num_ventas} ventas</span>
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 12, height: 12, borderRadius: 2, background: "#16a34a" }} /><span style={{ fontSize: 10, color: "#6b7280" }}>Ventas</span></div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 12, height: 12, borderRadius: 2, background: "#e5e7eb" }} /><span style={{ fontSize: 10, color: "#6b7280" }}>Resto del total</span></div>
              </div>
            </div>

            {/* Ventas por sabor (pie chart) */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "14px 16px", marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #f3f4f6" }}>🥤 Ventas por sabor (unidades)</div>
              <PieChart data={productos} total={totalUnidades} />
            </div>

            {/* Cajeros */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "14px 16px", marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #f3f4f6" }}>👤 Por cajero</div>
              {cajeros.length === 0 ? <EmptyRow /> : cajeros.map(c => (
                <div key={c.usuario_id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f9fafb" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.nombre}</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>{c.num_ventas} ventas · prom. {fmt(c.total / (c.num_ventas || 1))}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#16a34a", alignSelf: "center" }}>{fmt(c.total)}</div>
                </div>
              ))}
            </div>

            {/* Método de pago */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "14px 16px", marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #f3f4f6" }}>💳 Método de pago</div>
              {metodos.length === 0 ? <EmptyRow /> : metodos.map((m, i) => {
                const pct = kpi.totalVentas > 0 ? ((m.total / kpi.totalVentas) * 100).toFixed(0) : "0";
                return (
                  <div key={m.metodo_pago} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>{m.metodo_pago}</span>
                      <span style={{ fontSize: 11, color: "#6b7280", marginRight: 8 }}>{pct}%</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>{fmt(m.total)}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ flex: 1, height: 6, background: "#e5e7eb", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: COLORS[i % COLORS.length], borderRadius: 999 }} />
                      </div>
                      <span style={{ fontSize: 10, color: "#9ca3af", minWidth: 50 }}>{m.num_ventas} ventas</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>📊</span>
              <span style={{ fontSize: 12, color: "#6b7280" }}>Resumen general de ventas, unidades, ticket promedio y utilidad.</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyRow() {
  return <div style={{ textAlign: "center", padding: "12px 0", color: "#9ca3af", fontSize: 13 }}>Sin datos para este período</div>;
}
