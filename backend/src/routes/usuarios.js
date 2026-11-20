import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { correoValido, idValido, textoValido } from '../utils/validacion.js';

const router = Router();
const columnasUsuario = `
  u.id, u.nombre_completo AS nombre, u.usuario, u.documento_n AS documento,
  u.correo_electronico AS correo, u.telefono, u.zona, u.estado,
  u.rol_id, r.nombre AS rol
`;

// Tabla usuarios_roles (migración 008). Mientras no exista en la base,
// todo sigue funcionando con el rol principal (rol_id).
let usuariosRolesDisponible = null;
async function rolesAdicionales() {
  if (usuariosRolesDisponible === false) return [];
  try {
    const { rows } = await pool.query(
      `SELECT ur.usuario_id, r.nombre
       FROM usuarios_roles ur
       JOIN roles r ON r.id = ur.rol_id`,
    );
    usuariosRolesDisponible = true;
    return rows;
  } catch (error) {
    if (String(error?.message || '').includes('usuarios_roles')) {
      usuariosRolesDisponible = false;
      return [];
    }
    throw error;
  }
}

function filaUsuario(fila, extras) {
  const roles = [...new Set([
    fila.rol,
    ...extras
      .filter((extra) => Number(extra.usuario_id) === Number(fila.id))
      .map((extra) => extra.nombre),
  ])].filter(Boolean);
  return { ...fila, rol: fila.rol, roles, ultimoAcceso: 'Sin registro' };
}

const normalizarDocumento = (valor) => String(valor || '')
  .replace(/[^0-9a-zA-Z]/g, '')
  .toLowerCase();

function validar(datos, crear = false) {
  const errores = [];
  if (!textoValido(datos.nombre)) errores.push('nombre es obligatorio.');
  if (!textoValido(datos.documento)) errores.push('documento (cédula) es obligatorio.');
  if (!textoValido(datos.usuario)) errores.push('usuario es obligatorio.');
  if (!correoValido(datos.correo)) errores.push('correo no es válido.');
  if (crear && (typeof datos.password !== 'string' || datos.password.length < 8)) {
    errores.push('password debe tener al menos 8 caracteres.');
  }
  if (!crear && datos.password && datos.password.length < 8) {
    errores.push('password debe tener al menos 8 caracteres.');
  }
  if (!textoValido(datos.rol) && !idValido(datos.rol_id)) {
    errores.push('rol o rol_id es obligatorio.');
  }
  if (datos.estado && !['Activo', 'Inactivo'].includes(datos.estado)) {
    errores.push('estado debe ser Activo o Inactivo.');
  }
  return errores;
}

async function resolverRol(client, datos) {
  const { rows } = await client.query(
    `SELECT id, nombre, estado FROM roles
     WHERE ($1::int IS NOT NULL AND id = $1)
        OR ($2::text IS NOT NULL AND lower(nombre) = lower($2))
     LIMIT 1`,
    [datos.rol_id ? idValido(datos.rol_id) : null, datos.rol || null],
  );
  return rows[0] || null;
}

// Resuelve los roles adicionales (migración 008) excluyendo el principal.
async function resolverRolesExtras(client, nombres, principalId) {
  const lista = [...new Set((Array.isArray(nombres) ? nombres : [])
    .filter((nombre) => textoValido(nombre))
    .map((nombre) => String(nombre).trim()))];
  if (!lista.length) return [];
  const { rows } = await client.query(
    'SELECT id, nombre, estado FROM roles WHERE lower(nombre) = ANY($1)',
    [lista.map((nombre) => nombre.toLowerCase())],
  );
  const invalidos = lista.filter(
    (nombre) => !rows.some((rol) => rol.nombre.toLowerCase() === nombre.toLowerCase()),
  );
  if (invalidos.length) return { error: `Roles no encontrados: ${invalidos.join(', ')}.` };
  const inactivos = rows.find((rol) => rol.estado !== 'Activo');
  if (inactivos) return { error: `El rol ${inactivos.nombre} está inactivo.` };
  return rows
    .filter((rol) => Number(rol.id) !== Number(principalId))
    .map((rol) => rol.id);
}

async function sincronizarRolesExtras(client, usuarioId, extras) {
  if (usuariosRolesDisponible === false) return;
  try {
    await client.query('DELETE FROM usuarios_roles WHERE usuario_id = $1', [usuarioId]);
    for (const rolId of extras) {
      await client.query(
        'INSERT INTO usuarios_roles (usuario_id, rol_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [usuarioId, rolId],
      );
    }
    usuariosRolesDisponible = true;
  } catch (error) {
    if (String(error?.message || '').includes('usuarios_roles')) {
      usuariosRolesDisponible = false;
    } else {
      throw error;
    }
  }
}

router.get('/', async (req, res, next) => {
  try {
    const [usuarios, extras] = await Promise.all([
      pool.query(
        `SELECT ${columnasUsuario} FROM usuarios u
         JOIN roles r ON r.id = u.rol_id
         ORDER BY u.id DESC`,
      ),
      rolesAdicionales(),
    ]);
    return res.json(usuarios.rows.map((fila) => filaUsuario(fila, extras)));
  } catch (error) {
    return next(error);
  }
});

// Lupa del formulario de usuarios: busca la cédula en usuarios,
// terceros y clientes para rellenar los datos sin digitarlos dos veces.
router.get('/buscar-documento', async (req, res, next) => {
  const documento = String(req.query.documento || '').trim();
  if (documento.length < 3) {
    return res.status(400).json({ mensaje: 'Escribe el número de documento a buscar.' });
  }

  try {
    const [usuarioResultado, terceroResultado, clienteResultado] = await Promise.all([
      pool.query(
        `SELECT ${columnasUsuario} FROM usuarios u
         JOIN roles r ON r.id = u.rol_id
         WHERE regexp_replace(u.documento_n, '[^0-9a-zA-Z]', '', 'g') = $1
         LIMIT 1`,
        [normalizarDocumento(documento)],
      ),
      pool.query(
        `SELECT id, nombre_completo, tipo_documento, documento, empresa,
                telefono, correo_electronico, direccion, municipio,
                departamento, estado
         FROM terceros
         WHERE regexp_replace(documento, '[^0-9a-zA-Z]', '', 'g') = $1
         LIMIT 1`,
        [normalizarDocumento(documento)],
      ),
      pool.query(
        `SELECT c.id, c.nombre_razon_social, c.documento_nit, c.tipo_documento,
                c.tipo_cliente, c.estado, cc.telefono, cc.correo_electronico
         FROM clientes c
         LEFT JOIN contactos_cliente cc ON cc.cliente_id = c.id AND cc.es_principal = TRUE
         WHERE regexp_replace(c.documento_nit, '[^0-9a-zA-Z]', '', 'g') = $1
         LIMIT 1`,
        [normalizarDocumento(documento)],
      ),
    ]);
    return res.json({
      usuario: usuarioResultado.rows[0] || null,
      tercero: terceroResultado.rows[0] || null,
      cliente: clienteResultado.rows[0] || null,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ mensaje: 'El id no es válido.' });
  try {
    const [usuario, extras] = await Promise.all([
      pool.query(
        `SELECT ${columnasUsuario} FROM usuarios u
         JOIN roles r ON r.id = u.rol_id WHERE u.id = $1`,
        [id],
      ),
      rolesAdicionales(),
    ]);
    if (!usuario.rows[0]) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    return res.json(filaUsuario(usuario.rows[0], extras));
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  const datos = req.body || {};
  const errores = validar(datos, true);
  if (errores.length) return res.status(400).json({ mensaje: errores.join(' ') });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const rol = await resolverRol(client, datos);
    if (!rol || rol.estado !== 'Activo') {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: 'El rol seleccionado no existe o está inactivo.' });
    }
    const extras = await resolverRolesExtras(client, datos.roles, rol.id);
    if (extras?.error) {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: extras.error });
    }
    const documentoDuplicado = await client.query(
      `SELECT 1 FROM usuarios
       WHERE regexp_replace(documento_n, '[^0-9a-zA-Z]', '', 'g') = $1
       LIMIT 1`,
      [normalizarDocumento(datos.documento)],
    );
    if (documentoDuplicado.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: 'Ya existe un usuario con ese documento.' });
    }
    const usuarioDuplicado = await client.query(
      'SELECT 1 FROM usuarios WHERE lower(usuario) = lower($1) LIMIT 1',
      [datos.usuario.trim()],
    );
    if (usuarioDuplicado.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: 'El nombre de usuario ya está en uso.' });
    }
    const passwordHash = await bcrypt.hash(datos.password, 12);
    const { rows } = await client.query(
      `INSERT INTO usuarios
         (nombre_completo, usuario, documento_n, correo_electronico, telefono, zona,
          password_hash, estado, rol_id)
       VALUES ($1, $2, $3, lower($4), $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        datos.nombre.trim(), datos.usuario.trim(), datos.documento.trim(),
        datos.correo.trim(),
        datos.telefono || null, datos.zona || 'General', passwordHash,
        datos.estado || 'Activo', rol.id,
      ],
    );
    await sincronizarRolesExtras(client, rows[0].id, extras);
    const usuario = await client.query(
      `SELECT ${columnasUsuario} FROM usuarios u
       JOIN roles r ON r.id = u.rol_id WHERE u.id = $1`,
      [rows[0].id],
    );
    await client.query('COMMIT');
    // Después del COMMIT la tabla usuarios_roles ya refleja los extras.
    const adicionales = await rolesAdicionales();
    return res.status(201).json(filaUsuario(usuario.rows[0], adicionales));
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res, next) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ mensaje: 'El id no es válido.' });
  const datos = req.body || {};
  const errores = validar(datos);
  if (errores.length) return res.status(400).json({ mensaje: errores.join(' ') });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: actuales } = await client.query(
      'SELECT id, usuario, rol_id FROM usuarios WHERE id = $1 FOR UPDATE',
      [id],
    );
    if (!actuales[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }
    const rol = await resolverRol(client, datos);
    if (!rol || rol.estado !== 'Activo') {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: 'El rol seleccionado no existe o está inactivo.' });
    }
    const extras = await resolverRolesExtras(client, datos.roles, rol.id);
    if (extras?.error) {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: extras.error });
    }
    const documentoDuplicado = await client.query(
      `SELECT 1 FROM usuarios
       WHERE regexp_replace(documento_n, '[^0-9a-zA-Z]', '', 'g') = $1
         AND id <> $2
       LIMIT 1`,
      [normalizarDocumento(datos.documento), id],
    );
    if (documentoDuplicado.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: 'Ya existe otro usuario con ese documento.' });
    }
    const usuarioDuplicado = await client.query(
      'SELECT 1 FROM usuarios WHERE lower(usuario) = lower($1) AND id <> $2 LIMIT 1',
      [datos.usuario.trim(), id],
    );
    if (usuarioDuplicado.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: 'El nombre de usuario ya está en uso.' });
    }
    const esCuentaPrincipal = actuales[0].usuario.toLowerCase() === 'admin';
    if (esCuentaPrincipal && rol.nombre !== 'Administrador') {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: 'La cuenta admin debe conservar el rol Administrador.' });
    }
    if (esCuentaPrincipal && datos.estado === 'Inactivo') {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: 'La cuenta admin debe permanecer activa.' });
    }
    if (Number(req.usuario.id) === id && datos.estado === 'Inactivo') {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: 'No puedes desactivar tu propia cuenta.' });
    }
    const passwordHash = datos.password ? await bcrypt.hash(datos.password, 12) : null;
    const { rows } = await client.query(
      `UPDATE usuarios
       SET nombre_completo = $1, usuario = $2, documento_n = $3,
           correo_electronico = lower($4),
           telefono = $5, zona = $6, rol_id = $7,
           password_hash = COALESCE($8, password_hash),
           estado = COALESCE($9, estado)
       WHERE id = $10
       RETURNING id`,
      [
        datos.nombre.trim(), datos.usuario.trim(), datos.documento.trim(),
        datos.correo.trim(),
        datos.telefono || null, datos.zona || 'General', rol.id,
        passwordHash, datos.estado || null, id,
      ],
    );
    await sincronizarRolesExtras(client, rows[0].id, extras);
    const usuario = await client.query(
      `SELECT ${columnasUsuario} FROM usuarios u
       JOIN roles r ON r.id = u.rol_id WHERE u.id = $1`,
      [rows[0].id],
    );
    await client.query('COMMIT');
    const adicionales = await rolesAdicionales();
    return res.json(filaUsuario(usuario.rows[0], adicionales));
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

router.patch('/:id/estado', async (req, res, next) => {
  const id = idValido(req.params.id);
  const { estado } = req.body || {};
  if (!id) return res.status(400).json({ mensaje: 'El id no es válido.' });
  if (!['Activo', 'Inactivo'].includes(estado)) {
    return res.status(400).json({ mensaje: 'estado debe ser Activo o Inactivo.' });
  }
  if (Number(req.usuario.id) === id && estado === 'Inactivo') {
    return res.status(400).json({ mensaje: 'No puedes desactivar tu propia cuenta.' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE usuarios
       SET estado = $1
       WHERE id = $2 AND (lower(usuario) <> 'admin' OR $1 = 'Activo')
       RETURNING id`,
      [estado, id],
    );
    if (!rows[0]) return res.status(400).json({ mensaje: 'La cuenta admin debe permanecer activa o el usuario no existe.' });
    const usuario = await pool.query(
      `SELECT ${columnasUsuario} FROM usuarios u
       JOIN roles r ON r.id = u.rol_id WHERE u.id = $1`,
      [id],
    );
    return res.json({ ...usuario.rows[0], ultimoAcceso: 'Sin registro' });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ mensaje: 'El id no es válido.' });
  if (Number(req.usuario.id) === id) {
    return res.status(400).json({ mensaje: 'No puedes eliminar tu propia cuenta.' });
  }
  try {
    const resultado = await pool.query(
      `DELETE FROM usuarios
       WHERE id = $1 AND lower(usuario) <> 'admin'`,
      [id],
    );
    if (!resultado.rowCount) return res.status(404).json({ mensaje: 'Usuario no encontrado o cuenta admin protegida.' });
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

export default router;
