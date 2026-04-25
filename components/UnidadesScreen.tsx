"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Maestro de Unidades (Admin)
// ─────────────────────────────────────────────
import { useEffect, useState } from "react";
import { Header } from "./ui/components";
import { colors, btnPrimary, cardStyle, inputStyle } from "./ui/styles";
import { supabase } from "@/supabase";

interface Unidad {
  id: number;
  nombre: string;
  abreviatura: string;
  activo: boolean;
}

interface Props {
  onBack: () => void;
}

export default function UnidadesScreen({ onBack }: Props) {
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nombre, setNombre] = useState("");
  const [abrev, setAbrev] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [verInhabilitadas, setVerInhabilitadas] = useState(false);

  useEffect(() => {
    cargar();
  }, [verInhabilitadas]);

  const cargar = async () => {
    setCargando(true);

    const { data, error: err } = await supabase
      .from("unidades")
      .select("*")
      .eq("activo", !verInhabilitadas)
      .order("nombre");

    if (err) {
      setError("Error cargando unidades: " + err.message);
      setCargando(false);
      return;
    }

    setUnidades((data as Unidad[]) ?? []);
    setCargando(false);
  };

  const toggleActivo = async (u: Unidad) => {
    setError("");

    const { error: err } = await supabase
      .from("unidades")
      .update({ activo: !u.activo })
      .eq("id", u.id);

    if (err) {
      setError("Error actualizando unidad: " + err.message);
      return;
    }

    cargar();
  };

  const handleCrear = async () => {
    const nombreFinal = nombre.trim();
    const abrevFinal = abrev.trim();

    if (!nombreFinal) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (!abrevFinal) {
      setError("La abreviatura es obligatoria.");
      return;
    }

    setGuardando(true);
    setError("");

    const { error: err } = await supabase.from("unidades").insert({
      nombre: nombreFinal,
      abreviatura: abrevFinal,
      activo: true,
    });

    if (err) {
      setError(err.message.includes("unique") ? "Esa unidad ya existe." : err.message);
      setGuardando(false);
      return;
    }

    setNombre("");
    setAbrev("");
    setGuardando(false);
    cargar();
  };

  return (
    <section>
      <Header titulo="Unidades de Medida" onBack={onBack} />

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => setVerInhabilitadas(false)}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: 10,
            border: "none",
            fontWeight: "bold",
            background: !verInhabilitadas ? colors.primary : "#eee",
            color: !verInhabilitadas ? "white" : "#555",
            cursor: "pointer",
          }}
        >
          Activas
        </button>

        <button
          type="button"
          onClick={() => setVerInhabilitadas(true)}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: 10,
            border: "none",
            fontWeight: "bold",
            background: verInhabilitadas ? colors.danger : "#eee",
            color: verInhabilitadas ? "white" : "#555",
            cursor: "pointer",
          }}
        >
          Inhabilitadas
        </button>
      </div>

      {!verInhabilitadas && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 14, color: colors.textPrimary }}>
            + Nueva unidad
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 8, marginBottom: 8 }}>
            <input
              placeholder="Nombre (Ej: Onza)"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              style={{ ...inputStyle, marginBottom: 0 }}
            />

            <input
              placeholder="Abrev."
              value={abrev}
              onChange={(e) => setAbrev(e.target.value)}
              style={{ ...inputStyle, marginBottom: 0 }}
              maxLength={5}
            />
          </div>

          <button
            style={{ ...btnPrimary, opacity: guardando ? 0.7 : 1 }}
            onClick={handleCrear}
            disabled={guardando}
          >
            {guardando ? "Guardando..." : "CREAR UNIDAD"}
          </button>
        </div>
      )}

      {error && (
        <p style={{ color: colors.danger, fontSize: 14, marginBottom: 12 }}>
          ⚠️ {error}
        </p>
      )}

      {cargando ? (
        <div style={{ textAlign: "center", color: colors.textMuted, padding: 40 }}>
          Cargando...
        </div>
      ) : unidades.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", color: colors.textMuted, padding: 40 }}>
          {verInhabilitadas ? "No hay unidades inhabilitadas." : "No hay unidades activas."}
        </div>
      ) : (
        unidades.map((u) => (
          <div key={u.id} style={{ ...cardStyle, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <span style={{ fontWeight: "bold", fontSize: 15 }}>
                  {u.nombre}
                </span>

                <span style={{ fontSize: 13, color: colors.textMuted, marginLeft: 8 }}>
                  ({u.abreviatura})
                </span>

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: "bold",
                    padding: "2px 8px",
                    borderRadius: 20,
                    marginLeft: 8,
                    background: u.activo ? colors.primaryLight : "#fdecea",
                    color: u.activo ? colors.primary : colors.danger,
                  }}
                >
                  {u.activo ? "Activa" : "Inhabilitada"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => toggleActivo(u)}
                style={verInhabilitadas ? btnActivar : btnInhabilitar}
              >
                {verInhabilitadas ? "✅ Activar" : "🚫 Inhabilitar"}
              </button>
            </div>
          </div>
        ))
      )}
    </section>
  );
}

const btnInhabilitar: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 8,
  border: "none",
  background: "#fdecea",
  color: "#c62828",
  fontWeight: "bold",
  fontSize: 12,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const btnActivar: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 8,
  border: "none",
  background: "#e8f5e9",
  color: "#2e7d32",
  fontWeight: "bold",
  fontSize: 12,
  cursor: "pointer",
  whiteSpace: "nowrap",
};