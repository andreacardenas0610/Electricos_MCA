BEGIN;

DO $precondiciones$
BEGIN
  IF to_regclass('public.roles') IS NULL
     OR to_regclass('public.usuarios') IS NULL
     OR to_regclass('public.terceros') IS NULL
     OR to_regclass('public.ordenes_servicio') IS NULL
     OR to_regclass('public.estados_orden_servicio') IS NULL
     OR to_regclass('public.materiales') IS NULL THEN
    RAISE EXCEPTION
      'Faltan tablas base requeridas. Aplica y revisa primero las migraciones existentes 001-007.';
  END IF;
END
$precondiciones$;

ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS codigo VARCHAR(40),
  ADD COLUMN IF NOT EXISTS descripcion TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS plataformas TEXT[] NOT NULL DEFAULT ARRAY['Web']::TEXT[],
  ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
  ADD COLUMN IF NOT EXISTS permisos JSONB NOT NULL DEFAULT '{}'::JSONB;

UPDATE roles
SET codigo = 'ROL-' || upper(regexp_replace(nombre, '[^A-Za-z0-9]+', '-', 'g')) || '-' || id
WHERE codigo IS NULL OR btrim(codigo) = '';

DO $validar_indice_unico$
BEGIN
  IF EXISTS (SELECT 1 FROM roles GROUP BY codigo HAVING COUNT(*) > 1) THEN
    RAISE EXCEPTION 'Hay códigos de rol duplicados; corrígelos antes de aplicar esta migración.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuario IS NOT NULL
    GROUP BY lower(usuario)
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Hay nombres de usuario duplicados; corrígelos antes de aplicar esta migración.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM usuarios
    WHERE correo_electronico IS NOT NULL
    GROUP BY lower(correo_electronico)
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Hay correos de usuario duplicados; corrígelos antes de aplicar esta migración.';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM terceros
    WHERE correo_electronico IS NOT NULL
    GROUP BY lower(correo_electronico)
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Hay correos repetidos entre terceros; corrígelos antes de aplicar esta migración.';
  END IF;
END
$validar_indice_unico$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_terceros_correo
  ON terceros (lower(correo_electronico))
  WHERE correo_electronico IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_roles_codigo
  ON roles (codigo);

INSERT INTO roles (nombre, codigo, descripcion, plataformas, estado, permisos)
SELECT 'Administrador', 'ADMIN', 'Administración completa del sistema.',
       ARRAY['Web', 'Móvil']::TEXT[], 'Activo',
       '{"panel":["ver","crear","editar","eliminar"],"clientes":["ver","crear","editar","eliminar"],"terceros":["ver","crear","editar","eliminar"],"materiales":["ver","crear","editar","eliminar"],"servicios":["ver","crear","editar","eliminar"],"cotizaciones":["ver","crear","editar","eliminar"],"abonos":["ver","crear","editar","eliminar"],"agenda":["ver","crear","editar","eliminar"],"ordenes":["ver","crear","editar","eliminar"],"usuarios":["ver","crear","editar","eliminar"],"roles":["ver","crear","editar","eliminar"]}'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE lower(nombre) = lower('Administrador'));

INSERT INTO roles (nombre, codigo, descripcion, plataformas, estado, permisos)
SELECT 'Técnico', 'TECNICO', 'Ejecución y actualización móvil de órdenes asignadas.',
       ARRAY['Móvil']::TEXT[], 'Activo',
       '{"panel":["ver"],"clientes":["ver"],"terceros":["ver"],"materiales":["ver"],"servicios":["ver"],"cotizaciones":[],"abonos":[],"agenda":["ver","editar"],"ordenes":["ver","editar"],"usuarios":[],"roles":[]}'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE lower(nombre) = lower('Técnico'));

UPDATE roles
SET plataformas = ARRAY['Web', 'Móvil']::TEXT[],
    permisos = CASE WHEN permisos = '{}'::JSONB
      THEN '{"panel":["ver","crear","editar","eliminar"],"clientes":["ver","crear","editar","eliminar"],"terceros":["ver","crear","editar","eliminar"],"materiales":["ver","crear","editar","eliminar"],"servicios":["ver","crear","editar","eliminar"],"cotizaciones":["ver","crear","editar","eliminar"],"abonos":["ver","crear","editar","eliminar"],"agenda":["ver","crear","editar","eliminar"],"ordenes":["ver","crear","editar","eliminar"],"usuarios":["ver","crear","editar","eliminar"],"roles":["ver","crear","editar","eliminar"]}'::JSONB
      ELSE permisos END
WHERE lower(nombre) = lower('Administrador');

UPDATE roles
SET plataformas = ARRAY['Móvil']::TEXT[],
    permisos = CASE WHEN permisos = '{}'::JSONB
      THEN '{"panel":["ver"],"clientes":["ver"],"terceros":["ver"],"materiales":["ver"],"servicios":["ver"],"cotizaciones":[],"abonos":[],"agenda":["ver","editar"],"ordenes":["ver","editar"],"usuarios":[],"roles":[]}'::JSONB
      ELSE permisos END
WHERE lower(nombre) = lower('Técnico');

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS verificado BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS tercero_id INT,
  ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now();

DO $fk_usuario_tercero$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_usuarios_tercero'
  ) THEN
    ALTER TABLE usuarios
      ADD CONSTRAINT fk_usuarios_tercero
      FOREIGN KEY (tercero_id) REFERENCES terceros(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END
$fk_usuario_tercero$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_tercero
  ON usuarios (tercero_id)
  WHERE tercero_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_usuario
  ON usuarios (lower(usuario))
  WHERE usuario IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_correo_lower
  ON usuarios (lower(correo_electronico))
  WHERE correo_electronico IS NOT NULL;

DO $validar_credenciales_tecnicas$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'terceros'
      AND column_name IN ('usuario', 'password_hash')
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'terceros'
        AND column_name IN ('usuario', 'password_hash')
      HAVING COUNT(*) = 2
    ) THEN
      EXECUTE $validacion$
        SELECT CASE WHEN EXISTS (
          SELECT 1 FROM terceros
          WHERE (usuario IS NULL) <> (password_hash IS NULL)
        ) THEN 1 ELSE 0 END
      $validacion$;
    END IF;
  END IF;
END
$validar_credenciales_tecnicas$;

DO $validar_cuentas_tecnicas$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'terceros'
      AND column_name IN ('usuario', 'password_hash')
    HAVING COUNT(*) = 2
  ) THEN
    EXECUTE $validacion$
      DO $validacion_cuerpo$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM terceros t
          JOIN usuarios u ON lower(u.usuario) = lower(t.usuario)
          WHERE t.usuario IS NOT NULL
            AND t.password_hash IS NOT NULL
            AND u.tercero_id IS DISTINCT FROM t.id
        ) THEN
          RAISE EXCEPTION
            'Hay usuarios y técnicos con el mismo nombre de usuario. Resuelve esas cuentas antes de aplicar esta migración.';
        END IF;
      END
      $validacion_cuerpo$
    $validacion$;
  END IF;
END
$validar_cuentas_tecnicas$;

DO $migra_credenciales_tecnicas$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'terceros'
      AND column_name IN ('usuario', 'password_hash')
    HAVING COUNT(*) = 2
  ) THEN
    EXECUTE $insertar$
      INSERT INTO usuarios
        (nombre_completo, usuario, documento_n, correo_electronico, telefono,
         password_hash, estado, verificado, rol_id, tercero_id)
      SELECT t.nombre_completo, t.usuario,
             COALESCE(NULLIF(btrim(t.documento), ''), 'TEC-' || t.id),
             COALESCE(NULLIF(btrim(t.correo_electronico), ''),
                      lower(t.usuario) || '@sin-correo.local'),
             t.telefono, t.password_hash,
             COALESCE(t.estado, 'Activo'), TRUE, r.id, t.id
      FROM terceros t
      JOIN roles r ON lower(r.nombre) = lower('Técnico')
      WHERE t.usuario IS NOT NULL
        AND t.password_hash IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM usuarios u
          WHERE lower(u.usuario) = lower(t.usuario) OR u.tercero_id = t.id
        )
    $insertar$;
  END IF;
END
$migra_credenciales_tecnicas$;

CREATE TABLE IF NOT EXISTS tokens_verificacion (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  usuario_id INT NOT NULL REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  proposito VARCHAR(24) NOT NULL
    CHECK (proposito IN ('verificacion', 'recuperacion')),
  expira_en TIMESTAMPTZ NOT NULL,
  usado_en TIMESTAMPTZ,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tokens_verificacion_usuario_expira
  ON tokens_verificacion (usuario_id, proposito, expira_en)
  WHERE usado_en IS NULL;

ALTER TABLE ordenes_servicio
  ADD COLUMN IF NOT EXISTS tecnico_usuario_id INT,
  ADD COLUMN IF NOT EXISTS hora_programada TIME,
  ADD COLUMN IF NOT EXISTS direccion TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS firma_cliente_url TEXT,
  ADD COLUMN IF NOT EXISTS fecha_firma TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now();

DO $fk_orden_tecnico$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_orden_tecnico_usuario'
  ) THEN
    ALTER TABLE ordenes_servicio
      ADD CONSTRAINT fk_orden_tecnico_usuario
      FOREIGN KEY (tecnico_usuario_id) REFERENCES usuarios(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END
$fk_orden_tecnico$;

UPDATE ordenes_servicio os
SET tecnico_usuario_id = u.id
FROM usuarios u
WHERE os.tecnico_usuario_id IS NULL
  AND os.tercero_id = u.tercero_id;

DO $validar_migracion_tecnicos$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'terceros'
      AND column_name IN ('usuario', 'password_hash')
    HAVING COUNT(*) = 2
  ) THEN
    EXECUTE $validacion$
      DO $validacion_cuerpo$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM terceros t
          WHERE t.usuario IS NOT NULL
            AND NOT EXISTS (
              SELECT 1 FROM usuarios u
              WHERE u.tercero_id = t.id
                AND lower(u.usuario) = lower(t.usuario)
            )
        ) THEN
          RAISE EXCEPTION
            'No se pudieron migrar todas las cuentas técnicas a usuarios; se conservó el esquema anterior.';
        END IF;
      END
      $validacion_cuerpo$
    $validacion$;
  END IF;
END
$validar_migracion_tecnicos$;

ALTER TABLE terceros
  DROP COLUMN IF EXISTS usuario,
  DROP COLUMN IF EXISTS password_hash;

CREATE INDEX IF NOT EXISTS idx_ordenes_tecnico_fecha_usuario
  ON ordenes_servicio (tecnico_usuario_id, fecha_programada, hora_programada);

DO $renombrar_historial$
DECLARE
  tipo_relacion "char";
BEGIN
  SELECT relkind INTO tipo_relacion
  FROM pg_class
  WHERE oid = to_regclass('public.seguimiento_orden');

  IF tipo_relacion IN ('r', 'p')
     AND to_regclass('public.historial_estados_orden') IS NULL THEN
    ALTER TABLE seguimiento_orden RENAME TO historial_estados_orden;
  ELSIF tipo_relacion IN ('r', 'p')
     AND to_regclass('public.historial_estados_orden') IS NOT NULL THEN
    RAISE EXCEPTION
      'Existen simultáneamente seguimiento_orden e historial_estados_orden; reconcilia ambas antes de migrar.';
  END IF;
END
$renombrar_historial$;

CREATE TABLE IF NOT EXISTS historial_estados_orden (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  orden_servicio_id INT NOT NULL REFERENCES ordenes_servicio(id) ON UPDATE CASCADE ON DELETE CASCADE,
  usuario_id INT REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL,
  tercero_id INT REFERENCES terceros(id) ON UPDATE CASCADE ON DELETE SET NULL,
  estado_anterior_id INT REFERENCES estados_orden_servicio(id) ON UPDATE CASCADE ON DELETE SET NULL,
  estado_nuevo_id INT NOT NULL REFERENCES estados_orden_servicio(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  comentario TEXT,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE historial_estados_orden
  ADD COLUMN IF NOT EXISTS usuario_id INT,
  ADD COLUMN IF NOT EXISTS tercero_id INT,
  ADD COLUMN IF NOT EXISTS estado_anterior_id INT,
  ADD COLUMN IF NOT EXISTS estado_nuevo_id INT,
  ADD COLUMN IF NOT EXISTS comentario TEXT,
  ADD COLUMN IF NOT EXISTS fecha_registro TIMESTAMPTZ NOT NULL DEFAULT now();

DO $renombrar_evidencias$
DECLARE
  tipo_relacion "char";
BEGIN
  SELECT relkind INTO tipo_relacion
  FROM pg_class
  WHERE oid = to_regclass('public.evidencias_orden');

  IF tipo_relacion IN ('r', 'p')
     AND to_regclass('public.orden_evidencias') IS NULL THEN
    ALTER TABLE evidencias_orden RENAME TO orden_evidencias;
  ELSIF tipo_relacion IN ('r', 'p')
     AND to_regclass('public.orden_evidencias') IS NOT NULL THEN
    RAISE EXCEPTION
      'Existen simultáneamente evidencias_orden y orden_evidencias; reconcilia ambas antes de migrar.';
  END IF;
END
$renombrar_evidencias$;

CREATE TABLE IF NOT EXISTS orden_evidencias (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  orden_servicio_id INT NOT NULL REFERENCES ordenes_servicio(id) ON UPDATE CASCADE ON DELETE CASCADE,
  usuario_id INT REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL,
  tercero_id INT REFERENCES terceros(id) ON UPDATE CASCADE ON DELETE SET NULL,
  tipo VARCHAR(24) NOT NULL CHECK (tipo IN ('Fotografía', 'Firma')),
  url TEXT,
  url_archivo TEXT,
  nombre_archivo VARCHAR(255),
  mime_type VARCHAR(100),
  contenido BYTEA,
  observacion TEXT,
  fecha_carga TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (url IS NOT NULL OR url_archivo IS NOT NULL OR contenido IS NOT NULL)
);

ALTER TABLE orden_evidencias
  ADD COLUMN IF NOT EXISTS usuario_id INT,
  ADD COLUMN IF NOT EXISTS tercero_id INT,
  ADD COLUMN IF NOT EXISTS url TEXT,
  ADD COLUMN IF NOT EXISTS url_archivo TEXT,
  ADD COLUMN IF NOT EXISTS nombre_archivo VARCHAR(255),
  ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS contenido BYTEA,
  ADD COLUMN IF NOT EXISTS observacion TEXT,
  ADD COLUMN IF NOT EXISTS fecha_carga TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE orden_evidencias
SET url = url_archivo
WHERE url IS NULL AND url_archivo IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orden_evidencias_orden_fecha
  ON orden_evidencias (orden_servicio_id, fecha_carga DESC);

CREATE TABLE IF NOT EXISTS orden_materiales_consumidos (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  orden_servicio_id INT NOT NULL REFERENCES ordenes_servicio(id) ON UPDATE CASCADE ON DELETE CASCADE,
  material_codigo VARCHAR(32) NOT NULL REFERENCES materiales(codigo) ON UPDATE CASCADE ON DELETE RESTRICT,
  cantidad NUMERIC(14, 3) NOT NULL CHECK (cantidad > 0),
  usuario_id INT REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (orden_servicio_id, material_codigo)
);

CREATE OR REPLACE VIEW seguimiento_orden AS
SELECT id, orden_servicio_id, usuario_id, tercero_id, estado_anterior_id,
       estado_nuevo_id, comentario, fecha_registro
FROM historial_estados_orden;

CREATE OR REPLACE VIEW evidencias_orden AS
SELECT id, orden_servicio_id, usuario_id, tercero_id, tipo,
       COALESCE(url_archivo, url) AS url_archivo, nombre_archivo, mime_type,
       contenido, observacion, fecha_carga
FROM orden_evidencias;

COMMIT;
