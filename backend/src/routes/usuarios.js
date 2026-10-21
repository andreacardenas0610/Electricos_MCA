import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { correoValido, idValido, textoValido } from '../utils/validacion.js';

const router = Router();
const columnasUsuario = `
  u.id, u.nombre_completo AS nombre, u.usuario,
  u.correo_electronico AS correo, u.telefono, u.zona, u.estado,
  u.rol_id, r.nombre AS rol
`;

function validar(datos, crear = false) {
  const errores = [];
  if (!textoValido(datos.nombre)) errores.push('nombre es obligatorio.');
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

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${columnasUsuario} FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       ORDER BY u.id`,
    );
    return res.json(rows.map((row) => ({ ...row, ultimoAcceso: 'Sin registro' })));
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ mensaje: 'El id no es válido.' });
  try {
    const { rows } = await pool.query(
      `SELECT ${columnasUsuario} FROM usuarios u
       JOIN roles r ON r.id = u.rol_id WHERE u.id = $1`,
      [id],
    );
    if (!rows[0]) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    return res.json({ ...rows[0], ultimoAcceso: 'Sin registro' });
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
    const passwordHash = await bcrypt.hash(datos.password, 12);
    const { rows } = await client.query(
      `INSERT INTO usuarios
         (nombre_completo, usuario, correo_electronico, telefono, zona,
          password_hash, estado, rol_id)
       VALUES ($1, $2, lower($3), $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        datos.nombre.trim(), datos.usuario.trim(), datos.correo.trim(),
        datos.telefono || null, datos.zona || 'General', passwordHash,
        datos.estado || 'Activo', rol.id,
      ],
    );
    const usuario = await client.query(
      `SELECT ${columnasUsuario} FROM usuarios u
       JOIN roles r ON r.id = u.rol_id WHERE u.id = $1`,
      [rows[0].id],
    );
    await client.query('COMMIT');
    return res.status(201).json({ ...usuario.rows[0], ultimoAcceso: 'Sin registro' });
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
       SET nombre_completo = $1, usuario = $2, correo_electronico = lower($3),
           telefono = $4, zona = $5, rol_id = $6,
           password_hash = COALESCE($7, password_hash),
           estado = COALESCE($8, estado)
       WHERE id = $9
       RETURNING id`,
      [
        datos.nombre.trim(), datos.usuario.trim(), datos.correo.trim(),
        datos.telefono || null, datos.zona || 'General', rol.id,
        passwordHash, datos.estado || null, id,
      ],
    );
    const usuario = await client.query(
      `SELECT ${columnasUsuario} FROM usuarios u
       JOIN roles r ON r.id = u.rol_id WHERE u.id = $1`,
      [rows[0].id],
    );
    await client.query('COMMIT');
    return res.json({ ...usuario.rows[0], ultimoAcceso: 'Sin registro' });
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
