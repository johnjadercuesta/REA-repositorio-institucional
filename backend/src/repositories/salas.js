import bcrypt from 'bcryptjs';
import { getDb } from './db.js';

function mapSala(row) {
  if (!row) return null;
  return {
    id: row.id,
    tipo: row.tipo,
    titulo: row.titulo,
    descripcion: row.descripcion,
    acceso: row.acceso,
    protegida: Boolean(row.password_hash),
    curso_id: row.curso_id || null,
    curso_nombre: row.curso_nombre || null,
    sesion_id: row.sesion_id || null,
    sesion_titulo: row.sesion_titulo || null,
    fecha_inicio: row.fecha_inicio,
    estado: row.estado,
    creado_por: row.creado_por,
    creado_nombre: row.creado_nombre || null,
    creado_en: row.creado_en,
  };
}

const SELECT_SALA = `
  SELECT s.*, c.nombre AS curso_nombre, u.nombre AS creado_nombre, se.titulo AS sesion_titulo
  FROM salas s
  LEFT JOIN cursos c ON c.id = s.curso_id
  LEFT JOIN usuarios u ON u.id = s.creado_por
  LEFT JOIN sesiones se ON se.id = s.sesion_id
`;

export function hashPasswordSala(pw) {
  if (!pw) return null;
  return bcrypt.hashSync(String(pw), 8);
}

export const SalaRepository = {
  listarVisibles(usuario) {
    const db = getDb();
    let where;
    const params = [];
    if (usuario.rol === 'coordinacion') {
      where = '1=1';
    } else if (usuario.rol === 'docente') {
      where = `(s.creado_por = ? OR s.tipo = 'clase' AND s.curso_id IN (
                 SELECT c.id FROM cursos c WHERE c.docente_id = ?
               ) OR s.tipo = 'reunion' AND s.acceso = 'abierto')`;
      params.push(usuario.id, usuario.id);
    } else {
      where = `(s.creado_por = ? OR s.tipo = 'clase' AND s.curso_id IN (
                 SELECT m.curso_id FROM matricula m WHERE m.usuario_id = ?
               ) OR s.tipo = 'reunion' AND s.acceso = 'abierto')`;
      params.push(usuario.id, usuario.id);
    }
    const rows = db
      .prepare(`${SELECT_SALA} WHERE ${where} ORDER BY s.creado_en DESC, s.id DESC`)
      .all(...params);
    return rows.map(mapSala);
  },

  findById(id) {
    return mapSala(getDb().prepare(`${SELECT_SALA} WHERE s.id = ?`).get(id));
  },

  crear({
    tipo,
    titulo,
    descripcion,
    acceso,
    password,
    cursoId,
    sesionId,
    fechaInicio,
    estado,
    creadoPor,
  }) {
    const res = getDb()
      .prepare(
        `INSERT INTO salas (tipo, titulo, descripcion, acceso, password_hash, curso_id, sesion_id, fecha_inicio, estado, creado_por)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        tipo || 'reunion',
        titulo,
        descripcion || null,
        acceso || 'abierto',
        hashPasswordSala(password),
        cursoId || null,
        sesionId || null,
        fechaInicio || null,
        estado || 'programada',
        creadoPor
      );
    return Number(res.lastInsertRowid);
  },

  actualizar(id, campos) {
    const sets = [];
    const values = [];
    const mapa = {
      titulo: 'titulo',
      descripcion: 'descripcion',
      acceso: 'acceso',
      fecha_inicio: 'fecha_inicio',
      estado: 'estado',
      tipo: 'tipo',
      cursoId: 'curso_id',
      sesionId: 'sesion_id',
    };
    for (const key of Object.keys(mapa)) {
      if (campos[key] !== undefined) {
        sets.push(`${mapa[key]} = ?`);
        values.push(campos[key]);
      }
    }
    if (campos.password !== undefined) {
      sets.push('password_hash = ?');
      values.push(hashPasswordSala(campos.password));
    }
    if (!sets.length) return 0;
    return getDb().prepare(`UPDATE salas SET ${sets.join(', ')} WHERE id = ?`).run(...values, id).changes;
  },

  eliminar(id) {
    return getDb().prepare('DELETE FROM salas WHERE id = ?').run(id).changes;
  },

  estaMatriculado(cursoId, usuarioId) {
    return getDb().prepare('SELECT 1 FROM matricula WHERE curso_id = ? AND usuario_id = ?').get(cursoId, usuarioId);
  },

  verificarAcceso({ sala, usuario, password }) {
    if (sala.acceso === 'abierto') return true;
    if (usuario.rol === 'coordinacion' || sala.creado_por === usuario.id) return true;
    if (!sala.password_hash) return true;
    return bcrypt.compareSync(String(password || ''), sala.password_hash);
  },

  puedeEditar({ sala, usuario }) {
    return usuario.rol === 'coordinacion' || sala.creado_por === usuario.id;
  },

  puedeVer({ sala, usuario }) {
    if (sala.creado_por === usuario.id || usuario.rol === 'coordinacion') return true;
    if (sala.tipo === 'clase') {
      if (!sala.curso_id) return false;
      if (usuario.rol === 'docente') {
        const curso = getDb().prepare('SELECT 1 FROM cursos WHERE id = ? AND docente_id = ?').get(sala.curso_id, usuario.id);
        return Boolean(curso);
      }
      return Boolean(this.estaMatriculado(sala.curso_id, usuario.id));
    }
    return sala.acceso === 'abierto';
  },

  registrarParticipante({ salaId, usuarioId, rol }) {
    return getDb()
      .prepare(
        `INSERT INTO sala_participantes (sala_id, usuario_id, rol, entrada)
         VALUES (?, ?, ?, datetime('now'))`
      )
      .run(salaId, usuarioId, rol || 'participante').changes;
  },

  cerrarParticipante({ salaId, usuarioId }) {
    return getDb()
      .prepare('UPDATE sala_participantes SET salida = datetime(\'now\') WHERE sala_id = ? AND usuario_id = ? AND salida IS NULL')
      .run(salaId, usuarioId).changes;
  },

  participantes(salaId) {
    return getDb()
      .prepare(
        `SELECT sp.*, u.nombre, u.rol AS rol_sistema
         FROM sala_participantes sp
         JOIN usuarios u ON u.id = sp.usuario_id
         WHERE sp.sala_id = ?
         ORDER BY sp.entrada ASC`
      )
      .all(salaId)
      .map((r) => ({
        usuario_id: r.usuario_id,
        nombre: r.nombre,
        rol: r.rol,
        entrada: r.entrada,
        salida: r.salida,
      }));
  },
};