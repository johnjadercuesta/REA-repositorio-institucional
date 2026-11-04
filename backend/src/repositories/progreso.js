import { getDb } from './db.js';
import { AREAS, areaDeAsignatura, areaDeSimulador } from '../catalog.js';

const CLAVE = (tipo, itemId) => `${tipo}:${itemId}`;

function filaVacia(itemId, tipo) {
  return {
    tipo,
    item_id: itemId,
    veces_visto: 0,
    ultima_vista: null,
    completado: 0,
    completado_en: null,
    favorito: 0,
    favorito_en: null,
  };
}

function existeItem(tipo, itemId) {
  const db = getDb();
  if (tipo === 'recurso') {
    return db.prepare('SELECT id FROM recursos WHERE id = ? AND estado = ?').get(itemId, 'publicado');
  }
  return db.prepare('SELECT id FROM simuladores WHERE id = ? AND activo = 1').get(itemId);
}

export const ProgresoRepository = {
  registrarVista({ usuarioId, tipo, itemId }) {
    const db = getDb();
    if (!existeItem(tipo, itemId)) return null;
    db.prepare(
      'INSERT OR IGNORE INTO progreso_usuario (usuario_id, tipo, item_id) VALUES (?, ?, ?)'
    ).run(usuarioId, tipo, itemId);
    db.prepare(
      `UPDATE progreso_usuario
       SET veces_visto = veces_visto + 1, ultima_vista = datetime('now')
       WHERE usuario_id = ? AND tipo = ? AND item_id = ?`
    ).run(usuarioId, tipo, itemId);
    return this.estado({ usuarioId, tipo, itemId });
  },

  marcarFavorito({ usuarioId, tipo, itemId, activo }) {
    const db = getDb();
    if (!existeItem(tipo, itemId)) return null;
    db.prepare('INSERT OR IGNORE INTO progreso_usuario (usuario_id, tipo, item_id) VALUES (?, ?, ?)').run(usuarioId, tipo, itemId);
    let nuevo = activo;
    if (nuevo === undefined) {
      const actual = db
        .prepare('SELECT favorito FROM progreso_usuario WHERE usuario_id = ? AND tipo = ? AND item_id = ?')
        .get(usuarioId, tipo, itemId);
      nuevo = actual?.favorito ? 0 : 1;
    }
    db.prepare(
      `UPDATE progreso_usuario
       SET favorito = ?, favorito_en = CASE WHEN ? = 1 THEN datetime('now') ELSE NULL END
       WHERE usuario_id = ? AND tipo = ? AND item_id = ?`
    ).run(nuevo, nuevo, usuarioId, tipo, itemId);
    return this.estado({ usuarioId, tipo, itemId });
  },

  marcarCompletado({ usuarioId, tipo, itemId, completado }) {
    const db = getDb();
    if (!existeItem(tipo, itemId)) return null;
    db.prepare('INSERT OR IGNORE INTO progreso_usuario (usuario_id, tipo, item_id) VALUES (?, ?, ?)').run(usuarioId, tipo, itemId);
    let nuevo = completado;
    if (nuevo === undefined) {
      const actual = db
        .prepare('SELECT completado FROM progreso_usuario WHERE usuario_id = ? AND tipo = ? AND item_id = ?')
        .get(usuarioId, tipo, itemId);
      nuevo = actual?.completado ? 0 : 1;
    }
    db.prepare(
      `UPDATE progreso_usuario
       SET completado = ?, completado_en = CASE WHEN ? = 1 THEN datetime('now') ELSE NULL END
       WHERE usuario_id = ? AND tipo = ? AND item_id = ?`
    ).run(nuevo, nuevo, usuarioId, tipo, itemId);
    return this.estado({ usuarioId, tipo, itemId });
  },

  estado({ usuarioId, tipo, itemId }) {
    const db = getDb();
    const fila = db
      .prepare('SELECT * FROM progreso_usuario WHERE usuario_id = ? AND tipo = ? AND item_id = ?')
      .get(usuarioId, tipo, itemId);
    return fila
      ? {
          tipo: fila.tipo,
          item_id: fila.item_id,
          veces_visto: Number(fila.veces_visto),
          ultima_vista: fila.ultima_vista,
          completado: Number(fila.completado),
          favorito: Number(fila.favorito),
        }
      : filaVacia(itemId, tipo);
  },

  continuar({ usuarioId, limit = 6 }) {
    const db = getDb();
    const filas = db
      .prepare(
        `SELECT p.item_id AS id, p.tipo, p.veces_visto, p.ultima_vista,
                r.titulo, r.descripcion, r.tipo AS metasub, NULL AS area
         FROM progreso_usuario p JOIN recursos r ON r.id = p.item_id
         WHERE p.usuario_id = @uid AND p.tipo = 'recurso' AND p.ultima_vista IS NOT NULL AND p.completado = 0
         UNION ALL
         SELECT p.item_id AS id, p.tipo, p.veces_visto, p.ultima_vista,
                s.nombre AS titulo, s.descripcion, s.aplicacion AS metasub, s.area
         FROM progreso_usuario p JOIN simuladores s ON s.id = p.item_id
         WHERE p.usuario_id = @uid AND p.tipo = 'simulador' AND p.ultima_vista IS NOT NULL AND p.completado = 0
         ORDER BY ultima_vista DESC LIMIT @limit`
      )
      .all({ uid: usuarioId, limit });
    return filas.map((f) => ({ ...f, area: f.area ? areaDeSimulador(f.area) : null }));
  },

  favoritos({ usuarioId }) {
    const db = getDb();
    return db
      .prepare(
        `SELECT p.item_id AS id, p.tipo, p.favorito_en,
                r.titulo, r.descripcion, r.tipo AS metasub, NULL AS area
         FROM progreso_usuario p JOIN recursos r ON r.id = p.item_id
         WHERE p.usuario_id = @uid AND p.tipo = 'recurso' AND p.favorito = 1
         UNION ALL
         SELECT p.item_id AS id, p.tipo, p.favorito_en,
                s.nombre AS titulo, s.descripcion, s.aplicacion AS metasub, s.area
         FROM progreso_usuario p JOIN simuladores s ON s.id = p.item_id
         WHERE p.usuario_id = @uid AND p.tipo = 'simulador' AND p.favorito = 1
         ORDER BY favorito_en DESC`
      )
      .all({ uid: usuarioId })
      .map((f) => ({ ...f, area: f.area ? areaDeSimulador(f.area) : null }));
  },

  rutas({ usuarioId }) {
    const db = getDb();
    const progreso = db
      .prepare('SELECT tipo, item_id, veces_visto, completado, favorito FROM progreso_usuario WHERE usuario_id = ?')
      .all(usuarioId);
    const mapa = new Map();
    for (const p of progreso) mapa.set(CLAVE(p.tipo, p.item_id), p);

    const sumar = (nodo) => {
      const est = mapa.get(CLAVE(nodo.tipo, nodo.id)) || { veces_visto: 0, completado: 0, favorito: 0 };
      nodo.visto = Number(est.veces_visto) > 0;
      nodo.completado = Number(est.completado) === 1;
      nodo.favorito = Number(est.favorito) === 1;
      nodo.estado = nodo.completado ? 'completado' : nodo.visto ? 'en-progreso' : 'pendiente';
      return nodo;
    };

    const simuladores = db
      .prepare('SELECT id, nombre, descripcion, area, nivel, aplicacion FROM simuladores WHERE activo = 1')
      .all();
    const recursos = db
      .prepare(
        `SELECT r.id, r.titulo, r.descripcion, r.tipo,
                (SELECT GROUP_CONCAT(DISTINCT c.asignatura)
                 FROM recurso_contenido rc JOIN curriculo c ON c.id = rc.contenido_id
                 WHERE rc.recurso_id = r.id) AS asignaturas
         FROM recursos r
         WHERE r.estado = 'publicado' AND r.tipo != 'simulacion'`
      )
      .all();

    const porArea = new Map();
    for (const a of AREAS) porArea.set(a.slug, { nombre: a.nombre, desc: a.desc, nodos: [] });

    for (const s of simuladores) {
      const slug = areaDeSimulador(s.area);
      porArea.get(slug).nodos.push(
        sumar({
          tipo: 'simulador',
          id: Number(s.id),
          titulo: s.nombre,
          descripcion: s.descripcion || '',
          meta: s.nivel || 'Simulador',
        })
      );
    }
    for (const r of recursos) {
      const areas = r.asignaturas
        ? String(r.asignaturas).split(',').map((a) => areaDeAsignatura(a))
        : ['otro'];
      for (const slug of new Set(areas)) {
        porArea.get(slug).nodos.push(
          sumar({
            tipo: 'recurso',
            id: Number(r.id),
            titulo: r.titulo,
            descripcion: r.descripcion || '',
            meta: r.tipo,
          })
        );
      }
    }

    return AREAS.map((a) => {
      const { nombre, desc, nodos } = porArea.get(a.slug);
      const vistos = nodos.filter((n) => n.visto).length;
      const completados = nodos.filter((n) => n.completado).length;
      return {
        slug: a.slug,
        nombre,
        desc,
        total: nodos.length,
        vistos,
        completados,
        enProgreso: vistos - completados,
        porCompletar: nodos.length - completados,
        nodos,
      };
    });
  },

  rutaPorSlug({ usuarioId, slug }) {
    return this.rutas({ usuarioId }).find((r) => r.slug === slug) || null;
  },

  resumen({ usuarioId }) {
    const db = getDb();
    const filas = db
      .prepare(
        `SELECT tipo,
                SUM(veces_visto > 0) AS vistos,
                SUM(completado = 1) AS completados,
                SUM(favorito = 1) AS favoritos
         FROM progreso_usuario WHERE usuario_id = ? GROUP BY tipo`
      )
      .all(usuarioId);
    const porTipo = {
      recurso: { vistos: 0, completados: 0, favoritos: 0 },
      simulador: { vistos: 0, completados: 0, favoritos: 0 },
    };
    for (const f of filas) {
      porTipo[f.tipo] = {
        vistos: Number(f.vistos),
        completados: Number(f.completados),
        favoritos: Number(f.favoritos),
      };
    }
    const rutas = this.rutas({ usuarioId });
    return {
      recurso: porTipo.recurso,
      simulador: porTipo.simulador,
      total: {
        vistos: porTipo.recurso.vistos + porTipo.simulador.vistos,
        completados: porTipo.recurso.completados + porTipo.simulador.completados,
        favoritos: porTipo.recurso.favoritos + porTipo.simulador.favoritos,
      },
      porArea: rutas.map(({ slug, nombre, total, vistos, completados, enProgreso }) => ({
        slug,
        nombre,
        total,
        vistos,
        completados,
        enProgreso,
      })),
    };
  },

  estudiantesVisibles({ adminId, rol, cursoId }) {
    const db = getDb();
    if (rol === 'coordinacion') {
      let sql = `SELECT u.id, u.nombre, u.email FROM usuarios u WHERE u.rol = 'estudiante' AND u.activo = 1`;
      const params = {};
      if (cursoId) {
        sql += ` AND u.id IN (SELECT usuario_id FROM matricula WHERE curso_id = @cursoId)`;
        params.cursoId = cursoId;
      }
      return db.prepare(sql).all(params);
    }
    let sql = `
      SELECT DISTINCT u.id, u.nombre, u.email
      FROM matricula m
      JOIN cursos c ON c.id = m.curso_id
      JOIN usuarios u ON u.id = m.usuario_id
      WHERE c.docente_id = @adminId AND u.rol = 'estudiante' AND u.activo = 1`;
    const params = { adminId };
    if (cursoId) {
      sql += ` AND m.curso_id = @cursoId AND c.id = @cursoId`;
      params.cursoId = cursoId;
    }
    return db.prepare(sql).all(params);
  },

  cursosDeEstudiante(usuarioId) {
    return getDb()
      .prepare(
        `SELECT c.id, c.nombre, c.grado, c.asignatura, c.periodo
         FROM matricula m JOIN cursos c ON c.id = m.curso_id
         WHERE m.usuario_id = ? ORDER BY c.periodo, c.asignatura`
      )
      .all(usuarioId);
  },

  seguimiento({ adminId, rol, cursoId, q }) {
    const estudiantes = this.estudiantesVisibles({ adminId, rol, cursoId });
    const db = getDb();
    const resumen = db.prepare(
      `SELECT tipo,
              SUM(veces_visto > 0) AS vistos,
              SUM(completado = 1) AS completados,
              SUM(favorito = 1) AS favoritos,
              MAX(ultima_vista) AS ultima
       FROM progreso_usuario WHERE usuario_id = ? GROUP BY tipo`
    );
    const filas = estudiantes
      .filter((e) => !q || e.nombre.toLowerCase().includes(q.toLowerCase()) || e.email.toLowerCase().includes(q.toLowerCase()))
      .map((e) => {
        const porTipo = { recurso: {}, simulador: {} };
        for (const f of resumen.all(e.id)) porTipo[f.tipo] = f;
        const sum = (t, campo) => Number(porTipo[t]?.[campo] || 0);
        return {
          id: e.id,
          nombre: e.nombre,
          email: e.email,
          cursos: this.cursosDeEstudiante(e.id),
          vistos: sum('recurso', 'vistos') + sum('simulador', 'vistos'),
          completados: sum('recurso', 'completados') + sum('simulador', 'completados'),
          favoritos: sum('recurso', 'favoritos') + sum('simulador', 'favoritos'),
          ultima_actividad: (porTipo.recurso.ultima || porTipo.simulador.ultima) || null,
        };
      });
    return { estudiantes: filas, cursoId: cursoId || null };
  },

  seguimientoDetalle({ adminId, rol, usuarioId }) {
    const visible = this.estudiantesVisibles({ adminId, rol }).some((e) => e.id === usuarioId);
    if (!visible) return null;
    const db = getDb();
    const usuario = db.prepare('SELECT id, nombre, email, rol FROM usuarios WHERE id = ?').get(usuarioId);
    if (!usuario || usuario.rol !== 'estudiante') return null;
    return {
      usuario,
      cursos: this.cursosDeEstudiante(usuarioId),
      resumen: this.resumen({ usuarioId }),
      continuar: this.continuar({ usuarioId, limit: 5 }),
      favoritos: this.favoritos({ usuarioId }),
    };
  },
};