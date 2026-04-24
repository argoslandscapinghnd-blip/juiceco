"use client";

import { useEffect, useRef, useState } from "react";

type Pantalla = "login" | "punto" | "caja" | "menu" | "cantidad";

export default function Home() {
  const [pantalla, setPantalla] = useState<Pantalla>("login");
  const [productoSeleccionado, setProductoSeleccionado] = useState<string | null>(null);
  const [usuario, setUsuario] = useState("");
  const [recordarUsuario, setRecordarUsuario] = useState(false);

  const usuarioRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const sabores = [
    "Limonada Natural",
    "Limonada Fresa",
    "Limonada Maracuyá",
    "Limonada Mango",
    "Limonada Pepino",
    "Limonada Menta",
  ];

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("juiceco_usuario");

    if (usuarioGuardado) {
      setUsuario(usuarioGuardado);
      setRecordarUsuario(true);
      setTimeout(() => passwordRef.current?.focus(), 100);
    } else {
      setTimeout(() => usuarioRef.current?.focus(), 100);
    }
  }, []);

  const ingresar = () => {
    if (recordarUsuario && usuario.trim() !== "") {
      localStorage.setItem("juiceco_usuario", usuario);
    } else {
      localStorage.removeItem("juiceco_usuario");
    }

    setPantalla("punto");
  };

  return (
    <main style={{ minHeight: "100vh", background: "#f5f7f6", padding: 20 }}>
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          margin: "0 auto",
        }}
      >
        {pantalla === "login" && (
          <section>
            <h1 style={{ color: "#0b6b2b", textAlign: "center" }}>JUICE CO.</h1>
            <h2>Iniciar sesión</h2>

            <input
              ref={usuarioRef}
              placeholder="Usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              style={input}
            />

            <input
              ref={passwordRef}
              placeholder="Contraseña"
              type="password"
              style={input}
            />

            <label style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input
                type="checkbox"
                checked={recordarUsuario}
                onChange={(e) => setRecordarUsuario(e.target.checked)}
              />
              Recordar usuario
            </label>

            <button style={btn} onClick={ingresar}>
              INGRESAR
            </button>
          </section>
        )}

        {pantalla === "punto" && (
          <section>
            <h2>Seleccione punto de venta</h2>

            {[
              "01 - Sucursal Centro",
              "02 - Sucursal Mall",
              "03 - Sucursal San Pedro Sula",
            ].map((p) => (
              <button key={p} style={card} onClick={() => setPantalla("caja")}>
                {p}
              </button>
            ))}
          </section>
        )}

        {pantalla === "caja" && (
          <section>
            <h2>Apertura de caja</h2>
            <p>
              <b>Punto:</b> 01 - Sucursal Centro
            </p>

            <input placeholder="Fondo inicial de caja" style={input} />

            <button style={btn} onClick={() => setPantalla("menu")}>
              ABRIR CAJA
            </button>
          </section>
        )}

        {pantalla === "menu" && (
          <section>
            <h2 style={{ textAlign: "center" }}>Menú de sabores</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {sabores.map((sabor) => (
                <button
                  key={sabor}
                  style={card}
                  onClick={() => {
                    setProductoSeleccionado(sabor);
                    setPantalla("cantidad");
                  }}
                >
                  {sabor}
                </button>
              ))}
            </div>
          </section>
        )}

        {pantalla === "cantidad" && productoSeleccionado && (
          <section>
            <h2 style={{ textAlign: "center" }}>{productoSeleccionado}</h2>
            <p style={{ textAlign: "center" }}>Seleccione cantidad</p>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 20,
                margin: "20px 0",
              }}
            >
              <button style={btnSmall}>-</button>
              <span style={{ fontSize: 36, fontWeight: "bold" }}>1</span>
              <button style={btnSmall}>+</button>
            </div>

            <button style={btn} onClick={() => setPantalla("menu")}>
              AGREGAR AL CARRITO
            </button>
          </section>
        )}
      </div>
    </main>
  );
}

const input = {
  width: "100%",
  padding: 14,
  marginBottom: 12,
  borderRadius: 10,
  border: "1px solid #ddd",
  fontSize: 16,
};

const btn = {
  width: "100%",
  padding: 16,
  borderRadius: 10,
  border: "none",
  background: "#087a2b",
  color: "white",
  fontWeight: "bold",
  fontSize: 16,
  cursor: "pointer",
};

const btnSmall = {
  width: 70,
  padding: 16,
  borderRadius: 10,
  border: "none",
  background: "#087a2b",
  color: "white",
  fontWeight: "bold",
  fontSize: 24,
  cursor: "pointer",
};

const card = {
  width: "100%",
  padding: 18,
  marginBottom: 10,
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "white",
  fontWeight: "bold",
  fontSize: 15,
  cursor: "pointer",
};