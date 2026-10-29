import { Router } from 'express';
import { pool } from '../db.js';
import { correoValido, idValido, textoValido } from '../utils/validacion.js';

const router = Router();

const consultaClientes = `
  SELECT c.id, c.nombre_razon_social, c.documento_nit, c.tipo_cliente,
         c.tipo_documento, c.es_empleado, c.tercero_id, t.nombre_completo AS empleado_nombre,
         c.tipo_propiedad_id, tp.nombre AS tipo_propiedad, c.estado,
         cc.nombre AS contacto, cc.telefono, cc.correo_electronico,
         dc.direccion, dc.municipio, dc.departamento, c.fecha_registro
  FROM clientes c
  LEFT JOIN tipos_propiedad tp ON tp.id = c.tipo_propiedad_id
  LEFT JOIN terceros t ON t.id = c.tercero_id
  LEFT JOIN contactos_cliente cc ON cc.cliente_id = c.id AND cc.es_principal = TRUE
  LEFT JOIN direcciones_cliente dc ON dc.cliente_id = c.id AND dc.es_principal = TRUE
`;

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

router.get('/', async (req, res, next) => {
  try {
    // Lo último registrado aparece primero en el listado.
    const { rows } = await pool.query(`${consultaClientes} ORDER BY c.id DESC`);
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ mensaje: 'El id no es válido.' });

  try {
    const { rows } = await pool.query(`${consultaClientes} WHERE c.id = $1`, [id]);
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
    const { rows } = await client.query(
      `INSERT INTO clientes
         (nombre_razon_social, documento_nit, tipo_cliente, tipo_documento,
          tercero_id, es_empleado, tipo_propiedad_id, estado)
       VALUES ($1, $2, $3, COALESCE($4, 'Cédula'), $5, COALESCE($6, FALSE), $7, COALESCE($8, 'Activo'))
       RETURNING id`,
      [
        req.body.nombre_razon_social.trim(),
        req.body.documento_nit.trim(),
        req.body.tipo_cliente,
        req.body.tipo_documento,
        Number(req.body.tercero_id) > 0 ? Number(req.body.tercero_id) : null,
        req.body.es_empleado === true || Number(req.body.tercero_id) > 0 ? true : false,
        req.body.tipo_propiedad_id || null,
        req.body.estado,
      ],
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

    const nuevoCliente = await client.query(`${consultaClientes} WHERE c.id = $1`, [clienteId]);
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
    const actualizacion = await client.query(
      `UPDATE clientes
       SET nombre_razon_social = $1, documento_nit = $2, tipo_cliente = $3,
           tipo_documento = COALESCE($4, tipo_documento, 'Cédula'),
           tercero_id = $5, es_empleado = COALESCE($6, FALSE),
           tipo_propiedad_id = $7, estado = COALESCE($8, 'Activo')
       WHERE id = $9`,
      [
        req.body.nombre_razon_social.trim(),
        req.body.documento_nit.trim(),
        req.body.tipo_cliente,
        req.body.tipo_documento,
        Number(req.body.tercero_id) > 0 ? Number(req.body.tercero_id) : null,
        req.body.es_empleado === true || Number(req.body.tercero_id) > 0 ? true : false,
        req.body.tipo_propiedad_id || null,
        req.body.estado,
        id,
      ],
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

    const clienteActualizado = await client.query(`${consultaClientes} WHERE c.id = $1`, [id]);
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
