-- =============================================================
-- 008_roles_multiples_y_cliente.sql
-- Migración ADITIVA: no elimina ni renombra nada existente.
--   1) Tabla usuarios_roles: un usuario puede tener varios roles.
--      `usuarios.rol_id` se conserva como ROL PRINCIPAL; la tabla
--      guarda los roles ADICIONALES de cada cuenta.
--   2) Semilla del rol "Cliente" (solo se inserta si no existe).
--   3) clientes.es_dueno: marca que el solicitante del servicio es
--      el dueño de la empresa o del predio.
-- El backend funciona igual aunque esta migración no se haya
-- aplicado: detecta las tablas/columnas y se degrada con elegancia.
-- =============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS usuarios_roles (
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  rol_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (usuario_id, rol_id)
);

CREATE INDEX IF NOT EXISTS ix_usuarios_roles_rol ON usuarios_roles (rol_id);

INSERT INTO roles (nombre, codigo, descripcion, plataformas, estado, permisos)
SELECT 'Cliente', 'ROL-CLIENTE',
       'Rol para usuarios que también son clientes de Eléctricos MCA: consultan su información y sus servicios.',
       ARRAY['Web']::text[], 'Activo', '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE lower(nombre) = 'cliente');

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS es_dueno BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;
