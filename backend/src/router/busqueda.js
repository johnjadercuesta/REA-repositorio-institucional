import { Router } from 'express';
import { requireAuth } from '../middleware/index.js';
import { BusquedaRepository } from '../repositories/busqueda.js';

export function busquedaRouter() {
  const r = Router();
  r.use(requireAuth);

  r.get('/', (req, res) => {
    const q = (req.query.q || '').trim();
    if (!q) {
      res.json({ recursos: [], simuladores: [], contenidos: [] });
      return;
    }
    res.json(BusquedaRepository.global({ q, limit: Number(req.query.limit || 20) }));
  });

  r.get('/areas/resumen', (_req, res) => {
    res.json(BusquedaRepository.resumenAreas());
  });

  return r;
}