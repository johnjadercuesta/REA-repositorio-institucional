import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRol, validate } from '../middleware/index.js';
import { RecursoRepository } from '../repositories/recursos.js';
import { CapituloRepository } from '../repositories/capitulos.js';
import { buscarRecursoSchema, recursoSchema, editarRecursoSchema, valoracionSchema, capituloSchema, reordenarCapitulosSchema } from '../schema/schemas.js';
import { config } from '../config.js';

fs.mkdirSync(config.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${crypto.randomBytes(12).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSizeMb * 1024 * 1024 },
});

function rutaDeArchivo(nombre) {
  if (!nombre) return null;
  const raiz = path.resolve(config.uploadDir);
  const ruta = path.resolve(path.join(config.uploadDir, nombre));
  if (!ruta.startsWith(raiz) || !fs.existsSync(ruta)) return null;
  return ruta;
}

function tipoPorFormato(nombre) {
  const ext = (path.extname(nombre) || '').replace('.', '').toLowerCase();
  if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio';
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'imagen';
  return 'documento';
}

export function recursosRouter() {
  const r = Router();
  r.use(requireAuth);

  r.get('/', validate(buscarRecursoSchema), (req, res, next) => {
    try {
      const { page = 1, pageSize = 20, ...filtros } = req.validado;
      res.json(RecursoRepository.buscar({ ...filtros, page, pageSize }));
    } catch (e) {
      next(e);
    }
  });

  r.post('/', upload.single('archivo'), validate(recursoSchema), (req, res, next) => {
    try {
      const v = req.validado;
      const esArchivo = Boolean(req.file);
      const tipo = esArchivo ? v.tipo || tipoPorFormato(req.file.originalname) : v.tipo || 'enlace';
      const url = esArchivo ? null : v.url_externa || null;
      if (v.tipo === 'simulacion' && !url) {
        return res.status(400).json({ error: 'Una simulación requiere una URL de enlace' });
      }
      const id = RecursoRepository.crear({
        titulo: v.titulo,
        descripcion: v.descripcion,
        autor: v.autor,
        usuarioId: req.usuario.id,
        tipo,
        formato: esArchivo ? path.extname(req.file.originalname).replace('.', '') || 'archivo' : null,
        licencia: v.licencia,
        urlExterna: url,
        archivo: esArchivo ? req.file.filename : null,
        nombreOriginal: esArchivo ? req.file.originalname : null,
        estado: v.estado,
      });
      RecursoRepository.vincularContenidos(id, v.contenido_ids || []);
      res.status(201).json(RecursoRepository.findById(id));
    } catch (e) {
      next(e);
    }
  });

  r.get('/:id', (req, res, next) => {
    try {
      const recurso = RecursoRepository.findById(Number(req.params.id));
      if (!recurso) return res.status(404).json({ error: 'Recurso no encontrado' });
      recurso.valoraciones = RecursoRepository.valoraciones(recurso.id);
      res.json(recurso);
    } catch (e) {
      next(e);
    }
  });

  r.put('/:id', upload.single('archivo'), validate(editarRecursoSchema), (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const existente = RecursoRepository.findById(id);
      if (!existente) return res.status(404).json({ error: 'Recurso no encontrado' });
      if (existente.usuario_id !== req.usuario.id && req.usuario.rol !== 'coordinacion') {
        return res.status(403).json({ error: 'No puede editar un recurso ajeno' });
      }
      const v = req.validado;
      RecursoRepository.actualizar(id, {
        titulo: v.titulo,
        descripcion: v.descripcion,
        autor: v.autor,
        tipo: v.tipo,
        formato: v.formato,
        licencia: v.licencia,
        urlExterna: v.url_externa,
        estado: v.estado,
      });
      if (req.file) {
        RecursoRepository.actualizarArchivo(id, req.file.filename, req.file.originalname);
        const rutaVieja = rutaDeArchivo(existente.archivo);
        if (rutaVieja) {
          try {
            fs.unlinkSync(rutaVieja);
          } catch {
            /* ignorar */
          }
        }
      }
      if (v.contenido_ids) RecursoRepository.reemplazarContenidos(id, v.contenido_ids);
      res.json(RecursoRepository.findById(id));
    } catch (e) {
      next(e);
    }
  });

  r.delete('/:id', (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const existente = RecursoRepository.findById(id);
      if (!existente) return res.status(404).json({ error: 'Recurso no encontrado' });
      if (existente.usuario_id !== req.usuario.id && req.usuario.rol !== 'coordinacion') {
        return res.status(403).json({ error: 'No puede archivar un recurso ajeno' });
      }
      RecursoRepository.archivar(id);
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  r.post('/:id/valorar', validate(valoracionSchema), (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!RecursoRepository.findById(id)) {
        return res.status(404).json({ error: 'Recurso no encontrado' });
      }
      RecursoRepository.valorar({ recursoId: id, usuarioId: req.usuario.id, ...req.validado });
      res.json(RecursoRepository.findById(id));
    } catch (e) {
      next(e);
    }
  });

  r.get('/:id/archivo', (req, res, next) => {
    try {
      const recurso = RecursoRepository.findById(Number(req.params.id));
      if (!recurso) return res.status(404).json({ error: 'Recurso no encontrado' });
      const ruta = rutaDeArchivo(recurso.archivo);
      if (!ruta) return res.status(404).json({ error: 'Archivo no disponible' });
      res.sendFile(ruta);
    } catch (e) {
      next(e);
    }
  });

  r.get('/:id/descargar', (req, res, next) => {
    try {
      const recurso = RecursoRepository.findById(Number(req.params.id));
      if (!recurso) return res.status(404).json({ error: 'Recurso no encontrado' });
      if (recurso.url_externa) return res.redirect(recurso.url_externa);
      const ruta = rutaDeArchivo(recurso.archivo);
      if (!ruta) return res.status(404).json({ error: 'Archivo no disponible' });
      RecursoRepository.incrementarDescarga(recurso.id);
      if (config.logDownloads) RecursoRepository.registrarDescarga(recurso.id, req.usuario.id);
      res.download(ruta, recurso.nombre_archivo_original || 'recurso');
    } catch (e) {
      next(e);
    }
  });

  // ---------- Capítulos (libros por capítulos) ----------
  r.get('/:id/capitulos', (req, res, next) => {
    try {
      const recurso = RecursoRepository.findById(Number(req.params.id));
      if (!recurso) return res.status(404).json({ error: 'Recurso no encontrado' });
      res.json(CapituloRepository.listar(recurso.id));
    } catch (e) {
      next(e);
    }
  });

  r.post('/:id/capitulos', upload.single('archivo'), validate(capituloSchema), (req, res, next) => {
    try {
      const recurso = RecursoRepository.findById(Number(req.params.id));
      if (!recurso) return res.status(404).json({ error: 'Recurso no encontrado' });
      if (recurso.usuario_id !== req.usuario.id && req.usuario.rol !== 'coordinacion') {
        return res.status(403).json({ error: 'No puede editar un recurso ajeno' });
      }
      const v = req.validado;
      const tipo = v.tipo;
      if (['pdf', 'imagen'].includes(tipo) && !req.file) {
        return res.status(400).json({ error: 'Este tipo de capítulo requiere un archivo' });
      }
      const id = CapituloRepository.crear({
        recursoId: recurso.id,
        titulo: v.titulo,
        tipo,
        archivo: req.file ? req.file.filename : null,
        nombreOriginal: req.file ? req.file.originalname : null,
        url: v.url || null,
        html: v.html || null,
      });
      res.status(201).json(CapituloRepository.findById(id));
    } catch (e) {
      next(e);
    }
  });

  r.put('/:id/capitulos/orden', validate(reordenarCapitulosSchema), (req, res, next) => {
    try {
      const recurso = RecursoRepository.findById(Number(req.params.id));
      if (!recurso) return res.status(404).json({ error: 'Recurso no encontrado' });
      if (recurso.usuario_id !== req.usuario.id && req.usuario.rol !== 'coordinacion') {
        return res.status(403).json({ error: 'No puede editar un recurso ajeno' });
      }
      CapituloRepository.reordenar(recurso.id, req.validado.capitulos);
      res.json(CapituloRepository.listar(recurso.id));
    } catch (e) {
      next(e);
    }
  });

  r.put('/:id/capitulos/:capId', upload.single('archivo'), validate(capituloSchema.partial()), (req, res, next) => {
    try {
      const recurso = RecursoRepository.findById(Number(req.params.id));
      if (!recurso) return res.status(404).json({ error: 'Recurso no encontrado' });
      if (recurso.usuario_id !== req.usuario.id && req.usuario.rol !== 'coordinacion') {
        return res.status(403).json({ error: 'No puede editar un recurso ajeno' });
      }
      const cap = CapituloRepository.findById(Number(req.params.capId));
      if (!cap) return res.status(404).json({ error: 'Capítulo no encontrado' });
      const v = req.validado;
      CapituloRepository.actualizar(cap.id, {
        titulo: v.titulo,
        tipo: v.tipo,
        url: v.url,
        html: v.html,
      });
      if (req.file) {
        CapituloRepository.actualizar(cap.id, {
          archivo: req.file.filename,
          archivoNombre: req.file.originalname,
        });
        const rutaVieja = rutaDeArchivo(cap.archivo);
        if (rutaVieja) {
          try {
            fs.unlinkSync(rutaVieja);
          } catch {
            /* ignorar */
          }
        }
      }
      res.json(CapituloRepository.findById(cap.id));
    } catch (e) {
      next(e);
    }
  });

  r.get('/:id/capitulos/:capId/archivo', (req, res, next) => {
    try {
      const cap = CapituloRepository.findById(Number(req.params.capId));
      if (!cap || !cap.archivo) return res.status(404).json({ error: 'Archivo no disponible' });
      const ruta = rutaDeArchivo(cap.archivo);
      if (!ruta) return res.status(404).json({ error: 'Archivo no disponible' });
      res.sendFile(ruta);
    } catch (e) {
      next(e);
    }
  });

  r.delete('/:id/capitulos/:capId', (req, res, next) => {
    try {
      const recurso = RecursoRepository.findById(Number(req.params.id));
      if (!recurso) return res.status(404).json({ error: 'Recurso no encontrado' });
      if (recurso.usuario_id !== req.usuario.id && req.usuario.rol !== 'coordinacion') {
        return res.status(403).json({ error: 'No puede editar un recurso ajeno' });
      }
      const cap = CapituloRepository.findById(Number(req.params.capId));
      if (!cap) return res.status(404).json({ error: 'Capítulo no encontrado' });
      const ruta = rutaDeArchivo(cap.archivo);
      CapituloRepository.eliminar(cap.id);
      if (ruta) {
        try {
          fs.unlinkSync(ruta);
        } catch {
          /* ignorar */
        }
      }
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  return r;
}