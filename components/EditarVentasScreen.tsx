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

interface VentaItem {
  id:              number;
  venta_id:        number;
  nombre_producto: string;
  cantidad:        number;
  subtotal:        number;
  costo_total:     number;
}

const METODOS = ["efectivo", "tarjeta", "transferencia"] as const;

const METODO_EMOJI: Record<string, string> = {
  efectivo: "💵", tarjeta: "💳", transferencia: "📲",
};

const fmt = (n: number) =>
  Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const horaHN = (iso: string) => {
  const utc = iso.includes("Z") || /[+-]\d{2}:\d{2}$/.test(iso) ? iso : iso + "Z";
  const hn = new Date(new Date(utc).getTime() - 6 * 60 * 60 * 1000);
  const h = hn.getUTCHours();
  const m = String(hn.getUTCMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
};

export default function EditarVentasScreen({ onBack }: { onBack: () => void }) {
  const [fecha,         setFecha]         = useState(hoyHN());
  const [ventas,        setVentas]        = useState<Venta[]>([]);
  const [filtroMetodo,  setFiltroMetodo]  = useState<string>("todos");
  const [items,         setItems]         = useState<Record<number, VentaItem[]>>({});
  const [expandido,     setExpandido]     = useState<Set<number>>(new Set());
  const [editItems,     setEditItems]     = useState<Record<number, number>>({});
  const [cargando,      setCargando]      = useState(true);
  const [guardando,     setGuardando]     = useState<number | null>(null);
  const [guardandoItem, setGuardandoItem] = useState<number | null>(null);
  const [mensaje,       setMensaje]       = useState<{ id: number; texto: string; ok: boolean } | null>(null);

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
        supabase.from("venta_items").select("id, venta_id, nombre_producto, cantidad, subtotal, costo_total"),
      ]);

    const sucMap: Record<number, string> = {};
    (sucData || []).forEach((s: any) => { sucMap[s.id] = `${s.codigo} - ${s.nombre}`; });
    const usrMap: Record<string, string> = {};
    (usrData || []).forEach((u: any) => { usrMap[u.id] = u.nombre; });
    const itemsCountMap: Record<number, number> = {};
    const itemsFullMap: Record<number, VentaItem[]> = {};
    (itemsData || []).forEach((i: any) => {
      itemsCountMap[i.venta_id] = (itemsCountMap[i.venta_id] || 0) + (i.cantidad || 0);
      if (!itemsFullMap[i.venta_id]) itemsFullMap[i.venta_id] = [];
      itemsFullMap[i.venta_id].push(i as VentaItem);
    });
    setItems(itemsFullMap);
    setExpandido(new Set());
    setEditItems({});

    setVentas((ventasData || []).map((v: any) => ({
      ...v,
      sucursal: sucMap[v.sucursal_id] || `Sucursal ${v.sucursal_id}`,
      cajero:   usrMap[v.usuario_id]  || "—",
      num_items: itemsCountMap[v.id] || 0,
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

  const toggleExpandir = (ventaId: number) => {
    setExpandido((prev) => {
      const next = new Set(prev);
      if (next.has(ventaId)) next.delete(ventaId); else next.add(ventaId);
      return next;
    });
  };

  const guardarCantidad = async (ventaId: number, item: VentaItem, nuevaCantidad: number) => {
    if (nuevaCantidad < 1 || nuevaCantidad === item.cantidad) return;
    setGuardandoItem(item.id);
    setMensaje(null);

    const precioUnit = item.cantidad > 0 ? item.subtotal / item.cantidad : 0;
    const costoUnit  = item.cantidad > 0 ? item.costo_total / item.cantidad : 0;
    const nuevoSubtotal = precioUnit * nuevaCantidad;
    const nuevoCosto    = costoUnit  * nuevaCantidad;

    const { error: errItem } = await supabase.from("venta_items")
      .update({ cantidad: nuevaCantidad, subtotal: nuevoSubtotal, costo_total: nuevoCosto })
      .eq("id", item.id);

    if (errItem) {
      setMensaje({ id: ventaId, texto: "Error al guardar", ok: false });
      setGuardandoItem(null);
      return;
    }

    const itemsActualizados = (items[ventaId] || []).map((i) =>
      i.id === item.id ? { ...i, cantidad: nuevaCantidad, subtotal: nuevoSubtotal, costo_total: nuevoCosto } : i
    );
    const nuevoTotal = itemsActualizados.reduce((s, i) => s + i.subtotal, 0);

    const { error: errVenta } = await supabase.from("ventas")
      .update({ total: nuevoTotal })
      .eq("id", ventaId);

    if (errVenta) {
      setMensaje({ id: ventaId, texto: "Error al actualizar total", ok: false });
    } else {
      setItems((prev) => ({ ...prev, [ventaId]: itemsActualizados }));
      setVentas((prev) => prev.map((v) => v.id === ventaId ? { ...v, total: nuevoTotal, num_items: itemsActualizados.reduce((s, i) => s + i.cantidad, 0) } : v));
      setEditItems((prev) => { const n = { ...prev }; delete n[item.id]; return n; });
      setMensaje({ id: ventaId, texto: "Guardado", ok: true });
      setTimeout(() => setMensaje(null), 2000);
    }
    setGuardandoItem(null);
  };

  const ventasFiltradas = filtroMetodo === "todos"
    ? ventas
    : ventas.filter((v) => v.metodo_pago === filtroMetodo);

  const totalVentas = ventasFiltradas.reduce((s, v) => s + v.total, 0);

  const FILTROS = [
    { key: "todos", label: "Todos" },
    { key: "efectivo",      label: `${METODO_EMOJI.efectivo} Efectivo` },
    { key: "tarjeta",       label: `${METODO_EMOJI.tarjeta} Tarjeta` },
    { key: "transferencia", label: `${METODO_EMOJI.transferencia} Transferencia` },
  ];

  return (
    <section>
      <Header titulo="Editar ventas" onBack={onBack} />

      {/* Selector de fecha */}
      <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
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

      {/* Filtro por método de pago */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {FILTROS.map(({ key, label }) => {
          const activo = filtroMetodo === key;
          return (
            <button
              key={key}
              onClick={() => setFiltroMetodo(key)}
              style={{
                padding: "7px 16px", borderRadius: 20, fontSize: 13,
                border: activo ? "none" : `1px solid ${colors.border}`,
                background: activo ? colors.primary : "white",
                color: activo ? "white" : colors.textSecondary,
                fontWeight: activo ? "bold" : "normal",
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {cargando ? (
        <div style={{ textAlign: "center", color: colors.textMuted, padding: 40 }}>Cargando...</div>
      ) : ventas.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", color: colors.textMuted, padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🧾</div>
          <p>No hay ventas para esta fecha.</p>
        </div>
      ) : ventasFiltradas.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", color: colors.textMuted, padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <p>No hay ventas con ese método de pago.</p>
        </div>
      ) : (
        <>
          {/* Resumen del día */}
          <div style={{ ...cardStyle, marginBottom: 16, background: colors.primaryLight }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: colors.textMuted }}>{ventasFiltradas.length} ventas</span>
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
          {ventasFiltradas.map((v) => (
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

              {/* Toggle items */}
              <div style={{ borderTop: `1px solid ${colors.border}`, marginTop: 10, paddingTop: 8 }}>
                <button
                  onClick={() => toggleExpandir(v.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: colors.textSecondary, fontWeight: 600, padding: 0 }}
                >
                  {expandido.has(v.id) ? "▲ Ocultar items" : "▼ Editar cantidades"}
                </button>
              </div>

              {expandido.has(v.id) && (
                <div style={{ marginTop: 8 }}>
                  {(items[v.id] || []).map((item) => {
                    const draft = editItems[item.id] ?? item.cantidad;
                    const precioUnit = item.cantidad > 0 ? item.subtotal / item.cantidad : 0;
                    const changed = draft !== item.cantidad;
                    return (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, padding: "4px 0", borderBottom: `1px solid #f3f4f6` }}>
                        <span style={{ flex: 1, fontSize: 13, color: colors.textPrimary }}>{item.nombre_producto}</span>
                        <input
                          type="number"
                          min={1}
                          value={draft}
                          onChange={(e) => setEditItems((prev) => ({ ...prev, [item.id]: Math.max(1, Number(e.target.value)) }))}
                          style={{ width: 54, padding: "4px 6px", borderRadius: 8, border: `1px solid ${changed ? colors.primary : colors.border}`, fontSize: 13, textAlign: "center", outline: "none" }}
                        />
                        <span style={{ fontSize: 12, color: colors.textMuted, minWidth: 64, textAlign: "right" }}>
                          L {fmt(precioUnit * draft)}
                        </span>
                        {changed && (
                          <button
                            onClick={() => guardarCantidad(v.id, item, draft)}
                            disabled={guardandoItem === item.id}
                            style={{ padding: "5px 10px", borderRadius: 8, background: colors.primary, color: "white", border: "none", fontSize: 13, cursor: "pointer", fontWeight: "bold", opacity: guardandoItem === item.id ? 0.6 : 1 }}
                          >
                            {guardandoItem === item.id ? "…" : "✔"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </section>
  );
}
