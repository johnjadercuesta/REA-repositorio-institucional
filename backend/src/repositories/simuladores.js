import { getDb } from './db.js';

export const SimuladorRepository = {
  listar({ incluirInactivos = false } = {}) {
    const db = getDb();
    const sql = incluirInactivos
      ? 'SELECT * FROM simuladores ORDER BY nombre ASC'
      : 'SELECT * FROM simuladores WHERE activo = 1 ORDER BY nombre ASC';
    return db.prepare(sql).all();
  },

  crear({ nombre, descripcion, area, url, nivel, aplicacion }) {
    const db = getDb();
    if (!url && !aplicacion) {
      const err = new Error('Indicá una URL o elegí una aplicación propia');
      err.status = 400;
      throw err;
    }
    const res = db
      .prepare('INSERT INTO simuladores (nombre, descripcion, area, url, nivel, aplicacion) VALUES (?, ?, ?, ?, ?, ?)')
      .run(nombre, descripcion || null, area || 'otro', url || null, nivel || null, aplicacion || null);
    return Number(res.lastInsertRowid);
  },

  actualizar(id, campos) {
    const db = getDb();
    if (campos.url === '' || campos.url === null) campos.url = null;
    if (campos.aplicacion !== undefined && campos.url === null && !campos.aplicacion) {
      const err = new Error('Indicá una URL o una aplicación propia');
      err.status = 400;
      throw err;
    }
    const sets = ['nombre = @nombre'];
    const p = { id, nombre: campos.nombre, descripcion: campos.descripcion ?? null, area: campos.area ?? 'otro', url: campos.url ?? null, nivel: campos.nivel ?? null, aplicacion: campos.aplicacion ?? null, activo: campos.activo ?? 1 };
    return db
      .prepare(`UPDATE simuladores SET nombre = @nombre, descripcion = @descripcion, area = @area, url = @url, nivel = @nivel, aplicacion = @aplicacion, activo = @activo WHERE id = @id`)
      .run(p).changes;
  },

  eliminar(id) {
    return getDb().prepare('DELETE FROM simuladores WHERE id = ?').run(id).changes;
  },
};
