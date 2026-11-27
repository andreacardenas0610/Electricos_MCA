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
         os.hora_programada, os.direccion, os.firma_cliente_url, os.fecha_firma,
         os.tercero_id, os.tecnico_usuario_id,
         COALESCE(t.nombre_completo, u.nombre_completo) AS tecnico, os.prioridad_id,
         p.nombre AS prioridad, os.estado_id, e.nombre AS estado,
         os.descripcion, os.fecha_creacion
  FROM ordenes_servicio os
  JOIN clientes c ON c.id = os.cliente_id
  LEFT JOIN servicios s ON s.id = os.servicio_id
  LEFT JOIN terceros t ON t.id = os.tercero_id
  LEFT JOIN usuarios u ON u.id = os.tecnico_usuario_id
  JOIN prioridades p ON p.id = os.prioridad_id
  JOIN estados_orden_servicio e ON e.id = os.estado_id
`;

function esAdministrador(req) {
  return req.usuario.tipoCuenta === 'usuario' && req.usuario.rol === 'Administrador';
}

function esTecnico(req) {
  return req.usuario.tipoCuenta === 'tercero'
    || (req.usuario.tipoCuenta === 'usuario'
      && req.usuario.plataforma === 'movil'
      && Boolean(req.usuario.terceroId));
}

// La web asigna la orden al tercero y la app entra con la cuenta de ese tercero.
// Los datos antiguos pueden tener solo una de las dos columnas (por ejemplo,
// tercero_id con tecnico_usuario_id vacío), así que se aceptan ambas: de lo
// contrario la orden no aparece ni deja cambiar su estado desde el móvil.
function tecnicoAsignado(req) {
  if (req.usuario.tipoCuenta === 'tercero') {
    return { campos: ['os.tercero_id', 'os.tecnico_usuario_id'], ids: [req.usuario.id, req.usuario.id, req.usuario.id] };
  }
  const terceroId = req.usuario.terceroId ? Number(req.usuario.terceroId) : null;
  return terceroId
    ? { campos: ['os.tercero_id', 'os.tecnico_usuario_id'], ids: [terceroId, req.usuario.id, terceroId] }
    : { campos: ['os.tecnico_usuario_id'], ids: [req.usuario.id] };
}

// Fragmento SQL (con placeholders desde $inicio) para limitar la consulta al técnico.
// El último id de la lista es el tercero: las visitas que tiene en la agenda también
// cuentan, para que lo agendado por la web aparezca en el inicio del móvil.
function condicionAsignacion(asignacion, inicio) {
  const partes = asignacion.campos
    .map((campo, indice) => `${campo} = $${inicio + indice}`);
  if (asignacion.ids.length > asignacion.campos.length) {
    partes.push(`EXISTS (
        SELECT 1 FROM agenda_actividades a
        WHERE a.tercero_id = $${inicio + asignacion.campos.length}
          AND a.estado IN ('Programada', 'En proceso')
          AND (a.orden_servicio_id = os.id
            OR (a.orden_servicio_id IS NULL
                AND a.cliente_id = os.cliente_id
                AND a.servicio_id = os.servicio_id))
      )`);
  }
  return partes.join(' OR ');
}

function terceroDelTecnico(req) {
  if (req.usuario.tipoCuenta === 'tercero') return Number(req.usuario.id);
  return req.usuario.terceroId ? Number(req.usuario.terceroId) : null;
}

// La orden puede venir asignada a otro técnico, pero si la agenda del técnico
// tiene la visita del mismo cliente y servicio, también puede atenderla.
async function esOrdenEnAgendaDelTecnico(client, req, orden) {
  const terceroId = terceroDelTecnico(req);
  if (!terceroId || !orden?.id) return false;
  const { rows } = await client.query(
    `SELECT 1 FROM agenda_actividades a
     WHERE a.tercero_id = $1
       AND a.estado IN ('Programada', 'En proceso')
       AND (a.orden_servicio_id = $2
         OR (a.orden_servicio_id IS NULL
             AND a.cliente_id = $3
             AND a.servicio_id = $4))
     LIMIT 1`,
    [terceroId, orden.id, orden.cliente_id, orden.servicio_id],
  );
  return Boolean(rows[0]);
}

function esOrdenDelTecnico(req, orden) {
  if (!orden) return false;
  if (esAdministrador(req)) return true;
  if (req.usuario.tipoCuenta === 'tercero') return Number(orden.tercero_id) === Number(req.usuario.id);
  if (req.usuario.terceroId && Number(orden.tercero_id) === Number(req.usuario.terceroId)) return true;
  return Number(orden.tecnico_usuario_id) === Number(req.usuario.id);
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
  if (datos.hora_programada && !/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(datos.hora_programada)) {
    errores.push('hora_programada debe tener formato HH:MM.');
  }
  if (datos.direccion != null && typeof datos.direccion !== 'string') {
    errores.push('direccion debe ser texto.');
  }
  if (datos.descripcion != null && typeof datos.descripcion !== 'string') {
    errores.push('descripcion debe ser texto.');
  }
  return errores;
}

// Una orden Finalizada queda quemada: no se edita, no se elimina ni cambia de estado.
async function nombreEstado(client, id) {
  const { rows } = await client.query(
    `SELECT e.nombre FROM ordenes_servicio os
     JOIN estados_orden_servicio e ON e.id = os.estado_id
     WHERE os.id = $1`,
    [id],
  );
  return rows[0]?.nombre ?? null;
}

function ordenFinalizada(nombre) {
  return nombre === 'Finalizada';
}

// La agenda y las órdenes manejan estados distintos. Al cambiar la orden se
// refleja en su actividad de agenda para que la web y el móvil no muestren
// estados diferentes del mismo servicio.
const estadoAgendaPorOrden = {
  'En Ejecución': 'En proceso',
  'Finalizada': 'Completada',
  'Cancelada': 'Cancelada',
};

async function sincronizarAgendaDesdeOrden(client, ordenId, nombreEstadoOrden) {
  const estadoAgenda = estadoAgendaPorOrden[nombreEstadoOrden];
  if (!estadoAgenda) return;
  await client.query(
    `UPDATE agenda_actividades a
     SET estado = $1, actualizado_en = now()
     FROM ordenes_servicio os
     WHERE os.id = $2
       AND (a.orden_servicio_id = os.id
         OR (a.orden_servicio_id IS NULL
             AND a.cliente_id = os.cliente_id
             AND a.servicio_id = os.servicio_id))
       AND a.estado IN ('Programada', 'En proceso')`,
    [estadoAgenda, ordenId],
  );
  await client.query(
    `UPDATE agenda_actividades a
     SET orden_servicio_id = os.id, actualizado_en = now()
     FROM ordenes_servicio os
     WHERE os.id = $1
       AND a.orden_servicio_id IS NULL
       AND a.cliente_id = os.cliente_id
       AND a.servicio_id = os.servicio_id
       AND a.estado IN ('Programada', 'En proceso')`,
    [ordenId],
  );
}

async function obtenerOrdenVisible(id, req) {
  const filtros = ['os.id = $1'];
  const parametros = [id];
  if (esTecnico(req)) {
    const asignacion = tecnicoAsignado(req);
    filtros.push(`(${condicionAsignacion(asignacion, parametros.length + 1)})`);
    parametros.push(...asignacion.ids);
  }
  const { rows } = await pool.query(
    `${consultaOrdenes} WHERE ${filtros.join(' AND ')}`,
    parametros,
  );
  return rows[0];
}

router.get('/', async (req, res, next) => {
  try {
    const asignacion = esTecnico(req) ? tecnicoAsignado(req) : null;
    const filtroTecnico = asignacion
      ? `WHERE (${condicionAsignacion(asignacion, 1)})`
      : '';
    const { rows } = await pool.query(
      `${consultaOrdenes} ${filtroTecnico} ORDER BY os.id DESC`,
      asignacion ? asignacion.ids : [],
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

// Servicios que ya se le han ofrecido o prestado a un cliente: sirven para
// preseleccionar el servicio al crear una orden nueva.
router.get('/clientes/:clienteId/servicios', async (req, res, next) => {
  if (!esAdministrador(req)) {
    return res.status(403).json({ mensaje: 'Solo el administrador puede consultar los servicios del cliente.' });
  }

  const clienteId = idValido(req.params.clienteId);
  if (!clienteId) return res.status(400).json({ mensaje: 'El cliente no es válido.' });

  try {
    const { rows } = await pool.query(
      `SELECT s.id, s.nombre, SUM(fuente.veces)::int AS veces,
              MAX(fuente.ultima) AS ultima_fecha
       FROM (
         SELECT ci.referencia_id::int AS servicio_id, 1 AS veces,
                co.fecha_emision AS ultima
         FROM cotizaciones co
         JOIN cotizacion_items ci ON ci.cotizacion_codigo = co.codigo
         WHERE co.cliente_id = $1 AND ci.tipo = 'servicio'
           AND ci.referencia_id ~ '^[0-9]+$'
         UNION ALL
         SELECT os.servicio_id, 1,
                COALESCE(os.fecha_programada, os.fecha_creacion::date)
         FROM ordenes_servicio os
         WHERE os.cliente_id = $1 AND os.servicio_id IS NOT NULL
         UNION ALL
         SELECT aa.servicio_id, 1, aa.fecha
         FROM agenda_actividades aa
         WHERE aa.cliente_id = $1
       ) fuente
       JOIN servicios s ON s.id = fuente.servicio_id
       GROUP BY s.id, s.nombre
       ORDER BY veces DESC, ultima_fecha DESC NULLS LAST, s.nombre`,
      [clienteId],
    );
    return res.json(rows);
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
              COALESCE(url, url_archivo) AS url,
              CASE WHEN contenido IS NOT NULL
                   THEN $2 || '/evidencias/' || id || '/archivo'
                   ELSE NULL END AS "archivoUrl",
              nombre_archivo, mime_type, observacion, fecha_carga
       FROM orden_evidencias
       WHERE orden_servicio_id = $1
       ORDER BY fecha_carga DESC`,
      [ordenId, req.baseUrl],
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
       FROM historial_estados_orden so
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

router.get('/:id/materiales', async (req, res, next) => {
  const ordenId = idValido(req.params.id);
  if (!ordenId) return res.status(400).json({ mensaje: 'El id no es válido.' });

  try {
    const orden = await obtenerOrdenVisible(ordenId, req);
    if (!orden) return res.status(404).json({ mensaje: 'Orden de servicio no encontrada.' });

    const { rows } = await pool.query(
      `SELECT om.id, om.orden_servicio_id, om.material_codigo AS codigo,
              m.nombre, om.cantidad, m.unidad, om.usuario_id, om.creado_en
       FROM orden_materiales_consumidos om
       JOIN materiales m ON m.codigo = om.material_codigo
       WHERE om.orden_servicio_id = $1
       ORDER BY om.creado_en, om.id`,
      [ordenId],
    );
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

// Costo de la orden: precio del servicio + materiales consumidos, y comparación
// entre los materiales previstos por el servicio y lo realmente usado.
router.get('/:id/costos', async (req, res, next) => {
  const ordenId = idValido(req.params.id);
  if (!ordenId) return res.status(400).json({ mensaje: 'El id no es válido.' });

  try {
    const orden = await obtenerOrdenVisible(ordenId, req);
    if (!orden) return res.status(404).json({ mensaje: 'Orden de servicio no encontrada.' });

    const [servicio, consumidos, previstos] = await Promise.all([
      pool.query(
        `SELECT s.id, s.nombre, s.precio_numerico, s.moneda
         FROM ordenes_servicio os
         LEFT JOIN servicios s ON s.id = os.servicio_id
         WHERE os.id = $1`,
        [ordenId],
      ),
      pool.query(
        `SELECT om.material_codigo AS codigo, m.nombre, m.unidad, om.cantidad,
                m.precio_unitario
         FROM orden_materiales_consumidos om
         JOIN materiales m ON m.codigo = om.material_codigo
         WHERE om.orden_servicio_id = $1
         ORDER BY m.nombre`,
        [ordenId],
      ),
      pool.query(
        `SELECT vm.material_codigo AS codigo, m.nombre, m.unidad,
                vm.cantidad AS previsto, vm.obligatorio, m.precio_unitario,
                COALESCE(om.cantidad, 0) AS consumido
         FROM ordenes_servicio os
         JOIN servicios_materiales vm ON vm.servicio_id = os.servicio_id
         JOIN materiales m ON m.codigo = vm.material_codigo
         LEFT JOIN orden_materiales_consumidos om
           ON om.orden_servicio_id = os.id
          AND om.material_codigo = vm.material_codigo
         WHERE os.id = $1
         ORDER BY m.nombre`,
        [ordenId],
      ),
    ]);

    const redondear = (valor) => Math.round(Number(valor || 0) * 100) / 100;
    const filaServicio = servicio.rows[0] || {};
    const precioServicio = redondear(filaServicio.precio_numerico);
    const moneda = filaServicio.moneda || 'COP';

    const materiales = consumidos.rows.map((fila) => {
      const cantidad = Number(fila.cantidad);
      const precioUnitario = Number(fila.precio_unitario);
      return {
        codigo: fila.codigo,
        nombre: fila.nombre,
        unidad: fila.unidad,
        cantidad,
        precio_unitario: precioUnitario,
        subtotal: redondear(cantidad * precioUnitario),
      };
    });
    const totalMateriales = redondear(
      materiales.reduce((suma, material) => suma + material.subtotal, 0),
    );

    const previstosLista = previstos.rows.map((fila) => {
      const previsto = Number(fila.previsto);
      const consumido = Number(fila.consumido);
      return {
        codigo: fila.codigo,
        nombre: fila.nombre,
        unidad: fila.unidad,
        previsto,
        consumido,
        sobrante: redondear(Math.max(0, previsto - consumido)),
        exceso: redondear(Math.max(0, consumido - previsto)),
        obligatorio: Boolean(fila.obligatorio),
        precio_unitario: Number(fila.precio_unitario),
      };
    });

    return res.json({
      orden_id: ordenId,
      moneda,
      servicio: filaServicio.id
        ? { id: filaServicio.id, nombre: filaServicio.nombre, precio: precioServicio }
        : null,
      precio_servicio: precioServicio,
      materiales,
      previstos: previstosLista,
      sobrantes: previstosLista.filter((material) => material.sobrante > 0),
      total_materiales: totalMateriales,
      total: redondear(precioServicio + totalMateriales),
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/materiales', async (req, res, next) => {
  const ordenId = idValido(req.params.id);
  const codigo = typeof req.body?.material_codigo === 'string'
    ? req.body.material_codigo.trim()
    : typeof req.body?.codigo === 'string' ? req.body.codigo.trim() : '';
  const cantidad = Number(req.body?.cantidad);
  if (!ordenId || !codigo || !Number.isFinite(cantidad) || cantidad <= 0) {
    return res.status(400).json({ mensaje: 'El id, material_codigo y una cantidad mayor que cero son obligatorios.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: ordenes } = await client.query(
      `SELECT os.id, os.tercero_id, os.tecnico_usuario_id, os.cliente_id, os.servicio_id,
              e.nombre AS estado
       FROM ordenes_servicio os
       JOIN estados_orden_servicio e ON e.id = os.estado_id
       WHERE os.id = $1
       FOR UPDATE OF os`,
      [ordenId],
    );
    const orden = ordenes[0];
    if (!orden || !(esOrdenDelTecnico(req, orden)
      || await esOrdenEnAgendaDelTecnico(client, req, orden))) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Orden de servicio no encontrada.' });
    }
    if (ordenFinalizada(orden.estado)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ mensaje: 'No se pueden registrar materiales en una orden finalizada.' });
    }

    const { rows: materiales } = await client.query(
      `SELECT codigo, nombre, stock, unidad
       FROM materiales
       WHERE codigo = $1 AND estado = 'Activo'
       FOR UPDATE`,
      [codigo],
    );
    const material = materiales[0];
    if (!material) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'El material no existe o está inactivo.' });
    }
    if (Number(material.stock) < cantidad) {
      await client.query('ROLLBACK');
      return res.status(409).json({ mensaje: `Stock insuficiente para ${material.nombre}.` });
    }

    await client.query(
      'UPDATE materiales SET stock = stock - $1, actualizado_en = now() WHERE codigo = $2',
      [cantidad, codigo],
    );
    const { rows } = await client.query(
      `INSERT INTO orden_materiales_consumidos
         (orden_servicio_id, material_codigo, cantidad, usuario_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (orden_servicio_id, material_codigo)
       DO UPDATE SET cantidad = orden_materiales_consumidos.cantidad + EXCLUDED.cantidad
       RETURNING id, orden_servicio_id, material_codigo AS codigo, cantidad, usuario_id, creado_en`,
      [
        ordenId,
        codigo,
        cantidad,
        req.usuario.tipoCuenta === 'tercero' ? null : req.usuario.id,
      ],
    );
    await client.query('COMMIT');
    return res.status(201).json({
      ...rows[0],
      nombre: material.nombre,
      unidad: material.unidad,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

router.post('/:id/evidencias', subirArchivo.single('archivo'), async (req, res, next) => {
  const ordenId = idValido(req.params.id);
  if (!ordenId) return res.status(400).json({ mensaje: 'El id no es válido.' });
  const datos = req.body || {};
  const url = typeof datos.url === 'string' ? datos.url.trim() : '';
  if (!req.file && !url) return res.status(400).json({ mensaje: 'Adjunta una imagen o proporciona su URL.' });
  if (url) {
    try {
      if (new URL(url).protocol !== 'https:') throw new Error('URL no segura.');
    } catch {
      return res.status(400).json({ mensaje: 'url debe ser un enlace HTTPS válido.' });
    }
  }

  const tipo = datos.tipo;
  if (!tiposEvidencia.includes(tipo)) {
    return res.status(400).json({ mensaje: 'tipo debe ser Fotografía o Firma.' });
  }
  if (req.file && !archivoTieneFormatoValido(req.file)) {
    return res.status(400).json({ mensaje: 'El contenido del archivo no coincide con el formato de imagen.' });
  }
  if (tipo === 'Firma' && req.file && req.file.mimetype !== 'image/png') {
    return res.status(400).json({ mensaje: 'La firma debe enviarse como imagen PNG.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const filtros = ['os.id = $1'];
    const parametros = [ordenId];
    if (esTecnico(req)) {
      const asignacion = tecnicoAsignado(req);
      filtros.push(`(${condicionAsignacion(asignacion, parametros.length + 1)})`);
      parametros.push(...asignacion.ids);
    }
    const orden = await client.query(
      `SELECT os.id FROM ordenes_servicio os
       WHERE ${filtros.join(' AND ')}
       FOR UPDATE OF os`,
      parametros,
    );
    if (!orden.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Orden de servicio no encontrada.' });
    }

    const esTercero = esTecnico(req);
    const { rows } = await client.query(
      `INSERT INTO orden_evidencias
         (orden_servicio_id, usuario_id, tercero_id, tipo, url, url_archivo,
          nombre_archivo, mime_type, contenido, observacion)
       VALUES ($1, $2, $3, $4, $5, NULL, $6, $7, $8, $9)
       RETURNING id, orden_servicio_id, usuario_id, tercero_id, tipo,
                 url, nombre_archivo, mime_type, observacion, fecha_carga`,
      [
        ordenId,
        esTercero && req.usuario.tipoCuenta === 'tercero' ? null : req.usuario.id,
        esTercero ? (req.usuario.terceroId || req.usuario.id) : null,
        tipo,
        url || null,
        req.file?.originalname.slice(0, 255) || null,
        req.file?.mimetype || null,
        req.file?.buffer || null,
        typeof datos.observacion === 'string' ? datos.observacion.trim() || null : null,
      ],
    );
    const evidencia = {
      ...rows[0],
      archivoUrl: req.file ? `${req.baseUrl}/evidencias/${rows[0].id}/archivo` : null,
    };
    if (tipo === 'Firma') {
      const firmaUrl = url || evidencia.archivoUrl;
      await client.query(
        `UPDATE ordenes_servicio
         SET firma_cliente_url = $1, fecha_firma = now(), actualizado_en = now()
         WHERE id = $2`,
        [firmaUrl, ordenId],
      );
    }
    await client.query('COMMIT');
    return res.status(201).json(evidencia);
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

router.get('/evidencias/:evidenciaId/archivo', async (req, res, next) => {
  const evidenciaId = idValido(req.params.evidenciaId);
  if (!evidenciaId) return res.status(400).json({ mensaje: 'El id no es válido.' });

  try {
    const filtros = ['ev.id = $1'];
    const parametros = [evidenciaId];
    if (esTecnico(req)) {
      const asignacion = tecnicoAsignado(req);
      filtros.push(`(${condicionAsignacion(asignacion, parametros.length + 1)})`);
      parametros.push(...asignacion.ids);
    }
    const { rows } = await pool.query(
      `SELECT ev.contenido, ev.mime_type, ev.url, ev.url_archivo
       FROM orden_evidencias ev
       JOIN ordenes_servicio os ON os.id = ev.orden_servicio_id
       WHERE ${filtros.join(' AND ')}`,
      parametros,
    );
    if (!rows[0]) return res.status(404).json({ mensaje: 'Evidencia no encontrada.' });
    if (!rows[0].contenido) {
      const url = rows[0].url || rows[0].url_archivo;
      return res.status(404).json({
        mensaje: 'El archivo está disponible en su URL de almacenamiento.',
        url: url || null,
      });
    }

    res.type(rows[0].mime_type);
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Content-Disposition', 'inline; filename="evidencia"');
    return res.send(rows[0].contenido);
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id/evidencias/:evidenciaId', async (req, res, next) => {
  const ordenId = idValido(req.params.id);
  const evidenciaId = idValido(req.params.evidenciaId);
  if (!ordenId || !evidenciaId) {
    return res.status(400).json({ mensaje: 'El id no es válido.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const filtros = ['os.id = $1'];
    const parametros = [ordenId];
    if (esTecnico(req)) {
      const asignacion = tecnicoAsignado(req);
      filtros.push(`(${condicionAsignacion(asignacion, parametros.length + 1)})`);
      parametros.push(...asignacion.ids);
    }
    const orden = await client.query(
      `SELECT os.id FROM ordenes_servicio os
       WHERE ${filtros.join(' AND ')}
       FOR UPDATE OF os`,
      parametros,
    );
    if (!orden.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Orden de servicio no encontrada.' });
    }

    const { rows } = await client.query(
      `DELETE FROM orden_evidencias
       WHERE id = $1 AND orden_servicio_id = $2
       RETURNING id, tipo, url, url_archivo`,
      [evidenciaId, ordenId],
    );
    if (!rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Evidencia no encontrada.' });
    }

    if (rows[0].tipo === 'Firma') {
      await client.query(
        `UPDATE ordenes_servicio
         SET firma_cliente_url = NULL, fecha_firma = NULL, actualizado_en = now()
         WHERE id = $1 AND firma_cliente_url IS NOT NULL`,
        [ordenId],
      );
    }
    await client.query('COMMIT');
    return res.status(204).end();
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

router.patch('/:id/estado', async (req, res, next) => {
  const ordenId = idValido(req.params.id);
  const datos = req.body || {};
  const estadoId = idValido(datos.estado_id);
  const estadoNombreSolicitado = textoValido(datos.estado) ? datos.estado.trim() : null;
  if (!ordenId || (!estadoId && !estadoNombreSolicitado)) {
    return res.status(400).json({ mensaje: 'El id de la orden y un estado válido son obligatorios.' });
  }
  if (datos.comentario != null && typeof datos.comentario !== 'string') {
    return res.status(400).json({ mensaje: 'comentario debe ser texto.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const ordenResultado = await client.query(
      `SELECT id, tercero_id, tecnico_usuario_id, cliente_id, servicio_id, estado_id
       FROM ordenes_servicio WHERE id = $1 FOR UPDATE`,
      [ordenId],
    );
    const orden = ordenResultado.rows[0];
    if (!orden || !(esOrdenDelTecnico(req, orden)
      || await esOrdenEnAgendaDelTecnico(client, req, orden))) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Orden de servicio no encontrada.' });
    }

    const estadoActual = await nombreEstado(client, ordenId);
    if (ordenFinalizada(estadoActual)) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        mensaje: 'La orden está Finalizada y queda bloqueada. No se puede cambiar su estado.',
      });
    }

    const estadoResultado = estadoId
      ? await client.query(
        'SELECT id, nombre FROM estados_orden_servicio WHERE id = $1',
        [estadoId],
      )
      : await client.query(
        'SELECT id, nombre FROM estados_orden_servicio WHERE lower(nombre) = lower($1)',
        [estadoNombreSolicitado],
      );
    const estadoNuevo = estadoResultado.rows[0];
    const nombreNuevoEstado = estadoNuevo?.nombre;
    if (!nombreNuevoEstado || (!esAdministrador(req) && !estadosTecnico.includes(nombreNuevoEstado))) {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: 'El estado solicitado no es válido para esta cuenta.' });
    }

    await client.query(
      'UPDATE ordenes_servicio SET estado_id = $1, actualizado_en = now() WHERE id = $2',
      [estadoNuevo.id, ordenId],
    );
    await client.query(
      `INSERT INTO historial_estados_orden
         (orden_servicio_id, usuario_id, tercero_id, estado_anterior_id, estado_nuevo_id, comentario)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        ordenId,
        req.usuario.tipoCuenta === 'tercero' ? null : req.usuario.id,
        esTecnico(req) ? (req.usuario.terceroId || (req.usuario.tipoCuenta === 'tercero' ? req.usuario.id : null)) : null,
        orden.estado_id,
        estadoNuevo.id,
        typeof datos.comentario === 'string' ? datos.comentario.trim() || null : null,
      ],
    );
    await sincronizarAgendaDesdeOrden(client, ordenId, nombreNuevoEstado);
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
  const datos = req.body || {};
  const errores = validarOrden(datos);
  if (errores.length) return res.status(400).json({ mensaje: errores.join(' ') });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO ordenes_servicio
         (codigo, cliente_id, servicio_id, fecha_programada, hora_programada,
          direccion, tercero_id, tecnico_usuario_id, prioridad_id, estado_id, descripcion)
       VALUES ($1, $2, $3, $4, $5, $6, $7,
               (SELECT u.id FROM usuarios u
                JOIN terceros tt ON tt.id = $7
                WHERE u.tercero_id = tt.id
                   OR (tt.persona_id IS NOT NULL AND u.persona_id = tt.persona_id)
                ORDER BY (u.tercero_id = tt.id) DESC, (u.estado = 'Activo') DESC, u.id
                LIMIT 1),
               $8, $9, $10)
       RETURNING id`,
      [
        datos.codigo.trim(),
        datos.cliente_id,
        datos.servicio_id,
        datos.fecha_programada || null,
        datos.hora_programada || null,
        datos.direccion?.trim() || '',
        datos.tercero_id,
        datos.prioridad_id,
        datos.estado_id,
        datos.descripcion || null,
      ],
    );
    await client.query(
      `INSERT INTO historial_estados_orden
         (orden_servicio_id, usuario_id, estado_nuevo_id, comentario)
       VALUES ($1, $2, $3, 'Orden creada')`,
      [rows[0].id, req.usuario.id, datos.estado_id],
    );
    await client.query('COMMIT');
    const nuevaOrden = await obtenerOrdenVisible(rows[0].id, req);
    return res.status(201).json(nuevaOrden);
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res, next) => {
  if (!esAdministrador(req)) return res.status(403).json({ mensaje: 'Solo el administrador puede editar órdenes.' });
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ mensaje: 'El id no es válido.' });
  const datos = req.body || {};
  const errores = validarOrden(datos);
  if (errores.length) return res.status(400).json({ mensaje: errores.join(' ') });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const estadoActual = await nombreEstado(client, id);
    if (ordenFinalizada(estadoActual)) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        mensaje: 'La orden está Finalizada y queda bloqueada. Solo se puede consultar.',
      });
    }

    const actual = await client.query(
      'SELECT estado_id FROM ordenes_servicio WHERE id = $1 FOR UPDATE',
      [id],
    );
    if (!actual.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Orden de servicio no encontrada.' });
    }

    const resultado = await client.query(
      `UPDATE ordenes_servicio
       SET codigo = $1, cliente_id = $2, servicio_id = $3, fecha_programada = $4,
           hora_programada = $5, direccion = $6, tercero_id = $7,
           tecnico_usuario_id = (SELECT u.id FROM usuarios u
                JOIN terceros tt ON tt.id = $7
                WHERE u.tercero_id = tt.id
                   OR (tt.persona_id IS NOT NULL AND u.persona_id = tt.persona_id)
                ORDER BY (u.tercero_id = tt.id) DESC, (u.estado = 'Activo') DESC, u.id
                LIMIT 1),
           prioridad_id = $8, estado_id = $9, descripcion = $10,
           actualizado_en = now()
       WHERE id = $11
       RETURNING id`,
      [
        datos.codigo.trim(),
        datos.cliente_id,
        datos.servicio_id,
        datos.fecha_programada || null,
        datos.hora_programada || null,
        datos.direccion?.trim() || '',
        datos.tercero_id,
        datos.prioridad_id,
        datos.estado_id,
        datos.descripcion || null,
        id,
      ],
    );
    if (String(actual.rows[0].estado_id) !== String(datos.estado_id)) {
      await client.query(
        `INSERT INTO historial_estados_orden
           (orden_servicio_id, usuario_id, estado_anterior_id, estado_nuevo_id, comentario)
         VALUES ($1, $2, $3, $4, 'Estado actualizado desde la administración')`,
        [id, req.usuario.id, actual.rows[0].estado_id, datos.estado_id],
      );
    }
    await client.query('COMMIT');
    if (!resultado.rowCount) return res.status(404).json({ mensaje: 'Orden de servicio no encontrada.' });
    return res.json(await obtenerOrdenVisible(id, req));
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

router.delete('/:id', async (req, res, next) => {
  if (!esAdministrador(req)) return res.status(403).json({ mensaje: 'Solo el administrador puede eliminar órdenes.' });
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ mensaje: 'El id no es válido.' });

  try {
    const estadoActual = await nombreEstado(pool, id);
    if (ordenFinalizada(estadoActual)) {
      return res.status(409).json({
        mensaje: 'La orden Finalizada no se puede eliminar.',
      });
    }

    const resultado = await pool.query('DELETE FROM ordenes_servicio WHERE id = $1', [id]);
    if (!resultado.rowCount) return res.status(404).json({ mensaje: 'Orden de servicio no encontrada.' });
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

export default router;
