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

// Umbrales configurables por material: el usuario decide dónde empieza el stock
// bajo (stock_minimo) y dónde deja de ser medio (stock_medio).
function estadoStock(stock, minimo, medio) {
  const disponible = Number(stock);
  const umbralBajo = Number(minimo) > 0 ? Number(minimo) : 10;
  const umbralMedio = Number(medio) > 0 ? Number(medio) : Math.max(umbralBajo * 2, 20);
  if (disponible <= 0) return 'Crítico';
  if (disponible <= umbralBajo) return 'Bajo Stock';
  if (disponible <= umbralMedio) return 'Medio';
  return 'Óptimo';
}

// stock_medio llega con la migración 005. Si la base aún no la tiene, las
// consultas se generan sin esa columna para no dejar la pantalla en blanco.
let tieneStockMedio = null;

async function existeStockMedio() {
  if (tieneStockMedio !== null) return tieneStockMedio;
  try {
    const { rows } = await pool.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_schema = current_schema()
         AND table_name = 'materiales'
         AND column_name = 'stock_medio'
       LIMIT 1`,
    );
    tieneStockMedio = rows.length > 0;
  } catch {
    tieneStockMedio = false;
  }
  return tieneStockMedio;
}

const columnaMedio = (conMedio, alias = '') =>
  (conMedio ? `${alias}stock_medio AS "stockMedio",` : '');

function columnasMaterial(conMedio) {
  return `
    m.codigo AS id, m.codigo, m.nombre, c.nombre AS categoria,
    m.stock, m.unidad, m.precio_unitario AS "precioUnitario",
    COALESCE(m.estado, 'Activo') AS "estadoInventario",
    COALESCE(m.stock_minimo, 10) AS "stockMinimo",
    ${columnaMedio(conMedio, 'm.')}
    m.creado_en AS "creadoEn", m.actualizado_en AS "actualizadoEn"
  `;
}

function columnasMaterialSueltas(conMedio) {
  return `
    codigo AS id, codigo, nombre, stock, unidad,
    precio_unitario AS "precioUnitario",
    COALESCE(estado, 'Activo') AS "estadoInventario",
    COALESCE(stock_minimo, 10) AS "stockMinimo",
    ${columnaMedio(conMedio)}
    creado_en AS "creadoEn", actualizado_en AS "actualizadoEn"
  `;
}

function conEstado(material) {
  return {
    ...material,
    estado: estadoStock(material.stock, material.stockMinimo, material.stockMedio),
  };
}

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
    const conMedio = await existeStockMedio();
    const { rows } = await pool.query(
      `SELECT ${columnasMaterial(conMedio)}
       FROM materiales m
       JOIN categorias_materiales c ON c.id = m.categoria_id
       ORDER BY m.nombre`,
    );
    return res.json(rows.map(conEstado));
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
  if (datos.stockMinimo !== undefined
    && (!Number.isFinite(Number(datos.stockMinimo)) || Number(datos.stockMinimo) < 0)) {
    errores.push('stockMinimo debe ser un número mayor o igual a cero.');
  }
  if (datos.stockMedio !== undefined
    && (!Number.isFinite(Number(datos.stockMedio)) || Number(datos.stockMedio) < 0)) {
    errores.push('stockMedio debe ser un número mayor o igual a cero.');
  }
  if (Number.isFinite(Number(datos.stockMinimo))
    && Number.isFinite(Number(datos.stockMedio))
    && Number(datos.stockMedio) > 0
    && Number(datos.stockMedio) < Number(datos.stockMinimo)) {
    errores.push('stockMedio debe ser mayor que stockMinimo.');
  }
  if (datos.estadoInventario && !['Activo', 'Inactivo'].includes(datos.estadoInventario)) {
    errores.push('estadoInventario debe ser Activo o Inactivo.');
  }
  return errores;
}

async function materialRepetido(client, nombre, codigoActual = null) {
  const { rows } = await client.query(
    `SELECT codigo, nombre FROM materiales
     WHERE lower(btrim(nombre)) = lower(btrim($1))
       AND ($2::varchar IS NULL OR codigo <> $2::varchar)
     LIMIT 1`,
    [nombre, codigoActual],
  );
  return rows[0] ?? null;
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

    const repetido = await materialRepetido(client, datos.nombre);
    if (repetido) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        mensaje: `Ya existe el material ${repetido.codigo} · ${repetido.nombre}. Actualízalo en lugar de registrarlo de nuevo.`,
        material: repetido.codigo,
      });
    }

    const codigo = await crearCodigo(client, datos.categoria);
    const conMedio = await existeStockMedio();
    const valoresInsert = [
      codigo,
      datos.nombre.trim(),
      categoriaId,
      Number(datos.stock),
      textoValido(datos.unidad) ? datos.unidad.trim() : 'Unidad',
      Number(datos.precioUnitario),
      Number(datos.stockMinimo) >= 0 ? Number(datos.stockMinimo) : null,
      datos.estadoInventario,
    ];
    if (conMedio) {
      valoresInsert.push(Number(datos.stockMedio) >= 0 ? Number(datos.stockMedio) : null);
    }

    const { rows } = await client.query(
      `INSERT INTO materiales (codigo, nombre, categoria_id, stock, unidad, precio_unitario, stock_minimo, estado${conMedio ? ', stock_medio' : ''})
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 10), COALESCE($8, 'Activo')${conMedio ? ', $9' : ''})
       RETURNING ${columnasMaterialSueltas(conMedio)}`,
      valoresInsert,
    );
    await client.query('COMMIT');
    const material = conEstado(rows[0]);
    material.categoria = datos.categoria.trim();
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

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const categoriaId = await buscarCategoria(client, datos.categoria);
    if (!categoriaId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: 'La categoría seleccionada no existe.' });
    }

    const repetido = await materialRepetido(client, datos.nombre, req.params.id);
    if (repetido) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        mensaje: `Ya existe el material ${repetido.codigo} · ${repetido.nombre}. No se pueden duplicar materiales.`,
        material: repetido.codigo,
      });
    }

    // El precio unitario queda congelado una vez el material se usa en una cotización.
    const { rows: usado } = await client.query(
      `SELECT COUNT(*)::int AS total FROM cotizacion_items
       WHERE tipo = 'material' AND referencia_id = $1`,
      [req.params.id],
    );
    const precioBloqueado = usado[0].total > 0;
    const { rows: actual } = await client.query(
      'SELECT precio_unitario FROM materiales WHERE codigo = $1',
      [req.params.id],
    );
    if (!actual[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Material no encontrado.' });
    }

    const conMedio = await existeStockMedio();
    const valoresUpdate = [
      datos.nombre.trim(),
      categoriaId,
      Number(datos.stock),
      textoValido(datos.unidad) ? datos.unidad.trim() : 'Unidad',
      precioBloqueado ? actual[0].precio_unitario : Number(datos.precioUnitario),
      Number(datos.stockMinimo) >= 0 ? Number(datos.stockMinimo) : null,
      datos.estadoInventario,
      req.params.id,
    ];
    if (conMedio) {
      valoresUpdate.push(Number(datos.stockMedio) >= 0 ? Number(datos.stockMedio) : null);
    }

    const { rows } = await client.query(
      `UPDATE materiales
       SET nombre = $1, categoria_id = $2, stock = $3, unidad = $4,
           precio_unitario = $5, stock_minimo = COALESCE($6, stock_minimo, 10),
           estado = COALESCE($7, estado, 'Activo'),
           ${conMedio ? 'stock_medio = COALESCE($9, stock_medio),' : ''}
           actualizado_en = now()
       WHERE codigo = $8
       RETURNING ${columnasMaterialSueltas(conMedio)}`,
      valoresUpdate,
    );
    await client.query('COMMIT');
    const material = conEstado(rows[0]);
    material.categoria = datos.categoria.trim();
    material.precioBloqueado = precioBloqueado;
    return res.json(material);
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

router.patch('/:id/estado', async (req, res, next) => {
  const { estado } = req.body || {};
  if (!['Activo', 'Inactivo'].includes(estado)) {
    return res.status(400).json({ mensaje: 'estado debe ser Activo o Inactivo.' });
  }

  try {
    const conMedio = await existeStockMedio();
    // El JOIN con categorías es obligatorio: columnasMaterial usa c.nombre.
    const { rows } = await pool.query(
      `SELECT ${columnasMaterial(conMedio)} FROM materiales m
       JOIN categorias_materiales c ON c.id = m.categoria_id
       WHERE m.codigo = $1`,
      [req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ mensaje: 'Material no encontrado.' });

    const actualizado = await pool.query(
      `UPDATE materiales SET estado = $1, actualizado_en = now()
       WHERE codigo = $2
       RETURNING ${columnasMaterialSueltas(conMedio)}`,
      [estado, req.params.id],
    );
    const material = conEstado(actualizado.rows[0]);
    material.categoria = rows[0].categoria;
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
