import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, validate } from '../middleware/index.js';
import { CursoRepository } from '../repositories/cursos.js';
import { SesionRepository } from '../repositories/sesiones.js';
import { AsistenciaRepository } from '../repositories/asistencia.js';
import { sesionSchema, asistenciaLoteSchema, ESTADOS_ASISTENCIA } from '../schema/schemas.js';

export function sesionesRouter() {
  const r = Router();
  r.use(requireAuth);

  // Sesiones de un aula (curso)
  r.get('/curso/:cursoId', (req, res, next) => {
    try {
      const curso = CursoRepository.findById(Number(req.params.cursoId));
      if (!curso) return res.status(404).json({ error: 'Aula no encontrada' });
      if (!SesionRepository.puedeVer({ sesion: null, curso, usuario: req.usuario })) {
        return res.status(403).json({ error: 'No pertenece a este aula' });
      }
      res.json(SesionRepository.listar(curso.id));
    } catch (e) {
      next(e);
    }
  });

  r.post('/curso/:cursoId', validate(sesionSchema), (req, res, next) => {
    try {
      const curso = CursoRepository.findById(Number(req.params.cursoId));
      if (!curso) return res.status(404).json({ error: 'Aula no encontrada' });
      if (req.usuario.rol !== 'coordinacion' && curso.docente_id !== req.usuario.id) {
        return res.status(403).json({ error: 'Solo el docente del aula o coordinación puede crear sesiones' });
      }
      const v = req.validado;
      const id = SesionRepository.crear({
        cursoId: curso.id,
        titulo: v.titulo,
        descripcion: v.descripcion,
        fechaInicio: v.fecha_inicio,
        estado: v.estado,
        creadoPor: req.usuario.id,
      });
      res.status(201).json(SesionRepository.findById(id));
    } catch (e) {
      next(e);
    }
  });

  r.get('/:id', (req, res, next) => {
    try {
      const sesion = SesionRepository.findById(Number(req.params.id));
      if (!sesion) return res.status(404).json({ error: 'Sesión no encontrada' });
      const curso = CursoRepository.findById(sesion.curso_id);
      if (!SesionRepository.puedeVer({ sesion, curso, usuario: req.usuario })) {
        return res.status(403).json({ error: 'No pertenece a este aula' });
      }
      res.json(sesion);
    } catch (e) {
      next(e);
    }
  });

  r.patch('/:id', validate(sesionSchema.partial()), (req, res, next) => {
    try {
      const sesion = SesionRepository.findById(Number(req.params.id));
      if (!sesion) return res.status(404).json({ error: 'Sesión no encontrada' });
      if (!SesionRepository.puedeEditar({ sesion, usuario: req.usuario })) {
        return res.status(403).json({ error: 'No puede modificar esta sesión' });
      }
      SesionRepository.actualizar(sesion.id, req.validado);
      res.json(SesionRepository.findById(sesion.id));
    } catch (e) {
      next(e);
    }
  });

  r.delete('/:id', (req, res, next) => {
    try {
      const sesion = SesionRepository.findById(Number(req.params.id));
      if (!sesion) return res.status(404).json({ error: 'Sesión no encontrada' });
      if (!SesionRepository.puedeEditar({ sesion, usuario: req.usuario })) {
        return res.status(403).json({ error: 'No puede eliminar esta sesión' });
      }
      SesionRepository.eliminar(sesion.id);
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  // ---------- Asistencia ----------
  r.get('/:id/asistencia', (req, res, next) => {
    try {
      const sesion = SesionRepository.findById(Number(req.params.id));
      if (!sesion) return res.status(404).json({ error: 'Sesión no encontrada' });
      const curso = CursoRepository.findById(sesion.curso_id);
      if (!SesionRepository.puedeVer({ sesion, curso, usuario: req.usuario })) {
        return res.status(403).json({ error: 'No pertenece a este aula' });
      }
      const fila = AsistenciaRepository.listarPorSesion(sesion.id);
      if (!fila) return res.status(404).json({ error: 'Sesión no encontrada' });
      res.json({ ...fila, sesion });
    } catch (e) {
      next(e);
    }
  });

  r.put('/:id/asistencia', validate(asistenciaLoteSchema), (req, res, next) => {
    try {
      const sesion = SesionRepository.findById(Number(req.params.id));
      if (!sesion) return res.status(404).json({ error: 'Sesión no encontrada' });
      if (!SesionRepository.puedeEditar({ sesion, usuario: req.usuario })) {
        return res.status(403).json({ error: 'Solo el docente de la sesión o coordinación registra asistencia' });
      }
      const fila = AsistenciaRepository.marcarLote({
        sesionId: sesion.id,
        registros: req.validado.registros,
        registradoPor: req.usuario.id,
      });
      res.json(fila);
    } catch (e) {
      next(e);
    }
  });

  r.put('/:id/asistencia/todos', validate(z.object({ estado: z.enum(ESTADOS_ASISTENCIA) })), (req, res, next) => {
    try {
      const sesion = SesionRepository.findById(Number(req.params.id));
      if (!sesion) return res.status(404).json({ error: 'Sesión no encontrada' });
      if (!SesionRepository.puedeEditar({ sesion, usuario: req.usuario })) {
        return res.status(403).json({ error: 'Solo el docente de la sesión o coordinación registra asistencia' });
      }
      const fila = AsistenciaRepository.marcarTodos(sesion.id, req.validado.estado, req.usuario.id);
      res.json(fila);
    } catch (e) {
      next(e);
    }
  });

  return r;
}
