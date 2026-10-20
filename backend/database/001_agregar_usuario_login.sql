ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS usuario VARCHAR(50);

CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_usuario
ON usuarios (lower(usuario))
WHERE usuario IS NOT NULL;
