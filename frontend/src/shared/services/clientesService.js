export const TIPOS_DOCUMENTO = ['Cédula', 'Cédula de extranjería', 'NIT', 'Pasaporte'];

export const TIPOS_PERSONA = ['Natural', 'Jurídico'];

export function normalizarCliente(cliente) {
  const tipoCliente = cliente.tipo_cliente
    || (cliente.tipo_propiedad === 'Residencial' ? 'Natural' : 'Jurídico');

  return {
    ...cliente,
    id: cliente.id,
    nombre: cliente.nombre_razon_social || cliente.nombre || '',
    documento: cliente.documento_nit || cliente.documento || '',
    tipoDocumento: tipoCliente === 'Natural' ? 'Cédula' : 'NIT',
    tipoCliente,
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
