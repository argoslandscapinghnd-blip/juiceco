"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Crear / Editar Bebida + Receta
// ─────────────────────────────────────────────
import { useEffect, useState } from "react";
import { Header, Divider } from "./ui/components";
import { colors, inputStyle, btnPrimary, btnSecondary, cardStyle } from "./ui/styles";
import { Producto } from "./ui/types";
import { supabase } from "@/supabase";

interface Insumo {
  id: number;
  nombre: string;
  unidad: string;
  tipo: string;
  costo_unitario: number;
}

interface LineaReceta {
  insumo_id: number;
  insumo: Insumo;
  cantidad: number;
  costo_linea: number;
}

interface Props {
  bebidaEditar?: Producto;
  onGuardar: () => void;
  onBack: () => void;
}

const fmt = (n: number) =>
  Number(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function FormBebidaScreen({ bebidaEditar, onGuardar, onBack }: Props) {
  const editando = !!bebidaEditar;

  const [nombre, setNombre] = useState(bebidaEditar?.nombre ?? "");
  const [precio, setPrecio] = useState(bebidaEditar?.precio?.toString() ?? "");
  const [imagenUrl, setImagenUrl] = useState(bebidaEditar?.imagen_url ?? "");
  const [preview, setPreview] = useState(bebidaEditar?.imagen_url ?? "");

  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [lineas, setLineas] = useState<LineaReceta[]>([]);
  const [insumoSelec, setInsumoSelec] = useState<number>(0);
  const [cantidad, setCantidad] = useState("");

  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [paso, setPaso] = useState<"info" | "receta">("info");

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const { data: insumosData, error: errInsumos } = await supabase
      .from("insumos_maestro")
      .select("*")
      .eq("activo", true)
      .order("tipo")
      .order("nombre");

    if (errInsumos) {
      setError("Error cargando insumos: " + errInsumos.message);
      return;
    }

    setInsumos((insumosData as Insumo[]) ?? []);

    if (editando && bebidaEditar?.id) {
      const { data: recetaData, error: errReceta } = await supabase
        .from("recetas")
        .select("insumo_id, cantidad, unidad, costo_total, insumos_maestro(id, nombre, unidad, tipo, costo_unitario)")
        .eq("producto_id", bebidaEditar.id);

      if (errReceta) {
        setError("Error cargando receta: " + errReceta.message);
        return;
      }

      const lineasCargadas: LineaReceta[] = (recetaData ?? [])
        .filter((r: any) => r.insumos_maestro)
        .map((r: any) => {
          const insumo = r.insumos_maestro as Insumo;
          const cant = Number(r.cantidad || 0);
          const costo = Number(r.costo_total || cant * Number(insumo.costo_unitario || 0));

          return {
            insumo_id: Number(r.insumo_id),
            insumo,
            cantidad: cant,
            costo_linea: costo,
          };
        });

      setLineas(lineasCargadas);
    }
  };

  const costoTotal = lineas.reduce((s, l) => s + Number(l.costo_linea || 0), 0);
  const precioNum = parseFloat(precio) || 0;
  const utilidad = precioNum - costoTotal;
  const margen = precioNum > 0 ? (utilidad / precioNum) * 100 : 0;

  const handleImagen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setSubiendo(true);
    setError("");

    const fileName = `${Date.now()}.${file.name.split(".").pop()}`;

    const { error: errUp } = await supabase.storage
      .from("bebidas")
      .upload(fileName, file, { upsert: true });

    if (errUp) {
      setError("Error al subir imagen: " + errUp.message);
      setSubiendo(false);
      return;
    }

    const { data } = supabase.storage.from("bebidas").getPublicUrl(fileName);
    setImagenUrl(data.publicUrl);
    setSubiendo(false);
  };

  const agregarLinea = () => {
    if (!insumoSelec || !cantidad || parseFloat(cantidad) <= 0) return;

    const ins = insumos.find((i) => i.id === insumoSelec);
    if (!ins) return;

    if (lineas.find((l) => l.insumo_id === insumoSelec)) {
      setError("Ese insumo ya está en la receta.");
      return;
    }

    const cant = parseFloat(cantidad);
    const costoLinea = cant * Number(ins.costo_unitario || 0);

    setLineas((prev) => [
      ...prev,
      {
        insumo_id: ins.id,
        insumo: ins,
        cantidad: cant,
        costo_linea: costoLinea,
      },
    ]);

    setCantidad("");
    setInsumoSelec(0);
    setError("");
  };

  const eliminarLinea = (insumo_id: number) => {
    setLineas((prev) => prev.filter((l) => l.insumo_id !== insumo_id));
  };

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      setPaso("info");
      return;
    }

    if (!precio.trim() || isNaN(parseFloat(precio)) || parseFloat(precio) <= 0) {
      setError("Ingresa un precio válido.");
      setPaso("info");
      return;
    }

    setCargando(true);
    setError("");

    let productoId = bebidaEditar?.id;

    if (editando) {
      const { error: errProducto } = await supabase
        .from("productos")
        .update({
          nombre: nombre.trim(),
          precio: parseFloat(precio),
          imagen_url: imagenUrl || null,
          emoji: "🍹",
        })
        .eq("id", productoId);

      if (errProducto) {
        setError("Error guardando bebida: " + errProducto.message);
        setCargando(false);
        return;
      }
    } else {
      const { data: productoCreado, error: errProducto } = await supabase
        .from("productos")
        .insert({
          nombre: nombre.trim(),
          precio: parseFloat(precio),
          imagen_url: imagenUrl || null,
          emoji: "🍹",
          activo: true,
        })
        .select("id")
        .single();

      if (errProducto) {
        setError("Error creando bebida: " + errProducto.message);
        setCargando(false);
        return;
      }

      productoId = productoCreado.id;
    }

    if (!productoId) {
      setError("No se pudo obtener el ID de la bebida.");
      setCargando(false);
      return;
    }

    const { error: errDelete } = await supabase
      .from("recetas")
      .delete()
      .eq("producto_id", productoId);

    if (errDelete) {
      setError("Error limpiando receta anterior: " + errDelete.message);
      setCargando(false);
      return;
    }

    if (lineas.length > 0) {
      const recetaPayload = lineas.map((l) => ({
        producto_id: productoId,
        insumo_id: l.insumo_id,
        cantidad: Number(l.cantidad),
        unidad: l.insumo.unidad,
        costo_total: Number(l.costo_linea),
      }));

      const { error: errInsertReceta } = await supabase
        .from("recetas")
        .insert(recetaPayload);

      if (errInsertReceta) {
        setError("Error guardando receta: " + errInsertReceta.message);
        setCargando(false);
        return;
      }
    }

    setCargando(false);
    onGuardar();
  };

  return (
    <section>
      <Header titulo={editando ? "Editar bebida" : "Nueva bebida"} onBack={onBack} />

      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 16,
          borderRadius: 10,
          overflow: "hidden",
          border: `1px solid ${colors.border}`,
        }}
      >
        {(["info", "receta"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPaso(p)}
            style={{
              flex: 1,
              padding: "12px 0",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 14,
              background: paso === p ? colors.primary : "white",
              color: paso === p ? "white" : colors.textMuted,
            }}
          >
            {p === "info" ? "🍹 Bebida" : "📋 Receta"}
          </button>
        ))}
      </div>

      {paso === "info" && (
        <div style={cardStyle}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: 16,
                overflow: "hidden",
                margin: "0 auto 12px",
                background: "#f5f5f5",
                border: `2px dashed ${preview ? colors.primary : colors.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontSize: 48 }}>🍹</span>
              )}
            </div>

            <label
              style={{
                display: "inline-block",
                padding: "8px 20px",
                borderRadius: 20,
                background: colors.primaryLight,
                color: colors.primary,
                fontWeight: "bold",
                fontSize: 13,
                cursor: "pointer",
                border: `1px solid ${colors.primary}`,
              }}
            >
              {subiendo ? "Subiendo..." : "📷 Subir imagen"}
              <input
                type="file"
                accept="image/*"
                onChange={handleImagen}
                style={{ display: "none" }}
                disabled={subiendo}
              />
            </label>

            <p style={{ fontSize: 11, color: colors.textMuted, marginTop: 6 }}>
              JPG o PNG · recomendado 400×400px
            </p>
          </div>

          <label style={labelStyle}>Nombre</label>
          <input
            placeholder="Ej: Limonada Tamarindo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={inputStyle}
          />

          <label style={labelStyle}>Precio (L.)</label>
          <input
            placeholder="0.00"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            type="number"
            min="0"
            style={{ ...inputStyle, fontSize: 20, fontWeight: "bold" }}
          />

          {error && (
            <p style={{ color: colors.danger, fontSize: 14, marginBottom: 12 }}>
              ⚠️ {error}
            </p>
          )}

          <button
            style={btnPrimary}
            onClick={() => {
              if (!nombre.trim() || !precio.trim()) {
                setError("Completa nombre y precio.");
                return;
              }

              setError("");
              setPaso("receta");
            }}
          >
            SIGUIENTE → Agregar receta
          </button>
        </div>
      )}

      {paso === "receta" && (
        <div>
          <div
            style={{
              ...cardStyle,
              background: costoTotal > 0 ? colors.primaryLight : "#f5f5f5",
              marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: colors.textMuted }}>Precio de venta</span>
              <span style={{ fontWeight: "bold", color: colors.primary }}>L {fmt(precioNum)}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: colors.textMuted }}>Costo total</span>
              <span style={{ fontWeight: "bold", color: colors.danger }}>L {fmt(costoTotal)}</span>
            </div>

            <Divider />

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span
                style={{
                  fontWeight: "bold",
                  fontSize: 14,
                  color: utilidad >= 0 ? colors.primary : colors.danger,
                }}
              >
                Utilidad ({margen.toFixed(1)}%)
              </span>
              <span
                style={{
                  fontWeight: "bold",
                  fontSize: 16,
                  color: utilidad >= 0 ? colors.primary : colors.danger,
                }}
              >
                L {fmt(utilidad)}
              </span>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>Ingredientes y empaque</h3>

            {lineas.length === 0 ? (
              <p style={{ color: colors.textMuted, fontSize: 13, textAlign: "center", padding: "12px 0" }}>
                No hay insumos aún. Agrega abajo.
              </p>
            ) : (
              lineas.map((l) => (
                <div
                  key={l.insumo_id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: `1px solid ${colors.border}`,
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: 12,
                        padding: "2px 6px",
                        borderRadius: 10,
                        marginRight: 6,
                        background: l.insumo.tipo === "ingrediente" ? "#e3f2fd" : "#fff3e0",
                        color: l.insumo.tipo === "ingrediente" ? "#1565c0" : "#e65100",
                        fontWeight: "bold",
                      }}
                    >
                      {l.insumo.tipo === "ingrediente" ? "🧪" : "📦"}
                    </span>

                    <span style={{ fontSize: 14, fontWeight: "bold" }}>{l.insumo.nombre}</span>

                    <span style={{ fontSize: 12, color: colors.textMuted, marginLeft: 6 }}>
                      {l.cantidad} {l.insumo.unidad}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: "bold", fontSize: 13, color: colors.danger }}>
                      L {fmt(l.costo_linea)}
                    </span>
                    <button
                      type="button"
                      onClick={() => eliminarLinea(l.insumo_id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: colors.danger,
                        cursor: "pointer",
                        fontSize: 18,
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}

            <div style={{ marginTop: 14 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: "bold",
                  color: colors.textSecondary,
                  marginBottom: 8,
                }}
              >
                + Agregar insumo
              </div>

              <select
                value={insumoSelec}
                onChange={(e) => setInsumoSelec(parseInt(e.target.value))}
                style={{ ...inputStyle, marginBottom: 8 }}
              >
                <option value={0}>Selecciona un insumo...</option>

                <optgroup label="🧪 Ingredientes">
                  {insumos
                    .filter((i) => i.tipo === "ingrediente")
                    .map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nombre} — L {fmt(i.costo_unitario)}/{i.unidad}
                      </option>
                    ))}
                </optgroup>

                <optgroup label="📦 Empaque">
                  {insumos
                    .filter((i) => i.tipo === "empaque")
                    .map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nombre} — L {fmt(i.costo_unitario)}/{i.unidad}
                      </option>
                    ))}
                </optgroup>
              </select>

              <div style={{ display: "flex", gap: 8 }}>
                <input
                  placeholder="Cantidad"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  type="number"
                  min="0"
                  style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                />

                <button
                  type="button"
                  onClick={agregarLinea}
                  disabled={!insumoSelec || !cantidad}
                  style={{
                    padding: "14px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: insumoSelec && cantidad ? colors.primary : "#ccc",
                    color: "white",
                    fontWeight: "bold",
                    cursor: insumoSelec && cantidad ? "pointer" : "not-allowed",
                  }}
                >
                  + Agregar
                </button>
              </div>
            </div>
          </div>

          {error && (
            <p style={{ color: colors.danger, fontSize: 14, margin: "8px 0" }}>
              ⚠️ {error}
            </p>
          )}

          <button
            style={{ ...btnPrimary, marginTop: 16, opacity: cargando ? 0.7 : 1 }}
            onClick={handleGuardar}
            disabled={cargando}
          >
            {cargando ? "Guardando..." : `💾 ${editando ? "GUARDAR CAMBIOS" : "CREAR BEBIDA"}`}
          </button>

          <button style={{ ...btnSecondary, marginTop: 10 }} onClick={onBack}>
            CANCELAR
          </button>
        </div>
      )}
    </section>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: "bold",
  color: "#555",
  marginBottom: 6,
};