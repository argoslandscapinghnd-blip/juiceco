export type Pantalla =
  | "login" | "punto" | "caja" | "menu" | "cantidad" | "carrito"
  | "factura" | "pago" | "confirmacion" | "mi_turno" | "cierre_caja"
  | "admin" | "admin_usuarios" | "admin_nuevo_usuario" | "admin_editar_usuario"
  | "admin_sucursales" | "admin_nueva_sucursal" | "admin_editar_sucursal"
  | "admin_maestros"
  | "admin_bebidas" | "admin_nueva_bebida" | "admin_editar_bebida"
  | "admin_unidades"
  | "admin_insumos" | "admin_nuevo_insumo" | "admin_editar_insumo"
  | "admin_dashboard";

export type ItemCarrito = { nombre: string; cantidad: number; precio: number; };
export type DatosFactura = { rtn: string; nombre: string; correo: string; };
export type MetodoPago = "efectivo" | "tarjeta" | "transferencia";
export type Rol = "cajero" | "administrador";
export type Usuario = { id: string; nombre: string; usuario: string; password: string; telefono: string; rol: Rol; activo: boolean; auth_id?: string; };
export type Sucursal = { id: number; codigo: string; nombre: string; ciudad: string; activo: boolean; };
export type Producto = { id: number; nombre: string; emoji: string; precio: number; activo: boolean; imagen_url?: string; };
export type Insumo = { id: number; nombre: string; unidad: string; tipo: "ingrediente" | "empaque"; costo_unitario: number; activo: boolean; };

export const PRECIO_UNITARIO = 50;
