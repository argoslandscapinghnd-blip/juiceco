"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Menú de Bebidas con imágenes
// ─────────────────────────────────────────────
import { useEffect, useState } from "react";
import { Logo } from "./ui/components";
import { colors, btnAccent } from "./ui/styles";
import { ItemCarrito, Producto } from "./ui/types";
import CajeroHeader from "./CajeroHeader";
import { supabase } from "@/supabase";

interface Props {
  carrito:            ItemCarrito[];
  usuario:            string;
  sucursal:           string;
  esAdmin?:           boolean;
  onSeleccionarSabor: (nombre: string, precio: number) => void;
  onVerCarrito:       () => void;
  onVerTurno:         () => void;
  onCerrarSesion:     () => void;
  onVolverAdmin?:     () => void;
}

export default function MenuScreen({
  carrito, usuario, sucursal, esAdmin,
  onSeleccionarSabor, onVerCarrito, onVerTurno, onCerrarSesion, onVolverAdmin,
}: Props) {
  const [bebidas,  setBebidas]  = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState("");

  useEffect(() => {
    supabase.from("productos").select("*").eq("activo", true).order("nombre")
      .then(({ data, error: err }) => {
        if (err) setError("Error cargando bebidas: " + err.message);
        else setBebidas((data as Producto[]) ?? []);
        setCargando(false);
      });
  }, []);

  const unidades = carrito.reduce((s, i) => s + i.cantidad, 0);
  const total    = carrito.reduce((s, i) => s + i.cantidad * i.precio, 0);

  return (
    <section>
      <CajeroHeader
        usuario={usuario} sucursal={sucursal}
        tieneItems={carrito.length > 0}
        onVerTurno={onVerTurno} onCerrarSesion={onCerrarSesion}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Logo size="normal" />
        {unidades > 0 && (
          <div style={{ background: colors.primary, color: "white", borderRadius: 20, padding: "4px 14px", fontSize: 14, fontWeight: "bold" }}>
            🛒 {unidades}
          </div>
        )}
      </div>

      {/* Botón volver al panel admin */}
      {esAdmin && onVolverAdmin && (
        <button
          onClick={onVolverAdmin}
          style={{
            width: "100%", marginBottom: 12, padding: "10px 16px",
            borderRadius: 10, border: `1px solid ${colors.border}`,
            background: "#f5f5f5", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 13, fontWeight: "bold", color: colors.textSecondary,
          }}
        >
          ← Volver al panel Admin
        </button>
      )}

      {error && (
        <div style={{ background: "#fdecea", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#c62828" }}>
          ⚠️ {error}
        </div>
      )}

      {cargando ? (
        <div style={{ textAlign: "center", color: colors.textMuted, padding: 40 }}>Cargando bebidas...</div>
      ) : bebidas.length === 0 ? (
        <div style={{ textAlign: "center", color: colors.textMuted, padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🍹</div>
          <p>No hay bebidas disponibles</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {bebidas.map((b) => (
            <button
              key={b.id}
              onClick={() => onSeleccionarSabor(b.nombre, b.precio)}
              style={{
                background: "white", borderRadius: 16, border: `1px solid ${colors.border}`,
                cursor: "pointer", overflow: "hidden", padding: 0,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                display: "flex", flexDirection: "column",
              }}
            >
              <div style={{ width: "100%", aspectRatio: "1/1", overflow: "hidden", background: "#f5f5f5" }}>
                {b.imagen_url ? (
                  <img src={b.imagen_url} alt={b.nombre} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>
                    {b.emoji || "🍹"}
                  </div>
                )}
              </div>
              <div style={{ padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontWeight: "bold", fontSize: 13, color: colors.textPrimary, marginBottom: 2 }}>{b.nombre}</div>
                <div style={{ fontSize: 13, color: colors.primary, fontWeight: "bold" }}>
                  L {b.precio.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {unidades > 0 && (
        <button style={btnAccent} onClick={onVerCarrito}>
          <span>🛒 VER CARRITO ({unidades})</span>
          <span>L {total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
        </button>
      )}
    </section>
  );
}
