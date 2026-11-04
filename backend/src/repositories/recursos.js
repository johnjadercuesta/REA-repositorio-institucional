import { getDb } from './db.js';

function mapRecurso(row) {
  if (!row) return null;
  return {
    id: row.id,
    titulo: row.titulo,
    descripcion: row.descripcion,
    autor: row.autor,
    usuario_id: row.usuario_id,
    usuario_nombre: row.usuario_nombre,
    tipo: row.tipo,
    formato: row.formato,
    licencia: row.licencia,
    url_externa: row.url_externa,
    archivo: row.archivo,
    nombre_archivo_original: row.nombre_archivo_original,
    contador_descargas: row.contador_descargas,
    estado: row.estado,
    puntaje_promed: Number(row.puntaje_promed || 0),
    total_valoraciones: Number(row.total_valoraciones || 0),
    creado_en: row.creado_en,
    actualizado_en: row.actualizado_en,
    grados: row.grados || null,
  };
}

function contenidoSelect() {
  return `, c.id AS cont_id, c.nivel AS cont_nivel, c.grado AS cont_grado, c.asignatura AS cont_asignatura,
  c.unidad AS cont_unidad, c.contenido AS cont_contenido`;
}

export const RecursoRepository = {
  crear({ titulo, descripcion, autor, usuarioId, tipo, formato, licencia, urlExterna, archivo, nombreOriginal, estado }) {
    const db = getDb();
    const res = db
      .prepare(
        `INSERT INTO recursos
        (titulo, descripcion, autor, usuario_id, tipo, formato, licencia, url_externa, archivo, nombre_archivo_original, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        titulo,
        descripcion || null,
        autor || null,
        usuarioId,
        tipo || 'documento',
        formato || null,
        licencia || 'CC BY',
        urlExterna || null,
        archivo || null,
        nombreOriginal || null,
        estado || 'publicado'
      );
    return Number(res.lastInsertRowid);
  },

  vincularContenidos(recursoId, contenidoIds) {
    const db = getDb();
    if (!contenidoIds || !contenidoIds.length) return;
    db.exec('BEGIN');
    try {
      const stmt = db.prepare('INSERT OR IGNORE INTO recurso_contenido (recurso_id, contenido_id) VALUES (?, ?)');
      for (const id of contenidoIds) stmt.run(recursoId, id);
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  },

  reemplazarContenidos(recursoId, contenidoIds) {
    const db = getDb();
    db.exec('BEGIN');
    try {
      db.prepare('DELETE FROM recurso_contenido WHERE recurso_id = ?').run(recursoId);
      if (contenidoIds && contenidoIds.length) {
        const stmt = db.prepare('INSERT OR IGNORE INTO recurso_contenido (recurso_id, contenido_id) VALUES (?, ?)');
        for (const id of contenidoIds) stmt.run(recursoId, id);
      }
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  },

  buscar({ q, tipo, grado, asignatura, asignaturas, unidad, licencia, estado, page = 1, pageSize = 20, orden } = {}) {
    const db = getDb();
    const conditions = ['r.estado = @estado'];
    const params = { estado: estado || 'publicado' };
    if (q) {
      conditions.push('(r.titulo LIKE @q OR r.descripcion LIKE @q OR r.autor LIKE @q)');
      params.q = `%${q}%`;
    }
    if (tipo) {
      conditions.push('r.tipo = @tipo');
      params.tipo = tipo;
    }
    if (licencia) {
      conditions.push('r.licencia = @licencia');
      params.licencia = licencia;
    }
    if (grado || asignatura || asignaturas || unidad) {
      const c = [];
      if (grado) {
        c.push('c.grado = @grado');
        params.grado = grado;
      }
      if (asignatura) {
        c.push('c.asignatura = @asignatura');
        params.asignatura = asignatura;
      }
      if (asignaturas) {
        const lista = asignaturas
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        if (lista.length) {
          const pl = lista.map((_, i) => `@asi${i}`).join(', ');
          lista.forEach((s, i) => (params[`asi${i}`] = s));
          c.push(`c.asignatura IN (${pl})`);
        }
      }
      if (unidad) {
        c.push('c.unidad = @unidad');
        params.unidad = unidad;
      }
      conditions.push(
        `EXISTS (SELECT 1 FROM recurso_contenido rc2 JOIN curriculo c ON c.id = rc2.contenido_id WHERE rc2.recurso_id = r.id AND ${c.join(' AND ')})`
      );
    }

    const orderMap = {
      recientes: 'r.creado_en DESC',
      titulo: 'r.titulo ASC',
      valoracion: '(SELECT AVG(puntaje) FROM valoraciones WHERE recurso_id = r.id) DESC',
      descargas: 'r.contador_descargas DESC',
    };
    const orderBy = orderMap[orden] || orderMap.recientes;

    const sql = `
      SELECT r.*, u.nombre AS usuario_nombre,
        (SELECT AVG(puntaje) FROM valoraciones WHERE recurso_id = r.id) AS puntaje_promed,
        (SELECT COUNT(*) FROM valoraciones WHERE recurso_id = r.id) AS total_valoraciones,
        (SELECT GROUP_CONCAT(DISTINCT c2.grado) FROM recurso_contenido rc2 JOIN curriculo c2 ON c2.id = rc2.contenido_id WHERE rc2.recurso_id = r.id) AS grados
      FROM recursos r
      JOIN usuarios u ON u.id = r.usuario_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT @limit OFFSET @offset
    `;

    const rows = db
      .prepare(sql)
      .all({ ...params, limit: pageSize, offset: (page - 1) * pageSize })
      .map(mapRecurso);

    const total = Number(
      db.prepare(`SELECT COUNT(*) AS t FROM recursos r WHERE ${conditions.join(' AND ')}`).get(params).t
    );

    return { data: rows, total, page, pageSize };
  },

  findById(id) {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT r.*, u.nombre AS usuario_nombre,
          (SELECT AVG(puntaje) FROM valoraciones WHERE recurso_id = r.id) AS puntaje_promed,
          (SELECT COUNT(*) FROM valoraciones WHERE recurso_id = r.id) AS total_valoraciones
          ${contenidoSelect()}
         FROM recursos r
         JOIN usuarios u ON u.id = r.usuario_id
         LEFT JOIN recurso_contenido rc ON rc.recurso_id = r.id
         LEFT JOIN curriculo c ON c.id = rc.contenido_id
         WHERE r.id = ?`
      )
      .all(id);
    if (!rows.length) return null;
    const recurso = mapRecurso(rows[0]);
    recurso.contenidos = rows
      .filter((r) => r.cont_id)
      .map((r) => ({
        id: r.cont_id,
        nivel: r.cont_nivel,
        grado: r.cont_grado,
        asignatura: r.cont_asignatura,
        unidad: r.cont_unidad,
        contenido: r.cont_contenido,
      }));
    return recurso;
  },

  actualizar(id, campos) {
    const db = getDb();
    const keyMap = {
      titulo: 'titulo',
      descripcion: 'descripcion',
      autor: 'autor',
      tipo: 'tipo',
      formato: 'formato',
      licencia: 'licencia',
      urlExterna: 'url_externa',
      estado: 'estado',
    };
    const claves = Object.keys(campos).filter((k) => keyMap[k] && campos[k] !== undefined);
    if (!claves.length) return 0;
    const sets = claves.map((k) => `${keyMap[k]} = ?`).join(', ');
    const values = claves.map((k) => campos[k]);
    return db.prepare(`UPDATE recursos SET ${sets}, actualizado_en = datetime('now') WHERE id = ?`).run(...values, id)
      .changes;
  },

  incrementarDescarga(id) {
    return getDb().prepare('UPDATE recursos SET contador_descargas = contador_descargas + 1 WHERE id = ?').run(id).changes;
  },

  registrarDescarga(recursoId, usuarioId) {
    return getDb().prepare('INSERT INTO uso_descargas (recurso_id, usuario_id) VALUES (?, ?)').run(recursoId, usuarioId);
  },

  valorar({ recursoId, usuarioId, puntaje, comentario }) {
    const db = getDb();
    db.exec('BEGIN');
    try {
      db.prepare('DELETE FROM valoraciones WHERE recurso_id = ? AND usuario_id = ?').run(recursoId, usuarioId);
      db.prepare('INSERT INTO valoraciones (recurso_id, usuario_id, puntaje, comentario) VALUES (?, ?, ?, ?)').run(
        recursoId,
        usuarioId,
        puntaje,
        comentario || null
      );
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  },

  valoraciones(recursoId) {
    return getDb()
      .prepare(
        `SELECT v.puntaje, v.comentario, v.creado_en, u.nombre AS usuario_nombre
         FROM valoraciones v JOIN usuarios u ON u.id = v.usuario_id
         WHERE v.recurso_id = ? ORDER BY v.creado_en DESC`
      )
      .all(recursoId);
  },

  archivar(id) {
    return getDb().prepare("UPDATE recursos SET estado = 'archivado', actualizado_en = datetime('now') WHERE id = ?").run(id)
      .changes;
  },

  actualizarArchivo(id, archivo, nombreOriginal) {
    return getDb()
      .prepare("UPDATE recursos SET archivo = ?, nombre_archivo_original = ?, actualizado_en = datetime('now') WHERE id = ?")
      .run(archivo, nombreOriginal, id).changes;
  },
};
