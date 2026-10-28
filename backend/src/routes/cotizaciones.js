import { Router } from 'express';
import { pool } from '../db.js';
import { idValido, textoValido } from '../utils/validacion.js';

const router = Router();
const estadosValidos = ['Aprobado', 'Pendiente', 'Rechazado'];

// La cotización no se aprueba hasta recibir como mínimo este porcentaje del total.
const ABONO_MINIMO_PORCENTAJE = 30;

function dinero(valor) {
  return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}

function validar(datos) {
  const errores = [];
  if (!textoValido(datos.proyecto)) errores.push('proyecto es obligatorio.');
  if (!Array.isArray(datos.items) || datos.items.length === 0) {
    errores.push('Agrega al menos un ítem a la cotización.');
  } else {
    const materialesVistos = new Set();
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
      if (item.tipo === 'material' && item.refId != null) {
        const clave = String(item.refId);
        if (materialesVistos.has(clave)) {
          errores.push(`El material ${clave} está repetido en la cotización.`);
        }
        materialesVistos.add(clave);
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

// Revisa inventario antes de guardar: materiales activos, precio congelado y stock suficiente.
async function validarInventario(client, items, opciones = {}) {
  const { exigirPrecio = true, considerarStock = true } = opciones;
  const materiales = (items || []).filter((item) => item.tipo === 'material' && item.refId != null);
  if (!materiales.length) return { errores: [], advertencias: [] };

  const codigos = [...new Set(materiales.map((item) => String(item.refId)))];
  const { rows } = await client.query(
    `SELECT codigo, nombre, stock, precio_unitario, unidad,
            COALESCE(estado, 'Activo') AS estado,
            COALESCE(stock_minimo, 10) AS stock_minimo
     FROM materiales WHERE codigo = ANY($1::varchar[])`,
    [codigos],
  );
  const catalogo = rows.reduce((mapa, row) => mapa.set(row.codigo, row), new Map());
  const errores = [];
  const advertencias = [];
  const demandados = new Map();

  for (const item of materiales) {
    const codigo = String(item.refId);
    const material = catalogo.get(codigo);
    if (!material) {
      errores.push(`El material ${codigo} ya no existe en el inventario.`);
      continue;
    }
    if (material.estado === 'Inactivo') {
      errores.push(`${material.nombre} (${codigo}) está inactivo y no se puede cotizar.`);
      continue;
    }
    if (exigirPrecio && Math.abs(Number(item.precioUnit) - Number(material.precio_unitario)) > 0.01) {
      errores.push(`El valor unitario de ${material.nombre} no se puede editar (${codigo}).`);
    }

    const demandada = Number(demandados.get(codigo) || 0) + Number(item.cantidad);
    demandados.set(codigo, demandada);

    if (!considerarStock) continue;

    if (demandada > Number(material.stock)) {
      errores.push(
        `${material.nombre}: solicitas ${demandada} ${material.unidad} y solo hay ${material.stock} disponibles.`,
      );
    } else if (demandada > Number(material.stock_minimo)
      || Number(material.stock) - demandada <= Number(material.stock_minimo)) {
      advertencias.push(
        `${material.nombre} queda con ${Number(material.stock) - demandada} ${material.unidad} después de esta cotización.`,
      );
    }
  }

  return { errores, advertencias: [...new Set(advertencias)] };
}

async function descontarStock(client, items) {
  for (const item of items) {
    if (item.tipo !== 'material' || item.refId == null) continue;
    const { rows } = await client.query(
      `UPDATE materiales
       SET stock = GREATEST(0, stock - $2), actualizado_en = now()
       WHERE codigo = $1::varchar AND estado IS DISTINCT FROM 'Inactivo'
       RETURNING stock`,
      [String(item.refId), Number(item.cantidad)],
    );
    if (!rows[0]) {
      throw Object.assign(
        new Error(`El material ${item.refId} no está disponible en inventario.`),
        { statusCode: 400 },
      );
    }
  }
}

async function devolverStock(client, items) {
  for (const item of items) {
    if (item.tipo !== 'material' || item.refId == null) continue;
    await client.query(
      'UPDATE materiales SET stock = stock + $2, actualizado_en = now() WHERE codigo = $1::varchar',
      [String(item.refId), Number(item.cantidad)],
    );
  }
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
    fechaLlegada: row.creado_en,
    diasVigencia: Number(row.dias_vigencia),
    ivaPorcentaje: Number(row.iva_porcentaje),
    descuento: Number(row.descuento),
    estadoCotizacion: row.estado,
    notas: row.notas,
    terminos: row.terminos ?? '',
    garantias: row.garantias ?? '',
    aprobadoEn: row.aprobado_en ?? null,
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
    const clienteId = req.query.cliente ? idValido(req.query.cliente) : null;
    if (req.query.cliente && !clienteId) return res.status(400).json({ mensaje: 'cliente no es válido.' });

    // Listado por orden de llegada, agrupando Pendiente → Aprobado → Rechazado.
    const { rows } = await pool.query(
      `SELECT * FROM cotizaciones
       ${clienteId ? 'WHERE cliente_id = $1' : ''}
       ORDER BY CASE estado WHEN 'Pendiente' THEN 0 WHEN 'Aprobado' THEN 1 ELSE 2 END,
                creado_en ASC, codigo ASC`,
      clienteId ? [clienteId] : [],
    );
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

    const inventario = await validarInventario(client, datos.items);
    if (inventario.errores.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        mensaje: inventario.errores.join(' '),
        errores: inventario.errores,
        advertencias: inventario.advertencias,
      });
    }

    // La fecha de emisión siempre es la del día en que se registra la cotización.
    await client.query(
      `INSERT INTO cotizaciones
         (codigo, cliente_id, cliente_nombre, documento, contacto, telefono,
          correo, direccion, proyecto, fecha_emision, dias_vigencia,
          iva_porcentaje, descuento, estado, notas, terminos, garantias,
          subtotal, monto_descuento, monto_impuesto, total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE,
               $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
      [
        codigo, clienteId, snapshot.cliente_nombre, snapshot.documento, snapshot.contacto,
        snapshot.telefono, snapshot.correo, snapshot.direccion, datos.proyecto.trim(),
        Number(datos.diasVigencia) || 30,
        iva, descuento, estadosValidos.includes(datos.estadoCotizacion) ? datos.estadoCotizacion : 'Pendiente',
        datos.notas || '', datos.terminos || '', datos.garantias || '',
        totales.subtotal, totales.montoDescuento, totales.montoImpuesto, totales.total,
      ],
    );
    await guardarItems(client, codigo, datos.items);
    const cotizacion = await obtenerCotizacion(client, codigo);
    await client.query('COMMIT');
    return res.status(201).json({ ...cotizacion, advertencias: inventario.advertencias });
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
    const actual = await client.query(
      'SELECT codigo, stock_descontado FROM cotizaciones WHERE codigo = $1 FOR UPDATE',
      [req.params.codigo],
    );
    if (!actual.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Cotización no encontrada.' });
    }
    const descontadoPrevio = actual.rows[0].stock_descontado === true;
    const detallePrevio = await consultarItems(client, [req.params.codigo]);
    const itemsPrevios = (detallePrevio.get(req.params.codigo) || []).map((item) => ({
      tipo: item.tipo,
      refId: item.referencia_id,
      cantidad: item.cantidad,
    }));
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

    // Si el stock ya estaba descontado por la aprobación, se devuelve antes de volver a validar.
    if (descontadoPrevio) await devolverStock(client, itemsPrevios);

    const inventario = await validarInventario(client, datos.items);
    if (inventario.errores.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        mensaje: inventario.errores.join(' '),
        errores: inventario.errores,
        advertencias: inventario.advertencias,
      });
    }
    const { rowCount } = await client.query(
      `UPDATE cotizaciones
       SET cliente_id = $1, cliente_nombre = $2, documento = $3, contacto = $4,
           telefono = $5, correo = $6, direccion = $7, proyecto = $8,
           dias_vigencia = $9, iva_porcentaje = $10, descuento = $11, notas = $12,
           terminos = $13, garantias = $14,
           subtotal = $15, monto_descuento = $16, monto_impuesto = $17,
           total = $18, actualizado_en = now()
       WHERE codigo = $19`,
      [
        clienteId, snapshot.cliente_nombre, snapshot.documento, snapshot.contacto,
        snapshot.telefono, snapshot.correo, snapshot.direccion, datos.proyecto.trim(),
        Number(datos.diasVigencia) || 30,
        iva, descuento, datos.notas || '', datos.terminos || '', datos.garantias || '',
        totales.subtotal, totales.montoDescuento, totales.montoImpuesto, totales.total,
        req.params.codigo,
      ],
    );
    await client.query('DELETE FROM cotizacion_items WHERE cotizacion_codigo = $1', [req.params.codigo]);
    await guardarItems(client, req.params.codigo, datos.items);
    if (descontadoPrevio) await descontarStock(client, datos.items);
    const cotizacion = await obtenerCotizacion(client, req.params.codigo);
    if (!rowCount || !cotizacion) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Cotización no encontrada.' });
    }
    await client.query('COMMIT');
    return res.json({ ...cotizacion, advertencias: inventario.advertencias });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

async function abonadoDe(client, codigo) {
  const { rows } = await client.query(
    'SELECT COALESCE(SUM(monto), 0) AS abonado FROM pagos WHERE cotizacion_codigo = $1',
    [codigo],
  );
  return Number(rows[0].abonado);
}

router.patch('/:codigo/estado', async (req, res, next) => {
  const { estadoCotizacion } = req.body || {};
  if (!estadosValidos.includes(estadoCotizacion)) {
    return res.status(400).json({ mensaje: 'estadoCotizacion no es válido.' });
  }

  const client = await pool.connect();
  let advertencias = [];

  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT * FROM cotizaciones WHERE codigo = $1 FOR UPDATE', [req.params.codigo]);
    const cotizacion = rows[0];
    if (!cotizacion) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Cotización no encontrada.' });
    }

    const detalle = await consultarItems(client, [cotizacion.codigo]);
    const items = detalle.get(cotizacion.codigo) || [];

    if (estadoCotizacion === 'Aprobado') {
      // Primero se recibe el abono (mínimo del 30%) y solo después se aprueba.
      const abonado = await abonadoDe(client, cotizacion.codigo);
      const minimo = dinero(Number(cotizacion.total) * (ABONO_MINIMO_PORCENTAJE / 100));
      if (abonado < minimo - 0.01) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          mensaje: `Registra un abono mínimo de ${dinero(minimo)} (${ABONO_MINIMO_PORCENTAJE}% del total) antes de aprobar. Abono actual: ${dinero(abonado)}.`,
          minimo,
          abonado,
        });
      }

      const inventario = await validarInventario(client, items.map((item) => ({
        tipo: item.tipo,
        refId: item.referencia_id,
        cantidad: item.cantidad,
        precioUnit: item.precio_unitario,
      })), { exigirPrecio: false, considerarStock: !cotizacion.stock_descontado });
      if (inventario.errores.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          mensaje: inventario.errores.join(' '),
          errores: inventario.errores,
          advertencias: inventario.advertencias,
        });
      }

      if (!cotizacion.stock_descontado) {
        await descontarStock(client, items.map((item) => ({
          tipo: item.tipo,
          refId: item.referencia_id,
          cantidad: item.cantidad,
        })));
      }
      advertencias = inventario.advertencias;
    } else if (cotizacion.estado === 'Aprobado' && cotizacion.stock_descontado) {
      await devolverStock(client, items.map((item) => ({
        tipo: item.tipo,
        refId: item.referencia_id,
        cantidad: item.cantidad,
      })));
    }

    const { rowCount } = await client.query(
      `UPDATE cotizaciones
       SET estado = $1,
           stock_descontado = $2,
           aprobado_en = CASE WHEN $1 = 'Aprobado' THEN COALESCE(aprobado_en, now()) ELSE NULL END,
           actualizado_en = now()
       WHERE codigo = $3`,
      [
        estadoCotizacion,
        estadoCotizacion === 'Aprobado',
        req.params.codigo,
      ],
    );
    if (!rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Cotización no encontrada.' });
    }

    const actualizada = await obtenerCotizacion(client, req.params.codigo);
    await client.query('COMMIT');
    return res.json({ ...actualizada, advertencias });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.statusCode) return res.status(error.statusCode).json({ mensaje: error.message });
    return next(error);
  } finally {
    client.release();
  }
});

function construirCorreoCotizacion(cotizacion) {
  const filas = cotizacion.items.map((item, indice) => (
    `${indice + 1}. ${item.descripcion} · ${item.cantidad} ${item.unidad || 'Unidad'} x `
    + `${dinero(item.precioUnit)} = ${dinero(item.cantidad * item.precioUnit)}`
  )).join('\n');

  const texto = [
    `Cotización ${cotizacion.id} · ${cotizacion.proyecto}`,
    `Fecha de emisión: ${cotizacion.fechaEmision}`,
    `Cliente: ${cotizacion.cliente}${cotizacion.documento ? ` (${cotizacion.documento})` : ''}`,
    '',
    'Ítems:',
    filas,
    '',
    `Subtotal: ${dinero(cotizacion.subtotal)}`,
    `Descuento (${cotizacion.descuento}%): ${dinero(cotizacion.montoDescuento)}`,
    `IVA (${cotizacion.ivaPorcentaje}%): ${dinero(cotizacion.montoImpuesto)}`,
    `TOTAL: ${dinero(cotizacion.total)} COP`,
    '',
    'Términos y condiciones:',
    cotizacion.terminos || 'Sin términos adicionales.',
    '',
    'Garantía:',
    cotizacion.garantias || 'Según garantía legal de la instalación.',
  ].join('\n');

  return {
    subject: `Cotización ${cotizacion.id} · ${cotizacion.proyecto}`,
    text: texto,
  };
}

router.post('/:codigo/enviar-correo', async (req, res, next) => {
  try {
    const cotizacion = await obtenerCotizacion(pool, req.params.codigo);
    if (!cotizacion) return res.status(404).json({ mensaje: 'Cotización no encontrada.' });

    const destinatario = (req.body?.correo || cotizacion.correo || '').trim();
    if (!destinatario) {
      return res.status(400).json({ mensaje: 'La cotización no tiene correo del contacto. Capture el correo de la persona de contacto.' });
    }

    const { subject, text } = construirCorreoCotizacion(cotizacion);
    const asunto = encodeURIComponent(subject);
    const cuerpo = encodeURIComponent(text);

    // Si el servidor tiene SMTP configurado (SMTP_HOST/USER/PASS) intenta enviar;
    // si no, devuelve el enlace mailto para que el navegador abra el cliente de correo.
    if (process.env.SMTP_HOST) {
      try {
        const mailModule = await import('nodemailer');
        const mailer = mailModule.default ?? mailModule;
        const transporte = mailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: String(process.env.SMTP_SECURE || 'false') === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        await transporte.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: destinatario,
          subject,
          text,
        });
        return res.json({ enviado: true, correo: destinatario, asunto });
      } catch (error) {
        return res.status(502).json({
          enviado: false,
          correo: destinatario,
          asunto,
          mensaje: `No se pudo enviar el correo (${error.message}). Usa el enlace de correo del navegador.`,
          mailto: `mailto:${destinatario}?subject=${asunto}&body=${cuerpo}`,
        });
      }
    }

    return res.json({
      enviado: false,
      pendiente: true,
      correo: destinatario,
      asunto,
      mailto: `mailto:${destinatario}?subject=${asunto}&body=${cuerpo}`,
      mensaje: 'Configure SMTP en el backend para el envío automático, o envía desde el cliente de correo.',
    });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:codigo', async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'SELECT codigo, estado, stock_descontado FROM cotizaciones WHERE codigo = $1 FOR UPDATE',
      [req.params.codigo],
    );
    if (!rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Cotización no encontrada.' });
    }

    if (rows[0].stock_descontado) {
      const detalle = await consultarItems(client, [rows[0].codigo]);
      await devolverStock(client, (detalle.get(rows[0].codigo) || []).map((item) => ({
        tipo: item.tipo,
        refId: item.referencia_id,
        cantidad: item.cantidad,
      })));
    }

    await client.query('DELETE FROM cotizaciones WHERE codigo = $1', [req.params.codigo]);
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
