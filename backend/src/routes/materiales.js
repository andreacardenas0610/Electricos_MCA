import { Router } from 'express';
import { pool } from '../db.js';
import { textoValido } from '../utils/validacion.js';

const router = Router();

function prefijoDesdeNombre(nombre) {
  const iniciales = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((palabra) => palabra[0])
    .join('')
    .toUpperCase()
    .slice(0, 8);
  return iniciales || 'MAT';
}

function estadoStock(stock) {
  if (Number(stock) <= 0) return 'Crítico';
  if (Number(stock) <= 10) return 'Bajo Stock';
  return 'Óptimo';
}

const columnasMaterial = `
  m.codigo AS id, m.codigo, m.nombre, c.nombre AS categoria,
  m.stock, m.unidad, m.precio_unitario AS "precioUnitario",
  m.creado_en AS "creadoEn", m.actualizado_en AS "actualizadoEn"
`;

router.get('/categorias', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nombre, unidad, prefijo FROM categorias_materiales ORDER BY nombre',
    );
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

router.post('/categorias', async (req, res, next) => {
  const { nombre, unidad, prefijo } = req.body || {};
  if (!textoValido(nombre)) return res.status(400).json({ mensaje: 'nombre es obligatorio.' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO categorias_materiales (nombre, unidad, prefijo)
       VALUES ($1, $2, $3)
       RETURNING id, nombre, unidad, prefijo`,
      [
        nombre.trim(),
        textoValido(unidad) ? unidad.trim() : 'Unidad',
        textoValido(prefijo) ? prefijo.trim().toUpperCase() : prefijoDesdeNombre(nombre),
      ],
    );
    return res.status(201).json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${columnasMaterial}
       FROM materiales m
       JOIN categorias_materiales c ON c.id = m.categoria_id
       ORDER BY m.nombre`,
    );
    return res.json(rows.map((material) => ({
      ...material,
      estado: estadoStock(material.stock),
    })));
  } catch (error) {
    return next(error);
  }
});

function validarMaterial(datos) {
  const errores = [];
  if (!textoValido(datos.nombre)) errores.push('nombre es obligatorio.');
  if (!textoValido(datos.categoria)) errores.push('categoria es obligatoria.');
  if (!Number.isFinite(Number(datos.stock)) || Number(datos.stock) < 0) {
    errores.push('stock debe ser un número mayor o igual a cero.');
  }
  if (!Number.isFinite(Number(datos.precioUnitario)) || Number(datos.precioUnitario) < 0) {
    errores.push('precioUnitario debe ser un número mayor o igual a cero.');
  }
  return errores;
}

async function buscarCategoria(client, nombre) {
  const { rows } = await client.query(
    'SELECT id FROM categorias_materiales WHERE lower(nombre) = lower($1)',
    [nombre.trim()],
  );
  return rows[0]?.id;
}

async function crearCodigo(client, categoriaNombre) {
  const { rows: categoriaRows } = await client.query(
    'SELECT id, prefijo FROM categorias_materiales WHERE lower(nombre) = lower($1)',
    [categoriaNombre.trim()],
  );
  const categoria = categoriaRows[0];
  if (!categoria) return null;

  await client.query('SELECT pg_advisory_xact_lock($1)', [Number(categoria.id)]);
  const { rows } = await client.query(
    'SELECT codigo FROM materiales WHERE codigo LIKE $1',
    [`${categoria.prefijo}-%`],
  );
  const siguiente = rows.reduce((mayor, material) => {
    const sufijo = material.codigo.slice(categoria.prefijo.length + 1);
    return /^\d+$/.test(sufijo) ? Math.max(mayor, Number(sufijo)) : mayor;
  }, 0) + 1;
  return `${categoria.prefijo}-${String(siguiente).padStart(3, '0')}`;
}

router.post('/', async (req, res, next) => {
  const datos = req.body || {};
  const errores = validarMaterial(datos);
  if (errores.length) return res.status(400).json({ mensaje: errores.join(' ') });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const categoriaId = await buscarCategoria(client, datos.categoria);
    if (!categoriaId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: 'La categoría seleccionada no existe.' });
    }
    const codigo = await crearCodigo(client, datos.categoria);
    const { rows } = await client.query(
      `INSERT INTO materiales (codigo, nombre, categoria_id, stock, unidad, precio_unitario)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING codigo AS id, codigo, nombre, stock, unidad,
                 precio_unitario AS "precioUnitario",
                 creado_en AS "creadoEn", actualizado_en AS "actualizadoEn"`,
      [
        codigo,
        datos.nombre.trim(),
        categoriaId,
        Number(datos.stock),
        textoValido(datos.unidad) ? datos.unidad.trim() : 'Unidad',
        Number(datos.precioUnitario),
      ],
    );
    await client.query('COMMIT');
    const material = rows[0];
    material.categoria = datos.categoria.trim();
    material.estado = estadoStock(material.stock);
    return res.status(201).json(material);
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res, next) => {
  const datos = req.body || {};
  const errores = validarMaterial(datos);
  if (errores.length) return res.status(400).json({ mensaje: errores.join(' ') });

  try {
    const categoriaId = await buscarCategoria(pool, datos.categoria);
    if (!categoriaId) return res.status(400).json({ mensaje: 'La categoría seleccionada no existe.' });
    const { rows } = await pool.query(
      `UPDATE materiales
       SET nombre = $1, categoria_id = $2, stock = $3, unidad = $4,
           precio_unitario = $5, actualizado_en = now()
       WHERE codigo = $6
       RETURNING codigo AS id, codigo, nombre, stock, unidad,
                 precio_unitario AS "precioUnitario",
                 creado_en AS "creadoEn", actualizado_en AS "actualizadoEn"`,
      [
        datos.nombre.trim(),
        categoriaId,
        Number(datos.stock),
        textoValido(datos.unidad) ? datos.unidad.trim() : 'Unidad',
        Number(datos.precioUnitario),
        req.params.id,
      ],
    );
    if (!rows[0]) return res.status(404).json({ mensaje: 'Material no encontrado.' });
    const material = rows[0];
    material.categoria = datos.categoria.trim();
    material.estado = estadoStock(material.stock);
    return res.json(material);
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const resultado = await pool.query('DELETE FROM materiales WHERE codigo = $1', [req.params.id]);
    if (!resultado.rowCount) return res.status(404).json({ mensaje: 'Material no encontrado.' });
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

export default router;
