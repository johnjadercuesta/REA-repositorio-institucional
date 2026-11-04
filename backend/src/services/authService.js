import bcrypt from 'bcryptjs';
import { UsuarioRepository } from '../repositories/usuarios.js';
import { firmarToken } from './auth.js';

export const AuthService = {
  async login({ email, password }) {
    const usuario = UsuarioRepository.findByEmail(email);
    if (!usuario || !usuario.activo) {
      const err = new Error('Credenciales inválidas');
      err.status = 401;
      throw err;
    }
    const ok = await bcrypt.compare(password, usuario.password_hash);
    if (!ok) {
      const err = new Error('Credenciales inválidas');
      err.status = 401;
      throw err;
    }
    return { token: firmarToken(usuario), usuario: this.toPublic(usuario) };
  },

  async registrar({ nombre, email, password, rol }) {
    const existente = UsuarioRepository.findByEmail(email);
    if (existente) {
      const err = new Error('El email ya está registrado');
      err.status = 409;
      throw err;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const id = UsuarioRepository.crear({ nombre, email, passwordHash, rol });
    const usuario = UsuarioRepository.findById(id);
    return { token: firmarToken(usuario), usuario: this.toPublic(usuario) };
  },

  async crearCuenta({ nombre, email, password, rol }) {
    const existente = UsuarioRepository.findByEmail(email);
    if (existente) {
      const err = new Error('El email ya está registrado');
      err.status = 409;
      throw err;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const id = UsuarioRepository.crear({ nombre, email, passwordHash, rol });
    return UsuarioRepository.findById(id);
  },

  toPublic(u) {
    return { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol };
  },
};