import { getDb } from './db.js';

function mapCapitulo(row) {
  if (!row) return null;
  return {
    id: row.id,
    recurso_id: row.recurso_id,
    titulo: row.titulo,
    orden: row.orden,
    tipo: row.tipo,
    archivo: row.archivo,
    archivo_nombre_original: row.archivo_nombre_original,
    url: row.url,
    html: row.html,
    creado_en: row.creado_en,
    actualizado_en: row.actualizado_en,
  };
}

export const CapituloRepository = {
  listar(recursoId) {
    return getDb()
      .prepare('SELECT * FROM capitulos WHERE recurso_id = ? ORDER BY orden, id')
      .all(recursoId)
      .map(mapCapitulo);
  },

  findById(id) {
    return mapCapitulo(getDb().prepare('SELECT * FROM capitulos WHERE id = ?').get(id));
  },

  crear({ recursoId, titulo, tipo, archivo, nombreOriginal, url, html }) {
    const db = getDb();
    const max = db
      .prepare('SELECT IFNULL(MAX(orden), -1) AS m FROM capitulos WHERE recurso_id = ?')
      .get(recursoId);
    const res = db
      .prepare(
        `INSERT INTO capitulos (recurso_id, titulo, orden, tipo, archivo, archivo_nombre_original, url, html)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(recursoId, titulo, Number(max.m) + 1, tipo, archivo || null, nombreOriginal || null, url || null, html || null);
    return Number(res.lastInsertRowid);
  },

  actualizar(id, campos) {
    const db = getDb();
    const keyMap = {
      titulo: 'titulo',
      tipo: 'tipo',
      archivo: 'archivo',
      archivoNombre: 'archivo_nombre_original',
      url: 'url',
      html: 'html',
      orden: 'orden',
    };
    const claves = Object.keys(campos).filter((k) => keyMap[k] && campos[k] !== undefined);
    if (!claves.length) return 0;
    const sets = claves.map((k) => `${keyMap[k]} = ?`).join(', ');
    return db
      .prepare(`UPDATE capitulos SET ${sets}, actualizado_en = datetime('now') WHERE id = ?`)
      .run(...claves.map((k) => campos[k]), id).changes;
  },

  eliminar(id) {
    return getDb().prepare('DELETE FROM capitulos WHERE id = ?').run(id).changes;
  },

  reordenar(recursoId, ordenIds) {
    const db = getDb();
    db.exec('BEGIN');
    try {
      ordenIds.forEach((cid, idx) => {
        db.prepare('UPDATE capitulos SET orden = ?, actualizado_en = datetime(\'now\') WHERE id = ? AND recurso_id = ?').run(idx, cid, recursoId);
      });
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  },
};