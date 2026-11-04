import { verificarToken } from '../services/auth.js';
import { UsuarioRepository } from '../repositories/usuarios.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  try {
    const payload = verificarToken(token);
    const usuario = UsuarioRepository.findById(payload.sub);
    if (!usuario || !usuario.activo) return res.status(401).json({ error: 'Usuario no válido' });
    req.usuario = usuario;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

export const requireRol = (...roles) => (req, res, next) => {
  if (!roles.includes(req.usuario?.rol)) {
    return res.status(403).json({ error: 'No tiene permisos para esta acción' });
  }
  next();
};

export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse({ ...req.body, ...req.query });
    if (!result.success) {
      const detalle = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      const err = new Error('Datos inválidos');
      err.status = 400;
      err.detalle = detalle;
      return next(err);
    }
    req.validado = result.data;
    next();
  };
}