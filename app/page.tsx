"use client";
// ─────────────────────────────────────────────
//  JUICE CO. — page.tsx
// ─────────────────────────────────────────────
import { useState } from "react";
import { colors } from "@/components/ui/styles";
import {
  Pantalla, ItemCarrito, DatosFactura, MetodoPago,
  PRECIO_UNITARIO, Usuario, Sucursal,
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
import MiTurnoScreen      from "@/components/MiTurnoScreen";
import AdminMenuScreen    from "@/components/AdminMenuScreen";
import UsuariosScreen     from "@/components/UsuariosScreen";
import FormUsuarioScreen  from "@/components/FormUsuarioScreen";
import SucursalesScreen   from "@/components/SucursalesScreen";
import FormSucursalScreen from "@/components/FormSucursalScreen";

export default function Home() {
  // ── Sesión ──
  const [pantalla,          setPantalla]          = useState<Pantalla>("login");
  const [usuarioActual,     setUsuarioActual]     = useState<Usuario | null>(null);
  const [sucursalId,        setSucursalId]        = useState<number>(0);
  const [puntoNombre,       setPuntoNombre]       = useState("");
  const [sesionCajaId,      setSesionCajaId]      = useState<number>(0);
  const [fondoInicial,      setFondoInicial]      = useState<number>(0);

  // ── Carrito ──
  const [carrito,        setCarrito]        = useState<ItemCarrito[]>([]);
  const [productoActual, setProductoActual] = useState<string | null>(null);

  // ── Venta ──
  const [metodoPago,    setMetodoPago]    = useState<MetodoPago>("efectivo");
  const [montoRecibido, setMontoRecibido] = useState<number | undefined>();
  const [conFactura,    setConFactura]    = useState(false);
  const [datosFactura,  setDatosFactura]  = useState<DatosFactura | undefined>();

  // ── Admin ──
  const [usuarioEditar,  setUsuarioEditar]  = useState<Usuario | undefined>();
  const [sucursalEditar, setSucursalEditar] = useState<Sucursal | undefined>();

  const totalCarrito = carrito.reduce((s, i) => s + i.cantidad * i.precio, 0);

  const handleLogin = (u: Usuario, sesionActiva?: { id: number; sucursal_id: number; fondo_inicial: number; sucursal: { nombre: string; codigo: string } }) => {
    setUsuarioActual(u);
    if (u.rol === "administrador") { setPantalla("admin"); return; }
    if (sesionActiva) {
      setSesionCajaId(sesionActiva.id);
      setSucursalId(sesionActiva.sucursal_id);
      setFondoInicial(sesionActiva.fondo_inicial ?? 0);
      setPuntoNombre(`${sesionActiva.sucursal.codigo} - ${sesionActiva.sucursal.nombre}`);
      setPantalla("menu");
      return;
    }
    setPantalla("punto");
  };

  const cerrarSesionCajero = () => {
    setCarrito([]);
    setProductoActual(null);
    setMontoRecibido(undefined);
    setConFactura(false);
    setDatosFactura(undefined);
    setUsuarioActual(null);
    setPantalla("login");
  };

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
    setConFactura(false);
    setDatosFactura(undefined);
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
            esAdmin={usuarioActual?.rol === "administrador"}
            onSeleccionar={(id, nombre) => { setSucursalId(id); setPuntoNombre(nombre); setPantalla("caja"); }}
            onBack={() => setPantalla(usuarioActual?.rol === "administrador" ? "admin" : "login")}
          />
        )}
        {pantalla === "caja" && (
          <AperturaCajaScreen
            sucursalId={sucursalId}
            punto={puntoNombre}
            usuario={usuarioActual?.nombre ?? ""}
            usuarioId={usuarioActual?.id ?? ""}
            onAbrir={(sesionId, fondo) => { setSesionCajaId(sesionId); setFondoInicial(fondo); setPantalla("menu"); }}
            onBack={() => setPantalla("punto")}
          />
        )}
        {pantalla === "menu" && (
          <MenuScreen
            carrito={carrito}
            usuario={usuarioActual?.nombre ?? ""}
            sucursal={puntoNombre}
            onSeleccionarSabor={(nombre) => { setProductoActual(nombre); setPantalla("cantidad"); }}
            onVerCarrito={() => setPantalla("carrito")}
            onVerTurno={() => setPantalla("mi_turno")}
            onCerrarSesion={cerrarSesionCajero}
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
            usuario={usuarioActual?.nombre ?? ""}
            sucursal={puntoNombre}
            onEliminarItem={(n) => setCarrito((p) => p.filter((i) => i.nombre !== n))}
            onVaciarCarrito={() => setCarrito([])}
            onFinalizarVenta={() => setPantalla("factura")}
            onBack={() => setPantalla("menu")}
            onVerTurno={() => setPantalla("mi_turno")}
            onCerrarSesion={cerrarSesionCajero}
          />
        )}
        {pantalla === "factura" && (
          <FacturaScreen
            onContinuar={(cf, datos) => { setConFactura(cf); setDatosFactura(datos); setPantalla("pago"); }}
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
            carrito={carrito}
            sesionCajaId={sesionCajaId}
            sucursalId={sucursalId}
            usuarioId={usuarioActual?.id ?? ""}
            conFactura={conFactura}
            datosFactura={datosFactura}
            onNuevaVenta={nuevaVenta}
            onImprimir={() => alert("🖨️ Enviando a impresora...")}
          />
        )}
        {pantalla === "mi_turno" && (
          <MiTurnoScreen
            sesionCajaId={sesionCajaId}
            sucursalId={sucursalId}
            fondoInicial={fondoInicial}
            usuario={usuarioActual?.nombre ?? ""}
            onBack={() => setPantalla("menu")}
            onCerrarCaja={() => alert("Cierre de caja — próximamente")}
          />
        )}

        {/* ── ADMIN ── */}
        {pantalla === "admin" && (
          <AdminMenuScreen
            usuario={usuarioActual?.nombre ?? ""}
            onUsuarios={() => setPantalla("admin_usuarios")}
            onSucursales={() => setPantalla("admin_sucursales")}
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
        {pantalla === "admin_sucursales" && (
          <SucursalesScreen
            onNueva={() => { setSucursalEditar(undefined); setPantalla("admin_nueva_sucursal"); }}
            onEditar={(s) => { setSucursalEditar(s); setPantalla("admin_editar_sucursal"); }}
            onBack={() => setPantalla("admin")}
          />
        )}
        {(pantalla === "admin_nueva_sucursal" || pantalla === "admin_editar_sucursal") && (
          <FormSucursalScreen
            sucursalEditar={sucursalEditar}
            onGuardar={() => { setSucursalEditar(undefined); setPantalla("admin_sucursales"); }}
            onBack={() => setPantalla("admin_sucursales")}
          />
        )}

      </div>
    </main>
  );
}
