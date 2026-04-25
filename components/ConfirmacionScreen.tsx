"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Pantalla: Confirmación de Venta
// ─────────────────────────────────────────────
import { useEffect, useState } from "react";
import { colors, btnPrimary, btnSecondary, cardStyle } from "./ui/styles";
import { MetodoPago, ItemCarrito, DatosFactura } from "./ui/types";
import { supabase } from "@/supabase";

interface Props {
  total:          number;
  metodo:         MetodoPago;
  montoRecibido?: number;
  carrito:        ItemCarrito[];
  sesionCajaId:   number;
  sucursalId:     number;
  usuarioId:      string;
  conFactura:     boolean;
  datosFactura?:  DatosFactura;
  onNuevaVenta:   () => void;
  onImprimir:     () => void;
}

const METODO_LABEL: Record<MetodoPago, string> = {
  efectivo: "Efectivo", tarjeta: "Tarjeta", transferencia: "Transferencia",
};

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2 });

export default function ConfirmacionScreen({
  total, metodo, montoRecibido, carrito,
  sesionCajaId, sucursalId, usuarioId,
  conFactura, datosFactura,
  onNuevaVenta,
}: Props) {
  const [guardado,      setGuardado]      = useState(false);
  const [ventaEnSesion, setVentaEnSesion] = useState<number | null>(null);
  const [ventaId,       setVentaId]       = useState<number | null>(null);
  const [sucursalNombre, setSucursalNombre] = useState("");
  const [error,         setError]         = useState("");

  const cambio = metodo === "efectivo" && montoRecibido
    ? Math.max(0, montoRecibido - total) : null;

  useEffect(() => { guardarVenta(); }, []);

  const guardarVenta = async () => {
    try {
      // Obtener nombre de sucursal
      const { data: suc } = await supabase
        .from("sucursales").select("nombre, codigo").eq("id", sucursalId).single();
      if (suc) setSucursalNombre(`${suc.codigo} - ${suc.nombre}`);

      const { data: venta, error: errVenta } = await supabase
        .from("ventas")
        .insert({
          sesion_id: sesionCajaId, sucursal_id: sucursalId, usuario_id: usuarioId,
          total, metodo_pago: metodo, con_factura: conFactura,
          rtn: datosFactura?.rtn ?? null, nombre_fiscal: datosFactura?.nombre ?? null,
          correo_fiscal: datosFactura?.correo ?? null,
        })
        .select().single();

      if (errVenta) throw errVenta;

      await supabase.from("venta_items").insert(
        carrito.map((item) => ({
          venta_id: venta.id, nombre_producto: item.nombre,
          cantidad: item.cantidad, precio_unitario: item.precio,
          subtotal: item.cantidad * item.precio,
        }))
      );

      const { count } = await supabase
        .from("ventas").select("*", { count: "exact", head: true })
        .eq("sesion_id", sesionCajaId);

      setVentaId(venta.id);
      setVentaEnSesion(count ?? null);
      setGuardado(true);
    } catch (err: any) {
      setError("Error al guardar venta: " + err.message);
      setGuardado(true);
    }
  };

  const imprimirTicket = () => {
    const fecha = new Date().toLocaleString("es-HN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    const itemsHTML = carrito.map(i =>
      `<tr>
        <td style="padding:2px 0">${i.nombre}</td>
        <td style="text-align:center;padding:2px 4px">${i.cantidad}</td>
        <td style="text-align:right;padding:2px 0">L ${fmt(i.cantidad * i.precio)}</td>
      </tr>`
    ).join("");

    const facturaHTML = conFactura && datosFactura ? `
      <div style="border-top:1px dashed #ccc;margin:8px 0;padding-top:8px">
        <p style="margin:2px 0"><strong>RTN:</strong> ${datosFactura.rtn}</p>
        <p style="margin:2px 0"><strong>Nombre:</strong> ${datosFactura.nombre}</p>
        ${datosFactura.correo ? `<p style="margin:2px 0"><strong>Correo:</strong> ${datosFactura.correo}</p>` : ""}
      </div>` : "";

    const cambioHTML = cambio !== null
      ? `<tr><td>Cambio</td><td></td><td style="text-align:right;color:#2e7d32"><strong>L ${fmt(cambio)}</strong></td></tr>`
      : "";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ticket #${ventaEnSesion}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            width: 80mm;
            margin: 0 auto;
            padding: 8px;
            color: #000;
          }
          .center { text-align: center; }
          .logo { font-size: 20px; font-weight: bold; letter-spacing: 2px; }
          .divider { border: none; border-top: 1px dashed #000; margin: 6px 0; }
          table { width: 100%; border-collapse: collapse; }
          .total-row td { font-weight: bold; font-size: 14px; padding-top: 4px; }
          @media print {
            body { width: 80mm; }
            @page { size: 80mm auto; margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="logo">🍋 JUICE CO.</div>
          <p style="font-size:11px;margin-top:2px">${sucursalNombre}</p>
          <p style="font-size:11px">${fecha}</p>
          <p style="font-size:11px">Venta #${ventaEnSesion} del turno</p>
        </div>

        <hr class="divider">

        ${facturaHTML}

        <table>
          <thead>
            <tr style="border-bottom:1px solid #000">
              <th style="text-align:left;padding-bottom:4px">Producto</th>
              <th style="text-align:center">Cant</th>
              <th style="text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHTML}</tbody>
        </table>

        <hr class="divider">

        <table>
          <tr class="total-row">
            <td>TOTAL</td><td></td>
            <td style="text-align:right">L ${fmt(total)}</td>
          </tr>
          <tr>
            <td>Pago</td><td></td>
            <td style="text-align:right">${METODO_LABEL[metodo]}</td>
          </tr>
          ${cambioHTML}
        </table>

        <hr class="divider">
        <p class="center" style="font-size:11px;margin-top:4px">¡Gracias por su compra!</p>
        <p class="center" style="font-size:10px;color:#666">juiceco.vercel.app</p>
      </body>
      </html>
    `;

    const ventana = window.open("", "_blank", "width=400,height=600");
    if (ventana) {
      ventana.document.write(html);
      ventana.document.close();
      ventana.focus();
      setTimeout(() => {
        ventana.print();
        ventana.close();
        onNuevaVenta(); // regresa al menú después de imprimir
      }, 500);
    }
  };

  return (
    <section>
      <div style={{ ...cardStyle, textAlign: "center", padding: "40px 24px" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: colors.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 36 }}>
          ✅
        </div>

        <h2 style={{ color: colors.primary, fontSize: 22, marginTop: 0, marginBottom: 4 }}>
          ¡Venta realizada!
        </h2>

        {ventaEnSesion !== null && (
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: colors.textMuted }}>Venta </span>
            <span style={{ fontSize: 18, fontWeight: "bold", color: colors.primary }}>#{ventaEnSesion}</span>
            <span style={{ fontSize: 13, color: colors.textMuted }}> del turno</span>
          </div>
        )}

        {!guardado && <p style={{ color: colors.textMuted, fontSize: 13, marginBottom: 20 }}>Guardando...</p>}
        {error && <p style={{ color: colors.danger, fontSize: 13, marginBottom: 16 }}>⚠️ {error}</p>}

        <div style={{ textAlign: "left", marginBottom: 28 }}>
          {carrito.map((item) => (
            <FilaResumen key={item.nombre} label={`${item.nombre} x${item.cantidad}`} valor={`L ${fmt(item.cantidad * item.precio)}`} />
          ))}
          <div style={{ borderTop: `2px solid ${colors.border}`, margin: "8px 0" }} />
          <FilaResumen label="Total"  valor={`L ${fmt(total)}`} bold />
          <FilaResumen label="Pago"   valor={METODO_LABEL[metodo]} />
          {cambio !== null && (
            <FilaResumen label="Cambio" valor={`L ${fmt(cambio)}`} color={colors.primary} bold />
          )}
        </div>

        <button
          style={{ ...btnSecondary, marginBottom: 12, opacity: guardado ? 1 : 0.5 }}
          onClick={imprimirTicket}
          disabled={!guardado}
        >
          🖨️ IMPRIMIR TICKET
        </button>
        <button style={btnPrimary} onClick={onNuevaVenta}>
          NUEVA VENTA
        </button>
      </div>
    </section>
  );
}

function FilaResumen({ label, valor, color, bold }: {
  label: string; valor: string; color?: string; bold?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
      <span style={{ color: "#888", fontSize: 14 }}>{label}</span>
      <span style={{ fontWeight: bold ? "bold" : "normal", fontSize: 14, color: color ?? "#222" }}>{valor}</span>
    </div>
  );
}
