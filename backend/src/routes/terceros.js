import { Router } from 'express';
import { pool } from '../db.js';
import { correoValido, idValido, textoValido } from '../utils/validacion.js';

const router = Router();
const tiposDocumento = ['Cédula', 'Cédula de extranjería', 'NIT', 'Pasaporte'];
const columnasPublicas = `
  id, nombre_completo, tipo_documento, documento, empresa, telefono,
  correo_electronico, direccion, municipio, departamento,
  estado, fecha_creacion
`;

function validarTercero(datos) {
  const errores = [];
  if (!textoValido(datos.nombre_completo)) errores.push('nombre_completo es obligatorio.');
  if (!textoValido(datos.documento)) errores.push('documento es obligatorio.');
  if (datos.tipo_documento && !tiposDocumento.includes(datos.tipo_documento)) {
    errores.push('tipo_documento no es válido.');
  }
  if (datos.correo_electronico && !correoValido(datos.correo_electronico)) errores.push('correo_electronico no es válido.');
  if (datos.estado && !['Activo', 'Inactivo'].includes(datos.estado)) {
    errores.push('estado debe ser Activo o Inactivo.');
  }
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
         (nombre_completo, tipo_documento, documento, empresa, telefono,
          correo_electronico, direccion, municipio, departamento, estado)
       VALUES ($1, COALESCE($2, 'Cédula'), $3, $4, $5, $6, $7, $8, $9, COALESCE($10, 'Activo'))
       RETURNING ${columnasPublicas}`,
      [
        req.body.nombre_completo.trim(),
        req.body.tipo_documento || req.body.tipoDocumento || null,
        req.body.documento.trim(),
        req.body.empresa?.trim() || null,
        req.body.telefono || null,
        req.body.correo_electronico || req.body.correo || null,
        req.body.direccion?.trim() || '',
        req.body.municipio?.trim() || '',
        req.body.departamento?.trim() || '',
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
    // La especialidad (empresa) se conserva cuando la pantalla ya no la edita.
    const { rows: actual } = await pool.query('SELECT empresa FROM terceros WHERE id = $1', [id]);
    if (!actual[0]) return res.status(404).json({ mensaje: 'Técnico tercero no encontrado.' });

    const { rows } = await pool.query(
      `UPDATE terceros
       SET nombre_completo = $1, tipo_documento = COALESCE($2, tipo_documento, 'Cédula'),
           documento = $3, empresa = COALESCE($4, empresa), telefono = $5,
           correo_electronico = $6, direccion = $7, municipio = $8,
           departamento = $9, estado = COALESCE($10, estado, 'Activo')
       WHERE id = $11
       RETURNING ${columnasPublicas}`,
      [
        req.body.nombre_completo.trim(),
        req.body.tipo_documento || req.body.tipoDocumento || null,
        req.body.documento.trim(),
        req.body.empresa?.trim() || null,
        req.body.telefono || null,
        req.body.correo_electronico || req.body.correo || null,
        req.body.direccion?.trim() || '',
        req.body.municipio?.trim() || '',
        req.body.departamento?.trim() || '',
        req.body.estado,
        id,
      ],
    );
    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id/estado', async (req, res, next) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ mensaje: 'El id no es válido.' });

  const { estado } = req.body || {};
  if (!['Activo', 'Inactivo'].includes(estado)) {
    return res.status(400).json({ mensaje: 'estado debe ser Activo o Inactivo.' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE terceros SET estado = $1 WHERE id = $2 RETURNING ${columnasPublicas}`,
      [estado, id],
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
