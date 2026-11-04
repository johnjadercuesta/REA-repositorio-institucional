import { Router } from 'express';
import { requireAuth, validate } from '../middleware/index.js';
import { CursoRepository } from '../repositories/cursos.js';
import { SesionRepository } from '../repositories/sesiones.js';
import { SalaRepository } from '../repositories/salas.js';
import { salaSchema, salaPasswordSchema } from '../schema/schemas.js';

export function salasRouter() {
  const r = Router();
  r.use(requireAuth);

  r.get('/', (req, res, next) => {
    try {
      res.json(SalaRepository.listarVisibles(req.usuario));
    } catch (e) {
      next(e);
    }
  });

  r.post('/', validate(salaSchema), (req, res, next) => {
    try {
      const v = req.validado;
      if (req.usuario.rol === 'estudiante') {
        return res.status(403).json({ error: 'Los estudiantes no pueden crear salas' });
      }
      if (v.tipo === 'clase') {
        const cursoId = v.cursoId ?? (v.sesionId ? SesionRepository.findById(v.sesionId)?.curso_id : null);
        if (!cursoId) return res.status(400).json({ error: 'Una sala de clase requiere curso o sesión válida' });
        const curso = CursoRepository.findById(cursoId);
        if (!curso) return res.status(404).json({ error: 'Aula no encontrada' });
        if (req.usuario.rol !== 'coordinacion' && curso.docente_id !== req.usuario.id) {
          return res.status(403).json({ error: 'Solo el docente del aula o coordinación puede crear la sala de clase' });
        }
        v.cursoId = cursoId;
      }
      const id = SalaRepository.crear({
        tipo: v.tipo,
        titulo: v.titulo,
        descripcion: v.descripcion,
        acceso: v.acceso,
        password: v.acceso === 'restringido' ? v.password || null : null,
        cursoId: v.cursoId,
        sesionId: v.sesionId,
        fechaInicio: v.fecha_inicio,
        estado: v.estado,
        creadoPor: req.usuario.id,
      });
      res.status(201).json(SalaRepository.findById(id));
    } catch (e) {
      next(e);
    }
  });

  r.get('/:id', (req, res, next) => {
    try {
      const sala = SalaRepository.findById(Number(req.params.id));
      if (!sala) return res.status(404).json({ error: 'Sala no encontrada' });
      if (!SalaRepository.puedeVer({ sala, usuario: req.usuario })) {
        return res.status(403).json({ error: 'No tiene acceso a esta sala' });
      }
      res.json(sala);
    } catch (e) {
      next(e);
    }
  });

  r.post('/:id/entrar', validate(salaPasswordSchema), (req, res, next) => {
    try {
      const sala = SalaRepository.findById(Number(req.params.id));
      if (!sala) return res.status(404).json({ error: 'Sala no encontrada' });
      if (sala.estado === 'finalizada') return res.status(400).json({ error: 'La sala ya finalizó' });
      if (!SalaRepository.verificarAcceso({ sala, usuario: req.usuario, password: req.validado.password })) {
        return res.status(403).json({ error: 'Contraseña incorrecta o acceso restringido' });
      }
      const rol = sala.creado_por === req.usuario.id ? 'anfitrion' : req.usuario.rol === 'estudiante' ? 'participante' : 'comoderador';
      SalaRepository.registrarParticipante({ salaId: sala.id, usuarioId: req.usuario.id, rol });
      res.json({ ...sala, rol });
    } catch (e) {
      next(e);
    }
  });

  r.post('/:id/salir', (req, res, next) => {
    try {
      const sala = SalaRepository.findById(Number(req.params.id));
      if (!sala) return res.status(404).json({ error: 'Sala no encontrada' });
      SalaRepository.cerrarParticipante({ salaId: sala.id, usuarioId: req.usuario.id });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  r.get('/:id/participantes', (req, res, next) => {
    try {
      const sala = SalaRepository.findById(Number(req.params.id));
      if (!sala) return res.status(404).json({ error: 'Sala no encontrada' });
      if (!SalaRepository.puedeVer({ sala, usuario: req.usuario })) {
        return res.status(403).json({ error: 'No tiene acceso a esta sala' });
      }
      res.json(SalaRepository.participantes(sala.id));
    } catch (e) {
      next(e);
    }
  });

  r.patch('/:id', validate(salaSchema.partial()), (req, res, next) => {
    try {
      const sala = SalaRepository.findById(Number(req.params.id));
      if (!sala) return res.status(404).json({ error: 'Sala no encontrada' });
      if (!SalaRepository.puedeEditar({ sala, usuario: req.usuario })) {
        return res.status(403).json({ error: 'No puede modificar esta sala' });
      }
      if (req.validado.acceso === 'restringido') {
        if (req.validado.password === undefined && !sala.protegida) {
          return res.status(400).json({ error: 'Debe indicar una contraseña para la sala restringida' });
        }
      } else if (req.validado.acceso === 'abierto') {
        req.validado.password = null;
      }
      SalaRepository.actualizar(sala.id, req.validado);
      res.json(SalaRepository.findById(sala.id));
    } catch (e) {
      next(e);
    }
  });

  r.delete('/:id', (req, res, next) => {
    try {
      const sala = SalaRepository.findById(Number(req.params.id));
      if (!sala) return res.status(404).json({ error: 'Sala no encontrada' });
      if (!SalaRepository.puedeEditar({ sala, usuario: req.usuario })) {
        return res.status(403).json({ error: 'No puede eliminar esta sala' });
      }
      SalaRepository.eliminar(sala.id);
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  return r;
}