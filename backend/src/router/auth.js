import { Router } from 'express';
import { AuthService } from '../services/authService.js';
import { validate } from '../middleware/index.js';
import { loginSchema, registrarSchema } from '../schema/schemas.js';

export function authRouter() {
  const r = Router();

  r.post('/login', validate(loginSchema), async (req, res, next) => {
    try {
      const { email, password } = req.validado;
      const resultado = await AuthService.login({ email, password });
      res.json(resultado);
    } catch (e) {
      next(e);
    }
  });

  r.post('/registrar', validate(registrarSchema), async (req, res, next) => {
    try {
      const { nombre, email, password } = req.validado;
      const resultado = await AuthService.registrar({ nombre, email, password, rol: 'docente' });
      res.status(201).json(resultado);
    } catch (e) {
      next(e);
    }
  });

  return r;
}