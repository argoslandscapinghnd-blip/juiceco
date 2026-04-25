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
  | "confirmacion";

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

export const PRECIO_UNITARIO = 50; // Lempiras

export const SABORES = [
  { nombre: "Limonada Natural",  emoji: "🍋" },
  { nombre: "Limonada Fresa",    emoji: "🍓" },
  { nombre: "Limonada Maracuyá", emoji: "🌿" },
  { nombre: "Limonada Mango",    emoji: "🥭" },
  { nombre: "Limonada Pepino",   emoji: "🥒" },
  { nombre: "Limonada Menta",    emoji: "🌱" },
];

export const PUNTOS = [
  { codigo: "01", nombre: "Sucursal Centro",      ciudad: "Tegucigalpa" },
  { codigo: "02", nombre: "Sucursal Mall",         ciudad: "Tegucigalpa" },
  { codigo: "03", nombre: "Sucursal Comayagüela",  ciudad: "Tegucigalpa" },
  { codigo: "04", nombre: "Sucursal San Pedro Sula", ciudad: "San Pedro Sula" },
];
