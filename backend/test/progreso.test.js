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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DB = path.join(__dirname, 'test-progreso.db');
const TEST_UPLOADS = path.join(__dirname, 'test-progreso-uploads');

let app;
let token;
let coordToken;
let recursoId;
let simuladorId;

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
    .send({ nombre: 'Doc Test', email: 'doc@prog.com', password: '123456' });
  assert.equal(res.status, 201);
  token = res.body.token;

  const hash = await bcrypt.hash('123456', 10);
  db.prepare("INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ('Coord Test', 'coord@prog.com', ?, 'coordinacion')").run(hash);
  const cl = await supertest(app).post('/api/auth/login').send({ email: 'coord@prog.com', password: '123456' });
  assert.equal(cl.status, 200);
  coordToken = cl.body.token;

  const rc = await supertest(app)
    .post('/api/recursos')
    .set('Authorization', `Bearer ${token}`)
    .send({ titulo: 'Guía de ecuaciones', tipo: 'enlace', licencia: 'CC BY', url_externa: 'https://e.com', contenido_ids: [1] });
  assert.equal(rc.status, 201);
  recursoId = rc.body.id;

  const sm = await supertest(app)
    .post('/api/simuladores')
    .set('Authorization', `Bearer ${coordToken}`)
    .send({ nombre: 'Sim álgebra', area: 'matematica', aplicacion: 'tiro' });
  assert.equal(sm.status, 201);
  simuladorId = sm.body.id;
});

after(() => {
  closeDb();
  fs.rmSync(TEST_DB, { force: true });
  fs.rmSync(TEST_UPLOADS, { recursive: true, force: true });
});

test('progreso requiere autenticación', async () => {
  const res = await supertest(app).get('/api/progreso');
  assert.equal(res.status, 401);
});

test('registrar vista de recurso y de simulador', async () => {
  const a = await supertest(app).post('/api/progreso/vista').set('Authorization', `Bearer ${token}`).send({ tipo: 'recurso', id: recursoId });
  assert.equal(a.status, 200);
  assert.equal(a.body.veces_visto, 1);

  const b = await supertest(app).post('/api/progreso/vista').set('Authorization', `Bearer ${token}`).send({ tipo: 'simulador', id: simuladorId });
  assert.equal(b.status, 200);
  assert.equal(b.body.veces_visto, 1);
});

test('vista de elemento inexistente devuelve 404', async () => {
  const res = await supertest(app).post('/api/progreso/vista').set('Authorization', `Bearer ${token}`).send({ tipo: 'recurso', id: 999999 });
  assert.equal(res.status, 404);
});

test('completar recurso', async () => {
  const res = await supertest(app).post('/api/progreso/completar').set('Authorization', `Bearer ${token}`).send({ tipo: 'recurso', id: recursoId });
  assert.equal(res.status, 200);
  assert.equal(res.body.completado, 1);
});

test('favorito simula toggle', async () => {
  const on = await supertest(app).post('/api/progreso/favorito').set('Authorization', `Bearer ${token}`).send({ tipo: 'simulador', id: simuladorId });
  assert.equal(on.status, 200);
  assert.equal(on.body.favorito, 1);
  const off = await supertest(app).post('/api/progreso/favorito').set('Authorization', `Bearer ${token}`).send({ tipo: 'simulador', id: simuladorId });
  assert.equal(off.body.favorito, 0);
});

test('resumen de progreso', async () => {
  const res = await supertest(app).get('/api/progreso').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.recurso.vistos, 1);
  assert.equal(res.body.recurso.completados, 1);
  assert.equal(res.body.simulador.vistos, 1);
});

test('continuar: muestra solo lo visto y no completado', async () => {
  const res = await supertest(app).get('/api/progreso/continuar').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  const pares = res.body.map((x) => `${x.tipo}:${x.id}`);
  assert.ok(pares.includes(`simulador:${simuladorId}`));
  assert.ok(!pares.includes(`recurso:${recursoId}`));
});

test('estado puntual de un elemento', async () => {
  const res = await supertest(app).get(`/api/progreso/estado?tipo=recurso&id=${recursoId}`).set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.completado, 1);
});

test('rutas: agrupa por área y aporta progreso', async () => {
  const res = await supertest(app).get('/api/progreso/rutas').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  const mat = res.body.find((x) => x.slug === 'matematicas');
  assert.ok(mat);
  assert.ok(mat.total >= 2);
  assert.ok(mat.completados >= 1);
  assert.equal(mat.porCompletar, mat.total - mat.completados);
});

test('ruta por slug', async () => {
  const res = await supertest(app).get('/api/progreso/rutas/matematicas').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.slug, 'matematicas');
  assert.ok(Array.isArray(res.body.nodos));
});

test('ruta inexistente devuelve 404', async () => {
  const res = await supertest(app).get('/api/progreso/rutas/noexiste').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 404);
});

test('favoritos lista elementos marcados', async () => {
  const res = await supertest(app).get('/api/progreso/favoritos').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.length, 0);
});

test('seguimiento: el docente ve el progreso de sus estudiantes', async () => {
  const lista = await supertest(app).get('/api/usuarios').set('Authorization', `Bearer ${coordToken}`);
  const docente = lista.body.find((u) => u.email === 'doc@prog.com');

  const cu = await supertest(app)
    .post('/api/usuarios')
    .set('Authorization', `Bearer ${coordToken}`)
    .send({ nombre: 'Est Seguimiento', email: 'est@prog.com', password: '123456', rol: 'estudiante' });
  assert.equal(cu.status, 201);
  const estId = cu.body.id;

  const curso = await supertest(app)
    .post('/api/cursos')
    .set('Authorization', `Bearer ${coordToken}`)
    .send({ nombre: 'Mat 3A', grado: '3', asignatura: 'Matemática', docenteId: docente.id });
  assert.equal(curso.status, 201);
  const cursoId = curso.body.id;

  const mat = await supertest(app)
    .post(`/api/cursos/${cursoId}/matricular`)
    .set('Authorization', `Bearer ${coordToken}`)
    .send({ usuarioId: estId });
  assert.equal(mat.status, 200);

  const le = await supertest(app).post('/api/auth/login').send({ email: 'est@prog.com', password: '123456' });
  assert.equal(le.status, 200);
  const estToken = le.body.token;

  await supertest(app).post('/api/progreso/vista').set('Authorization', `Bearer ${estToken}`).send({ tipo: 'simulador', id: simuladorId });
  await supertest(app).post('/api/progreso/completar').set('Authorization', `Bearer ${estToken}`).send({ tipo: 'simulador', id: simuladorId });

  const seg = await supertest(app).get('/api/progreso/seguimiento').set('Authorization', `Bearer ${token}`);
  assert.equal(seg.status, 200);
  const fila = seg.body.estudiantes.find((e) => e.id === estId);
  assert.ok(fila);
  assert.equal(fila.vistos, 1);
  assert.equal(fila.completados, 1);
  assert.ok(fila.cursos.some((c) => c.id === cursoId));

  const det = await supertest(app).get(`/api/progreso/seguimiento/${estId}`).set('Authorization', `Bearer ${token}`);
  assert.equal(det.status, 200);
  assert.equal(det.body.usuario.id, estId);
  assert.equal(det.body.resumen.total.completados, 1);
});

test('seguimiento: un docente no ve estudiantes fuera de sus cursos', async () => {
  const od = await supertest(app)
    .post('/api/usuarios')
    .set('Authorization', `Bearer ${coordToken}`)
    .send({ nombre: 'Otro Docente', email: 'otro@prog.com', password: '123456', rol: 'docente' });
  const otro = await supertest(app).post('/api/auth/login').send({ email: 'otro@prog.com', password: '123456' });
  const otroToken = otro.body.token;
  const seg = await supertest(app).get('/api/progreso/seguimiento').set('Authorization', `Bearer ${otroToken}`);
  assert.equal(seg.status, 200);
  assert.ok(!seg.body.estudiantes.some((e) => e.email === 'est@prog.com'));
  const odUser = await supertest(app)
    .get(`/api/progreso/seguimiento/${od.body.id}`)
    .set('Authorization', `Bearer ${otroToken}`);
  assert.equal(odUser.status, 404);
});

test('seguimiento: estudiante no puede consultar', async () => {
  const le = await supertest(app).post('/api/auth/login').send({ email: 'est@prog.com', password: '123456' });
  const res = await supertest(app).get('/api/progreso/seguimiento').set('Authorization', `Bearer ${le.body.token}`);
  assert.equal(res.status, 403);
});

test('seguimiento: exporta CSV', async () => {
  const res = await supertest(app).get('/api/progreso/seguimiento?csv=1').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.match(res.headers['content-type'], /text\/csv/);
  assert.ok(res.text.includes('est@prog.com'));
  assert.ok(res.text.includes('nombre'));
});