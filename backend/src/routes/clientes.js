import { Router } from 'express';
import { pool } from '../db.js';
import { correoValido, idValido, textoValido } from '../utils/validacion.js';

const router = Router();

let columnaEsDuenoDisponible = false;
let esquemaVerificado = false;

// Verifica una sola vez si la columna es_dueno ya existe en la tabla clientes
// (la agrega la migración 008) para que la API funcione antes y después de aplicarla.
async function verificarEsquema() {
  if (esquemaVerificado) return;
  try {
    const { rows } = await pool.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'clientes' AND column_name = 'es_dueno'`,
    );
    columnaEsDuenoDisponible = rows.length > 0;
  } catch {
    columnaEsDuenoDisponible = false;
  }
  esquemaVerificado = true;
}

function consultaClientesSql() {
  return `
    SELECT c.id, c.nombre_razon_social, c.documento_nit, c.tipo_cliente,
           c.tipo_documento, c.es_empleado, c.tercero_id, t.nombre_completo AS empleado_nombre,
           c.tipo_propiedad_id, tp.nombre AS tipo_propiedad, c.estado,
           ${columnaEsDuenoDisponible ? 'c.es_dueno,' : ''}
           cc.nombre AS contacto, cc.telefono, cc.correo_electronico,
           dc.direccion, dc.municipio, dc.departamento, c.fecha_registro
    FROM clientes c
    LEFT JOIN tipos_propiedad tp ON tp.id = c.tipo_propiedad_id
    LEFT JOIN terceros t ON t.id = c.tercero_id
    LEFT JOIN contactos_cliente cc ON cc.cliente_id = c.id AND cc.es_principal = TRUE
    LEFT JOIN direcciones_cliente dc ON dc.cliente_id = c.id AND dc.es_principal = TRUE
  `;
}

const TIPOS_DOCUMENTO = ['Cédula', 'Cédula de extranjería', 'NIT', 'Pasaporte'];

router.get('/catalogos/tipos-documento', async (req, res) => (
  res.json(TIPOS_DOCUMENTO.map((nombre) => ({ nombre })))
));

router.get('/catalogos/tipos-propiedad', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nombre FROM tipos_propiedad ORDER BY id',
    );
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

function validarCliente(datos) {
  const errores = [];
  if (!textoValido(datos.nombre_razon_social)) errores.push('nombre_razon_social es obligatorio.');
  if (!textoValido(datos.documento_nit)) errores.push('documento_nit es obligatorio.');
  if (!['Natural', 'Jurídico'].includes(datos.tipo_cliente)) errores.push('tipo_cliente debe ser Natural o Jurídico.');
  if (datos.tipo_documento && !TIPOS_DOCUMENTO.includes(datos.tipo_documento)) {
    errores.push(`tipo_documento debe ser uno de: ${TIPOS_DOCUMENTO.join(', ')}.`);
  }
  if (textoValido(datos.contacto) && !textoValido(datos.telefono)) {
    errores.push('telefono de la persona de contacto es obligatorio.');
  }
  if (datos.correo_electronico && !correoValido(datos.correo_electronico)) errores.push('correo_electronico no es válido.');
  return errores;
}

function normalizarDocumento(valor) {
  return String(valor || '').toLowerCase().replace(/[^0-9a-z]/g, '');
}

// Si el cliente es empleado y no se indicó un tercero, lo busca por documento
// y, si no existe, crea la ficha del tercero para evitar registros duplicados.
async function resolverTerceroEmpleado(client, datos) {
  const esEmpleado = datos.es_empleado === true || Number(datos.tercero_id) > 0;
  if (!esEmpleado) return null;
  const terceroIndicado = Number(datos.tercero_id) > 0 ? Number(datos.tercero_id) : null;
  if (terceroIndicado) return terceroIndicado;

  const documentoNormalizado = normalizarDocumento(datos.documento_nit);
  const { rows: existentes } = await client.query(
    `SELECT id FROM terceros
     WHERE regexp_replace(COALESCE(documento, ''), '[^0-9a-zA-Z]', '', 'g') = $1
     LIMIT 1`,
    [documentoNormalizado],
  );
  if (existentes[0]) return existentes[0].id;

  const { rows: creados } = await client.query(
    `INSERT INTO terceros
       (nombre_completo, documento, tipo_documento, empresa, telefono, correo_electronico,
        direccion, municipio, departamento, estado)
     VALUES ($1, $2, COALESCE($3, 'Cédula'), 'Eléctricos MCA', $4, $5, $6, $7, $8, 'Activo')
     RETURNING id`,
    [
      datos.nombre_razon_social.trim(),
      datos.documento_nit.trim(),
      datos.tipo_documento,
      datos.telefono || null,
      datos.correo_electronico || null,
      datos.direccion || null,
      datos.municipio || null,
      datos.departamento || null,
    ],
  );
  return creados[0].id;
}

router.get('/', async (req, res, next) => {
  try {
    await verificarEsquema();
    // Lo último registrado aparece primero en el listado.
    const { rows } = await pool.query(`${consultaClientesSql()} ORDER BY c.id DESC`);
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ mensaje: 'El id no es válido.' });

  try {
    await verificarEsquema();
    const { rows } = await pool.query(`${consultaClientesSql()} WHERE c.id = $1`, [id]);
    if (!rows[0]) return res.status(404).json({ mensaje: 'Cliente no encontrado.' });
    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  const errores = validarCliente(req.body);
  if (errores.length) return res.status(400).json({ mensaje: errores.join(' ') });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await verificarEsquema();
    const terceroId = await resolverTerceroEmpleado(client, req.body);
    const base = [
      req.body.nombre_razon_social.trim(),
      req.body.documento_nit.trim(),
      req.body.tipo_cliente,
      req.body.tipo_documento,
      terceroId,
      terceroId ? true : false,
      req.body.tipo_propiedad_id || null,
      req.body.estado,
    ];
    const esDueno = req.body.es_dueno === true;
    const { rows } = columnaEsDuenoDisponible
      ? await client.query(
        `INSERT INTO clientes
           (nombre_razon_social, documento_nit, tipo_cliente, tipo_documento,
            tercero_id, es_empleado, tipo_propiedad_id, estado, es_dueno)
         VALUES ($1, $2, $3, COALESCE($4, 'Cédula'), $5, COALESCE($6, FALSE), $7, COALESCE($8, 'Activo'), COALESCE($9, FALSE))
         RETURNING id`,
        [...base, esDueno],
      )
      : await client.query(
        `INSERT INTO clientes
           (nombre_razon_social, documento_nit, tipo_cliente, tipo_documento,
            tercero_id, es_empleado, tipo_propiedad_id, estado)
         VALUES ($1, $2, $3, COALESCE($4, 'Cédula'), $5, COALESCE($6, FALSE), $7, COALESCE($8, 'Activo'))
         RETURNING id`,
        base,
      );
    const clienteId = rows[0].id;

    if (req.body.contacto) {
      await client.query(
        `INSERT INTO contactos_cliente
           (cliente_id, nombre, telefono, correo_electronico, es_principal)
         VALUES ($1, $2, $3, $4, TRUE)`,
        [clienteId, req.body.contacto.trim(), req.body.telefono || null, req.body.correo_electronico || null],
      );
    }
    if (req.body.direccion && req.body.municipio && req.body.departamento) {
      await client.query(
        `INSERT INTO direcciones_cliente
           (cliente_id, direccion, municipio, departamento, es_principal)
         VALUES ($1, $2, $3, $4, TRUE)`,
        [clienteId, req.body.direccion.trim(), req.body.municipio.trim(), req.body.departamento.trim()],
      );
    }

    const nuevoCliente = await client.query(`${consultaClientesSql()} WHERE c.id = $1`, [clienteId]);
    await client.query('COMMIT');
    return res.status(201).json(nuevoCliente.rows[0]);
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
  const errores = validarCliente(req.body);
  if (errores.length) return res.status(400).json({ mensaje: errores.join(' ') });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await verificarEsquema();
    const terceroId = await resolverTerceroEmpleado(client, req.body);
    const base = [
      req.body.nombre_razon_social.trim(),
      req.body.documento_nit.trim(),
      req.body.tipo_cliente,
      req.body.tipo_documento,
      terceroId,
      terceroId ? true : false,
      req.body.tipo_propiedad_id || null,
      req.body.estado,
    ];
    const esDueno = req.body.es_dueno === true;
    const actualizacion = columnaEsDuenoDisponible
      ? await client.query(
        `UPDATE clientes
         SET nombre_razon_social = $1, documento_nit = $2, tipo_cliente = $3,
             tipo_documento = COALESCE($4, tipo_documento, 'Cédula'),
             tercero_id = $5, es_empleado = COALESCE($6, FALSE),
             tipo_propiedad_id = $7, estado = COALESCE($8, 'Activo'),
             es_dueno = COALESCE($9, FALSE)
         WHERE id = $10`,
        [...base, esDueno, id],
      )
      : await client.query(
        `UPDATE clientes
         SET nombre_razon_social = $1, documento_nit = $2, tipo_cliente = $3,
             tipo_documento = COALESCE($4, tipo_documento, 'Cédula'),
             tercero_id = $5, es_empleado = COALESCE($6, FALSE),
             tipo_propiedad_id = $7, estado = COALESCE($8, 'Activo')
         WHERE id = $9`,
        [...base, id],
      );
    if (!actualizacion.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Cliente no encontrado.' });
    }

    if (req.body.contacto) {
      await client.query('DELETE FROM contactos_cliente WHERE cliente_id = $1 AND es_principal = TRUE', [id]);
      await client.query(
        `INSERT INTO contactos_cliente
           (cliente_id, nombre, telefono, correo_electronico, es_principal)
         VALUES ($1, $2, $3, $4, TRUE)`,
        [id, req.body.contacto.trim(), req.body.telefono || null, req.body.correo_electronico || null],
      );
    } else {
      await client.query('DELETE FROM contactos_cliente WHERE cliente_id = $1 AND es_principal = TRUE', [id]);
    }
    if (req.body.direccion && req.body.municipio && req.body.departamento) {
      await client.query('DELETE FROM direcciones_cliente WHERE cliente_id = $1 AND es_principal = TRUE', [id]);
      await client.query(
        `INSERT INTO direcciones_cliente
           (cliente_id, direccion, municipio, departamento, es_principal)
         VALUES ($1, $2, $3, $4, TRUE)`,
        [id, req.body.direccion.trim(), req.body.municipio.trim(), req.body.departamento.trim()],
      );
    } else {
      await client.query('DELETE FROM direcciones_cliente WHERE cliente_id = $1 AND es_principal = TRUE', [id]);
    }

    const clienteActualizado = await client.query(`${consultaClientesSql()} WHERE c.id = $1`, [id]);
    await client.query('COMMIT');
    return res.json(clienteActualizado.rows[0]);
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

  try {
    const resultado = await pool.query('DELETE FROM clientes WHERE id = $1', [id]);
    if (!resultado.rowCount) return res.status(404).json({ mensaje: 'Cliente no encontrado.' });
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

export default router;
