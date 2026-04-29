"use client";
import { useEffect, useState } from "react";
import { Logo } from "./ui/components";
import { colors, cardStyle, btnPrimary } from "./ui/styles";
import { supabase } from "@/supabase";
import { inicioDiaHN } from "@/lib/utils";

interface Props {
  usuario:        string;
  onUsuarios:     () => void;
  onSucursales:   () => void;
  onMaestros:     () => void;
  onReportes:     () => void;
  onModoCajero:   () => void;
  onCerrarSesion: () => void;
}

interface Metricas {
  ventasHoy:   number;
  totalHoy:    number;
  turnos:      number;
  sucursales:  number;
}

const fmt = (n: number) =>
  Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const modulos = [
  { emoji: "👥", titulo: "Usuarios",   desc: "Crear, editar e inhabilitar usuarios",  key: "usuarios"   },
  { emoji: "🏪", titulo: "Sucursales", desc: "Crear, editar e inhabilitar sucursales", key: "sucursales" },
  { emoji: "📚", titulo: "Maestros",   desc: "Bebidas, unidades, insumos y recetas",   key: "maestros"   },
  { emoji: "📊", titulo: "Dashboard",  desc: "Ventas, cajeros, productos y métodos",   key: "reportes"   },
];

export default function AdminMenuScreen({
  usuario, onUsuarios, onSucursales, onMaestros, onReportes,
  onModoCajero, onCerrarSesion,
}: Props) {
  const [metricas, setMetricas] = useState<Metricas | null>(null);

  useEffect(() => { cargarMetricas(); }, []);

  const cargarMetricas = async () => {
    const [{ data: ventas }, { count: turnos }, { count: sucursales }] = await Promise.all([
      supabase.from("ventas").select("total").gte("creada_en", inicioDiaHN()),
      supabase.from("sesiones_caja").select("id", { count: "exact", head: true }).eq("activa", true),
      supabase.from("sucursales").select("id", { count: "exact", head: true }).eq("activo", true),
    ]);

    const ventasHoy  = ventas?.length ?? 0;
    const totalHoy   = (ventas ?? []).reduce((s: number, v: any) => s + Number(v.total || 0), 0);

    setMetricas({ ventasHoy, totalHoy, turnos: turnos ?? 0, sucursales: sucursales ?? 0 });
  };

  const handlers: Record<string, () => void> = {
    usuarios: onUsuarios, sucursales: onSucursales, maestros: onMaestros, reportes: onReportes,
  };

  return (
    <section>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <Logo size="normal" />
        <button onClick={onCerrarSesion} style={{ background: "none", border: "none", color: colors.danger, cursor: "pointer", fontSize: 13, fontWeight: "bold" }}>
          Cerrar sesión
        </button>
      </div>

      {/* Bienvenida + métricas integradas */}
      <div style={{
        background: "linear-gradient(135deg, #14532d 0%, #166534 100%)",
        borderRadius: 20,
        padding: "20px",
        marginBottom: 16,
        color: "white",
      }}>
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 2 }}>Bienvenido,</div>
        <div style={{ fontWeight: "bold", fontSize: 20, marginBottom: 16 }}>🛡️ {usuario}</div>

        {/* Métricas del día */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <MetricaCard
            label="Ventas hoy"
            valor={metricas ? `${metricas.ventasHoy}` : "—"}
            sub={metricas ? `L ${fmt(metricas.totalHoy)}` : ""}
            icon="🧾"
          />
          <MetricaCard
            label="Turnos activos"
            valor={metricas ? `${metricas.turnos}` : "—"}
            sub="cajas abiertas"
            icon="🔓"
          />
          <MetricaCard
            label="Sucursales"
            valor={metricas ? `${metricas.sucursales}` : "—"}
            sub="activas"
            icon="🏪"
          />
        </div>
      </div>

      {/* Botón cajero */}
      <button
        style={{ ...btnPrimary, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
        onClick={onModoCajero}
      >
        <span style={{ fontSize: 20 }}>🧾</span>
        <span>MODO CAJERO — Iniciar venta</span>
      </button>

      {/* Módulos */}
      <div style={{ fontSize: 12, fontWeight: "bold", color: colors.textMuted, marginBottom: 10, letterSpacing: 1 }}>
        ADMINISTRACIÓN
      </div>
      {modulos.map((m) => (
        <button
          key={m.key}
          onClick={handlers[m.key]}
          style={{ ...cardStyle, width: "100%", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", border: "none", textAlign: "left", marginBottom: 10 }}
        >
          <span style={{ fontSize: 28, width: 52, height: 52, borderRadius: 12, background: colors.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {m.emoji}
          </span>
          <div>
            <div style={{ fontWeight: "bold", fontSize: 15, color: colors.textPrimary, marginBottom: 2 }}>{m.titulo}</div>
            <div style={{ fontSize: 13, color: colors.textMuted }}>{m.desc}</div>
          </div>
          <span style={{ marginLeft: "auto", color: colors.textMuted, fontSize: 20 }}>›</span>
        </button>
      ))}
    </section>
  );
}

function MetricaCard({ label, valor, sub, icon }: { label: string; valor: string; sub: string; icon: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.12)",
      borderRadius: 12,
      padding: "12px 10px",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontWeight: "bold", fontSize: 22, lineHeight: 1 }}>{valor}</div>
      <div style={{ fontSize: 10, opacity: 0.7, marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: "#C9A84C", marginTop: 2, fontWeight: "bold" }}>{sub}</div>}
    </div>
  );
}
