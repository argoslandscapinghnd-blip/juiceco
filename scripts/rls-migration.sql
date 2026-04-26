-- ═══════════════════════════════════════════════════════════════════
--  Lemon Lab — Políticas RLS (Row Level Security)
--  Ejecutar en Supabase → SQL Editor
--  Fecha: 2026-04-26
-- ═══════════════════════════════════════════════════════════════════
--
--  EFECTO: Después de esto, la anon key no puede leer ni escribir
--  ninguna tabla. Solo usuarios autenticados con JWT válido.
-- ═══════════════════════════════════════════════════════════════════

-- ── Helpers (SECURITY DEFINER = bypasan RLS, corren como postgres) ──

CREATE OR REPLACE FUNCTION public.soy_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE auth_id = auth.uid()
      AND rol = 'administrador'
      AND activo = true
  );
$$;

CREATE OR REPLACE FUNCTION public.mi_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT id FROM public.usuarios
  WHERE auth_id = auth.uid()
  LIMIT 1;
$$;

-- ═══ usuarios ════════════════════════════════════════════════════════
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_select"   ON public.usuarios FOR SELECT    TO authenticated USING (true);
CREATE POLICY "usuarios_insert"   ON public.usuarios FOR INSERT    TO authenticated WITH CHECK (soy_admin());
CREATE POLICY "usuarios_update"   ON public.usuarios FOR UPDATE    TO authenticated USING (soy_admin());
CREATE POLICY "usuarios_delete"   ON public.usuarios FOR DELETE    TO authenticated USING (soy_admin());

-- ═══ sucursales ══════════════════════════════════════════════════════
ALTER TABLE public.sucursales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sucursales_select" ON public.sucursales FOR SELECT  TO authenticated USING (true);
CREATE POLICY "sucursales_insert" ON public.sucursales FOR INSERT  TO authenticated WITH CHECK (soy_admin());
CREATE POLICY "sucursales_update" ON public.sucursales FOR UPDATE  TO authenticated USING (soy_admin());
CREATE POLICY "sucursales_delete" ON public.sucursales FOR DELETE  TO authenticated USING (soy_admin());

-- ═══ sesiones_caja ═══════════════════════════════════════════════════
-- Admin ve/edita todo; cajero solo ve/edita la suya
ALTER TABLE public.sesiones_caja ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sesiones_select"   ON public.sesiones_caja FOR SELECT TO authenticated
  USING (soy_admin() OR usuario_id = mi_id());
CREATE POLICY "sesiones_insert"   ON public.sesiones_caja FOR INSERT TO authenticated
  WITH CHECK (usuario_id = mi_id() OR soy_admin());
CREATE POLICY "sesiones_update"   ON public.sesiones_caja FOR UPDATE TO authenticated
  USING (usuario_id = mi_id() OR soy_admin());
CREATE POLICY "sesiones_delete"   ON public.sesiones_caja FOR DELETE TO authenticated
  USING (soy_admin());

-- ═══ ventas ══════════════════════════════════════════════════════════
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ventas_select"     ON public.ventas FOR SELECT TO authenticated USING (true);
CREATE POLICY "ventas_insert"     ON public.ventas FOR INSERT TO authenticated
  WITH CHECK (usuario_id = mi_id() OR soy_admin());
CREATE POLICY "ventas_update"     ON public.ventas FOR UPDATE TO authenticated USING (soy_admin());
CREATE POLICY "ventas_delete"     ON public.ventas FOR DELETE TO authenticated USING (soy_admin());

-- ═══ venta_items ═════════════════════════════════════════════════════
ALTER TABLE public.venta_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "venta_items_select" ON public.venta_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "venta_items_insert" ON public.venta_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "venta_items_update" ON public.venta_items FOR UPDATE TO authenticated USING (soy_admin());
CREATE POLICY "venta_items_delete" ON public.venta_items FOR DELETE TO authenticated USING (soy_admin());

-- ═══ productos ═══════════════════════════════════════════════════════
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "productos_select"  ON public.productos FOR SELECT TO authenticated USING (true);
CREATE POLICY "productos_insert"  ON public.productos FOR INSERT TO authenticated WITH CHECK (soy_admin());
CREATE POLICY "productos_update"  ON public.productos FOR UPDATE TO authenticated USING (soy_admin());
CREATE POLICY "productos_delete"  ON public.productos FOR DELETE TO authenticated USING (soy_admin());

-- ═══ unidades ════════════════════════════════════════════════════════
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unidades_select"   ON public.unidades FOR SELECT TO authenticated USING (true);
CREATE POLICY "unidades_insert"   ON public.unidades FOR INSERT TO authenticated WITH CHECK (soy_admin());
CREATE POLICY "unidades_update"   ON public.unidades FOR UPDATE TO authenticated USING (soy_admin());
CREATE POLICY "unidades_delete"   ON public.unidades FOR DELETE TO authenticated USING (soy_admin());

-- ═══ insumos ═════════════════════════════════════════════════════════
ALTER TABLE public.insumos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insumos_select"    ON public.insumos FOR SELECT TO authenticated USING (true);
CREATE POLICY "insumos_insert"    ON public.insumos FOR INSERT TO authenticated WITH CHECK (soy_admin());
CREATE POLICY "insumos_update"    ON public.insumos FOR UPDATE TO authenticated USING (soy_admin());
CREATE POLICY "insumos_delete"    ON public.insumos FOR DELETE TO authenticated USING (soy_admin());

-- ═══ insumos_maestro ═════════════════════════════════════════════════
ALTER TABLE public.insumos_maestro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insumos_m_select"  ON public.insumos_maestro FOR SELECT TO authenticated USING (true);
CREATE POLICY "insumos_m_insert"  ON public.insumos_maestro FOR INSERT TO authenticated WITH CHECK (soy_admin());
CREATE POLICY "insumos_m_update"  ON public.insumos_maestro FOR UPDATE TO authenticated USING (soy_admin());
CREATE POLICY "insumos_m_delete"  ON public.insumos_maestro FOR DELETE TO authenticated USING (soy_admin());

-- ═══ recetas ═════════════════════════════════════════════════════════
ALTER TABLE public.recetas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recetas_select"    ON public.recetas FOR SELECT TO authenticated USING (true);
CREATE POLICY "recetas_insert"    ON public.recetas FOR INSERT TO authenticated WITH CHECK (soy_admin());
CREATE POLICY "recetas_update"    ON public.recetas FOR UPDATE TO authenticated USING (soy_admin());
CREATE POLICY "recetas_delete"    ON public.recetas FOR DELETE TO authenticated USING (soy_admin());

-- ═══ puntos_venta ════════════════════════════════════════════════════
ALTER TABLE public.puntos_venta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "puntos_select"     ON public.puntos_venta FOR SELECT TO authenticated USING (true);
CREATE POLICY "puntos_insert"     ON public.puntos_venta FOR INSERT TO authenticated WITH CHECK (soy_admin());
CREATE POLICY "puntos_update"     ON public.puntos_venta FOR UPDATE TO authenticated USING (soy_admin());
CREATE POLICY "puntos_delete"     ON public.puntos_venta FOR DELETE TO authenticated USING (soy_admin());

-- ═══ email_destinatarios ═════════════════════════════════════════════
-- SELECT abierto a autenticados (cajeros envían reporte al cerrar caja)
-- INSERT/UPDATE/DELETE solo admin
ALTER TABLE public.email_destinatarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_select"      ON public.email_destinatarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "email_insert"      ON public.email_destinatarios FOR INSERT TO authenticated WITH CHECK (soy_admin());
CREATE POLICY "email_update"      ON public.email_destinatarios FOR UPDATE TO authenticated USING (soy_admin());
CREATE POLICY "email_delete"      ON public.email_destinatarios FOR DELETE TO authenticated USING (soy_admin());

-- ═══ movimientos_inventario ══════════════════════════════════════════
ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "movimientos_select" ON public.movimientos_inventario FOR SELECT TO authenticated USING (true);
CREATE POLICY "movimientos_insert" ON public.movimientos_inventario FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "movimientos_update" ON public.movimientos_inventario FOR UPDATE TO authenticated USING (soy_admin());
CREATE POLICY "movimientos_delete" ON public.movimientos_inventario FOR DELETE TO authenticated USING (soy_admin());
