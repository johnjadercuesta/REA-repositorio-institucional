const CLAVE_VISITAS = 'magneto_visitas';

export function registrarVisita(id) {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE_VISITAS)) || {};
    v[id] = (v[id] || 0) + 1;
    localStorage.setItem(CLAVE_VISITAS, JSON.stringify(v));
  } catch {}
}

export function obtenerVisitas() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_VISITAS)) || {};
  } catch {
    return {};
  }
}

export function obtenerRetos() {
  try {
    return JSON.parse(localStorage.getItem('magneto_retos')) || {};
  } catch {
    return {};
  }
}

export function reiniciarProgreso() {
  try {
    ['magneto_retos', CLAVE_VISITAS].forEach((k) => localStorage.removeItem(k));
  } catch {}
}