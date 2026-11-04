import { getDb } from './db.js';

function mapSesion(row) {
  if (!row) return null;
  return {
    id: row.id,
    curso_id: row.curso_id,
    curso_nombre: row.curso_nombre || null,
    titulo: row.titulo,
    descripcion: row.descripcion,
    fecha_inicio: row.fecha_inicio,
    estado: row.estado,
    creado_por: row.creado_por,
    creado_nombre: row.creado_nombre || null,
    creado_en: row.creado_en,
  };
}

export const SesionRepository = {
  listar(cursoId) {
    return getDb()
      .prepare(
        `SELECT s.*, c.nombre AS curso_nombre, u.nombre AS creado_nombre
         FROM sesiones s
         JOIN cursos c ON c.id = s.curso_id
         LEFT JOIN usuarios u ON u.id = s.creado_por
         WHERE s.curso_id = ?
         ORDER BY s.fecha_inicio DESC, s.id DESC`
      )
      .all(cursoId)
      .map(mapSesion);
  },

  findById(id) {
    const row = getDb()
      .prepare(
        `SELECT s.*, c.nombre AS curso_nombre, u.nombre AS creado_nombre
         FROM sesiones s
         JOIN cursos c ON c.id = s.curso_id
         LEFT JOIN usuarios u ON u.id = s.creado_por
         WHERE s.id = ?`
      )
      .get(id);
    return mapSesion(row);
  },

  crear({ cursoId, titulo, descripcion, fechaInicio, estado, creadoPor }) {
    const res = getDb()
      .prepare(
        `INSERT INTO sesiones (curso_id, titulo, descripcion, fecha_inicio, estado, creado_por)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(cursoId, titulo, descripcion || null, fechaInicio || null, estado || 'programada', creadoPor);
    return Number(res.lastInsertRowid);
  },

  actualizar(id, campos) {
    const sets = [];
    const values = [];
    if (campos.titulo !== undefined) {
      sets.push('titulo = ?');
      values.push(campos.titulo);
    }
    if (campos.descripcion !== undefined) {
      sets.push('descripcion = ?');
      values.push(campos.descripcion);
    }
    if (campos.fecha_inicio !== undefined) {
      sets.push('fecha_inicio = ?');
      values.push(campos.fecha_inicio);
    }
    if (campos.estado !== undefined) {
      sets.push('estado = ?');
      values.push(campos.estado);
    }
    if (!sets.length) return 0;
    return getDb().prepare(`UPDATE sesiones SET ${sets.join(', ')} WHERE id = ?`).run(...values, id).changes;
  },

  eliminar(id) {
    return getDb().prepare('DELETE FROM sesiones WHERE id = ?').run(id).changes;
  },

  puedeEditar({ sesion, usuario }) {
    return usuario.rol === 'coordinacion' || sesion.creado_por === usuario.id;
  },

  puedeVer({ sesion, curso, usuario }) {
    if (usuario.rol === 'coordinacion') return true;
    if (curso.docente_id === usuario.id) return true;
    const db = getDb();
    const esta = db
      .prepare('SELECT 1 FROM matricula WHERE curso_id = ? AND usuario_id = ?')
      .get(curso.id, usuario.id);
    return Boolean(esta);
  },
};
