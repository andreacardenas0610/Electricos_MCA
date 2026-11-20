const SESSION_STORAGE_KEY = 'mca_session';

export function getLocalSession() {
  const session = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!session) return null;

  try {
    return JSON.parse(session);
  } catch {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function setLocalSession(session) {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearLocalSession() {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}
