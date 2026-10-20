const SESSION_KEY = 'mca_session';
const USERS_KEY = 'mca_usuarios';
const CLIENTS_KEY = 'mca_local_clientes';
const CONTRACTORS_KEY = 'mca_local_terceros';
const ORDERS_KEY = 'mca_local_ordenes';

const DEFAULT_USERS = [
  { usuario: 'admin', correo: 'admin@electricosmca.com', password: '1033490682' },
];

const PROPERTY_TYPES = [
  { id: 1, nombre: 'Residencial' },
  { id: 2, nombre: 'Comercial' },
  { id: 3, nombre: 'Industrial' },
];

const PRIORITIES = [
  { id: 1, nombre: 'Baja' },
  { id: 2, nombre: 'Media' },
  { id: 3, nombre: 'Alta' },
];

const ORDER_STATES = [
  { id: 1, nombre: 'Pendiente' },
  { id: 2, nombre: 'Programada' },
  { id: 3, nombre: 'En Ejecución' },
  { id: 4, nombre: 'Finalizada' },
  { id: 5, nombre: 'Cancelada' },
];

const DEFAULT_SERVICES = [
  { id: 1, nombre: 'Instalación de Tablero Trifásico' },
  { id: 2, nombre: 'Mantenimiento Preventivo' },
  { id: 3, nombre: 'Medición de Pozo a Tierra' },
  { id: 4, nombre: 'Instalación Luminarias LED' },
  { id: 5, nombre: 'Instalación de Red Eléctrica' },
  { id: 6, nombre: 'Diagnóstico de Fallas Eléctricas' },
];

function readList(key, fallback = []) {
  const stored = localStorage.getItem(key);
  if (!stored) return fallback;

  const value = JSON.parse(stored);
  if (!Array.isArray(value)) {
    throw new Error(`Los datos locales de ${key} tienen un formato no válido.`);
  }
  return value;
}

function writeList(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getLocalUsers() {
  return readList(USERS_KEY, DEFAULT_USERS);
}

export function saveLocalUsers(users) {
  writeList(USERS_KEY, users);
}

export function getLocalSession() {
  const session = sessionStorage.getItem(SESSION_KEY);
  if (!session) return null;

  try {
    return JSON.parse(session);
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function setLocalSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearLocalSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

function serviceCatalog() {
  const services = readList('mca_catalogo_servicios', DEFAULT_SERVICES);
  return services.map((service) => ({ id: service.id, nombre: service.nombre }));
}

function joinedOrder(order) {
  const client = readList(CLIENTS_KEY).find((item) => item.id === order.cliente_id);
  const contractor = readList(CONTRACTORS_KEY).find((item) => item.id === order.tercero_id);
  const service = serviceCatalog().find((item) => item.id === order.servicio_id);
  const priority = PRIORITIES.find((item) => item.id === order.prioridad_id);
  const state = ORDER_STATES.find((item) => item.id === order.estado_id);

  return {
    ...order,
    cliente: client?.nombre_razon_social || '',
    servicio: service?.nombre || '',
    tecnico: contractor?.nombre_completo || '',
    prioridad: priority?.nombre || '',
    estado: state?.nombre || '',
  };
}

function nextId(records) {
  return records.reduce((highest, record) => Math.max(highest, Number(record.id) || 0), 0) + 1;
}

function saveEntity(key, method, id, body, createRecord, updateRecord) {
  const records = readList(key);
  if (method === 'GET' && id === undefined) return records;
  if (method === 'POST' && id === undefined) {
    const record = createRecord(nextId(records), body);
    writeList(key, [record, ...records]);
    return record;
  }

  const index = records.findIndex((record) => String(record.id) === id);
  if (index < 0) throw new Error('No se encontró el registro solicitado.');

  if (method === 'DELETE') {
    records.splice(index, 1);
    writeList(key, records);
    return null;
  }
  if (method === 'PUT') {
    const updated = updateRecord(records[index], body);
    records[index] = updated;
    writeList(key, records);
    return updated;
  }
  throw new Error('La operación solicitada no está disponible.');
}

function clientRecord(id, body) {
  const property = PROPERTY_TYPES.find((item) => item.id === Number(body.tipo_propiedad_id));
  return {
    id,
    ...body,
    tipo_propiedad_id: property?.id || null,
    tipo_propiedad: property?.nombre || '',
  };
}

function contractorRecord(id, body) {
  return { id, ...body };
}

function orderRecord(id, body) {
  return {
    id,
    ...body,
    fecha_programada: body.fecha_programada || null,
    servicio_id: Number(body.servicio_id),
    cliente_id: Number(body.cliente_id),
    tercero_id: Number(body.tercero_id),
    prioridad_id: Number(body.prioridad_id),
    estado_id: Number(body.estado_id),
  };
}

function listEntity(key, method, id, body, createRecord, updateRecord) {
  const result = saveEntity(key, method, id, body, createRecord, updateRecord);
  if (key === ORDERS_KEY) {
    return Array.isArray(result) ? result.map(joinedOrder) : result && joinedOrder(result);
  }
  return result;
}

export async function localRequest(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body || {};
  const parts = path.split('/').filter(Boolean);
  const resource = parts[0];
  const id = parts[1];

  if (resource === 'auth' && parts[1] === 'login' && method === 'POST') {
    const account = getLocalUsers().find(
      (user) => user.usuario === body.usuario && user.password === body.password,
    );
    if (!account) throw new Error('Usuario o contraseña incorrectos.');

    return {
      token: 'local-session',
      usuario: {
        usuario: account.usuario,
        nombre: account.nombre || account.usuario,
        rol: account.rol || 'Administrador',
      },
    };
  }

  if (resource === 'clientes' && parts[1] === 'catalogos' && parts[2] === 'tipos-propiedad') {
    return PROPERTY_TYPES;
  }

  if (resource === 'ordenes-servicio' && parts[1] === 'catalogos') {
    return {
      servicios: serviceCatalog(),
      prioridades: PRIORITIES,
      estados: ORDER_STATES,
    };
  }

  if (resource === 'clientes') {
    return listEntity(CLIENTS_KEY, method, id, body, clientRecord, clientRecord);
  }
  if (resource === 'terceros') {
    return listEntity(CONTRACTORS_KEY, method, id, body, contractorRecord, contractorRecord);
  }
  if (resource === 'ordenes-servicio') {
    if (id && parts[2] === 'estado' && method === 'PATCH') {
      const records = readList(ORDERS_KEY);
      const order = records.find((record) => String(record.id) === id);
      if (!order) throw new Error('No se encontró la orden solicitada.');

      const updated = { ...order, estado_id: Number(body.estado_id) };
      const index = records.indexOf(order);
      records[index] = updated;
      writeList(ORDERS_KEY, records);
      return joinedOrder(updated);
    }
    return listEntity(ORDERS_KEY, method, id, body, orderRecord, orderRecord);
  }

  throw new Error('La operación solicitada no está disponible en el almacenamiento local.');
}
