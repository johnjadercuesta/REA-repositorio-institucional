import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config } from '../config.js';

let db = null;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function getDb() {
  if (!db) {
    ensureDir(path.dirname(config.dbPath));
    db = new DatabaseSync(config.dbPath);
    migrate();
  }
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

const SCHEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'docente' CHECK (rol IN ('coordinacion','docente','estudiante')),
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS curriculo_anio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  anio INTEGER NOT NULL,
  nombre TEXT,
  vigente INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS curriculo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  anio_id INTEGER,
  nivel TEXT,
  grado TEXT,
  asignatura TEXT,
  unidad TEXT,
  contenido TEXT NOT NULL,
  FOREIGN KEY (anio_id) REFERENCES curriculo_anio(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_curriculo_busqueda ON curriculo(anio_id, grado, asignatura, unidad);

CREATE TABLE IF NOT EXISTS recursos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  autor TEXT,
  usuario_id INTEGER NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'documento' CHECK (tipo IN ('documento','video','audio','imagen','enlace','libro','h5','simulacion')),
  formato TEXT,
  licencia TEXT NOT NULL DEFAULT 'CC BY',
  url_externa TEXT,
  archivo TEXT,
  nombre_archivo_original TEXT,
  contador_descargas INTEGER NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'publicado' CHECK (estado IN ('publicado','borrador','archivado')),
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_recursos_estado ON recursos(estado);
CREATE INDEX IF NOT EXISTS idx_recursos_tipo ON recursos(tipo);

CREATE TABLE IF NOT EXISTS recurso_contenido (
  recurso_id INTEGER NOT NULL,
  contenido_id INTEGER NOT NULL,
  PRIMARY KEY (recurso_id, contenido_id),
  FOREIGN KEY (recurso_id) REFERENCES recursos(id) ON DELETE CASCADE,
  FOREIGN KEY (contenido_id) REFERENCES curriculo(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS valoraciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recurso_id INTEGER NOT NULL,
  usuario_id INTEGER NOT NULL,
  puntaje INTEGER NOT NULL CHECK (puntaje BETWEEN 1 AND 5),
  comentario TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (recurso_id, usuario_id),
  FOREIGN KEY (recurso_id) REFERENCES recursos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS uso_descargas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recurso_id INTEGER NOT NULL,
  usuario_id INTEGER NOT NULL,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (recurso_id) REFERENCES recursos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
`;

const SCHEMA2 = `
CREATE TABLE IF NOT EXISTS cursos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  anio_id INTEGER,
  nivel TEXT,
  grado TEXT NOT NULL,
  asignatura TEXT NOT NULL,
  docente_id INTEGER,
  periodo TEXT,
  estado TEXT NOT NULL DEFAULT 'activo',
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (anio_id) REFERENCES curriculo_anio(id) ON DELETE SET NULL,
  FOREIGN KEY (docente_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_cursos_grado ON cursos(periodo, grado, asignatura);

CREATE TABLE IF NOT EXISTS matricula (
  curso_id INTEGER NOT NULL,
  usuario_id INTEGER NOT NULL,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (curso_id, usuario_id),
  FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS capitulos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recurso_id INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  tipo TEXT NOT NULL DEFAULT 'texto' CHECK (tipo IN ('texto','pdf','imagen','h5')),
  archivo TEXT,
  archivo_nombre_original TEXT,
  url TEXT,
  html TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (recurso_id) REFERENCES recursos(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_capitulos_recurso ON capitulos(recurso_id, orden);

CREATE TABLE IF NOT EXISTS simuladores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  area TEXT NOT NULL DEFAULT 'otro',
  url TEXT,
  nivel TEXT,
  aplicacion TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sesiones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  curso_id INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha_inicio TEXT,
  estado TEXT NOT NULL DEFAULT 'programada' CHECK (estado IN ('programada','activa','finalizada')),
  creado_por INTEGER NOT NULL,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
  FOREIGN KEY (creado_por) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_sesiones_curso ON sesiones(curso_id);

CREATE TABLE IF NOT EXISTS asistencia (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sesion_id INTEGER NOT NULL,
  usuario_id INTEGER NOT NULL,
  estado TEXT NOT NULL DEFAULT 'presente' CHECK (estado IN ('presente','ausente','justificado')),
  registrado_por INTEGER,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (sesion_id, usuario_id),
  FOREIGN KEY (sesion_id) REFERENCES sesiones(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
);
`;

const SCHEMA3 = `
CREATE TABLE IF NOT EXISTS progreso_usuario (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('recurso','simulador')),
  item_id INTEGER NOT NULL,
  veces_visto INTEGER NOT NULL DEFAULT 0,
  ultima_vista TEXT,
  completado INTEGER NOT NULL DEFAULT 0,
  completado_en TEXT,
  favorito INTEGER NOT NULL DEFAULT 0,
  favorito_en TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (usuario_id, tipo, item_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_progreso_usuario ON progreso_usuario(usuario_id, tipo);
`;

const SCHEMA4 = `
CREATE TABLE IF NOT EXISTS salas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL DEFAULT 'reunion' CHECK (tipo IN ('clase','reunion')),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  acceso TEXT NOT NULL DEFAULT 'abierto' CHECK (acceso IN ('abierto','restringido')),
  password_hash TEXT,
  curso_id INTEGER,
  sesion_id INTEGER,
  fecha_inicio TEXT,
  estado TEXT NOT NULL DEFAULT 'programada' CHECK (estado IN ('programada','activa','finalizada')),
  creado_por INTEGER NOT NULL,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE SET NULL,
  FOREIGN KEY (sesion_id) REFERENCES sesiones(id) ON DELETE SET NULL,
  FOREIGN KEY (creado_por) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_salas_curso ON salas(curso_id);
CREATE INDEX IF NOT EXISTS idx_salas_sesion ON salas(sesion_id);

CREATE TABLE IF NOT EXISTS sala_participantes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sala_id INTEGER NOT NULL,
  usuario_id INTEGER NOT NULL,
  rol TEXT NOT NULL DEFAULT 'participante' CHECK (rol IN ('anfitrion','comoderador','participante','observador')),
  entrada TEXT NOT NULL DEFAULT (datetime('now')),
  salida TEXT,
  FOREIGN KEY (sala_id) REFERENCES salas(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sala_part_sala ON sala_participantes(sala_id);
`;

function migrate() {
  db.exec(SCHEMA);
  db.exec(SCHEMA2);
  db.exec(SCHEMA3);
  db.exec(SCHEMA4);
  // Migraciones incrementales para bases existentes.
  const cols = db.prepare('PRAGMA table_info(simuladores)').all().map((c) => c.name);
  if (!cols.includes('aplicacion')) {
    db.exec('ALTER TABLE simuladores ADD COLUMN aplicacion TEXT');
  }
}