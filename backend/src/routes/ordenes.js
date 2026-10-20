import { Router } from 'express';
import multer from 'multer';
import { pool } from '../db.js';
import { fechaValida, idValido, textoValido } from '../utils/validacion.js';

const router = Router();
const estadosTecnico = ['En Ejecución', 'En Espera de Repuestos', 'Finalizada'];
const tiposEvidencia = ['Fotografía', 'Firma'];

const subirArchivo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, archivo, siguiente) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.mimetype)) {
      const error = new Error('Solo se aceptan imágenes JPG, PNG o WEBP.');
      error.status = 400;
      return siguiente(error);
    }
    return siguiente(null, true);
  },
});

const consultaOrdenes = `
  SELECT os.id, os.codigo, os.cliente_id, c.nombre_razon_social AS cliente,
         os.servicio_id, s.nombre AS servicio, os.fecha_programada,
         os.tercero_id, t.nombre_completo AS tecnico, os.prioridad_id,
         p.nombre AS prioridad, os.estado_id, e.nombre AS estado,
         os.descripcion, os.fecha_creacion
  FROM ordenes_servicio os
  JOIN clientes c ON c.id = os.cliente_id
  LEFT JOIN servicios s ON s.id = os.servicio_id
  LEFT JOIN terceros t ON t.id = os.tercero_id
  JOIN prioridades p ON p.id = os.prioridad_id
  JOIN estados_orden_servicio e ON e.id = os.estado_id
`;

function esAdministrador(req) {
  return req.usuario.tipoCuenta === 'usuario' && req.usuario.rol === 'Administrador';
}

function archivoTieneFormatoValido(archivo) {
  const bytes = archivo.buffer;
  if (archivo.mimetype === 'image/png') {
    return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  if (archivo.mimetype === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (archivo.mimetype === 'image/webp') {
    return bytes.toString('ascii', 0, 4) === 'RIFF'
      && bytes.toString('ascii', 8, 12) === 'WEBP';
  }
  return false;
}

function validarOrden(datos) {
  const errores = [];
  if (!textoValido(datos.codigo)) errores.push('codigo es obligatorio.');
  for (const campo of ['cliente_id', 'servicio_id', 'tercero_id', 'prioridad_id', 'estado_id']) {
    if (!idValido(datos[campo])) errores.push(`${campo} debe ser un id válido.`);
  }
  if (datos.fecha_programada && !fechaValida(datos.fecha_programada)) {
    errores.push('fecha_programada debe tener formato AAAA-MM-DD.');
  }
  return errores;
}

async function obtenerOrdenVisible(id, req) {
  const filtros = ['os.id = $1'];
  const parametros = [id];
  if (req.usuario.tipoCuenta === 'tercero') {
    filtros.push(`os.tercero_id = $${parametros.length + 1}`);
    parametros.push(req.usuario.id);
  }
  const { rows } = await pool.query(
    `${consultaOrdenes} WHERE ${filtros.join(' AND ')}`,
    parametros,
  );
  return rows[0];
}

router.get('/', async (req, res, next) => {
  try {
    const filtroTecnico = req.usuario.tipoCuenta === 'tercero'
      ? 'WHERE os.tercero_id = $1'
      : '';
    const { rows } = await pool.query(
      `${consultaOrdenes} ${filtroTecnico} ORDER BY os.id DESC`,
      req.usuario.tipoCuenta === 'tercero' ? [req.usuario.id] : [],
    );
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

router.get('/catalogos', async (req, res, next) => {
  if (!esAdministrador(req)) {
    return res.status(403).json({ mensaje: 'Solo el administrador puede consultar estos catálogos.' });
  }

  try {
    const [servicios, prioridades, estados] = await Promise.all([
      pool.query('SELECT id, nombre FROM servicios ORDER BY id'),
      pool.query('SELECT id, nombre FROM prioridades ORDER BY id'),
      pool.query('SELECT id, nombre FROM estados_orden_servicio ORDER BY id'),
    ]);
    return res.json({
      servicios: servicios.rows,
      prioridades: prioridades.rows,
      estados: estados.rows,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id/evidencias', async (req, res, next) => {
  const ordenId = idValido(req.params.id);
  if (!ordenId) return res.status(400).json({ mensaje: 'El id no es válido.' });

  try {
    const orden = await obtenerOrdenVisible(ordenId, req);
    if (!orden) return res.status(404).json({ mensaje: 'Orden de servicio no encontrada.' });

    const { rows } = await pool.query(
      `SELECT id, orden_servicio_id, usuario_id, tercero_id, tipo,
              nombre_archivo, mime_type, observacion, fecha_carga
       FROM evidencias_orden
       WHERE orden_servicio_id = $1
       ORDER BY fecha_carga DESC`,
      [ordenId],
    );
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

router.get('/:id/seguimiento', async (req, res, next) => {
  const ordenId = idValido(req.params.id);
  if (!ordenId) return res.status(400).json({ mensaje: 'El id no es válido.' });

  try {
    const orden = await obtenerOrdenVisible(ordenId, req);
    if (!orden) return res.status(404).json({ mensaje: 'Orden de servicio no encontrada.' });

    const { rows } = await pool.query(
      `SELECT so.id, so.estado_anterior_id, ea.nombre AS estado_anterior,
              so.estado_nuevo_id, en.nombre AS estado_nuevo,
              so.comentario, so.fecha_registro,
              u.nombre_completo AS usuario, t.nombre_completo AS tecnico
       FROM seguimiento_orden so
       LEFT JOIN estados_orden_servicio ea ON ea.id = so.estado_anterior_id
       JOIN estados_orden_servicio en ON en.id = so.estado_nuevo_id
       LEFT JOIN usuarios u ON u.id = so.usuario_id
       LEFT JOIN terceros t ON t.id = so.tercero_id
       WHERE so.orden_servicio_id = $1
       ORDER BY so.fecha_registro DESC`,
      [ordenId],
    );
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/evidencias', subirArchivo.single('archivo'), async (req, res, next) => {
  const ordenId = idValido(req.params.id);
  if (!ordenId) return res.status(400).json({ mensaje: 'El id no es válido.' });
  if (!req.file) return res.status(400).json({ mensaje: 'Selecciona una foto o imagen de firma.' });

  const tipo = req.body.tipo;
  if (!tiposEvidencia.includes(tipo)) {
    return res.status(400).json({ mensaje: 'tipo debe ser Fotografía o Firma.' });
  }
  if (!archivoTieneFormatoValido(req.file)) {
    return res.status(400).json({ mensaje: 'El contenido del archivo no coincide con el formato de imagen.' });
  }
  if (tipo === 'Firma' && req.file.mimetype !== 'image/png') {
    return res.status(400).json({ mensaje: 'La firma debe enviarse como imagen PNG.' });
  }

  try {
    const orden = await obtenerOrdenVisible(ordenId, req);
    if (!orden) return res.status(404).json({ mensaje: 'Orden de servicio no encontrada.' });

    const esTercero = req.usuario.tipoCuenta === 'tercero';
    const { rows } = await pool.query(
      `INSERT INTO evidencias_orden
         (orden_servicio_id, usuario_id, tercero_id, tipo, url_archivo,
          nombre_archivo, mime_type, contenido, observacion)
       VALUES ($1, $2, $3, $4, NULL, $5, $6, $7, $8)
       RETURNING id, orden_servicio_id, usuario_id, tercero_id, tipo,
                 nombre_archivo, mime_type, observacion, fecha_carga`,
      [
        ordenId,
        esTercero ? null : req.usuario.id,
        esTercero ? req.usuario.id : null,
        tipo,
        req.file.originalname.slice(0, 255),
        req.file.mimetype,
        req.file.buffer,
        typeof req.body.observacion === 'string' ? req.body.observacion.trim() || null : null,
      ],
    );
    return res.status(201).json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.get('/evidencias/:evidenciaId/archivo', async (req, res, next) => {
  const evidenciaId = idValido(req.params.evidenciaId);
  if (!evidenciaId) return res.status(400).json({ mensaje: 'El id no es válido.' });

  try {
    const filtros = ['ev.id = $1'];
    const parametros = [evidenciaId];
    if (req.usuario.tipoCuenta === 'tercero') {
      filtros.push(`os.tercero_id = $${parametros.length + 1}`);
      parametros.push(req.usuario.id);
    }
    const { rows } = await pool.query(
      `SELECT ev.contenido, ev.mime_type
       FROM evidencias_orden ev
       JOIN ordenes_servicio os ON os.id = ev.orden_servicio_id
       WHERE ${filtros.join(' AND ')}`,
      parametros,
    );
    if (!rows[0]) return res.status(404).json({ mensaje: 'Evidencia no encontrada.' });
    if (!rows[0].contenido) return res.status(404).json({ mensaje: 'El archivo no está guardado en la base de datos.' });

    res.type(rows[0].mime_type);
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Content-Disposition', 'inline; filename="evidencia"');
    return res.send(rows[0].contenido);
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id/estado', async (req, res, next) => {
  const ordenId = idValido(req.params.id);
  const estadoId = idValido(req.body.estado_id);
  if (!ordenId || !estadoId) {
    return res.status(400).json({ mensaje: 'El id de la orden y el estado deben ser válidos.' });
  }
  if (req.body.comentario != null && typeof req.body.comentario !== 'string') {
    return res.status(400).json({ mensaje: 'comentario debe ser texto.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const ordenResultado = await client.query(
      'SELECT id, tercero_id, estado_id FROM ordenes_servicio WHERE id = $1 FOR UPDATE',
      [ordenId],
    );
    const orden = ordenResultado.rows[0];
    if (!orden || (req.usuario.tipoCuenta === 'tercero' && orden.tercero_id !== req.usuario.id)) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Orden de servicio no encontrada.' });
    }

    const estadoResultado = await client.query(
      'SELECT nombre FROM estados_orden_servicio WHERE id = $1',
      [estadoId],
    );
    const nombreEstado = estadoResultado.rows[0]?.nombre;
    if (!nombreEstado || (!esAdministrador(req) && !estadosTecnico.includes(nombreEstado))) {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: 'El estado solicitado no es válido para esta cuenta.' });
    }

    await client.query(
      'UPDATE ordenes_servicio SET estado_id = $1 WHERE id = $2',
      [estadoId, ordenId],
    );
    const esTercero = req.usuario.tipoCuenta === 'tercero';
    await client.query(
      `INSERT INTO seguimiento_orden
         (orden_servicio_id, usuario_id, tercero_id, estado_anterior_id, estado_nuevo_id, comentario)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        ordenId,
        esTercero ? null : req.usuario.id,
        esTercero ? req.usuario.id : null,
        orden.estado_id,
        estadoId,
        typeof req.body.comentario === 'string' ? req.body.comentario.trim() || null : null,
      ],
    );
    await client.query('COMMIT');
    const ordenActualizada = await obtenerOrdenVisible(ordenId, req);
    return res.json(ordenActualizada);
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

router.get('/:id', async (req, res, next) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ mensaje: 'El id no es válido.' });

  try {
    const orden = await obtenerOrdenVisible(id, req);
    if (!orden) return res.status(404).json({ mensaje: 'Orden de servicio no encontrada.' });
    return res.json(orden);
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  if (!esAdministrador(req)) return res.status(403).json({ mensaje: 'Solo el administrador puede crear órdenes.' });
  const errores = validarOrden(req.body);
  if (errores.length) return res.status(400).json({ mensaje: errores.join(' ') });

  try {
    const { rows } = await pool.query(
      `INSERT INTO ordenes_servicio
         (codigo, cliente_id, servicio_id, fecha_programada, tercero_id,
          prioridad_id, estado_id, descripcion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        req.body.codigo.trim(),
        req.body.cliente_id,
        req.body.servicio_id,
        req.body.fecha_programada,
        req.body.tercero_id,
        req.body.prioridad_id,
        req.body.estado_id,
        req.body.descripcion || null,
      ],
    );
    const nuevaOrden = await obtenerOrdenVisible(rows[0].id, req);
    return res.status(201).json(nuevaOrden);
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  if (!esAdministrador(req)) return res.status(403).json({ mensaje: 'Solo el administrador puede editar órdenes.' });
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ mensaje: 'El id no es válido.' });
  const errores = validarOrden(req.body);
  if (errores.length) return res.status(400).json({ mensaje: errores.join(' ') });

  try {
    const resultado = await pool.query(
      `UPDATE ordenes_servicio
       SET codigo = $1, cliente_id = $2, servicio_id = $3, fecha_programada = $4,
           tercero_id = $5, prioridad_id = $6, estado_id = $7, descripcion = $8
       WHERE id = $9
       RETURNING id`,
      [
        req.body.codigo.trim(),
        req.body.cliente_id,
        req.body.servicio_id,
        req.body.fecha_programada,
        req.body.tercero_id,
        req.body.prioridad_id,
        req.body.estado_id,
        req.body.descripcion || null,
        id,
      ],
    );
    if (!resultado.rowCount) return res.status(404).json({ mensaje: 'Orden de servicio no encontrada.' });
    return res.json(await obtenerOrdenVisible(id, req));
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  if (!esAdministrador(req)) return res.status(403).json({ mensaje: 'Solo el administrador puede eliminar órdenes.' });
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ mensaje: 'El id no es válido.' });

  try {
    const resultado = await pool.query('DELETE FROM ordenes_servicio WHERE id = $1', [id]);
    if (!resultado.rowCount) return res.status(404).json({ mensaje: 'Orden de servicio no encontrada.' });
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

export default router;
