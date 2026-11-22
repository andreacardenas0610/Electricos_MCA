export const TIPOS_DOCUMENTO = ['Cédula', 'Cédula de extranjería', 'NIT', 'Pasaporte'];

export const TIPOS_PERSONA = ['Natural', 'Jurídico'];

export const TIPOS_PROPIEDAD = [
  { id: 1, nombre: 'Residencial' },
  { id: 2, nombre: 'Comercial' },
  { id: 3, nombre: 'Industrial' },
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
    esDueno: cliente.es_dueno === true || cliente.esDueno === true,
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
