"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/supabase";

interface KPI { totalVentas: number; numVentas: number; ticketPromedio: number; utilidadEstimada: number; }
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
  const todayStr = toDateStr(today);

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
  const [enviando,   setEnviando]   = useState(false);

  const getRange = useCallback((): { from: string; to: string } => {
    if (tab === "hoy") return { from: todayStr, to: todayStr };
    if (tab === "semana") return { from: weekFrom, to: weekTo };
    const [y, m] = monthValue.split("-").map(Number);
    return { from: `${y}-${String(m).padStart(2, "0")}-01`, to: toDateStr(new Date(y, m, 0)) };
  }, [tab, todayStr, weekFrom, weekTo, monthValue]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = getRange();
      const fromTs = `${from}T00:00:00`;
      const toTs   = `${to}T23:59:59`;

      const { data: sucData } = await supabase.from("sucursales").select("id, nombre, codigo");
      const { data: usrData } = await supabase.from("usuarios").select("id, nombre");

      const sucMap: Record<string, string> = {};
      (sucData || []).forEach((s: any) => { sucMap[String(s.id)] = `${s.codigo} - ${s.nombre}`; });
      const usrMap: Record<string, string> = {};
      (usrData || []).forEach((u: any) => { usrMap[u.id] = u.nombre; });

      setSucOpciones((sucData || []).map((s: any) => ({ id: String(s.id), nombre: `${s.codigo} - ${s.nombre}` })));
      setCajOpciones((usrData || []).map((u: any) => ({ id: u.id, nombre: u.nombre })));

      let q = supabase.from("ventas").select("id, total, metodo_pago, sucursal_id, usuario_id, creada_en")
        .gte("creada_en", fromTs).lte("creada_en", toTs);
      if (sucFiltro !== "todas") q = q.eq("sucursal_id", sucFiltro);
      if (cajFiltro !== "todos") q = q.eq("usuario_id", cajFiltro);

      const { data: ventas } = await q;

      if (!ventas || ventas.length === 0) {
        setKpi({ totalVentas: 0, numVentas: 0, ticketPromedio: 0, utilidadEstimada: 0 });
        setSucursales([]); setCajeros([]); setProductos([]); setMetodos([]);
        setLoading(false); return;
      }

      const totalVentas      = ventas.reduce((s, v) => s + (v.total || 0), 0);
      const numVentas        = ventas.length;
      const ticketPromedio   = numVentas > 0 ? totalVentas / numVentas : 0;
      const utilidadEstimada = totalVentas * 0.36;
      setKpi({ totalVentas, numVentas, ticketPromedio, utilidadEstimada });

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
        .select("nombre_producto, cantidad, subtotal").in("venta_id", ventaIds);
      const prodAgg: Record<string, { cantidad: number; subtotal: number }> = {};
      (items || []).forEach((i: any) => {
        if (!prodAgg[i.nombre_producto]) prodAgg[i.nombre_producto] = { cantidad: 0, subtotal: 0 };
        prodAgg[i.nombre_producto].cantidad += i.cantidad || 0;
        prodAgg[i.nombre_producto].subtotal += i.subtotal || 0;
      });
      setProductos(Object.entries(prodAgg).map(([nombre_producto, d]) => ({ nombre_producto, ...d }))
        .sort((a, b) => b.cantidad - a.cantidad).slice(0, 8));

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

  // ── Generar y enviar PDF por email ──
  const handleEnviarPDF = async () => {
    if (!kpi) return;
    setEnviando(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const fecha = new Date().toLocaleDateString("es-HN", { day: "2-digit", month: "2-digit", year: "numeric" });
      const hora  = new Date().toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" });
      const W = 210, margin = 16;
      let y = 0;

      // Header
      doc.setFillColor(20, 83, 45);
      doc.rect(0, 0, W, 28, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18); doc.setFont("helvetica", "bold");
      doc.text("JUICE CO. — Dashboard", W / 2, 12, { align: "center" });
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      doc.text(`${fecha} · Generado a las ${hora}`, W / 2, 22, { align: "center" });
      y = 36;

      // KPIs
      doc.setTextColor(17, 24, 39);
      const kpiData = [
        { label: "Total Ventas", value: fmt(kpi.totalVentas), sub: `${kpi.numVentas} transacciones` },
        { label: "Ticket Prom.", value: fmt(kpi.ticketPromedio), sub: "" },
        { label: "Unidades", value: String(productos.reduce((s, p) => s + p.cantidad, 0)), sub: "" },
        { label: "Utilidad Est.", value: fmt(kpi.utilidadEstimada), sub: "~36% margen" },
      ];
      const kpiW = (W - margin * 2 - 9) / 4;
      kpiData.forEach((k, i) => {
        const x = margin + i * (kpiW + 3);
        doc.setFillColor(240, 253, 244);
        doc.roundedRect(x, y, kpiW, 22, 3, 3, "F");
        doc.setFontSize(7); doc.setFont("helvetica", "bold");
        doc.setTextColor(107, 114, 128);
        doc.text(k.label.toUpperCase(), x + kpiW / 2, y + 6, { align: "center" });
        doc.setFontSize(11); doc.setFont("helvetica", "bold");
        doc.setTextColor(22, 163, 74);
        doc.text(k.value, x + kpiW / 2, y + 14, { align: "center" });
        if (k.sub) {
          doc.setFontSize(7); doc.setFont("helvetica", "normal");
          doc.setTextColor(156, 163, 175);
          doc.text(k.sub, x + kpiW / 2, y + 19, { align: "center" });
        }
      });
      y += 30;

      const drawSection = (title: string) => {
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(margin, y, W - margin * 2, 8, 2, 2, "F");
        doc.setFontSize(10); doc.setFont("helvetica", "bold");
        doc.setTextColor(17, 24, 39);
        doc.text(title, margin + 4, y + 5.5);
        y += 12;
      };

      const drawBar = (val: number, max: number, bx: number, by: number, bw: number, color: number[]) => {
        doc.setFillColor(229, 231, 235);
        doc.roundedRect(bx, by, bw, 3, 1, 1, "F");
        const filled = max > 0 ? (val / max) * bw : 0;
        if (filled > 0) {
          doc.setFillColor(color[0], color[1], color[2]);
          doc.roundedRect(bx, by, filled, 3, 1, 1, "F");
        }
      };

      // Sucursales
      if (sucursales.length > 0) {
        drawSection("🏪  Por sucursal");
        const maxS = sucursales[0].total;
        sucursales.forEach(s => {
          doc.setFontSize(9); doc.setFont("helvetica", "normal");
          doc.setTextColor(55, 65, 81);
          doc.text(s.nombre, margin, y + 3);
          drawBar(s.total, maxS, margin + 70, y, 80, [22, 163, 74]);
          doc.setFont("helvetica", "bold"); doc.setTextColor(22, 163, 74);
          doc.text(fmt(s.total), W - margin, y + 3, { align: "right" });
          doc.setFont("helvetica", "normal"); doc.setTextColor(156, 163, 175);
          doc.setFontSize(7);
          doc.text(`${s.num_ventas} ventas`, margin + 70, y + 8);
          y += 12;
        });
        y += 4;
      }

      // Productos
      if (productos.length > 0) {
        drawSection("🥤  Top productos");
        const maxP = productos[0].cantidad;
        const medals = ["1°","2°","3°","4°","5°","6°","7°","8°"];
        const colHex = ["#16a34a","#7c3aed","#ea580c","#0284c7","#dc2626","#ca8a04","#0891b2","#9333ea"];
        productos.forEach((p, i) => {
          const hex = colHex[i % colHex.length];
          const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
          doc.setFontSize(9); doc.setFont("helvetica", "bold");
          doc.setTextColor(107, 114, 128);
          doc.text(medals[i], margin, y + 3);
          doc.setFont("helvetica", "normal"); doc.setTextColor(55, 65, 81);
          doc.text(p.nombre_producto, margin + 8, y + 3);
          drawBar(p.cantidad, maxP, margin + 80, y, 70, [r, g, b]);
          doc.setFont("helvetica", "bold"); doc.setTextColor(r, g, b);
          doc.text(`${p.cantidad} uds`, W - margin - 22, y + 3);
          doc.setTextColor(22, 163, 74);
          doc.text(fmt(p.subtotal), W - margin, y + 3, { align: "right" });
          y += 10;
        });
        y += 4;
      }

      // Cajeros
      if (cajeros.length > 0) {
        drawSection("👤  Por cajero");
        doc.setFontSize(8); doc.setFont("helvetica", "bold");
        doc.setTextColor(107, 114, 128);
        doc.text("Cajero", margin, y);
        doc.text("Ventas", margin + 80, y);
        doc.text("Total", margin + 110, y);
        doc.text("Promedio", W - margin, y, { align: "right" });
        y += 6;
        cajeros.forEach(c => {
          doc.setFont("helvetica", "normal"); doc.setTextColor(55, 65, 81);
          doc.text(c.nombre, margin, y);
          doc.text(String(c.num_ventas), margin + 80, y);
          doc.setTextColor(22, 163, 74); doc.setFont("helvetica", "bold");
          doc.text(fmt(c.total), margin + 110, y);
          doc.setTextColor(107, 114, 128); doc.setFont("helvetica", "normal");
          doc.text(fmt(c.total / (c.num_ventas || 1)), W - margin, y, { align: "right" });
          y += 8;
        });
        y += 4;
      }

      // Métodos
      if (metodos.length > 0) {
        drawSection("💳  Método de pago");
        const maxM = metodos[0].total;
        metodos.forEach(m => {
          const pct = kpi.totalVentas > 0 ? ((m.total / kpi.totalVentas) * 100).toFixed(0) : "0";
          doc.setFontSize(9); doc.setFont("helvetica", "normal");
          doc.setTextColor(55, 65, 81);
          const label = m.metodo_pago.charAt(0).toUpperCase() + m.metodo_pago.slice(1);
          doc.text(label, margin, y + 3);
          drawBar(m.total, maxM, margin + 50, y, 90, [22, 163, 74]);
          doc.setFont("helvetica", "bold"); doc.setTextColor(22, 163, 74);
          doc.text(fmt(m.total), W - margin - 12, y + 3);
          doc.setTextColor(107, 114, 128); doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.text(`${pct}% · ${m.num_ventas} ventas`, margin + 50, y + 8);
          y += 12;
        });
      }

      // Footer
      doc.setFontSize(8); doc.setTextColor(156, 163, 175);
      doc.text("juiceco.vercel.app · Reporte generado automáticamente", W / 2, 285, { align: "center" });

      // Convertir a base64
      const pdfBase64 = doc.output("datauristring").split(",")[1];

      // Enviar email con PDF adjunto
      const { data: destData } = await supabase.from("email_destinatarios").select("email").eq("activo", true);
      const destinatarios = (destData ?? []).map((d: any) => d.email);

      if (destinatarios.length === 0) {
        alert("⚠️ No hay destinatarios activos. Agrega destinatarios en el módulo de Emails.");
        setEnviando(false); return;
      }

      const res = await fetch("/api/email-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinatarios,
          asunto: `📊 Dashboard Juice Co. — ${fecha} ${hora}`,
          pdfBase64,
          fileName: `dashboard-juiceco-${fecha.replace(/\//g, "-")}.pdf`,
        }),
      });

      const data = await res.json();
      if (data.ok) alert(`✅ Dashboard enviado a ${destinatarios.length} destinatario(s)`);
      else alert(`⚠️ Error: ${data.error || "No se pudo enviar"}`);
    } catch (err: any) {
      console.error(err);
      alert("Error generando el PDF: " + err.message);
    }
    setEnviando(false);
  };

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

        {/* Botón enviar PDF */}
        {kpi && !loading && (
          <button
            onClick={handleEnviarPDF}
            disabled={enviando}
            style={{ width: "100%", marginBottom: 12, padding: "12px", borderRadius: 10, border: "none", background: enviando ? "#9ca3af" : "#0284c7", color: "white", fontWeight: 700, fontSize: 14, cursor: enviando ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            {enviando ? "⏳ Generando PDF..." : "📧 ENVIAR DASHBOARD POR EMAIL (PDF)"}
          </button>
        )}

        {loading && <div style={{ textAlign: "center", padding: "30px 0", color: "#16a34a", fontWeight: 600 }}>Cargando...</div>}

        {!loading && kpi && (
          <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              <KpiCard icon="💵" label="Ventas"       value={fmt(kpi.totalVentas)}      sub={`${kpi.numVentas} transacciones`} />
              <KpiCard icon="🧾" label="Ticket prom." value={fmt(kpi.ticketPromedio)} />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              <KpiCard icon="📦" label="Unidades"      value={totalUnidades.toString()} />
              <KpiCard icon="📊" label="Utilidad est." value={fmt(kpi.utilidadEstimada)} sub="~36% margen" />
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
