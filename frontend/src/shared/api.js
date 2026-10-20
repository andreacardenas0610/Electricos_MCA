const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
const SESSION_KEY = 'mca_session';

export function getApiSession() {
  const session = sessionStorage.getItem(SESSION_KEY);
  if (!session) return null;

  try {
    return JSON.parse(session);
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function setApiSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearApiSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, headers = {}, authenticated = true } = options;
  const requestHeaders = { ...headers };

  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const session = authenticated ? getApiSession() : null;
  if (session?.token) {
    requestHeaders.Authorization = `Bearer ${session.token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: body === undefined || body instanceof FormData ? body : JSON.stringify(body),
  });

  if (response.status === 401 && authenticated && session) {
    window.dispatchEvent(new Event('mca:unauthorized'));
  }

  if (response.status === 204) return null;

  const respuesta = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(respuesta.mensaje || `Error de conexión (${response.status}).`);
  }

  return respuesta;
}
