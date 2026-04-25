"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Crear / Editar Sucursal
// ─────────────────────────────────────────────
import { useEffect, useState } from "react";
import { Header } from "./ui/components";
import { colors, inputStyle, btnPrimary, btnSecondary, cardStyle } from "./ui/styles";
import { Sucursal } from "./ui/types";
import { supabase } from "@/supabase";

interface Props {
  sucursalEditar?: Sucursal;
  onGuardar: () => void;
  onBack: () => void;
}

const generarSiguienteCodigo = (codigoActual: string) => {
  const numero = parseInt(codigoActual || "0", 10);
  const siguiente = numero + 1;
  return siguiente.toString().padStart(2, "0");
};

export default function FormSucursalScreen({ sucursalEditar, onGuardar, onBack }: Props) {
  const editando = !!sucursalEditar;
  const inhabilitada = editando && sucursalEditar?.activo === false;

  const [codigo, setCodigo] = useState(sucursalEditar?.codigo ?? "");
  const [nombre, setNombre] = useState(sucursalEditar?.nombre ?? "");
  const [ciudad, setCiudad] = useState(sucursalEditar?.ciudad ?? "");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const cargarCodigoAutomatico = async () => {
      if (editando) return;

      const { data, error: err } = await supabase
        .from("sucursales")
        .select("codigo")
        .order("id", { ascending: false })
        .limit(1);

      if (err) {
        setError("Error al generar código automático: " + err.message);
        return;
      }

      const ultimoCodigo = data?.[0]?.codigo ?? "00";
      setCodigo(generarSiguienteCodigo(ultimoCodigo));
    };

    cargarCodigoAutomatico();
  }, [editando]);

  const handleGuardar = async () => {
    if (inhabilitada) {
      setError("No se puede editar una sucursal inhabilitada.");
      return;
    }

    if (!codigo.trim()) {
      setError("El código es obligatorio.");
      return;
    }

    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (!ciudad.trim()) {
      setError("La ciudad es obligatoria.");
      return;
    }

    setCargando(true);
    setError("");

    if (editando) {
      const { error: err } = await supabase
        .from("sucursales")
        .update({
          nombre: nombre.trim(),
          ciudad: ciudad.trim(),
        })
        .eq("id", sucursalEditar.id);

      if (err) {
        setError("Error al guardar: " + err.message);
        setCargando(false);
        return;
      }
    } else {
      const { error: err } = await supabase
        .from("sucursales")
        .insert({
          codigo,
          nombre: nombre.trim(),
          ciudad: ciudad.trim(),
          activo: true,
        });

      if (err) {
        setError(
          err.message.includes("unique")
            ? "Ese código ya existe."
            : "Error al crear: " + err.message
        );
        setCargando(false);
        return;
      }
    }

    setCargando(false);
    onGuardar();
  };

  const handleInhabilitar = async () => {
    if (!sucursalEditar) return;

    setCargando(true);
    setError("");

    const { count, error: errUsuarios } = await supabase
      .from("usuarios")
      .select("id", { count: "exact", head: true })
      .eq("sucursal_id", sucursalEditar.id)
      .eq("activo", true);

    if (errUsuarios) {
      setError("Error al validar usuarios asignados: " + errUsuarios.message);
      setCargando(false);
      return;
    }

    if ((count ?? 0) > 0) {
      setError("No se puede inhabilitar esta sucursal porque tiene usuarios activos asignados.");
      setCargando(false);
      return;
    }

    const { error: err } = await supabase
      .from("sucursales")
      .update({ activo: false })
      .eq("id", sucursalEditar.id);

    if (err) {
      setError("Error al inhabilitar: " + err.message);
      setCargando(false);
      return;
    }

    setCargando(false);
    onGuardar();
  };

  return (
    <section>
      <Header titulo={editando ? "Editar sucursal" : "Nueva sucursal"} onBack={onBack} />

      <div style={cardStyle}>
        {inhabilitada && (
          <p
            style={{
              color: colors.danger,
              background: "#fff1f1",
              border: `1px solid ${colors.danger}`,
              padding: 12,
              borderRadius: 10,
              fontSize: 14,
              marginBottom: 16,
            }}
          >
            ⚠️ Esta sucursal está inhabilitada. No se puede editar.
          </p>
        )}

        <label style={labelStyle}>Código</label>
        <input
          placeholder="Asignado automáticamente"
          value={codigo}
          style={{ ...inputStyle, opacity: 0.7 }}
          disabled
        />
        <p style={{ fontSize: 12, color: colors.textMuted, marginTop: -8, marginBottom: 12 }}>
          El código es asignado automáticamente por el sistema.
        </p>

        <label style={labelStyle}>Nombre</label>
        <input
          placeholder="Ej: Sucursal Multiplaza"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          style={inputStyle}
          disabled={inhabilitada}
        />

        <label style={labelStyle}>Ciudad</label>
        <input
          placeholder="Ej: San Pedro Sula"
          value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
          style={inputStyle}
          disabled={inhabilitada}
        />

        {error && (
          <p style={{ color: colors.danger, fontSize: 14, marginBottom: 12 }}>
            ⚠️ {error}
          </p>
        )}

        {!inhabilitada && (
          <button
            style={{ ...btnPrimary, opacity: cargando ? 0.7 : 1 }}
            onClick={handleGuardar}
            disabled={cargando}
          >
            {cargando ? "Guardando..." : `💾 ${editando ? "GUARDAR CAMBIOS" : "CREAR SUCURSAL"}`}
          </button>
        )}

        {editando && !inhabilitada && (
          <button
            style={{
              ...btnSecondary,
              marginTop: 10,
              color: colors.danger,
              borderColor: colors.danger,
            }}
            onClick={handleInhabilitar}
            disabled={cargando}
          >
            INHABILITAR SUCURSAL
          </button>
        )}

        <button style={{ ...btnSecondary, marginTop: 10 }} onClick={onBack}>
          CANCELAR
        </button>
      </div>
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