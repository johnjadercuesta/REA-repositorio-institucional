import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import supertest from 'supertest';
import bcrypt from 'bcryptjs';
import { crearApp } from '../src/app.js';
import { config } from '../src/config.js';
import { getDb, closeDb } from '../src/repositories/db.js';
import { APLICACIONES_SIMULADOR } from '../src/schema/schemas.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DB = path.join(__dirname, 'test-rea.db');
const TEST_UPLOADS = path.join(__dirname, 'test-uploads');

let app;
let token;
let coordToken;

before(async () => {
  config.dbPath = TEST_DB;
  config.uploadDir = TEST_UPLOADS;
  fs.rmSync(TEST_DB, { force: true });

  const db = getDb();
  db.exec("INSERT INTO curriculo_anio (anio, nombre, vigente) VALUES (2026, 'Test', 1)");
  db.exec("INSERT INTO curriculo (anio_id, grado, asignatura, unidad, contenido) VALUES (1, '3', 'Matemática', 'U1', 'Ecuaciones')");

  app = crearApp();
  const res = await supertest(app)
    .post('/api/auth/registrar')
    .send({ nombre: 'Doc Test', email: 'doc@test.com', password: '123456' });
  assert.equal(res.status, 201);
  token = res.body.token;

  const hash = await bcrypt.hash('123456', 10);
  db.prepare("INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ('Coord Test', 'coord@test.com', ?, 'coordinacion')").run(hash);
  const cl = await supertest(app).post('/api/auth/login').send({ email: 'coord@test.com', password: '123456' });
  assert.equal(cl.status, 200);
  coordToken = cl.body.token;
});

after(() => {
  closeDb();
  fs.rmSync(TEST_DB, { force: true });
  fs.rmSync(TEST_UPLOADS, { recursive: true, force: true });
});

test('health', async () => {
  const res = await supertest(app).get('/health');
  assert.equal(res.status, 200);
});

test('login docente', async () => {
  const res = await supertest(app).post('/api/auth/login').send({ email: 'doc@test.com', password: '123456' });
  assert.equal(res.status, 200);
  assert.ok(res.body.token);
  token = res.body.token;
});

test('crear recurso enlace', async () => {
  const res = await supertest(app)
    .post('/api/recursos')
    .set('Authorization', `Bearer ${token}`)
    .send({ titulo: 'Recurso de prueba', tipo: 'enlace', licencia: 'CC BY', url_externa: 'https://e.com', contenido_ids: [] });
  assert.equal(res.status, 201);
  assert.equal(res.body.titulo, 'Recurso de prueba');
});

test('buscar por texto', async () => {
  const res = await supertest(app).get('/api/recursos?q=prueba').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.ok(res.body.data.length >= 1);
});

test('valorar recurso', async () => {
  const creado = await supertest(app)
    .post('/api/recursos')
    .set('Authorization', `Bearer ${token}`)
    .send({ titulo: 'Para valorar', tipo: 'enlace', licencia: 'CC BY', url_externa: 'https://e.com' });
  const id = creado.body.id;
  const res = await supertest(app)
    .post(`/api/recursos/${id}/valorar`)
    .set('Authorization', `Bearer ${token}`)
    .send({ puntaje: 5, comentario: 'Excelente' });
  assert.equal(res.status, 200);
  assert.equal(res.body.puntaje_promed, 5);
});

test('reportes requieren coordinacion', async () => {
  const res = await supertest(app).get('/api/reportes/cobertura').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 403);
});

test('vincular recurso a contenido curricular', async () => {
  const res = await supertest(app)
    .post('/api/recursos')
    .set('Authorization', `Bearer ${token}`)
    .send({ titulo: 'Vinculado a currículo', tipo: 'documento', licencia: 'CC BY', contenido_ids: [1] });
  assert.equal(res.status, 201);
  assert.equal(res.body.contenidos.length, 1);
  assert.equal(res.body.contenidos[0].grado, '3');

  const filtrado = await supertest(app)
    .get('/api/recursos?grado=3')
    .set('Authorization', `Bearer ${token}`);
  assert.ok(filtrado.body.data.some((r) => r.titulo === 'Vinculado a currículo'));
});

test('sin token devuelve 401', async () => {
  const res = await supertest(app).get('/api/recursos');
  assert.equal(res.status, 401);
});

test('crear curso (coordinación)', async () => {
  const res = await supertest(app)
    .post('/api/cursos')
    .set('Authorization', `Bearer ${coordToken}`)
    .send({ nombre: 'Matemática 3°', grado: '3', asignatura: 'Matemática', nivel: 'Secundaria', periodo: '2026' });
  assert.equal(res.status, 201);
  assert.equal(res.body.grado, '3');
});

test('docente no puede crear curso', async () => {
  const res = await supertest(app)
    .post('/api/cursos')
    .set('Authorization', `Bearer ${token}`)
    .send({ nombre: 'x', grado: '4', asignatura: 'Ciencias' });
  assert.equal(res.status, 403);
});

test('crear estudiante y verlo en /estudiantes', async () => {
  const creado = await supertest(app)
    .post('/api/usuarios')
    .set('Authorization', `Bearer ${coordToken}`)
    .send({ nombre: 'Alumno 1', email: 'alumno1@test.com', password: '123456', rol: 'estudiante' });
  assert.equal(creado.status, 201);
  assert.equal(creado.body.rol, 'estudiante');

  const lista = await supertest(app).get('/api/usuarios/estudiantes').set('Authorization', `Bearer ${coordToken}`);
  assert.ok(lista.body.some((u) => u.email === 'alumno1@test.com'));
});

test('matricular estudiante en curso', async () => {
  const curso = await supertest(app)
    .post('/api/cursos')
    .set('Authorization', `Bearer ${coordToken}`)
    .send({ nombre: 'Lengua 3°', grado: '3', asignatura: 'Lengua', periodo: '2026' });
  const usuario = await supertest(app)
    .post('/api/usuarios')
    .set('Authorization', `Bearer ${coordToken}`)
    .send({ nombre: 'Alumno 2', email: 'alumno2@test.com', password: '123456', rol: 'estudiante' });

  const mat = await supertest(app)
    .post(`/api/cursos/${curso.body.id}/matricular`)
    .set('Authorization', `Bearer ${coordToken}`)
    .send({ usuarioId: usuario.body.id });
  assert.equal(mat.status, 200);
  assert.ok(mat.body.matriculados.some((s) => s.id === usuario.body.id));
});

test('crear libro y agregar/ordenar capítulos', async () => {
  const libro = await supertest(app)
    .post('/api/recursos')
    .set('Authorization', `Bearer ${token}`)
    .send({ titulo: 'Libro de prueba', tipo: 'libro', licencia: 'CC BY' });
  assert.equal(libro.status, 201);
  const id = libro.body.id;

  const c1 = await supertest(app)
    .post(`/api/recursos/${id}/capitulos`)
    .set('Authorization', `Bearer ${token}`)
    .send({ titulo: 'Introducción', tipo: 'texto', html: '<p>Hola</p>' });
  assert.equal(c1.status, 201);

  const c2 = await supertest(app)
    .post(`/api/recursos/${id}/capitulos`)
    .set('Authorization', `Bearer ${token}`)
    .send({ titulo: 'Segundo', tipo: 'texto', html: '<p>Dos</p>' });
  assert.equal(c2.status, 201);

  const lista = await supertest(app).get(`/api/recursos/${id}/capitulos`).set('Authorization', `Bearer ${token}`);
  assert.equal(lista.body.length, 2);

  // reordenar (invertir)
  const reorder = await supertest(app)
    .put(`/api/recursos/${id}/capitulos/orden`)
    .set('Authorization', `Bearer ${token}`)
    .send({ capitulos: [c2.body.id, c1.body.id] });
  assert.equal(reorder.status, 200);
  assert.equal(reorder.body[0].id, c2.body.id);

  // eliminar
  const del = await supertest(app)
    .delete(`/api/recursos/${id}/capitulos/${c1.body.id}`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(del.status, 200);
});

test('crear simulador (coordinación)', async () => {
  const res = await supertest(app)
    .post('/api/simuladores')
    .set('Authorization', `Bearer ${coordToken}`)
    .send({ nombre: 'Equilibrio', area: 'fisica', url: 'https://phet.colorado.edu/es/simulations/balancing-act', nivel: '3°' });
  assert.equal(res.status, 201);
  assert.equal(res.body.area, 'fisica');
});

test('docente no puede crear simulador', async () => {
  const res = await supertest(app)
    .post('/api/simuladores')
    .set('Authorization', `Bearer ${token}`)
    .send({ nombre: 'x', url: 'https://e.com' });
  assert.equal(res.status, 403);
});

test('listar simuladores activos (cualquier rol)', async () => {
  const res = await supertest(app).get('/api/simuladores').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.ok(res.body.some((s) => s.nombre === 'Equilibrio'));
});

test('aplicación propia de magnetismo está en la lista blanca', () => {
  assert.ok(APLICACIONES_SIMULADOR.includes('magnetismo'));
});

test('crear simulador con aplicación propia de magnetismo', async () => {
  const res = await supertest(app)
    .post('/api/simuladores')
    .set('Authorization', `Bearer ${coordToken}`)
    .send({ nombre: 'Laboratorio de magnetismo', descripcion: '12 experimentos', area: 'fisica', aplicacion: 'magnetismo', nivel: '3°' });
  assert.equal(res.status, 201);
  assert.equal(res.body.aplicacion, 'magnetismo');
  assert.equal(res.body.area, 'fisica');
});

test('recurso simulacion requiere URL', async () => {
  const res = await supertest(app)
    .post('/api/recursos')
    .set('Authorization', `Bearer ${token}`)
    .send({ titulo: 'Sim sin url', tipo: 'simulacion', licencia: 'CC BY' });
  assert.equal(res.status, 400);
});

test('recurso simulacion con URL', async () => {
  const res = await supertest(app)
    .post('/api/recursos')
    .set('Authorization', `Bearer ${token}`)
    .send({ titulo: 'Sim ok', tipo: 'simulacion', licencia: 'CC BY', url_externa: 'https://e.com/sim' });
  assert.equal(res.status, 201);
  assert.equal(res.body.tipo, 'simulacion');
});

test('crear sesión en un aula', async () => {
  const curso = await supertest(app)
    .post('/api/cursos')
    .set('Authorization', `Bearer ${coordToken}`)
    .send({ nombre: 'Aula 3° A', grado: '3', asignatura: 'Lengua', periodo: '2026' });
  const id = curso.body.id;

  const res = await supertest(app)
    .post(`/api/sesiones/curso/${id}`)
    .set('Authorization', `Bearer ${coordToken}`)
    .send({ titulo: 'Sesión de repaso', descripcion: 'Pizarra en vivo', estado: 'activa' });
  assert.equal(res.status, 201);
  assert.equal(res.body.estado, 'activa');
  assert.equal(res.body.curso_id, id);

  const lista = await supertest(app)
    .get(`/api/sesiones/curso/${id}`)
    .set('Authorization', `Bearer ${coordToken}`);
  assert.equal(lista.body.length, 1);

  const parche = await supertest(app)
    .patch(`/api/sesiones/${res.body.id}`)
    .set('Authorization', `Bearer ${coordToken}`)
    .send({ estado: 'finalizada' });
  assert.equal(parche.status, 200);
  assert.equal(parche.body.estado, 'finalizada');
});

test('docente no puede crear sesión en aula ajena', async () => {
  const curso = await supertest(app)
    .post('/api/cursos')
    .set('Authorization', `Bearer ${coordToken}`)
    .send({ nombre: 'Aula ajena', grado: '4', asignatura: 'Ciencias', periodo: '2026' });
  const res = await supertest(app)
    .post(`/api/sesiones/curso/${curso.body.id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ titulo: 'Intento', estado: 'activa' });
  assert.equal(res.status, 403);
});

test('registrar asistencia en sesión', async () => {
  const curso = await supertest(app)
    .post('/api/cursos')
    .set('Authorization', `Bearer ${coordToken}`)
    .send({ nombre: 'Aula Asistencia', grado: '3', asignatura: 'Lengua', periodo: '2026' });
  const alumno = await supertest(app)
    .post('/api/usuarios')
    .set('Authorization', `Bearer ${coordToken}`)
    .send({ nombre: 'Alumno Asist', email: 'asist@test.com', password: '123456', rol: 'estudiante' });
  await supertest(app)
    .post(`/api/cursos/${curso.body.id}/matricular`)
    .set('Authorization', `Bearer ${coordToken}`)
    .send({ usuarioId: alumno.body.id });

  const sesion = await supertest(app)
    .post(`/api/sesiones/curso/${curso.body.id}`)
    .set('Authorization', `Bearer ${coordToken}`)
    .send({ titulo: 'Sesión console', estado: 'activa' });

  const vista = await supertest(app)
    .get(`/api/sesiones/${sesion.body.id}/asistencia`)
    .set('Authorization', `Bearer ${coordToken}`);
  assert.equal(vista.status, 200);
  assert.equal(vista.body.estudiantes[0].estado, 'sin-registrar');

  const marcar = await supertest(app)
    .put(`/api/sesiones/${sesion.body.id}/asistencia`)
    .set('Authorization', `Bearer ${coordToken}`)
    .send({ registros: [{ usuarioId: alumno.body.id, estado: 'presente' }] });
  assert.equal(marcar.status, 200);
  assert.equal(marcar.body.estudiantes[0].estado, 'presente');

  const todos = await supertest(app)
    .put(`/api/sesiones/${sesion.body.id}/asistencia/todos`)
    .set('Authorization', `Bearer ${coordToken}`)
    .send({ estado: 'ausente' });
  assert.equal(todos.body.estudiantes[0].estado, 'ausente');

  const reporte = await supertest(app)
    .get('/api/reportes/asistencia')
    .set('Authorization', `Bearer ${coordToken}`);
  assert.equal(reporte.status, 200);
  assert.ok(reporte.body.rows.some((r) => r.estudiante_id === alumno.body.id));
  assert.ok(reporte.body.resumen.estudiantes >= 1);
});