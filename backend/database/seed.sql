BEGIN;

INSERT INTO roles (nombre, codigo, descripcion, plataformas, estado, permisos)
VALUES
  (
    'Administrador', 'ADMIN', 'Administración completa del sistema.',
    ARRAY['Web', 'Móvil']::TEXT[], 'Activo',
    '{"panel":["ver","crear","editar","eliminar"],"clientes":["ver","crear","editar","eliminar"],"terceros":["ver","crear","editar","eliminar"],"materiales":["ver","crear","editar","eliminar"],"servicios":["ver","crear","editar","eliminar"],"cotizaciones":["ver","crear","editar","eliminar"],"abonos":["ver","crear","editar","eliminar"],"agenda":["ver","crear","editar","eliminar"],"ordenes":["ver","crear","editar","eliminar"],"usuarios":["ver","crear","editar","eliminar"],"roles":["ver","crear","editar","eliminar"]}'::JSONB
  ),
  (
    'Técnico', 'TECNICO', 'Ejecución y actualización móvil de órdenes asignadas.',
    ARRAY['Móvil']::TEXT[], 'Activo',
    '{"panel":["ver"],"clientes":["ver"],"terceros":["ver"],"materiales":["ver"],"servicios":["ver"],"cotizaciones":[],"abonos":[],"agenda":["ver","editar"],"ordenes":["ver","editar"],"usuarios":[],"roles":[]}'::JSONB
  )
ON CONFLICT DO NOTHING;

INSERT INTO tipos_propiedad (nombre)
VALUES ('Residencial'), ('Comercial'), ('Industrial')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO unidades_medida (nombre, abreviatura)
VALUES
  ('Unidad', 'Und'),
  ('Hora Servicio', 'h'),
  ('Metro', 'm'),
  ('Kilogramo', 'kg')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO categorias_materiales (nombre, unidad, prefijo)
VALUES
  ('Conductores', 'Metro', 'EL-BUS'),
  ('Aparamenta', 'Unidad', 'EL-APA'),
  ('Cables', 'Metro', 'EL-CAB'),
  ('Canalización', 'Metro', 'EL-CAN'),
  ('Transformadores', 'Unidad', 'EL-TRF'),
  ('Accesorios', 'Pieza', 'EL-ACC'),
  ('Iluminación', 'Unidad', 'EL-ILU'),
  ('Herramientas', 'Unidad', 'EL-HER')
ON CONFLICT DO NOTHING;

INSERT INTO prioridades (nombre)
VALUES ('Baja'), ('Media'), ('Alta')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO estados_orden_servicio (nombre)
VALUES
  ('Pendiente'),
  ('Programada'),
  ('En Ejecución'),
  ('En Espera de Repuestos'),
  ('Finalizada'),
  ('Cancelada')
ON CONFLICT (nombre) DO NOTHING;

COMMIT;
