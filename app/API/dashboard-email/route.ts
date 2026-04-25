import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const fmt = (n: number) => "L " + Number(n || 0).toLocaleString("es-HN", { minimumFractionDigits: 2 });

export async function GET() {
  return await enviarDashboard();
}

export async function POST() {
  return await enviarDashboard();
}

async function enviarDashboard() {
  try {
    // 1. Destinatarios activos
    const { data: destData } = await supabase.from("email_destinatarios").select("email").eq("activo", true);
    const destinatarios = (destData ?? []).map((d: any) => d.email);
    if (destinatarios.length === 0) return NextResponse.json({ ok: false, msg: "Sin destinatarios activos" });

    // 2. Datos del día
    const hoy     = new Date();
    const fechaStr = hoy.toLocaleDateString("es-HN", { day: "2-digit", month: "2-digit", year: "numeric" });
    const desde   = new Date(hoy); desde.setHours(0, 0, 0, 0);
    const hasta   = new Date(hoy); hasta.setHours(23, 59, 59, 999);

    const { data: ventas } = await supabase.from("ventas")
      .select("id, total, metodo_pago, sucursal_id, usuario_id")
      .gte("creada_en", desde.toISOString())
      .lte("creada_en", hasta.toISOString());

    const v = ventas ?? [];
    const totalVentas     = v.reduce((s: number, x: any) => s + Number(x.total || 0), 0);
    const numVentas       = v.length;
    const ticketPromedio  = numVentas > 0 ? totalVentas / numVentas : 0;
    const utilidad        = totalVentas * 0.36;

    // Por sucursal
    const { data: sucData } = await supabase.from("sucursales").select("id, nombre, codigo");
    const sucMap: Record<string, string> = {};
    (sucData ?? []).forEach((s: any) => { sucMap[String(s.id)] = `${s.codigo} - ${s.nombre}`; });

    const sucAgg: Record<string, { total: number; num: number }> = {};
    v.forEach((x: any) => {
      const sid = String(x.sucursal_id);
      if (!sucAgg[sid]) sucAgg[sid] = { total: 0, num: 0 };
      sucAgg[sid].total += Number(x.total || 0);
      sucAgg[sid].num   += 1;
    });
    const sucRows = Object.entries(sucAgg)
      .map(([id, d]) => ({ nombre: sucMap[id] || id, ...d }))
      .sort((a, b) => b.total - a.total);

    // Por producto
    const ventaIds = v.map((x: any) => x.id);
    let prodRows: { nombre: string; cantidad: number; subtotal: number }[] = [];
    if (ventaIds.length > 0) {
      const { data: items } = await supabase.from("venta_items")
        .select("nombre_producto, cantidad, subtotal").in("venta_id", ventaIds);
      const prodAgg: Record<string, { cantidad: number; subtotal: number }> = {};
      (items ?? []).forEach((i: any) => {
        if (!prodAgg[i.nombre_producto]) prodAgg[i.nombre_producto] = { cantidad: 0, subtotal: 0 };
        prodAgg[i.nombre_producto].cantidad += i.cantidad || 0;
        prodAgg[i.nombre_producto].subtotal += i.subtotal || 0;
      });
      prodRows = Object.entries(prodAgg)
        .map(([nombre, d]) => ({ nombre, ...d }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5);
    }

    // Por método
    const metAgg: Record<string, number> = {};
    v.forEach((x: any) => { metAgg[x.metodo_pago] = (metAgg[x.metodo_pago] || 0) + Number(x.total || 0); });

    // 3. Generar HTML
    const hora = hoy.toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" });

    const sucHtml = sucRows.map(s =>
      `<tr><td style="padding:5px 0;color:#374151">${s.nombre}</td><td style="padding:5px 0;text-align:right;font-weight:bold;color:#16a34a">${fmt(s.total)}</td><td style="padding:5px 0;text-align:right;color:#6b7280;font-size:12px">${s.num} ventas</td></tr>`
    ).join("");

    const prodHtml = prodRows.map((p, i) =>
      `<tr><td style="padding:5px 0;color:#374151">${["🥇","🥈","🥉","4️⃣","5️⃣"][i] || ""} ${p.nombre}</td><td style="padding:5px 0;text-align:right;font-weight:bold;color:#16a34a">${p.cantidad} uds</td><td style="padding:5px 0;text-align:right;color:#6b7280;font-size:12px">${fmt(p.subtotal)}</td></tr>`
    ).join("");

    const metHtml = Object.entries(metAgg).map(([m, t]) =>
      `<tr><td style="padding:5px 0;color:#374151;text-transform:capitalize">${m}</td><td style="padding:5px 0;text-align:right;font-weight:bold;color:#16a34a">${fmt(t)}</td><td style="padding:5px 0;text-align:right;color:#6b7280;font-size:12px">${((t / totalVentas) * 100).toFixed(0)}%</td></tr>`
    ).join("");

    const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:20px">
      <div style="background:#14532d;color:white;padding:16px 20px;border-radius:12px 12px 0 0;text-align:center">
        <h2 style="margin:0;font-size:20px">🍋 JUICE CO.</h2>
        <p style="margin:4px 0 0;font-size:13px;opacity:0.8">Resumen del día · ${fechaStr} · ${hora}</p>
      </div>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:20px;border-radius:0 0 12px 12px">

        <!-- KPIs -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px">
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:12px;text-align:center">
            <div style="font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:700">Total ventas</div>
            <div style="font-size:22px;font-weight:800;color:#16a34a">${fmt(totalVentas)}</div>
            <div style="font-size:11px;color:#9ca3af">${numVentas} transacciones</div>
          </div>
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:12px;text-align:center">
            <div style="font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:700">Ticket promedio</div>
            <div style="font-size:22px;font-weight:800;color:#16a34a">${fmt(ticketPromedio)}</div>
            <div style="font-size:11px;color:#9ca3af">Utilidad est. ${fmt(utilidad)}</div>
          </div>
        </div>

        <!-- Por sucursal -->
        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:14px;margin-bottom:12px">
          <div style="font-weight:700;font-size:14px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #f3f4f6">🏪 Por sucursal</div>
          <table style="width:100%;border-collapse:collapse">${sucHtml || '<tr><td colspan="3" style="text-align:center;color:#9ca3af;padding:10px">Sin ventas</td></tr>'}</table>
        </div>

        <!-- Por producto -->
        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:14px;margin-bottom:12px">
          <div style="font-weight:700;font-size:14px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #f3f4f6">🥤 Top productos</div>
          <table style="width:100%;border-collapse:collapse">${prodHtml || '<tr><td colspan="3" style="text-align:center;color:#9ca3af;padding:10px">Sin ventas</td></tr>'}</table>
        </div>

        <!-- Por método -->
        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:14px;margin-bottom:12px">
          <div style="font-weight:700;font-size:14px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #f3f4f6">💳 Método de pago</div>
          <table style="width:100%;border-collapse:collapse">${metHtml || '<tr><td colspan="3" style="text-align:center;color:#9ca3af;padding:10px">Sin ventas</td></tr>'}</table>
        </div>

        <p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:16px">juiceco.vercel.app · Generado automáticamente</p>
      </div>
    </div>`;

    // 4. Enviar
    await transporter.sendMail({
      from: `"Juice Co. POS" <${process.env.GMAIL_USER}>`,
      to:   destinatarios.join(","),
      subject: `📊 Dashboard Juice Co. — ${fechaStr} ${hora}`,
      html,
    });

    return NextResponse.json({ ok: true, enviado_a: destinatarios.length });
  } catch (err: any) {
    console.error("Dashboard email error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
