"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Pantalla 3: Apertura de Caja
//  Guarda la sesión activa en Supabase
// ─────────────────────────────────────────────
import { useState } from "react";
import { Header, Row } from "./ui/components";
import { colors, inputStyle, btnPrimary, cardStyle } from "./ui/styles";
import { supabase } from "@/supabase";

interface Props {
  sucursalId: number;
  punto:      string;
  usuario:    string;
  usuarioId:  string;
  onAbrir:    (sesionId: number, fondo: number) => void;
  onBack:     () => void;
}

export default function AperturaCajaScreen({
  sucursalId, punto, usuario, usuarioId, onAbrir, onBack,
}: Props) {
  const [fondo,    setFondo]    = useState("");
  const [error,    setError]    = useState("");
  const [cargando, setCargando] = useState(false);

  const fecha = new Date().toLocaleDateString("es-HN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  }) + "  " + new Date().toLocaleTimeString("es-HN", {
    hour: "2-digit", minute: "2-digit",
  });

  const handleAbrir = async () => {
    const valor = parseFloat(fondo);
    if (!fondo.trim() || isNaN(valor) || valor < 0) {
      setError("Ingresa un fondo inicial válido.");
      return;
    }

    setCargando(true);
    setError("");

    // Crear sesión activa en Supabase
    const { data, error: err } = await supabase
      .from("sesiones_caja")
      .insert({
        sucursal_id:    sucursalId,
        usuario_id:     usuarioId,
        usuario_nombre: usuario,
        fondo_inicial:  valor,
        activa:         true,
      })
      .select()
      .single();

    setCargando(false);

    if (err) {
      setError("Error al abrir caja: " + err.message);
      return;
    }

    onAbrir(data.id, valor);
  };

  return (
    <section>
      <Header titulo="Apertura de caja" onBack={onBack} />

      <div style={cardStyle}>
        <Row label="Punto de venta" valor={punto} />
        <Row label="Usuario"        valor={usuario} />
        <Row label="Fecha"          valor={fecha} />

        <label style={{ display: "block", marginTop: 16, marginBottom: 6, fontWeight: "bold", fontSize: 14, color: colors.textPrimary }}>
          Fondo inicial de caja (L.)
        </label>
        <input
          placeholder="0.00"
          value={fondo}
          onChange={(e) => setFondo(e.target.value)}
          type="number"
          min="0"
          style={{ ...inputStyle, fontSize: 28, fontWeight: "bold", textAlign: "center" }}
        />

        {error && (
          <p style={{ color: colors.danger, fontSize: 14, marginBottom: 12 }}>⚠️ {error}</p>
        )}

        <button
          style={{ ...btnPrimary, opacity: cargando ? 0.7 : 1 }}
          onClick={handleAbrir}
          disabled={cargando}
        >
          {cargando ? "Abriendo..." : "ABRIR CAJA"}
        </button>
      </div>
    </section>
  );
}