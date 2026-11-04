import { Router } from 'express';
import { requireAuth, requireRol, validate } from '../middleware/index.js';
import { CursoRepository } from '../repositories/cursos.js';
import { cursoSchema, matriculaSchema } from '../schema/schemas.js';

export function cursosRouter() {
  const r = Router();
  r.use(requireAuth);

  r.get('/', (req, res) => {
    res.json(CursoRepository.listar({ periodo: req.query.periodo }));
  });

  r.get('/miaula', (req, res) => {
    res.json(CursoRepository.cursosDeUsuario(req.usuario.id));
  });

  r.get('/:id', (req, res) => {
    const curso = CursoRepository.findById(Number(req.params.id));
    if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });
    res.json(curso);
  });

  r.get('/:id/matriculados', (req, res) => {
    const curso = CursoRepository.findById(Number(req.params.id));
    if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });
    res.json(CursoRepository.matriculados(curso.id));
  });

  r.post('/', requireRol('coordinacion'), validate(cursoSchema), (req, res, next) => {
    try {
      const v = req.validado;
      const id = CursoRepository.crear({
        nombre: v.nombre,
        grado: v.grado,
        asignatura: v.asignatura,
        nivel: v.nivel,
        anioId: v.anioId,
        docenteId: v.docenteId || null,
        periodo: v.periodo,
      });
      res.status(201).json(CursoRepository.findById(id));
    } catch (e) {
      next(e);
    }
  });

  r.post('/:id/matricular', requireRol('coordinacion'), validate(matriculaSchema), (req, res, next) => {
    try {
      const cursoId = Number(req.params.id);
      if (!CursoRepository.findById(cursoId)) return res.status(404).json({ error: 'Curso no encontrado' });
      CursoRepository.matricular(cursoId, req.validado.usuarioId);
      res.json({ ok: true, matriculados: CursoRepository.matriculados(cursoId) });
    } catch (e) {
      next(e);
    }
  });

  r.delete('/:id/matricular/:usuarioId', requireRol('coordinacion'), (req, res, next) => {
    try {
      const ok = CursoRepository.desmatricular(Number(req.params.id), Number(req.params.usuarioId));
      if (!ok) return res.status(404).json({ error: 'No estaba matriculado' });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  return r;
}