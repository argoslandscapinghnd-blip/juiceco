"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Pantalla 3: Apertura de Caja
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
  const [fondoRaw, setFondoRaw] = useState(""); // solo dígitos y punto
  const [error,    setError]    = useState("");
  const [cargando, setCargando] = useState(false);

  const fecha = new Date().toLocaleDateString("es-HN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  }) + "  " + new Date().toLocaleTimeString("es-HN", {
    hour: "2-digit", minute: "2-digit",
  });

  // Formatea el número con comas para mostrar en el input
  const formatearInput = (raw: string): string => {
    if (!raw) return "";
    const [entera, decimal] = raw.split(".");
    const enteraFmt = parseInt(entera || "0").toLocaleString("en-US");
    return decimal !== undefined ? `${enteraFmt}.${decimal}` : enteraFmt;
  };

  // Al cambiar el input, guardamos solo dígitos y un punto
  const handleCambio = (val: string) => {
    // Quitar todo excepto dígitos y punto
    const soloNumeros = val.replace(/[^0-9.]/g, "");
    // No más de un punto decimal
    const partes = soloNumeros.split(".");
    if (partes.length > 2) return;
    // No más de 2 decimales
    if (partes[1] && partes[1].length > 2) return;
    setFondoRaw(soloNumeros);
  };

  const valorNumerico = parseFloat(fondoRaw) || 0;

  const handleAbrir = async () => {
    if (!fondoRaw.trim() || isNaN(valorNumerico) || valorNumerico < 0) {
      setError("Ingresa un fondo inicial válido.");
      return;
    }
    setCargando(true);
    setError("");

    const { data, error: err } = await supabase
      .from("sesiones_caja")
      .insert({
        sucursal_id:    sucursalId,
        usuario_id:     usuarioId,
        usuario_nombre: usuario,
        fondo_inicial:  valorNumerico,
        activa:         true,
      })
      .select()
      .single();

    setCargando(false);
    if (err) { setError("Error al abrir caja: " + err.message); return; }
    onAbrir(data.id, valorNumerico);
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
          value={formatearInput(fondoRaw)}
          onChange={(e) => handleCambio(e.target.value)}
          inputMode="decimal"
          autoFocus
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
