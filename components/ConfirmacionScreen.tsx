"use client";
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
  usuarioNombre:  string;
  conFactura:     boolean;
  datosFactura?:  DatosFactura;
  onNuevaVenta:   () => void;
}

const METODO_LABEL: Record<MetodoPago, string> = {
  efectivo: "Efectivo", tarjeta: "Tarjeta", transferencia: "Transferencia",
};

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2 });

export default function ConfirmacionScreen({
  total, metodo, montoRecibido, carrito,
  sesionCajaId, sucursalId, usuarioId,
  usuarioNombre, conFactura, datosFactura,
  onNuevaVenta,
}: Props) {
  const [guardado,       setGuardado]       = useState(false);
  const [ventaEnSesion,  setVentaEnSesion]  = useState<number | null>(null);
  const [ventaId,        setVentaId]        = useState<number | null>(null);
  const [sucursalNombre, setSucursalNombre] = useState("");
  const [error,          setError]          = useState("");

  const cambio = metodo === "efectivo" && montoRecibido
    ? Math.max(0, montoRecibido - total) : null;

  useEffect(() => { guardarVenta(); }, []);

  const guardarVenta = async () => {
    try {
      const { data: suc } = await supabase
        .from("sucursales").select("nombre, codigo").eq("id", sucursalId).single();
      if (suc) setSucursalNombre(`${suc.codigo} - ${suc.nombre}`);

      const { data: venta, error: errVenta } = await supabase
        .from("ventas")
        .insert({
          sesion_id: sesionCajaId, sucursal_id: sucursalId, usuario_id: usuarioId,
          total, metodo_pago: metodo, con_factura: conFactura,
          creada_en: new Date().toISOString(),
          rtn:             datosFactura?.rtn    ?? null,
          nombre_fiscal:   datosFactura?.nombre ?? null,
          correo_fiscal:   datosFactura?.correo ?? null,
        })
        .select().single();

      if (errVenta) throw errVenta;

      const { error: errItems } = await supabase.from("venta_items").insert(
        carrito.map((item) => ({
          venta_id: venta.id, nombre_producto: item.nombre,
          cantidad: item.cantidad, precio_unitario: item.precio,
          subtotal: item.cantidad * item.precio,
        }))
      );
      if (errItems) throw errItems;

      setVentaId(venta.id);

      const { count } = await supabase
        .from("ventas").select("*", { count: "exact", head: true })
        .eq("sesion_id", sesionCajaId);

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
      <!DOCTYPE html><html><head>
        <meta charset="UTF-8">
        <title>Ticket #${ventaEnSesion}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; margin: 0 auto; padding: 8px; color: #000; }
          .center { text-align: center; }
          .logo { font-size: 20px; font-weight: bold; letter-spacing: 2px; }
          .divider { border: none; border-top: 1px dashed #000; margin: 6px 0; }
          table { width: 100%; border-collapse: collapse; }
          .total-row td { font-weight: bold; font-size: 14px; padding-top: 4px; }
          @media print { body { width: 80mm; } @page { size: 80mm auto; margin: 0; } }
        </style>
      </head><body>
        <div class="center">
          <div class="logo">🍋 Lemon Lab</div>
          <p style="font-size:11px;margin-top:2px">${sucursalNombre}</p>
          <p style="font-size:11px">Cajero: ${usuarioNombre}</p>
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
        <p class="center" style="font-size:10px;color:#666">Lemon Lab — Limonadas artesanales</p>
      </body></html>`;

    const ventana = window.open("", "_blank", "width=400,height=600");
    if (ventana) {
      ventana.document.write(html);
      ventana.document.close();
      ventana.focus();
      setTimeout(() => { ventana.print(); ventana.close(); }, 500);
    }
  };

  const descargarFacturaPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const pageW  = 210;
    const margin = 20;
    const colR   = pageW - margin;
    let y        = 20;

    const fecha = new Date().toLocaleString("es-HN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    const numFactura = `LL-${new Date().getFullYear()}-${String(ventaId ?? 0).padStart(6, "0")}`;

    // Encabezado
    doc.setFillColor(8, 122, 43);
    doc.rect(0, 0, pageW, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Lemon Lab", margin, 13);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Limonadas artesanales", margin, 20);
    doc.text(`No. ${numFactura}`, colR, 13, { align: "right" });
    doc.text(fecha, colR, 20, { align: "right" });

    y = 38;
    doc.setTextColor(0, 0, 0);

    // Datos de la sucursal / cajero
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Sucursal: ${sucursalNombre}`, margin, y);
    doc.text(`Cajero: ${usuarioNombre}`, margin, y + 5);
    y += 14;

    // Datos del cliente (si con factura)
    if (conFactura && datosFactura) {
      doc.setFillColor(240, 247, 240);
      doc.rect(margin, y, pageW - margin * 2, 22, "F");
      doc.setTextColor(8, 122, 43);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("DATOS DEL CLIENTE", margin + 3, y + 6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(`RTN: ${datosFactura.rtn}`, margin + 3, y + 12);
      doc.text(`Nombre: ${datosFactura.nombre}`, margin + 3, y + 17);
      if (datosFactura.correo) doc.text(`Correo: ${datosFactura.correo}`, margin + 80, y + 12);
      y += 28;
    }

    // Tabla de productos
    doc.setFillColor(8, 122, 43);
    doc.rect(margin, y, pageW - margin * 2, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Producto", margin + 3, y + 5.5);
    doc.text("Cant.", margin + 95, y + 5.5, { align: "right" });
    doc.text("Precio", margin + 120, y + 5.5, { align: "right" });
    doc.text("Subtotal", colR, y + 5.5, { align: "right" });
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    carrito.forEach((item, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(margin, y - 2, pageW - margin * 2, 7, "F");
      }
      doc.setFontSize(9);
      doc.text(item.nombre, margin + 3, y + 3);
      doc.text(String(item.cantidad), margin + 95, y + 3, { align: "right" });
      doc.text(`L ${fmt(item.precio)}`, margin + 120, y + 3, { align: "right" });
      doc.text(`L ${fmt(item.cantidad * item.precio)}`, colR, y + 3, { align: "right" });
      y += 7;
    });

    // Línea divisora
    y += 3;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, colR, y);
    y += 6;

    // Total
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("TOTAL", margin + 3, y);
    doc.text(`L ${fmt(total)}`, colR, y, { align: "right" });
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`Método de pago: ${METODO_LABEL[metodo]}`, margin + 3, y);
    if (cambio !== null) {
      y += 5;
      doc.setTextColor(8, 122, 43);
      doc.text(`Cambio: L ${fmt(cambio)}`, margin + 3, y);
    }

    // Pie
    y = 275;
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text("Lemon Lab · Limonadas artesanales", pageW / 2, y, { align: "center" });

    doc.save(`factura-${numFactura}.pdf`);
  };

  return (
    <section>
      <div style={{ ...cardStyle, textAlign: "center", padding: "40px 24px" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: colors.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 36 }}>
          ✅
        </div>
        <h2 style={{ color: colors.primary, fontSize: 22, marginTop: 0, marginBottom: 4 }}>¡Venta realizada!</h2>
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
          <FilaResumen label="Total" valor={`L ${fmt(total)}`} bold />
          <FilaResumen label="Pago"  valor={METODO_LABEL[metodo]} />
          {cambio !== null && <FilaResumen label="Cambio" valor={`L ${fmt(cambio)}`} color={colors.primary} bold />}
        </div>
        <button style={{ ...btnSecondary, marginBottom: 10, opacity: guardado ? 1 : 0.5 }} onClick={imprimirTicket} disabled={!guardado}>
          🖨️ IMPRIMIR TICKET
        </button>
        {conFactura && datosFactura && (
          <button style={{ ...btnSecondary, marginBottom: 10, opacity: guardado ? 1 : 0.5 }} onClick={descargarFacturaPDF} disabled={!guardado}>
            📄 DESCARGAR FACTURA PDF
          </button>
        )}
        <button style={btnPrimary} onClick={onNuevaVenta}>NUEVA VENTA</button>
      </div>
    </section>
  );
}

function FilaResumen({ label, valor, color, bold }: { label: string; valor: string; color?: string; bold?: boolean; }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
      <span style={{ color: "#888", fontSize: 14 }}>{label}</span>
      <span style={{ fontWeight: bold ? "bold" : "normal", fontSize: 14, color: color ?? "#222" }}>{valor}</span>
    </div>
  );
}
