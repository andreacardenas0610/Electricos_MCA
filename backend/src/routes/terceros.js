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
  -- La cuenta móvil puede estar vinculada por tercero_id o, en datos antiguos,
  -- solo por persona_id: ambas formas cuentan como la cuenta de este tercero.
  LEFT JOIN usuarios u ON u.tercero_id = t.id
    OR (t.persona_id IS NOT NULL AND u.persona_id = t.persona_id)
  LEFT JOIN roles r ON r.id = u.rol_id
`;

function validarTercero(datos) {
  const errores = [];
  if (!textoValido(datos.nombre_completo)) errores.push('nombre_completo es obligatorio.');
  if (!textoValido(datos.documento)) errores.push('documento es obligatorio.');
  if (datos.tipo_documento && !tiposDocumento.includes(datos.tipo_documento)) {
    errores.push('tipo_documento no es válido.');
  }
  if (!correoValido(datos.correo_electronico || datos.correo)) {
    errores.push('correo_electronico es obligatorio y debe ser válido.');
  }
  if (textoValido(datos.usuario) && !/^[a-zA-Z0-9._-]{3,40}$/.test(datos.usuario.trim())) {
    errores.push('El usuario móvil debe tener entre 3 y 40 caracteres (letras, números, punto, guion o guion bajo).');
  }
  if (datos.password != null && datos.password !== '' && (typeof datos.password !== 'string' || datos.password.length < 8)) {
    errores.push('La contraseña debe tener al menos 8 caracteres.');
  }
  if (datos.estado && !['Activo', 'Inactivo'].includes(datos.estado)) {
    errores.push('estado debe ser Activo o Inactivo.');
  }
  return errores;
}

// Convierte un nombre en credencial: sin tildes, minúsculas y sin símbolos.
function normalizarCredencial(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

// tec_ + inicial del nombre + primer apellido.
// "Sandra Milena Quintero" → tec_squintero · "Juan José Giraldo" → tec_jgiraldo.
function usuarioSugeridoTecnico(nombreCompleto) {
  const palabras = String(nombreCompleto || '').trim().split(/\s+/).filter(Boolean);
  if (!palabras.length) return '';
  const inicial = normalizarCredencial(palabras[0]).charAt(0);
  const apellido = normalizarCredencial(
    palabras.length >= 4 ? palabras[2] : (palabras[1] || palabras[0]),
  ).slice(0, 20);
  return `tec_${inicial}${apellido}`;
}

async function usuarioDisponible(client, base, excluirId = null) {
  const limpio = String(base || '').trim() || 'tec_tecnico';
  let candidato = limpio;
  let consecutivo = 2;
  while (true) {
    const { rowCount } = await client.query(
      `SELECT 1 FROM usuarios
       WHERE lower(usuario) = lower($1)${excluirId ? ' AND id <> $2' : ''}
       LIMIT 1`,
      excluirId ? [candidato, excluirId] : [candidato],
    );
    if (!rowCount) return candidato;
    candidato = `${limpio}${consecutivo}`;
    consecutivo += 1;
  }
}

// Primera contraseña segura y fácil de dictar: el número de documento.
function passwordInicialTecnico(documento) {
  const digitos = String(documento || '').replace(/\D/g, '');
  return digitos.length >= 8 ? digitos : 'Tecnica2026';
}

async function rolMovilPorDefecto(client) {
  const { rows } = await client.query(
    `SELECT id FROM roles
     WHERE lower(nombre) = lower('Técnico') AND estado = 'Activo'
       AND 'Móvil' = ANY(plataformas)
     LIMIT 1`,
  );
  return rows[0]?.id || null;
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

async function crearUsuarioTercero(client, datos, tercero, personaId, credenciales = {}) {
  const rolId = idValido(datos.rol_id) || await rolMovilPorDefecto(client);
  const rol = await resolverRolMovil(client, rolId);
  if (!rol) {
    throw Object.assign(new Error('Selecciona un rol activo habilitado solo para Móvil.'), { status: 400 });
  }
  const usuario = String(credenciales.usuario || datos.usuario || '').trim();
  const password = credenciales.password || datos.password;
  if (!usuario) {
    throw Object.assign(new Error('No se pudo generar el usuario móvil.'), { status: 400 });
  }
  if (typeof password !== 'string' || password.length < 8) {
    throw Object.assign(new Error('La contraseña debe tener al menos 8 caracteres.'), { status: 400 });
  }
  const duplicado = await client.query(
    `SELECT id FROM usuarios
     WHERE lower(usuario) = lower($1) OR persona_id = $2 OR tercero_id = $3
        OR lower(correo_electronico) = lower($4)`,
    [usuario, personaId, tercero.id, tercero.correo_electronico],
  );
  if (duplicado.rows[0]) {
    throw Object.assign(
      new Error('Ya existe una cuenta para esa persona, ese correo o ese nombre de usuario.'),
      { status: 409 },
    );
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
    tercero.nombre_completo, usuario, tercero.correo_electronico,
    await bcrypt.hash(password, 12), tercero.estado, true, rol.id, tercero.id,
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
  const errores = validarTercero(req.body);
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
    const tercero = terceros[0];

    // Cuenta móvil automática: si el administrador no escribe usuario/contraseña,
    // se generan (tec_ + inicial + apellido y el documento como clave inicial).
    const usuarioEscrito = textoValido(req.body.usuario) ? req.body.usuario.trim() : '';
    const usuarioBase = usuarioEscrito || usuarioSugeridoTecnico(req.body.nombre_completo);
    const usuario = await usuarioDisponible(client, usuarioBase);
    if (usuarioEscrito && usuario !== usuarioBase) {
      await client.query('ROLLBACK');
      return res.status(409).json({ mensaje: 'Ese nombre de usuario ya está en uso.' });
    }
    const passwordEscrito = typeof req.body.password === 'string' && req.body.password ? req.body.password : '';
    const password = passwordEscrito || passwordInicialTecnico(req.body.documento);
    const cuenta = await crearUsuarioTercero(client, req.body, tercero, personaId, { usuario, password });
    const { rows } = await client.query(`${consultaTerceros} WHERE t.id = $1`, [terceros[0].id]);
    await client.query('COMMIT');
    return res.status(201).json({
      ...rows[0],
      usuario_id: cuenta.id,
      rol: cuenta.rol,
      usuario_acceso: usuario,
      usuario_generado: !usuarioEscrito,
      password_inicial: passwordEscrito ? null : password,
    });
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
       RETURNING id, nombre_completo, documento, telefono, correo_electronico, estado`,
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
    const rol = await resolverRolMovil(
      client,
      idValido(req.body.rol_id) || await rolMovilPorDefecto(client),
    );
    if (!rol) {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: 'Selecciona un rol activo habilitado solo para Móvil.' });
    }

    const usuarioEscrito = textoValido(req.body.usuario) ? req.body.usuario.trim() : '';
    const passwordEscrito = typeof req.body.password === 'string' && req.body.password ? req.body.password : '';
    // La cuenta puede existir sin tercero_id (solo con persona_id o el mismo
    // correo): se busca así para vincularla en lugar de duplicarla.
    const cuentaActual = await client.query(
      `SELECT id, usuario, tercero_id FROM usuarios
       WHERE tercero_id = $1
          OR ($2::bigint IS NOT NULL AND persona_id = $2::bigint)
          OR lower(correo_electronico) = lower($3)
       ORDER BY (tercero_id = $1) DESC
       LIMIT 1
       FOR UPDATE`,
      [id, personaId, tercero.correo_electronico],
    );

    let usuarioAcceso = usuarioEscrito;
    let passwordInicial = null;

    if (!cuentaActual.rows[0]) {
      // Tercero antiguo sin cuenta móvil: se crea sola con usuario y clave generados.
      const usuarioBase = usuarioEscrito || usuarioSugeridoTecnico(req.body.nombre_completo);
      usuarioAcceso = await usuarioDisponible(client, usuarioBase);
      if (usuarioEscrito && usuarioAcceso !== usuarioBase) {
        await client.query('ROLLBACK');
        return res.status(409).json({ mensaje: 'Ese nombre de usuario ya está en uso.' });
      }
      const password = passwordEscrito || passwordInicialTecnico(req.body.documento);
      if (!passwordEscrito) passwordInicial = password;
      await crearUsuarioTercero(client, req.body, tercero, personaId, { usuario: usuarioAcceso, password });
    } else {
      usuarioAcceso = usuarioEscrito || cuentaActual.rows[0].usuario;
      if (usuarioEscrito) {
        const { rows: duplicado } = await client.query(
          'SELECT id FROM usuarios WHERE lower(usuario) = lower($1) AND id <> $2',
          [usuarioEscrito, cuentaActual.rows[0].id],
        );
        if (duplicado[0]) {
          await client.query('ROLLBACK');
          return res.status(409).json({ mensaje: 'Ese nombre de usuario ya está en uso.' });
        }
      }
      const passwordHash = passwordEscrito ? await bcrypt.hash(passwordEscrito, 12) : null;
      // Si la cuenta ya existe con un rol que entra a la Web (administrador o
      // staff), se conserva: editar el tercero no debe quitarle ese acceso.
      const { rows: rolActual } = await client.query(
        `SELECT r.id, r.estado, r.plataformas
         FROM usuarios u JOIN roles r ON r.id = u.rol_id
         WHERE u.id = $1`,
        [cuentaActual.rows[0].id],
      );
      const conservaRol = rolActual[0]?.estado === 'Activo'
        && rolActual[0].plataformas?.includes('Web');
      const rolCuenta = conservaRol ? rolActual[0].id : rol.id;
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
        tercero.nombre_completo, usuarioAcceso, tercero.correo_electronico,
        tercero.telefono, passwordHash, tercero.estado, rolCuenta,
      ];
      if (tieneDocumento) {
        valores.push(tercero.documento);
        asignaciones.push(`documento_n = $${valores.length}`);
      }
      if (tienePersona) {
        valores.push(personaId);
        asignaciones.push(`persona_id = $${valores.length}`);
      }
      // Si la cuenta venía vinculada solo por persona_id o correo, queda atada
      // a este tercero para que aparezca como su cuenta en el listado.
      valores.push(id);
      asignaciones.push(`tercero_id = COALESCE(tercero_id, $${valores.length})`);
      valores.push(cuentaActual.rows[0].id);
      await client.query(
        `UPDATE usuarios SET ${asignaciones.join(', ')} WHERE id = $${valores.length}`,
        valores,
      );
    }
    const { rows } = await client.query(`${consultaTerceros} WHERE t.id = $1`, [id]);
    await client.query('COMMIT');
    return res.json({
      ...rows[0],
      usuario_acceso: usuarioAcceso,
      password_inicial: passwordInicial,
    });
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
