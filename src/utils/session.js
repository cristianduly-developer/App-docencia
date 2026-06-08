import { SESSION_KEY } from '../constants';

export function getSessionToken() {
  return window._sessionToken || sessionStorage.getItem(SESSION_KEY) || null;
}

export function setSessionToken(token) {
  window._sessionToken = token;
  if (token) sessionStorage.setItem(SESSION_KEY, token);
  else sessionStorage.removeItem(SESSION_KEY);
}

// Restaurar token al cargar la página
setSessionToken(sessionStorage.getItem(SESSION_KEY));

// Headers autenticados para todas las peticiones
export const authHeaders = (extra = {}) => ({
  "Content-Type": "application/json",
  ...(getSessionToken() ? { "x-session-token": getSessionToken() } : {}),
  ...extra,
});

// Manejar 401 — dispara evento global para logout limpio
let _logout401 = false;
export function manejar401() {
  if (_logout401) return;
  _logout401 = true;
  setSessionToken(null);
  localStorage.removeItem("aye_sesion");
  window.dispatchEvent(new CustomEvent('aye:sesion-expirada'));
  setTimeout(() => { _logout401 = false; }, 3000);
}

export function decodeJWT(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch { return null; }
}
