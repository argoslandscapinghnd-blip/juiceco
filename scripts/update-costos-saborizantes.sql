-- ═══════════════════════════════════════════════════════════════════
--  JUICE CO. — Actualización de costos de saborizantes
--  Fuente: Cotizaciones COSQUISA y ALZA (2026-04-29)
--  Ejecutar en: Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
--  PASO 0: Ver nombres exactos de insumos que usan 25 ml en recetas
--  Corre esto primero para confirmar los nombres antes de actualizar
-- ─────────────────────────────────────────────────────────────────

SELECT DISTINCT
  im.id,
  im.nombre,
  im.costo_unitario  AS costo_actual_por_ml,
  r.cantidad         AS ml_en_receta,
  im.unidad
FROM public.recetas r
JOIN public.insumos_maestro im ON im.id = r.insumo_id
WHERE r.cantidad = 25
  AND im.tipo = 'ingrediente'
ORDER BY im.nombre;

-- ─────────────────────────────────────────────────────────────────
--  PASO 1: Actualizar costo_unitario en insumos_maestro
--
--  Tabla de referencia (proveedor más barato):
--    Fresa     → COSQUISA  320.85  / 750 = 0.42780 L/ml
--    Frambuesa → ALZA      216.936 / 750 = 0.28925 L/ml
--    Maracuyá  → COSQUISA  328.90  / 750 = 0.43853 L/ml
--    Granada   → ALZA      225.308 / 750 = 0.30041 L/ml
--    Lavanda   → ALZA      210.278 / 750 = 0.28037 L/ml
-- ─────────────────────────────────────────────────────────────────

UPDATE public.insumos_maestro
SET costo_unitario       = 0.42780,
    costo_actualizado_en = NOW()
WHERE id IN (
  SELECT DISTINCT im.id
  FROM public.recetas r
  JOIN public.insumos_maestro im ON im.id = r.insumo_id
  WHERE r.cantidad = 25 AND im.tipo = 'ingrediente' AND im.nombre ILIKE '%fresa%'
);

UPDATE public.insumos_maestro
SET costo_unitario       = 0.28925,
    costo_actualizado_en = NOW()
WHERE id IN (
  SELECT DISTINCT im.id
  FROM public.recetas r
  JOIN public.insumos_maestro im ON im.id = r.insumo_id
  WHERE r.cantidad = 25 AND im.tipo = 'ingrediente' AND im.nombre ILIKE '%frambuesa%'
);

UPDATE public.insumos_maestro
SET costo_unitario       = 0.43853,
    costo_actualizado_en = NOW()
WHERE id IN (
  SELECT DISTINCT im.id
  FROM public.recetas r
  JOIN public.insumos_maestro im ON im.id = r.insumo_id
  WHERE r.cantidad = 25 AND im.tipo = 'ingrediente' AND im.nombre ILIKE '%maracuy%'
);

UPDATE public.insumos_maestro
SET costo_unitario       = 0.30041,
    costo_actualizado_en = NOW()
WHERE id IN (
  SELECT DISTINCT im.id
  FROM public.recetas r
  JOIN public.insumos_maestro im ON im.id = r.insumo_id
  WHERE r.cantidad = 25 AND im.tipo = 'ingrediente' AND im.nombre ILIKE '%granada%'
);

UPDATE public.insumos_maestro
SET costo_unitario       = 0.28037,
    costo_actualizado_en = NOW()
WHERE id IN (
  SELECT DISTINCT im.id
  FROM public.recetas r
  JOIN public.insumos_maestro im ON im.id = r.insumo_id
  WHERE r.cantidad = 25 AND im.tipo = 'ingrediente' AND im.nombre ILIKE '%lavanda%'
);

-- ─────────────────────────────────────────────────────────────────
--  PASO 2: Recalcular costo_total en recetas donde cantidad = 25
--  (costo_total = 25 × nuevo costo_unitario)
-- ─────────────────────────────────────────────────────────────────

UPDATE public.recetas r
SET costo_total = r.cantidad * im.costo_unitario
FROM public.insumos_maestro im
WHERE r.insumo_id = im.id
  AND r.cantidad = 25
  AND im.tipo = 'ingrediente'
  AND im.nombre ILIKE ANY(ARRAY['%fresa%','%frambuesa%','%maracuy%','%granada%','%lavanda%']);

-- ─────────────────────────────────────────────────────────────────
--  PASO 3: Verificar resultado final
-- ─────────────────────────────────────────────────────────────────

SELECT
  p.nombre                                       AS bebida,
  im.nombre                                      AS saborizante,
  r.cantidad                                     AS ml,
  im.costo_unitario                              AS costo_por_ml,
  r.costo_total                                  AS costo_saborizante,
  SUM(r2.costo_total) OVER (PARTITION BY r.producto_id) AS costo_total_bebida
FROM public.recetas r
JOIN public.insumos_maestro im ON im.id = r.insumo_id
JOIN public.productos p        ON p.id  = r.producto_id
JOIN public.recetas r2         ON r2.producto_id = r.producto_id
WHERE r.cantidad = 25
  AND im.tipo = 'ingrediente'
  AND im.nombre ILIKE ANY(ARRAY['%fresa%','%frambuesa%','%maracuy%','%granada%','%lavanda%'])
GROUP BY p.nombre, im.nombre, r.cantidad, im.costo_unitario, r.costo_total, r.producto_id
ORDER BY p.nombre;
