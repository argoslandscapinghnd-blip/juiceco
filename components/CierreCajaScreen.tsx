"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Cierre de Caja
// ─────────────────────────────────────────────
import { useEffect, useState } from "react";
import { Header, Divider } from "./ui/components";
import { colors, cardStyle, btnPrimary, btnSecondary } from "./ui/styles";
import { supabase } from "@/supabase";

interface Props {
  sesionCajaId: number;
  sucursalId:   number;
  fondoInicial: number;
  usuario:      string;
  onCerrado:    () => void;
  onBack:       () => void;
}

const BILLETES  = [1000, 500, 200, 100, 50, 20, 10];
const MONEDAS   = [5, 2, 1, 0.50, 0.20, 0.10];
const TODAS     = [...BILLETES, ...MONEDAS];

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2 });

export default function CierreCajaScreen({
  sesionCajaId, sucursalId, fondoInicial, usuario, onCerrado, onBack,
}: Props) {
  // Cantidades por denominación
  const [cantidades, setCantidades] = useState<Record<number, string>>({});

  // Resumen ventas
  const [totalEfectivo,   setTotalEfectivo]   = useState(0);
  const [totalTarjeta,    setTotalTarjeta]    = useState(0);
  const [totalTransf,     setTotalTransf]     = useState(0);
  const [numVentas,       setNumVentas]       = useState(0);
  const [cargando,        setCargando]        = useState(true);
  const [confirmando,     setConfirmando]     = useState(false);
  const [cerrando,        setCerrando]        = useState(false);
  const [observacion,     setObservacion]     = useState("");

  useEffect(() => {
    cargarVentas();
  }, []);

  const cargarVentas = async () => {
    setCargando(true);
    const { data } = await supabase
      .from("ventas")
      .select("total, metodo_pago")
      .eq("sesion_id", sesionCajaId);

    const v = data ?? [];
    setNumVentas(v.length);
    setTotalEfectivo(v.filter((x: any) => x.metodo_pago === "efectivo").reduce((s: number, x: any) => s + Number(x.total), 0));
    setTotalTarjeta(v.filter((x: any) => x.metodo_pago === "tarjeta").reduce((s: number, x: any) => s + Number(x.total), 0));
    setTotalTransf(v.filter((x: any) => x.metodo_pago === "transferencia").reduce((s: number, x: any) => s + Number(x.total), 0));
    setCargando(false);
  };

  const setCantidad = (denom: number, val: string) => {
    setCantidades(prev => ({ ...prev, [denom]: val }));
  };

  // Total contado en caja
  const totalContado = TODAS.reduce((s, d) => {
    const cant = parseFloat(cantidades[d] || "0") || 0;
    return s + cant * d;
  }, 0);

  // Monto esperado = fondo inicial + ventas en efectivo
  const montoEsperado = fondoInicial + totalEfectivo;
  const diferencia    = totalContado - montoEsperado;

  const handleCerrar = async () => {
    setCerrando(true);
    await supabase
      .from("sesiones_caja")
      .update({
        activa:           false,
        cerrada_en:       new Date().toISOString(),
        fondo_final:      totalContado,
        diferencia:       diferencia,
        observacion:      observacion || null,
      })
      .eq("id", sesionCajaId);
    setCerrando(false);
    onCerrado();
  };

  if (cargando) {
    return (
      <section>
        <Header titulo="Cierre de Caja" onBack={onBack} />
        <div style={{ textAlign: "center", color: colors.textMuted, padding: 40 }}>Cargando...</div>
      </section>
    );
  }

  // ── Pantalla de confirmación ──
  if (confirmando) {
    return (
      <section>
        <Header titulo="Confirmar Cierre" onBack={() => setConfirmando(false)} />
        <div style={{ ...cardStyle, textAlign: "center", padding: "28px 20px", marginBottom: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
          <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>¿Cerrar la caja?</h2>
          <p style={{ color: colors.textMuted, fontSize: 13, marginBottom: 20 }}>
            Esta acción cerrará tu turno y no podrá deshacerse.
          </p>

          <div style={{ textAlign: "left", marginBottom: 20 }}>
            <FilaCierre label="Ventas del turno"    valor={`${numVentas} ventas`} />
            <FilaCierre label="Total vendido"        valor={`L ${fmt(totalEfectivo + totalTarjeta + totalTransf)}`} />
            <FilaCierre label="Fondo inicial"        valor={`L ${fmt(fondoInicial)}`} />
            <FilaCierre label="Efectivo esperado"    valor={`L ${fmt(montoEsperado)}`} />
            <FilaCierre label="Efectivo contado"     valor={`L ${fmt(totalContado)}`} />
            <div style={{ borderTop: `2px solid ${colors.border}`, margin: "8px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
              <span style={{ fontWeight: "bold", fontSize: 15 }}>Diferencia</span>
              <span style={{ fontWeight: "bold", fontSize: 16, color: diferencia === 0 ? colors.primary : diferencia > 0 ? "#2e7d32" : colors.danger }}>
                {diferencia > 0 ? "+" : ""}L {fmt(diferencia)}
                {diferencia > 0 ? " 🟢 Sobrante" : diferencia < 0 ? " 🔴 Faltante" : " ✅ Cuadrado"}
              </span>
            </div>
          </div>

          <button
            style={{ ...btnPrimary, background: colors.danger, opacity: cerrando ? 0.7 : 1 }}
            onClick={handleCerrar}
            disabled={cerrando}
          >
            {cerrando ? "Cerrando..." : "🔒 SÍ, CERRAR CAJA"}
          </button>
          <button style={{ ...btnSecondary, marginTop: 10 }} onClick={() => setConfirmando(false)}>
            VOLVER
          </button>
        </div>
      </section>
    );
  }

  // ── Pantalla principal ──
  return (
    <section>
      <Header titulo="Cierre de Caja" onBack={onBack} />

      {/* Resumen ventas */}
      <div style={{ ...cardStyle, marginBottom: 14 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, color: colors.textPrimary }}>📊 Resumen del turno</h3>
        <FilaCierre label="👤 Cajero"          valor={usuario} />
        <FilaCierre label="🧾 Ventas"           valor={`${numVentas}`} />
        <FilaCierre label="💵 Efectivo"         valor={`L ${fmt(totalEfectivo)}`} />
        <FilaCierre label="💳 Tarjeta"          valor={`L ${fmt(totalTarjeta)}`} />
        <FilaCierre label="📲 Transferencia"    valor={`L ${fmt(totalTransf)}`} />
        <Divider />
        <FilaCierre label="💰 Fondo inicial"    valor={`L ${fmt(fondoInicial)}`} bold />
        <FilaCierre label="📦 Efectivo esperado" valor={`L ${fmt(montoEsperado)}`} bold />
      </div>

      {/* Conteo de denominaciones */}
      <div style={{ ...cardStyle, marginBottom: 14 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 14, color: colors.textPrimary }}>💵 Conteo de efectivo</h3>
        <p style={{ fontSize: 12, color: colors.textMuted, marginBottom: 12 }}>Ingresa cuántos billetes/monedas de cada denominación tienes.</p>

        {/* Billetes */}
        <div style={{ fontSize: 12, fontWeight: "bold", color: colors.textMuted, marginBottom: 8, letterSpacing: 1 }}>BILLETES</div>
        {BILLETES.map((d) => (
          <FilaDenominacion key={d} denom={d} cantidad={cantidades[d] ?? ""} onChange={(v) => setCantidad(d, v)} />
        ))}

        <Divider />

        {/* Monedas */}
        <div style={{ fontSize: 12, fontWeight: "bold", color: colors.textMuted, marginBottom: 8, marginTop: 8, letterSpacing: 1 }}>MONEDAS</div>
        {MONEDAS.map((d) => (
          <FilaDenominacion key={d} denom={d} cantidad={cantidades[d] ?? ""} onChange={(v) => setCantidad(d, v)} />
        ))}

        <Divider />

        {/* Total contado */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", alignItems: "center" }}>
          <span style={{ fontWeight: "bold", fontSize: 15 }}>Total contado</span>
          <span style={{ fontWeight: "bold", fontSize: 18, color: colors.primary }}>L {fmt(totalContado)}</span>
        </div>
      </div>

      {/* Diferencia */}
      <div style={{
        ...cardStyle, marginBottom: 14, textAlign: "center",
        background: diferencia === 0 ? colors.primaryLight : diferencia > 0 ? "#e8f5e9" : "#fdecea",
      }}>
        <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 4 }}>Diferencia (contado − esperado)</div>
        <div style={{ fontSize: 28, fontWeight: "bold", color: diferencia === 0 ? colors.primary : diferencia > 0 ? "#2e7d32" : colors.danger }}>
          {diferencia > 0 ? "+" : ""}L {fmt(diferencia)}
        </div>
        <div style={{ fontSize: 13, marginTop: 4, color: diferencia === 0 ? colors.primary : diferencia > 0 ? "#2e7d32" : colors.danger }}>
          {diferencia === 0 ? "✅ Caja cuadrada" : diferencia > 0 ? "🟢 Sobrante" : "🔴 Faltante"}
        </div>
      </div>

      {/* Observación */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <label style={{ fontSize: 13, fontWeight: "bold", color: "#555", marginBottom: 6, display: "block" }}>
          Observación (opcional)
        </label>
        <textarea
          placeholder="Ej: Faltante por cambio de billete roto..."
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
          rows={3}
          style={{ width: "100%", padding: 12, borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 14, resize: "none", boxSizing: "border-box" }}
        />
      </div>

      <button style={{ ...btnPrimary, background: colors.danger }} onClick={() => setConfirmando(true)}>
        🔒 CERRAR CAJA
      </button>
      <button style={{ ...btnSecondary, marginTop: 10 }} onClick={onBack}>
        VOLVER
      </button>
    </section>
  );
}

function FilaCierre({ label, valor, bold }: { label: string; valor: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid #f0f0f0` }}>
      <span style={{ color: colors.textMuted, fontSize: 14 }}>{label}</span>
      <span style={{ fontWeight: bold ? "bold" : "normal", fontSize: 14 }}>{valor}</span>
    </div>
  );
}

function FilaDenominacion({ denom, cantidad, onChange }: { denom: number; cantidad: string; onChange: (v: string) => void }) {
  const subtotal = (parseFloat(cantidad) || 0) * denom;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 90px", gap: 8, alignItems: "center", marginBottom: 8 }}>
      <span style={{ fontWeight: "bold", fontSize: 14, color: colors.textPrimary }}>L {denom >= 1 ? denom.toFixed(0) : denom.toFixed(2)}</span>
      <input
        type="number" min="0"
        placeholder="0"
        value={cantidad}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${colors.border}`, fontSize: 14, textAlign: "center" }}
      />
      <span style={{ fontSize: 13, color: subtotal > 0 ? colors.primary : colors.textMuted, textAlign: "right", fontWeight: subtotal > 0 ? "bold" : "normal" }}>
        {subtotal > 0 ? `L ${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—"}
      </span>
    </div>
  );
}
