"use client";
import { useState, useEffect, useRef } from "react";
import { colors } from "@/components/ui/styles";
import { supabase } from "@/supabase";
import { Pantalla, ItemCarrito, DatosFactura, MetodoPago, PRECIO_UNITARIO, Usuario, Sucursal, Producto, Insumo } from "@/components/ui/types";

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
import CierreCajaScreen   from "@/components/CierreCajaScreen";
import AdminMenuScreen    from "@/components/AdminMenuScreen";
import MaestrosScreen     from "@/components/MaestrosScreen";
import UsuariosScreen     from "@/components/UsuariosScreen";
import FormUsuarioScreen  from "@/components/FormUsuarioScreen";
import SucursalesScreen   from "@/components/SucursalesScreen";
import FormSucursalScreen from "@/components/FormSucursalScreen";
import BebidasScreen      from "@/components/BebidasScreen";
import FormBebidaScreen   from "@/components/FormBebidaScreen";
import UnidadesScreen     from "@/components/UnidadesScreen";
import InsumosScreen      from "@/components/InsumosScreen";
import FormInsumoScreen   from "@/components/FormInsumoScreen";
import DashboardScreen    from "@/components/DashboardScreen";

export default function Home() {
  const [pantalla,       setPantalla]       = useState<Pantalla>("login");
  const [usuarioActual,  setUsuarioActual]  = useState<Usuario | null>(null);
  const [sucursalId,     setSucursalId]     = useState<number>(0);
  const [puntoNombre,    setPuntoNombre]    = useState("");
  const [sesionCajaId,   setSesionCajaId]   = useState<number>(0);
  const [fondoInicial,   setFondoInicial]   = useState<number>(0);
  const [carrito,        setCarrito]        = useState<ItemCarrito[]>([]);
  const [productoActual, setProductoActual] = useState<string | null>(null);
  const [precioActual,   setPrecioActual]   = useState<number>(PRECIO_UNITARIO);
  const [metodoPago,     setMetodoPago]     = useState<MetodoPago>("efectivo");
  const [montoRecibido,  setMontoRecibido]  = useState<number | undefined>();
  const [conFactura,     setConFactura]     = useState(false);
  const [datosFactura,   setDatosFactura]   = useState<DatosFactura | undefined>();
  const [usuarioEditar,  setUsuarioEditar]  = useState<Usuario | undefined>();
  const [sucursalEditar, setSucursalEditar] = useState<Sucursal | undefined>();
  const [bebidaEditar,   setBebidaEditar]   = useState<Producto | undefined>();
  const [insumoEditar,   setInsumoEditar]   = useState<Insumo | undefined>();

  // Para cierre de caja (puede ser propio o de otro cajero)
  const [cierreSesionId,    setCierreSesionId]    = useState<number>(0);
  const [cierreSucursalId,  setCierreSucursalId]  = useState<number>(0);
  const [cierreFondo,       setCierreFondo]       = useState<number>(0);
  const [cierreCajero,      setCierreCajero]      = useState<string>("");
  const [cierreCerradoPor,  setCierreCerradoPor]  = useState<string | undefined>();
  const [cierreOrigen,      setCierreOrigen]      = useState<"menu" | "punto">("menu");

  const historial      = useRef<Pantalla[]>(["login"]);
  const navegandoAtras = useRef(false);
  const [hidratado,    setHidratado] = useState(false);

  // Pantallas que necesitan estado transitorio: si se restaura la sesión en ellas,
  // mejor volver a una pantalla padre estable.
  const PANTALLA_SEGURA: Partial<Record<Pantalla, Pantalla>> = {
    cantidad:      "menu",
    confirmacion:  "menu",
    caja:          "punto",
  };

  useEffect(() => {
    // ── Interceptar botón "Atrás" del celular ──────────────────────────────
    window.history.pushState({}, "");
    const onPopState = () => {
      window.history.pushState({}, "");
      const hist = historial.current;
      if (hist.length <= 1) return;
      const nuevo = hist.slice(0, -1);
      historial.current = nuevo;
      navegandoAtras.current = true;
      setPantalla(nuevo[nuevo.length - 1]);
    };
    window.addEventListener("popstate", onPopState);

    // ── Restaurar sesión al volver desde home / recarga ────────────────────
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          const raw = sessionStorage.getItem("jc_estado");
          if (raw) {
            const s = JSON.parse(raw);
            setUsuarioActual(s.usuario ?? null);
            setSucursalId(s.sucursalId   ?? 0);
            setPuntoNombre(s.puntoNombre  ?? "");
            setSesionCajaId(s.sesionCajaId ?? 0);
            setFondoInicial(s.fondoInicial  ?? 0);
            setCarrito(s.carrito ?? []);
            const p = (PANTALLA_SEGURA[s.pantalla as Pantalla] ?? s.pantalla ?? "login") as Pantalla;
            const h = (s.historial ?? [p]) as Pantalla[];
            historial.current = h;
            navegandoAtras.current = true;
            setPantalla(p);
          }
        } catch {}
      }
      setHidratado(true);
    })();

    return () => window.removeEventListener("popstate", onPopState);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Registrar cada cambio de pantalla en el historial ─────────────────────
  useEffect(() => {
    if (!hidratado) return;
    if (navegandoAtras.current) { navegandoAtras.current = false; return; }
    if (pantalla === "login" || pantalla === "confirmacion") {
      historial.current = [pantalla];
    } else {
      const last = historial.current[historial.current.length - 1];
      if (last !== pantalla) historial.current = [...historial.current, pantalla];
    }
  }, [pantalla, hidratado]);

  // ── Persistir estado en sessionStorage ───────────────────────────────────
  useEffect(() => {
    if (!hidratado) return;
    if (!usuarioActual) { sessionStorage.removeItem("jc_estado"); return; }
    sessionStorage.setItem("jc_estado", JSON.stringify({
      usuario:     usuarioActual,
      sucursalId,  puntoNombre, sesionCajaId, fondoInicial, carrito,
      pantalla,    historial: historial.current,
    }));
  }, [hidratado, usuarioActual, sucursalId, puntoNombre, sesionCajaId, fondoInicial, carrito, pantalla]);

  if (!hidratado) return null;

  const totalCarrito = carrito.reduce((s, i) => s + i.cantidad * i.precio, 0);
  const esAdmin = usuarioActual?.rol === "administrador";


  const handleLogin = (u: Usuario, sesionActiva?: { id: number; sucursal_id: number; fondo_inicial: number; sucursal: { nombre: string; codigo: string } }) => {
    setSucursalId(0); setPuntoNombre(""); setSesionCajaId(0); setFondoInicial(0);
    setCarrito([]); setProductoActual(null); setMontoRecibido(undefined);
    setConFactura(false); setDatosFactura(undefined);
    setUsuarioActual(u);
    if (sesionActiva) {
      setSesionCajaId(sesionActiva.id); setSucursalId(sesionActiva.sucursal_id);
      setFondoInicial(sesionActiva.fondo_inicial ?? 0);
      setPuntoNombre(`${sesionActiva.sucursal.codigo} - ${sesionActiva.sucursal.nombre}`);
    }
    if (u.rol === "administrador") { setPantalla("admin"); return; }
    if (sesionActiva) { setPantalla("menu"); return; }
    setPantalla("punto");
  };

  const cerrarSesionCajero = () => {
    sessionStorage.removeItem("jc_estado");
    supabase.auth.signOut().catch(() => {});
    setCarrito([]); setProductoActual(null); setMontoRecibido(undefined);
    setConFactura(false); setDatosFactura(undefined);
    setUsuarioActual(null); setPantalla("login");
  };

  // Abre el cierre de caja desde Mi Turno (cajero cerrando su propia caja)
  const abrirCierrePropioDesdeMenu = () => {
    setCierreSesionId(sesionCajaId);
    setCierreSucursalId(sucursalId);
    setCierreFondo(fondoInicial);
    setCierreCajero(usuarioActual?.nombre ?? "");
    setCierreCerradoPor(undefined);
    setCierreOrigen("menu");
    setPantalla("cierre_caja");
  };

  // Abre el cierre de caja desde Punto de Venta (admin cerrando cualquier caja)
  const abrirCierreDesidePunto = (sesId: number, sucId: number, fondo: number, cajero: string, sucNombre: string) => {
    setCierreSesionId(sesId);
    setCierreSucursalId(sucId);
    setCierreFondo(fondo);
    setCierreCajero(cajero);
    // Si el cajero es diferente al usuario actual → admin cerrando caja de otro
    const esMiaCaja = cajero === usuarioActual?.nombre;
    setCierreCerradoPor(esMiaCaja ? undefined : usuarioActual?.nombre);
    setCierreOrigen("punto");
    setPantalla("cierre_caja");
  };

  const handleCierreCajaCompletado = () => {
    // Si era mi propia caja → limpiar sesión y logout
    if (!cierreCerradoPor) {
      sessionStorage.removeItem("jc_estado");
      supabase.auth.signOut().catch(() => {});
      setSesionCajaId(0); setSucursalId(0); setPuntoNombre(""); setFondoInicial(0);
      setCarrito([]); setProductoActual(null);
      setUsuarioActual(null); setPantalla("login");
    } else {
      // Si era de otro cajero → volver a punto de venta
      setPantalla("punto");
    }
  };

  const agregarAlCarrito = (cantidad: number) => {
    if (!productoActual) return;
    setCarrito((prev) => {
      const existe = prev.find((i) => i.nombre === productoActual);
      if (existe) return prev.map((i) => i.nombre === productoActual ? { ...i, cantidad: i.cantidad + cantidad } : i);
      return [...prev, { nombre: productoActual, cantidad, precio: precioActual }];
    });
    setPantalla("menu");
  };

  const nuevaVenta = () => {
    setCarrito([]); setProductoActual(null); setMontoRecibido(undefined);
    setConFactura(false); setDatosFactura(undefined); setPantalla("menu");
  };

  return (
    <main style={{ minHeight: "100vh", background: colors.background, padding: "20px 16px" }}>
      <div style={{ width: "100%", maxWidth: 480, margin: "0 auto" }}>

        {pantalla === "login" && <LoginScreen onIngresar={handleLogin} />}

        {pantalla === "punto" && (
          <PuntoVentaScreen
            esAdmin={esAdmin} usuarioId={usuarioActual?.id} usuarioNombre={usuarioActual?.nombre}
            onSeleccionar={(id, nombre) => { setSucursalId(id); setPuntoNombre(nombre); setPantalla("caja"); }}
            onContinuar={(id, nombre, sesionId) => { setSucursalId(id); setPuntoNombre(nombre); setSesionCajaId(sesionId); setPantalla("menu"); }}
            onCerrarCaja={abrirCierreDesidePunto}
            onBack={() => { if (!esAdmin) supabase.auth.signOut().catch(() => {}); setPantalla(esAdmin ? "admin" : "login"); }}
          />
        )}
        {pantalla === "caja" && (
          <AperturaCajaScreen sucursalId={sucursalId} punto={puntoNombre}
            usuario={usuarioActual?.nombre ?? ""} usuarioId={usuarioActual?.id ?? ""}
            onAbrir={(sesionId, fondo) => { setSesionCajaId(sesionId); setFondoInicial(fondo); setPantalla("menu"); }}
            onBack={() => setPantalla("punto")}
          />
        )}
        {pantalla === "menu" && (
          <MenuScreen carrito={carrito} usuario={usuarioActual?.nombre ?? ""} sucursal={puntoNombre}
            onSeleccionarSabor={(nombre, precio) => { setProductoActual(nombre); setPrecioActual(precio); setPantalla("cantidad"); }}
            esAdmin={esAdmin}
            onVolverAdmin={esAdmin ? () => setPantalla("admin") : undefined}
            onVerCarrito={() => setPantalla("carrito")} onVerTurno={() => setPantalla("mi_turno")}
            onCerrarSesion={cerrarSesionCajero}
          />
        )}
        {pantalla === "cantidad" && productoActual && (
          <CantidadScreen producto={productoActual} precio={precioActual} onAgregar={agregarAlCarrito} onBack={() => setPantalla("menu")} />
        )}
        {pantalla === "carrito" && (
          <CarritoScreen carrito={carrito} usuario={usuarioActual?.nombre ?? ""} sucursal={puntoNombre}
            onEliminarItem={(n) => setCarrito((p) => p.filter((i) => i.nombre !== n))}
            onVaciarCarrito={() => setCarrito([])} onFinalizarVenta={() => setPantalla("factura")}
            onBack={() => setPantalla("menu")} onVerTurno={() => setPantalla("mi_turno")}
            onCerrarSesion={cerrarSesionCajero}
          />
        )}
        {pantalla === "factura" && (
          <FacturaScreen onContinuar={(cf, datos) => { setConFactura(cf); setDatosFactura(datos); setPantalla("pago"); }} onBack={() => setPantalla("carrito")} />
        )}
        {pantalla === "pago" && (
          <PagoScreen total={totalCarrito}
            onConfirmar={(metodo, monto) => { setMetodoPago(metodo); setMontoRecibido(monto); setPantalla("confirmacion"); }}
            onBack={() => setPantalla("factura")}
          />
        )}
        {pantalla === "confirmacion" && (
          <ConfirmacionScreen total={totalCarrito} metodo={metodoPago} montoRecibido={montoRecibido}
            carrito={carrito} sesionCajaId={sesionCajaId} sucursalId={sucursalId}
            usuarioId={usuarioActual?.id ?? ""} usuarioNombre={usuarioActual?.nombre ?? ""} conFactura={conFactura} datosFactura={datosFactura}
            onNuevaVenta={nuevaVenta}
          />
        )}
        {pantalla === "mi_turno" && (
          <MiTurnoScreen sesionCajaId={sesionCajaId} sucursalId={sucursalId}
            fondoInicial={fondoInicial} usuario={usuarioActual?.nombre ?? ""}
            onBack={() => setPantalla("menu")}
            onCerrarCaja={abrirCierrePropioDesdeMenu}
          />
        )}
        {pantalla === "cierre_caja" && (
          <CierreCajaScreen
            sesionCajaId={cierreSesionId} sucursalId={cierreSucursalId}
            fondoInicial={cierreFondo} cajeroNombre={cierreCajero}
            cerradoPor={cierreCerradoPor}
            onCerrado={handleCierreCajaCompletado}
            onBack={() => setPantalla(cierreOrigen === "menu" ? "mi_turno" : "punto")}
          />
        )}

        {pantalla === "admin" && (
          <AdminMenuScreen usuario={usuarioActual?.nombre ?? ""}
            onUsuarios={() => setPantalla("admin_usuarios")}
            onSucursales={() => setPantalla("admin_sucursales")}
            onMaestros={() => setPantalla("admin_maestros")}
            onReportes={() => setPantalla("admin_dashboard")}
            onModoCajero={() => setPantalla("punto")}
            onCerrarSesion={() => { sessionStorage.removeItem("jc_estado"); supabase.auth.signOut().catch(() => {}); setUsuarioActual(null); setPantalla("login"); }}
          />
        )}
        {pantalla === "admin_maestros" && (
          <MaestrosScreen onBebidas={() => setPantalla("admin_bebidas")} onUnidades={() => setPantalla("admin_unidades")} onInsumos={() => setPantalla("admin_insumos")} onBack={() => setPantalla("admin")} />
        )}
        {pantalla === "admin_usuarios" && (
          <UsuariosScreen onNuevo={() => { setUsuarioEditar(undefined); setPantalla("admin_nuevo_usuario"); }} onEditar={(u) => { setUsuarioEditar(u); setPantalla("admin_editar_usuario"); }} onBack={() => setPantalla("admin")} />
        )}
        {(pantalla === "admin_nuevo_usuario" || pantalla === "admin_editar_usuario") && (
          <FormUsuarioScreen usuarioEditar={usuarioEditar} onGuardar={() => { setUsuarioEditar(undefined); setPantalla("admin_usuarios"); }} onBack={() => setPantalla("admin_usuarios")} />
        )}
        {pantalla === "admin_sucursales" && (
          <SucursalesScreen onNueva={() => { setSucursalEditar(undefined); setPantalla("admin_nueva_sucursal"); }} onEditar={(s) => { setSucursalEditar(s); setPantalla("admin_editar_sucursal"); }} onBack={() => setPantalla("admin")} />
        )}
        {(pantalla === "admin_nueva_sucursal" || pantalla === "admin_editar_sucursal") && (
          <FormSucursalScreen sucursalEditar={sucursalEditar} onGuardar={() => { setSucursalEditar(undefined); setPantalla("admin_sucursales"); }} onBack={() => setPantalla("admin_sucursales")} />
        )}
        {pantalla === "admin_bebidas" && (
          <BebidasScreen onNuevo={() => { setBebidaEditar(undefined); setPantalla("admin_nueva_bebida"); }} onEditar={(p) => { setBebidaEditar(p); setPantalla("admin_editar_bebida"); }} onBack={() => setPantalla("admin_maestros")} />
        )}
        {(pantalla === "admin_nueva_bebida" || pantalla === "admin_editar_bebida") && (
          <FormBebidaScreen bebidaEditar={bebidaEditar} onGuardar={() => { setBebidaEditar(undefined); setPantalla("admin_bebidas"); }} onBack={() => setPantalla("admin_bebidas")} />
        )}
        {pantalla === "admin_unidades" && (
          <UnidadesScreen onBack={() => setPantalla("admin_maestros")} />
        )}
        {pantalla === "admin_insumos" && (
          <InsumosScreen onNuevo={() => { setInsumoEditar(undefined); setPantalla("admin_nuevo_insumo"); }} onEditar={(i) => { setInsumoEditar(i); setPantalla("admin_editar_insumo"); }} onBack={() => setPantalla("admin_maestros")} />
        )}
        {pantalla === "admin_dashboard" && (
          <DashboardScreen onBack={() => setPantalla("admin")} />
        )}
        {(pantalla === "admin_nuevo_insumo" || pantalla === "admin_editar_insumo") && (
          <FormInsumoScreen insumoEditar={insumoEditar} onGuardar={() => { setInsumoEditar(undefined); setPantalla("admin_insumos"); }} onBack={() => setPantalla("admin_insumos")} />
        )}

      </div>
    </main>
  );
}
