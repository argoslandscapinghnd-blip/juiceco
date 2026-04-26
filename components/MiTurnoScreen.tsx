"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Mi Turno (Cajero)
// ─────────────────────────────────────────────
import { useEffect, useState } from "react";
import { Header, Divider } from "./ui/components";
import { colors, cardStyle, btnPrimary } from "./ui/styles";
import { supabase } from "@/supabase";

const META_VENTA_DIARIA = 3000;

const money = (n: number) =>
  Number(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
  const [resumen,  setResumen]  = useState<ResumenVentas | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    setError("");

    const { data: ventas, error: errVentas } = await supabase
      .from("ventas")
      .select("id, total, metodo_pago")
      .eq("sesion_id", sesionCajaId);

    if (errVentas) { setError("Error cargando ventas: " + errVentas.message); setCargando(false); return; }
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
      const nombreProducto = item.nombre_producto || "Producto";
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

      {error && (
        <div style={{ background: "#fdecea", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#c62828" }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ ...cardStyle, background: colors.primaryLight, marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: colors.primary }}>Cajero</div>
        <div style={{ fontWeight: "bold", fontSize: 16, color: colors.primaryDark }}>
          👤 {usuario}
        </div>
        <div style={{ fontSize: 12, color: colors.primary, marginTop: 4 }}>
          Fondo inicial: <strong>L {money(fondoInicial)}</strong>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>📊 Ventas del turno</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <MetricaBox label="Total vendido" valor={`L ${money(resumen!.total)}`} />
          <MetricaBox label="Nº de ventas" valor={`${resumen!.numVentas}`} />
          <MetricaBox label="Artículos vendidos" valor={`${resumen!.cantidadArticulos}`} />
          <MetricaBox label="Meta diaria" valor={`L ${money(META_VENTA_DIARIA)}`} />
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span>Avance</span>
            <strong>{porcentajeMeta.toFixed(0)}%</strong>
          </div>

          <div style={{ height: 10, background: "#eee", borderRadius: 10 }}>
            <div
              style={{
                width: `${porcentajeMeta}%`,
                height: "100%",
                background: colors.primary,
                borderRadius: 10,
              }}
            />
          </div>

          <div style={{ fontSize: 12 }}>
            L {money(resumen!.total)} de L {money(META_VENTA_DIARIA)}
          </div>
        </div>

        <Divider />

        <FilaTurno label="💵 Efectivo" valor={`L ${money(resumen!.efectivo)}`} />
        <FilaTurno label="💳 Tarjeta" valor={`L ${money(resumen!.tarjeta)}`} />
        <FilaTurno label="📲 Transferencia" valor={`L ${money(resumen!.transferencia)}`} />

        <Divider />

        <FilaTurno
          label="🏆 Más vendido"
          valor={`${resumen!.topProducto} (${resumen!.topProductoCantidad})`}
        />
      </div>

      <button style={{ ...btnPrimary, background: colors.danger }} onClick={onCerrarCaja}>
        🔒 CERRAR CAJA
      </button>
    </section>
  );
}

function MetricaBox({ label, valor }: { label: string; valor: string }) {
  return (
    <div style={{ background: colors.primaryLight, borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 12 }}>{label}</div>
      <div style={{ fontWeight: "bold", fontSize: 18 }}>{valor}</div>
    </div>
  );
}

function FilaTurno({ label, valor }: { label: string; valor: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: 6 }}>
      <span>{label}</span>
      <strong>{valor}</strong>
    </div>
  );
}