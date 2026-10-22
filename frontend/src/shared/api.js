export const API_SESSION_EXPIRED = 'mca:session-expired';

const configuredApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000')
  .replace(/\/+$/, '');
const API_BASE_URL = /\/api$/i.test(configuredApiUrl)
  ? configuredApiUrl
  : `${configuredApiUrl}/api`;

export async function apiRequest(path, { method = 'GET', body, ...options } = {}) {
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

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      method,
      headers,
      body: body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        'No se pudo conectar con el servidor. Verifica que la API esté disponible, que VITE_API_URL sea correcta y que el backend permita este dominio.',
      );
    }
    throw error;
  }

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
    throw new Error(result?.mensaje || result?.message || `Error de API (${response.status}).`);
  }

  return result;
}
