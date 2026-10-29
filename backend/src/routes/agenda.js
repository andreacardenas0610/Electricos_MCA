import { Router } from 'express';
import { pool } from '../db.js';
import { fechaValida, idValido, textoValido } from '../utils/validacion.js';

const router = Router();
const estados = ['Programada', 'En proceso', 'Completada', 'Cancelada'];
const prioridades = ['Baja', 'Media', 'Alta'];
const bufferMinutos = 30;
const diasMaximos = 60;

function horaActualBogota() {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const valores = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  return `${valores.hour}:${valores.minute}`;
}

function fechaActualBogota() {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const valores = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  return `${valores.year}-${valores.month}-${valores.day}`;
}

const consultaActividades = `
  SELECT a.id, a.codigo, a.cliente_id AS "clienteId",
         c.nombre_razon_social AS cliente, cc.telefono,
         dc.direccion, a.servicio_id AS "servicioId", s.nombre AS servicio,
         a.tercero_id AS "tecnicoId", t.nombre_completo AS tecnico,
         o.id AS "ordenId", o.codigo AS "ordenCodigo", o.estado AS "ordenEstado",
         a.fecha, to_char(a.hora_inicio, 'HH24:MI') AS "horaInicio",
         to_char(a.hora_fin, 'HH24:MI') AS "horaFin", a.horas,
         a.estado, a.prioridad, a.descripcion
  FROM agenda_actividades a
  JOIN clientes c ON c.id = a.cliente_id
  LEFT JOIN contactos_cliente cc ON cc.cliente_id = c.id AND cc.es_principal = TRUE
  LEFT JOIN direcciones_cliente dc ON dc.cliente_id = c.id AND dc.es_principal = TRUE
  JOIN servicios s ON s.id = a.servicio_id
  JOIN terceros t ON t.id = a.tercero_id
  LEFT JOIN LATERAL (
    SELECT os.id, os.codigo, oe.nombre AS estado
    FROM ordenes_servicio os
    JOIN estados_orden_servicio oe ON oe.id = os.estado_id
    WHERE os.cliente_id = a.cliente_id
      AND os.servicio_id = a.servicio_id
    ORDER BY CASE WHEN oe.nombre IN ('Pendiente', 'En Espera de Repuestos') THEN 0 ELSE 1 END,
             os.id DESC
    LIMIT 1
  ) o ON TRUE
`;

// Estados de orden que todavía no tienen fecha de servicio: los que la agenda debe programar.
const estadosAgendables = ['Pendiente', 'En Espera de Repuestos'];

function minutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function horario(fecha) {
  const dia = new Date(`${fecha}T00:00:00Z`).getUTCDay();
  if (dia === 0) return null;
  return dia === 6
    ? { apertura: '08:00', cierre: '13:00' }
    : { apertura: '07:00', cierre: '18:00' };
}

function validar(datos) {
  const errores = [];
  for (const campo of ['clienteId', 'servicioId', 'tecnicoId']) {
    if (!idValido(datos[campo])) errores.push(`${campo} debe ser un id válido.`);
  }
  if (datos.ordenServicioId != null && datos.ordenServicioId !== '' && !idValido(datos.ordenServicioId)) {
    errores.push('ordenServicioId debe ser un id válido.');
  }
  if (!textoValido(datos.fecha) || !fechaValida(datos.fecha)) {
    errores.push('fecha debe tener formato AAAA-MM-DD.');
  }
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(datos.horaInicio || '')) {
    errores.push('horaInicio debe tener formato HH:MM.');
  }
  if (datos.estado && !estados.includes(datos.estado)) errores.push('estado no es válido.');
  if (datos.prioridad && !prioridades.includes(datos.prioridad)) errores.push('prioridad no es válida.');
  if (datos.horas != null
    && (!Number.isFinite(Number(datos.horas))
      || Number(datos.horas) <= 0
      || !Number.isInteger(Number(datos.horas) * 4))) {
    errores.push('horas debe ser mayor que cero y usar incrementos de 15 minutos.');
  }
  return errores;
}

async function validarReferencias(client, datos) {
  const { rows } = await client.query(
    `SELECT c.id AS cliente_id, c.estado AS cliente_estado,
            s.id AS servicio_id, s.estado AS servicio_estado,
            s.horas, s.moneda, t.id AS tercero_id, t.estado AS tercero_estado
     FROM clientes c
     CROSS JOIN servicios s
     CROSS JOIN terceros t
     WHERE c.id = $1 AND s.id = $2 AND t.id = $3`,
    [datos.clienteId, datos.servicioId, datos.tecnicoId],
  );
  const referencia = rows[0];
  if (!referencia) return { error: 'El cliente, servicio o técnico seleccionado no existe.' };
  if (referencia.cliente_estado === 'Inactivo') return { error: 'El cliente seleccionado está inactivo.' };
  if (referencia.tercero_estado !== 'Activo') return { error: 'El técnico seleccionado está inactivo.' };
  if (referencia.servicio_estado === 'Pausado') return { error: 'El servicio seleccionado está pausado.' };
  const horas = Number(datos.horas) || Number(referencia.horas) || 8;
  return { horas };
}

// La agenda se alimenta de la orden de servicio: la orden define el cliente y el servicio,
// y un mismo servicio del cliente no puede quedar agendado dos veces.
async function validarOrden(client, datos, idActual = null) {
  const ordenId = idValido(datos.ordenServicioId);
  if (!ordenId) return {};

  const { rows } = await client.query(
    `SELECT os.id, os.codigo, os.cliente_id, os.servicio_id, e.nombre AS estado
     FROM ordenes_servicio os
     JOIN estados_orden_servicio e ON e.id = os.estado_id
     WHERE os.id = $1`,
    [ordenId],
  );
  const orden = rows[0];
  if (!orden) return { error: 'La orden de servicio seleccionada no existe.' };
  if (String(orden.cliente_id) !== String(datos.clienteId)) {
    return { error: `La orden ${orden.codigo} no pertenece al cliente seleccionado.` };
  }
  if (!estadosAgendables.includes(orden.estado)) {
    return { error: `La orden ${orden.codigo} está ${orden.estado}; solo se agendan las órdenes ${estadosAgendables.join(' o ')}.` };
  }
  if (String(orden.servicio_id) !== String(datos.servicioId)) {
    return { error: `El servicio agendado no corresponde al de la orden ${orden.codigo}.` };
  }

  const { rows: agendada } = await client.query(
    `SELECT codigo FROM agenda_actividades
     WHERE cliente_id = $1
       AND servicio_id = $2
       AND estado IN ('Programada', 'En proceso')
       AND ($3::bigint IS NULL OR id <> $3)
     ORDER BY fecha DESC, hora_inicio DESC
     LIMIT 1`,
    [datos.clienteId, datos.servicioId, idActual],
  );
  if (agendada[0]) {
    return { error: `Ese servicio del cliente ya está agendado en ${agendada[0].codigo}.` };
  }
  return {};
}

// Solo se agenda un servicio que el cliente tenga cotizado y aprobado.
async function validarCotizacion(client, datos) {
  const { rows } = await client.query(
    `SELECT DISTINCT c.codigo, c.estado
     FROM cotizaciones c
     JOIN cotizacion_items ci
       ON ci.cotizacion_codigo = c.codigo AND ci.tipo = 'servicio'
     JOIN servicios s ON s.id = $2
     WHERE c.cliente_id = $1
       AND (ci.referencia_id = s.id::text OR ci.referencia_id = s.codigo)`,
    [datos.clienteId, datos.servicioId],
  );

  if (!rows.length) {
    return { error: 'El servicio no está cotizado a este cliente. Primero registra la cotización.' };
  }

  const aprobada = rows.find((cotizacion) => cotizacion.estado === 'Aprobado');
  if (!aprobada) {
    const pendiente = rows[0];
    return {
      error: `La cotización ${pendiente.codigo} está ${pendiente.estado.toLowerCase()}: el servicio solo se agenda cuando la cotización está aprobada.`,
    };
  }

  return {};
}

async function validarHorario(client, datos, horas, idExcluir = null) {
  const hoy = fechaActualBogota();
  const diasDesdeHoy = Math.floor(
    (Date.parse(`${datos.fecha}T00:00:00Z`) - Date.parse(`${hoy}T00:00:00Z`)) / 86400000,
  );
  if (diasDesdeHoy < 0) return 'No puedes agendar en una fecha pasada.';
  if (diasDesdeHoy > diasMaximos) return `Solo puedes agendar hasta ${diasMaximos} días adelante.`;

  const jornada = horario(datos.fecha);
  if (!jornada) return 'No hay atención los domingos.';

  const horaFinMinutos = minutos(datos.horaInicio) + Number(horas) * 60;
  if (minutos(datos.horaInicio) < minutos(jornada.apertura)) {
    return `El horario inicia a las ${jornada.apertura}.`;
  }
  if (horaFinMinutos > minutos(jornada.cierre)) {
    return `La cita excede el horario de atención (${jornada.apertura} a ${jornada.cierre}).`;
  }
  if (datos.fecha === hoy && minutos(datos.horaInicio) < minutos(horaActualBogota()) + 60) {
    return 'Debes agendar con al menos 60 minutos de anticipación.';
  }

  const { rows } = await client.query(
    `SELECT codigo, to_char(hora_inicio, 'HH24:MI') AS hora_inicio,
            to_char(hora_fin, 'HH24:MI') AS hora_fin
     FROM agenda_actividades
     WHERE fecha = $1 AND tercero_id = $2
       AND estado IN ('Programada', 'En proceso')
       AND ($3::bigint IS NULL OR id <> $3)
       AND (hora_inicio < $4::time + ($5::numeric * interval '1 hour') + interval '30 minutes')
       AND (hora_fin + interval '30 minutes' > $4::time)`,
    [datos.fecha, datos.tecnicoId, idExcluir, datos.horaInicio, horas],
  );
  if (rows[0]) {
    return `El técnico ya tiene ${rows[0].codigo} de ${rows[0].hora_inicio} a ${rows[0].hora_fin}. Deja al menos ${bufferMinutos} min entre servicios.`;
  }
  return null;
}

async function generarCodigo(client) {
  const anio = new Date().getFullYear();
  await client.query("SELECT pg_advisory_xact_lock(hashtext('agenda-codigo'))");
  const { rows } = await client.query(
    'SELECT codigo FROM agenda_actividades WHERE codigo LIKE $1',
    [`AG-${anio}-%`],
  );
  const ultimo = rows.reduce((mayor, row) => {
    const coincidencia = row.codigo.match(new RegExp(`^AG-${anio}-(\\d+)$`));
    return coincidencia ? Math.max(mayor, Number(coincidencia[1])) : mayor;
  }, 0);
  return `AG-${anio}-${String(ultimo + 1).padStart(4, '0')}`;
}

async function obtenerActividad(client, id) {
  const { rows } = await client.query(`${consultaActividades} WHERE a.id = $1`, [id]);
  return rows[0] || null;
}

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`${consultaActividades} ORDER BY a.fecha, a.hora_inicio`);
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

// Órdenes pendientes del cliente: la agenda las llama directamente y adjunta su servicio.
router.get('/ordenes-pendientes', async (req, res, next) => {
  const clienteId = idValido(req.query.clienteId);
  if (!clienteId) return res.status(400).json({ mensaje: 'clienteId no es válido.' });

  try {
    const { rows } = await pool.query(
      `SELECT os.id, os.codigo, os.cliente_id AS "clienteId",
              os.servicio_id AS "servicioId", s.nombre AS servicio, s.horas,
              os.prioridad_id AS "prioridadId", p.nombre AS prioridad,
              os.tercero_id AS "tecnicoId", t.nombre_completo AS tecnico,
              os.estado_id AS "estadoId", e.nombre AS estado,
              to_char(os.fecha_programada, 'YYYY-MM-DD') AS "fechaProgramada",
              os.descripcion,
              a.id AS "agendaId", a.codigo AS "agendaCodigo"
       FROM ordenes_servicio os
       JOIN estados_orden_servicio e ON e.id = os.estado_id
       LEFT JOIN servicios s ON s.id = os.servicio_id
       LEFT JOIN prioridades p ON p.id = os.prioridad_id
       LEFT JOIN terceros t ON t.id = os.tercero_id
       LEFT JOIN LATERAL (
         SELECT ag.id, ag.codigo
         FROM agenda_actividades ag
         WHERE ag.cliente_id = os.cliente_id
           AND ag.servicio_id = os.servicio_id
           AND ag.estado IN ('Programada', 'En proceso')
         ORDER BY ag.fecha DESC, ag.hora_inicio DESC
         LIMIT 1
       ) a ON TRUE
       WHERE os.cliente_id = $1
         AND os.servicio_id IS NOT NULL
         AND e.nombre = ANY($2::varchar[])
       ORDER BY os.id DESC`,
      [clienteId, estadosAgendables],
    );
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

// Servicios que el cliente ya cotizó: la agenda solo programa lo que viene de una
// cotización. Se devuelve el estado de la cotización para avisar cuando no está aprobada.
const consultaServiciosCotizados = `
  SELECT DISTINCT ON (s.id)
         s.id AS "servicioId", s.nombre AS servicio, s.horas, s.categoria,
         c.codigo AS "cotizacionCodigo", c.estado AS "cotizacionEstado",
         to_char(c.fecha_emision, 'YYYY-MM-DD') AS "cotizacionFecha",
         ci.descripcion AS "descripcionItem",
         o.id AS "ordenId", o.codigo AS "ordenCodigo", o.estado AS "ordenEstado",
         a.id AS "agendaId", a.codigo AS "agendaCodigo"
  FROM cotizaciones c
  JOIN cotizacion_items ci
    ON ci.cotizacion_codigo = c.codigo AND ci.tipo = 'servicio'
  JOIN servicios s
    ON s.id::text = ci.referencia_id OR s.codigo = ci.referencia_id
  LEFT JOIN LATERAL (
    SELECT os.id, os.codigo, oe.nombre AS estado
    FROM ordenes_servicio os
    JOIN estados_orden_servicio oe ON oe.id = os.estado_id
    WHERE os.cliente_id = c.cliente_id AND os.servicio_id = s.id
    ORDER BY CASE WHEN oe.nombre = ANY($2::varchar[]) THEN 0 ELSE 1 END, os.id DESC
    LIMIT 1
  ) o ON TRUE
  LEFT JOIN LATERAL (
    SELECT ag.id, ag.codigo
    FROM agenda_actividades ag
    WHERE ag.cliente_id = c.cliente_id AND ag.servicio_id = s.id
      AND ag.estado IN ('Programada', 'En proceso')
    ORDER BY ag.fecha DESC, ag.hora_inicio DESC
    LIMIT 1
  ) a ON TRUE
  WHERE c.cliente_id = $1
  ORDER BY s.id,
           CASE WHEN c.estado = 'Aprobado' THEN 0 ELSE 1 END,
           c.fecha_emision DESC
`;

router.get('/servicios-cotizados', async (req, res, next) => {
  const clienteId = idValido(req.query.clienteId);
  if (!clienteId) return res.status(400).json({ mensaje: 'clienteId no es válido.' });

  try {
    const { rows } = await pool.query(consultaServiciosCotizados, [clienteId, estadosAgendables]);
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ mensaje: 'El id no es válido.' });
  try {
    const actividad = await obtenerActividad(pool, id);
    if (!actividad) return res.status(404).json({ mensaje: 'Actividad no encontrada.' });
    return res.json(actividad);
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
    await client.query(
      'SELECT pg_advisory_xact_lock(hashtext($1))',
      [`agenda:${datos.fecha}:${datos.tecnicoId}`],
    );
    const referencia = await validarReferencias(client, datos);
    if (referencia.error) {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: referencia.error });
    }
    const conflicto = await validarHorario(client, datos, referencia.horas);
    if (conflicto) {
      await client.query('ROLLBACK');
      return res.status(409).json({ mensaje: conflicto });
    }
    const orden = await validarOrden(client, datos);
    if (orden.error) {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: orden.error });
    }
    const cotizacion = await validarCotizacion(client, datos);
    if (cotizacion.error) {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: cotizacion.error });
    }
    const horaFin = `${String(Math.floor((minutos(datos.horaInicio) + referencia.horas * 60) / 60)).padStart(2, '0')}:${String((minutos(datos.horaInicio) + referencia.horas * 60) % 60).padStart(2, '0')}`;
    const codigo = await generarCodigo(client);
    const { rows } = await client.query(
      `INSERT INTO agenda_actividades
         (codigo, cliente_id, servicio_id, tercero_id, fecha, hora_inicio, hora_fin,
          horas, estado, prioridad, descripcion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        codigo, datos.clienteId, datos.servicioId, datos.tecnicoId, datos.fecha,
        datos.horaInicio, horaFin, referencia.horas, datos.estado || 'Programada',
        datos.prioridad || 'Media', datos.descripcion || '',
      ],
    );
    const actividad = await obtenerActividad(client, rows[0].id);
    await client.query('COMMIT');
    return res.status(201).json(actividad);
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res, next) => {
  const id = idValido(req.params.id);
  const datos = req.body || {};
  if (!id) return res.status(400).json({ mensaje: 'El id no es válido.' });
  const errores = validar(datos);
  if (errores.length) return res.status(400).json({ mensaje: errores.join(' ') });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const actual = await client.query(
      'SELECT id, estado, cliente_id, servicio_id FROM agenda_actividades WHERE id = $1 FOR UPDATE',
      [id],
    );
    if (!actual.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Actividad no encontrada.' });
    }
    // Un servicio finalizado queda quemado: no se vuelve a editar.
    if (actual.rows[0].estado === 'Completada') {
      await client.query('ROLLBACK');
      return res.status(409).json({
        mensaje: 'El servicio ya está Completada y queda bloqueada. Solo se puede consultar.',
      });
    }
    await client.query(
      'SELECT pg_advisory_xact_lock(hashtext($1))',
      [`agenda:${datos.fecha}:${datos.tecnicoId}`],
    );
    const referencia = await validarReferencias(client, datos);
    if (referencia.error) {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: referencia.error });
    }
    const conflicto = await validarHorario(client, datos, referencia.horas, id);
    if (conflicto) {
      await client.query('ROLLBACK');
      return res.status(409).json({ mensaje: conflicto });
    }
    const orden = await validarOrden(client, datos, id);
    if (orden.error) {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: orden.error });
    }
    // Las agendas históricas sin cotización se pueden seguir editando (fecha, técnico,
    // horario); si se cambia el servicio o el cliente, sí exige cotización aprobada.
    const cambiaServicio = String(actual.rows[0].cliente_id) !== String(datos.clienteId)
      || String(actual.rows[0].servicio_id) !== String(datos.servicioId);
    if (cambiaServicio) {
      const cotizacion = await validarCotizacion(client, datos);
      if (cotizacion.error) {
        await client.query('ROLLBACK');
        return res.status(400).json({ mensaje: cotizacion.error });
      }
    }
    const minutosFin = minutos(datos.horaInicio) + referencia.horas * 60;
    const horaFin = `${String(Math.floor(minutosFin / 60)).padStart(2, '0')}:${String(minutosFin % 60).padStart(2, '0')}`;
    await client.query(
      `UPDATE agenda_actividades
       SET cliente_id = $1, servicio_id = $2, tercero_id = $3, fecha = $4,
           hora_inicio = $5, hora_fin = $6, horas = $7, estado = $8,
           prioridad = $9, descripcion = $10, actualizado_en = now()
       WHERE id = $11`,
      [
        datos.clienteId, datos.servicioId, datos.tecnicoId, datos.fecha,
        datos.horaInicio, horaFin, referencia.horas, datos.estado || 'Programada',
        datos.prioridad || 'Media', datos.descripcion || '', id,
      ],
    );
    const actividad = await obtenerActividad(client, id);
    await client.query('COMMIT');
    return res.json(actividad);
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

router.patch('/:id/estado', async (req, res, next) => {
  const id = idValido(req.params.id);
  const { estado } = req.body || {};
  if (!id) return res.status(400).json({ mensaje: 'El id no es válido.' });
  if (!estados.includes(estado)) return res.status(400).json({ mensaje: 'estado no es válido.' });
  try {
    const { rows: existente } = await pool.query('SELECT estado FROM agenda_actividades WHERE id = $1', [id]);
    if (!existente[0]) return res.status(404).json({ mensaje: 'Actividad no encontrada.' });
    if (existente[0].estado === 'Completada' && estado !== 'Completada') {
      return res.status(409).json({
        mensaje: 'El servicio ya está Completada y queda bloqueada. No se puede cambiar su estado.',
      });
    }

    const resultado = await pool.query(
      `UPDATE agenda_actividades SET estado = $1, actualizado_en = now()
       WHERE id = $2 RETURNING id`,
      [estado, id],
    );
    if (!resultado.rowCount) return res.status(404).json({ mensaje: 'Actividad no encontrada.' });
    return res.json(await obtenerActividad(pool, id));
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ mensaje: 'El id no es válido.' });
  try {
    const { rows: existente } = await pool.query('SELECT estado FROM agenda_actividades WHERE id = $1', [id]);
    if (!existente[0]) return res.status(404).json({ mensaje: 'Actividad no encontrada.' });
    if (existente[0].estado === 'Completada') {
      return res.status(409).json({
        mensaje: 'El servicio Completada está finalizado y no se puede eliminar.',
      });
    }

    const resultado = await pool.query('DELETE FROM agenda_actividades WHERE id = $1', [id]);
    if (!resultado.rowCount) return res.status(404).json({ mensaje: 'Actividad no encontrada.' });
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

export default router;
