import { Router } from 'express';
import { pool } from '../db.js';
import { idValido, textoValido } from '../utils/validacion.js';

const router = Router();
const estadosValidos = ['Aprobado', 'Pendiente', 'Rechazado'];

function dinero(valor) {
  return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}

function validar(datos) {
  const errores = [];
  if (!textoValido(datos.proyecto)) errores.push('proyecto es obligatorio.');
  if (!Array.isArray(datos.items) || datos.items.length === 0) {
    errores.push('Agrega al menos un ítem a la cotización.');
  } else {
    datos.items.forEach((item, indice) => {
      if (!textoValido(item.descripcion)) errores.push(`El ítem ${indice + 1} requiere descripción.`);
      if (!Number.isFinite(Number(item.cantidad)) || Number(item.cantidad) <= 0) {
        errores.push(`La cantidad del ítem ${indice + 1} debe ser mayor que cero.`);
      }
      if (!Number.isFinite(Number(item.precioUnit)) || Number(item.precioUnit) < 0) {
        errores.push(`El precio del ítem ${indice + 1} no puede ser negativo.`);
      }
      if (item.tipo && !['servicio', 'material', 'item'].includes(item.tipo)) {
        errores.push(`El tipo del ítem ${indice + 1} no es válido.`);
      }
    });
  }
  for (const campo of ['ivaPorcentaje', 'descuento']) {
    if (datos[campo] != null && (!Number.isFinite(Number(datos[campo]))
      || Number(datos[campo]) < 0 || Number(datos[campo]) > 100)) {
      errores.push(`${campo} debe estar entre 0 y 100.`);
    }
  }
  if (datos.diasVigencia != null
    && (!Number.isInteger(Number(datos.diasVigencia)) || Number(datos.diasVigencia) < 1)) {
    errores.push('diasVigencia debe ser un entero mayor que cero.');
  }
  return errores;
}

function calcularTotales(items, descuento, iva) {
  const subtotal = dinero(items.reduce(
    (suma, item) => suma + Number(item.cantidad) * Number(item.precioUnit),
    0,
  ));
  const montoDescuento = dinero(subtotal * (Number(descuento) / 100));
  const montoImpuesto = dinero((subtotal - montoDescuento) * (Number(iva) / 100));
  return {
    subtotal,
    montoDescuento,
    montoImpuesto,
    total: dinero(subtotal - montoDescuento + montoImpuesto),
  };
}

function normalizarItem(row) {
  return {
    id: String(row.id),
    tipo: row.tipo,
    refId: row.referencia_id,
    descripcion: row.descripcion,
    cantidad: Number(row.cantidad),
    precioUnit: Number(row.precio_unitario),
    unidad: row.unidad,
    monedaServicio: row.moneda_servicio,
    orden: row.orden,
  };
}

function normalizarCotizacion(row, items = []) {
  return {
    id: row.codigo,
    codigo: row.codigo,
    clienteId: row.cliente_id == null ? '' : String(row.cliente_id),
    cliente: row.cliente_nombre,
    documento: row.documento,
    contacto: row.contacto,
    telefono: row.telefono,
    correo: row.correo,
    direccion: row.direccion,
    proyecto: row.proyecto,
    fecha: row.fecha_emision,
    fechaEmision: row.fecha_emision,
    diasVigencia: Number(row.dias_vigencia),
    ivaPorcentaje: Number(row.iva_porcentaje),
    descuento: Number(row.descuento),
    estadoCotizacion: row.estado,
    notas: row.notas,
    subtotal: Number(row.subtotal),
    montoDescuento: Number(row.monto_descuento),
    montoImpuesto: Number(row.monto_impuesto),
    total: Number(row.total),
    subtotalMateriales: Number(row.subtotal),
    subtotalBruto: Number(row.subtotal),
    totalNeto: Number(row.total),
    items: items.map(normalizarItem),
  };
}

async function consultarItems(client, codigos) {
  if (!codigos.length) return new Map();
  const { rows } = await client.query(
    `SELECT id, cotizacion_codigo, tipo, referencia_id, descripcion,
            cantidad, precio_unitario, unidad, moneda_servicio, orden
     FROM cotizacion_items
     WHERE cotizacion_codigo = ANY($1::varchar[])
     ORDER BY orden, id`,
    [codigos],
  );
  return rows.reduce((mapa, item) => {
    const lista = mapa.get(item.cotizacion_codigo) || [];
    lista.push(item);
    mapa.set(item.cotizacion_codigo, lista);
    return mapa;
  }, new Map());
}

async function obtenerCotizacion(client, codigo) {
  const { rows } = await client.query('SELECT * FROM cotizaciones WHERE codigo = $1', [codigo]);
  if (!rows[0]) return null;
  const items = await consultarItems(client, [codigo]);
  return normalizarCotizacion(rows[0], items.get(codigo) || []);
}

async function generarCodigo(client) {
  const anio = new Date().getFullYear();
  await client.query("SELECT pg_advisory_xact_lock(hashtext('cotizaciones-codigo'))");
  const { rows } = await client.query(
    `SELECT codigo FROM cotizaciones WHERE codigo LIKE $1`,
    [`COT-${anio}-%`],
  );
  const ultimo = rows.reduce((mayor, row) => {
    const coincidencia = row.codigo.match(new RegExp(`^COT-${anio}-(\\d+)$`));
    return coincidencia ? Math.max(mayor, Number(coincidencia[1])) : mayor;
  }, 0);
  return `COT-${anio}-${String(ultimo + 1).padStart(4, '0')}`;
}

async function guardarItems(client, codigo, items) {
  for (const [indice, item] of items.entries()) {
    await client.query(
      `INSERT INTO cotizacion_items
         (cotizacion_codigo, tipo, referencia_id, descripcion, cantidad,
          precio_unitario, unidad, moneda_servicio, orden)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        codigo,
        item.tipo || 'item',
        item.refId == null ? null : String(item.refId),
        item.descripcion.trim(),
        Number(item.cantidad),
        Number(item.precioUnit),
        item.unidad || 'Unidad',
        item.monedaServicio || null,
        indice,
      ],
    );
  }
}

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM cotizaciones ORDER BY fecha_emision DESC, codigo DESC');
    const items = await consultarItems(pool, rows.map((row) => row.codigo));
    return res.json(rows.map((row) => normalizarCotizacion(row, items.get(row.codigo) || [])));
  } catch (error) {
    return next(error);
  }
});

router.get('/:codigo', async (req, res, next) => {
  try {
    const cotizacion = await obtenerCotizacion(pool, req.params.codigo);
    if (!cotizacion) return res.status(404).json({ mensaje: 'Cotización no encontrada.' });
    return res.json(cotizacion);
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  const datos = req.body || {};
  const errores = validar(datos);
  const clienteId = datos.clienteId ? idValido(datos.clienteId) : null;
  if (datos.clienteId && !clienteId) errores.push('clienteId no es válido.');
  if (errores.length) return res.status(400).json({ mensaje: errores.join(' ') });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const codigo = await generarCodigo(client);
    let snapshot = {
      cliente_nombre: datos.cliente || 'Cliente sin nombre',
      documento: datos.documento || '',
      contacto: datos.contacto || '',
      telefono: datos.telefono || '',
      correo: datos.correo || '',
      direccion: datos.direccion || '',
    };
    if (clienteId) {
      const { rows } = await client.query(
        `SELECT c.nombre_razon_social, c.documento_nit,
                cc.nombre AS contacto, cc.telefono, cc.correo_electronico,
                dc.direccion
         FROM clientes c
         LEFT JOIN contactos_cliente cc ON cc.cliente_id = c.id AND cc.es_principal = TRUE
         LEFT JOIN direcciones_cliente dc ON dc.cliente_id = c.id AND dc.es_principal = TRUE
         WHERE c.id = $1`,
        [clienteId],
      );
      if (!rows[0]) {
        await client.query('ROLLBACK');
        return res.status(400).json({ mensaje: 'El cliente seleccionado no existe.' });
      }
      snapshot = {
        cliente_nombre: rows[0].nombre_razon_social,
        documento: rows[0].documento_nit || '',
        contacto: rows[0].contacto || '',
        telefono: rows[0].telefono || '',
        correo: rows[0].correo_electronico || '',
        direccion: rows[0].direccion || '',
      };
    }
    const descuento = Math.min(100, Math.max(0, Number(datos.descuento) || 0));
    const iva = Math.min(100, Math.max(0, Number(datos.ivaPorcentaje ?? 16)));
    const totales = calcularTotales(datos.items, descuento, iva);
    await client.query(
      `INSERT INTO cotizaciones
         (codigo, cliente_id, cliente_nombre, documento, contacto, telefono,
          correo, direccion, proyecto, fecha_emision, dias_vigencia,
          iva_porcentaje, descuento, estado, notas, subtotal, monto_descuento,
          monto_impuesto, total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10::date, CURRENT_DATE),
               $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
      [
        codigo, clienteId, snapshot.cliente_nombre, snapshot.documento, snapshot.contacto,
        snapshot.telefono, snapshot.correo, snapshot.direccion, datos.proyecto.trim(),
        datos.fechaEmision || datos.fecha || null, Number(datos.diasVigencia) || 30,
        iva, descuento, estadosValidos.includes(datos.estadoCotizacion) ? datos.estadoCotizacion : 'Pendiente',
        datos.notas || '', totales.subtotal, totales.montoDescuento, totales.montoImpuesto, totales.total,
      ],
    );
    await guardarItems(client, codigo, datos.items);
    const cotizacion = await obtenerCotizacion(client, codigo);
    await client.query('COMMIT');
    return res.status(201).json(cotizacion);
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

router.put('/:codigo', async (req, res, next) => {
  const datos = req.body || {};
  const errores = validar(datos);
  const clienteId = datos.clienteId ? idValido(datos.clienteId) : null;
  if (datos.clienteId && !clienteId) errores.push('clienteId no es válido.');
  if (errores.length) return res.status(400).json({ mensaje: errores.join(' ') });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const actual = await client.query('SELECT codigo FROM cotizaciones WHERE codigo = $1 FOR UPDATE', [req.params.codigo]);
    if (!actual.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Cotización no encontrada.' });
    }
    let snapshot = {
      cliente_nombre: datos.cliente || 'Cliente sin nombre',
      documento: datos.documento || '',
      contacto: datos.contacto || '',
      telefono: datos.telefono || '',
      correo: datos.correo || '',
      direccion: datos.direccion || '',
    };
    if (clienteId) {
      const { rows } = await client.query(
        `SELECT c.nombre_razon_social, c.documento_nit,
                cc.nombre AS contacto, cc.telefono, cc.correo_electronico,
                dc.direccion
         FROM clientes c
         LEFT JOIN contactos_cliente cc ON cc.cliente_id = c.id AND cc.es_principal = TRUE
         LEFT JOIN direcciones_cliente dc ON dc.cliente_id = c.id AND dc.es_principal = TRUE
         WHERE c.id = $1`,
        [clienteId],
      );
      if (!rows[0]) {
        await client.query('ROLLBACK');
        return res.status(400).json({ mensaje: 'El cliente seleccionado no existe.' });
      }
      snapshot = {
        cliente_nombre: rows[0].nombre_razon_social,
        documento: rows[0].documento_nit || '',
        contacto: rows[0].contacto || '',
        telefono: rows[0].telefono || '',
        correo: rows[0].correo_electronico || '',
        direccion: rows[0].direccion || '',
      };
    }
    const descuento = Math.min(100, Math.max(0, Number(datos.descuento) || 0));
    const iva = Math.min(100, Math.max(0, Number(datos.ivaPorcentaje ?? 16)));
    const totales = calcularTotales(datos.items, descuento, iva);
    const { rowCount } = await client.query(
      `UPDATE cotizaciones
       SET cliente_id = $1, cliente_nombre = $2, documento = $3, contacto = $4,
           telefono = $5, correo = $6, direccion = $7, proyecto = $8,
           fecha_emision = COALESCE($9::date, fecha_emision), dias_vigencia = $10,
           iva_porcentaje = $11, descuento = $12, notas = $13,
           subtotal = $14, monto_descuento = $15, monto_impuesto = $16,
           total = $17, actualizado_en = now()
       WHERE codigo = $18`,
      [
        clienteId, snapshot.cliente_nombre, snapshot.documento, snapshot.contacto,
        snapshot.telefono, snapshot.correo, snapshot.direccion, datos.proyecto.trim(),
        datos.fechaEmision || datos.fecha || null, Number(datos.diasVigencia) || 30,
        iva, descuento, datos.notas || '', totales.subtotal, totales.montoDescuento,
        totales.montoImpuesto, totales.total, req.params.codigo,
      ],
    );
    await client.query('DELETE FROM cotizacion_items WHERE cotizacion_codigo = $1', [req.params.codigo]);
    await guardarItems(client, req.params.codigo, datos.items);
    const cotizacion = await obtenerCotizacion(client, req.params.codigo);
    if (!rowCount || !cotizacion) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Cotización no encontrada.' });
    }
    await client.query('COMMIT');
    return res.json(cotizacion);
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

router.patch('/:codigo/estado', async (req, res, next) => {
  const { estadoCotizacion } = req.body || {};
  if (!estadosValidos.includes(estadoCotizacion)) {
    return res.status(400).json({ mensaje: 'estadoCotizacion no es válido.' });
  }

  try {
    const resultado = await pool.query(
      'UPDATE cotizaciones SET estado = $1, actualizado_en = now() WHERE codigo = $2',
      [estadoCotizacion, req.params.codigo],
    );
    if (!resultado.rowCount) return res.status(404).json({ mensaje: 'Cotización no encontrada.' });
    return res.json(await obtenerCotizacion(pool, req.params.codigo));
  } catch (error) {
    return next(error);
  }
});

router.delete('/:codigo', async (req, res, next) => {
  try {
    const resultado = await pool.query('DELETE FROM cotizaciones WHERE codigo = $1', [req.params.codigo]);
    if (!resultado.rowCount) return res.status(404).json({ mensaje: 'Cotización no encontrada.' });
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

export default router;
