"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Crear / Editar Bebida con imagen
// ─────────────────────────────────────────────
import { useState } from "react";
import { Header } from "./ui/components";
import { colors, inputStyle, btnPrimary, btnSecondary, cardStyle } from "./ui/styles";
import { Producto } from "./ui/types";
import { supabase } from "@/supabase";

interface Props {
  bebidaEditar?: Producto;
  onGuardar: () => void;
  onBack:    () => void;
}

export default function FormBebidaScreen({ bebidaEditar, onGuardar, onBack }: Props) {
  const editando = !!bebidaEditar;

  const [nombre,     setNombre]     = useState(bebidaEditar?.nombre    ?? "");
  const [precio,     setPrecio]     = useState(bebidaEditar?.precio?.toString() ?? "");
  const [imagenUrl,  setImagenUrl]  = useState(bebidaEditar?.imagen_url ?? "");
  const [preview,    setPreview]    = useState(bebidaEditar?.imagen_url ?? "");
  const [error,      setError]      = useState("");
  const [cargando,   setCargando]   = useState(false);
  const [subiendo,   setSubiendo]   = useState(false);

  const handleImagen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview local
    const url = URL.createObjectURL(file);
    setPreview(url);

    // Subir a Supabase Storage
    setSubiendo(true);
    const ext      = file.name.split(".").pop();
    const fileName = `${Date.now()}.${ext}`;

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

  const handleGuardar = async () => {
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return; }
    if (!precio.trim() || isNaN(parseFloat(precio)) || parseFloat(precio) <= 0) {
      setError("Ingresa un precio válido."); return;
    }

    setCargando(true);
    setError("");

    const datos = {
      nombre,
      precio:     parseFloat(precio),
      imagen_url: imagenUrl || null,
      emoji:      "🍹", // fallback
    };

    if (editando) {
      const { error: err } = await supabase.from("productos").update(datos).eq("id", bebidaEditar.id);
      if (err) { setError("Error: " + err.message); setCargando(false); return; }
    } else {
      const { error: err } = await supabase.from("productos").insert({ ...datos, activo: true });
      if (err) { setError("Error: " + err.message); setCargando(false); return; }
    }

    setCargando(false);
    onGuardar();
  };

  return (
    <section>
      <Header titulo={editando ? "Editar bebida" : "Nueva bebida"} onBack={onBack} />

      <div style={cardStyle}>
        {/* Preview imagen */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{
            width: 140, height: 140, borderRadius: 16, overflow: "hidden",
            margin: "0 auto 12px", background: "#f5f5f5",
            border: `2px dashed ${preview ? colors.primary : colors.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {preview ? (
              <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: 48 }}>🍹</span>
            )}
          </div>

          {/* Botón subir imagen */}
          <label style={{
            display: "inline-block", padding: "8px 20px", borderRadius: 20,
            background: colors.primaryLight, color: colors.primary,
            fontWeight: "bold", fontSize: 13, cursor: "pointer", border: `1px solid ${colors.primary}`,
          }}>
            {subiendo ? "Subiendo..." : "📷 Subir imagen"}
            <input
              type="file" accept="image/*" onChange={handleImagen}
              style={{ display: "none" }} disabled={subiendo}
            />
          </label>
          <p style={{ fontSize: 11, color: colors.textMuted, marginTop: 6 }}>
            JPG o PNG · 400×400px recomendado · máx 500KB
          </p>
        </div>

        {/* Nombre */}
        <label style={labelStyle}>Nombre de la bebida</label>
        <input
          placeholder="Ej: Limonada Tamarindo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          style={inputStyle}
        />

        {/* Precio */}
        <label style={labelStyle}>Precio (L.)</label>
        <input
          placeholder="0.00"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          type="number" min="0"
          style={{ ...inputStyle, fontSize: 20, fontWeight: "bold" }}
        />

        {error && <p style={{ color: colors.danger, fontSize: 14, marginBottom: 12 }}>⚠️ {error}</p>}

        <button
          style={{ ...btnPrimary, opacity: (cargando || subiendo) ? 0.7 : 1 }}
          onClick={handleGuardar}
          disabled={cargando || subiendo}
        >
          {cargando ? "Guardando..." : `💾 ${editando ? "GUARDAR CAMBIOS" : "CREAR BEBIDA"}`}
        </button>
        <button style={{ ...btnSecondary, marginTop: 10 }} onClick={onBack}>CANCELAR</button>
      </div>
    </section>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: "bold", color: "#555", marginBottom: 6,
};
