import { hasStore, numero, readStore, writeStore, fechaISO, sumarDias } from './base.js';
import {
  BUFFER_ENTRE_SERVICIOS_MINUTOS,
  DIAS_MAXIMOS_AGENDA,
  HORARIO_ATENCION,
  MARGEN_MINIMO_AGENDA_MINUTOS,
  fechaConHora,
  horaAMinutos,
  horarioDelDia,
  horasServicio,
  minutosAHora,
  nombreDia,
  sumarMinutosAHora,
} from './catalogos.js';
import { obtenerCliente } from './clientesService.js';
import { obtenerServicio } from './serviciosService.js';
import { obtenerTecnicosActivos } from './tercerosService.js';

export const AGENDA_KEY = 'mca_agenda_actividades';
export const ESTADOS_AGENDA = ['Programada', 'En proceso', 'Completada', 'Cancelada'];
export const PRIORIDADES_AGENDA = ['Baja', 'Media', 'Alta'];

const ESTADOS_ACTIVOS = ['Programada', 'En proceso'];

export function estadoSiguienteAgenda(estado) {
  const indice = ESTADOS_AGENDA.indexOf(estado);
  return ESTADOS_AGENDA[(indice + 1) % ESTADOS_AGENDA.length] || ESTADOS_AGENDA[0];
}

function diaHabilDesplazado(dias, base = new Date()) {
  const fecha = new Date(base);
  let restantes = Math.abs(Number(dias) || 0);
  const direccion = Number(dias) < 0 ? -1 : 1;

  while (restantes > 0) {
    fecha.setDate(fecha.getDate() + direccion);
    const dia = fecha.getDay();
    if (dia !== 0 && dia !== 6) restantes -= 1;
  }
  return fechaISO(fecha);
}

function normalizarActividad(actividad) {
  const servicio = obtenerServicio(actividad.servicioId);
  const horas = numero(actividad.horas, horasServicio(servicio));
  const horaInicio = actividad.horaInicio || '08:00';

  return {
    ...actividad,
    id: actividad.id,
    codigo: actividad.codigo || `AG-${new Date().getFullYear()}-0000`,
    clienteId: actividad.clienteId ?? '',
    cliente: actividad.cliente || 'Cliente sin nombre',
    telefono: actividad.telefono || '',
    direccion: actividad.direccion || '',
    servicioId: actividad.servicioId ?? '',
    servicio: actividad.servicio || servicio?.nombre || 'Servicio',
    horas,
    tecnicoId: actividad.tecnicoId ?? '',
    tecnico: actividad.tecnico || 'Sin asignar',
    fecha: actividad.fecha || fechaISO(),
    horaInicio,
    horaFin: actividad.horaFin || sumarMinutosAHora(horaInicio, horas * 60),
    estado: ESTADOS_AGENDA.includes(actividad.estado) ? actividad.estado : 'Programada',
    prioridad: PRIORIDADES_AGENDA.includes(actividad.prioridad) ? actividad.prioridad : 'Media',
    descripcion: actividad.descripcion || '',
  };
}

function crearSemilla() {
  const anio = new Date().getFullYear();

  const semillas = [
    {
      id: 1,
      codigo: `AG-${anio}-0001`,
      clienteId: 1,
      servicioId: 1,
      tecnicoId: 1,
      fecha: diaHabilDesplazado(1),
      horaInicio: '08:00',
      estado: 'Programada',
      prioridad: 'Alta',
      descripcion: 'Montaje de tablero principal y pruebas de continuidad.',
    },
    {
      id: 2,
      codigo: `AG-${anio}-0002`,
      clienteId: 2,
      servicioId: 2,
      tecnicoId: 2,
      fecha: diaHabilDesplazado(2),
      horaInicio: '09:00',
      estado: 'Programada',
      prioridad: 'Media',
      descripcion: 'Reapriete de conexiones y limpieza de tableros.',
    },
    {
      id: 3,
      codigo: `AG-${anio}-0003`,
      clienteId: 3,
      servicioId: 3,
      tecnicoId: 3,
      fecha: diaHabilDesplazado(4),
      horaInicio: '08:00',
      estado: 'Programada',
      prioridad: 'Alta',
      descripcion: 'Medición de pozo a tierra y emisión de certificado.',
    },
    {
      id: 4,
      codigo: `AG-${anio}-0004`,
      clienteId: 4,
      servicioId: 4,
      tecnicoId: 1,
      fecha: diaHabilDesplazado(5),
      horaInicio: '07:00',
      estado: 'Programada',
      prioridad: 'Baja',
      descripcion: 'Cambio de luminarias en zonas comunes.',
    },
    {
      id: 5,
      codigo: `AG-${anio}-0005`,
      clienteId: 5,
      servicioId: 6,
      tecnicoId: 2,
      fecha: diaHabilDesplazado(-3),
      horaInicio: '08:00',
      estado: 'Completada',
      prioridad: 'Media',
      descripcion: 'Diagnóstico de fallas en circuito de alimentación.',
    },
    {
      id: 6,
      codigo: `AG-${anio}-0006`,
      clienteId: 6,
      servicioId: 5,
      tecnicoId: 3,
      fecha: diaHabilDesplazado(7),
      horaInicio: '08:00',
      estado: 'Programada',
      prioridad: 'Media',
      descripcion: 'Instalación de red eléctrica en área administrativa.',
    },
  ];

  return semillas.map((semilla) => {
    const cliente = obtenerCliente(semilla.clienteId);
    const servicio = obtenerServicio(semilla.servicioId);
    const tecnico = obtenerTecnicosActivos().find(
      (item) => String(item.id) === String(semilla.tecnicoId),
    );

    return normalizarActividad({
      ...semilla,
      cliente: cliente?.nombre || '',
      telefono: cliente?.telefono || '',
      direccion: cliente?.direccion || '',
      servicio: servicio?.nombre || '',
      tecnico: tecnico?.nombre || '',
      horas: horasServicio(servicio),
    });
  });
}

export function obtenerActividades() {
  const guardadas = readStore(AGENDA_KEY, null);
  const base = Array.isArray(guardadas) ? guardadas : crearSemilla();
  return base
    .map(normalizarActividad)
    .sort((a, b) => `${a.fecha} ${a.horaInicio}`.localeCompare(`${b.fecha} ${b.horaInicio}`));
}

export function generarCodigoActividad(actividades = obtenerActividades()) {
  const anio = new Date().getFullYear();
  const patron = new RegExp(`^AG-${anio}-(\\d+)$`, 'i');
  const ultimo = actividades.reduce((mayor, actividad) => {
    const coincidencia = String(actividad.codigo).match(patron);
    return coincidencia ? Math.max(mayor, Number(coincidencia[1])) : mayor;
  }, 0);

  return `AG-${anio}-${String(ultimo + 1).padStart(4, '0')}`;
}

function agregarError(errores, campo, mensaje) {
  if (!errores[campo]) errores[campo] = [];
  errores[campo].push(mensaje);
}

export function validarCita(datos, idExcluir = null, contexto = {}) {
  const errores = {};
  const mensajes = [];
  const servicio = contexto.servicios?.find(
    (item) => String(item.id) === String(datos.servicioId),
  ) || obtenerServicio(datos.servicioId);
  const horas = numero(datos.horas, horasServicio(servicio));
  const horaFin = sumarMinutosAHora(datos.horaInicio || '08:00', horas * 60);

  if (!datos.clienteId) {
    agregarError(errores, 'clienteId', 'Selecciona el cliente.');
  }
  if (!datos.servicioId) {
    agregarError(errores, 'servicioId', 'Selecciona el servicio a agendar.');
  }
  if (!datos.tecnicoId) {
    agregarError(errores, 'tecnicoId', 'Selecciona el técnico responsable.');
  }
  if (!datos.fecha) {
    agregarError(errores, 'fecha', 'Selecciona la fecha del servicio.');
  }
  if (!datos.horaInicio) {
    agregarError(errores, 'horaInicio', 'Selecciona la hora de inicio.');
  }

  if (datos.fecha) {
    const hoy = fechaISO();
    if (datos.fecha < hoy) {
      agregarError(errores, 'fecha', 'No puedes agendar en una fecha pasada.');
    }

    const diasDiferencia = Math.round(
      (fechaConHora(datos.fecha, '00:00') - fechaConHora(hoy, '00:00')) / 86400000,
    );
    if (diasDiferencia > DIAS_MAXIMOS_AGENDA) {
      agregarError(errores, 'fecha', `Solo puedes agendar hasta ${DIAS_MAXIMOS_AGENDA} días adelante.`);
    }

    const horario = horarioDelDia(datos.fecha);
    if (!horario) {
      agregarError(errores, 'fecha', `No hay atención el ${nombreDia(datos.fecha).toLowerCase()}.`);
    }

    if (datos.horaInicio && horario) {
      const inicio = horaAMinutos(datos.horaInicio);
      const fin = horaAMinutos(horaFin);
      const apertura = horaAMinutos(horario.apertura);
      const cierre = horaAMinutos(horario.cierre);

      if (inicio < apertura) {
        agregarError(errores, 'horaInicio', `El horario inicia a las ${horario.apertura}.`);
      }
      if (fin > cierre) {
        agregarError(
          errores,
          'horaInicio',
          `El servicio termina a las ${horaFin} y el cierre es a las ${horario.cierre}.`,
        );
      }

      if (datos.fecha === hoy) {
        const ahora = new Date();
        const inicioCita = fechaConHora(datos.fecha, datos.horaInicio);
        const diferenciaMinutos = (inicioCita - ahora) / 60000;
        if (diferenciaMinutos < MARGEN_MINIMO_AGENDA_MINUTOS) {
          agregarError(
            errores,
            'horaInicio',
            `Debes agendar con al menos ${MARGEN_MINIMO_AGENDA_MINUTOS} minutos de anticipación.`,
          );
        }
      }
    }
  }

  if (datos.fecha && datos.horaInicio && datos.tecnicoId && ESTADOS_ACTIVOS.includes(datos.estado || 'Programada')) {
    const inicioNuevo = horaAMinutos(datos.horaInicio);
    const finNuevo = horaAMinutos(horaFin);

    const actividades = contexto.actividades || obtenerActividades();
    const conflicto = actividades.find((actividad) => {
      if (String(actividad.id) === String(idExcluir)) return false;
      if (String(actividad.tecnicoId) !== String(datos.tecnicoId)) return false;
      if (actividad.fecha !== datos.fecha) return false;
      if (!ESTADOS_ACTIVOS.includes(actividad.estado)) return false;

      const inicioExistente = horaAMinutos(actividad.horaInicio);
      const finExistente = horaAMinutos(actividad.horaFin);

      return inicioNuevo < finExistente + BUFFER_ENTRE_SERVICIOS_MINUTOS
        && inicioExistente < finNuevo + BUFFER_ENTRE_SERVICIOS_MINUTOS;
    });

    if (conflicto) {
      agregarError(
        errores,
        'tecnicoId',
        `El técnico ya tiene ${conflicto.codigo} de ${conflicto.horaInicio} a ${conflicto.horaFin}. Deja al menos ${BUFFER_ENTRE_SERVICIOS_MINUTOS} min entre servicios.`,
      );
    }
  }

  Object.values(errores).forEach((lista) => mensajes.push(...lista));

  return { errores, mensajes, horaFin, horas };
}

export function guardarActividad(datos, idOriginal = null) {
  const actividades = obtenerActividades();
  const cliente = obtenerCliente(datos.clienteId);
  const servicio = obtenerServicio(datos.servicioId);
  const tecnico = obtenerTecnicosActivos().find(
    (item) => String(item.id) === String(datos.tecnicoId),
  );

  if (!cliente) throw new Error('Selecciona un cliente válido.');
  if (!servicio) throw new Error('Selecciona un servicio válido.');
  if (!tecnico) throw new Error('Selecciona un técnico activo.');

  const { errores, mensajes, horaFin, horas } = validarCita(
    { ...datos, estado: datos.estado || 'Programada' },
    idOriginal,
  );
  if (mensajes.length) {
    const error = new Error(mensajes[0]);
    error.errores = errores;
    throw error;
  }

  const base = {
    ...datos,
    clienteId: cliente.id,
    cliente: cliente.nombre,
    telefono: cliente.telefono,
    direccion: cliente.direccion,
    servicioId: servicio.id,
    servicio: servicio.nombre,
    horas,
    tecnicoId: tecnico.id,
    tecnico: tecnico.nombre,
    horaFin,
  };

  if (idOriginal) {
    const existente = actividades.find((actividad) => String(actividad.id) === String(idOriginal));
    if (!existente) throw new Error('No se encontró la actividad a editar.');

    const actualizada = normalizarActividad({
      ...existente,
      ...base,
      id: existente.id,
      codigo: existente.codigo,
      actualizadoEn: new Date().toISOString(),
    });

    writeStore(
      AGENDA_KEY,
      actividades.map((actividad) => (
        String(actividad.id) === String(actualizada.id) ? actualizada : actividad
      )),
    );
    return actualizada;
  }

  const nueva = normalizarActividad({
    ...base,
    id: Date.now(),
    codigo: generarCodigoActividad(actividades),
    estado: datos.estado || 'Programada',
    prioridad: datos.prioridad || 'Media',
    creadoEn: new Date().toISOString(),
  });

  writeStore(AGENDA_KEY, [...actividades, nueva]);
  return nueva;
}

export function cambiarEstadoActividad(id) {
  const actividades = obtenerActividades();
  const actividad = actividades.find((item) => String(item.id) === String(id));
  if (!actividad) throw new Error('No se encontró la actividad.');

  const actualizada = {
    ...actividad,
    estado: estadoSiguienteAgenda(actividad.estado),
  };

  writeStore(
    AGENDA_KEY,
    actividades.map((item) => (String(item.id) === String(id) ? actualizada : item)),
  );
  return actualizada;
}

export function eliminarActividad(id) {
  const actividades = obtenerActividades();
  if (!actividades.some((actividad) => String(actividad.id) === String(id))) {
    throw new Error('No se encontró la actividad.');
  }
  writeStore(AGENDA_KEY, actividades.filter((actividad) => String(actividad.id) !== String(id)));
}

export function buscarActividades(texto, actividades = obtenerActividades()) {
  const termino = String(texto || '').trim().toLowerCase();
  if (!termino) return actividades;

  return actividades.filter((actividad) => (
    `${actividad.codigo} ${actividad.cliente} ${actividad.servicio} ${actividad.tecnico} ${actividad.descripcion}`
      .toLowerCase()
      .includes(termino)
  ));
}

export function resumenAgenda(actividades) {
  return actividades.reduce(
    (resumen, actividad) => {
      resumen.total += 1;
      if (actividad.estado === 'Programada') resumen.programadas += 1;
      if (actividad.estado === 'En proceso') resumen.proceso += 1;
      if (actividad.estado === 'Completada') resumen.completadas += 1;
      if (actividad.estado === 'Cancelada') resumen.canceladas += 1;
      return resumen;
    },
    { total: 0, programadas: 0, proceso: 0, completadas: 0, canceladas: 0 },
  );
}

export function validarAgendaCompleta(actividades = obtenerActividades()) {
  const incidencias = [];
  const hoy = fechaISO();
  const activas = actividades.filter((actividad) => ESTADOS_ACTIVOS.includes(actividad.estado));

  activas.forEach((actividad) => {
    const horario = horarioDelDia(actividad.fecha);

    if (!horario) {
      incidencias.push({
        id: actividad.id,
        codigo: actividad.codigo,
        cliente: actividad.cliente,
        severidad: 'error',
        mensaje: `Está agendada un ${nombreDia(actividad.fecha).toLowerCase()}, día sin atención.`,
      });
      return;
    }

    const inicio = horaAMinutos(actividad.horaInicio);
    const fin = horaAMinutos(actividad.horaFin);

    if (inicio < horaAMinutos(horario.apertura) || fin > horaAMinutos(horario.cierre)) {
      incidencias.push({
        id: actividad.id,
        codigo: actividad.codigo,
        cliente: actividad.cliente,
        severidad: 'error',
        mensaje: `Queda fuera del horario permitido (${horario.apertura} a ${horario.cierre}).`,
      });
    }

    if (actividad.fecha < hoy) {
      incidencias.push({
        id: actividad.id,
        codigo: actividad.codigo,
        cliente: actividad.cliente,
        severidad: 'advertencia',
        mensaje: 'Quedó en una fecha pasada y sigue activa.',
      });
    }
  });

  for (let i = 0; i < activas.length; i += 1) {
    for (let j = i + 1; j < activas.length; j += 1) {
      const a = activas[i];
      const b = activas[j];
      if (a.fecha !== b.fecha || String(a.tecnicoId) !== String(b.tecnicoId)) continue;

      const inicioA = horaAMinutos(a.horaInicio);
      const finA = horaAMinutos(a.horaFin);
      const inicioB = horaAMinutos(b.horaInicio);
      const finB = horaAMinutos(b.horaFin);

      if (
        inicioA < finB + BUFFER_ENTRE_SERVICIOS_MINUTOS
        && inicioB < finA + BUFFER_ENTRE_SERVICIOS_MINUTOS
      ) {
        incidencias.push({
          id: a.id,
          codigo: `${a.codigo} / ${b.codigo}`,
          cliente: a.tecnico,
          severidad: 'error',
          mensaje: `Servicios cruzados para ${a.tecnico} el ${a.fecha}: ${a.horaInicio}-${a.horaFin} y ${b.horaInicio}-${b.horaFin}.`,
        });
      }
    }
  }

  return incidencias;
}

export function asegurarAgenda() {
  if (!hasStore(AGENDA_KEY)) {
    writeStore(AGENDA_KEY, crearSemilla());
  }
}

export { HORARIO_ATENCION, MARGEN_MINIMO_AGENDA_MINUTOS, minutosAHora, sumarDias };
