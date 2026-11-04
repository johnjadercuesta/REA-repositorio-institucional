import { getDb } from './db.js';

function mapCurso(row) {
  if (!row) return null;
  return {
    id: row.id,
    nombre: row.nombre,
    grado: row.grado,
    asignatura: row.asignatura,
    nivel: row.nivel,
    anio_id: row.anio_id,
    docente_id: row.docente_id,
    docente_nombre: row.docente_nombre || null,
    periodo: row.periodo,
    estado: row.estado,
    creado_en: row.creado_en,
  };
}

export const CursoRepository = {
  listar({ periodo } = {}) {
    let sql = `
      SELECT c.*, u.nombre AS docente_nombre
      FROM cursos c
      LEFT JOIN usuarios u ON u.id = c.docente_id
    `;
    const params = {};
    if (periodo) {
      sql += ' WHERE c.periodo = @periodo';
      params.periodo = periodo;
    }
    sql += ' ORDER BY c.periodo, c.grado, c.asignatura';
    return getDb().prepare(sql).all(params).map(mapCurso);
  },

  findById(id) {
    const row = getDb()
      .prepare(
        `SELECT c.*, u.nombre AS docente_nombre FROM cursos c LEFT JOIN usuarios u ON u.id = c.docente_id WHERE c.id = ?`
      )
      .get(id);
    return mapCurso(row);
  },

  crear({ nombre, grado, asignatura, nivel, anioId, docenteId, periodo }) {
    const res = getDb()
      .prepare(
        `INSERT INTO cursos (nombre, grado, asignatura, nivel, anio_id, docente_id, periodo)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(nombre, grado, asignatura, nivel || null, anioId || null, docenteId || null, periodo || null);
    return Number(res.lastInsertRowid);
  },

  matricular(cursoId, usuarioId) {
    return getDb()
      .prepare('INSERT OR IGNORE INTO matricula (curso_id, usuario_id) VALUES (?, ?)')
      .run(cursoId, usuarioId).changes > 0;
  },

  desmatricular(cursoId, usuarioId) {
    return getDb().prepare('DELETE FROM matricula WHERE curso_id = ? AND usuario_id = ?').run(cursoId, usuarioId).changes > 0;
  },

  matriculados(cursoId) {
    return getDb()
      .prepare(
        `SELECT u.id, u.nombre, u.email, u.rol
         FROM matricula m
         JOIN usuarios u ON u.id = m.usuario_id
         WHERE m.curso_id = ?
         ORDER BY u.nombre`
      )
      .all(cursoId)
      .map((row) => ({ id: row.id, nombre: row.nombre, email: row.email, rol: row.rol }));
  },

  cursosDeUsuario(usuarioId) {
    return getDb()
      .prepare(
        `SELECT DISTINCT c.*, u.nombre AS docente_nombre
         FROM cursos c
         LEFT JOIN usuarios u ON u.id = c.docente_id
         WHERE c.docente_id = ?
            OR c.id IN (SELECT m.curso_id FROM matricula m WHERE m.usuario_id = ?)
         ORDER BY c.periodo, c.grado, c.asignatura`
      )
      .all(usuarioId, usuarioId)
      .map(mapCurso);
  },
};