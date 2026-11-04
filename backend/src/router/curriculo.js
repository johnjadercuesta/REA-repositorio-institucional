import { Router } from 'express';
import { requireAuth, requireRol } from '../middleware/index.js';
import { CurriculoRepository } from '../repositories/curriculo.js';
import { validate } from '../middleware/index.js';
import { curriculoEntrySchema } from '../schema/schemas.js';

export function curriculoRouter() {
  const r = Router();
  r.use(requireAuth);

  r.get('/anios', (_req, res) => {
    res.json(CurriculoRepository.anios());
  });

  r.get('/', (req, res) => {
    const { anioId, grado, asignatura, unidad } = req.query;
    res.json(
      CurriculoRepository.listar({
        anioId: anioId ? Number(anioId) : undefined,
        grado,
        asignatura,
        unidad,
      })
    );
  });

  r.get('/filtros', (_req, res) => {
    res.json({
      grados: CurriculoRepository.grados(),
      asignaturas: CurriculoRepository.asignaturas(),
      unidades: CurriculoRepository.unidades(),
    });
  });

  r.post('/', requireRol('coordinacion'), validate(curriculoEntrySchema), (req, res, next) => {
    try {
      const id = CurriculoRepository.crear(req.validado);
      res.status(201).json({ id });
    } catch (e) {
      next(e);
    }
  });

  return r;
}