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
  ocupada:        boolean;
  cajeroActivo:   string | null;
  sesionId:       number | null;
}

interface Props {
  esAdmin?:      boolean;
  onSeleccionar: (sucursalId: number, nombre: string) => void;
  onBack:        () => void;
}

export default function PuntoVentaScreen({ esAdmin, onSeleccionar, onBack }: Props) {
  const [sucursales,  setSucursales]  = useState<SucursalConEstado[]>([]);
  const [cargando,    setCargando]    = useState(true);
  const [liberando,   setLiberando]   = useState<number | null>(null);
  const [confirmar,   setConfirmar]   = useState<SucursalConEstado | null>(null);

  const cargar = async () => {
    setCargando(true);

    const { data: suc } = await supabase
      .from("sucursales")
      .select("*")
      .eq("activo", true)
      .order("codigo");

    const { data: sesiones } = await supabase
      .from("sesiones_caja")
      .select("id, sucursal_id, usuario_nombre")
      .eq("activa", true);

    const sesionesMap: Record<number, { nombre: string; id: number }> = {};
    (sesiones ?? []).forEach((s: any) => {
      sesionesMap[s.sucursal_id] = { nombre: s.usuario_nombre, id: s.id };
    });

    const resultado: SucursalConEstado[] = (suc ?? []).map((s: Sucursal) => ({
      ...s,
      ocupada:      !!sesionesMap[s.id],
      cajeroActivo: sesionesMap[s.id]?.nombre ?? null,
      sesionId:     sesionesMap[s.id]?.id ?? null,
    }));

    setSucursales(resultado);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const liberarSucursal = async (s: SucursalConEstado) => {
    if (!s.sesionId) return;
    setLiberando(s.id);
    await supabase
      .from("sesiones_caja")
      .update({ activa: false, cerrada_en: new Date().toISOString() })
      .eq("id", s.sesionId);
    setLiberando(null);
    setConfirmar(null);
    cargar();
  };

  // ── Modal de confirmación ──
  if (confirmar) {
    return (
      <section>
        <div style={{ ...cardStyle, textAlign: "center", padding: "32px 24px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔓</div>
          <h2 style={{ marginTop: 0, fontSize: 18, color: colors.textPrimary }}>
            ¿Liberar sucursal?
          </h2>
          <p style={{ color: colors.textMuted, fontSize: 14, marginBottom: 4 }}>
            <strong>{confirmar.codigo} - {confirmar.nombre}</strong>
          </p>
          <p style={{ color: colors.textMuted, fontSize: 14, marginBottom: 24 }}>
            En uso por: <strong style={{ color: colors.danger }}>{confirmar.cajeroActivo}</strong>
          </p>
          <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 24, background: "#fff3cd", padding: "10px 14px", borderRadius: 8 }}>
            ⚠️ La sesión se cerrará sin registrar cierre de caja. Úsalo solo en emergencias.
          </p>

          <button
            style={{ width: "100%", padding: 16, borderRadius: 10, border: "none", background: colors.danger, color: "white", fontWeight: "bold", fontSize: 16, cursor: "pointer", marginBottom: 10, opacity: liberando === confirmar.id ? 0.7 : 1 }}
            onClick={() => liberarSucursal(confirmar)}
            disabled={liberando === confirmar.id}
          >
            {liberando === confirmar.id ? "Liberando..." : "🔓 SÍ, LIBERAR SUCURSAL"}
          </button>

          <button
            style={{ width: "100%", padding: 16, borderRadius: 10, border: `1px solid ${colors.border}`, background: "white", fontWeight: "bold", fontSize: 16, cursor: "pointer" }}
            onClick={() => setConfirmar(null)}
          >
            CANCELAR
          </button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <Header titulo="Seleccione punto de venta" onBack={onBack} />

      {cargando ? (
        <div style={{ textAlign: "center", color: colors.textMuted, padding: 40 }}>
          Cargando sucursales...
        </div>
      ) : sucursales.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", color: colors.textMuted, padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
          <p>No hay sucursales disponibles</p>
        </div>
      ) : (
        sucursales.map((s) => (
          <div
            key={s.id}
            style={{
              width: "100%",
              marginBottom: 10,
              borderRadius: 12,
              border: `1px solid ${s.ocupada ? "#e0e0e0" : colors.border}`,
              background: s.ocupada ? "#f9f9f9" : colors.white,
              overflow: "hidden",
              boxShadow: s.ocupada ? "none" : "0 1px 4px rgba(0,0,0,0.05)",
              position: "relative",
            }}
          >
            {/* Marca de agua EN USO */}
            {s.ocupada && (
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                pointerEvents: "none",
              }}>
                <span style={{
                  fontWeight: "bold", color: colors.danger, opacity: 0.12,
                  transform: "rotate(-20deg)", fontSize: "28px",
                  letterSpacing: 2, textTransform: "uppercase", whiteSpace: "nowrap",
                }}>
                  EN USO
                </span>
              </div>
            )}

            {/* Fila principal — clickeable si no está ocupada */}
            <button
              disabled={s.ocupada}
              onClick={() => !s.ocupada && onSeleccionar(s.id, `${s.codigo} - ${s.nombre}`)}
              style={{
                width: "100%", padding: "16px 18px", background: "transparent",
                border: "none", cursor: s.ocupada ? "not-allowed" : "pointer",
                textAlign: "left", display: "flex", justifyContent: "space-between",
                alignItems: "center", opacity: s.ocupada ? 0.65 : 1,
              }}
            >
              <div>
                <div style={{ fontWeight: "bold", color: colors.textPrimary, fontSize: 15 }}>
                  {s.codigo} - {s.nombre}
                </div>
                <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
                  📍 {s.ciudad}
                </div>
                {s.ocupada && s.cajeroActivo && (
                  <div style={{ fontSize: 12, color: colors.danger, marginTop: 4, fontWeight: "bold" }}>
                    🔒 En uso por: {s.cajeroActivo}
                  </div>
                )}
              </div>
              <div style={{ marginLeft: 12, flexShrink: 0 }}>
                {s.ocupada ? (
                  <span style={{ fontSize: 11, fontWeight: "bold", padding: "4px 10px", borderRadius: 20, background: "#fdecea", color: colors.danger }}>
                    OCUPADA
                  </span>
                ) : (
                  <span style={{ color: colors.textMuted, fontSize: 20 }}>›</span>
                )}
              </div>
            </button>

            {/* Botón liberar — solo para admin y solo si está ocupada */}
            {esAdmin && s.ocupada && (
              <div style={{ padding: "0 18px 14px", display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setConfirmar(s)}
                  style={{
                    padding: "6px 14px", borderRadius: 8, border: "none",
                    background: "#fdecea", color: colors.danger,
                    fontWeight: "bold", fontSize: 12, cursor: "pointer",
                  }}
                >
                  🔓 Liberar sucursal
                </button>
              </div>
            )}
          </div>
        ))
      )}

      <button style={btnSecondary} onClick={cargar}>
        🔄 ACTUALIZAR
      </button>
    </section>
  );
}
