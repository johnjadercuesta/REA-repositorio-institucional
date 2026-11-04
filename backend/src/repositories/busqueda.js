import { getDb } from './db.js';

export const BusquedaRepository = {
  global({ q, limit = 20 } = {}) {
    const db = getDb();
    const like = `%${q}%`;
    const recursos = db
      .prepare(
        `SELECT id, titulo, descripcion, tipo, (SELECT GROUP_CONCAT(DISTINCT c.grado) FROM recurso_contenido rc JOIN curriculo c ON c.id = rc.contenido_id WHERE rc.recurso_id = r.id) AS grados
         FROM recursos r
         WHERE r.estado = 'publicado' AND (r.titulo LIKE @like OR r.descripcion LIKE @like)
         ORDER BY r.contador_descargas DESC LIMIT @limit`
      )
      .all({ like, limit })
      .map((r) => ({ ...r, clase: 'recurso', area: null }));
    const simuladores = db
      .prepare(
        `SELECT id, nombre AS titulo, descripcion, area, aplicacion
         FROM simuladores
         WHERE activo = 1 AND (nombre LIKE @like OR descripcion LIKE @like)
         LIMIT @limit`
      )
      .all({ like, limit })
      .map((s) => ({ ...s, clase: 'simulador', grados: s.grados }));
    const contenidos = db
      .prepare(
        `SELECT id, nivel, grado, asignatura, unidad, contenido AS titulo
         FROM curriculo
         WHERE contenido LIKE @like OR asignatura LIKE @like OR unidad LIKE @like
         LIMIT @limit`
      )
      .all({ like, limit })
      .map((c) => ({ ...c, clase: 'contenido', descripcion: c.asignatura }));
    return { recursos, simuladores, contenidos };
  },

  resumenAreas() {
    const db = getDb();
    const recursoPorAsignatura = db
      .prepare(
        `SELECT c.asignatura, COUNT(DISTINCT rc.recurso_id) AS total
         FROM recurso_contenido rc
         JOIN curriculo c ON c.id = rc.contenido_id
         JOIN recursos r ON r.id = rc.recurso_id
         WHERE r.estado = 'publicado'
         GROUP BY c.asignatura
         ORDER BY total DESC`
      )
      .all()
      .map((x) => ({ asignatura: x.asignatura, total: Number(x.total) }));
    const simPorArea = db
      .prepare(
        `SELECT area, COUNT(*) AS total FROM simuladores WHERE activo = 1 GROUP BY area ORDER BY total DESC`
      )
      .all()
      .map((x) => ({ area: x.area, total: Number(x.total) }));
    return { recursoPorAsignatura, simPorArea };
  },
};