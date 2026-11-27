-- =============================================================
-- 011_genero_avatares_y_cotizacion_ordenes.sql
-- Migración ADITIVA: no elimina ni renombra nada existente.
--   1) usuarios.genero: permite elegir el avatar (Mujer / Hombre /
--      Prefiere no decirlo). Las cuentas existentes quedan en
--      "Prefiere no decirlo" y el administrador puede cambiarlo.
--   2) Vínculo de una orden con la cotización que la originó.
--      La tabla cotizaciones usa "codigo" como llave, por eso se
--      guarda el código y no un id numérico.
-- =============================================================

BEGIN;

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS genero VARCHAR(24);

UPDATE usuarios
SET genero = 'Prefiere no decirlo'
WHERE genero IS NULL OR trim(genero) = '';

ALTER TABLE usuarios ALTER COLUMN genero SET DEFAULT 'Prefiere no decirlo';

DO $$
BEGIN
  ALTER TABLE usuarios
    ADD CONSTRAINT usuarios_genero_check
    CHECK (genero IN ('Mujer', 'Hombre', 'Prefiere no decirlo'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE ordenes_servicio ADD COLUMN IF NOT EXISTS cotizacion_codigo VARCHAR(40);

CREATE INDEX IF NOT EXISTS ix_os_cotizacion_codigo
  ON ordenes_servicio (cotizacion_codigo);

COMMIT;
