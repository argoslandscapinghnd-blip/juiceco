"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Crear / Editar Bebida
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

const EMOJIS_SUGERIDOS = [
  "🍋","🍓","🌿","🥭","🥒","🌱","💧","🍊","🍍","🫐",
  "🍇","🍉","🥝","🍑","🍒","🫒","🌺","🍵","🧃","🥤",
  "🫖","🍹","🧋","🥛","🍺","🫗","🧊","🌸","🍀","🌼",
];

export default function FormBebidaScreen({ bebidaEditar, onGuardar, onBack }: Props) {
  const editando = !!bebidaEditar;

  const [nombre,    setNombre]    = useState(bebidaEditar?.nombre ?? "");
  const [emoji,     setEmoji]     = useState(bebidaEditar?.emoji  ?? "🍹");
  const [precio,    setPrecio]    = useState(bebidaEditar?.precio?.toString() ?? "");
  const [error,     setError]     = useState("");
  const [cargando,  setCargando]  = useState(false);
  const [verEmojis, setVerEmojis] = useState(false);

  const handleGuardar = async () => {
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return; }
    if (!precio.trim() || isNaN(parseFloat(precio)) || parseFloat(precio) <= 0) {
      setError("Ingresa un precio válido."); return;
    }

    setCargando(true);
    setError("");

    if (editando) {
      const { error: err } = await supabase
        .from("productos")
        .update({ nombre, emoji, precio: parseFloat(precio) })
        .eq("id", bebidaEditar.id);
      if (err) { setError("Error al guardar: " + err.message); setCargando(false); return; }
    } else {
      const { error: err } = await supabase
        .from("productos")
        .insert({ nombre, emoji, precio: parseFloat(precio), activo: true });
      if (err) { setError("Error al crear: " + err.message); setCargando(false); return; }
    }

    setCargando(false);
    onGuardar();
  };

  return (
    <section>
      <Header titulo={editando ? "Editar bebida" : "Nueva bebida"} onBack={onBack} />

      <div style={cardStyle}>
        {/* Preview */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 64 }}>{emoji}</span>
          <div style={{ fontSize: 15, fontWeight: "bold", color: colors.textPrimary, marginTop: 4 }}>
            {nombre || "Nombre de la bebida"}
          </div>
          {precio && (
            <div style={{ fontSize: 14, color: colors.primary, marginTop: 2 }}>
              L {parseFloat(precio || "0").toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          )}
        </div>

        {/* Selector de emoji */}
        <label style={labelStyle}>Emoji</label>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 36, width: 52, height: 52, borderRadius: 12, border: `2px solid ${colors.primary}`, display: "flex", alignItems: "center", justifyContent: "center", background: colors.primaryLight }}>
            {emoji}
          </div>
          <button
            onClick={() => setVerEmojis(!verEmojis)}
            style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${colors.border}`, background: "white", cursor: "pointer", fontSize: 13, fontWeight: "bold", color: colors.primary }}
          >
            {verEmojis ? "✕ Cerrar" : "🎨 Cambiar emoji"}
          </button>
        </div>

        {verEmojis && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginBottom: 16, background: "#f9f9f9", padding: 12, borderRadius: 10 }}>
            {EMOJIS_SUGERIDOS.map((e) => (
              <button
                key={e}
                onClick={() => { setEmoji(e); setVerEmojis(false); }}
                style={{ fontSize: 24, padding: 6, borderRadius: 8, cursor: "pointer", border: `2px solid ${emoji === e ? colors.primary : "transparent"}`, background: emoji === e ? colors.primaryLight : "white" }}
              >
                {e}
              </button>
            ))}
            <input
              placeholder="✍️"
              maxLength={2}
              onChange={(e) => e.target.value && setEmoji(e.target.value)}
              style={{ fontSize: 20, textAlign: "center", borderRadius: 8, border: `1px solid ${colors.border}`, padding: 4 }}
            />
          </div>
        )}

        <label style={labelStyle}>Nombre de la bebida</label>
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

        {error && <p style={{ color: colors.danger, fontSize: 14, marginBottom: 12 }}>⚠️ {error}</p>}

        <button style={{ ...btnPrimary, opacity: cargando ? 0.7 : 1 }} onClick={handleGuardar} disabled={cargando}>
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
