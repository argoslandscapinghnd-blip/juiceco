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
  efectivo:      "Efectivo",
  tarjeta:       "Tarjeta",
  transferencia: "Transferencia",
};

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ConfirmacionScreen({
  total, metodo, montoRecibido, carrito,
  sesionCajaId, sucursalId, usuarioId,
  conFactura, datosFactura,
  onNuevaVenta, onImprimir,
}: Props) {
  const [guardado,       setGuardado]       = useState(false);
  const [ventaId,        setVentaId]        = useState<number | null>(null);
  const [ventaEnSesion,  setVentaEnSesion]  = useState<number | null>(null);
  const [error,          setError]          = useState("");

  const cambio = metodo === "efectivo" && montoRecibido
    ? Math.max(0, montoRecibido - total)
    : null;

  useEffect(() => { guardarVenta(); }, []);

  const guardarVenta = async () => {
    try {
      // 1. Insertar venta
      const { data: venta, error: errVenta } = await supabase
        .from("ventas")
        .insert({
          sesion_id:     sesionCajaId,
          sucursal_id:   sucursalId,
          usuario_id:    usuarioId,
          total,
          metodo_pago:   metodo,
          con_factura:   conFactura,
          rtn:           datosFactura?.rtn    ?? null,
          nombre_fiscal: datosFactura?.nombre ?? null,
          correo_fiscal: datosFactura?.correo ?? null,
        })
        .select()
        .single();

      if (errVenta) throw errVenta;

      // 2. Insertar items
      const { error: errItems } = await supabase
        .from("venta_items")
        .insert(carrito.map((item) => ({
          venta_id:        venta.id,
          nombre_producto: item.nombre,
          cantidad:        item.cantidad,
          precio_unitario: item.precio,
          subtotal:        item.cantidad * item.precio,
        })));

      if (errItems) throw errItems;

      // 3. Contar cuántas ventas lleva esta sesión
      const { count } = await supabase
        .from("ventas")
        .select("*", { count: "exact", head: true })
        .eq("sesion_id", sesionCajaId);

      setVentaId(venta.id);
      setVentaEnSesion(count ?? null);
      setGuardado(true);
    } catch (err: any) {
      setError("Error al guardar venta: " + err.message);
      setGuardado(true);
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

        {/* Número de venta en el turno */}
        {ventaEnSesion !== null && (
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: colors.textMuted }}>Venta </span>
            <span style={{ fontSize: 18, fontWeight: "bold", color: colors.primary }}>
              #{ventaEnSesion}
            </span>
            <span style={{ fontSize: 13, color: colors.textMuted }}> del turno</span>
          </div>
        )}

        {!guardado && (
          <p style={{ color: colors.textMuted, fontSize: 13, marginBottom: 20 }}>Guardando...</p>
        )}
        {error && (
          <p style={{ color: colors.danger, fontSize: 13, marginBottom: 16 }}>⚠️ {error}</p>
        )}

        {/* Resumen */}
        <div style={{ textAlign: "left", marginBottom: 28 }}>
          {carrito.map((item) => (
            <FilaResumen
              key={item.nombre}
              label={`${item.nombre} x${item.cantidad}`}
              valor={`L ${fmt(item.cantidad * item.precio)}`}
            />
          ))}
          <div style={{ borderTop: `2px solid ${colors.border}`, margin: "8px 0" }} />
          <FilaResumen label="Total"  valor={`L ${fmt(total)}`} bold />
          <FilaResumen label="Pago"   valor={METODO_LABEL[metodo]} />
          {cambio !== null && (
            <FilaResumen label="Cambio" valor={`L ${fmt(cambio)}`} color={colors.primary} bold />
          )}
        </div>

        <button style={{ ...btnSecondary, marginBottom: 12 }} onClick={onImprimir}>
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
      <span style={{ fontWeight: bold ? "bold" : "normal", fontSize: 14, color: color ?? "#222" }}>
        {valor}
      </span>
    </div>
  );
}
