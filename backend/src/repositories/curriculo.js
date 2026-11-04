import { getDb } from './db.js';

function toCurriculo(row) {
  if (!row) return null;
  return {
    id: row.id,
    nivel: row.nivel,
    grado: row.grado,
    asignatura: row.asignatura,
    unidad: row.unidad,
    contenido: row.contenido,
  };
}

export const CurriculoRepository = {
  anioVigente() {
    return getDb().prepare('SELECT * FROM curriculo_anio WHERE vigente = 1 ORDER BY anio DESC LIMIT 1').get() || null;
  },

  anios() {
    return getDb().prepare('SELECT id, anio, nombre, vigente FROM curriculo_anio ORDER BY anio DESC').all();
  },

  crearAnio({ anio, nombre }) {
    const db = getDb();
    db.prepare('UPDATE curriculo_anio SET vigente = 0').run();
    const res = db.prepare('INSERT INTO curriculo_anio (anio, nombre, vigente) VALUES (?, ?, 1)').run(anio, nombre || String(anio));
    return res.lastInsertRowid;
  },

  crear(entry) {
    const db = getDb();
    const anioId = entry.anio_id ?? db.prepare('SELECT id FROM curriculo_anio WHERE vigente = 1 ORDER BY anio DESC LIMIT 1').get()?.id ?? null;
    const res = db
      .prepare(
        'INSERT INTO curriculo (anio_id, nivel, grado, asignatura, unidad, contenido) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(anioId, entry.nivel, entry.grado, entry.asignatura, entry.unidad, entry.contenido);
    return res.lastInsertRowid;
  },

  listar({ anioId, grado, asignatura, unidad } = {}) {
    let sql = 'SELECT * FROM curriculo WHERE 1=1';
    const params = [];
    if (anioId) {
      sql += ' AND anio_id = ?';
      params.push(anioId);
    }
    if (grado) {
      sql += ' AND grado = ?';
      params.push(grado);
    }
    if (asignatura) {
      sql += ' AND asignatura = ?';
      params.push(asignatura);
    }
    if (unidad) {
      sql += ' AND unidad = ?';
      params.push(unidad);
    }
    sql += ' ORDER BY grado, asignatura, unidad, contenido';
    return getDb().prepare(sql).all(...params).map(toCurriculo);
  },

  findById(id) {
    return toCurriculo(getDb().prepare('SELECT * FROM curriculo WHERE id = ?').get(id));
  },

  grados() {
    return getDb().prepare('SELECT DISTINCT grado FROM curriculo ORDER BY grado').all().map((r) => r.grado);
  },

  asignaturas() {
    return getDb().prepare('SELECT DISTINCT asignatura FROM curriculo ORDER BY asignatura').all().map((r) => r.asignatura);
  },

  unidades() {
    return getDb().prepare('SELECT DISTINCT unidad FROM curriculo WHERE unidad IS NOT NULL AND unidad != "" ORDER BY unidad').all().map((r) => r.unidad);
  },
};
