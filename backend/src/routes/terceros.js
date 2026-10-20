import { Router } from 'express';
import { pool } from '../db.js';
import { correoValido, idValido, textoValido } from '../utils/validacion.js';

const router = Router();
const columnasPublicas = `
  id, nombre_completo, documento, empresa, telefono,
  correo_electronico, estado, fecha_creacion
`;

function validarTercero(datos) {
  const errores = [];
  if (!textoValido(datos.nombre_completo)) errores.push('nombre_completo es obligatorio.');
  if (!textoValido(datos.documento)) errores.push('documento es obligatorio.');
  if (datos.correo_electronico && !correoValido(datos.correo_electronico)) errores.push('correo_electronico no es válido.');
  return errores;
}

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT ${columnasPublicas} FROM terceros ORDER BY id`);
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ mensaje: 'El id no es válido.' });

  try {
    const { rows } = await pool.query(`SELECT ${columnasPublicas} FROM terceros WHERE id = $1`, [id]);
    if (!rows[0]) return res.status(404).json({ mensaje: 'Técnico tercero no encontrado.' });
    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  const errores = validarTercero(req.body);
  if (errores.length) return res.status(400).json({ mensaje: errores.join(' ') });

  try {
    const { rows } = await pool.query(
      `INSERT INTO terceros
         (nombre_completo, documento, empresa, telefono, correo_electronico, estado)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'Activo'))
       RETURNING ${columnasPublicas}`,
      [
        req.body.nombre_completo.trim(),
        req.body.documento.trim(),
        req.body.empresa?.trim() || null,
        req.body.telefono || null,
        req.body.correo_electronico || null,
        req.body.estado,
      ],
    );
    return res.status(201).json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ mensaje: 'El id no es válido.' });
  const errores = validarTercero(req.body);
  if (errores.length) return res.status(400).json({ mensaje: errores.join(' ') });

  try {
    const { rows } = await pool.query(
      `UPDATE terceros
       SET nombre_completo = $1, documento = $2, empresa = $3, telefono = $4,
           correo_electronico = $5, estado = $6
       WHERE id = $7
       RETURNING ${columnasPublicas}`,
      [
        req.body.nombre_completo.trim(),
        req.body.documento.trim(),
        req.body.empresa?.trim() || null,
        req.body.telefono || null,
        req.body.correo_electronico || null,
        req.body.estado || 'Activo',
        id,
      ],
    );
    if (!rows[0]) return res.status(404).json({ mensaje: 'Técnico tercero no encontrado.' });
    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ mensaje: 'El id no es válido.' });

  try {
    const resultado = await pool.query('DELETE FROM terceros WHERE id = $1', [id]);
    if (!resultado.rowCount) return res.status(404).json({ mensaje: 'Técnico tercero no encontrado.' });
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

export default router;
