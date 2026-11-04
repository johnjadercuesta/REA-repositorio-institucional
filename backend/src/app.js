import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { authRouter } from './router/auth.js';
import { usuariosRouter } from './router/usuarios.js';
import { curriculoRouter } from './router/curriculo.js';
import { recursosRouter } from './router/recursos.js';
import { reportesRouter } from './router/reportes.js';
import { cursosRouter } from './router/cursos.js';
import { simuladoresRouter } from './router/simuladores.js';
import { sesionesRouter } from './router/sesiones.js';
import { salasRouter } from './router/salas.js';
import { busquedaRouter } from './router/busqueda.js';
import { progresoRouter } from './router/progreso.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_PUBLIC = process.env.SPA_DIST || path.resolve(__dirname, '..', '..', 'frontend', 'dist');

// Si existe el build estático del frontend, lo servimos (producción con un solo puerto).
function servirSPA(app) {
  const indexHtml = path.join(DIST_PUBLIC, 'index.html');
  if (!fs.existsSync(indexHtml)) return;
  app.use(express.static(DIST_PUBLIC));
  app.get(/^\/(?!api\/|socket\.io).*/, (_req, res) => res.sendFile(indexHtml));
}

export function crearApp() {
  const app = express();
  app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
  app.use(express.json({ limit: '5mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRouter());
  app.use('/api/usuarios', usuariosRouter());
  app.use('/api/curriculo', curriculoRouter());
  app.use('/api/cursos', cursosRouter());
  app.use('/api/simuladores', simuladoresRouter());
  app.use('/api/sesiones', sesionesRouter());
  app.use('/api/salas', salasRouter());
  app.use('/api/recursos', recursosRouter());
  app.use('/api/reportes', reportesRouter());
  app.use('/api/busqueda', busquedaRouter());
  app.use('/api/progreso', progresoRouter());

  servirSPA(app);

  app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = err.status || (err.type === 'entity.parse.failed' ? 400 : 500);
    const body = { error: err.message || 'Error interno del servidor' };
    if (err.detalle) body.detalle = err.detalle;
    if (status === 500) console.error(err);
    res.status(status).json(body);
  });

  return app;
}