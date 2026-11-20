import { fechaISO, numero } from './base.js';
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

export const ESTADOS_AGENDA = ['Programada', 'En proceso', 'Completada', 'Cancelada'];
export const PRIORIDADES_AGENDA = ['Baja', 'Media', 'Alta'];

const ESTADOS_ACTIVOS = ['Programada', 'En proceso', 'En ejecución', 'En Ejecución'];
export const PASO_SLOTS_MINUTOS = 30;

export function slotsDelDia(fecha, duracionMinutos) {
  const horario = horarioDelDia(fecha);
  if (!horario || duracionMinutos <= 0) return [];

  const apertura = horaAMinutos(horario.apertura);
  const cierre = horaAMinutos(horario.cierre);
  let desde = apertura;

  if (fecha === fechaISO()) {
    const ahora = new Date();
    const minimo = ahora.getHours() * 60 + ahora.getMinutes() + MARGEN_MINIMO_AGENDA_MINUTOS;
    desde = Math.max(apertura, Math.ceil(minimo / PASO_SLOTS_MINUTOS) * PASO_SLOTS_MINUTOS);
  }

  const slots = [];
  for (let inicio = desde; inicio + duracionMinutos <= cierre; inicio += PASO_SLOTS_MINUTOS) {
    slots.push({
      minutos: inicio,
      hora: minutosAHora(inicio),
      horaFin: minutosAHora(inicio + duracionMinutos),
    });
  }
  return slots;
}

export function intervalosDelTecnico(actividades, fecha, tecnicoId, idExcluir = null) {
  return actividades
    .filter((actividad) => (
      actividad.fecha === fecha
      && String(actividad.tecnicoId) === String(tecnicoId)
      && ESTADOS_ACTIVOS.includes(actividad.estado)
      && String(actividad.id) !== String(idExcluir ?? '')
    ))
    .map((actividad) => ({
      inicio: horaAMinutos(actividad.horaInicio),
      fin: horaAMinutos(actividad.horaFin),
      codigo: actividad.codigo,
    }));
}

export function seCruzan(inicio, fin, inicioOcupado, finOcupado) {
  return inicio < finOcupado + BUFFER_ENTRE_SERVICIOS_MINUTOS
    && inicioOcupado < fin + BUFFER_ENTRE_SERVICIOS_MINUTOS;
}

export function estadoSiguienteAgenda(estado) {
  const indice = ESTADOS_AGENDA.indexOf(estado);
  return ESTADOS_AGENDA[(indice + 1) % ESTADOS_AGENDA.length] || ESTADOS_AGENDA[0];
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
  ) || null;
  const horas = numero(datos.horas, horasServicio(servicio));
  const horaFin = sumarMinutosAHora(datos.horaInicio || '08:00', horas * 60);

  if (!datos.clienteId) agregarError(errores, 'clienteId', 'Selecciona el cliente.');
  if (!datos.servicioId) agregarError(errores, 'servicioId', 'Selecciona el servicio a agendar.');
  if (!datos.tecnicoId) agregarError(errores, 'tecnicoId', 'Selecciona el técnico responsable.');
  if (!datos.fecha) agregarError(errores, 'fecha', 'Selecciona la fecha del servicio.');
  if (!datos.horaInicio) agregarError(errores, 'horaInicio', 'Selecciona la hora de inicio.');

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
        const diferenciaMinutos = (fechaConHora(datos.fecha, datos.horaInicio) - new Date()) / 60000;
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

  if (
    datos.fecha
    && datos.horaInicio
    && datos.tecnicoId
    && ESTADOS_ACTIVOS.includes(datos.estado || 'Programada')
  ) {
    const inicioNuevo = horaAMinutos(datos.horaInicio);
    const finNuevo = horaAMinutos(horaFin);
    const conflicto = (contexto.actividades || []).find((actividad) => {
      if (String(actividad.id) === String(idExcluir)) return false;
      if (String(actividad.tecnicoId) !== String(datos.tecnicoId)) return false;
      if (actividad.fecha !== datos.fecha || !ESTADOS_ACTIVOS.includes(actividad.estado)) return false;

      return inicioNuevo < horaAMinutos(actividad.horaFin) + BUFFER_ENTRE_SERVICIOS_MINUTOS
        && horaAMinutos(actividad.horaInicio) < finNuevo + BUFFER_ENTRE_SERVICIOS_MINUTOS;
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

export function buscarActividades(texto, actividades = []) {
  const termino = String(texto || '').trim().toLowerCase();
  if (!termino) return actividades;

  return actividades.filter((actividad) => (
    `${actividad.codigo || ''} ${actividad.cliente || ''} ${actividad.servicio || ''} `
    + `${actividad.tecnico || ''} ${actividad.descripcion || ''}`
  ).toLowerCase().includes(termino));
}

export function resumenAgenda(actividades) {
  return actividades.reduce(
    (resumen, actividad) => {
      resumen.total += 1;
      if (actividad.estado === 'Programada') resumen.programadas += 1;
      if (['En proceso', 'En ejecución', 'En Ejecución'].includes(actividad.estado)) resumen.proceso += 1;
      if (actividad.estado === 'Completada') resumen.completadas += 1;
      if (actividad.estado === 'Cancelada') resumen.canceladas += 1;
      return resumen;
    },
    { total: 0, programadas: 0, proceso: 0, completadas: 0, canceladas: 0 },
  );
}

export function validarAgendaCompleta(actividades = []) {
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

      if (seCruzan(
        horaAMinutos(a.horaInicio),
        horaAMinutos(a.horaFin),
        horaAMinutos(b.horaInicio),
        horaAMinutos(b.horaFin),
      )) {
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

export { HORARIO_ATENCION, MARGEN_MINIMO_AGENDA_MINUTOS, minutosAHora };
