import { Router } from 'express';
import { requireAuth, requireRol, validate } from '../middleware/index.js';
import { UsuarioRepository } from '../repositories/usuarios.js';
import { AuthService } from '../services/authService.js';
import { crearUsuarioSchema } from '../schema/schemas.js';

export function usuariosRouter() {
  const r = Router();
  r.use(requireAuth, requireRol('coordinacion'));

  r.get('/', (_req, res) => {
    res.json(UsuarioRepository.listar());
  });

  r.get('/estudiantes', (_req, res) => {
    res.json(UsuarioRepository.listar().filter((u) => u.rol === 'estudiante'));
  });

  r.post('/', validate(crearUsuarioSchema), async (req, res, next) => {
    try {
      const { nombre, email, password, rol } = req.validado;
      const usuario = await AuthService.crearCuenta({ nombre, email, password, rol });
      res.status(201).json(usuario);
    } catch (e) {
      next(e);
    }
  });

  r.patch('/:id/rol', (req, res, next) => {
    try {
      const { rol } = req.body;
      if (!['coordinacion', 'docente', 'estudiante'].includes(rol)) {
        return res.status(400).json({ error: 'Rol inválido' });
      }
      const ok = UsuarioRepository.cambiarRol(Number(req.params.id), rol);
      if (!ok) return res.status(404).json({ error: 'Usuario no encontrado' });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  return r;
}