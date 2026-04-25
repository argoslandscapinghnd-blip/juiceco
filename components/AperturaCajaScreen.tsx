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

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2 });

export default function AperturaCajaScreen({
  sucursalId, punto, usuario, usuarioId, onAbrir, onBack,
}: Props) {
  const [fondoTexto, setFondoTexto] = useState("");
  const [error,      setError]      = useState("");
  const [cargando,   setCargando]   = useState(false);

  const fecha = new Date().toLocaleDateString("es-HN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  }) + "  " + new Date().toLocaleTimeString("es-HN", {
    hour: "2-digit", minute: "2-digit",
  });

  // Solo permite dígitos y un punto decimal
  const handleCambio = (val: string) => {
    const limpio = val.replace(/[^0-9.]/g, "");
    const partes = limpio.split(".");
    if (partes.length > 2) return; // no más de un punto
    setFondoTexto(limpio);
  };

  const valorNumerico = parseFloat(fondoTexto) || 0;

  const handleAbrir = async () => {
    if (!fondoTexto.trim() || isNaN(valorNumerico) || valorNumerico < 0) {
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
          value={fondoTexto}
          onChange={(e) => handleCambio(e.target.value)}
          inputMode="decimal"
          style={{ ...inputStyle, fontSize: 28, fontWeight: "bold", textAlign: "center" }}
        />

        {/* Preview con separador de miles */}
        {valorNumerico > 0 && (
          <div style={{ textAlign: "center", fontSize: 16, color: colors.primary, fontWeight: "bold", marginTop: 4, marginBottom: 8 }}>
            L {fmt(valorNumerico)}
          </div>
        )}

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
