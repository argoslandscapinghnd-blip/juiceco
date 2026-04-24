"use client";

import { useEffect, useRef, useState } from "react";

type Pantalla = "login" | "punto" | "caja" | "menu" | "cantidad" | "carrito";

type ItemCarrito = {
  nombre: string;
  cantidad: number;
  precio: number;
};

const PRECIO_UNITARIO = 50; // Lempiras por limonada

const sabores = [
  { nombre: "Limonada Natural", emoji: "🍋" },
  { nombre: "Limonada Fresa", emoji: "🍓" },
  { nombre: "Limonada Maracuyá", emoji: "🌿" },
  { nombre: "Limonada Mango", emoji: "🥭" },
  { nombre: "Limonada Pepino", emoji: "🥒" },
  { nombre: "Limonada Menta", emoji: "🌱" },
];

const puntos = [
  "01 - Sucursal Centro",
  "02 - Sucursal Mall",
  "03 - Sucursal Comayagüela",
  "04 - Sucursal San Pedro Sula",
];

export default function Home() {
  const [pantalla, setPantalla] = useState<Pantalla>("login");
  const [productoSeleccionado, setProductoSeleccionado] = useState<string | null>(null);
  const [usuario, setUsuario] = useState("");
  const [recordarUsuario, setRecordarUsuario] = useState(false);
  const [puntoSeleccionado, setPuntoSeleccionado] = useState("");
  const [fondoInicial, setFondoInicial] = useState("");
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);

  const usuarioRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

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
    if (!usuario.trim()) return;
    if (recordarUsuario) {
      localStorage.setItem("juiceco_usuario", usuario);
    } else {
      localStorage.removeItem("juiceco_usuario");
    }
    setPantalla("punto");
  };

  const seleccionarPunto = (punto: string) => {
    setPuntoSeleccionado(punto);
    setPantalla("caja");
  };

  const abrirCaja = () => {
    if (!fondoInicial.trim()) return;
    setPantalla("menu");
  };

  const agregarAlCarrito = (cantidad: number) => {
    const existe = carrito.find((i) => i.nombre === productoSeleccionado);
    if (existe) {
      setCarrito(
        carrito.map((i) =>
          i.nombre === productoSeleccionado
            ? { ...i, cantidad: i.cantidad + cantidad }
            : i
        )
      );
    } else {
      setCarrito([
        ...carrito,
        { nombre: productoSeleccionado!, cantidad, precio: PRECIO_UNITARIO },
      ]);
    }
    setPantalla("menu");
  };

  const eliminarDelCarrito = (nombre: string) => {
    setCarrito(carrito.filter((i) => i.nombre !== nombre));
  };

  const totalCarrito = carrito.reduce((s, i) => s + i.cantidad * i.precio, 0);
  const unidadesCarrito = carrito.reduce((s, i) => s + i.cantidad, 0);

  return (
    <main style={{ minHeight: "100vh", background: "#f0f4f1", padding: "20px 16px" }}>
      <div style={{ width: "100%", maxWidth: 480, margin: "0 auto" }}>

        {/* ── PANTALLA 1: LOGIN ── */}
        {pantalla === "login" && (
          <section>
            <div style={{ textAlign: "center", marginBottom: 32, marginTop: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 4 }}>🍋</div>
              <h1 style={{ color: "#0b6b2b", margin: 0, fontSize: 28, letterSpacing: 2 }}>
                JUICE CO.
              </h1>
            </div>

            <div style={card}>
              <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 18 }}>Iniciar sesión</h2>

              <input
                ref={usuarioRef}
                placeholder="👤  Usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                style={input}
              />
              <input
                ref={passwordRef}
                placeholder="🔒  Contraseña"
                type="password"
                style={input}
                onKeyDown={(e) => e.key === "Enter" && ingresar()}
              />

              <label style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={recordarUsuario}
                  onChange={(e) => setRecordarUsuario(e.target.checked)}
                />
                <span style={{ fontSize: 14, color: "#555" }}>Recordarme</span>
              </label>

              <button style={btn} onClick={ingresar}>INGRESAR</button>
              <p style={{ textAlign: "center", fontSize: 12, color: "#aaa", marginTop: 16, marginBottom: 0 }}>
                © 2026 Juice Co. Todos los derechos reservados.
              </p>
            </div>
          </section>
        )}

        {/* ── PANTALLA 2: PUNTO DE VENTA ── */}
        {pantalla === "punto" && (
          <section>
            <Header titulo="Seleccione punto de venta" onBack={() => setPantalla("login")} />

            {puntos.map((p) => (
              <button key={p} style={cardBtn} onClick={() => seleccionarPunto(p)}>
                <span style={{ fontWeight: "bold" }}>{p}</span>
                <span style={{ color: "#aaa", fontSize: 13 }}>
                  {p.includes("San Pedro") ? "San Pedro Sula" : "Tegucigalpa"}
                </span>
              </button>
            ))}

            <button style={{ ...btn, background: "#e8f5e9", color: "#0b6b2b", border: "1px solid #0b6b2b", marginTop: 8 }}>
              🔄 SINCRONIZAR DATOS
            </button>
          </section>
        )}

        {/* ── PANTALLA 3: APERTURA DE CAJA ── */}
        {pantalla === "caja" && (
          <section>
            <Header titulo="Apertura de caja" onBack={() => setPantalla("punto")} />

            <div style={card}>
              <Row label="Punto de venta" valor={puntoSeleccionado} />
              <Row label="Usuario" valor={usuario} />
              <Row label="Fecha" valor={new Date().toLocaleDateString("es-HN", { day:"2-digit", month:"2-digit", year:"numeric" })} />

              <label style={{ display: "block", marginTop: 16, marginBottom: 6, fontWeight: "bold", fontSize: 14 }}>
                Fondo inicial de caja (L.)
              </label>
              <input
                placeholder="0.00"
                value={fondoInicial}
                onChange={(e) => setFondoInicial(e.target.value)}
                type="number"
                style={{ ...input, fontSize: 28, fontWeight: "bold", textAlign: "center" }}
              />
              <button style={btn} onClick={abrirCaja}>ABRIR CAJA</button>
            </div>
          </section>
        )}

        {/* ── PANTALLA 4: MENÚ DE SABORES ── */}
        {pantalla === "menu" && (
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>🍋</span>
                <span style={{ fontWeight: "bold", fontSize: 18, color: "#0b6b2b" }}>JUICE CO.</span>
              </div>
              {unidadesCarrito > 0 && (
                <div style={{ background: "#0b6b2b", color: "white", borderRadius: 20, padding: "4px 12px", fontSize: 14, fontWeight: "bold" }}>
                  🛒 {unidadesCarrito}
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              {sabores.map((s) => (
                <button
                  key={s.nombre}
                  style={cardBtn2}
                  onClick={() => {
                    setProductoSeleccionado(s.nombre);
                    setPantalla("cantidad");
                  }}
                >
                  <span style={{ fontSize: 32 }}>{s.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: "bold", textAlign: "center", color: "#333" }}>
                    {s.nombre}
                  </span>
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <button style={{ ...cardBtn2, opacity: 0.7 }}>
                <span style={{ fontSize: 28 }}>📦</span>
                <span style={{ fontSize: 13, fontWeight: "bold" }}>OTROS PRODUCTOS</span>
              </button>
              <button style={{ ...cardBtn2, opacity: 0.7 }}>
                <span style={{ fontSize: 28 }}>💧</span>
                <span style={{ fontSize: 13, fontWeight: "bold" }}>AGUA</span>
              </button>
            </div>

            {unidadesCarrito > 0 && (
              <button
                style={{ ...btn, background: "#f5a623", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px" }}
                onClick={() => setPantalla("carrito")}
              >
                <span>🛒 VER CARRITO ({unidadesCarrito})</span>
                <span>L {totalCarrito.toFixed(2)}</span>
              </button>
            )}
          </section>
        )}

        {/* ── PANTALLA 5: SELECCIÓN DE CANTIDAD ── */}
        {pantalla === "cantidad" && productoSeleccionado && (
          <CantidadScreen
            producto={productoSeleccionado}
            onAgregar={agregarAlCarrito}
            onCancelar={() => setPantalla("menu")}
          />
        )}

        {/* ── PANTALLA 6: CARRITO ── */}
        {pantalla === "carrito" && (
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Header titulo="Venta actual" onBack={() => setPantalla("menu")} />
              {carrito.length > 0 && (
                <button
                  onClick={() => setCarrito([])}
                  style={{ background: "none", border: "none", color: "#e53935", cursor: "pointer", fontSize: 20 }}
                  title="Vaciar carrito"
                >
                  🗑️
                </button>
              )}
            </div>

            {carrito.length === 0 ? (
              <div style={{ ...card, textAlign: "center", color: "#aaa", padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
                <p>El carrito está vacío</p>
                <button style={btn} onClick={() => setPantalla("menu")}>AGREGAR PRODUCTOS</button>
              </div>
            ) : (
              <div style={card}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 8, marginBottom: 8, color: "#888", fontSize: 13, fontWeight: "bold" }}>
                  <span>Producto</span>
                  <span style={{ textAlign: "center" }}>Cant.</span>
                  <span style={{ textAlign: "right" }}>Total</span>
                  <span></span>
                </div>
                <hr style={{ border: "none", borderTop: "1px solid #eee", marginBottom: 12 }} />

                {carrito.map((item) => (
                  <div key={item.nombre} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 8, alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: "500" }}>{item.nombre}</span>
                    <span style={{ textAlign: "center", fontWeight: "bold" }}>{item.cantidad}</span>
                    <span style={{ textAlign: "right", fontWeight: "bold" }}>L {(item.cantidad * item.precio).toFixed(2)}</span>
                    <button
                      onClick={() => eliminarDelCarrito(item.nombre)}
                      style={{ background: "none", border: "none", color: "#e53935", cursor: "pointer", fontSize: 18, padding: "0 4px" }}
                    >
                      ×
                    </button>
                  </div>
                ))}

                <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "12px 0" }} />

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: "#888", fontSize: 14 }}>
                  <span>Subtotal</span>
                  <span>L {totalCarrito.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, color: "#888", fontSize: 14 }}>
                  <span>Descuento</span>
                  <span>L 0.00</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: 18, marginBottom: 20, color: "#0b6b2b" }}>
                  <span>TOTAL</span>
                  <span>L {totalCarrito.toFixed(2)}</span>
                </div>

                <button style={btn}>
                  ✅ FINALIZAR VENTA
                </button>
              </div>
            )}
          </section>
        )}

      </div>
    </main>
  );
}

// ── COMPONENTE: PANTALLA DE CANTIDAD ──
function CantidadScreen({
  producto,
  onAgregar,
  onCancelar,
}: {
  producto: string;
  onAgregar: (cant: number) => void;
  onCancelar: () => void;
}) {
  const [cantidad, setCantidad] = useState(1);

  const presionar = (val: string) => {
    if (val === "CE") { setCantidad(1); return; }
    if (val === "⌫") { setCantidad((c) => Math.max(1, Math.floor(c / 10))); return; }
    const nuevo = parseInt(`${cantidad === 1 ? "" : cantidad}${val}`);
    setCantidad(nuevo > 99 ? 99 : nuevo || 1);
  };

  return (
    <section>
      <Header titulo={producto} onBack={onCancelar} />

      <div style={card}>
        <p style={{ textAlign: "center", color: "#888", marginTop: 0 }}>Seleccione cantidad</p>

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 24, margin: "16px 0 24px" }}>
          <button style={btnSmall} onClick={() => setCantidad((c) => Math.max(1, c - 1))}>−</button>
          <span style={{ fontSize: 56, fontWeight: "bold", minWidth: 72, textAlign: "center", color: "#0b6b2b" }}>
            {cantidad}
          </span>
          <button style={btnSmall} onClick={() => setCantidad((c) => Math.min(99, c + 1))}>+</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 20 }}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "CE", "0", "⌫"].map((k) => (
            <button
              key={k}
              onClick={() => presionar(k)}
              style={{
                padding: 18,
                borderRadius: 10,
                border: "1px solid #ddd",
                background: k === "CE" ? "#fff3cd" : k === "⌫" ? "#fdecea" : "white",
                fontWeight: "bold",
                fontSize: 18,
                cursor: "pointer",
              }}
            >
              {k}
            </button>
          ))}
        </div>

        <button style={btn} onClick={() => onAgregar(cantidad)}>
          🛒 AGREGAR AL CARRITO
        </button>
      </div>
    </section>
  );
}

// ── COMPONENTE: HEADER CON BOTÓN ATRÁS ──
function Header({ titulo, onBack }: { titulo: string; onBack: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <button
        onClick={onBack}
        style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#0b6b2b", padding: 0 }}
      >
        ←
      </button>
      <h2 style={{ margin: 0, fontSize: 18 }}>{titulo}</h2>
    </div>
  );
}

// ── COMPONENTE: FILA DE DATO ──
function Row({ label, valor }: { label: string; valor: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: "bold", fontSize: 16 }}>{valor}</div>
    </div>
  );
}

// ── ESTILOS BASE ──
const input: React.CSSProperties = {
  width: "100%",
  padding: 14,
  marginBottom: 12,
  borderRadius: 10,
  border: "1px solid #ddd",
  fontSize: 16,
  boxSizing: "border-box",
  outline: "none",
};

const btn: React.CSSProperties = {
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

const btnSmall: React.CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: 10,
  border: "none",
  background: "#087a2b",
  color: "white",
  fontWeight: "bold",
  fontSize: 28,
  cursor: "pointer",
};

const card: React.CSSProperties = {
  background: "white",
  borderRadius: 16,
  padding: 20,
  marginBottom: 12,
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
};

const cardBtn: React.CSSProperties = {
  width: "100%",
  padding: "16px 18px",
  marginBottom: 10,
  borderRadius: 12,
  border: "1px solid #e0e0e0",
  background: "white",
  fontWeight: "bold",
  fontSize: 15,
  cursor: "pointer",
  textAlign: "left",
  display: "flex",
  flexDirection: "column",
  gap: 2,
  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
};

const cardBtn2: React.CSSProperties = {
  padding: "20px 12px",
  borderRadius: 14,
  border: "1px solid #e0e0e0",
  background: "white",
  fontWeight: "bold",
  fontSize: 13,
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 8,
  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
};
