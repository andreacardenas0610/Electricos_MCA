import { readStore, writeStore } from './base.js';

export const CLIENTES_KEY = 'mca_local_clientes';

export const TIPOS_PROPIEDAD = [
  { id: 1, nombre: 'Residencial' },
  { id: 2, nombre: 'Comercial' },
  { id: 3, nombre: 'Industrial' },
];

export const TIPOS_DOCUMENTO = ['Cédula', 'Cédula de extranjería', 'NIT', 'Pasaporte'];

const CLIENTES_INICIALES = [
  {
    id: 1,
    nombre_razon_social: 'Constructora Horizonte S.A.',
    documento_nit: '900.123.456-7',
    tipo_cliente: 'Jurídico',
    tipo_propiedad_id: 2,
    tipo_propiedad: 'Comercial',
    contacto: 'Laura Medina',
    telefono: '310 555 1201',
    correo_electronico: 'contacto@horizonte.com.co',
    direccion: 'Calle 50 # 12-34, Parque Industrial',
    municipio: 'Bogotá',
    departamento: 'Cundinamarca',
    estado: 'Activo',
  },
  {
    id: 2,
    nombre_razon_social: 'Industrias Alfa S.A.',
    documento_nit: '890.456.789-1',
    tipo_cliente: 'Jurídico',
    tipo_propiedad_id: 3,
    tipo_propiedad: 'Industrial',
    contacto: 'Mauricio Salazar',
    telefono: '320 555 2202',
    correo_electronico: 'compras@industriasalfa.com',
    direccion: 'Carrera 48 # 20-114, Zona Industrial',
    municipio: 'Medellín',
    departamento: 'Antioquia',
    estado: 'Activo',
  },
  {
    id: 3,
    nombre_razon_social: 'Comercializadora del Norte',
    documento_nit: '901.222.333-4',
    tipo_cliente: 'Jurídico',
    tipo_propiedad_id: 2,
    tipo_propiedad: 'Comercial',
    contacto: 'Sandra Ospina',
    telefono: '301 555 3303',
    correo_electronico: 'administracion@comercialnorte.co',
    direccion: 'Avenida Las Américas 88-10',
    municipio: 'Medellín',
    departamento: 'Antioquia',
    estado: 'Activo',
  },
  {
    id: 4,
    nombre_razon_social: 'Residencial Los Álamos',
    documento_nit: '830.111.222-3',
    tipo_cliente: 'Jurídico',
    tipo_propiedad_id: 1,
    tipo_propiedad: 'Residencial',
    contacto: 'Administración Los Álamos',
    telefono: '601 555 4404',
    correo_electronico: 'admin@losalamos.co',
    direccion: 'Calle 134 # 9-45',
    municipio: 'Bogotá',
    departamento: 'Cundinamarca',
    estado: 'Activo',
  },
  {
    id: 5,
    nombre_razon_social: 'Centro Comercial Bello',
    documento_nit: '900.888.777-2',
    tipo_cliente: 'Jurídico',
    tipo_propiedad_id: 2,
    tipo_propiedad: 'Comercial',
    contacto: 'Diego Restrepo',
    telefono: '304 555 5505',
    correo_electronico: 'mantenimiento@ccbello.co',
    direccion: 'Carrera 50 # 38-20',
    municipio: 'Bello',
    departamento: 'Antioquia',
    estado: 'Activo',
  },
  {
    id: 6,
    nombre_razon_social: 'Edificio Horizonte',
    documento_nit: '901.555.444-9',
    tipo_cliente: 'Jurídico',
    tipo_propiedad_id: 2,
    tipo_propiedad: 'Comercial',
    contacto: 'Camilo Díaz',
    telefono: '312 555 6606',
    correo_electronico: 'admin@edificiohorizonte.co',
    direccion: 'Carrera 15 # 93-60',
    municipio: 'Bogotá',
    departamento: 'Cundinamarca',
    estado: 'Activo',
  },
  {
    id: 7,
    nombre_razon_social: 'Casa Familiar Gómez',
    documento_nit: '1.020.304.050',
    tipo_cliente: 'Natural',
    tipo_propiedad_id: 1,
    tipo_propiedad: 'Residencial',
    contacto: 'Familia Gómez',
    telefono: '315 555 7707',
    correo_electronico: 'familia.gomez@correo.com',
    direccion: 'Calle 7 # 2-18',
    municipio: 'Chía',
    departamento: 'Cundinamarca',
    estado: 'Activo',
  },
  {
    id: 8,
    nombre_razon_social: 'Conjunto Los Pinos',
    documento_nit: '900.777.666-5',
    tipo_cliente: 'Jurídico',
    tipo_propiedad_id: 1,
    tipo_propiedad: 'Residencial',
    contacto: 'María Fernanda Ruiz',
    telefono: '318 555 8808',
    correo_electronico: 'administracion@lospinos.co',
    direccion: 'Carrera 34 # 10-55',
    municipio: 'Medellín',
    departamento: 'Antioquia',
    estado: 'Activo',
  },
];

export function normalizarCliente(cliente) {
  const tipoPropiedad = cliente.tipo_propiedad
    || TIPOS_PROPIEDAD.find((tipo) => tipo.id === Number(cliente.tipo_propiedad_id))?.nombre
    || (cliente.tipo_cliente === 'Natural' ? 'Residencial' : 'Comercial');

  return {
    ...cliente,
    id: cliente.id,
    nombre: cliente.nombre_razon_social || cliente.nombre || '',
    documento: cliente.documento_nit || cliente.documento || '',
    tipoDocumento: cliente.tipo_documento || cliente.tipoDocumento
      || (tipoPropiedad === 'Residencial' ? 'Cédula' : 'NIT'),
    tipoCliente: cliente.tipo_cliente || (tipoPropiedad === 'Residencial' ? 'Natural' : 'Jurídico'),
    tipoPropiedad,
    // Un empleado (tercero activo) también puede registrar ventas como cliente.
    esEmpleado: cliente.es_empleado === true || cliente.esEmpleado === true,
    terceroId: cliente.tercero_id ?? cliente.terceroId ?? null,
    empleadoNombre: cliente.empleado_nombre || cliente.empleadoNombre || '',
    contacto: cliente.contacto || '',
    telefono: cliente.telefono || '',
    correo: cliente.correo_electronico || cliente.correo || '',
    direccion: cliente.direccion || '',
    municipio: cliente.municipio || '',
    departamento: cliente.departamento || '',
    estado: cliente.estado || 'Activo',
  };
}

export function obtenerClientes() {
  const guardados = readStore(CLIENTES_KEY, null);
  const base = Array.isArray(guardados) ? guardados : CLIENTES_INICIALES;
  return base.map(normalizarCliente);
}

export function obtenerCliente(id) {
  return obtenerClientes().find((cliente) => String(cliente.id) === String(id));
}

export function buscarClientes(texto) {
  const termino = String(texto || '').trim().toLowerCase();
  const clientes = obtenerClientes();
  if (!termino) return clientes;
  return clientes.filter((cliente) => (
    `${cliente.nombre} ${cliente.documento} ${cliente.contacto} ${cliente.correo} ${cliente.municipio}`
      .toLowerCase()
      .includes(termino)
  ));
}

function leerClientesCrudos() {
  const guardados = readStore(CLIENTES_KEY, null);
  return Array.isArray(guardados) ? guardados : CLIENTES_INICIALES;
}

function siguienteId(clientes) {
  return clientes.reduce((mayor, cliente) => Math.max(mayor, Number(cliente.id) || 0), 0) + 1;
}

export function guardarCliente(datos, idOriginal = null) {
  const clientes = leerClientesCrudos();
  const nombre = String(datos.nombre || '').trim();
  const documento = String(datos.documento || '').trim();
  const telefono = String(datos.telefono || '').trim();
  const correo = String(datos.correo || '').trim();

  if (!nombre) throw new Error('Escribe el nombre o razón social del cliente.');
  if (!documento) throw new Error('Escribe el documento o NIT del cliente.');
  if (!telefono) throw new Error('Escribe el teléfono del cliente.');
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    throw new Error('Ingresa un correo electrónico válido.');
  }

  const duplicado = clientes.find(
    (cliente) => String(cliente.documento_nit || cliente.documento || '') === documento
      && String(cliente.id) !== String(idOriginal),
  );
  if (duplicado) throw new Error('Ya existe un cliente con ese documento o NIT.');

  const tipoPropiedad = TIPOS_PROPIEDAD.find(
    (tipo) => tipo.nombre === datos.tipoPropiedad,
  ) || TIPOS_PROPIEDAD[0];

  const anterior = idOriginal
    ? clientes.find((cliente) => String(cliente.id) === String(idOriginal))
    : null;

  const registro = {
    ...anterior,
    id: anterior ? anterior.id : siguienteId(clientes),
    nombre_razon_social: nombre,
    documento_nit: documento,
    tipo_cliente: tipoPropiedad.nombre === 'Residencial' ? 'Natural' : 'Jurídico',
    tipo_documento: String(datos.tipoDocumento || '').trim()
      || (tipoPropiedad.nombre === 'Residencial' ? 'Cédula' : 'NIT'),
    tipo_propiedad_id: tipoPropiedad.id,
    tipo_propiedad: tipoPropiedad.nombre,
    tercero_id: Number(datos.terceroId) > 0 ? Number(datos.terceroId) : null,
    es_empleado: datos.esEmpleado === true || Number(datos.terceroId) > 0,
    contacto: String(datos.contacto || '').trim(),
    telefono,
    correo_electronico: correo,
    direccion: String(datos.direccion || '').trim(),
    municipio: String(datos.municipio || '').trim(),
    departamento: String(datos.departamento || '').trim(),
    estado: datos.estado === 'Inactivo' ? 'Inactivo' : 'Activo',
  };

  const actualizados = anterior
    ? clientes.map((cliente) => (
      String(cliente.id) === String(anterior.id) ? registro : cliente
    ))
    : [registro, ...clientes];

  writeStore(CLIENTES_KEY, actualizados);
  return normalizarCliente(registro);
}

export function cambiarEstadoCliente(id) {
  const cliente = obtenerCliente(id);
  if (!cliente) throw new Error('No se encontró el cliente.');

  return guardarCliente(
    { ...cliente, estado: cliente.estado === 'Activo' ? 'Inactivo' : 'Activo' },
    cliente.id,
  );
}

export function eliminarCliente(id) {
  const clientes = leerClientesCrudos();
  if (!clientes.some((cliente) => String(cliente.id) === String(id))) {
    throw new Error('No se encontró el cliente.');
  }

  writeStore(
    CLIENTES_KEY,
    clientes.filter((cliente) => String(cliente.id) !== String(id)),
  );
}

export function asegurarClientes() {
  const guardados = readStore(CLIENTES_KEY, null);
  if (!Array.isArray(guardados) || guardados.length === 0) {
    writeStore(CLIENTES_KEY, CLIENTES_INICIALES);
  }
}
