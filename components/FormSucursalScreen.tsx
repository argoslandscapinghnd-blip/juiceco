"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Crear / Editar Sucursal
// ─────────────────────────────────────────────
import { useState } from "react";
import { Header } from "./ui/components";
import { colors, inputStyle, btnPrimary, btnSecondary, cardStyle } from "./ui/styles";
import { Sucursal } from "./ui/types";
import { supabase } from "@/supabase";

interface Props {
  sucursalEditar?: Sucursal;
  onGuardar: () => void;
  onBack:    () => void;
}

export default function FormSucursalScreen({ sucursalEditar, onGuardar, onBack }: Props) {
  const editando = !!sucursalEditar;

  const [codigo,   setCodigo]   = useState(sucursalEditar?.codigo  ?? "");
  const [nombre,   setNombre]   = useState(sucursalEditar?.nombre  ?? "");
  const [ciudad,   setCiudad]   = useState(sucursalEditar?.ciudad  ?? "");
  const [error,    setError]    = useState("");
  const [cargando, setCargando] = useState(false);

  const handleGuardar = async () => {
    if (!codigo.trim())  { setError("El código es obligatorio.");  return; }
    if (!nombre.trim())  { setError("El nombre es obligatorio.");  return; }
    if (!ciudad.trim())  { setError("La ciudad es obligatoria.");  return; }

    setCargando(true);
    setError("");

    if (editando) {
      const { error: err } = await supabase
        .from("sucursales")
        .update({ codigo, nombre, ciudad })
        .eq("id", sucursalEditar.id);

      if (err) { setError("Error al guardar: " + err.message); setCargando(false); return; }
    } else {
      const { error: err } = await supabase
        .from("sucursales")
        .insert({ codigo, nombre, ciudad, activo: true });

      if (err) {
        setError(err.message.includes("unique") ? "Ese código ya existe." : "Error al crear: " + err.message);
        setCargando(false);
        return;
      }
    }

    setCargando(false);
    onGuardar();
  };

  return (
    <section>
      <Header titulo={editando ? "Editar sucursal" : "Nueva sucursal"} onBack={onBack} />

      <div style={cardStyle}>
        <label style={labelStyle}>Código</label>
        <input
          placeholder="Ej: 05"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          style={inputStyle}
          disabled={editando}
        />
        {editando && (
          <p style={{ fontSize: 12, color: colors.textMuted, marginTop: -8, marginBottom: 12 }}>
            El código no se puede cambiar.
          </p>
        )}

        <label style={labelStyle}>Nombre</label>
        <input
          placeholder="Ej: Sucursal Multiplaza"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          style={inputStyle}
        />

        <label style={labelStyle}>Ciudad</label>
        <input
          placeholder="Ej: San Pedro Sula"
          value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
          style={inputStyle}
        />

        {error && (
          <p style={{ color: colors.danger, fontSize: 14, marginBottom: 12 }}>⚠️ {error}</p>
        )}

        <button
          style={{ ...btnPrimary, opacity: cargando ? 0.7 : 1 }}
          onClick={handleGuardar}
          disabled={cargando}
        >
          {cargando ? "Guardando..." : `💾 ${editando ? "GUARDAR CAMBIOS" : "CREAR SUCURSAL"}`}
        </button>
        <button style={{ ...btnSecondary, marginTop: 10 }} onClick={onBack}>CANCELAR</button>
      </div>
    </section>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: "bold", color: "#555", marginBottom: 6,
};
