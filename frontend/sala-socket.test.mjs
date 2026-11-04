import { io } from 'socket.io-client';

const base = 'http://localhost:4000';
const resultados = [];

function esperar(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function login(email, password) {
  const r = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return (await r.json()).token;
}

async function run() {
  const tok = await login('coord@colegio.edu', 'Admin123!');
  const h = { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' };

  const sala = await fetch(`${base}/api/salas`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({ tipo: 'reunion', titulo: 'socket test', acceso: 'abierto', estado: 'activa' }),
  }).then((r) => r.json());
  const salaId = sala.id;

  const socket = io(base, { auth: { token: tok }, transports: ['websocket'] });
  await new Promise((res, rej) => {
    socket.on('connect', () => socket.emit('sala:join', { salaId }, (cb) => (cb?.ok ? res() : rej(new Error(cb?.error || 'join fail')))));
    socket.on('connect_error', (e) => rej(e));
  });

  const pj = await new Promise((res, rej) => socket.emit('sala:pizarra:join', { salaId }, (cb) => (cb?.ok ? res(cb) : rej(new Error(cb?.error || 'pj fail')))));
  resultados.push(`sala:pizarra:join -> ${pj.ok}`);

  const trazoRecibido = await new Promise((res) => {
    socket.on('sala:pizarra:trazar', (d) => res(d));
    socket.emit('sala:pizarra:trazar', {
      trazo: { id: 't1', tool: 'brush', color: '#000', size: 4, puntos: [[0, 0], [10, 10], [20, 20]] },
    });
  });
  resultados.push(`pizarra trazo recibido id=${trazoRecibido.trazo.id} puntos=${trazoRecibido.trazo.puntos.length}`);

  const compartido = await new Promise((res) => {
    socket.on('sala:compartir', (d) => res(d));
    socket.emit('sala:compartir', { tipo: 'simulador', id: 1, nombre: 'Tiro parabólico', src: 'https://x', aplicacion: 'tiro' });
  });
  resultados.push(`sala:compartir recibido -> ${compartido.tipo}/${compartido.nombre}`);

  const tokEst = await login('estudiante@colegio.edu', 'Estudiante123!');
  const s2 = io(base, { auth: { token: tokEst }, transports: ['websocket'] });
  await new Promise((res, rej) => {
    s2.on('connect', () => s2.emit('sala:join', { salaId }, (cb) => (cb?.ok ? res() : rej(new Error(cb?.error || 'join2 fail')))));
    s2.on('connect_error', (e) => rej(e));
  });
  let noCompartio = true;
  s2.on('sala:compartir', () => { noCompartio = false; });
  s2.emit('sala:compartir', { tipo: 'simulador', id: 2, nombre: 'x' });
  await esperar(400);
  resultados.push(`estudiante NO puede compartir -> ${noCompartio}`);

  socket.disconnect();
  s2.disconnect();
  await fetch(`${base}/api/salas/${salaId}`, { method: 'DELETE', headers: h }).catch(() => {});

  console.log(resultados.join('\n'));
  process.exit(0);
}

run().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
