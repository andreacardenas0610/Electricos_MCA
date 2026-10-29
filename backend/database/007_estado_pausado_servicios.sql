BEGIN;

-- El catálogo de servicios maneja tres estados (Activo, Pausado, Inactivo), pero la
-- restricción original de la tabla solo aceptaba Activo e Inactivo: al guardar un
-- servicio en Pausado PostgreSQL respondía 23514 y la pantalla no dejaba guardar.
-- La restricción se reemplaza por una versión más amplia; no se borran filas ni columnas.

ALTER TABLE servicios
  DROP CONSTRAINT IF EXISTS servicios_estado_check;

ALTER TABLE servicios
  ADD CONSTRAINT servicios_estado_check
  CHECK (estado IN ('Activo', 'Pausado', 'Inactivo'));

COMMIT;
