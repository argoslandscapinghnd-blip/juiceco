// ─────────────────────────────────────────────
//  JUICE CO. — Tipos Compartidos
// ─────────────────────────────────────────────

export type Pantalla =
  | "login"
  | "punto"
  | "caja"
  | "menu"
  | "cantidad"
  | "carrito"
  | "factura"
  | "pago"
  | "confirmacion"
  | "admin"
  | "admin_usuarios"
  | "admin_nuevo_usuario"
  | "admin_editar_usuario"
  | "admin_sucursales"
  | "admin_nueva_sucursal"
  | "admin_editar_sucursal";

export type ItemCarrito = {
  nombre: string;
  cantidad: number;
  precio: number;
};

export type DatosFactura = {
  rtn: string;
  nombre: string;
  correo: string;
};

export type MetodoPago = "efectivo" | "tarjeta" | "transferencia";

export type Rol = "cajero" | "administrador";

export type Usuario = {
  id:        string;
  nombre:    string;
  usuario:   string;
  password:  string;
  telefono:  string;
  rol:       Rol;
  activo:    boolean;
};

export type Sucursal = {
  id:       number;
  codigo:   string;
  nombre:   string;
  ciudad:   string;
  activo:   boolean;
};

export const PRECIO_UNITARIO = 50;

export const SABORES = [
  { nombre: "Limonada Natural",  emoji: "🍋" },
  { nombre: "Limonada Fresa",    emoji: "🍓" },
  { nombre: "Limonada Maracuyá", emoji: "🌿" },
  { nombre: "Limonada Mango",    emoji: "🥭" },
  { nombre: "Limonada Pepino",   emoji: "🥒" },
  { nombre: "Limonada Menta",    emoji: "🌱" },
];

export const PUNTOS = [
  { codigo: "01", nombre: "Sucursal Centro",        ciudad: "Tegucigalpa"    },
  { codigo: "02", nombre: "Sucursal Mall",           ciudad: "Tegucigalpa"    },
  { codigo: "03", nombre: "Sucursal Comayagüela",    ciudad: "Tegucigalpa"    },
  { codigo: "04", nombre: "Sucursal San Pedro Sula", ciudad: "San Pedro Sula" },
];
