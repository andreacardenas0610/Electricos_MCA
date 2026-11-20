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
<<<<<<< HEAD

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
    es_dueno: datos.esDueno === true,
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
=======
>>>>>>> e427bd1c3ca2c661480a0d7f15ca33a29dffa92d
