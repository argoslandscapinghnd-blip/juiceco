"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — Pantalla 7: Tipo de Factura
// ─────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import { Header } from "./ui/components";
import { colors, btnPrimary, cardStyle, inputStyle } from "./ui/styles";
import { DatosFactura } from "./ui/types";
import { supabase } from "@/supabase";

interface Props {
  onContinuar: (conFactura: boolean, datos?: DatosFactura) => void;
  onBack: () => void;
}

interface ClienteRTN {
  rtn: string;
  nombre: string;
  correo?: string;
}

export default function FacturaScreen({ onContinuar, onBack }: Props) {
  const [paso, setPaso] = useState<"elegir" | "datos">("elegir");
  const [rtn, setRtn] = useState("");
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [clientes, setClientes] = useState<ClienteRTN[]>([]);
  const [error, setError] = useState("");

  const rtnRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    cargarRTNs();
  }, []);

  useEffect(() => {
    if (paso === "datos") {
      setTimeout(() => rtnRef.current?.focus(), 100);
    }
  }, [paso]);

  const limpiarRTN = (valor: string) => {
    return valor.replace(/\D/g, "").slice(0, 14);
  };

  const cargarRTNs = async () => {
    const { data, error: err } = await supabase
      .from("ventas")
      .select("rtn, nombre_fiscal, correo_fiscal, creada_en")
      .eq("con_factura", true)
      .not("rtn", "is", null)
      .order("creada_en", { ascending: false })
      .limit(100);

    if (err) {
      console.error("Error cargando RTNs:", err.message);
      return;
    }

    const mapa = new Map<string, ClienteRTN>();

    (data ?? []).forEach((v: any) => {
      const rtnGuardado = limpiarRTN(String(v.rtn ?? ""));
      const nombreGuardado = String(v.nombre_fiscal ?? "").trim();
      const correoGuardado = String(v.correo_fiscal ?? "").trim();

      if (rtnGuardado && !mapa.has(rtnGuardado)) {
        mapa.set(rtnGuardado, {
          rtn: rtnGuardado,
          nombre: nombreGuardado,
          correo: correoGuardado,
        });
      }
    });

    setClientes(Array.from(mapa.values()));
  };

  const handleFacturaFormal = () => setPaso("datos");

  const seleccionarCliente = (cliente: ClienteRTN) => {
    setRtn(cliente.rtn);
    setNombre(cliente.nombre ?? "");
    setCorreo(cliente.correo ?? "");
    setBusqueda("");
    setError("");
    setTimeout(() => rtnRef.current?.focus(), 50);
  };

  const handleContinuarConDatos = () => {
    const rtnFinal = limpiarRTN(rtn);

    if (!rtnFinal) {
      setError("El RTN es obligatorio.");
      return;
    }

    if (rtnFinal.length !== 14) {
      setError("El RTN debe tener exactamente 14 dígitos.");
      return;
    }

    if (!nombre.trim()) {
      setError("El nombre o razón social es obligatorio.");
      return;
    }

    setError("");

    onContinuar(true, {
      rtn: rtnFinal,
      nombre: nombre.trim(),
      correo: correo.trim(),
    });
  };

  const textoBusqueda = busqueda.trim().toLowerCase().replace(/\D/g, "");
  const textoNombreBusqueda = busqueda.trim().toLowerCase();

  const clientesFiltrados =
    busqueda.trim().length > 0
      ? clientes
          .filter((c) => {
            const rtnCliente = c.rtn.toLowerCase();
            const nombreCliente = c.nombre.toLowerCase();

            return (
              rtnCliente.includes(textoBusqueda) ||
              nombreCliente.includes(textoNombreBusqueda)
            );
          })
          .slice(0, 8)
      : [];

  if (paso === "elegir") {
    return (
      <section>
        <Header titulo="Factura" onBack={onBack} />

        <div style={{ ...cardStyle, textAlign: "center", padding: "32px 20px" }}>
          <h2 style={{ marginTop: 0, marginBottom: 28, fontSize: 20, color: colors.textPrimary }}>
            ¿Desea factura?
          </h2>

          <button style={opcionBtn} onClick={handleFacturaFormal}>
            <span style={{ fontSize: 36, marginBottom: 8 }}>🧾</span>
            <span style={{ fontWeight: "bold", fontSize: 18, color: colors.textPrimary }}>SÍ</span>
            <span style={{ fontSize: 13, color: colors.textMuted }}>Factura formal</span>
          </button>

          <button style={{ ...opcionBtn, marginTop: 12 }} onClick={() => onContinuar(false)}>
            <span style={{ fontSize: 36, marginBottom: 8 }}>👤</span>
            <span style={{ fontWeight: "bold", fontSize: 18, color: colors.textPrimary }}>NO</span>
            <span style={{ fontSize: 13, color: colors.textMuted }}>Consumidor final</span>
          </button>

          <button
            style={{
              background: "none",
              border: "none",
              color: colors.textMuted,
              cursor: "pointer",
              marginTop: 20,
              fontSize: 15,
              width: "100%",
            }}
            onClick={onBack}
          >
            CANCELAR
          </button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <Header titulo="Factura formal" onBack={() => setPaso("elegir")} />

      <div style={cardStyle}>
        <label style={labelStyle}>RTN</label>
        <input
          ref={rtnRef}
          placeholder="08011987012345"
          value={rtn}
          onChange={(e) => {
            setRtn(limpiarRTN(e.target.value));
            setError("");
          }}
          style={inputStyle}
          inputMode="numeric"
        />

        <label style={labelStyle}>Buscar cliente anterior</label>
        <input
          placeholder="Buscar por RTN o nombre"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={inputStyle}
        />

        {clientesFiltrados.length > 0 && (
          <div style={{ marginTop: -8, marginBottom: 14 }}>
            {clientesFiltrados.map((cliente) => (
              <button
                key={cliente.rtn}
                type="button"
                onClick={() => seleccionarCliente(cliente)}
                style={clienteBtn}
              >
                <strong>{cliente.rtn}</strong>
                <span style={{ color: colors.textMuted }}>
                  {cliente.nombre || "Sin nombre fiscal"}
                </span>
              </button>
            ))}
          </div>
        )}

        {busqueda.trim().length > 0 && clientesFiltrados.length === 0 && (
          <p style={{ fontSize: 12, color: colors.textMuted, marginTop: -8, marginBottom: 14 }}>
            No se encontraron clientes con ese RTN o nombre.
          </p>
        )}

        <label style={labelStyle}>Nombre / Razón Social</label>
        <input
          placeholder="Juan Pérez"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          style={inputStyle}
        />

        <label style={labelStyle}>Correo (opcional)</label>
        <input
          placeholder="juanperez@gmail.com"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          style={inputStyle}
          type="email"
        />

        {error && (
          <p style={{ color: colors.danger, fontSize: 14, marginBottom: 12, marginTop: 0 }}>
            ⚠️ {error}
          </p>
        )}

        <button style={btnPrimary} onClick={handleContinuarConDatos}>
          CONTINUAR
        </button>
      </div>
    </section>
  );
}

const opcionBtn: React.CSSProperties = {
  width: "100%",
  padding: "20px 16px",
  borderRadius: 14,
  border: `1px solid #e0e0e0`,
  background: "#fafafa",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
  transition: "background 0.15s",
};

const clienteBtn: React.CSSProperties = {
  width: "100%",
  border: `1px solid ${colors.border}`,
  background: "#fff",
  borderRadius: 10,
  padding: "10px 12px",
  marginBottom: 6,
  cursor: "pointer",
  textAlign: "left",
  display: "flex",
  flexDirection: "column",
  gap: 3,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: "bold",
  color: "#555",
  marginBottom: 6,
};