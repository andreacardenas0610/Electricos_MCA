import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { correoValido, idValido, textoValido } from '../utils/validacion.js';
import { resolverPersona } from '../utils/personas.js';

const router = Router();
const columnasUsuario = `
  u.id, COALESCE(p.nombre_completo, u.nombre_completo) AS nombre, u.usuario,
  COALESCE(p.correo_electronico, u.correo_electronico) AS correo,
  COALESCE(p.telefono, u.telefono) AS telefono, u.zona, u.estado,
  u.verificado, u.tercero_id AS "terceroId",
  COALESCE(p.documento, t.documento) AS "documentoTecnico",
  u.rol_id, r.nombre AS rol
`;

function validar(datos, crear = false) {
  const errores = [];
  if (!textoValido(datos.nombre)) errores.push('nombre es obligatorio.');
  if (!textoValido(datos.usuario)) errores.push('usuario es obligatorio.');
  if (!correoValido(datos.correo)) errores.push('correo no es válido.');
  if (datos.password != null && datos.password !== '' && typeof datos.password !== 'string') {
    errores.push('password debe ser texto.');
  }
  if (crear && (typeof datos.password !== 'string' || datos.password.length < 8)) {
    errores.push('password debe tener al menos 8 caracteres.');
  }
  if (!crear && datos.password && datos.password.length < 8) {
    errores.push('password debe tener al menos 8 caracteres.');
  }
  if (!textoValido(datos.rol) && !idValido(datos.rol_id)) {
    errores.push('rol o rol_id es obligatorio.');
  }
  if (datos.tercero_id != null && datos.tercero_id !== '' && !idValido(datos.tercero_id)) {
    errores.push('tercero_id debe ser un id válido.');
  }
  if (datos.estado && !['Activo', 'Inactivo'].includes(datos.estado)) {
    errores.push('estado debe ser Activo o Inactivo.');
  }
  return errores;
}

async function resolverRol(client, datos) {
  const { rows } = await client.query(
    `SELECT id, nombre, estado, plataformas FROM roles
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
       LEFT JOIN terceros t ON t.id = u.tercero_id
      LEFT JOIN personas p ON p.id = u.persona_id
      ORDER BY u.id DESC`,
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
       JOIN roles r ON r.id = u.rol_id
       LEFT JOIN terceros t ON t.id = u.tercero_id
       LEFT JOIN personas p ON p.id = u.persona_id
       WHERE u.id = $1`,
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
    const terceroId = datos.tercero_id ? idValido(datos.tercero_id) : null;
    const rolMovil = rol.plataformas?.includes('Móvil') && rol.nombre !== 'Administrador';
    if (rolMovil && !terceroId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: 'Los roles móviles deben vincularse a un tercero.' });
    }
    if (terceroId && (!rolMovil || rol.plataformas.includes('Web'))) {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: 'El tercero debe tener un rol habilitado solo para Móvil.' });
    }
    if (terceroId) {
      const { rows: perfiles } = await client.query(
        `SELECT id, nombre_completo, tipo_documento, documento,
                correo_electronico, telefono
         FROM terceros WHERE id = $1 FOR UPDATE`,
        [terceroId],
      );
      if (!perfiles[0]) {
        await client.query('ROLLBACK');
        return res.status(400).json({ mensaje: 'El perfil técnico seleccionado no existe.' });
      }
      const { rows: vinculos } = await client.query(
        'SELECT id FROM usuarios WHERE tercero_id = $1',
        [terceroId],
      );
      if (vinculos[0]) {
        await client.query('ROLLBACK');
        return res.status(409).json({ mensaje: 'El perfil técnico ya tiene una cuenta asociada.' });
      }
    }
    const passwordHash = await bcrypt.hash(datos.password, 12);
    let personaId = null;
    let documentoPersona = null;
    if (terceroId) {
      const perfil = (await client.query(
        `SELECT nombre_completo, tipo_documento, documento,
                correo_electronico, telefono
         FROM terceros WHERE id = $1`,
        [terceroId],
      )).rows[0];
      documentoPersona = perfil.documento;
      personaId = await resolverPersona(client, {
        documento: perfil.documento,
        tipoDocumento: perfil.tipo_documento,
        nombre: datos.nombre,
        telefono: datos.telefono,
        correo: datos.correo,
      });
    }
    const columnasExtra = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'usuarios'
         AND column_name IN ('documento_n', 'persona_id')`,
    );
    const tieneDocumento = columnasExtra.rows.some((fila) => fila.column_name === 'documento_n');
    const tienePersona = columnasExtra.rows.some((fila) => fila.column_name === 'persona_id');
    let sentencia;
    let valores;
    if (tieneDocumento && tienePersona) {
      sentencia = `INSERT INTO usuarios
        (nombre_completo, usuario, documento_n, correo_electronico, telefono, zona,
         password_hash, estado, verificado, rol_id, tercero_id, persona_id)
       VALUES ($1,$2,$3,lower($4),$5,$6,$7,$8,TRUE,$9,$10,$11) RETURNING id`;
      valores = [datos.nombre.trim(), datos.usuario.trim(), documentoPersona || datos.documento || `USR-${datos.usuario.trim()}`,
        datos.correo.trim(), datos.telefono || null, datos.zona || 'General',
        passwordHash, datos.estado || 'Activo', rol.id, terceroId, personaId];
    } else if (tienePersona) {
      sentencia = `INSERT INTO usuarios
        (nombre_completo, usuario, correo_electronico, telefono, zona,
         password_hash, estado, verificado, rol_id, tercero_id, persona_id)
       VALUES ($1,$2,lower($3),$4,$5,$6,$7,TRUE,$8,$9,$10) RETURNING id`;
      valores = [datos.nombre.trim(), datos.usuario.trim(), datos.correo.trim(),
        datos.telefono || null, datos.zona || 'General', passwordHash,
        datos.estado || 'Activo', rol.id, terceroId, personaId];
    } else if (tieneDocumento) {
      sentencia = `INSERT INTO usuarios
        (nombre_completo, usuario, documento_n, correo_electronico, telefono, zona,
         password_hash, estado, verificado, rol_id, tercero_id)
       VALUES ($1,$2,$3,lower($4),$5,$6,$7,$8,TRUE,$9,$10) RETURNING id`;
      valores = [datos.nombre.trim(), datos.usuario.trim(), documentoPersona || datos.documento || `USR-${datos.usuario.trim()}`,
        datos.correo.trim(), datos.telefono || null, datos.zona || 'General',
        passwordHash, datos.estado || 'Activo', rol.id, terceroId];
    } else {
      sentencia = `INSERT INTO usuarios
        (nombre_completo, usuario, correo_electronico, telefono, zona,
         password_hash, estado, verificado, rol_id, tercero_id)
       VALUES ($1,$2,lower($3),$4,$5,$6,$7,TRUE,$8,$9) RETURNING id`;
      valores = [datos.nombre.trim(), datos.usuario.trim(), datos.correo.trim(),
        datos.telefono || null, datos.zona || 'General', passwordHash,
        datos.estado || 'Activo', rol.id, terceroId];
    }
    const { rows } = await client.query(sentencia, valores);
    if (terceroId) {
      await client.query(
        `UPDATE terceros
         SET nombre_completo = $1, correo_electronico = lower($2), telefono = $3
         WHERE id = $4`,
        [datos.nombre.trim(), datos.correo.trim(), datos.telefono || null, terceroId],
      );
    }
    const usuario = await client.query(
      `SELECT ${columnasUsuario} FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       LEFT JOIN terceros t ON t.id = u.tercero_id
      LEFT JOIN personas p ON p.id = u.persona_id
      WHERE u.id = $1`,
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
      'SELECT id, usuario, rol_id, tercero_id, persona_id FROM usuarios WHERE id = $1 FOR UPDATE',
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
    const terceroId = datos.tercero_id ? idValido(datos.tercero_id) : null;
    const rolMovil = rol.plataformas?.includes('Móvil') && rol.nombre !== 'Administrador';
    if (rolMovil && !terceroId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: 'Los roles móviles deben vincularse a un tercero.' });
    }
    if (terceroId && (!rolMovil || rol.plataformas.includes('Web'))) {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: 'El tercero debe tener un rol habilitado solo para Móvil.' });
    }
    if (terceroId) {
      const { rows: vinculos } = await client.query(
        'SELECT id FROM usuarios WHERE tercero_id = $1 AND id <> $2',
        [terceroId, id],
      );
      if (vinculos[0]) {
        await client.query('ROLLBACK');
        return res.status(409).json({ mensaje: 'El perfil técnico ya tiene una cuenta asociada.' });
      }
    }
    let personaId = actuales[0].persona_id;
    let documentoPersona = null;
    let tipoDocumentoPersona = null;
    if (terceroId) {
      const perfil = (await client.query(
        `SELECT tipo_documento, documento, nombre_completo, correo_electronico, telefono, persona_id
         FROM terceros WHERE id = $1`,
        [terceroId],
      )).rows[0];
      if (!perfil) {
        await client.query('ROLLBACK');
        return res.status(400).json({ mensaje: 'El perfil técnico asociado no existe.' });
      }
      personaId = perfil.persona_id;
      documentoPersona = perfil.documento;
      tipoDocumentoPersona = perfil.tipo_documento;
    } else if (personaId) {
      const persona = await client.query(
        'SELECT documento, tipo_documento FROM personas WHERE id = $1',
        [personaId],
      );
      documentoPersona = persona.rows[0]?.documento;
      tipoDocumentoPersona = persona.rows[0]?.tipo_documento;
    }
    if (personaId) {
      personaId = await resolverPersona(client, {
        personaId,
        documento: documentoPersona || datos.documento,
        tipoDocumento: tipoDocumentoPersona,
        nombre: datos.nombre,
        telefono: datos.telefono,
        correo: datos.correo,
      });
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
           telefono = $4, zona = $5, rol_id = $6, tercero_id = $7,
           password_hash = COALESCE($8, password_hash),
           estado = COALESCE($9, estado), persona_id = COALESCE($11, persona_id),
           actualizado_en = now()
       WHERE id = $10
       RETURNING id`,
      [
        datos.nombre.trim(), datos.usuario.trim(), datos.correo.trim(),
        datos.telefono || null, datos.zona || 'General', rol.id,
        terceroId, passwordHash, datos.estado || null, id, personaId,
      ],
    );
    if (terceroId) {
      await client.query(
        `UPDATE terceros
         SET nombre_completo = $1, correo_electronico = lower($2), telefono = $3
         WHERE id = $4`,
        [datos.nombre.trim(), datos.correo.trim(), datos.telefono || null, terceroId],
      );
    }
    const usuario = await client.query(
      `SELECT ${columnasUsuario} FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       LEFT JOIN terceros t ON t.id = u.tercero_id
       LEFT JOIN personas p ON p.id = u.persona_id
       WHERE u.id = $1`,
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
       JOIN roles r ON r.id = u.rol_id
       LEFT JOIN terceros t ON t.id = u.tercero_id
       LEFT JOIN personas p ON p.id = u.persona_id
       WHERE u.id = $1`,
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
