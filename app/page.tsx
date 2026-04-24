"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — page.tsx
//  Coordina todas las pantallas y el estado global.
// ─────────────────────────────────────────────
import { useState } from "react";
import { colors } from "@/components/ui/styles";
import {
  Pantalla, ItemCarrito, DatosFactura, MetodoPago, PRECIO_UNITARIO,
} from "@/components/ui/types";

import LoginScreen        from "@/components/LoginScreen";
import PuntoVentaScreen   from "@/components/PuntoVentaScreen";
import AperturaCajaScreen from "@/components/AperturaCajaScreen";
import MenuScreen         from "@/components/MenuScreen";
import CantidadScreen     from "@/components/CantidadScreen";
import CarritoScreen      from "@/components/CarritoScreen";
import FacturaScreen      from "@/components/FacturaScreen";
import PagoScreen         from "@/components/PagoScreen";
import ConfirmacionScreen from "@/components/ConfirmacionScreen";

export default function Home() {
  // ── Sesión ──
  const [pantalla,          setPantalla]          = useState<Pantalla>("login");
  const [usuario,           setUsuario]           = useState("");
  const [puntoSeleccionado, setPuntoSeleccionado] = useState("");
  const [fondoInicial,      setFondoInicial]      = useState(0);

  // ── Carrito ──
  const [carrito,        setCarrito]        = useState<ItemCarrito[]>([]);
  const [productoActual, setProductoActual] = useState<string | null>(null);

  // ── Venta en curso ──
  const [conFactura,    setConFactura]    = useState(false);
  const [datosFactura,  setDatosFactura]  = useState<DatosFactura | undefined>();
  const [metodoPago,    setMetodoPago]    = useState<MetodoPago>("efectivo");
  const [montoRecibido, setMontoRecibido] = useState<number | undefined>();

  const totalCarrito = carrito.reduce((s, i) => s + i.cantidad * i.precio, 0);

  // ── Helpers carrito ──
  const agregarAlCarrito = (cantidad: number) => {
    if (!productoActual) return;
    setCarrito((prev) => {
      const existe = prev.find((i) => i.nombre === productoActual);
      if (existe) {
        return prev.map((i) =>
          i.nombre === productoActual ? { ...i, cantidad: i.cantidad + cantidad } : i
        );
      }
      return [...prev, { nombre: productoActual, cantidad, precio: PRECIO_UNITARIO }];
    });
    setPantalla("menu");
  };

  const eliminarItem  = (nombre: string) => setCarrito((p) => p.filter((i) => i.nombre !== nombre));
  const vaciarCarrito = () => setCarrito([]);

  // ── Nueva venta: resetea todo menos sesión ──
  const nuevaVenta = () => {
    setCarrito([]);
    setProductoActual(null);
    setConFactura(false);
    setDatosFactura(undefined);
    setMontoRecibido(undefined);
    setPantalla("menu");
  };

  return (
    <main style={{ minHeight: "100vh", background: colors.background, padding: "20px 16px" }}>
      <div style={{ width: "100%", maxWidth: 480, margin: "0 auto" }}>

        {pantalla === "login" && (
          <LoginScreen
            onIngresar={(u) => { setUsuario(u); setPantalla("punto"); }}
          />
        )}

        {pantalla === "punto" && (
          <PuntoVentaScreen
            onSeleccionar={(p) => { setPuntoSeleccionado(p); setPantalla("caja"); }}
            onBack={() => setPantalla("login")}
          />
        )}

        {pantalla === "caja" && (
          <AperturaCajaScreen
            punto={puntoSeleccionado}
            usuario={usuario}
            onAbrir={(fondo) => { setFondoInicial(fondo); setPantalla("menu"); }}
            onBack={() => setPantalla("punto")}
          />
        )}

        {pantalla === "menu" && (
          <MenuScreen
            carrito={carrito}
            onSeleccionarSabor={(nombre) => { setProductoActual(nombre); setPantalla("cantidad"); }}
            onVerCarrito={() => setPantalla("carrito")}
          />
        )}

        {pantalla === "cantidad" && productoActual && (
          <CantidadScreen
            producto={productoActual}
            onAgregar={agregarAlCarrito}
            onBack={() => setPantalla("menu")}
          />
        )}

        {pantalla === "carrito" && (
          <CarritoScreen
            carrito={carrito}
            onEliminarItem={eliminarItem}
            onVaciarCarrito={vaciarCarrito}
            onFinalizarVenta={() => setPantalla("factura")}
            onBack={() => setPantalla("menu")}
          />
        )}

        {pantalla === "factura" && (
          <FacturaScreen
            onContinuar={(cf, datos) => {
              setConFactura(cf);
              setDatosFactura(datos);
              setPantalla("pago");
            }}
            onBack={() => setPantalla("carrito")}
          />
        )}

        {pantalla === "pago" && (
          <PagoScreen
            total={totalCarrito}
            onConfirmar={(metodo, monto) => {
              setMetodoPago(metodo);
              setMontoRecibido(monto);
              setPantalla("confirmacion");
            }}
            onBack={() => setPantalla("factura")}
          />
        )}

        {pantalla === "confirmacion" && (
          <ConfirmacionScreen
            total={totalCarrito}
            metodo={metodoPago}
            montoRecibido={montoRecibido}
            onNuevaVenta={nuevaVenta}
            onImprimir={() => alert("🖨️ Enviando a impresora...")}
          />
        )}

      </div>
    </main>
  );
}
