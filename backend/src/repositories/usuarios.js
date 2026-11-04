import { getDb } from './db.js';

export const UsuarioRepository = {
  crear({ nombre, email, passwordHash, rol }) {
    const db = getDb();
    const res = db
      .prepare('INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)')
      .run(nombre, email, passwordHash, rol || 'docente');
    return res.lastInsertRowid;
  },

  findByEmail(email) {
    return getDb().prepare('SELECT * FROM usuarios WHERE email = ?').get(email) || null;
  },

  findById(id) {
    return getDb().prepare('SELECT id, nombre, email, rol, activo, creado_en FROM usuarios WHERE id = ?').get(id) || null;
  },

  listar() {
    return getDb()
      .prepare('SELECT id, nombre, email, rol, activo, creado_en FROM usuarios ORDER BY nombre')
      .all();
  },

  cambiarRol(id, rol) {
    return getDb().prepare('UPDATE usuarios SET rol = ? WHERE id = ?').run(rol, id).changes > 0;
  },

  activar(id, activo) {
    return getDb().prepare('UPDATE usuarios SET activo = ? WHERE id = ?').run(activo ? 1 : 0, id).changes > 0;
  },
};
