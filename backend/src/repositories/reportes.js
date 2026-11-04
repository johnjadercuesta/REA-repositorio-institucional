import { getDb } from './db.js';

export const ReporteRepository = {
  cobertura({ anioId, grado, asignatura }) {
    const db = getDb();
    const conditions = ['1=1'];
    const params = {};
    if (anioId) {
      conditions.push('c.anio_id = @anioId');
      params.anioId = anioId;
    }
    if (grado) {
      conditions.push('c.grado = @grado');
      params.grado = grado;
    }
    if (asignatura) {
      conditions.push('c.asignatura = @asignatura');
      params.asignatura = asignatura;
    }
    const where = conditions.join(' AND ');
    return db
      .prepare(
        `SELECT c.nivel, c.grado, c.asignatura, c.unidad, c.contenido,
          COUNT(DISTINCT rc.recurso_id) AS cantidad_recursos,
          CASE WHEN COUNT(DISTINCT rc.recurso_id) > 0 THEN 1 ELSE 0 END AS cubierto
         FROM curriculo c
         LEFT JOIN recurso_contenido rc ON rc.contenido_id = c.id
         WHERE ${where}
         GROUP BY c.id
         ORDER BY c.grado, c.asignatura, c.unidad, c.contenido`
      )
      .all(params);
  },

  coberturaResumen({ anioId, grado, asignatura }) {
    const db = getDb();
    const conditions = ['1=1'];
    const params = {};
    if (anioId) {
      conditions.push('c.anio_id = @anioId');
      params.anioId = anioId;
    }
    if (grado) {
      conditions.push('c.grado = @grado');
      params.grado = grado;
    }
    if (asignatura) {
      conditions.push('c.asignatura = @asignatura');
      params.asignatura = asignatura;
    }
    const where = conditions.join(' AND ');
    return db
      .prepare(
        `SELECT
           COUNT(*) AS total_contenidos,
           SUM(CASE WHEN (SELECT COUNT(*) FROM recurso_contenido rc WHERE rc.contenido_id = c.id) > 0 THEN 1 ELSE 0 END) AS contenidos_cubiertos,
           ROUND(100.0 * SUM(CASE WHEN (SELECT COUNT(*) FROM recurso_contenido rc WHERE rc.contenido_id = c.id) > 0 THEN 1 ELSE 0 END) / COUNT(*), 1) AS pct_cobertura
         FROM curriculo c
         WHERE ${where}`
      )
      .get(params);
  },

  uso({ desde, hasta, page = 1, pageSize = 100 }) {
    const db = getDb();
    const conditions = ['r.estado != "archivado"'];
    const params = {};
    if (desde) {
      conditions.push('r.creado_en >= @desde');
      params.desde = desde;
    }
    if (hasta) {
      conditions.push('r.creado_en <= @hasta');
      params.hasta = hasta;
    }
    const where = conditions.join(' AND ');
    const rows = db
      .prepare(
        `SELECT r.id, r.titulo, u.nombre AS usuario_nombre, r.tipo, r.estado,
           r.contador_descargas,
           (SELECT COUNT(*) FROM uso_descargas ud WHERE ud.recurso_id = r.id AND (@desde IS NULL OR ud.creado_en >= @desde) AND (@hasta IS NULL OR ud.creado_en <= @hasta)) AS descargas_periodo,
           (SELECT AVG(puntaje) FROM valoraciones v WHERE v.recurso_id = r.id) AS puntaje_promed,
           (SELECT COUNT(*) FROM valoraciones v WHERE v.recurso_id = r.id) AS total_valoraciones
         FROM recursos r
         JOIN usuarios u ON u.id = r.usuario_id
         WHERE ${where}
         ORDER BY descargas_periodo DESC
         LIMIT @limit OFFSET @offset`
      )
      .all({ ...params, desde: desde || null, hasta: hasta || null, limit: pageSize, offset: (page - 1) * pageSize });

    const total = Number(
      db.prepare(`SELECT COUNT(*) AS t FROM recursos r WHERE ${where}`).get(params).t
    );
    return { data: rows, total, page, pageSize };
  },

  asistencia({ cursoId }) {
    const db = getDb();
    const cond = cursoId ? 'AND c.id = @cursoId' : '';
    const rows = db
      .prepare(
        `SELECT c.id AS curso_id, c.nombre AS curso_nombre,
           u.id AS estudiante_id, u.nombre AS estudiante, u.email,
           COUNT(s.id) AS total_sesiones,
           SUM(CASE WHEN a.estado = 'presente' THEN 1 ELSE 0 END) AS presentes,
           SUM(CASE WHEN a.estado = 'ausente' THEN 1 ELSE 0 END) AS ausentes,
           SUM(CASE WHEN a.estado = 'justificado' THEN 1 ELSE 0 END) AS justificados
         FROM cursos c
         JOIN matricula m ON m.curso_id = c.id
         JOIN usuarios u ON u.id = m.usuario_id AND u.rol = 'estudiante'
         JOIN sesiones s ON s.curso_id = c.id
         LEFT JOIN asistencia a ON a.sesion_id = s.id AND a.usuario_id = u.id
         WHERE 1=1 ${cond}
         GROUP BY c.id, u.id
         ORDER BY c.nombre, u.nombre`
      )
      .all(cursoId ? { cursoId } : {})
      .map((r) => ({
        curso_id: r.curso_id,
        curso_nombre: r.curso_nombre,
        estudiante_id: r.estudiante_id,
        estudiante: r.estudiante,
        email: r.email,
        total_sesiones: Number(r.total_sesiones || 0),
        presentes: Number(r.presentes || 0),
        ausentes: Number(r.ausentes || 0),
        justificados: Number(r.justificados || 0),
        pct_asistencia: Number(
          r.total_sesiones
            ? Math.round((100 * Number(r.presentes || 0)) / r.total_sesiones)
            : 0
        ),
      }));
    const resumen = db
      .prepare(
        `SELECT COUNT(DISTINCT c.id) AS cursos,
           COUNT(DISTINCT u.id) AS estudiantes,
           COUNT(DISTINCT s.id) AS total_sesiones,
           SUM(CASE WHEN a.estado = 'presente' THEN 1 ELSE 0 END) AS presentes
         FROM cursos c
         JOIN matricula m ON m.curso_id = c.id
         JOIN usuarios u ON u.id = m.usuario_id AND u.rol = 'estudiante'
         JOIN sesiones s ON s.curso_id = c.id
         LEFT JOIN asistencia a ON a.sesion_id = s.id AND a.usuario_id = u.id
         WHERE 1=1 ${cond}`
      )
      .get(cursoId ? { cursoId } : {});
    return {
      rows,
      resumen: {
        cursos: Number(resumen?.cursos || 0),
        estudiantes: Number(resumen?.estudiantes || 0),
        total_sesiones: Number(resumen?.total_sesiones || 0),
        presentes: Number(resumen?.presentes || 0),
      },
    };
  },
};
