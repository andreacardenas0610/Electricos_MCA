import { fechaISO, hasStore, numero, readStore, sumarDias, writeStore } from './base.js';
import { obtenerCliente } from './clientesService.js';
import { obtenerServicio } from './serviciosService.js';
import { obtenerTecnicos } from './tercerosService.js';

export const ORDENES_KEY = 'mca_local_ordenes';

export const PRIORIDADES_ORDEN = [
  { id: 1, nombre: 'Baja' },
  { id: 2, nombre: 'Media' },
  { id: 3, nombre: 'Alta' },
];

export const ESTADOS_ORDEN = [
  { id: 1, nombre: 'Pendiente' },
  { id: 2, nombre: 'Programada' },
  { id: 3, nombre: 'En ejecución' },
  { id: 4, nombre: 'Finalizada' },
  { id: 5, nombre: 'Cancelada' },
];

const ESTADOS_CON_FECHA = ['Programada', 'En ejecución'];
const ESTADOS_CERRADOS = ['Finalizada', 'Cancelada'];

function crearSemilla() {
  const anio = new Date().getFullYear();
  const filas = [
    {
      cliente_id: 1,
      servicio_id: 1,
      tercero_id: 1,
      prioridad_id: 3,
      estado_id: 2,
      fecha_programada: sumarDias(1),
      descripcion: 'Montaje de tablero principal y pruebas de continuidad.',
    },
    {
      cliente_id: 2,
      servicio_id: 2,
      tercero_id: 2,
      prioridad_id: 2,
      estado_id: 2,
      fecha_programada: sumarDias(3),
      descripcion: 'Mantenimiento semestral de tableros de distribución.',
    },
    {
      cliente_id: 3,
      servicio_id: 5,
      tercero_id: 3,
      prioridad_id: 3,
      estado_id: 1,
      fecha_programada: null,
      descripcion: 'Pendiente de confirmar fecha con el cliente.',
    },
    {
      cliente_id: 4,
      servicio_id: 4,
      tercero_id: 1,
      prioridad_id: 1,
      estado_id: 4,
      fecha_programada: sumarDias(-4),
      descripcion: 'Cambio de luminarias en zonas comunes finalizado.',
    },
    {
      cliente_id: 5,
      servicio_id: 6,
      tercero_id: 2,
      prioridad_id: 2,
      estado_id: 5,
      fecha_programada: null,
      descripcion: 'El cliente reprogramará la visita.',
    },
  ];

  return filas.map((fila, indice) => ({
    id: indice + 1,
    codigo: `OS-${anio}-${String(indice + 1).padStart(4, '0')}`,
    ...fila,
  }));
}

export function normalizarOrden(orden) {
  const cliente = obtenerCliente(orden.cliente_id ?? orden.clienteId);
  const servicio = obtenerServicio(orden.servicio_id ?? orden.servicioId);
  const tecnico = obtenerTecnicos().find(
    (item) => String(item.id) === String(orden.tercero_id ?? orden.responsableId),
  );
  const prioridad = PRIORIDADES_ORDEN.find(
    (item) => Number(item.id) === Number(orden.prioridad_id),
  );
  const estado = ESTADOS_ORDEN.find(
    (item) => Number(item.id) === Number(orden.estado_id),
  );

  return {
    ...orden,
    id: orden.id,
    codigo: orden.codigo || `OS-${new Date().getFullYear()}-0000`,
    clienteId: String(orden.cliente_id ?? orden.clienteId ?? ''),
    cliente: cliente?.nombre || orden.cliente || 'Cliente sin nombre',
    clienteDocumento: cliente?.documento || '',
    clienteTelefono: cliente?.telefono || '',
    clienteDireccion: cliente?.direccion || '',
    servicioId: String(orden.servicio_id ?? orden.servicioId ?? ''),
    servicio: servicio?.nombre || orden.servicio || 'Servicio',
    servicioHoras: numero(servicio?.horas),
    responsableId: String(orden.tercero_id ?? orden.responsableId ?? ''),
    responsable: tecnico?.nombre || orden.responsable || 'Sin asignar',
    prioridadId: String(prioridad?.id || orden.prioridad_id || 2),
    prioridad: prioridad?.nombre || orden.prioridad || 'Media',
    estadoId: String(estado?.id || orden.estado_id || 1),
    estado: estado?.nombre || orden.estado || 'Pendiente',
    fecha: orden.fecha_programada || orden.fecha || '',
    descripcion: orden.descripcion || '',
  };
}

function leerOrdenesCrudas() {
  const guardadas = readStore(ORDENES_KEY, null);
  return Array.isArray(guardadas) ? guardadas : crearSemilla();
}

function siguienteId(ordenes) {
  return ordenes.reduce((mayor, orden) => Math.max(mayor, Number(orden.id) || 0), 0) + 1;
}

export function obtenerOrdenes() {
  return leerOrdenesCrudas()
    .map(normalizarOrden)
    .sort((a, b) => String(b.codigo).localeCompare(String(a.codigo)));
}

export function obtenerOrden(id) {
  return obtenerOrdenes().find((orden) => String(orden.id) === String(id));
}

export function generarCodigoOrden(ordenes = obtenerOrdenes()) {
  const anio = new Date().getFullYear();
  const patron = new RegExp(`^OS-${anio}-(\\d+)$`, 'i');
  const ultimo = ordenes.reduce((mayor, orden) => {
    const coincidencia = String(orden.codigo || '').match(patron);
    return coincidencia ? Math.max(mayor, Number(coincidencia[1])) : mayor;
  }, 0);

  return `OS-${anio}-${String(ultimo + 1).padStart(4, '0')}`;
}

export function guardarOrden(datos, idOriginal = null) {
  const ordenes = leerOrdenesCrudas();
  const cliente = obtenerCliente(datos.clienteId);
  const servicio = obtenerServicio(datos.servicioId);
  const tecnico = obtenerTecnicos().find(
    (item) => String(item.id) === String(datos.responsableId),
  );

  if (!cliente) throw new Error('Selecciona un cliente válido.');
  if (!servicio) throw new Error('Selecciona un servicio válido.');
  if (!tecnico) throw new Error('Selecciona un tercero activo.');

  const estado = ESTADOS_ORDEN.find((item) => item.nombre === datos.estado)
    || ESTADOS_ORDEN.find((item) => item.id === Number(datos.estadoId))
    || (datos.fecha ? ESTADOS_ORDEN[1] : ESTADOS_ORDEN[0]);

  if (ESTADOS_CON_FECHA.includes(estado.nombre) && !datos.fecha) {
    throw new Error('Selecciona la fecha programada para esta orden.');
  }
  if (
    datos.fecha
    && datos.fecha < fechaISO()
    && !ESTADOS_CERRADOS.includes(estado.nombre)
  ) {
    throw new Error('La fecha programada no puede ser anterior al día de hoy.');
  }

  const prioridad = PRIORIDADES_ORDEN.find(
    (item) => item.nombre === datos.prioridad || item.id === Number(datos.prioridadId),
  ) || PRIORIDADES_ORDEN[1];

  const anterior = idOriginal
    ? ordenes.find((orden) => String(orden.id) === String(idOriginal))
    : null;

  const registro = {
    ...anterior,
    id: anterior ? anterior.id : siguienteId(ordenes),
    codigo: anterior?.codigo || generarCodigoOrden(obtenerOrdenes()),
    cliente_id: Number(cliente.id),
    servicio_id: Number(servicio.id),
    tercero_id: Number(tecnico.id),
    prioridad_id: prioridad.id,
    estado_id: estado.id,
    fecha_programada: datos.fecha || null,
    descripcion: String(datos.descripcion || '').trim(),
  };

  const actualizadas = anterior
    ? ordenes.map((orden) => (
      String(orden.id) === String(anterior.id) ? registro : orden
    ))
    : [registro, ...ordenes];

  writeStore(ORDENES_KEY, actualizadas);
  return normalizarOrden(registro);
}

export function cambiarEstadoOrden(id, estadoNombre = null) {
  const ordenes = leerOrdenesCrudas();
  const orden = ordenes.find((item) => String(item.id) === String(id));
  if (!orden) throw new Error('No se encontró la orden.');

  const indiceActual = ESTADOS_ORDEN.findIndex(
    (item) => item.id === Number(orden.estado_id),
  );
  const siguiente = estadoNombre
    ? ESTADOS_ORDEN.find((item) => item.nombre === estadoNombre)
    : ESTADOS_ORDEN[(indiceActual + 1) % ESTADOS_ORDEN.length];

  if (!siguiente) throw new Error('Estado de orden no válido.');
  if (ESTADOS_CON_FECHA.includes(siguiente.nombre) && !orden.fecha_programada) {
    throw new Error('Define la fecha programada antes de activar la orden.');
  }
  if (
    orden.fecha_programada
    && orden.fecha_programada < fechaISO()
    && !ESTADOS_CERRADOS.includes(siguiente.nombre)
  ) {
    throw new Error('Actualiza la fecha antes de mover una orden vencida.');
  }

  const actualizada = { ...orden, estado_id: siguiente.id };
  writeStore(
    ORDENES_KEY,
    ordenes.map((item) => (String(item.id) === String(id) ? actualizada : item)),
  );
  return normalizarOrden(actualizada);
}

export function eliminarOrden(id) {
  const ordenes = leerOrdenesCrudas();
  if (!ordenes.some((orden) => String(orden.id) === String(id))) {
    throw new Error('No se encontró la orden.');
  }

  writeStore(ORDENES_KEY, ordenes.filter((orden) => String(orden.id) !== String(id)));
}

export function buscarOrdenes(texto, ordenes = obtenerOrdenes()) {
  const termino = String(texto || '').trim().toLowerCase();
  if (!termino) return ordenes;

  return ordenes.filter((orden) => (
    `${orden.codigo} ${orden.cliente} ${orden.servicio} ${orden.responsable} ${orden.descripcion}`
      .toLowerCase()
      .includes(termino)
  ));
}

export function resumenOrdenes(ordenes) {
  return ordenes.reduce(
    (resumen, orden) => {
      resumen.total += 1;
      if (orden.estado === 'Pendiente') resumen.pendientes += 1;
      if (orden.estado === 'Programada') resumen.programadas += 1;
      if (orden.estado === 'En ejecución') resumen.ejecucion += 1;
      if (orden.estado === 'Finalizada') resumen.finalizadas += 1;
      if (orden.estado === 'Cancelada') resumen.canceladas += 1;
      return resumen;
    },
    { total: 0, pendientes: 0, programadas: 0, ejecucion: 0, finalizadas: 0, canceladas: 0 },
  );
}

export function asegurarOrdenes() {
  if (hasStore(ORDENES_KEY)) return;
  writeStore(ORDENES_KEY, crearSemilla());
}
