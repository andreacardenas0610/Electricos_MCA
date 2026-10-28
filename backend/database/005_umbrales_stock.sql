-- ===========================================================================
-- Migración 005 · Umbrales de stock configurables (Electricos MCA)
-- ===========================================================================
-- Solo agrega columnas y valores por defecto. No elimina tablas, columnas ni
-- datos existentes. Ejecutar de forma manual sobre la base ya migrada con
-- 001..004. Repetible: puede volver a ejecutarse sin dañar nada.
--
-- Para cada material el usuario decide tres parámetros:
--   stock_minimo -> con esa cantidad o menos el stock es "Bajo Stock" (amarillo).
--   stock_medio  -> con esa cantidad o menos el stock es "Medio" (amarillo suave).
--   por encima de stock_medio el stock es "Óptimo" (gris, sin alerta).
--   stock = 0 sigue siendo "Crítico" (rojo).
-- ===========================================================================

BEGIN;

ALTER TABLE materiales
  ADD COLUMN IF NOT EXISTS stock_medio NUMERIC(14, 3)
    CHECK (stock_medio IS NULL OR stock_medio >= 0);

-- La franja media por defecto queda al doble del mínimo configurado.
UPDATE materiales
SET stock_medio = GREATEST(COALESCE(stock_minimo, 10) * 2, 20)
WHERE stock_medio IS NULL;

-- El registro (Activo / Inactivo) lo maneja el usuario; el color de la fila ya
-- no depende de ese campo sino del nivel de stock calculado arriba.
COMMENT ON COLUMN materiales.stock_medio IS
  'Cantidad desde la cual el material ya se considera con stock medio y no óptimo.';

COMMIT;
