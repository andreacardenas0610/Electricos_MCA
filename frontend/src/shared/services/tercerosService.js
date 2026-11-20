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
