import { Router } from 'express';
import { pool } from '../db.js';
import { textoValido } from '../utils/validacion.js';

const router = Router();
const monedas = ['COP', 'COP / H', 'USD', 'USD / H'];

const columnasServicio = `
  id, codigo, nombre, descripcion AS desc, unidad, precio_numerico AS "precioNumerico",
  moneda, categoria, estado, horas, creado_en AS "creadoEn",
  actualizado_en AS "actualizadoEn"
`;

function validar(datos) {
  const errores = [];
  if (!textoValido(datos.nombre)) errores.push('nombre es obligatorio.');
  if (!Number.isFinite(Number(datos.precioNumerico)) || Number(datos.precioNumerico) < 0) {
    errores.push('precioNumerico debe ser un número mayor o igual a cero.');
  }
  if (datos.moneda && !monedas.includes(datos.moneda)) {
    errores.push('moneda no es válida.');
  }
  if (datos.estado && !['Activo', 'Pausado'].includes(datos.estado)) {
    errores.push('estado debe ser Activo o Pausado.');
  }
  return errores;
}

function horasServicio(datos) {
  if (Number(datos.horas) > 0) return Number(datos.horas);
  return datos.moneda === 'USD / H' ? 4 : 8;
}

async function generarCodigo(client) {
  await client.query("SELECT pg_advisory_xact_lock(hashtext('servicios-codigo'))");
  const { rows } = await client.query(
    `SELECT codigo FROM servicios
     WHERE codigo ~ '^ELEC-[0-9]+$'`,
  );
  const ultimo = rows.reduce((mayor, servicio) => (
    Math.max(mayor, Number(servicio.codigo.slice(5)) || 0)
  ), 0);
  return `ELEC-${String(ultimo + 1).padStart(3, '0')}`;
}

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT ${columnasServicio} FROM servicios ORDER BY id`);
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT ${columnasServicio} FROM servicios WHERE id = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ mensaje: 'Servicio no encontrado.' });
    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  const datos = req.body || {};
  const errores = validar(datos);
  if (errores.length) return res.status(400).json({ mensaje: errores.join(' ') });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const codigo = await generarCodigo(client);
    const { rows } = await client.query(
      `INSERT INTO servicios
         (codigo, nombre, descripcion, unidad, precio_numerico, moneda, categoria, estado, horas)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING ${columnasServicio}`,
      [
        codigo,
        datos.nombre.trim(),
        datos.desc || '',
        datos.unidad || 'Servicio',
        Number(datos.precioNumerico),
        datos.moneda || 'COP',
        datos.categoria || 'Instalación',
        datos.estado || 'Activo',
        horasServicio(datos),
      ],
    );
    await client.query('COMMIT');
    return res.status(201).json(rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res, next) => {
  const datos = req.body || {};
  const errores = validar(datos);
  if (errores.length) return res.status(400).json({ mensaje: errores.join(' ') });

  try {
    const { rows } = await pool.query(
      `UPDATE servicios
       SET nombre = $1, descripcion = $2, unidad = $3, precio_numerico = $4,
           moneda = $5, categoria = $6, estado = $7, horas = $8,
           actualizado_en = now()
       WHERE id = $9
       RETURNING ${columnasServicio}`,
      [
        datos.nombre.trim(),
        datos.desc || '',
        datos.unidad || 'Servicio',
        Number(datos.precioNumerico),
        datos.moneda || 'COP',
        datos.categoria || 'Instalación',
        datos.estado || 'Activo',
        horasServicio(datos),
        req.params.id,
      ],
    );
    if (!rows[0]) return res.status(404).json({ mensaje: 'Servicio no encontrado.' });
    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id/estado', async (req, res, next) => {
  const { estado } = req.body || {};
  if (!['Activo', 'Pausado'].includes(estado)) {
    return res.status(400).json({ mensaje: 'estado debe ser Activo o Pausado.' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE servicios SET estado = $1, actualizado_en = now()
       WHERE id = $2 RETURNING ${columnasServicio}`,
      [estado, req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ mensaje: 'Servicio no encontrado.' });
    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const resultado = await pool.query('DELETE FROM servicios WHERE id = $1', [req.params.id]);
    if (!resultado.rowCount) return res.status(404).json({ mensaje: 'Servicio no encontrado.' });
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

export default router;
