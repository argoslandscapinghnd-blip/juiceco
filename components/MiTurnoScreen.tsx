"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Mi Turno (Cajero)
//  Ventas del turno + inventario + cierre de caja
// ─────────────────────────────────────────────
import { useEffect, useState } from "react";
import { Header, Divider } from "./ui/components";
import { colors, cardStyle, btnPrimary } from "./ui/styles";
import { supabase } from "@/supabase";

const META_VENTA_DIARIA = 3000;

interface ResumenVentas {
  total: number;
  numVentas: number;
  cantidadArticulos: number;
  efectivo: number;
  tarjeta: number;
  transferencia: number;
  topProducto: string;
  topProductoCantidad: number;
}

interface Insumo {
  id: number;
  nombre: string;
  unidad: string;
  stock_actual: number;
  stock_minimo: number;
}

interface Props {
  sesionCajaId: number;
  sucursalId: number;
  fondoInicial: number;
  usuario: string;
  onBack: () => void;
  onCerrarCaja: () => void;
}

export default function MiTurnoScreen({
  sesionCajaId,
  sucursalId,
  fondoInicial,
  usuario,
  onBack,
  onCerrarCaja,
}: Props) {
  const [resumen, setResumen] = useState<ResumenVentas | null>(null);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);

    const { data: ventas } = await supabase
      .from("ventas")
      .select("id, total, metodo_pago")
      .eq("sesion_id", sesionCajaId);

    const v = ventas ?? [];
    const ventaIds = v.map((venta: any) => venta.id);

    let items: any[] = [];

    if (ventaIds.length > 0) {
      const { data: itemsData } = await supabase
        .from("venta_items")
        .select("venta_id, nombre_producto, cantidad")
        .in("venta_id", ventaIds);

      items = itemsData ?? [];
    }

    const totalGeneral = v.reduce((s: number, x: any) => s + Number(x.total || 0), 0);

    const totalEfectivo = v
      .filter((x: any) => x.metodo_pago === "efectivo")
      .reduce((s: number, x: any) => s + Number(x.total || 0), 0);

    const totalTarjeta = v
      .filter((x: any) => x.metodo_pago === "tarjeta")
      .reduce((s: number, x: any) => s + Number(x.total || 0), 0);

    const totalTransf = v
      .filter((x: any) => x.metodo_pago === "transferencia")
      .reduce((s: number, x: any) => s + Number(x.total || 0), 0);

    const cantidadArticulos = items.reduce(
      (s: number, item: any) => s + Number(item.cantidad || 0),
      0
    );

    const conteo: Record<string, number> = {};

    items.forEach((item: any) => {
      const nombreProducto = item.nombre_producto || "Producto sin nombre";
      const cantidad = Number(item.cantidad || 0);
      conteo[nombreProducto] = (conteo[nombreProducto] ?? 0) + cantidad;
    });

    const topProductoEntry = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0];

    setResumen({
      total: totalGeneral,
      numVentas: v.length,
      cantidadArticulos,
      efectivo: totalEfectivo,
      tarjeta: totalTarjeta,
      transferencia: totalTransf,
      topProducto: topProductoEntry?.[0] ?? "—",
      topProductoCantidad: topProductoEntry?.[1] ?? 0,
    });

    const { data: inv } = await supabase
      .from("insumos")
      .select("*")
      .eq("sucursal_id", sucursalId)
      .order("nombre");

    setInsumos((inv ?? []) as Insumo[]);
    setCargando(false);
  };

  const porcentajeMeta = resumen
    ? Math.min((resumen.total / META_VENTA_DIARIA) * 100, 100)
    : 0;

  if (cargando) {
    return (
      <section>
        <Header titulo="Mi Turno" onBack={onBack} />
        <div style={{ textAlign: "center", color: colors.textMuted, padding: 40 }}>
          Cargando...
        </div>
      </section>
    );
  }

  return (
    <section>
      <Header titulo="Mi Turno" onBack={onBack} />

      <div style={{ ...cardStyle, background: colors.primaryLight, marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: colors.primary }}>Cajero</div>
        <div style={{ fontWeight: "bold", fontSize: 16, color: colors.primaryDark }}>
          👤 {usuario}
        </div>
        <div style={{ fontSize: 12, color: colors.primary, marginTop: 4 }}>
          Fondo inicial: <strong>L {Number(fondoInicial).toFixed(2)}</strong>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15, color: colors.textPrimary }}>
          📊 Ventas del turno
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <MetricaBox label="Total vendido" valor={`L ${resumen?.total.toFixed(2)}`} color={colors.primary} />
          <MetricaBox label="Nº de ventas" valor={`${resumen?.numVentas}`} />
          <MetricaBox label="Artículos vendidos" valor={`${resumen?.cantidadArticulos}`} />
          <MetricaBox label="Meta diaria" valor={`L ${META_VENTA_DIARIA.toFixed(2)}`} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
            <span style={{ color: colors.textMuted }}>Avance de meta diaria</span>
            <strong style={{ color: colors.primary }}>{porcentajeMeta.toFixed(0)}%</strong>
          </div>

          <div
            style={{
              width: "100%",
              height: 12,
              background: colors.border,
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${porcentajeMeta}%`,
                height: "100%",
                background: colors.primary,
                borderRadius: 999,
                transition: "width 0.3s ease",
              }}
            />
          </div>

          <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 6 }}>
            L {resumen?.total.toFixed(2)} de L {META_VENTA_DIARIA.toFixed(2)}
          </div>
        </div>

        <Divider />

        <FilaTurno label="💵 Efectivo" valor={`L ${resumen?.efectivo.toFixed(2)}`} />
        <FilaTurno label="💳 Tarjeta" valor={`L ${resumen?.tarjeta.toFixed(2)}`} />
        <FilaTurno label="📲 Transferencia" valor={`L ${resumen?.transferencia.toFixed(2)}`} />

        <Divider />

        <FilaTurno
          label="🏆 Más vendido"
          valor={
            resumen?.topProducto === "—"
              ? "—"
              : `${resumen?.topProducto} (${resumen?.topProductoCantidad})`
          }
        />
      </div>

      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15, color: colors.textPrimary }}>
          📦 Inventario de la sucursal
        </h3>

        {insumos.length === 0 ? (
          <p style={{ color: colors.textMuted, fontSize: 14, textAlign: "center" }}>
            No hay insumos registrados para esta sucursal.
          </p>
        ) : (
          insumos.map((ins) => {
            const bajo = ins.stock_actual <= ins.stock_minimo;

            return (
              <div
                key={ins.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <div>
                  <span
                    style={{
                      fontWeight: "bold",
                      fontSize: 14,
                      color: bajo ? colors.danger : colors.textPrimary,
                    }}
                  >
                    {bajo ? "⚠️ " : ""}
                    {ins.nombre}
                  </span>
                  <span style={{ fontSize: 12, color: colors.textMuted, marginLeft: 6 }}>
                    (mín. {ins.stock_minimo} {ins.unidad})
                  </span>
                </div>

                <span
                  style={{
                    fontWeight: "bold",
                    fontSize: 15,
                    color: bajo ? colors.danger : colors.primary,
                  }}
                >
                  {ins.stock_actual} {ins.unidad}
                </span>
              </div>
            );
          })
        )}
      </div>

      <button style={{ ...btnPrimary, background: colors.danger }} onClick={onCerrarCaja}>
        🔒 CERRAR CAJA
      </button>
    </section>
  );
}

function MetricaBox({
  label,
  valor,
  color,
}: {
  label: string;
  valor: string;
  color?: string;
}) {
  return (
    <div style={{ background: colors.primaryLight, borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: "bold", fontSize: 18, color: color ?? colors.textPrimary }}>
        {valor}
      </div>
    </div>
  );
}

function FilaTurno({ label, valor }: { label: string; valor: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 14 }}>
      <span style={{ color: colors.textMuted }}>{label}</span>
      <span style={{ fontWeight: "bold", color: colors.textPrimary }}>{valor}</span>
    </div>
  );
}