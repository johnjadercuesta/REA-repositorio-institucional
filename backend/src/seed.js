import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { getDb, closeDb } from './repositories/db.js';
import { config } from './config.js';

if (fs.existsSync(config.dbPath)) fs.rmSync(config.dbPath);
fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
fs.mkdirSync(config.uploadDir, { recursive: true });

const db = getDb();

const hashCoord = await bcrypt.hash('Admin123!', 10);
const hashDoc = await bcrypt.hash('Docente123!', 10);
const hashEst = await bcrypt.hash('Estudiante123!', 10);
const hashEst2 = await bcrypt.hash('Estudiante123!', 10);
const hashEst3 = await bcrypt.hash('Estudiante123!', 10);

db.prepare(
  "INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ('Coordinación', 'coord@colegio.edu', ?, 'coordinacion')"
).run(hashCoord);
db.prepare(
  "INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ('Docente Demo', 'docente@colegio.edu', ?, 'docente')"
).run(hashDoc);
db.prepare(
  "INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ('Estudiante Demo', 'estudiante@colegio.edu', ?, 'estudiante')"
).run(hashEst);
db.prepare(
  "INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ('Ana Pérez', 'ana@colegio.edu', ?, 'estudiante')"
).run(hashEst2);
db.prepare(
  "INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ('Bruno López', 'bruno@colegio.edu', ?, 'estudiante')"
).run(hashEst3);

const anio = db.prepare('INSERT INTO curriculo_anio (anio, nombre, vigente) VALUES (?, ?, 1)').run(2026, 'Ciclo 2026')
  .lastInsertRowid;

const filas = [
  ['Secundaria', '3°', 'Matemática', 'Unidad 2 · Álgebra', 'Ecuaciones de primer grado'],
  ['Secundaria', '3°', 'Matemática', 'Unidad 2 · Álgebra', 'Simplificación de expresiones algebraicas'],
  ['Secundaria', '3°', 'Matemática', 'Unidad 4 · Funciones', 'Función lineal y su gráfica'],
  ['Secundaria', '3°', 'Lengua', 'Unidad 1 · Texto narrativo', 'El cuento y sus elementos'],
  ['Secundaria', '4°', 'Matemáticas', 'Unidad 1 · Números', 'Propiedades de potencias y raíces'],
  ['Secundaria', '4°', 'Ciencias Naturales', 'Unidad 3 · Biología', 'La célula y sus organelos'],
];
const stmt = db.prepare(
  'INSERT INTO curriculo (anio_id, nivel, grado, asignatura, unidad, contenido) VALUES (?, ?, ?, ?, ?, ?)'
);
for (const f of filas) stmt.run(anio, ...f);

const idEcuacion = db.prepare("SELECT id FROM curriculo WHERE contenido LIKE 'Ecu%'").get()?.id;
const idCuento = db.prepare("SELECT id FROM curriculo WHERE contenido LIKE '%cuento%'").get()?.id;
const idCelula = db.prepare("SELECT id FROM curriculo WHERE contenido LIKE '%célula%'").get()?.id;

if (idEcuacion) {
  const rid = db
    .prepare(
      `INSERT INTO recursos (titulo, descripcion, autor, usuario_id, tipo, licencia, url_externa, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'publicado')`
    )
    .run(
      'Guía: Ecuaciones de primer grado',
      'Material con ejercicios resueltos paso a paso para preparar la clase.',
      null,
      2,
      'documento',
      'CC BY',
      'https://es.khanacademy.org/math/algebra'
    ).lastInsertRowid;
  db.prepare('INSERT INTO recurso_contenido (recurso_id, contenido_id) VALUES (?, ?)').run(rid, idEcuacion);
}

if (idCuento) {
  const rid = db
    .prepare(
      `INSERT INTO recursos (titulo, descripcion, autor, usuario_id, tipo, licencia, url_externa, estado, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, 'publicado', datetime('now','-2 days'))`
    )
    .run(
      'PPT: Estructura del cuento',
      'Presentación editable sobre elementos del cuento para 3°.',
      null,
      2,
      'enlace',
      'CC BY-SA',
      'https://drive.google.com/'
    ).lastInsertRowid;
  db.prepare('INSERT INTO recurso_contenido (recurso_id, contenido_id) VALUES (?, ?)').run(rid, idCuento);
}

const cursoMat3 = db
  .prepare(
    `INSERT INTO cursos (nombre, grado, asignatura, nivel, periodo, docente_id) VALUES (?, ?, ?, ?, ?, ?)`
  )
  .run('Matemática 3° · 2026', '3°', 'Matemática', 'Secundaria', '2026', 2).lastInsertRowid;
const cursoLengua3 = db
  .prepare(`INSERT INTO cursos (nombre, grado, asignatura, nivel, periodo, docente_id) VALUES (?, ?, ?, ?, ?, ?)`)
  .run('Lengua 3° · 2026', '3°', 'Lengua', 'Secundaria', '2026', 2).lastInsertRowid;
db.prepare('INSERT OR IGNORE INTO matricula (curso_id, usuario_id) VALUES (?, ?)').run(cursoMat3, 2);
db.prepare('INSERT OR IGNORE INTO matricula (curso_id, usuario_id) VALUES (?, ?)').run(cursoMat3, 3);
db.prepare('INSERT OR IGNORE INTO matricula (curso_id, usuario_id) VALUES (?, ?)').run(cursoLengua3, 2);
db.prepare('INSERT OR IGNORE INTO matricula (curso_id, usuario_id) VALUES (?, ?)').run(cursoLengua3, 3);
const idAna = db.prepare("SELECT id FROM usuarios WHERE email = 'ana@colegio.edu'").get().id;
const idBruno = db.prepare("SELECT id FROM usuarios WHERE email = 'bruno@colegio.edu'").get().id;
db.prepare('INSERT OR IGNORE INTO matricula (curso_id, usuario_id) VALUES (?, ?)').run(cursoLengua3, idAna);
db.prepare('INSERT OR IGNORE INTO matricula (curso_id, usuario_id) VALUES (?, ?)').run(cursoLengua3, idBruno);

const libroId = db
  .prepare(
    `INSERT INTO recursos (titulo, descripcion, autor, usuario_id, tipo, licencia, estado) VALUES (?, ?, ?, ?, 'libro', 'CC BY', 'publicado')`
  )
  .run('Cuadernillo: El cuento en 3°', 'Libro de ejemplo con capítulos para ver el lector y el flipbook.', 'Docente Demo', 2)
  .lastInsertRowid;
db.prepare(
  "INSERT INTO capitulos (recurso_id, titulo, orden, tipo, html) VALUES (?, 'Introducción', 0, 'texto', '<h3>¿Qué vamos a trabajar?</h3><p>En esta unidad analizaremos la estructura del cuento y sus elementos.</p><p><em>Recurso de ejemplo:</em> podés editar estos capítulos o agregar capítulos tipo PDF, imagen o H5.</p>')"
).run(libroId);
db.prepare(
  "INSERT INTO capitulos (recurso_id, titulo, orden, tipo, html) VALUES (?, 'Actividades', 1, 'texto', '<h3>Actividades</h3><ul><li>Leer un cuento y identificar inicio, nudo y desenlace.</li><li>Reescribir el final con otra resolución.</li></ul>')"
).run(libroId);

db.prepare(
  `INSERT INTO simuladores (nombre, descripcion, area, aplicacion, nivel) VALUES
   ('Equilibrio de fuerzas', 'Balanza con masas: estudiá el momento y la condición de equilibrio. App propia del sitio.', 'fisica', 'fuerzas', '3°'),
   ('Construye un átomo', 'Armá átomos de distintos elementos a partir de protones, neutrones y electrones. App propia del sitio.', 'quimica', 'atomo', '3°')`
).run();

db.prepare(
  `INSERT INTO simuladores (nombre, descripcion, area, aplicacion, nivel) VALUES
   ('Tiro parabólico', 'Estudiá el movimiento de un proyectil variando velocidad, ángulo y altura. App propia del sitio.', 'fisica', 'tiro', '4°'),
   ('Péndulo simple', 'Péndulo simple con animación: el período no depende de la masa.', 'fisica', 'pendulo', '4°'),
   ('Tabla periódica interactiva', 'Explorá los elementos 1 a 20 con sus propiedades.', 'quimica', 'tabla', '3°'),
   ('Átomo y modelo de Bohr', 'Modelo planetario de Bohr para elementos del 1 al 20.', 'quimica', 'bohr', '3°'),
   ('Graficador de funciones', 'Creá y explorá gráficas de funciones lineal, cuadrática y seno.', 'matematica', 'funcion', '3°'),
   ('Álgebra de Baldor', 'Ejercicios de álgebra tipo Baldor con verificador de respuestas.', 'matematica', 'algebra', '3°'),
   ('Probabilidad', 'Conteo (permutaciones y combinaciones) y experimento con un dado.', 'matematica', 'probabilidad', '4°'),
   ('Graficador estilo GeoGebra', 'Graficá varias funciones a la vez y hacé zoom, casi como en GeoGebra.', 'matematica', 'geogebra', '4°'),
   ('Estadística', 'Medidas de tendencia central y dispersión con histograma.', 'matematica', 'estadistica', '4°'),
    ('Termodinámica interactiva', 'Plataforma completa con 14 módulos: calor, leyes, procesos, entropía, laboratorio y evaluación.', 'fisica', 'termodinamica', '8° a 10°')`
).run();

db.prepare(
  `INSERT INTO simuladores (nombre, descripcion, area, aplicacion, nivel) VALUES
   ('Laboratorio de magnetismo', '12 experimentos interactivos: polos, atracción y repulsión, campo magnético, materiales, electroimanes y la Tierra como imán. Con retos, conceptos y seguimiento.', 'fisica', 'magnetismo', '3°')`
).run();

if (idEcuacion) {
  const rid = db
    .prepare(
      `INSERT INTO recursos (titulo, descripcion, autor, usuario_id, tipo, licencia, url_externa, estado)
       VALUES (?, ?, ?, ?, 'simulacion', 'CC BY', ?, 'publicado')`
    )
    .run(
      'Simulador: Representación gráfica de funciones',
      'Explorá la función lineal y su gráfica de forma interactiva.',
      'Docente Demo',
      2,
      'https://phet.colorado.edu/es/simulations/graphing-lines'
    ).lastInsertRowid;
  db.prepare('INSERT INTO recurso_contenido (recurso_id, contenido_id) VALUES (?, ?)').run(rid, idEcuacion);
}

if (idCuento) {
  const rid = db
    .prepare(
      `INSERT INTO recursos (titulo, descripcion, autor, usuario_id, tipo, licencia, url_externa, estado)
       VALUES (?, ?, ?, ?, 'h5', 'CC BY', ?, 'publicado')`
    )
    .run(
      'Quiz interactivo: Elementos del cuento',
      'Actividad interactiva (H5P vía enlace) para repasar la estructura del cuento.',
      'Docente Demo',
      2,
      'https://h5p.org/h5p/embed/129'
    ).lastInsertRowid;
  db.prepare('INSERT INTO recurso_contenido (recurso_id, contenido_id) VALUES (?, ?)').run(rid, idCuento);
}

db.prepare(
  `INSERT INTO sesiones (curso_id, titulo, descripcion, fecha_inicio, estado, creado_por) VALUES
   (?, 'Clase: Estructura del cuento', 'Lectura guiada y actividades del cuadernillo. Usá la pizarra para trabajar en vivo.', datetime('now'), 'activa', 2),
   (?, 'Práctica de ecuaciones', 'Repaso de ecuaciones de primer grado con ejercicios en la pizarra.', datetime('now','+2 days'), 'programada', 2)`
).run(cursoLengua3, cursoMat3);

const sesionActiva = db.prepare("SELECT id FROM sesiones WHERE estado = 'activa' LIMIT 1").get().id;
db.prepare(
  `INSERT INTO asistencia (sesion_id, usuario_id, estado, registrado_por) VALUES
   (?, 3, 'presente', 2),
   (?, ?, 'justificado', 2),
   (?, ?, 'ausente', 2)`
).run(sesionActiva, sesionActiva, idAna, sesionActiva, idBruno);

console.log('Seed completado. Base:', config.dbPath);
console.log('Login: coord@colegio.edu / Admin123! · docente@colegio.edu / Docente123! · estudiante@colegio.edu / Estudiante123!');
closeDb();