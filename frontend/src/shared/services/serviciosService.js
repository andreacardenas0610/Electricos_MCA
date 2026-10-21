import { hasStore, numero, readStore, writeStore } from './base.js';
import { reglaTiempoMoneda, MONEDAS_SERVICIO } from './catalogos.js';

export const SERVICIOS_KEY = 'mca_catalogo_servicios';

const SERVICIOS_INICIALES = [
  {
    id: 1,
    codigo: 'ELEC-001',
    nombre: 'Instalación de Tablero Trifásico',
    desc: 'Montaje, cableado y puesta en funcionamiento de tablero eléctrico trifásico.',
    unidad: 'Proyecto',
    precioNumerico: 850,
    moneda: 'USD',
    categoria: 'Instalación',
    estado: 'Activo',
  },
  {
    id: 2,
    codigo: 'ELEC-002',
    nombre: 'Mantenimiento Preventivo',
    desc: 'Limpieza, reapriete de conexiones y revisión general de instalaciones.',
    unidad: 'Hora',
    precioNumerico: 65,
    moneda: 'USD / H',
    categoria: 'Mantenimiento',
    estado: 'Activo',
  },
  {
    id: 3,
    codigo: 'ELEC-003',
    nombre: 'Medición de Pozo a Tierra',
    desc: 'Medición y certificación de sistema de puesta a tierra.',
    unidad: 'Punto',
    precioNumerico: 120,
    moneda: 'USD',
    categoria: 'Protocolos',
    estado: 'Activo',
  },
  {
    id: 4,
    codigo: 'ELEC-004',
    nombre: 'Instalación Luminarias LED',
    desc: 'Colocación, conexión y puesta en funcionamiento de luminarias LED.',
    unidad: 'Punto',
    precioNumerico: 18,
    moneda: 'USD / H',
    categoria: 'Instalación',
    estado: 'Pausado',
  },
  {
    id: 5,
    codigo: 'ELEC-005',
    nombre: 'Instalación de Red Eléctrica',
    desc: 'Instalación de circuitos eléctricos para espacios residenciales y comerciales.',
    unidad: 'Proyecto',
    precioNumerico: 1250,
    moneda: 'COP',
    categoria: 'Instalación',
    estado: 'Activo',
  },
  {
    id: 6,
    codigo: 'ELEC-006',
    nombre: 'Diagnóstico de Fallas Eléctricas',
    desc: 'Inspección técnica para identificar fallas y determinar acciones correctivas.',
    unidad: 'Servicio',
    precioNumerico: 95,
    moneda: 'COP / H',
    categoria: 'Mantenimiento',
    estado: 'Activo',
  },
];

export function normalizarServicio(servicio) {
  const moneda = MONEDAS_SERVICIO.includes(servicio.moneda) ? servicio.moneda : 'COP';
  const regla = reglaTiempoMoneda(moneda);

  return {
    ...servicio,
    id: Number(servicio.id) || servicio.id,
    codigo: servicio.codigo || `ELEC-${String(servicio.id || 1).padStart(3, '0')}`,
    nombre: String(servicio.nombre || '').trim(),
    desc: servicio.desc ?? servicio.descripcion ?? '',
    unidad: servicio.unidad || 'Servicio',
    precioNumerico: numero(servicio.precioNumerico ?? servicio.precio),
    moneda,
    subPrecio: moneda,
    tiempo: regla.texto,
    horas: regla.horas,
    categoria: servicio.categoria || 'Instalación',
    estado: servicio.estado === 'Pausado' ? 'Pausado' : 'Activo',
  };
}

export function obtenerServicios() {
  const guardados = readStore(SERVICIOS_KEY, null);

  if (!Array.isArray(guardados)) {
    return SERVICIOS_INICIALES.map(normalizarServicio);
  }

  return guardados.map((servicio, indice) => {
    const semilla = SERVICIOS_INICIALES.find(
      (item) => String(item.id) === String(servicio.id) || item.nombre === servicio.nombre,
    ) || SERVICIOS_INICIALES[indice] || {};

    return normalizarServicio({ ...semilla, ...servicio });
  });
}

export function obtenerServicio(id) {
  return obtenerServicios().find((servicio) => String(servicio.id) === String(id));
}

export function generarCodigoServicio() {
  const ultimo = obtenerServicios().reduce((mayor, servicio) => {
    const coincidencia = String(servicio.codigo || '').match(/^ELEC-(\d+)$/i);
    return coincidencia ? Math.max(mayor, Number(coincidencia[1])) : mayor;
  }, 0);

  return `ELEC-${String(ultimo + 1).padStart(3, '0')}`;
}

export function guardarServicio(datos, idOriginal = null) {
  const servicios = obtenerServicios();
  const nombre = String(datos.nombre || '').trim();
  const moneda = MONEDAS_SERVICIO.includes(datos.moneda) ? datos.moneda : 'COP';
  const precioNumerico = numero(datos.precioNumerico);

  if (!nombre) throw new Error('El nombre del servicio es obligatorio.');
  if (precioNumerico < 0) throw new Error('El precio no puede ser negativo.');

  const regla = reglaTiempoMoneda(moneda);

  if (idOriginal) {
    const existente = servicios.find((servicio) => String(servicio.id) === String(idOriginal));
    if (!existente) throw new Error('No se encontró el servicio a editar.');

    const actualizado = normalizarServicio({
      ...existente,
      ...datos,
      id: existente.id,
      codigo: existente.codigo,
      nombre,
      moneda,
      precioNumerico,
      tiempo: regla.texto,
      horas: regla.horas,
      actualizadoEn: new Date().toISOString(),
    });

    writeStore(
      SERVICIOS_KEY,
      servicios.map((servicio) => (
        String(servicio.id) === String(actualizado.id) ? actualizado : servicio
      )),
    );
    return actualizado;
  }

  const codigo = generarCodigoServicio();
  const nuevo = normalizarServicio({
    ...datos,
    id: Date.now(),
    codigo,
    nombre,
    moneda,
    precioNumerico,
    tiempo: regla.texto,
    horas: regla.horas,
    estado: datos.estado || 'Activo',
    creadoEn: new Date().toISOString(),
  });

  writeStore(SERVICIOS_KEY, [nuevo, ...servicios]);
  return nuevo;
}

export function cambiarEstadoServicio(id) {
  const servicios = obtenerServicios();
  const servicio = servicios.find((item) => String(item.id) === String(id));
  if (!servicio) throw new Error('No se encontró el servicio.');

  const actualizado = {
    ...servicio,
    estado: servicio.estado === 'Activo' ? 'Pausado' : 'Activo',
  };

  writeStore(
    SERVICIOS_KEY,
    servicios.map((item) => (String(item.id) === String(id) ? actualizado : item)),
  );
  return actualizado;
}

export function eliminarServicio(id) {
  const servicios = obtenerServicios();
  if (!servicios.some((servicio) => String(servicio.id) === String(id))) {
    throw new Error('No se encontró el servicio.');
  }
  writeStore(SERVICIOS_KEY, servicios.filter((servicio) => String(servicio.id) !== String(id)));
}

export function asegurarServicios() {
  if (!hasStore(SERVICIOS_KEY)) {
    writeStore(SERVICIOS_KEY, SERVICIOS_INICIALES.map(normalizarServicio));
  }
}
