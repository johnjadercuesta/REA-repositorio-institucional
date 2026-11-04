const TOKEN_KEY = 'rea_token';
const USER_KEY = 'rea_usuario';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUsuario() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function guardarSesion({ token, usuario }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

export function cerrarSesion() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function api(ruta, { method = 'GET', body, formData } = {}) {
  const headers = {};
  if (getToken()) headers.Authorization = `Bearer ${getToken()}`;
  let payload = body;
  if (body && !formData) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  if (formData) payload = formData;

  const res = await fetch(`/api${ruta}`, { method, headers, body: payload });
  if (res.status === 401) {
    cerrarSesion();
    window.location.href = '/login';
    throw new Error('Sesión expirada');
  }
  if (!res.ok) {
    let detalle = 'Error del servidor';
    try {
      const data = await res.json();
      detalle = data.detalle ? data.detalle.join(' · ') : data.error || detalle;
    } catch {
      /* ignore */
    }
    throw new Error(detalle);
  }
  const tipo = res.headers.get('content-type') || '';
  if (tipo.includes('application/json')) return res.json();
  return res;
}

export const tiposRecurso = ['documento', 'video', 'audio', 'imagen', 'enlace', 'libro', 'h5', 'simulacion'];
export const licencias = ['CC BY', 'CC BY-SA', 'CC BY-NC', 'CC BY-NC-SA', 'CC BY-ND', 'Dominio público', 'Otra', 'Solo referencia'];