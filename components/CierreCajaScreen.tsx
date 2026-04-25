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

// Pares de billetes [izquierda, derecha]
const PARES = [[500, 100], [50, 20], [10, 5], [2, 1]];
const TODOS = PARES.flat();

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2 });

export default function CierreCajaScreen({
  sesionCajaId, sucursalId, fondoInicial, usuario, onCerrado, onBack,
}: Props) {
  const [cantidades,    setCantidades]    = useState<Record<number, string>>({});
  const [totalEfectivo, setTotalEfectivo] = useState(0);
  const [totalTarjeta,  setTotalTarjeta]  = useState(0);
  const [totalTransf,   setTotalTransf]   = useState(0);
  const [numVentas,     setNumVentas]     = useState(0);
  const [cargando,      setCargando]      = useState(true);
  const [confirmando,   setConfirmando]   = useState(false);
  const [cerrando,      setCerrando]      = useState(false);
  const [observacion,   setObservacion]   = useState("");

  useEffect(() => { cargarVentas(); }, []);

  const cargarVentas = async () => {
    setCargando(true);
    const { data } = await supabase.from("ventas").select("total, metodo_pago").eq("sesion_id", sesionCajaId);
    const v = data ?? [];
    setNumVentas(v.length);
    setTotalEfectivo(v.filter((x: any) => x.metodo_pago === "efectivo").reduce((s: number, x: any) => s + Number(x.total), 0));
    setTotalTarjeta(v.filter((x: any) => x.metodo_pago === "tarjeta").reduce((s: number, x: any) => s + Number(x.total), 0));
    setTotalTransf(v.filter((x: any) => x.metodo_pago === "transferencia").reduce((s: number, x: any) => s + Number(x.total), 0));
    setCargando(false);
  };

  const totalContado  = TODOS.reduce((s, d) => s + (parseFloat(cantidades[d] || "0") || 0) * d, 0);
  const montoEsperado = fondoInicial + totalEfectivo;
  const diferencia    = totalContado - montoEsperado;

  const handleCerrar = async () => {
    setCerrando(true);

    // Guardar detalle de denominaciones como JSON en observacion
    const detalleBilletes = TODOS.reduce((acc, d) => {
      const cant = parseFloat(cantidades[d] || "0") || 0;
      if (cant > 0) acc[`L${d}`] = cant;
      return acc;
    }, {} as Record<string, number>);

    await supabase.from("sesiones_caja").update({
      activa:       false,
      cerrada_en:   new Date().toISOString(),
      fondo_final:  totalContado,
      diferencia,
      observacion:  observacion || null,
      denominaciones: JSON.stringify(detalleBilletes),
    }).eq("id", sesionCajaId);

    setCerrando(false);
    onCerrado();
  };

  if (cargando) return (
    <section>
      <Header titulo="Cierre de Caja" onBack={onBack} />
      <div style={{ textAlign: "center", color: colors.textMuted, padding: 40 }}>Cargando...</div>
    </section>
  );

  // ── Confirmación ──
  if (confirmando) return (
    <section>
      <Header titulo="Confirmar Cierre" onBack={() => setConfirmando(false)} />
      <div style={{ ...cardStyle, textAlign: "center", padding: "28px 20px" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
        <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>¿Cerrar la caja?</h2>
        <p style={{ color: colors.textMuted, fontSize: 13, marginBottom: 20 }}>
          Esta acción cerrará tu turno y no podrá deshacerse.
        </p>
        <div style={{ textAlign: "left", marginBottom: 20 }}>
          <FilaCierre label="Ventas del turno"   valor={`${numVentas} ventas`} />
          <FilaCierre label="Total vendido"       valor={`L ${fmt(totalEfectivo + totalTarjeta + totalTransf)}`} />
          <FilaCierre label="Fondo inicial"       valor={`L ${fmt(fondoInicial)}`} />
          <FilaCierre label="Efectivo esperado"   valor={`L ${fmt(montoEsperado)}`} />
          <FilaCierre label="Efectivo contado"    valor={`L ${fmt(totalContado)}`} />
          <div style={{ borderTop: `2px solid ${colors.border}`, margin: "8px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
            <span style={{ fontWeight: "bold", fontSize: 15 }}>Diferencia</span>
            <span style={{ fontWeight: "bold", fontSize: 15, color: diferencia === 0 ? colors.primary : diferencia > 0 ? "#2e7d32" : colors.danger }}>
              {diferencia > 0 ? "+" : ""}L {fmt(diferencia)}
              {diferencia > 0 ? "  🟢" : diferencia < 0 ? "  🔴" : "  ✅"}
            </span>
          </div>
        </div>
        <button style={{ ...btnPrimary, background: colors.danger, opacity: cerrando ? 0.7 : 1 }} onClick={handleCerrar} disabled={cerrando}>
          {cerrando ? "Cerrando..." : "🔒 SÍ, CERRAR CAJA"}
        </button>
        <button style={{ ...btnSecondary, marginTop: 10 }} onClick={() => setConfirmando(false)}>VOLVER</button>
      </div>
    </section>
  );

  // ── Principal ──
  return (
    <section>
      <Header titulo="Cierre de Caja" onBack={onBack} />

      {/* Resumen ventas */}
      <div style={{ ...cardStyle, marginBottom: 14 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>📊 Resumen del turno</h3>
        <FilaCierre label="👤 Cajero"           valor={usuario} />
        <FilaCierre label="🧾 Ventas"            valor={`${numVentas}`} />
        <FilaCierre label="💵 Efectivo"          valor={`L ${fmt(totalEfectivo)}`} />
        <FilaCierre label="💳 Tarjeta"           valor={`L ${fmt(totalTarjeta)}`} />
        <FilaCierre label="📲 Transferencia"     valor={`L ${fmt(totalTransf)}`} />
        <Divider />
        <FilaCierre label="💰 Fondo inicial"     valor={`L ${fmt(fondoInicial)}`} bold />
        <FilaCierre label="📦 Efectivo esperado" valor={`L ${fmt(montoEsperado)}`} bold />
      </div>

      {/* Conteo de billetes en pares */}
      <div style={{ ...cardStyle, marginBottom: 14 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 14 }}>💵 Conteo de billetes</h3>
        <p style={{ fontSize: 12, color: colors.textMuted, marginBottom: 12 }}>
          Ingresa cuántos billetes tienes de cada denominación.
        </p>

        {PARES.map(([izq, der]) => (
          <div key={`${izq}-${der}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <BilleteCelda denom={izq} cantidad={cantidades[izq] ?? ""} onChange={(v) => setCantidades(p => ({ ...p, [izq]: v }))} />
            <BilleteCelda denom={der} cantidad={cantidades[der] ?? ""} onChange={(v) => setCantidades(p => ({ ...p, [der]: v }))} />
          </div>
        ))}

        <Divider />
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
      <button style={{ ...btnSecondary, marginTop: 10 }} onClick={onBack}>VOLVER</button>
    </section>
  );
}

function BilleteCelda({ denom, cantidad, onChange }: { denom: number; cantidad: string; onChange: (v: string) => void }) {
  const subtotal = (parseFloat(cantidad) || 0) * denom;
  return (
    <div style={{ background: "#f9f9f9", borderRadius: 10, padding: "10px 12px", border: `1px solid ${colors.border}` }}>
      <div style={{ fontWeight: "bold", fontSize: 15, color: colors.textPrimary, marginBottom: 6 }}>L {denom}</div>
      <input
        type="number" min="0" placeholder="0"
        value={cantidad}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", padding: "8px", borderRadius: 8, border: `1px solid ${colors.border}`, fontSize: 16, textAlign: "center", boxSizing: "border-box" }}
      />
      {subtotal > 0 && (
        <div style={{ fontSize: 12, color: colors.primary, fontWeight: "bold", marginTop: 4, textAlign: "center" }}>
          L {subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </div>
      )}
    </div>
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
