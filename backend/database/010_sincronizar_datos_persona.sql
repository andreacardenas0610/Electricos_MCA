BEGIN;

DO $precondiciones$
BEGIN
  IF to_regclass('public.personas') IS NULL
     OR to_regclass('public.terceros') IS NULL
     OR to_regclass('public.usuarios') IS NULL
     OR to_regclass('public.clientes') IS NULL THEN
    RAISE EXCEPTION
      'Primero deben estar aplicadas las migraciones 008 y 009.';
  END IF;
END
$precondiciones$;

DO $vincular_perfiles$
BEGIN
  IF EXISTS (
    SELECT t.persona_id
    FROM terceros t
    JOIN usuarios u ON u.tercero_id = t.id
    WHERE t.persona_id IS NOT NULL
      AND u.persona_id IS NOT NULL
      AND u.persona_id <> t.persona_id
  ) THEN
    RAISE EXCEPTION
      'Hay cuentas móviles enlazadas a una persona distinta de su tercero; revisa esos vínculos antes de continuar.';
  END IF;

  UPDATE usuarios u
  SET persona_id = t.persona_id
  FROM terceros t
  WHERE u.tercero_id = t.id
    AND t.persona_id IS NOT NULL
    AND u.persona_id IS DISTINCT FROM t.persona_id;

  UPDATE clientes c
  SET persona_id = t.persona_id
  FROM terceros t
  WHERE c.tercero_id = t.id
    AND t.persona_id IS NOT NULL
    AND c.persona_id IS DISTINCT FROM t.persona_id;
END
$vincular_perfiles$;

CREATE OR REPLACE FUNCTION sincronizar_perfiles_desde_persona()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $funcion$
BEGIN
  UPDATE terceros
  SET nombre_completo = NEW.nombre_completo,
      tipo_documento = NEW.tipo_documento,
      documento = NEW.documento,
      telefono = NEW.telefono,
      correo_electronico = NEW.correo_electronico
  WHERE persona_id = NEW.id;

  UPDATE usuarios
  SET nombre_completo = NEW.nombre_completo,
      correo_electronico = NEW.correo_electronico,
      telefono = NEW.telefono,
      actualizado_en = now()
  WHERE persona_id = NEW.id;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'usuarios'
      AND column_name = 'documento_n'
  ) THEN
    EXECUTE
      'UPDATE usuarios SET documento_n = $1 WHERE persona_id = $2'
    USING NEW.documento, NEW.id;
  END IF;

  UPDATE clientes
  SET nombre_razon_social = NEW.nombre_completo,
      documento_nit = NEW.documento,
      tipo_documento = NEW.tipo_documento
  WHERE persona_id = NEW.id;

  RETURN NEW;
END
$funcion$;

CREATE OR REPLACE FUNCTION sincronizar_persona_desde_perfil()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $funcion$
DECLARE
  datos JSONB := to_jsonb(NEW);
BEGIN
  IF pg_trigger_depth() > 1 OR NEW.persona_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'terceros' THEN
    UPDATE personas
    SET tipo_documento = NEW.tipo_documento,
        documento = NEW.documento,
        nombre_completo = NEW.nombre_completo,
        telefono = NEW.telefono,
        correo_electronico = NEW.correo_electronico,
        actualizado_en = now()
    WHERE id = NEW.persona_id;
  ELSIF TG_TABLE_NAME = 'usuarios' THEN
    UPDATE personas
    SET documento = COALESCE(NULLIF(datos->>'documento_n', ''), documento),
        nombre_completo = NEW.nombre_completo,
        telefono = NEW.telefono,
        correo_electronico = NEW.correo_electronico,
        actualizado_en = now()
    WHERE id = NEW.persona_id;
  ELSIF TG_TABLE_NAME = 'clientes' THEN
    UPDATE personas
    SET tipo_documento = NEW.tipo_documento,
        documento = NEW.documento_nit,
        nombre_completo = NEW.nombre_razon_social,
        actualizado_en = now()
    WHERE id = NEW.persona_id;
  END IF;

  RETURN NEW;
END
$funcion$;

DROP TRIGGER IF EXISTS trg_personas_perfiles ON personas;
CREATE TRIGGER trg_personas_perfiles
AFTER UPDATE OF tipo_documento, documento, nombre_completo, telefono, correo_electronico
ON personas
FOR EACH ROW
EXECUTE FUNCTION sincronizar_perfiles_desde_persona();

DROP TRIGGER IF EXISTS trg_terceros_persona ON terceros;
CREATE TRIGGER trg_terceros_persona
AFTER UPDATE OF tipo_documento, documento, nombre_completo, telefono, correo_electronico, persona_id
ON terceros
FOR EACH ROW
EXECUTE FUNCTION sincronizar_persona_desde_perfil();

DROP TRIGGER IF EXISTS trg_usuarios_persona ON usuarios;
CREATE TRIGGER trg_usuarios_persona
AFTER UPDATE OF nombre_completo, telefono, correo_electronico, persona_id
ON usuarios
FOR EACH ROW
EXECUTE FUNCTION sincronizar_persona_desde_perfil();

DO $trigger_documento_usuario$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'usuarios'
      AND column_name = 'documento_n'
  ) THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_usuarios_documento_persona ON usuarios';
    EXECUTE
      'CREATE TRIGGER trg_usuarios_documento_persona
       AFTER UPDATE OF documento_n ON usuarios
       FOR EACH ROW
       EXECUTE FUNCTION sincronizar_persona_desde_perfil()';
  END IF;
END
$trigger_documento_usuario$;

DROP TRIGGER IF EXISTS trg_clientes_persona ON clientes;
CREATE TRIGGER trg_clientes_persona
AFTER UPDATE OF tipo_documento, documento_nit, nombre_razon_social, persona_id
ON clientes
FOR EACH ROW
EXECUTE FUNCTION sincronizar_persona_desde_perfil();

COMMIT;
