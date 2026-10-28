import { Router } from 'express';
import { pool } from '../db.js';
import { fechaValida, textoValido } from '../utils/validacion.js';

const router = Router();
const metodos = [
  'Efectivo',
  'Transferencia',
  'Tarjeta Débito',
  'Tarjeta Crédito',
  'Nequi',
  'Daviplata',
  'PSE',
];

// El primer abono debe cubrir como mínimo el 30% del valor de la cotización.
const ABONO_MINIMO_PORCENTAJE = 30;

function redondear(valor) {
  return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}

function hoy() {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
}

// Si el formulario no envía hora, el abono se quema con la hora en que llega el dinero.
function ahoraHora() {
  const ahora = new Date();
  return `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
}

function estadoPago(total, abonado) {
  if (Number(total) <= 0 || Number(abonado) <= 0) return 'PENDIENTE';
  return Number(abonado) >= Number(total) ? 'LIQUIDADO' : 'ABONO PARCIAL';
}

function normalizarPago(row) {
  return {
    id: row.codigo,
    codigo: row.codigo,
    cotizacionId: row.cotizacion_referencia,
    monto: Number(row.monto),
    fecha: row.fecha,
    hora: String(row.hora).slice(0, 5),
    metodo: row.metodo,
    referencia: row.referencia || '',
    nota: row.nota || '',
    cotizacion: {
      id: row.cotizacion_referencia,
      cliente: row.cliente_nombre,
      proyecto: row.proyecto,
      documento: row.documento,
      montoTotal: Number(row.monto_total),
    },
  };
}

function validarPago(datos, crear = false) {
  const errores = [];
  if (crear && !textoValido(datos.cotizacionId)) errores.push('cotizacionId es obligatorio.');
  if (!Number.isFinite(Number(datos.monto)) || Number(datos.monto) <= 0) {
    errores.push('monto debe ser mayor que cero.');
  }
  if (datos.metodo && !metodos.includes(datos.metodo)) errores.push('metodo no es válido.');
  if (datos.fecha && !fechaValida(datos.fecha)) errores.push('fecha debe tener formato AAAA-MM-DD.');
  if (fechaValida(datos.fecha) && datos.fecha > hoy()) {
    errores.push('la fecha del abono no puede ser futura, debe ser hoy o anterior.');
  }
  if (datos.hora && !/^([01]\d|2[0-3]):[0-5]\d$/.test(datos.hora)) {
    errores.push('hora debe tener formato HH:MM.');
  }
  return errores;
}

async function obtenerPago(client, codigo) {
  const { rows } = await client.query(
    `SELECT p.codigo, p.cotizacion_referencia, p.monto, p.fecha, p.hora,
            p.metodo, p.referencia, p.nota, p.cliente_nombre, p.documento,
            p.proyecto, p.monto_total
     FROM pagos p WHERE p.codigo = $1`,
    [codigo],
  );
  return rows[0] ? normalizarPago(rows[0]) : null;
}

async function crearCodigo(client, id) {
  const codigo = `PAG-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`;
  await client.query('UPDATE pagos SET codigo = $1 WHERE id = $2', [codigo, id]);
  return codigo;
}

router.get('/cuentas', async (req, res, next) => {
  try {
    const [cotizaciones, pagos] = await Promise.all([
      pool.query(
        `SELECT c.codigo, c.cliente_id, c.cliente_nombre, c.documento,
                c.proyecto, c.fecha_emision, c.total, c.estado,
                COALESCE(SUM(p.monto), 0) AS abonado, COUNT(p.id)::int AS cantidad_pagos
         FROM cotizaciones c
         LEFT JOIN pagos p ON p.cotizacion_codigo = c.codigo
         GROUP BY c.codigo
         HAVING c.estado <> 'Rechazado' OR COUNT(p.id) > 0
         ORDER BY c.fecha_emision DESC, c.codigo DESC`,
      ),
      pool.query(
        `SELECT p.codigo, p.cotizacion_referencia, p.cliente_nombre, p.documento,
                p.proyecto, p.monto_total, p.monto, p.fecha, p.hora,
                p.metodo, p.referencia, p.nota
         FROM pagos p
         WHERE p.cotizacion_codigo IS NULL
         ORDER BY p.fecha DESC, p.hora DESC, p.id DESC`,
      ),
    ]);
    const cotizacionPagos = await pool.query(
      `SELECT p.codigo, p.cotizacion_referencia, p.cliente_nombre, p.documento,
              p.proyecto, p.monto_total, p.monto, p.fecha, p.hora,
              p.metodo, p.referencia, p.nota
       FROM pagos p
       WHERE p.cotizacion_codigo IS NOT NULL
       ORDER BY p.fecha DESC, p.hora DESC, p.id DESC`,
    );
    const pagosPorCotizacion = new Map();
    [...cotizacionPagos.rows, ...pagos.rows].forEach((row) => {
      const lista = pagosPorCotizacion.get(row.cotizacion_referencia) || [];
      lista.push(normalizarPago(row));
      pagosPorCotizacion.set(row.cotizacion_referencia, lista);
    });
    const cuentas = cotizaciones.rows.map((row) => {
      const movimientos = pagosPorCotizacion.get(row.codigo) || [];
      const abonado = redondear(row.abonado);
      const total = redondear(row.total);
      return {
        clave: `COT:${row.codigo}`,
        cotizacionId: row.codigo,
        idPago: movimientos[0]?.id || '',
        cliente: row.cliente_nombre,
        clienteId: row.cliente_id == null ? '' : String(row.cliente_id),
        documento: row.documento,
        proyecto: row.proyecto,
        fecha: row.fecha_emision,
        montoTotal: total,
        abonado,
        saldo: Math.max(0, redondear(total - abonado)),
        estado: estadoPago(total, abonado),
        pagos: movimientos,
        ultimoPago: movimientos[0] || null,
        eliminada: false,
        esHistorica: false,
        cotizacionEstado: row.estado,
      };
    });
    const cotizacionesVigentes = new Set(cotizaciones.rows.map((row) => row.codigo));
    const historicas = [...pagosPorCotizacion.entries()]
      .filter(([codigo]) => !cotizacionesVigentes.has(codigo))
      .map(([codigo, movimientos]) => {
        const referencia = movimientos[0].cotizacion;
        const total = redondear(referencia.montoTotal);
        const abonado = redondear(movimientos.reduce((suma, pago) => suma + pago.monto, 0));
        return {
          clave: `HIS:${codigo}`,
          cotizacionId: codigo,
          idPago: movimientos[0].id,
          cliente: referencia.cliente,
          clienteId: '',
          documento: referencia.documento,
          proyecto: referencia.proyecto,
          fecha: movimientos[0].fecha,
          montoTotal: total,
          abonado,
          saldo: Math.max(0, redondear(total - abonado)),
          estado: estadoPago(total, abonado),
          pagos: movimientos,
          ultimoPago: movimientos[0],
          eliminada: true,
          esHistorica: true,
          cotizacionEstado: 'Eliminada',
        };
      });

    return res.json([...cuentas, ...historicas].sort((a, b) => (
      `${b.ultimoPago?.fecha || b.fecha} ${b.ultimoPago?.hora || ''}`
        .localeCompare(`${a.ultimoPago?.fecha || a.fecha} ${a.ultimoPago?.hora || ''}`)
    )));
  } catch (error) {
    return next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT codigo, cotizacion_referencia, monto, fecha, hora, metodo,
              referencia, nota, cliente_nombre, documento, proyecto, monto_total
       FROM pagos ORDER BY fecha DESC, hora DESC, id DESC`,
    );
    return res.json(rows.map(normalizarPago));
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  const datos = req.body || {};
  const errores = validarPago(datos, true);
  if (errores.length) return res.status(400).json({ mensaje: errores.join(' ') });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: cotizaciones } = await client.query(
      'SELECT * FROM cotizaciones WHERE codigo = $1 FOR UPDATE',
      [datos.cotizacionId],
    );
    const cotizacion = cotizaciones[0];
    if (!cotizacion) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Cotización no encontrada.' });
    }
    // El abono se recibe antes de aprobar la cotización, por eso Pendiente también paga.
    if (cotizacion.estado === 'Rechazado') {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: 'La cotización está rechazada y no admite abonos.' });
    }
    const { rows: sumaRows } = await client.query(
      'SELECT COALESCE(SUM(monto), 0) AS abonado FROM pagos WHERE cotizacion_codigo = $1',
      [cotizacion.codigo],
    );
    const monto = redondear(datos.monto);
    const abonadoPrevio = redondear(sumaRows[0].abonado);
    const saldo = redondear(Number(cotizacion.total) - abonadoPrevio);
    if (monto > saldo) {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: `El abono supera el saldo pendiente (${saldo}).` });
    }
    if (abonadoPrevio <= 0) {
      const minimo = redondear(Number(cotizacion.total) * (ABONO_MINIMO_PORCENTAJE / 100));
      if (monto < minimo - 0.01) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          mensaje: `El abono inicial debe ser mínimo ${minimo} (${ABONO_MINIMO_PORCENTAJE}% del total).`,
          minimo,
        });
      }
    }
    const { rows } = await client.query(
      `INSERT INTO pagos
         (cotizacion_codigo, cotizacion_referencia, cliente_nombre, documento,
          proyecto, monto_total, monto, fecha, hora, metodo, referencia, nota)
       VALUES ($1, $1, $2, $3, $4, $5, $6, COALESCE($7::date, CURRENT_DATE),
               COALESCE($8::time, $12::time), $9, $10, $11)
       RETURNING id`,
      [
        cotizacion.codigo, cotizacion.cliente_nombre, cotizacion.documento,
        cotizacion.proyecto, cotizacion.total, monto, datos.fecha || null,
        datos.hora || ahoraHora(), datos.metodo || 'Efectivo',
        datos.referencia || '', datos.nota || '', ahoraHora(),
      ],
    );
    const codigo = await crearCodigo(client, rows[0].id);
    const pago = await obtenerPago(client, codigo);
    await client.query('COMMIT');
    return res.status(201).json(pago);
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

router.put('/:codigo', async (req, res, next) => {
  const datos = req.body || {};
  const errores = validarPago(datos);
  if (errores.length) return res.status(400).json({ mensaje: errores.join(' ') });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: pagosExistentes } = await client.query(
      'SELECT * FROM pagos WHERE codigo = $1 FOR UPDATE',
      [req.params.codigo],
    );
    const pagoExistente = pagosExistentes[0];
    if (!pagoExistente) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Abono no encontrado.' });
    }
    if (pagoExistente.cotizacion_codigo) {
      await client.query('SELECT codigo FROM cotizaciones WHERE codigo = $1 FOR UPDATE', [pagoExistente.cotizacion_codigo]);
    }
    const { rows: sumaRows } = await client.query(
      `SELECT COALESCE(SUM(monto), 0) AS otros
       FROM pagos
       WHERE cotizacion_referencia = $1 AND id <> $2`,
      [pagoExistente.cotizacion_referencia, pagoExistente.id],
    );
    const nuevoMonto = redondear(datos.monto);
    if (Number(pagoExistente.monto_total) > 0
      && nuevoMonto + Number(sumaRows[0].otros) > Number(pagoExistente.monto_total)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: 'La suma de abonos supera el monto total de la cotización.' });
    }
    await client.query(
      `UPDATE pagos
       SET monto = $1, fecha = COALESCE($2::date, fecha),
           hora = COALESCE($3::time, hora), metodo = COALESCE($4, metodo),
           referencia = COALESCE($5, referencia), nota = COALESCE($6, nota)
       WHERE id = $7`,
      [
        nuevoMonto, datos.fecha || null, datos.hora || null, datos.metodo || null,
        datos.referencia ?? null, datos.nota ?? null, pagoExistente.id,
      ],
    );
    const actualizado = await obtenerPago(client, req.params.codigo);
    await client.query('COMMIT');
    return res.json(actualizado);
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

router.delete('/:codigo', async (req, res, next) => {
  try {
    const resultado = await pool.query('DELETE FROM pagos WHERE codigo = $1', [req.params.codigo]);
    if (!resultado.rowCount) return res.status(404).json({ mensaje: 'Abono no encontrado.' });
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

export default router;
