"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/supabase";
import { hoyHN, inicioDiaHN, finDiaHN } from "@/lib/utils";

interface KPI { totalVentas: number; numVentas: number; ticketPromedio: number; utilidadReal: number; margenReal: number; }
interface VentaSucursal { sucursal_id: string; nombre: string; total: number; num_ventas: number; cajeros: string[]; }
interface VentaCajero   { usuario_id: string; nombre: string; total: number; num_ventas: number; sucursales: string[]; }
interface VentaProducto { nombre_producto: string; cantidad: number; subtotal: number; }
interface VentaMetodo   { metodo_pago: string; total: number; num_ventas: number; }

const fmt = (n: number) => "L " + n.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const toDateStr = (d: Date) => d.toISOString().split("T")[0];
const startOfWeek = (d: Date) => { const c = new Date(d); c.setDate(c.getDate() - c.getDay()); return c; };
const endOfWeek   = (d: Date) => { const c = new Date(d); c.setDate(c.getDate() + (6 - c.getDay())); return c; };

const COLORS = ["#16a34a","#7c3aed","#ea580c","#0284c7","#dc2626","#ca8a04","#0891b2","#9333ea"];

const Pill = ({ label }: { label: string }) => (
  <span style={{ display: "inline-block", fontSize: 10, fontWeight: 600, color: "#166534", background: "#dcfce7", borderRadius: 999, padding: "1px 7px", marginRight: 3, marginTop: 2, letterSpacing: 0.2 }}>
    {label}
  </span>
);

const Bar = ({ value, max }: { value: number; max: number }) => (
  <div style={{ flex: 1, height: 6, background: "#e5e7eb", borderRadius: 999, overflow: "hidden", margin: "0 10px" }}>
    <div style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, height: "100%", background: "#16a34a", borderRadius: 999, transition: "width 0.5s ease" }} />
  </div>
);

const KpiCard = ({ icon, label, value, sub }: { icon: string; label: string; value: string; sub?: string }) => (
  <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "14px 16px", flex: 1, minWidth: 130 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
      <span style={{ background: "#dcfce7", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
    </div>
    <div style={{ fontSize: 20, fontWeight: 800, color: "#16a34a", lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>{sub}</div>}
  </div>
);

function PieChart({ data, total }: { data: VentaProducto[]; total: number }) {
  if (total === 0 || data.length === 0) return <EmptyRow />;
  let cumAngle = -Math.PI / 2;
  const cx = 70, cy = 70, r = 60;
  const slices = data.slice(0, 6).map((p, i) => {
    const pct   = p.cantidad / total;
    const angle = pct * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle);
    const y1 = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r * Math.cos(cumAngle);
    const y2 = cy + r * Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;
    return { path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, color: COLORS[i % COLORS.length], pct, ...p };
  });
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
      <svg width={140} height={140} viewBox="0 0 140 140" style={{ flexShrink: 0 }}>
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke="#fff" strokeWidth={2} />)}
      </svg>
      <div style={{ flex: 1, minWidth: 130 }}>
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
  const todayStr = hoyHN();

  const [tab,         setTab]         = useState<"hoy" | "semana" | "mes">("hoy");
  const [weekFrom,    setWeekFrom]    = useState(toDateStr(startOfWeek(today)));
  const [weekTo,      setWeekTo]      = useState(toDateStr(endOfWeek(today)));
  const [monthValue,  setMonthValue]  = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`);
  const [sucFiltro,   setSucFiltro]   = useState("todas");
  const [cajFiltro,   setCajFiltro]   = useState("todos");
  const [sucOpciones, setSucOpciones] = useState<{ id: string; nombre: string }[]>([]);
  const [cajOpciones, setCajOpciones] = useState<{ id: string; nombre: string }[]>([]);

  const [kpi,        setKpi]        = useState<KPI | null>(null);
  const [sucursales, setSucursales] = useState<VentaSucursal[]>([]);
  const [cajeros,    setCajeros]    = useState<VentaCajero[]>([]);
  const [productos,  setProductos]  = useState<VentaProducto[]>([]);
  const [metodos,    setMetodos]    = useState<VentaMetodo[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const getRange = useCallback((): { from: string; to: string } => {
    if (tab === "hoy") {
      return { from: inicioDiaHN(), to: finDiaHN() };
    }
    if (tab === "semana") return { from: weekFrom, to: weekTo };
    const [y, m] = monthValue.split("-").map(Number);
    return { from: `${y}-${String(m).padStart(2, "0")}-01`, to: toDateStr(new Date(y, m, 0)) };
  }, [tab, todayStr, weekFrom, weekTo, monthValue]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = getRange();
      const fromTs = from.includes("T") ? from : inicioDiaHN(from);
      const toTs   = to.includes("T")   ? to   : finDiaHN(to);

      const [
        { data: sucData }, { data: usrData },
        { data: recetasData }, { data: productosData },
      ] = await Promise.all([
        supabase.from("sucursales").select("id, nombre, codigo"),
        supabase.from("usuarios").select("id, nombre"),
        supabase.from("recetas").select("producto_id, costo_total"),
        supabase.from("productos").select("id, nombre"),
      ]);

      const sucMap: Record<string, string> = {};
      (sucData || []).forEach((s: any) => { sucMap[String(s.id)] = `${s.codigo} - ${s.nombre}`; });
      const usrMap: Record<string, string> = {};
      (usrData || []).forEach((u: any) => { usrMap[u.id] = u.nombre; });

      // Costo real de receta por nombre de producto
      const costoPorId: Record<number, number> = {};
      (recetasData || []).forEach((r: any) => {
        costoPorId[r.producto_id] = (costoPorId[r.producto_id] || 0) + Number(r.costo_total || 0);
      });
      const costoReceta: Record<string, number> = {};
      (productosData || []).forEach((p: any) => {
        costoReceta[p.nombre] = costoPorId[p.id] || 0;
      });

      setSucOpciones((sucData || []).map((s: any) => ({ id: String(s.id), nombre: `${s.codigo} - ${s.nombre}` })));
      setCajOpciones((usrData || []).map((u: any) => ({ id: u.id, nombre: u.nombre })));

      let q = supabase.from("ventas").select("id, total, metodo_pago, sucursal_id, usuario_id, creada_en")
        .gte("creada_en", fromTs).lte("creada_en", toTs);
      if (sucFiltro !== "todas") q = q.eq("sucursal_id", sucFiltro);
      if (cajFiltro !== "todos") q = q.eq("usuario_id", cajFiltro);

      const { data: ventas } = await q;

      if (!ventas || ventas.length === 0) {
        setKpi({ totalVentas: 0, numVentas: 0, ticketPromedio: 0, utilidadReal: 0, margenReal: 0 });
        setSucursales([]); setCajeros([]); setProductos([]); setMetodos([]);
        setLoading(false); return;
      }

      const totalVentas    = ventas.reduce((s, v) => s + (v.total || 0), 0);
      const numVentas      = ventas.length;
      const ticketPromedio = numVentas > 0 ? totalVentas / numVentas : 0;

      // Costo real se calcula después de obtener venta_items (más abajo)
      // Guardamos el mapa de costos para usarlo en el agregado de productos también

      const sucAgg: Record<string, { total: number; num: number; usuarios: Set<string> }> = {};
      ventas.forEach((v) => {
        const sid = String(v.sucursal_id);
        if (!sucAgg[sid]) sucAgg[sid] = { total: 0, num: 0, usuarios: new Set() };
        sucAgg[sid].total += v.total || 0; sucAgg[sid].num += 1;
        if (v.usuario_id) sucAgg[sid].usuarios.add(v.usuario_id);
      });
      setSucursales(Object.entries(sucAgg).map(([id, d]) => ({
        sucursal_id: id, nombre: sucMap[id] || id, total: d.total, num_ventas: d.num,
        cajeros: [...d.usuarios].map(uid => usrMap[uid] || uid),
      })).sort((a, b) => b.total - a.total));

      const usrAgg: Record<string, { total: number; num: number; sucursales: Set<string> }> = {};
      ventas.forEach((v) => {
        if (!v.usuario_id) return;
        if (!usrAgg[v.usuario_id]) usrAgg[v.usuario_id] = { total: 0, num: 0, sucursales: new Set() };
        usrAgg[v.usuario_id].total += v.total || 0; usrAgg[v.usuario_id].num += 1;
        if (v.sucursal_id) usrAgg[v.usuario_id].sucursales.add(String(v.sucursal_id));
      });
      setCajeros(Object.entries(usrAgg).map(([id, d]) => ({
        usuario_id: id, nombre: usrMap[id] || id, total: d.total, num_ventas: d.num,
        sucursales: [...d.sucursales].map(sid => sucMap[sid] || sid),
      })).sort((a, b) => b.total - a.total));

      const ventaIds = ventas.map(v => v.id);
      const { data: items } = await supabase.from("venta_items")
        .select("nombre_producto, cantidad, subtotal, costo_total").in("venta_id", ventaIds);

      let costoTotal = 0;
      const prodAgg: Record<string, { cantidad: number; subtotal: number }> = {};
      (items || []).forEach((i: any) => {
        if (!prodAgg[i.nombre_producto]) prodAgg[i.nombre_producto] = { cantidad: 0, subtotal: 0 };
        prodAgg[i.nombre_producto].cantidad += i.cantidad || 0;
        prodAgg[i.nombre_producto].subtotal += i.subtotal || 0;
        // Usar costo persistido en la venta; fallback a receta actual para ventas antiguas
        const costo = Number(i.costo_total) > 0
          ? Number(i.costo_total)
          : (i.cantidad || 0) * (costoReceta[i.nombre_producto] || 0);
        costoTotal += costo;
      });
      setProductos(Object.entries(prodAgg).map(([nombre_producto, d]) => ({ nombre_producto, ...d }))
        .sort((a, b) => b.cantidad - a.cantidad).slice(0, 8));

      const utilidadReal = totalVentas - costoTotal;
      const margenReal   = totalVentas > 0 ? (utilidadReal / totalVentas) * 100 : 0;
      setKpi({ totalVentas, numVentas, ticketPromedio, utilidadReal, margenReal });

      const metAgg: Record<string, { total: number; num_ventas: number }> = {};
      ventas.forEach((v) => {
        const m = v.metodo_pago || "Otro";
        if (!metAgg[m]) metAgg[m] = { total: 0, num_ventas: 0 };
        metAgg[m].total += v.total || 0; metAgg[m].num_ventas += 1;
      });
      setMetodos(Object.entries(metAgg).map(([metodo_pago, d]) => ({ metodo_pago, ...d }))
        .sort((a, b) => b.total - a.total));

      setLastUpdate(new Date());
    } catch (err) { console.error("Dashboard error:", err); }
    finally { setLoading(false); }
  }, [getRange, sucFiltro, cajFiltro]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { const i = setInterval(fetchData, 60_000); return () => clearInterval(i); }, [fetchData]);



  const maxSuc  = sucursales[0]?.total   || 1;
  const maxProd = productos[0]?.cantidad || 1;
  const maxMet  = metodos[0]?.total      || 1;
  const medals  = ["🥇", "🥈", "🥉"];
  const totalUnidades = productos.reduce((s, p) => s + p.cantidad, 0);

  const periodLabel = () => {
    if (tab === "hoy")    return `Hoy · ${todayStr}`;
    if (tab === "semana") return `${weekFrom} → ${weekTo}`;
    return monthValue;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0fdf4", fontFamily: "'Segoe UI', system-ui, sans-serif", paddingBottom: 40 }}>
      <div style={{ background: "#14532d", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52, position: "sticky", top: 0, zIndex: 100 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", padding: 4, lineHeight: 1 }}>←</button>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 16, letterSpacing: 0.3 }}>Dashboard</span>
        <button onClick={fetchData} disabled={loading} style={{ background: "none", border: "none", color: "#86efac", fontSize: 18, cursor: "pointer", padding: 4, opacity: loading ? 0.5 : 1 }}>🔄</button>
      </div>

      <div style={{ maxWidth: 540, margin: "0 auto", padding: "0 12px" }}>
        <div style={{ display: "flex", background: "#fff", borderRadius: 12, padding: 4, margin: "14px 0 10px", border: "1px solid #e5e7eb" }}>
          {(["hoy", "semana", "mes"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "7px 0", borderRadius: 9, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, background: tab === t ? "#16a34a" : "transparent", color: tab === t ? "#fff" : "#6b7280", transition: "all 0.2s" }}>
              {t === "hoy" ? "Hoy" : t === "semana" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <select value={sucFiltro} onChange={e => setSucFiltro(e.target.value)} style={{ ...inputStyle, flex: 1, borderRadius: 10, padding: "8px 10px" }}>
            <option value="todas">📍 Todos los puntos</option>
            {sucOpciones.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
          <select value={cajFiltro} onChange={e => setCajFiltro(e.target.value)} style={{ ...inputStyle, flex: 1, borderRadius: 10, padding: "8px 10px" }}>
            <option value="todos">👤 Todos los cajeros</option>
            {cajOpciones.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14 }}>📅</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{periodLabel()}</span>
          </div>
          {tab === "semana" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "#6b7280" }}>De</span>
              <input type="date" value={weekFrom} max={weekTo} onChange={e => setWeekFrom(e.target.value)} style={inputStyle} />
              <span style={{ fontSize: 12, color: "#6b7280" }}>a</span>
              <input type="date" value={weekTo} min={weekFrom} onChange={e => setWeekTo(e.target.value)} style={inputStyle} />
            </div>
          )}
          {tab === "mes" && <input type="month" value={monthValue} onChange={e => setMonthValue(e.target.value)} style={{ ...inputStyle, fontSize: 13 }} />}
          {!loading && <span style={{ fontSize: 10, color: "#9ca3af" }}>↺ {lastUpdate.toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" })}</span>}
        </div>



        {loading && <div style={{ textAlign: "center", padding: "30px 0", color: "#16a34a", fontWeight: 600 }}>Cargando...</div>}

        {!loading && kpi && (
          <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              <KpiCard icon="💵" label="Ventas"       value={fmt(kpi.totalVentas)}      sub={`${kpi.numVentas} transacciones`} />
              <KpiCard icon="🧾" label="Ticket prom." value={fmt(kpi.ticketPromedio)} />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              <KpiCard icon="🥤" label="Unidades"      value={totalUnidades.toString()} />
              <KpiCard icon="📊" label="Utilidad real" value={fmt(kpi.utilidadReal)} sub={`${kpi.margenReal.toFixed(1)}% margen`} />
            </div>

            <Section title="Por sucursal" icon="🏪">
              {sucursales.length === 0 && <EmptyRow />}
              {sucursales.map((s) => (
                <div key={s.sucursal_id} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#111827" }}>{s.nombre}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>{fmt(s.total)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", margin: "4px 0" }}><Bar value={s.total} max={maxSuc} /></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: "#6b7280" }}>{s.num_ventas} ventas</span>
                    {s.cajeros.length > 0 && <span style={{ fontSize: 11, color: "#9ca3af" }}>·</span>}
                    {s.cajeros.map((c) => <Pill key={c} label={`👤 ${c}`} />)}
                  </div>
                </div>
              ))}
            </Section>

            <Section title="Por cajero" icon="👤">
              {cajeros.length === 0 && <EmptyRow />}
              {cajeros.map((c) => (
                <div key={c.usuario_id} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#111827" }}>{c.nombre}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>{fmt(c.total)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
                    <span style={{ fontSize: 11, color: "#6b7280" }}>{c.num_ventas} ventas · prom. {fmt(c.total / c.num_ventas)}</span>
                    {c.sucursales.length > 0 && <><span style={{ fontSize: 11, color: "#9ca3af" }}>·</span>{c.sucursales.map((s) => <Pill key={s} label={`🏪 ${s}`} />)}</>}
                  </div>
                </div>
              ))}
            </Section>

            <Section title="Ventas por sabor (unidades)" icon="🥤">
              {productos.length === 0 ? <EmptyRow /> : (
                <>
                  <PieChart data={productos} total={totalUnidades} />
                  <div style={{ borderTop: "1px solid #f3f4f6", marginTop: 14, paddingTop: 14 }}>
                    {productos.map((p, i) => (
                      <div key={p.nombre_producto} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <span style={{ fontSize: 14, marginRight: 6, minWidth: 20 }}>{medals[i] || "  "}</span>
                          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#111827" }}>{p.nombre_producto}</span>
                          <span style={{ fontSize: 12, color: "#6b7280", marginRight: 6 }}>{p.cantidad} uds</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>{fmt(p.subtotal)}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", marginTop: 4, paddingLeft: 26 }}>
                          <div style={{ flex: 1, height: 6, background: "#e5e7eb", borderRadius: 999, overflow: "hidden" }}>
                            <div style={{ width: `${(p.cantidad / maxProd) * 100}%`, height: "100%", background: COLORS[i % COLORS.length], borderRadius: 999, transition: "width 0.5s" }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Section>

            <Section title="Método de pago" icon="💳">
              {metodos.length === 0 && <EmptyRow />}
              {metodos.map((m) => {
                const pct = ((m.total / (kpi.totalVentas || 1)) * 100).toFixed(0);
                return (
                  <div key={m.metodo_pago} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#111827" }}>{m.metodo_pago}</span>
                      <span style={{ fontSize: 11, color: "#6b7280", marginRight: 6 }}>{pct}%</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>{fmt(m.total)}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", marginTop: 4 }}>
                      <Bar value={m.total} max={maxMet} />
                      <span style={{ fontSize: 11, color: "#9ca3af", minWidth: 60, textAlign: "right" }}>{m.num_ventas} ventas</span>
                    </div>
                  </div>
                );
              })}
            </Section>

            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 16 }}>📊</span>
              <span style={{ fontSize: 12, color: "#6b7280" }}>Resumen general de ventas, unidades, ticket promedio y utilidad.</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "14px 16px", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #f3f4f6" }}>
        <span style={{ fontSize: 15 }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function EmptyRow() {
  return <div style={{ textAlign: "center", padding: "12px 0", color: "#9ca3af", fontSize: 13 }}>Sin datos para este período</div>;
}
