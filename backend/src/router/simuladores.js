import { Router } from 'express';
import { requireAuth, requireRol, validate } from '../middleware/index.js';
import { SimuladorRepository } from '../repositories/simuladores.js';
import { simuladorSchema } from '../schema/schemas.js';

export function simuladoresRouter() {
  const r = Router();
  r.use(requireAuth);

  r.get('/', (req, res, next) => {
    try {
      const incluirInactivos = req.query.todos === '1';
      if (incluirInactivos && req.usuario.rol !== 'coordinacion') {
        return res.status(403).json({ error: 'No autorizado' });
      }
      res.json(SimuladorRepository.listar({ incluirInactivos }));
    } catch (e) {
      next(e);
    }
  });

  r.post('/', requireRol('coordinacion'), validate(simuladorSchema), (req, res, next) => {
    try {
      const id = SimuladorRepository.crear(req.validado);
      res.status(201).json(SimuladorRepository.listar().find((s) => s.id === id));
    } catch (e) {
      next(e);
    }
  });

  r.put('/:id', requireRol('coordinacion'), validate(simuladorSchema.partial()), (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const cambios = SimuladorRepository.actualizar(id, req.validado);
      if (!cambios) return res.status(404).json({ error: 'Simulador no encontrado' });
      res.json(SimuladorRepository.listar({ incluirInactivos: true }).find((s) => s.id === id));
    } catch (e) {
      next(e);
    }
  });

  r.delete('/:id', requireRol('coordinacion'), (req, res, next) => {
    try {
      const cambios = SimuladorRepository.eliminar(Number(req.params.id));
      if (!cambios) return res.status(404).json({ error: 'Simulador no encontrado' });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  return r;
}
