import { getDb } from './db.js';

export const AsistenciaRepository = {
  // Estudiantes matriculados del curso de la sesión + su estado actual.
  listarPorSesion(sesionId) {
    const db = getDb();
    const fila = db
      .prepare('SELECT curso_id FROM sesiones WHERE id = ?')
      .get(sesionId);
    if (!fila) return null;
    const estudiantes = db
      .prepare(
        `SELECT u.id AS usuario_id, u.nombre, u.email,
          COALESCE(a.estado, 'sin-registrar') AS estado,
          a.actualizado_en
         FROM matricula m
         JOIN usuarios u ON u.id = m.usuario_id
         LEFT JOIN asistencia a ON a.usuario_id = u.id AND a.sesion_id = ?
         WHERE m.curso_id = ? AND u.rol = 'estudiante'
         ORDER BY u.nombre`
      )
      .all(sesionId, fila.curso_id);
    return { curso_id: fila.curso_id, estudiantes };
  },

  marcarLote({ sesionId, registros, registradoPor }) {
    const db = getDb();
    db.exec('BEGIN');
    try {
      const upsert = db.prepare(
        `INSERT INTO asistencia (sesion_id, usuario_id, estado, registrado_por)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (sesion_id, usuario_id) DO UPDATE SET
           estado = excluded.estado,
           registrado_por = excluded.registrado_por,
           actualizado_en = datetime('now')`
      );
      for (const r of registros) {
        upsert.run(sesionId, r.usuarioId, r.estado, registradoPor);
      }
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
    return this.listarPorSesion(sesionId);
  },

  marcarTodos(sesionId, estado, registradoPor) {
    const db = getDb();
    const lista = this.listarPorSesion(sesionId);
    if (!lista) return null;
    db.exec('BEGIN');
    try {
      const upsert = db.prepare(
        `INSERT INTO asistencia (sesion_id, usuario_id, estado, registrado_por)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (sesion_id, usuario_id) DO UPDATE SET
           estado = excluded.estado,
           registrado_por = excluded.registrado_por,
           actualizado_en = datetime('now')`
      );
      for (const s of lista.estudiantes) {
        upsert.run(sesionId, s.usuario_id, estado, registradoPor);
      }
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
    return this.listarPorSesion(sesionId);
  },

  // Resumen para reportes: cantidad de sesiones y asistencia por alumno.
  resumenPorAlumno(usuarioId) {
    return getDb()
      .prepare(
        `SELECT c.id AS curso_id, c.nombre AS curso_nombre,
          COUNT(s.id) AS total_sesiones,
          SUM(CASE WHEN a.estado = 'presente' THEN 1 ELSE 0 END) AS presentes,
          SUM(CASE WHEN a.estado = 'ausente' THEN 1 ELSE 0 END) AS ausencias,
          SUM(CASE WHEN a.estado = 'justificado' THEN 1 ELSE 0 END) AS justificados
         FROM cursos c
         JOIN matricula m ON m.curso_id = c.id
         JOIN sesiones s ON s.curso_id = c.id
         LEFT JOIN asistencia a ON a.sesion_id = s.id AND a.usuario_id = m.usuario_id
         WHERE m.usuario_id = ?
         GROUP BY c.id
         ORDER BY c.nombre`
      )
      .all(usuarioId)
      .map((r) => ({
        curso_id: r.curso_id,
        curso_nombre: r.curso_nombre,
        total_sesiones: Number(r.total_sesiones || 0),
        presentes: Number(r.presentes || 0),
        ausencias: Number(r.ausencias || 0),
        justificados: Number(r.justificados || 0),
      }));
  },
};
