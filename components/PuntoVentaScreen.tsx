"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Pantalla: Selección Punto de Venta
// ─────────────────────────────────────────────
import { useEffect, useState } from "react";
import { Header } from "./ui/components";
import { colors, btnSecondary, cardStyle } from "./ui/styles";
import { Sucursal } from "./ui/types";
import { supabase } from "@/supabase";

interface SucursalConEstado extends Sucursal {
  ocupada:      boolean;
  cajeroActivo: string | null;
  sesionId:     number | null;
  usuarioId:    string | null;
}

interface Props {
  esAdmin?:      boolean;
  usuarioId?:    string;
  onSeleccionar: (sucursalId: number, nombre: string) => void;
  onContinuar:   (sucursalId: number, nombre: string, sesionId: number) => void;
  onBack:        () => void;
}

export default function PuntoVentaScreen({
  esAdmin, usuarioId, onSeleccionar, onContinuar, onBack,
}: Props) {
  const [sucursales, setSucursales] = useState<SucursalConEstado[]>([]);
  const [cargando,   setCargando]   = useState(true);
  const [liberando,  setLiberando]  = useState<number | null>(null);
  const [confirmar,  setConfirmar]  = useState<SucursalConEstado | null>(null);

  const cargar = async () => {
    setCargando(true);
    const { data: suc } = await supabase.from("sucursales").select("*").eq("activo", true).order("codigo");
    const { data: sesiones } = await supabase.from("sesiones_caja").select("id, sucursal_id, usuario_nombre, usuario_id").eq("activa", true);

    const sesionesMap: Record<number, { nombre: string; id: number; usuarioId: string }> = {};
    (sesiones ?? []).forEach((s: any) => {
      sesionesMap[s.sucursal_id] = { nombre: s.usuario_nombre, id: s.id, usuarioId: s.usuario_id };
    });

    setSucursales((suc ?? []).map((s: Sucursal) => ({
      ...s,
      ocupada:      !!sesionesMap[s.id],
      cajeroActivo: sesionesMap[s.id]?.nombre    ?? null,
      sesionId:     sesionesMap[s.id]?.id        ?? null,
      usuarioId:    sesionesMap[s.id]?.usuarioId ?? null,
    })));
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const tengoSucursalActiva = esAdmin && sucursales.some(s => s.ocupada && s.usuarioId === usuarioId);

  const liberarSucursal = async (s: SucursalConEstado) => {
    if (!s.sesionId) return;
    setLiberando(s.id);
    await supabase.from("sesiones_caja").update({ activa: false, cerrada_en: new Date().toISOString() }).eq("id", s.sesionId);
    setLiberando(null);
    setConfirmar(null);
    cargar();
  };

  if (confirmar) {
    return (
      <section>
        <div style={{ ...cardStyle, textAlign: "center", padding: "32px 24px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔓</div>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>¿Liberar sucursal?</h2>
          <p style={{ color: colors.textMuted, fontSize: 14, marginBottom: 4 }}><strong>{confirmar.codigo} - {confirmar.nombre}</strong></p>
          <p style={{ color: colors.textMuted, fontSize: 14, marginBottom: 16 }}>En uso por: <strong style={{ color: colors.danger }}>{confirmar.cajeroActivo}</strong></p>
          <p style={{ fontSize: 13, background: "#fff3cd", padding: "10px 14px", borderRadius: 8, marginBottom: 24 }}>
            ⚠️ La sesión se cerrará sin registrar cierre de caja. Úsalo solo en emergencias.
          </p>
          <button style={{ width: "100%", padding: 16, borderRadius: 10, border: "none", background: colors.danger, color: "white", fontWeight: "bold", fontSize: 16, cursor: "pointer", marginBottom: 10, opacity: liberando === confirmar.id ? 0.7 : 1 }} onClick={() => liberarSucursal(confirmar)} disabled={liberando === confirmar.id}>
            {liberando === confirmar.id ? "Liberando..." : "🔓 SÍ, LIBERAR"}
          </button>
          <button style={{ width: "100%", padding: 16, borderRadius: 10, border: `1px solid ${colors.border}`, background: "white", fontWeight: "bold", fontSize: 16, cursor: "pointer" }} onClick={() => setConfirmar(null)}>
            CANCELAR
          </button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <Header titulo="Seleccione punto de venta" onBack={onBack} />

      {esAdmin && (
        <div style={{ background: "#e3f2fd", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#1565c0" }}>
          🛡️ <strong>Modo Admin:</strong> Continúa en tu sucursal, vende en una libre o libera las ocupadas.
        </div>
      )}

      {cargando ? (
        <div style={{ textAlign: "center", color: colors.textMuted, padding: 40 }}>Cargando sucursales...</div>
      ) : (
        sucursales.map((s) => {
          const esMia          = esAdmin && s.ocupada && s.usuarioId === usuarioId;
          const ocupadaPorOtro = s.ocupada && !esMia;
          const puedeAbrir     = !s.ocupada && (!esAdmin || !tengoSucursalActiva);

          return (
            <div key={s.id} style={{
              marginBottom: 10, borderRadius: 12,
              border: `2px solid ${esMia ? colors.primary : ocupadaPorOtro ? "#e0e0e0" : colors.border}`,
              background: esMia ? colors.primaryLight : ocupadaPorOtro ? "#f9f9f9" : colors.white,
              overflow: "hidden",
              boxShadow: ocupadaPorOtro ? "none" : "0 2px 8px rgba(0,0,0,0.06)",
              position: "relative",
            }}>
              {/* Marca de agua */}
              {ocupadaPorOtro && (
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                  <span style={{ fontWeight: "bold", color: colors.danger, opacity: 0.12, transform: "rotate(-20deg)", fontSize: "28px", letterSpacing: 2, textTransform: "uppercase", whiteSpace: "nowrap" }}>EN USO</span>
                </div>
              )}

              <div style={{ padding: "14px 16px" }}>
                {/* Fila info + badge */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontWeight: "bold", color: esMia ? colors.primary : colors.textPrimary, fontSize: 15 }}>
                      {esMia ? "⭐ " : ""}{s.codigo} - {s.nombre}
                    </div>
                    <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>📍 {s.ciudad}</div>
                    {s.ocupada && s.cajeroActivo && (
                      <div style={{ fontSize: 12, marginTop: 4, fontWeight: "bold", color: esMia ? colors.primary : colors.danger }}>
                        🔒 En uso por: {s.cajeroActivo}
                      </div>
                    )}
                    {!s.ocupada && esAdmin && tengoSucursalActiva && (
                      <div style={{ fontSize: 12, marginTop: 4, color: colors.textMuted }}>Cierra tu caja activa primero</div>
                    )}
                  </div>

                  {/* Badge estado */}
                  {ocupadaPorOtro && (
                    <span style={{ fontSize: 11, fontWeight: "bold", padding: "4px 12px", borderRadius: 20, background: "#fdecea", color: colors.danger, flexShrink: 0, marginLeft: 8 }}>
                      OCUPADA
                    </span>
                  )}
                  {esMia && (
                    <span style={{ fontSize: 11, fontWeight: "bold", padding: "4px 12px", borderRadius: 20, background: colors.primaryLight, color: colors.primary, flexShrink: 0, marginLeft: 8 }}>
                      MI SUCURSAL
                    </span>
                  )}
                  {!s.ocupada && (
                    <span style={{ fontSize: 11, fontWeight: "bold", padding: "4px 12px", borderRadius: 20, background: "#e8f5e9", color: colors.primary, flexShrink: 0, marginLeft: 8 }}>
                      LIBRE
                    </span>
                  )}
                </div>

                {/* Botones — misma altura, mismo estilo */}
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
                  {!s.ocupada && (
                    <button
                      onClick={() => puedeAbrir && onSeleccionar(s.id, `${s.codigo} - ${s.nombre}`)}
                      disabled={!puedeAbrir}
                      style={{ ...accionBtn, background: puedeAbrir ? colors.primary : "#ccc", color: "white", cursor: puedeAbrir ? "pointer" : "not-allowed" }}
                    >
                      🧾 Abrir caja
                    </button>
                  )}
                  {esMia && (
                    <button
                      onClick={() => onContinuar(s.id, `${s.codigo} - ${s.nombre}`, s.sesionId!)}
                      style={{ ...accionBtn, background: colors.primary, color: "white" }}
                    >
                      ▶️ Continuar
                    </button>
                  )}
                  {esAdmin && s.ocupada && (
                    <button
                      onClick={() => setConfirmar(s)}
                      style={{ ...accionBtn, background: "#fdecea", color: colors.danger }}
                    >
                      🔓 Liberar
                    </button>
                  )}
                  {!esAdmin && !s.ocupada && (
                    <span style={{ color: colors.textMuted, fontSize: 20, alignSelf: "center" }}>›</span>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}

      <button style={btnSecondary} onClick={cargar}>🔄 ACTUALIZAR</button>
    </section>
  );
}

// ── Estilo base de botones de acción (todos iguales) ──
const accionBtn: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 20,
  border: "none",
  fontWeight: "bold",
  fontSize: 12,
  cursor: "pointer",
};
