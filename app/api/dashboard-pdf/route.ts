import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const fmt = (n: number) => "L " + Number(n || 0).toLocaleString("es-HN", { minimumFractionDigits: 2 });

export async function GET(req: NextRequest) {
  const hoy      = new Date();
  const fechaStr = hoy.toLocaleDateString("es-HN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const hora     = hoy.toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" });
  const desde    = new Date(hoy); desde.setHours(0, 0, 0, 0);
  const hasta    = new Date(hoy); hasta.setHours(23, 59, 59, 999);

  const { data: ventas } = await supabase.from("ventas")
    .select("id, total, metodo_pago, sucursal_id, usuario_id")
    .gte("creada_en", desde.toISOString())
    .lte("creada_en", hasta.toISOString());

  const { data: sucData } = await supabase.from("sucursales").select("id, nombre, codigo");
  const { data: usrData  } = await supabase.from("usuarios").select("id, nombre");

  const sucMap: Record<string, string> = {};
  (sucData ?? []).forEach((s: any) => { sucMap[String(s.id)] = `${s.codigo} - ${s.nombre}`; });
  const usrMap: Record<string, string> = {};
  (usrData ?? []).forEach((u: any) => { usrMap[u.id] = u.nombre; });

  const v = ventas ?? [];
  const totalVentas    = v.reduce((s, x: any) => s + Number(x.total || 0), 0);
  const numVentas      = v.length;
  const ticketPromedio = numVentas > 0 ? totalVentas / numVentas : 0;
  const utilidad       = totalVentas * 0.36;

  const sucAgg: Record<string, { total: number; num: number }> = {};
  v.forEach((x: any) => {
    const sid = String(x.sucursal_id);
    if (!sucAgg[sid]) sucAgg[sid] = { total: 0, num: 0 };
    sucAgg[sid].total += Number(x.total || 0); sucAgg[sid].num += 1;
  });
  const sucRows = Object.entries(sucAgg).map(([id, d]) => ({ nombre: sucMap[id] || id, ...d })).sort((a, b) => b.total - a.total);
  const maxSuc = sucRows[0]?.total || 1;

  const usrAgg: Record<string, { total: number; num: number }> = {};
  v.forEach((x: any) => {
    if (!x.usuario_id) return;
    if (!usrAgg[x.usuario_id]) usrAgg[x.usuario_id] = { total: 0, num: 0 };
    usrAgg[x.usuario_id].total += Number(x.total || 0); usrAgg[x.usuario_id].num += 1;
  });
  const cajRows = Object.entries(usrAgg).map(([id, d]) => ({ nombre: usrMap[id] || id, ...d })).sort((a, b) => b.total - a.total);

  const ventaIds = v.map((x: any) => x.id);
  let prodRows: { nombre: string; cantidad: number; subtotal: number }[] = [];
  if (ventaIds.length > 0) {
    const { data: items } = await supabase.from("venta_items").select("nombre_producto, cantidad, subtotal").in("venta_id", ventaIds);
    const prodAgg: Record<string, { cantidad: number; subtotal: number }> = {};
    (items ?? []).forEach((i: any) => {
      if (!prodAgg[i.nombre_producto]) prodAgg[i.nombre_producto] = { cantidad: 0, subtotal: 0 };
      prodAgg[i.nombre_producto].cantidad += i.cantidad || 0;
      prodAgg[i.nombre_producto].subtotal += i.subtotal || 0;
    });
    prodRows = Object.entries(prodAgg).map(([nombre, d]) => ({ nombre, ...d })).sort((a, b) => b.cantidad - a.cantidad).slice(0, 8);
  }
  const maxProd = prodRows[0]?.cantidad || 1;

  const metAgg: Record<string, { total: number; num: number }> = {};
  v.forEach((x: any) => {
    const m = x.metodo_pago || "Otro";
    if (!metAgg[m]) metAgg[m] = { total: 0, num: 0 };
    metAgg[m].total += Number(x.total || 0); metAgg[m].num += 1;
  });
  const metRows = Object.entries(metAgg).map(([metodo, d]) => ({ metodo, ...d })).sort((a, b) => b.total - a.total);

  const COLORS = ["#16a34a","#7c3aed","#ea580c","#0284c7","#dc2626","#ca8a04","#0891b2","#9333ea"];
  const medals = ["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣"];
  const bar = (val: number, max: number, color = "#16a34a") =>
    `<div style="flex:1;height:8px;background:#e5e7eb;border-radius:999px;overflow:hidden"><div style="width:${Math.round((val/max)*100)}%;height:100%;background:${color};border-radius:999px"></div></div>`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Dashboard Juice Co.</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',sans-serif;background:#f0fdf4;padding:24px;color:#111827}
.page{max-width:720px;margin:0 auto}
.header{background:#14532d;color:white;padding:20px 24px;border-radius:12px;text-align:center;margin-bottom:16px}
.header h1{font-size:22px;margin-bottom:4px}
.header p{font-size:13px;opacity:.8}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
.kpi{background:white;border:1px solid #e5e7eb;border-radius:12px;padding:14px;text-align:center}
.kpi-icon{background:#dcfce7;border-radius:8px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;margin:0 auto 6px;font-size:16px}
.kpi-label{font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
.kpi-value{font-size:17px;font-weight:800;color:#16a34a;line-height:1.1}
.kpi-sub{font-size:10px;color:#9ca3af;margin-top:2px}
.section{background:white;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:12px}
.section-title{font-size:14px;font-weight:700;color:#111827;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid #f3f4f6}
.row{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.row-label{font-size:12px;color:#374151;min-width:150px}
.row-value{font-size:12px;font-weight:700;color:#16a34a;min-width:90px;text-align:right}
.row-sub{font-size:11px;color:#9ca3af;min-width:55px;text-align:right}
table{width:100%;border-collapse:collapse}
th{font-size:11px;color:#6b7280;font-weight:600;padding:6px 8px;text-align:left;border-bottom:1px solid #f3f4f6}
td{font-size:12px;padding:7px 8px;border-bottom:1px solid #f9fafb}
.footer{text-align:center;font-size:11px;color:#9ca3af;margin-top:16px}
@media print{body{background:white;padding:0}@page{margin:12mm;size:A4}}
</style>
</head><body><div class="page">

<div class="header">
  <h1>🍋 JUICE CO. — Dashboard</h1>
  <p>${fechaStr} · Generado a las ${hora}</p>
</div>

<div class="kpis">
  <div class="kpi"><div class="kpi-icon">💵</div><div class="kpi-label">Total ventas</div><div class="kpi-value">${fmt(totalVentas)}</div><div class="kpi-sub">${numVentas} transacciones</div></div>
  <div class="kpi"><div class="kpi-icon">🧾</div><div class="kpi-label">Ticket prom.</div><div class="kpi-value">${fmt(ticketPromedio)}</div></div>
  <div class="kpi"><div class="kpi-icon">📦</div><div class="kpi-label">Unidades</div><div class="kpi-value">${prodRows.reduce((s,p)=>s+p.cantidad,0)}</div></div>
  <div class="kpi"><div class="kpi-icon">📊</div><div class="kpi-label">Utilidad est.</div><div class="kpi-value">${fmt(utilidad)}</div><div class="kpi-sub">~36% margen</div></div>
</div>

<div class="section">
  <div class="section-title">🏪 Ventas por sucursal</div>
  ${sucRows.length === 0 ? '<p style="color:#9ca3af;font-size:13px;text-align:center">Sin ventas hoy</p>' :
    sucRows.map(s=>`<div class="row"><div class="row-label">${s.nombre}</div>${bar(s.total,maxSuc)}<div class="row-value">${fmt(s.total)}</div><div class="row-sub">${s.num} ventas</div></div>`).join("")}
</div>

<div class="section">
  <div class="section-title">🥤 Top productos</div>
  ${prodRows.length === 0 ? '<p style="color:#9ca3af;font-size:13px;text-align:center">Sin ventas hoy</p>' :
    prodRows.map((p,i)=>`<div class="row"><div class="row-label">${medals[i]||""} ${p.nombre}</div>${bar(p.cantidad,maxProd,COLORS[i%COLORS.length])}<div class="row-value">${p.cantidad} uds</div><div class="row-sub">${fmt(p.subtotal)}</div></div>`).join("")}
</div>

<div class="section">
  <div class="section-title">👤 Por cajero</div>
  <table>
    <thead><tr><th>Cajero</th><th>Ventas</th><th>Total</th><th>Promedio</th></tr></thead>
    <tbody>
      ${cajRows.length===0?'<tr><td colspan="4" style="text-align:center;color:#9ca3af">Sin datos</td></tr>':
        cajRows.map(c=>`<tr><td>${c.nombre}</td><td>${c.num}</td><td style="font-weight:700;color:#16a34a">${fmt(c.total)}</td><td style="color:#6b7280">${fmt(c.total/(c.num||1))}</td></tr>`).join("")}
    </tbody>
  </table>
</div>

<div class="section">
  <div class="section-title">💳 Método de pago</div>
  <table>
    <thead><tr><th>Método</th><th>Ventas</th><th>Total</th><th>%</th></tr></thead>
    <tbody>
      ${metRows.length===0?'<tr><td colspan="4" style="text-align:center;color:#9ca3af">Sin datos</td></tr>':
        metRows.map(m=>`<tr><td style="text-transform:capitalize">${m.metodo}</td><td>${m.num}</td><td style="font-weight:700;color:#16a34a">${fmt(m.total)}</td><td style="color:#6b7280">${totalVentas>0?((m.total/totalVentas)*100).toFixed(0):0}%</td></tr>`).join("")}
    </tbody>
  </table>
</div>

<div class="footer">juiceco.vercel.app · Reporte generado automáticamente</div>
</div>

<script>window.onload=()=>window.print()</script>
</body></html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
