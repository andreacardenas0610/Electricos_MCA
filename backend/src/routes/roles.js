import { Router } from 'express';
import { pool } from '../db.js';
import { textoValido } from '../utils/validacion.js';

const router = Router();
const modulosValidos = [
  'panel', 'clientes', 'terceros', 'materiales', 'servicios', 'cotizaciones',
  'abonos', 'agenda', 'ordenes', 'usuarios', 'roles',
];
const accionesValidas = ['ver', 'crear', 'editar', 'eliminar'];
const plataformasValidas = ['Web', 'Móvil'];

function normalizarPermisos(permisos) {
  if (!permisos || typeof permisos !== 'object' || Array.isArray(permisos)) return null;
  const salida = {};
  for (const modulo of modulosValidos) {
    const acciones = permisos[modulo] ?? [];
    if (!Array.isArray(acciones) || acciones.some((accion) => !accionesValidas.includes(accion))) {
      return null;
    }
    salida[modulo] = [...new Set(acciones)];
  }
  return salida;
}

function normalizarRol(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    codigo: row.codigo,
    descripcion: row.descripcion || '',
    plataformas: row.plataformas || ['Web'],
    estado: row.estado,
    permisos: normalizarPermisos(row.permisos) || {},
  };
}

function generarCodigo(nombre) {
  const base = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase()
    .slice(0, 14);
  return `ROL-${base || 'NUEVO'}`;
}

function validar(datos) {
  const errores = [];
  if (!textoValido(datos.nombre)) errores.push('nombre es obligatorio.');
  if (datos.estado && !['Activo', 'Inactivo'].includes(datos.estado)) {
    errores.push('estado debe ser Activo o Inactivo.');
  }
  if (datos.plataformas != null
    && (!Array.isArray(datos.plataformas)
      || datos.plataformas.length === 0
      || datos.plataformas.some((item) => !plataformasValidas.includes(item)))) {
    errores.push('plataformas debe contener Web o Móvil.');
  }
  if (datos.permisos != null && !normalizarPermisos(datos.permisos)) {
    errores.push('permisos contiene módulos o acciones no permitidos.');
  }
  return errores;
}

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nombre, codigo, descripcion, plataformas, estado, permisos FROM roles ORDER BY id DESC',
    );
    return res.json(rows.map(normalizarRol));
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nombre, codigo, descripcion, plataformas, estado, permisos FROM roles WHERE id = $1',
      [req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ mensaje: 'Rol no encontrado.' });
    return res.json(normalizarRol(rows[0]));
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  const datos = req.body || {};
  const errores = validar(datos);
  if (errores.length) return res.status(400).json({ mensaje: errores.join(' ') });

  try {
    const { rows } = await pool.query(
      `INSERT INTO roles (nombre, codigo, descripcion, plataformas, estado, permisos)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nombre, codigo, descripcion, plataformas, estado, permisos`,
      [
        datos.nombre.trim(),
        datos.codigo || generarCodigo(datos.nombre),
        datos.descripcion || '',
        datos.plataformas || ['Web'],
        datos.estado || 'Activo',
        JSON.stringify(normalizarPermisos(datos.permisos || {})),
      ],
    );
    return res.status(201).json(normalizarRol(rows[0]));
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  const datos = req.body || {};
  const errores = validar(datos);
  if (errores.length) return res.status(400).json({ mensaje: errores.join(' ') });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: actuales } = await client.query(
      'SELECT id, nombre, codigo FROM roles WHERE id = $1 FOR UPDATE',
      [req.params.id],
    );
    if (!actuales[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Rol no encontrado.' });
    }
    if (actuales[0].nombre === 'Administrador' && datos.nombre !== 'Administrador') {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: 'El rol Administrador no se puede renombrar.' });
    }
    if (actuales[0].nombre === 'Administrador' && datos.estado === 'Inactivo') {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: 'El rol Administrador debe permanecer activo.' });
    }
    if (datos.estado === 'Inactivo') {
      const asignados = await client.query(
        'SELECT COUNT(*)::int AS total FROM usuarios WHERE rol_id = $1',
        [req.params.id],
      );
      if (asignados.rows[0].total > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ mensaje: 'No puedes inactivar un rol con usuarios asignados.' });
      }
    }
    const { rows } = await client.query(
      `UPDATE roles
       SET nombre = $1, codigo = $2, descripcion = $3, plataformas = $4,
           estado = $5, permisos = $6
       WHERE id = $7
       RETURNING id, nombre, codigo, descripcion, plataformas, estado, permisos`,
      [
        datos.nombre.trim(),
        datos.codigo || actuales[0].codigo || generarCodigo(datos.nombre),
        datos.descripcion || '',
        datos.plataformas || ['Web'],
        datos.estado || 'Activo',
        JSON.stringify(normalizarPermisos(datos.permisos || {})),
        req.params.id,
      ],
    );
    await client.query('COMMIT');
    return res.json(normalizarRol(rows[0]));
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

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: roles } = await client.query(
      'SELECT id, nombre FROM roles WHERE id = $1 FOR UPDATE',
      [req.params.id],
    );
    if (!roles[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Rol no encontrado.' });
    }
    if (roles[0].nombre === 'Administrador' && estado === 'Inactivo') {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: 'El rol Administrador debe permanecer activo.' });
    }
    if (estado === 'Inactivo') {
      const { rows: usuarios } = await client.query(
        'SELECT COUNT(*)::int AS total FROM usuarios WHERE rol_id = $1',
        [req.params.id],
      );
      if (usuarios[0].total > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ mensaje: 'No puedes inactivar un rol con usuarios asignados.' });
      }
    }
    const { rows } = await client.query(
      `UPDATE roles SET estado = $1 WHERE id = $2
       RETURNING id, nombre, codigo, descripcion, plataformas, estado, permisos`,
      [estado, req.params.id],
    );
    await client.query('COMMIT');
    return res.json(normalizarRol(rows[0]));
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

router.delete('/:id', async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'SELECT id, nombre FROM roles WHERE id = $1 FOR UPDATE',
      [req.params.id],
    );
    if (!rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Rol no encontrado.' });
    }
    if (rows[0].nombre === 'Administrador') {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: 'El rol Administrador no se puede eliminar.' });
    }
    const usuarios = await client.query(
      'SELECT COUNT(*)::int AS total FROM usuarios WHERE rol_id = $1',
      [req.params.id],
    );
    if (usuarios.rows[0].total > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ mensaje: 'No puedes eliminar un rol con usuarios asignados.' });
    }
    await client.query('DELETE FROM roles WHERE id = $1', [req.params.id]);
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
