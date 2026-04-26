// ─────────────────────────────────────────────
//  Lemon Lab — Helper para enviar emails
// ─────────────────────────────────────────────
import { supabase } from "@/supabase";
import { esc, fmtL } from "@/lib/utils";

export async function enviarEmailReporte(asunto: string, html: string) {
  try {
    const { data } = await supabase
      .from("email_destinatarios")
      .select("email")
      .eq("activo", true);

    const destinatarios = (data ?? []).map((d: any) => d.email);
    if (destinatarios.length === 0) return { ok: false, msg: "Sin destinatarios activos" };

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? "";

    const res = await fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ destinatarios, asunto, html }),
    });

    const json = await res.json();
    return { ok: res.ok, ...json };
  } catch (err: any) {
    console.error("sendEmail error:", err);
    return { ok: false, msg: err.message };
  }
}

export function htmlCierreCaja({
  cajero, sucursal, fecha, numVentas, totalEfectivo, totalTarjeta,
  totalTransf, fondoInicial, totalContado, diferencia, observacion,
}: {
  cajero: string; sucursal: string; fecha: string; numVentas: number;
  totalEfectivo: number; totalTarjeta: number; totalTransf: number;
  fondoInicial: number; totalContado: number; diferencia: number; observacion?: string;
}) {
  const difColor = diferencia === 0 ? "#16a34a" : diferencia > 0 ? "#2563eb" : "#dc2626";
  const difLabel = diferencia === 0 ? "✅ Cuadrado" : diferencia > 0 ? "🟢 Sobrante" : "🔴 Faltante";
  const signo    = diferencia > 0 ? "+" : "";

  return `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
      <div style="background:#14532d;color:white;padding:16px 20px;border-radius:12px 12px 0 0;text-align:center">
        <h2 style="margin:0;font-size:20px">🍋 Lemon Lab</h2>
        <p style="margin:4px 0 0;font-size:13px;opacity:0.8">Cierre de Caja</p>
      </div>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:20px;border-radius:0 0 12px 12px">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Cajero</td><td style="padding:6px 0;font-weight:bold;text-align:right">${esc(cajero)}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Sucursal</td><td style="padding:6px 0;font-weight:bold;text-align:right">${esc(sucursal)}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Fecha</td><td style="padding:6px 0;font-weight:bold;text-align:right">${esc(fecha)}</td></tr>
          <tr><td colspan="2"><hr style="border:none;border-top:1px solid #e5e7eb;margin:8px 0"/></td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Ventas del turno</td><td style="padding:6px 0;font-weight:bold;text-align:right">${numVentas}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">💵 Efectivo</td><td style="padding:6px 0;text-align:right">${fmtL(totalEfectivo)}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">💳 Tarjeta</td><td style="padding:6px 0;text-align:right">${fmtL(totalTarjeta)}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">📲 Transferencia</td><td style="padding:6px 0;text-align:right">${fmtL(totalTransf)}</td></tr>
          <tr><td colspan="2"><hr style="border:none;border-top:1px solid #e5e7eb;margin:8px 0"/></td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Fondo inicial</td><td style="padding:6px 0;text-align:right">${fmtL(fondoInicial)}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Efectivo contado</td><td style="padding:6px 0;text-align:right">${fmtL(totalContado)}</td></tr>
          <tr><td colspan="2"><hr style="border:none;border-top:2px solid #e5e7eb;margin:8px 0"/></td></tr>
          <tr>
            <td style="padding:8px 0;font-weight:bold;font-size:15px">Diferencia</td>
            <td style="padding:8px 0;font-weight:bold;font-size:15px;text-align:right;color:${difColor}">${signo}${fmtL(diferencia)} ${difLabel}</td>
          </tr>
        </table>
        ${observacion ? `<div style="background:#fff3cd;border-radius:8px;padding:10px;margin-top:12px;font-size:13px"><strong>Observación:</strong> ${esc(observacion)}</div>` : ""}
        <p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:16px">Lemon Lab · Sistema de punto de venta</p>
      </div>
    </div>
  `;
}
