import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function firmarToken(usuario) {
  return jwt.sign(
    { sub: usuario.id, rol: usuario.rol, nombre: usuario.nombre },
    config.jwtSecret,
    { expiresIn: config.jwtExpires }
  );
}

export function verificarToken(token) {
  return jwt.verify(token, config.jwtSecret);
}
