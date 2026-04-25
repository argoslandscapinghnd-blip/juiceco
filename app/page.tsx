"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — page.tsx
// ─────────────────────────────────────────────
import { useState } from "react";
import { colors } from "@/components/ui/styles";
import {
  Pantalla, ItemCarrito, DatosFactura, MetodoPago,
  PRECIO_UNITARIO, Usuario,
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
import AdminMenuScreen    from "@/components/AdminMenuScreen";
import UsuariosScreen     from "@/components/UsuariosScreen";
import FormUsuarioScreen  from "@/components/FormUsuarioScreen";

export default function Home() {
  // ── Sesión ──
  const [pantalla,          setPantalla]          = useState<Pantalla>("login");
  const [usuarioActual,     setUsuarioActual]     = useState<Usuario | null>(null);
  const [puntoSeleccionado, setPuntoSeleccionado] = useState("");

  // ── Carrito ──
  const [carrito,        setCarrito]        = useState<ItemCarrito[]>([]);
  const [productoActual, setProductoActual] = useState<string | null>(null);

  // ── Venta ──
  const [metodoPago,    setMetodoPago]    = useState<MetodoPago>("efectivo");
  const [montoRecibido, setMontoRecibido] = useState<number | undefined>();

  // ── Usuarios ──
  const [usuarioEditar, setUsuarioEditar] = useState<Usuario | undefined>();

  const totalCarrito = carrito.reduce((s, i) => s + i.cantidad * i.precio, 0);

  // ── Login desde Supabase ──
  const handleLogin = (u: Usuario) => {
    setUsuarioActual(u);
    setPantalla(u.rol === "administrador" ? "admin" : "punto");
  };

  // ── Carrito helpers ──
  const agregarAlCarrito = (cantidad: number) => {
    if (!productoActual) return;
    setCarrito((prev) => {
      const existe = prev.find((i) => i.nombre === productoActual);
      if (existe) return prev.map((i) => i.nombre === productoActual ? { ...i, cantidad: i.cantidad + cantidad } : i);
      return [...prev, { nombre: productoActual, cantidad, precio: PRECIO_UNITARIO }];
    });
    setPantalla("menu");
  };

  const nuevaVenta = () => {
    setCarrito([]);
    setProductoActual(null);
    setMontoRecibido(undefined);
    setPantalla("menu");
  };

  return (
    <main style={{ minHeight: "100vh", background: colors.background, padding: "20px 16px" }}>
      <div style={{ width: "100%", maxWidth: 480, margin: "0 auto" }}>

        {pantalla === "login" && (
          <LoginScreen onIngresar={handleLogin} />
        )}

        {/* ── CAJERO ── */}
        {pantalla === "punto" && (
          <PuntoVentaScreen
            onSeleccionar={(p) => { setPuntoSeleccionado(p); setPantalla("caja"); }}
            onBack={() => setPantalla("login")}
          />
        )}
        {pantalla === "caja" && (
          <AperturaCajaScreen
            punto={puntoSeleccionado}
            usuario={usuarioActual?.nombre ?? ""}
            onAbrir={() => setPantalla("menu")}
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
            onEliminarItem={(n) => setCarrito((p) => p.filter((i) => i.nombre !== n))}
            onVaciarCarrito={() => setCarrito([])}
            onFinalizarVenta={() => setPantalla("factura")}
            onBack={() => setPantalla("menu")}
          />
        )}
        {pantalla === "factura" && (
          <FacturaScreen
            onContinuar={() => setPantalla("pago")}
            onBack={() => setPantalla("carrito")}
          />
        )}
        {pantalla === "pago" && (
          <PagoScreen
            total={totalCarrito}
            onConfirmar={(metodo, monto) => { setMetodoPago(metodo); setMontoRecibido(monto); setPantalla("confirmacion"); }}
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

        {/* ── ADMIN ── */}
        {pantalla === "admin" && (
          <AdminMenuScreen
            usuario={usuarioActual?.nombre ?? ""}
            onUsuarios={() => setPantalla("admin_usuarios")}
            onInventario={() => alert("Próximamente")}
            onReportes={() => alert("Próximamente")}
            onModoCajero={() => setPantalla("punto")}
            onCerrarSesion={() => { setUsuarioActual(null); setPantalla("login"); }}
          />
        )}
        {pantalla === "admin_usuarios" && (
          <UsuariosScreen
            onNuevo={() => { setUsuarioEditar(undefined); setPantalla("admin_nuevo_usuario"); }}
            onEditar={(u) => { setUsuarioEditar(u); setPantalla("admin_editar_usuario"); }}
            onBack={() => setPantalla("admin")}
          />
        )}
        {(pantalla === "admin_nuevo_usuario" || pantalla === "admin_editar_usuario") && (
          <FormUsuarioScreen
            usuarioEditar={usuarioEditar}
            onGuardar={() => { setUsuarioEditar(undefined); setPantalla("admin_usuarios"); }}
            onBack={() => setPantalla("admin_usuarios")}
          />
        )}

      </div>
    </main>
  );
}
