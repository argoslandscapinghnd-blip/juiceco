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
  fondoInicial: number;
}

interface Props {
  esAdmin?:      boolean;
  usuarioId?:    string;
  usuarioNombre?: string;
  onSeleccionar: (sucursalId: number, nombre: string) => void;
  onContinuar:   (sucursalId: number, nombre: string, sesionId: number) => void;
  onCerrarCaja:  (sesionId: number, sucursalId: number, fondoInicial: number, cajeroNombre: string, sucursalNombre: string) => void;
  onBack:        () => void;
}

export default function PuntoVentaScreen({
  esAdmin, usuarioId, usuarioNombre, onSeleccionar, onContinuar, onCerrarCaja, onBack,
}: Props) {
  const [sucursales, setSucursales] = useState<SucursalConEstado[]>([]);
  const [cargando,   setCargando]   = useState(true);
  const [error,      setError]      = useState("");

  const cargar = async () => {
    setCargando(true);
    setError("");
    const { data: suc, error: errSuc } = await supabase.from("sucursales").select("*").eq("activo", true).order("codigo");
    if (errSuc) { setError("Error cargando sucursales: " + errSuc.message); setCargando(false); return; }
    const { data: sesiones } = await supabase.from("sesiones_caja")
      .select("id, sucursal_id, usuario_nombre, usuario_id, fondo_inicial")
      .eq("activa", true);

    const sesionesMap: Record<number, { nombre: string; id: number; usuarioId: string; fondoInicial: number }> = {};
    (sesiones ?? []).forEach((s: any) => {
      sesionesMap[s.sucursal_id] = { nombre: s.usuario_nombre, id: s.id, usuarioId: s.usuario_id, fondoInicial: s.fondo_inicial ?? 0 };
    });

    setSucursales((suc ?? []).map((s: Sucursal) => ({
      ...s,
      ocupada:      !!sesionesMap[s.id],
      cajeroActivo: sesionesMap[s.id]?.nombre      ?? null,
      sesionId:     sesionesMap[s.id]?.id          ?? null,
      usuarioId:    sesionesMap[s.id]?.usuarioId   ?? null,
      fondoInicial: sesionesMap[s.id]?.fondoInicial ?? 0,
    })));
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const tengoSucursalActiva = esAdmin && sucursales.some(s => s.ocupada && s.usuarioId === usuarioId);

  return (
    <section>
      <Header titulo="Seleccione punto de venta" onBack={onBack} />

      {error && (
        <div style={{ background: "#fdecea", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#c62828" }}>
          ⚠️ {error}
        </div>
      )}

      {esAdmin && (
        <div style={{ background: "#e3f2fd", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#1565c0" }}>
          🛡️ <strong>Modo Admin:</strong> Continúa en tu sucursal, vende en una libre o cierra las ocupadas.
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
              {ocupadaPorOtro && (
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                  <span style={{ fontWeight: "bold", color: colors.danger, opacity: 0.12, transform: "rotate(-20deg)", fontSize: "28px", letterSpacing: 2, textTransform: "uppercase", whiteSpace: "nowrap" }}>EN USO</span>
                </div>
              )}

              <div style={{ padding: "14px 16px" }}>
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
                  {ocupadaPorOtro && <span style={{ fontSize: 11, fontWeight: "bold", padding: "4px 12px", borderRadius: 20, background: "#fdecea", color: colors.danger, flexShrink: 0, marginLeft: 8 }}>OCUPADA</span>}
                  {esMia && <span style={{ fontSize: 11, fontWeight: "bold", padding: "4px 12px", borderRadius: 20, background: colors.primaryLight, color: colors.primary, flexShrink: 0, marginLeft: 8 }}>MI SUCURSAL</span>}
                  {!s.ocupada && <span style={{ fontSize: 11, fontWeight: "bold", padding: "4px 12px", borderRadius: 20, background: "#e8f5e9", color: colors.primary, flexShrink: 0, marginLeft: 8 }}>LIBRE</span>}
                </div>

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
                  {!s.ocupada && (
                    <button onClick={() => puedeAbrir && onSeleccionar(s.id, `${s.codigo} - ${s.nombre}`)} disabled={!puedeAbrir}
                      style={{ ...accionBtn, background: puedeAbrir ? colors.primary : "#ccc", color: "white", cursor: puedeAbrir ? "pointer" : "not-allowed" }}>
                      🧾 Abrir caja
                    </button>
                  )}
                  {esMia && (
                    <>
                      <button onClick={() => onContinuar(s.id, `${s.codigo} - ${s.nombre}`, s.sesionId!)}
                        style={{ ...accionBtn, background: colors.primary, color: "white" }}>
                        ▶️ Continuar
                      </button>
                      <button onClick={() => onCerrarCaja(s.sesionId!, s.id, s.fondoInicial, s.cajeroActivo!, `${s.codigo} - ${s.nombre}`)}
                        style={{ ...accionBtn, background: "#fdecea", color: colors.danger }}>
                        🔒 Cerrar caja
                      </button>
                    </>
                  )}
                  {esAdmin && ocupadaPorOtro && (
                    <button onClick={() => onCerrarCaja(s.sesionId!, s.id, s.fondoInicial, s.cajeroActivo!, `${s.codigo} - ${s.nombre}`)}
                      style={{ ...accionBtn, background: "#fdecea", color: colors.danger }}>
                      🔒 Cerrar caja
                    </button>
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

const accionBtn: React.CSSProperties = {
  padding: "8px 16px", borderRadius: 20, border: "none",
  fontWeight: "bold", fontSize: 12, cursor: "pointer",
};
