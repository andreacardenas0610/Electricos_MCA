import { Router } from 'express';
import { pool } from '../db.js';
import { textoValido } from '../utils/validacion.js';

const router = Router();
const monedas = ['COP', 'COP / H', 'USD', 'USD / H'];
const estados = ['Activo', 'Pausado', 'Inactivo'];

const consultaServicio = `
  SELECT s.id, s.codigo, s.nombre, s.descripcion AS desc, s.unidad,
         s.precio_numerico AS "precioNumerico", s.moneda, s.categoria, s.estado,
         s.horas, s.categoria_id AS "categoriaId",
         s.creado_en AS "creadoEn", s.actualizado_en AS "actualizadoEn",
         COALESCE((
           SELECT json_agg(json_build_object(
             'codigo', m.codigo,
             'nombre', m.nombre,
             'cantidad', vm.cantidad,
             'unidad', m.unidad,
             'precioUnitario', m.precio_unitario,
             'stock', m.stock,
             'estado', m.estado
           ) ORDER BY vm.id)
           FROM servicios_materiales vm
           JOIN materiales m ON m.codigo = vm.material_codigo
           WHERE vm.servicio_id = s.id
         ), '[]'::json) AS materiales
  FROM servicios s
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
  if (datos.estado && !estados.includes(datos.estado)) {
    errores.push(`estado debe ser uno de: ${estados.join(', ')}.`);
  }
  if (datos.horas !== undefined && (!Number.isFinite(Number(datos.horas)) || Number(datos.horas) <= 0)) {
    errores.push('horas debe ser un número mayor que cero.');
  }
  return errores;
}

function horasServicio(datos) {
  if (Number(datos.horas) > 0) return Number(datos.horas);
  return datos.moneda === 'USD / H' ? 4 : 8;
}

async function resolverCategoria(client, datos) {
  const nombre = textoValido(datos.categoria) ? datos.categoria.trim() : 'Instalación';

  if (Number(datos.categoriaId) > 0) {
    const { rows } = await client.query(
      'SELECT nombre FROM categorias_servicio WHERE id = $1',
      [Number(datos.categoriaId)],
    );
    if (rows[0]) return { nombre: rows[0].nombre, id: Number(datos.categoriaId) };
  }

  await client.query(
    `INSERT INTO categorias_servicio (nombre)
     SELECT $1
     WHERE NOT EXISTS (SELECT 1 FROM categorias_servicio WHERE lower(nombre) = lower($1))`,
    [nombre],
  );
  const { rows } = await client.query(
    'SELECT id FROM categorias_servicio WHERE lower(nombre) = lower($1)',
    [nombre],
  );
  return { nombre, id: rows[0]?.id ?? null };
}

async function guardarMaterialesServicio(client, servicioId, lista) {
  if (!Array.isArray(lista)) return;
  await client.query('DELETE FROM servicios_materiales WHERE servicio_id = $1', [servicioId]);

  const vistos = new Set();
  for (const item of lista) {
    const codigo = String(item?.codigo ?? item?.id ?? '').trim();
    if (!codigo || vistos.has(codigo)) continue;
    vistos.add(codigo);
    await client.query(
      `INSERT INTO servicios_materiales (servicio_id, material_codigo, cantidad, obligatorio)
       VALUES ($1, $2, $3, $4)`,
      [
        servicioId,
        codigo,
        Number(item.cantidad) > 0 ? Number(item.cantidad) : 1,
        item.obligatorio === false ? false : true,
      ],
    );
  }
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

router.get('/categorias', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, estado,
              (SELECT COUNT(*)::int FROM servicios s WHERE lower(s.categoria) = lower(c.nombre)) AS "serviciosCount"
       FROM categorias_servicio c
       ORDER BY nombre`,
    );
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

router.post('/categorias', async (req, res, next) => {
  const { nombre, estado } = req.body || {};
  if (!textoValido(nombre)) return res.status(400).json({ mensaje: 'nombre es obligatorio.' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO categorias_servicio (nombre, estado)
       VALUES ($1, COALESCE($2, 'Activo'))
       ON CONFLICT DO NOTHING
       RETURNING id, nombre, estado`,
      [nombre.trim(), estado],
    );
    if (!rows[0]) {
      const existente = await pool.query(
        'SELECT id, nombre, estado FROM categorias_servicio WHERE lower(nombre) = lower($1)',
        [nombre.trim()],
      );
      return res.status(409).json(existente.rows[0] ?? { mensaje: 'La categoría ya existe.' });
    }
    return res.status(201).json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.patch('/categorias/:id/estado', async (req, res, next) => {
  const { estado } = req.body || {};
  if (!['Activo', 'Inactivo'].includes(estado)) {
    return res.status(400).json({ mensaje: 'estado debe ser Activo o Inactivo.' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE categorias_servicio SET estado = $1
       WHERE id = $2 RETURNING id, nombre, estado`,
      [estado, req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ mensaje: 'Categoría no encontrada.' });
    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    // Lo último registrado aparece primero en el catálogo.
    const { rows } = await pool.query(`${consultaServicio} ORDER BY id DESC`);
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`${consultaServicio} WHERE s.id = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ mensaje: 'Servicio no encontrado.' });
    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.get('/:id/materiales', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`${consultaServicio} WHERE s.id = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ mensaje: 'Servicio no encontrado.' });
    return res.json(rows[0].materiales);
  } catch (error) {
    return next(error);
  }
});

router.put('/:id/materiales', async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT id FROM servicios WHERE id = $1', [req.params.id]);
    if (!rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Servicio no encontrado.' });
    }

    await guardarMaterialesServicio(client, rows[0].id, req.body?.materiales ?? req.body);
    const servicio = await client.query(`${consultaServicio} WHERE s.id = $1`, [rows[0].id]);
    await client.query('COMMIT');
    return res.json(servicio.rows[0].materiales);
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

router.post('/', async (req, res, next) => {
  const datos = req.body || {};
  const errores = validar(datos);
  if (errores.length) return res.status(400).json({ mensaje: errores.join(' ') });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const categoria = await resolverCategoria(client, datos);
    const codigo = await generarCodigo(client);
    const { rows } = await client.query(
      `INSERT INTO servicios
         (codigo, nombre, descripcion, unidad, precio_numerico, moneda, categoria, categoria_id, estado, horas)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        codigo,
        datos.nombre.trim(),
        datos.desc || '',
        datos.unidad || 'Servicio',
        Number(datos.precioNumerico),
        datos.moneda || 'COP',
        categoria.nombre,
        categoria.id,
        datos.estado || 'Activo',
        horasServicio(datos),
      ],
    );
    await guardarMaterialesServicio(client, rows[0].id, datos.materiales);
    const servicio = await client.query(`${consultaServicio} WHERE s.id = $1`, [rows[0].id]);
    await client.query('COMMIT');
    return res.status(201).json(servicio.rows[0]);
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

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const categoria = await resolverCategoria(client, datos);
    const { rows } = await client.query(
      `UPDATE servicios
       SET nombre = $1, descripcion = $2, unidad = $3, precio_numerico = $4,
           moneda = $5, categoria = $6, categoria_id = $7, estado = $8, horas = $9,
           actualizado_en = now()
       WHERE id = $10
       RETURNING id`,
      [
        datos.nombre.trim(),
        datos.desc || '',
        datos.unidad || 'Servicio',
        Number(datos.precioNumerico),
        datos.moneda || 'COP',
        categoria.nombre,
        categoria.id,
        datos.estado || 'Activo',
        horasServicio(datos),
        req.params.id,
      ],
    );
    if (!rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Servicio no encontrado.' });
    }
    await guardarMaterialesServicio(client, rows[0].id, datos.materiales);
    const servicio = await client.query(`${consultaServicio} WHERE s.id = $1`, [rows[0].id]);
    await client.query('COMMIT');
    return res.json(servicio.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

router.patch('/:id/estado', async (req, res, next) => {
  const { estado } = req.body || {};
  if (!estados.includes(estado)) {
    return res.status(400).json({ mensaje: `estado debe ser uno de: ${estados.join(', ')}.` });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE servicios SET estado = $1, actualizado_en = now()
       WHERE id = $2`,
      [estado, req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ mensaje: 'Servicio no encontrado.' });
    const servicio = await pool.query(`${consultaServicio} WHERE s.id = $1`, [req.params.id]);
    return res.json(servicio.rows[0]);
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
