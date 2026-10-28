export const API_SESSION_EXPIRED = 'mca:session-expired';

const configuredApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000')
  .replace(/\/+$/, '');
const API_BASE_URL = /\/api$/i.test(configuredApiUrl)
  ? configuredApiUrl
  : `${configuredApiUrl}/api`;

// La base de datos está remota: cada consulta tarda segundo y medio, así que el cliente
// espera lo suficiente y reintenta solo si la conexión falló (nunca si el servidor respondió).
const TIEMPO_LIMITE_MS = 25000;
const REINTENTOS_GET = 2;

// Peticiones GET idénticas que viajan al mismo tiempo comparten una sola respuesta.
const peticionesEnVuelo = new Map();

function clavePeticion(path, method, body) {
  const sessionRaw = sessionStorage.getItem('mca_session') || '';
  return `${method}:${path}:${body === undefined ? '' : JSON.stringify(body)}:${sessionRaw.slice(-24)}`;
}

async function enviar(path, { method = 'GET', body, ...options }) {
  const headers = new Headers(options.headers || {});
  const sessionRaw = sessionStorage.getItem('mca_session');
  let session = null;

  if (sessionRaw) {
    try {
      session = JSON.parse(sessionRaw);
    } catch {
      sessionStorage.removeItem('mca_session');
    }
  }

  if (session?.token) headers.set('Authorization', `Bearer ${session.token}`);
  if (body !== undefined && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_LIMITE_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      method,
      signal: controlador.signal,
      headers,
      body: body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
    });

    if (response.status === 401 && !path.startsWith('/auth/')) {
      sessionStorage.removeItem('mca_session');
      window.dispatchEvent(new Event(API_SESSION_EXPIRED));
    }

    if (response.status === 204) return null;

    const contentType = response.headers.get('content-type') || '';
    const result = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const error = new Error(result?.mensaje || result?.message || `Error de API (${response.status}).`);
      error.status = response.status;
      // Detrás del mensaje, la API puede devolver la lista de errores de campos y advertencias.
      if (result && typeof result === 'object') {
        error.datos = result;
        if (Array.isArray(result.advertencias)) error.advertencias = result.advertencias;
      }
      throw error;
    }

    return result;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`El servidor tardó más de ${TIEMPO_LIMITE_MS / 1000} segundos en responder.`);
    }
    if (error instanceof TypeError) {
      throw new Error(
        'No se pudo conectar con el servidor. Verifica que la API esté disponible, que VITE_API_URL sea correcta y que el backend permita este dominio.',
      );
    }
    throw error;
  } finally {
    clearTimeout(temporizador);
  }
}

export async function apiRequest(path, options = {}) {
  const { method = 'GET' } = options;
  const esLectura = method === 'GET';
  const clave = esLectura ? clavePeticion(path, method, options.body) : null;

  if (clave && peticionesEnVuelo.has(clave)) return peticionesEnVuelo.get(clave);

  const intentos = esLectura ? REINTENTOS_GET + 1 : 1;

  const ejecucion = (async () => {
    let ultimoError = null;
    for (let intento = 0; intento < intentos; intento += 1) {
      try {
        return await enviar(path, { ...options, method });
      } catch (error) {
        ultimoError = error;
        const falloDeConexion = error instanceof TypeError || /tardó/.test(error.message);
        const puedeReintentar = esLectura && falloDeConexion && intento < intentos - 1;
        if (!puedeReintentar) throw error;
        await new Promise((resolver) => setTimeout(resolver, 400 * (intento + 1)));
      }
    }
    throw ultimoError;
  })();

  if (clave) {
    peticionesEnVuelo.set(clave, ejecucion);
    const limpiar = () => peticionesEnVuelo.delete(clave);
    ejecucion.then(limpiar, limpiar);
  }

  return ejecucion;
}
