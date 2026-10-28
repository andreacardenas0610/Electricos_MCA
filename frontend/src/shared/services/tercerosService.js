import { readStore, writeStore } from './base.js';

export const TERCEROS_KEY = 'mca_local_terceros';

const TERCEROS_INICIALES = [
  {
    id: 1,
    nombre_completo: 'Carlos Pérez',
    documento: '71.555.101',
    telefono: '310 444 1001',
    correo_electronico: 'carlos.perez@electricosmca.com',
    especialidad: 'Instalaciones y tableros',
    estado: 'Activo',
  },
  {
    id: 2,
    nombre_completo: 'Juan Rodríguez',
    documento: '71.555.202',
    telefono: '310 444 2002',
    correo_electronico: 'juan.rodriguez@electricosmca.com',
    especialidad: 'Mantenimiento preventivo',
    estado: 'Activo',
  },
  {
    id: 3,
    nombre_completo: 'Miguel Torres',
    documento: '71.555.303',
    telefono: '310 444 3003',
    correo_electronico: 'miguel.torres@electricosmca.com',
    especialidad: 'Diagnóstico de fallas',
    estado: 'Activo',
  },
];

export function normalizarTecnico(tercero) {
  return {
    ...tercero,
    id: tercero.id,
    nombre: tercero.nombre_completo || tercero.nombre || tercero.contacto || '',
    documento: tercero.documento || '',
    tipoDocumento: tercero.tipo_documento || tercero.tipoDocumento || 'Cédula',
    telefono: tercero.telefono || '',
    correo: tercero.correo_electronico || tercero.correo || '',
    direccion: tercero.direccion || '',
    municipio: tercero.municipio || '',
    departamento: tercero.departamento || '',
    especialidad: tercero.especialidad || tercero.empresa || 'Técnico eléctrico',
    estado: tercero.estado || 'Activo',
  };
}

export function obtenerTecnicos() {
  const guardados = readStore(TERCEROS_KEY, null);
  const base = Array.isArray(guardados) ? guardados : TERCEROS_INICIALES;
  return base.map(normalizarTecnico);
}

export function obtenerTecnicosActivos() {
  return obtenerTecnicos().filter((tecnico) => tecnico.estado !== 'Inactivo');
}

function leerTercerosCrudos() {
  const guardados = readStore(TERCEROS_KEY, null);
  return Array.isArray(guardados) ? guardados : TERCEROS_INICIALES;
}

function siguienteId(terceros) {
  return terceros.reduce((mayor, tercero) => Math.max(mayor, Number(tercero.id) || 0), 0) + 1;
}

export function guardarTecnico(datos, idOriginal = null) {
  const terceros = leerTercerosCrudos();
  const nombre = String(datos.nombre || '').trim();
  const documento = String(datos.documento || '').trim();
  const telefono = String(datos.telefono || '').trim();
  const correo = String(datos.correo || '').trim();

  if (!nombre) throw new Error('Escribe el nombre del tercero.');
  if (!documento) throw new Error('Escribe el documento del tercero.');
  if (!telefono) throw new Error('Escribe el teléfono del tercero.');
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    throw new Error('Ingresa un correo electrónico válido.');
  }

  const duplicado = terceros.find(
    (tercero) => String(tercero.documento || '') === documento
      && String(tercero.id) !== String(idOriginal),
  );
  if (duplicado) throw new Error('Ya existe un tercero con ese documento.');

  const anterior = idOriginal
    ? terceros.find((tercero) => String(tercero.id) === String(idOriginal))
    : null;

  const registro = {
    ...anterior,
    id: anterior ? anterior.id : siguienteId(terceros),
    nombre_completo: nombre,
    documento,
    tipo_documento: String(datos.tipoDocumento || '').trim() || 'Cédula',
    telefono,
    correo_electronico: correo,
    direccion: String(datos.direccion || '').trim(),
    municipio: String(datos.municipio || '').trim(),
    departamento: String(datos.departamento || '').trim(),
    especialidad: String(datos.especialidad || '').trim()
      || anterior?.especialidad
      || 'Técnico eléctrico',
    estado: datos.estado === 'Inactivo' ? 'Inactivo' : 'Activo',
  };

  const actualizados = anterior
    ? terceros.map((tercero) => (
      String(tercero.id) === String(anterior.id) ? registro : tercero
    ))
    : [registro, ...terceros];

  writeStore(TERCEROS_KEY, actualizados);
  return normalizarTecnico(registro);
}

export function cambiarEstadoTecnico(id) {
  const tecnico = obtenerTecnicos().find((item) => String(item.id) === String(id));
  if (!tecnico) throw new Error('No se encontró el tercero.');

  return guardarTecnico(
    { ...tecnico, estado: tecnico.estado === 'Activo' ? 'Inactivo' : 'Activo' },
    tecnico.id,
  );
}

export function eliminarTecnico(id) {
  const terceros = leerTercerosCrudos();
  if (!terceros.some((tercero) => String(tercero.id) === String(id))) {
    throw new Error('No se encontró el tercero.');
  }

  writeStore(
    TERCEROS_KEY,
    terceros.filter((tercero) => String(tercero.id) !== String(id)),
  );
}

export function asegurarTerceros() {
  const guardados = readStore(TERCEROS_KEY, null);
  if (!Array.isArray(guardados) || guardados.length === 0) {
    writeStore(TERCEROS_KEY, TERCEROS_INICIALES);
  }
}
