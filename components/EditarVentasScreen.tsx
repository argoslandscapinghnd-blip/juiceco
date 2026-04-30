"use client";
import { useEffect, useState } from "react";
import { Header } from "./ui/components";
import { colors, cardStyle } from "./ui/styles";
import { supabase } from "@/supabase";
import { hoyHN, inicioDiaHN, finDiaHN } from "@/lib/utils";

interface Venta {
  id:           number;
  creada_en:    string;
  total:        number;
  metodo_pago:  string;
  sucursal_id:  number;
  usuario_id:   string;
  sucursal:     string;
  cajero:       string;
  num_items:    number;
}

const METODOS = ["efectivo", "tarjeta", "transferencia"] as const;

const METODO_EMOJI: Record<string, string> = {
  efectivo: "💵", tarjeta: "💳", transferencia: "📲",
};

const fmt = (n: number) =>
  Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const horaHN = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-HN", {
    timeZone: "America/Tegucigalpa",
    hour: "2-digit", minute: "2-digit",
  });

export default function EditarVentasScreen({ onBack }: { onBack: () => void }) {
  const [fecha,    setFecha]    = useState(hoyHN());
  const [ventas,   setVentas]   = useState<Venta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState<number | null>(null);
  const [mensaje,  setMensaje]  = useState<{ id: number; texto: string; ok: boolean } | null>(null);

  useEffect(() => { cargar(); }, [fecha]);

  const cargar = async () => {
    setCargando(true);
    const from = inicioDiaHN(fecha);
    const to   = finDiaHN(fecha);

    const [{ data: ventasData }, { data: sucData }, { data: usrData }, { data: itemsData }] =
      await Promise.all([
        supabase.from("ventas")
          .select("id, creada_en, total, metodo_pago, sucursal_id, usuario_id")
          .gte("creada_en", from).lte("creada_en", to)
          .order("creada_en", { ascending: false }),
        supabase.from("sucursales").select("id, nombre, codigo"),
        supabase.from("usuarios").select("id, nombre"),
        supabase.from("venta_items").select("venta_id, cantidad"),
      ]);

    const sucMap: Record<number, string> = {};
    (sucData || []).forEach((s: any) => { sucMap[s.id] = `${s.codigo} - ${s.nombre}`; });
    const usrMap: Record<string, string> = {};
    (usrData || []).forEach((u: any) => { usrMap[u.id] = u.nombre; });
    const itemsMap: Record<number, number> = {};
    (itemsData || []).forEach((i: any) => {
      itemsMap[i.venta_id] = (itemsMap[i.venta_id] || 0) + (i.cantidad || 0);
    });

    setVentas((ventasData || []).map((v: any) => ({
      ...v,
      sucursal: sucMap[v.sucursal_id] || `Sucursal ${v.sucursal_id}`,
      cajero:   usrMap[v.usuario_id]  || "—",
      num_items: itemsMap[v.id] || 0,
    })));
    setCargando(false);
  };

  const cambiarMetodo = async (venta: Venta, nuevoMetodo: string) => {
    if (nuevoMetodo === venta.metodo_pago) return;
    setGuardando(venta.id);
    setMensaje(null);

    const { error } = await supabase
      .from("ventas")
      .update({ metodo_pago: nuevoMetodo })
      .eq("id", venta.id);

    if (error) {
      setMensaje({ id: venta.id, texto: "Error al guardar", ok: false });
    } else {
      setVentas((prev) =>
        prev.map((v) => v.id === venta.id ? { ...v, metodo_pago: nuevoMetodo } : v)
      );
      setMensaje({ id: venta.id, texto: "Guardado", ok: true });
      setTimeout(() => setMensaje(null), 2000);
    }
    setGuardando(null);
  };

  const totalVentas = ventas.reduce((s, v) => s + v.total, 0);

  return (
    <section>
      <Header titulo="Editar ventas" onBack={onBack} />

      {/* Selector de fecha */}
      <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: 18 }}>📅</span>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          style={{
            flex: 1, padding: "10px 12px", borderRadius: 10,
            border: `1px solid ${colors.border}`, fontSize: 14,
            background: "#fafafa", outline: "none",
          }}
        />
      </div>

      {cargando ? (
        <div style={{ textAlign: "center", color: colors.textMuted, padding: 40 }}>Cargando...</div>
      ) : ventas.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", color: colors.textMuted, padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🧾</div>
          <p>No hay ventas para esta fecha.</p>
        </div>
      ) : (
        <>
          {/* Resumen del día */}
          <div style={{ ...cardStyle, marginBottom: 16, background: colors.primaryLight }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: colors.textMuted }}>{ventas.length} ventas</span>
              <span style={{ fontWeight: "bold", color: colors.primary }}>Total L {fmt(totalVentas)}</span>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
              {METODOS.map((m) => {
                const count = ventas.filter((v) => v.metodo_pago === m).length;
                return count > 0 ? (
                  <span key={m} style={{ fontSize: 12, color: colors.textSecondary }}>
                    {METODO_EMOJI[m]} {m}: <strong>{count}</strong>
                  </span>
                ) : null;
              })}
            </div>
          </div>

          {/* Lista de ventas */}
          {ventas.map((v) => (
            <div key={v.id} style={{ ...cardStyle, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: "bold", fontSize: 14, color: colors.textPrimary }}>
                    #{v.id} · {horaHN(v.creada_en)}
                  </div>
                  <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                    {v.sucursal}
                  </div>
                  <div style={{ fontSize: 12, color: colors.textMuted }}>
                    👤 {v.cajero} · {v.num_items} uds
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: "bold", fontSize: 15, color: colors.primary }}>
                    L {fmt(v.total)}
                  </div>
                </div>
              </div>

              {/* Selector de método */}
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: colors.textMuted, marginRight: 4 }}>Método:</span>
                {METODOS.map((m) => {
                  const activo = v.metodo_pago === m;
                  const ocupado = guardando === v.id;
                  return (
                    <button
                      key={m}
                      disabled={ocupado}
                      onClick={() => cambiarMetodo(v, m)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 20,
                        border: activo ? "none" : `1px solid ${colors.border}`,
                        background: activo ? colors.primary : "white",
                        color: activo ? "white" : colors.textSecondary,
                        fontWeight: activo ? "bold" : "normal",
                        fontSize: 13,
                        cursor: ocupado ? "not-allowed" : "pointer",
                        opacity: ocupado ? 0.6 : 1,
                      }}
                    >
                      {METODO_EMOJI[m]} {m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  );
                })}
                {mensaje?.id === v.id && (
                  <span style={{
                    fontSize: 12, fontWeight: "bold",
                    color: mensaje.ok ? colors.primary : colors.danger,
                  }}>
                    {mensaje.ok ? "✔ " : "✘ "}{mensaje.texto}
                  </span>
                )}
              </div>
            </div>
          ))}
        </>
      )}
    </section>
  );
}
