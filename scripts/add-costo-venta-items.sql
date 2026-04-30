-- ═══════════════════════════════════════════════════════════════════
--  JUICE CO. — Agregar columnas de costo a venta_items
--  Ejecutar en: Supabase → SQL Editor
--  Fecha: 2026-04-29
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.venta_items
  ADD COLUMN IF NOT EXISTS costo_unitario NUMERIC(10,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS costo_total    NUMERIC(10,4) DEFAULT 0;

-- Verificar resultado
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'venta_items'
  AND column_name IN ('costo_unitario', 'costo_total');
