"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Pantalla 2: Selección Punto de Venta
//  Carga sucursales desde Supabase y muestra
//  cuáles están ocupadas con sesión activa.
// ─────────────────────────────────────────────
import { useEffect, useState } from "react";
import { Header } from "./ui/components";
import { colors, btnSecondary, cardStyle } from "./ui/styles";
import { Sucursal } from "./ui/types";
import { supabase } from "@/supabase";

interface SucursalConEstado extends Sucursal {
  ocupada:        boolean;
  cajeroActivo:   string | null;
}

interface Props {
  onSeleccionar: (sucursalId: number, nombre: string) => void;
  onBack:        () => void;
}

export default function PuntoVentaScreen({ onSeleccionar, onBack }: Props) {
  const [sucursales, setSucursales] = useState<SucursalConEstado[]>([]);
  const [cargando,   setCargando]   = useState(true);

  const cargar = async () => {
    setCargando(true);

    // Cargar sucursales activas
    const { data: suc } = await supabase
      .from("sucursales")
      .select("*")
      .eq("activo", true)
      .order("codigo");

    // Cargar sesiones activas
    const { data: sesiones } = await supabase
      .from("sesiones_caja")
      .select("sucursal_id, usuario_nombre")
      .eq("activa", true);

    const sesionesMap: Record<number, string> = {};
    (sesiones ?? []).forEach((s: { sucursal_id: number; usuario_nombre: string }) => {
      sesionesMap[s.sucursal_id] = s.usuario_nombre;
    });

    const resultado: SucursalConEstado[] = (suc ?? []).map((s: Sucursal) => ({
      ...s,
      ocupada:      !!sesionesMap[s.id],
      cajeroActivo: sesionesMap[s.id] ?? null,
    }));

    setSucursales(resultado);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

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
          <button
            key={s.id}
            disabled={s.ocupada}
            onClick={() => !s.ocupada && onSeleccionar(s.id, `${s.codigo} - ${s.nombre}`)}
            style={{
              width: "100%",
              padding: "16px 18px",
              marginBottom: 10,
              borderRadius: 12,
              border: `1px solid ${s.ocupada ? "#e0e0e0" : colors.border}`,
              background: s.ocupada ? "#f9f9f9" : colors.white,
              cursor: s.ocupada ? "not-allowed" : "pointer",
              textAlign: "left",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              opacity: s.ocupada ? 0.6 : 1,
              boxShadow: s.ocupada ? "none" : "0 1px 4px rgba(0,0,0,0.05)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Marca de agua si está ocupada */}
            {s.ocupada && (
              <div style={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}>
                <span style={{
                  fontWeight: "bold",
                  color: colors.danger,
                  opacity: 0.15,
                  transform: "rotate(-20deg)",
                  fontSize: "28px",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}>
                  EN USO
                </span>
              </div>
            )}

            {/* Info sucursal */}
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

            {/* Indicador derecho */}
            <div style={{ marginLeft: 12, flexShrink: 0 }}>
              {s.ocupada ? (
                <span style={{
                  fontSize: 11, fontWeight: "bold", padding: "4px 10px",
                  borderRadius: 20, background: "#fdecea", color: colors.danger,
                }}>
                  OCUPADA
                </span>
              ) : (
                <span style={{ color: colors.textMuted, fontSize: 20 }}>›</span>
              )}
            </div>
          </button>
        ))
      )}

      <button style={btnSecondary} onClick={cargar}>
        🔄 ACTUALIZAR
      </button>
    </section>
  );
}
