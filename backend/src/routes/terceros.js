import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { correoValido, idValido, textoValido } from '../utils/validacion.js';
import { resolverPersona } from '../utils/personas.js';

const router = Router();
const tiposDocumento = ['Cédula', 'Cédula de extranjería', 'NIT', 'Pasaporte'];
const consultaTerceros = `
  SELECT t.id, COALESCE(p.nombre_completo, t.nombre_completo) AS nombre_completo,
         COALESCE(p.tipo_documento, t.tipo_documento) AS tipo_documento,
         COALESCE(p.documento, t.documento) AS documento,
         t.empresa, COALESCE(p.telefono, t.telefono) AS telefono,
         COALESCE(p.correo_electronico, t.correo_electronico) AS correo_electronico,
         t.direccion,
         t.municipio, t.departamento, t.estado, t.fecha_creacion,
         u.id AS usuario_id, u.usuario, u.rol_id, r.nombre AS rol
  FROM terceros t
  LEFT JOIN personas p ON p.id = t.persona_id
  LEFT JOIN usuarios u ON u.tercero_id = t.id
  LEFT JOIN roles r ON r.id = u.rol_id
`;

function validarTercero(datos, requiereAcceso = false) {
  const errores = [];
  if (!textoValido(datos.nombre_completo)) errores.push('nombre_completo es obligatorio.');
  if (!textoValido(datos.documento)) errores.push('documento es obligatorio.');
  if (datos.tipo_documento && !tiposDocumento.includes(datos.tipo_documento)) {
    errores.push('tipo_documento no es válido.');
  }
  if (!correoValido(datos.correo_electronico || datos.correo)) {
    errores.push('correo_electronico es obligatorio y debe ser válido.');
  }
  if (!textoValido(datos.usuario)) errores.push('usuario es obligatorio para el acceso móvil.');
  if (!idValido(datos.rol_id)) errores.push('rol_id es obligatorio.');
  if ((requiereAcceso || datos.password) && (typeof datos.password !== 'string' || datos.password.length < 8)) {
    errores.push('La contraseña debe tener al menos 8 caracteres.');
  }
  if (datos.estado && !['Activo', 'Inactivo'].includes(datos.estado)) {
    errores.push('estado debe ser Activo o Inactivo.');
  }
  return errores;
}

async function resolverRolMovil(client, rolId) {
  const { rows } = await client.query(
    'SELECT id, nombre, estado, plataformas FROM roles WHERE id = $1',
    [rolId],
  );
  const rol = rows[0];
  if (!rol || rol.estado !== 'Activo' || !rol.plataformas?.includes('Móvil') || rol.plataformas.includes('Web')) {
    return null;
  }
  return rol;
}

async function crearUsuarioTercero(client, datos, tercero, personaId) {
  const rol = await resolverRolMovil(client, idValido(datos.rol_id));
  if (!rol) {
    throw Object.assign(new Error('Selecciona un rol activo habilitado solo para Móvil.'), { status: 400 });
  }
  const duplicado = await client.query(
    `SELECT id FROM usuarios
     WHERE lower(usuario) = lower($1) OR persona_id = $2 OR tercero_id = $3`,
    [datos.usuario.trim(), personaId, tercero.id],
  );
  if (duplicado.rows[0]) {
    throw Object.assign(new Error('Ya existe una cuenta para esa persona o ese nombre de usuario.'), { status: 409 });
  }
  const { rows: columnas } = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'usuarios'`,
  );
  const tieneDocumento = columnas.some((fila) => fila.column_name === 'documento_n');
  const tienePersona = columnas.some((fila) => fila.column_name === 'persona_id');
  const campos = [
    'nombre_completo', 'usuario', 'correo_electronico', 'password_hash',
    'estado', 'verificado', 'rol_id', 'tercero_id',
  ];
  const valores = [
    tercero.nombre_completo, datos.usuario.trim(), tercero.correo_electronico,
    await bcrypt.hash(datos.password, 12), tercero.estado, true, rol.id, tercero.id,
  ];
  if (tieneDocumento) {
    campos.splice(2, 0, 'documento_n');
    valores.splice(2, 0, tercero.documento);
  }
  if (tienePersona) {
    campos.push('persona_id');
    valores.push(personaId);
  }
  const placeholders = valores.map((_, index) => `$${index + 1}`);
  const insertada = await client.query(
    `INSERT INTO usuarios (${campos.join(', ')})
     VALUES (${placeholders.join(', ')}) RETURNING id`,
    valores,
  );
  return { id: insertada.rows[0].id, rol: rol.nombre };
}

router.get('/', async (req, res, next) => {
  try {
    // Lo último registrado aparece primero en el listado.
    const { rows } = await pool.query(`${consultaTerceros} ORDER BY t.id DESC`);
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ mensaje: 'El id no es válido.' });

  try {
    const { rows } = await pool.query(`${consultaTerceros} WHERE t.id = $1`, [id]);
    if (!rows[0]) return res.status(404).json({ mensaje: 'Técnico tercero no encontrado.' });
    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  const errores = validarTercero(req.body, true);
  if (errores.length) return res.status(400).json({ mensaje: errores.join(' ') });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const personaId = await resolverPersona(client, {
      documento: req.body.documento,
      tipoDocumento: req.body.tipo_documento || req.body.tipoDocumento,
      nombre: req.body.nombre_completo,
      telefono: req.body.telefono,
      correo: req.body.correo_electronico || req.body.correo,
    });
    const { rows: terceros } = await client.query(
      `INSERT INTO terceros
         (nombre_completo, tipo_documento, documento, empresa, telefono,
          correo_electronico, direccion, municipio, departamento, estado, persona_id)
       VALUES ($1, COALESCE($2, 'Cédula'), $3, $4, $5, $6, $7, $8, $9, COALESCE($10, 'Activo'), $11)
       RETURNING id, nombre_completo, documento, correo_electronico, estado`,
      [
        req.body.nombre_completo.trim(),
        req.body.tipo_documento || req.body.tipoDocumento || null,
        req.body.documento.trim(),
        req.body.empresa?.trim() || null,
        req.body.telefono || null,
        req.body.correo_electronico || req.body.correo || null,
        req.body.direccion?.trim() || '',
        req.body.municipio?.trim() || '',
        req.body.departamento?.trim() || '',
        req.body.estado,
        personaId,
      ],
    );
    const cuenta = await crearUsuarioTercero(client, req.body, terceros[0], personaId);
    const { rows } = await client.query(`${consultaTerceros} WHERE t.id = $1`, [terceros[0].id]);
    await client.query('COMMIT');
    return res.status(201).json({ ...rows[0], usuario_id: cuenta.id, rol: cuenta.rol });
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
  const errores = validarTercero(req.body);
  if (errores.length) return res.status(400).json({ mensaje: errores.join(' ') });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // La especialidad (empresa) se conserva cuando la pantalla ya no la edita.
    const { rows: actual } = await client.query(
      'SELECT empresa, persona_id FROM terceros WHERE id = $1',
      [id],
    );
    if (!actual[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Técnico tercero no encontrado.' });
    }

    const personaId = await resolverPersona(client, {
      personaId: actual[0].persona_id,
      documento: req.body.documento,
      tipoDocumento: req.body.tipo_documento || req.body.tipoDocumento,
      nombre: req.body.nombre_completo,
      telefono: req.body.telefono,
      correo: req.body.correo_electronico || req.body.correo,
    });
    const { rows: actualizados } = await client.query(
      `UPDATE terceros
       SET nombre_completo = $1, tipo_documento = COALESCE($2, tipo_documento, 'Cédula'),
           documento = $3, empresa = COALESCE($4, empresa), telefono = $5,
           correo_electronico = $6, direccion = $7, municipio = $8,
           departamento = $9, estado = COALESCE($10, estado, 'Activo'),
           persona_id = $11
       WHERE id = $12
       RETURNING id, nombre_completo, documento, correo_electronico, estado`,
      [
        req.body.nombre_completo.trim(),
        req.body.tipo_documento || req.body.tipoDocumento || null,
        req.body.documento.trim(),
        req.body.empresa?.trim() || null,
        req.body.telefono || null,
        req.body.correo_electronico || req.body.correo || null,
        req.body.direccion?.trim() || '',
        req.body.municipio?.trim() || '',
        req.body.departamento?.trim() || '',
        req.body.estado,
        personaId,
        id,
      ],
    );
    const tercero = actualizados[0];
    const rol = await resolverRolMovil(client, idValido(req.body.rol_id));
    if (!rol) {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: 'Selecciona un rol activo habilitado solo para Móvil.' });
    }
    const cuentaActual = await client.query('SELECT id FROM usuarios WHERE tercero_id = $1 FOR UPDATE', [id]);
    if (!cuentaActual.rows[0]) {
      if (typeof req.body.password !== 'string' || req.body.password.length < 8) {
        await client.query('ROLLBACK');
        return res.status(400).json({ mensaje: 'Define una contraseña de al menos 8 caracteres para crear el acceso móvil.' });
      }
      await crearUsuarioTercero(client, req.body, tercero, personaId);
    } else {
      const { rows: duplicado } = await client.query(
        'SELECT id FROM usuarios WHERE lower(usuario) = lower($1) AND id <> $2',
        [req.body.usuario.trim(), cuentaActual.rows[0].id],
      );
      if (duplicado[0]) {
        await client.query('ROLLBACK');
        return res.status(409).json({ mensaje: 'Ese nombre de usuario ya está en uso.' });
      }
      const passwordHash = req.body.password ? await bcrypt.hash(req.body.password, 12) : null;
      const { rows: columnas } = await client.query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'usuarios'`,
      );
      const tieneDocumento = columnas.some((fila) => fila.column_name === 'documento_n');
      const tienePersona = columnas.some((fila) => fila.column_name === 'persona_id');
      const asignaciones = [
        'nombre_completo = $1',
        'usuario = $2',
        'correo_electronico = lower($3)',
        'telefono = $4',
        'password_hash = COALESCE($5, password_hash)',
        'estado = $6',
        'verificado = TRUE',
        'rol_id = $7',
        'actualizado_en = now()',
      ];
      const valores = [
        tercero.nombre_completo, req.body.usuario.trim(), tercero.correo_electronico,
        tercero.telefono, passwordHash, tercero.estado, rol.id,
      ];
      if (tieneDocumento) {
        valores.push(tercero.documento);
        asignaciones.push(`documento_n = $${valores.length}`);
      }
      if (tienePersona) {
        valores.push(personaId);
        asignaciones.push(`persona_id = $${valores.length}`);
      }
      valores.push(cuentaActual.rows[0].id);
      await client.query(
        `UPDATE usuarios SET ${asignaciones.join(', ')} WHERE id = $${valores.length}`,
        valores,
      );
    }
    const { rows } = await client.query(`${consultaTerceros} WHERE t.id = $1`, [id]);
    await client.query('COMMIT');
    return res.json(rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

router.patch('/:id/estado', async (req, res, next) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ mensaje: 'El id no es válido.' });

  const { estado } = req.body || {};
  if (!['Activo', 'Inactivo'].includes(estado)) {
    return res.status(400).json({ mensaje: 'estado debe ser Activo o Inactivo.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const actualizado = await client.query(
      'UPDATE terceros SET estado = $1 WHERE id = $2 RETURNING id',
      [estado, id],
    );
    if (!actualizado.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Técnico tercero no encontrado.' });
    }
    await client.query('UPDATE usuarios SET estado = $1 WHERE tercero_id = $2', [estado, id]);
    const { rows } = await client.query(`${consultaTerceros} WHERE t.id = $1`, [id]);
    await client.query('COMMIT');
    return res.json(rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

router.delete('/:id', async (req, res, next) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ mensaje: 'El id no es válido.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tercero = await client.query('SELECT id FROM terceros WHERE id = $1 FOR UPDATE', [id]);
    if (!tercero.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Técnico tercero no encontrado.' });
    }
    await client.query('DELETE FROM usuarios WHERE tercero_id = $1', [id]);
    await client.query('DELETE FROM terceros WHERE id = $1', [id]);
    await client.query('COMMIT');
    return res.status(204).end();
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

export default router;
