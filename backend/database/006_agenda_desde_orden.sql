BEGIN;

-- Agenda programada desde la orden de servicio.
-- Todo el contenido es aditivo: no elimina columnas, datos ni objetos existentes.

-- 1) La actividad de agenda queda casada con la orden que le dio origen ----------
-- Se usa una columna nueva porque ordenes_servicio.agenda_id apunta a la tabla
-- legada «agenda», no a agenda_actividades, así que no sirve para este enlace.
ALTER TABLE agenda_actividades
  ADD COLUMN IF NOT EXISTS orden_servicio_id INT REFERENCES ordenes_servicio(id)
    ON DELETE SET NULL;

-- Una orden pendiente solo puede agendarse una vez.
CREATE UNIQUE INDEX IF NOT EXISTS ux_agenda_orden_servicio
  ON agenda_actividades (orden_servicio_id)
  WHERE orden_servicio_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agenda_actividades_orden
  ON agenda_actividades (orden_servicio_id);

COMMIT;
