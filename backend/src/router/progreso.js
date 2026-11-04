import { Router } from 'express';
import { requireAuth, validate } from '../middleware/index.js';
import { ProgresoRepository } from '../repositories/progreso.js';
import { progresoItemSchema, progresoAccionSchema } from '../schema/schemas.js';

function csvResponse(res, filename, rows, columnas) {
  const claves = columnas || Object.keys(rows[0] || {});
  const encabezado = claves.join(',');
  const cuerpo = rows
    .map((row) =>
      claves
        .map((k) => {
          const v = row[k] == null ? '' : String(row[k]);
          return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
        })
        .join(',')
    )
    .join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\uFEFF' + `${encabezado}\n${cuerpo}`);
}

export function progresoRouter() {
  const r = Router();
  r.use(requireAuth);

  r.get('/seguimiento', (req, res) => {
    if (req.usuario.rol === 'estudiante') return res.status(403).json({ error: 'No tiene permisos' });
    const { cursoId, q } = req.query;
    const datos = ProgresoRepository.seguimiento({
      adminId: req.usuario.id,
      rol: req.usuario.rol,
      cursoId: cursoId ? Number(cursoId) : undefined,
      q: (q || '').trim() || undefined,
    });
    if (req.query.csv !== undefined) {
      const columnas = ['nombre', 'email', 'cursos', 'vistos', 'completados', 'favoritos', 'ultima_actividad'];
      const rows = datos.estudiantes.map((e) => ({
        nombre: e.nombre,
        email: e.email,
        cursos: e.cursos.map((c) => `${c.grado} · ${c.asignatura} (${c.nombre})`).join(' | '),
        vistos: e.vistos,
        completados: e.completados,
        favoritos: e.favoritos,
        ultima_actividad: e.ultima_actividad || '',
      }));
      return csvResponse(res, 'seguimiento_progreso.csv', rows, columnas);
    }
    res.json(datos);
  });

  r.get('/seguimiento/:usuarioId', (req, res) => {
    if (req.usuario.rol === 'estudiante') return res.status(403).json({ error: 'No tiene permisos' });
    const detalle = ProgresoRepository.seguimientoDetalle({
      adminId: req.usuario.id,
      rol: req.usuario.rol,
      usuarioId: Number(req.params.usuarioId),
    });
    if (!detalle) return res.status(404).json({ error: 'Estudiante no encontrado o sin acceso' });
    res.json(detalle);
  });

  r.get('/', (req, res) => {
    res.json(ProgresoRepository.resumen({ usuarioId: req.usuario.id }));
  });

  r.get('/estado', (req, res) => {
    const tipo = req.query.tipo;
    const id = Number(req.query.id);
    if (!['recurso', 'simulador'].includes(tipo) || !Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: 'Parámetros inválidos' });
    }
    res.json(ProgresoRepository.estado({ usuarioId: req.usuario.id, tipo, itemId: id }));
  });

  r.get('/continuar', (req, res) => {
    res.json(ProgresoRepository.continuar({ usuarioId: req.usuario.id, limit: Number(req.query.limit || 6) }));
  });

  r.get('/favoritos', (_req, res) => {
    res.json(ProgresoRepository.favoritos({ usuarioId: _req.usuario.id }));
  });

  r.get('/rutas', (req, res) => {
    res.json(ProgresoRepository.rutas({ usuarioId: req.usuario.id }));
  });

  r.get('/rutas/:slug', (req, res) => {
    const ruta = ProgresoRepository.rutaPorSlug({ usuarioId: req.usuario.id, slug: req.params.slug });
    if (!ruta) return res.status(404).json({ error: 'Ruta no encontrada' });
    res.json(ruta);
  });

  r.post('/vista', validate(progresoItemSchema), (req, res, next) => {
    const { tipo, id } = req.validado;
    const estado = ProgresoRepository.registrarVista({ usuarioId: req.usuario.id, tipo, itemId: id });
    if (!estado) return res.status(404).json({ error: 'Elemento no encontrado' });
    res.json(estado);
  });

  r.post('/favorito', validate(progresoAccionSchema), (req, res, next) => {
    const { tipo, id, activo } = req.validado;
    const estado = ProgresoRepository.marcarFavorito({ usuarioId: req.usuario.id, tipo, itemId: id, activo });
    if (!estado) return res.status(404).json({ error: 'Elemento no encontrado' });
    res.json(estado);
  });

  r.post('/completar', validate(progresoAccionSchema), (req, res, next) => {
    const { tipo, id, activo } = req.validado;
    const estado = ProgresoRepository.marcarCompletado({ usuarioId: req.usuario.id, tipo, itemId: id, completado: activo });
    if (!estado) return res.status(404).json({ error: 'Elemento no encontrado' });
    res.json(estado);
  });

  return r;
}