import { Server } from 'socket.io';
import { verificarToken } from './services/auth.js';
import { UsuarioRepository } from './repositories/usuarios.js';
import { CursoRepository } from './repositories/cursos.js';
import { SesionRepository } from './repositories/sesiones.js';
import { SalaRepository } from './repositories/salas.js';

// Estado en memoria de la pizarra por sesión.
const pizarras = new Map(); // sesionId -> { trazos: [], presentes: Map<userId, {nombre, rol}> }

function obtenerPizarra(sesionId) {
  if (!pizarras.has(sesionId)) {
    pizarras.set(sesionId, { trazos: [], textos: [], permiso: true, presentes: new Map() });
  }
  return pizarras.get(sesionId);
}

const MAX_TRAZOS = 3000;

// Estado en memoria de las salas de reunión.
const salas = new Map(); // salaId -> { presentes: Map<userId,{nombre, rol, mano, muted}>, chat: [], reloj: {inicio, fin, extras}, muteAll, pantalla }

function obtenerSala(salaId) {
  if (!salas.has(salaId)) {
    salas.set(salaId, {
      presentes: new Map(),
      chat: [],
      reloj: { inicio: null, fin: null, extras: 0 },
      muteAll: false,
      pantalla: null, // { usuarioId, nombre }
    });
  }
  return salas.get(salaId);
}

export function crearSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CORS_ORIGIN || '*' },
  });

  function emitirSala(salaId, evento, data) {
    io.to(`sala:${salaId}`).emit(evento, data);
  }

  function emitirPresenciaSala(st, salaId) {
    emitirSala(salaId, 'sala:presencia', [...st.presentes.values()]);
  }

  function esAnfitrion(socket) {
    const st = socket.salaId == null ? null : salas.get(socket.salaId);
    const p = st?.presentes.get(socket.usuario.id);
    return p?.rol === 'anfitrion' || p?.rol === 'comoderador';
  }

  function removerPresenciaSala(socket) {
    const salaId = socket.salaId;
    if (salaId == null) return;
    socket.salaId = null;
    const st = salas.get(salaId);
    const uid = socket.usuario.id;
    try {
      SalaRepository.cerrarParticipante({ salaId, usuarioId: uid });
    } catch {
      /* persistencia no crítica */
    }
    if (st) {
      if (st.presentes.has(uid)) st.presentes.delete(uid);
      emitirPresenciaSala(st, salaId);
      if (st.presentes.size === 0) {
        salas.delete(salaId);
        pizarras.delete(`sala:${salaId}`);
      }
    }
  }

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No autenticado'));
      const payload = verificarToken(token);
      const usuario = UsuarioRepository.findById(payload.sub);
      if (!usuario || !usuario.activo) return next(new Error('Usuario no válido'));
      socket.usuario = { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol };
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('pizarra:join', (payload, cb) => {
      const sesionId = Number(payload?.sesionId);
      try {
        const sesion = sesionId ? SesionRepository.findById(sesionId) : null;
        if (!sesion) {
          if (cb) cb({ ok: false, error: 'Sesión no encontrada' });
          return;
        }
        const curso = CursoRepository.findById(sesion.curso_id);
        if (!SesionRepository.puedeVer({ sesion, curso, usuario: socket.usuario })) {
          if (cb) cb({ ok: false, error: 'No autorizado' });
          return;
        }
        socket.join(`pizarra:${sesionId}`);
        socket.sesionId = sesionId;

        const pizarra = obtenerPizarra(sesionId);
        const { id: uid, nombre, rol } = socket.usuario;
        if (!pizarra.presentes.has(uid)) pizarra.presentes.set(uid, { nombre, rol });
        io.to(`pizarra:${sesionId}`).emit('pizarra:presencia', [...pizarra.presentes.values()]);

        socket.emit('pizarra:estado', {
          trazos: pizarra.trazos,
          textos: pizarra.textos,
          permiso: pizarra.permiso,
          presentes: [...pizarra.presentes.values()],
        });
        if (cb) cb({ ok: true });
      } catch (e) {
        if (cb) cb({ ok: false, error: e.message });
      }
    });

    socket.on('pizarra:trazar', (payload) => {
      const sesionId = socket.sesionId;
      if (!sesionId || !payload?.trazo) return;
      const pizarra = obtenerPizarra(sesionId);
      const trazo = {
        id: payload.trazo.id,
        tool: payload.trazo.tool || 'brush',
        color: payload.trazo.color || '#000000',
        size: Number(payload.trazo.size) || 3,
        puntos: Array.isArray(payload.trazo.puntos) ? payload.trazo.puntos : [],
      };
      if (!trazo.puntos.length) return;
      pizarra.trazos.push({ ...trazo, autor: socket.usuario.nombre });
      if (pizarra.trazos.length > MAX_TRAZOS) pizarra.trazos.splice(0, pizarra.trazos.length - MAX_TRAZOS);
      socket.to(`pizarra:${sesionId}`).emit('pizarra:trazar', { trazo, autor: socket.usuario.nombre });
    });

    socket.on('pizarra:limpiar', () => {
      const sesionId = socket.sesionId;
      if (!sesionId) return;
      const pizarra = obtenerPizarra(sesionId);
      pizarra.trazos = [];
      pizarra.textos = [];
      socket.to(`pizarra:${sesionId}`).emit('pizarra:limpiar');
    });

    // Insertar una ecuación en la pizarra de la sesión (compartida por todos).
    socket.on('pizarra:ecuacion', (payload) => {
      const sesionId = socket.sesionId;
      if (!sesionId) return;
      const pizarra = obtenerPizarra(sesionId);
      const texto = String(payload?.texto || '').trim().slice(0, 200);
      if (!texto) return;
      const objeto = {
        id: payload?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        texto,
        autor: socket.usuario.nombre,
        pos: payload?.pos && payload.pos.x != null ? { x: Number(payload.pos.x), y: Number(payload.pos.y) } : { x: 40, y: 44 + pizarra.textos.length * 60 },
      };
      pizarra.textos.push(objeto);
      if (pizarra.textos.length > 200) pizarra.textos.splice(0, pizarra.textos.length - 200);
      socket.to(`pizarra:${sesionId}`).emit('pizarra:ecuacion', { objeto });
    });

    // Permiso de dibujo: solo docentes/coordinación pueden restringir.
    socket.on('pizarra:permiso', (payload) => {
      const sesionId = socket.sesionId;
      if (!sesionId || socket.usuario.rol === 'estudiante') return;
      const pizarra = obtenerPizarra(sesionId);
      pizarra.permiso = Boolean(payload?.permiso);
      io.to(`pizarra:${sesionId}`).emit('pizarra:permiso', { permiso: pizarra.permiso });
    });

    // ---------- Salas de reunión ----------
    socket.on('sala:join', (payload, cb) => {
      const salaId = Number(payload?.salaId);
      try {
        const sala = salaId ? SalaRepository.findById(salaId) : null;
        if (!sala) {
          if (cb) cb({ ok: false, error: 'Sala no encontrada' });
          return;
        }
        if (sala.estado === 'finalizada') {
          if (cb) cb({ ok: false, error: 'La sala ya finalizó' });
          return;
        }
        if (!SalaRepository.verificarAcceso({ sala, usuario: socket.usuario, password: payload?.password })) {
          if (cb) cb({ ok: false, error: 'Acceso restringido' });
          return;
        }
        socket.join(`sala:${salaId}`);
        socket.salaId = salaId;
        socket.join(`usuario:${socket.usuario.id}`);

        const st = obtenerSala(salaId);
        const { id: uid, nombre, rol } = socket.usuario;
        const rolSala = sala.creado_por === uid ? 'anfitrion' : rol === 'estudiante' ? 'participante' : 'comoderador';
        if (!st.presentes.has(uid)) st.presentes.set(uid, { id: uid, nombre, rol: rolSala, mano: false, muted: st.muteAll });
        emitirPresenciaSala(st, salaId);
        socket.emit('sala:estado', {
          presentes: [...st.presentes.values()],
          chat: st.chat,
          reloj: st.reloj,
          rol: rolSala,
          muteAll: st.muteAll,
          pantalla: st.pantalla,
        });
        if (cb) cb({ ok: true, rol: rolSala });
      } catch (e) {
        if (cb) cb({ ok: false, error: e.message });
      }
    });

    socket.on('sala:leave', () => {
      if (socket.salaId != null) {
        socket.leave(`sala:${socket.salaId}`);
        socket.leave(`usuario:${socket.usuario.id}`);
      }
      removerPresenciaSala(socket);
    });

    socket.on('sala:mano', (payload) => {
      const salaId = socket.salaId;
      if (salaId == null) return;
      const st = obtenerSala(salaId);
      const p = st.presentes.get(socket.usuario.id);
      if (!p) return;
      p.mano = payload?.abajo ? false : !p.mano;
      emitirSala(salaId, 'sala:mano', { usuarioId: socket.usuario.id, mano: p.mano });
    });

    socket.on('sala:mute', (payload) => {
      const salaId = socket.salaId;
      if (salaId == null) return;
      const st = obtenerSala(salaId);
      const objetivo = Number(payload?.usuarioId) || socket.usuario.id;
      const p = st.presentes.get(objetivo);
      if (!p) return;
      if (objetivo !== socket.usuario.id && !esAnfitrion(socket)) return;
      p.muted = Boolean(payload?.muted);
      emitirSala(salaId, 'sala:mute', { usuarioId: objetivo, muted: p.muted });
    });

    socket.on('sala:chat', (payload) => {
      const salaId = socket.salaId;
      if (salaId == null) return;
      const texto = String(payload?.texto || '').trim().slice(0, 500);
      if (!texto) return;
      const st = obtenerSala(salaId);
      const msj = { autor: socket.usuario.nombre, texto, hora: new Date().toISOString() };
      st.chat.push(msj);
      if (st.chat.length > 200) st.chat.splice(0, st.chat.length - 200);
      emitirSala(salaId, 'sala:chat', msj);
    });

    socket.on('sala:reloj', (payload) => {
      const salaId = socket.salaId;
      if (salaId == null || !esAnfitrion(socket)) return;
      const st = obtenerSala(salaId);
      if (typeof payload?.inicio !== 'undefined') st.reloj.inicio = [null, undefined].includes(payload.inicio) ? null : Number(payload.inicio);
      if (typeof payload?.fin !== 'undefined') st.reloj.fin = [null, undefined].includes(payload.fin) ? null : Number(payload.fin);
      emitirSala(salaId, 'sala:reloj', st.reloj);
    });

    socket.on('sala:extender', () => {
      const salaId = socket.salaId;
      if (salaId == null || !esAnfitrion(socket)) return;
      const st = obtenerSala(salaId);
      const cincoMin = 5 * 60 * 1000;
      st.reloj.fin = (st.reloj.fin && st.reloj.fin > Date.now() ? st.reloj.fin : Date.now()) + cincoMin;
      st.reloj.extras += 1;
      emitirSala(salaId, 'sala:reloj', st.reloj);
    });

    // El anfitrión puede silenciar o activar todos los micrófonos a la vez.
    socket.on('sala:muteAll', (payload) => {
      const salaId = socket.salaId;
      if (salaId == null || !esAnfitrion(socket)) return;
      const st = obtenerSala(salaId);
      const muted = Boolean(payload?.muted);
      st.muteAll = muted;
      for (const p of st.presentes.values()) {
        p.muted = muted;
        emitirSala(salaId, 'sala:mute', { usuarioId: p.id, muted });
      }
      emitirSala(salaId, 'sala:muteAll', { muted });
    });

    // Compartir pantalla: el anfitrión anuncia quién está mostrando su escritorio/pestaña/app.
    socket.on('sala:pantalla', (payload) => {
      const salaId = socket.salaId;
      if (salaId == null || !esAnfitrion(socket)) return;
      const st = obtenerSala(salaId);
      const activo = Boolean(payload?.activo);
      st.pantalla = activo ? { usuarioId: socket.usuario.id, nombre: socket.usuario.nombre } : null;
      emitirSala(salaId, 'sala:pantalla', {
        activo,
        usuarioId: socket.usuario.id,
        nombre: socket.usuario.nombre,
      });
    });

    // Pizarra compartida dentro de la sala.
    socket.on('sala:pizarra:join', (payload, cb) => {
      const salaId = socket.salaId;
      if (salaId == null || (payload && Number(payload.salaId) !== salaId)) {
        if (cb) cb({ ok: false, error: 'No está dentro de la sala' });
        return;
      }
      const pizarra = obtenerPizarra(`sala:${salaId}`);
      socket.emit('sala:pizarra:estado', { trazos: pizarra.trazos, textos: pizarra.textos, permiso: pizarra.permiso });
      if (cb) cb({ ok: true });
    });

    socket.on('sala:pizarra:trazar', (payload) => {
      const salaId = socket.salaId;
      if (salaId == null || !payload?.trazo) return;
      const pizarra = obtenerPizarra(`sala:${salaId}`);
      const trazo = {
        id: payload.trazo.id,
        tool: payload.trazo.tool || 'brush',
        color: payload.trazo.color || '#000000',
        size: Number(payload.trazo.size) || 3,
        puntos: Array.isArray(payload.trazo.puntos) ? payload.trazo.puntos : [],
      };
      if (!trazo.puntos.length) return;
      pizarra.trazos.push({ ...trazo, autor: socket.usuario.nombre });
      if (pizarra.trazos.length > MAX_TRAZOS) pizarra.trazos.splice(0, pizarra.trazos.length - MAX_TRAZOS);
      emitirSala(salaId, 'sala:pizarra:trazar', { trazo, autor: socket.usuario.nombre });
    });

    socket.on('sala:pizarra:limpiar', () => {
      const salaId = socket.salaId;
      if (salaId == null) return;
      const pizarra = obtenerPizarra(`sala:${salaId}`);
      pizarra.trazos = [];
      pizarra.textos = [];
      emitirSala(salaId, 'sala:pizarra:limpiar');
    });

    // Ecuación compartida dentro de la sala.
    socket.on('sala:pizarra:ecuacion', (payload) => {
      const salaId = socket.salaId;
      if (salaId == null) return;
      const pizarra = obtenerPizarra(`sala:${salaId}`);
      const texto = String(payload?.texto || '').trim().slice(0, 200);
      if (!texto) return;
      const objeto = {
        id: payload?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        texto,
        autor: socket.usuario.nombre,
        pos: payload?.pos && payload.pos.x != null ? { x: Number(payload.pos.x), y: Number(payload.pos.y) } : { x: 40, y: 44 + pizarra.textos.length * 60 },
      };
      pizarra.textos.push(objeto);
      if (pizarra.textos.length > 200) pizarra.textos.splice(0, pizarra.textos.length - 200);
      emitirSala(salaId, 'sala:pizarra:ecuacion', { objeto });
    });

    // Permiso de dibujo en la pizarra de la sala: solo el anfitrión.
    socket.on('sala:pizarra:permiso', (payload) => {
      const salaId = socket.salaId;
      if (salaId == null || !esAnfitrion(socket)) return;
      const pizarra = obtenerPizarra(`sala:${salaId}`);
      pizarra.permiso = Boolean(payload?.permiso);
      emitirSala(salaId, 'sala:pizarra:permiso', { permiso: pizarra.permiso });
    });

    // Compartir contenido (simulador / recurso) con toda la sala.
    socket.on('sala:compartir', (payload) => {
      const salaId = socket.salaId;
      if (salaId == null || !esAnfitrion(socket)) return;
      const dato = payload && payload.tipo ? { tipo: payload.tipo, id: payload.id, nombre: payload.nombre, src: payload.src, aplicacion: payload.aplicacion } : null;
      emitirSala(salaId, 'sala:compartir', dato);
    });

    // Señalización WebRTC (relevo punto a punto)
    socket.on('sala:oferta', ({ para, descripcion }) => {
      io.to(`usuario:${Number(para)}`).emit('sala:oferta', { de: socket.usuario.id, descripcion });
    });
    socket.on('sala:respuesta', ({ para, descripcion }) => {
      io.to(`usuario:${Number(para)}`).emit('sala:respuesta', { de: socket.usuario.id, descripcion });
    });
    socket.on('sala:candidato', ({ para, candidato }) => {
      io.to(`usuario:${Number(para)}`).emit('sala:candidato', { de: socket.usuario.id, candidato });
    });

    socket.on('disconnect', () => {
      const sesionId = socket.sesionId;
      if (sesionId) {
        const pizarra = obtenerPizarra(sesionId);
        const { id: uid } = socket.usuario;
        if (pizarra.presentes.has(uid)) pizarra.presentes.delete(uid);
        io.to(`pizarra:${sesionId}`).emit('pizarra:presencia', [...pizarra.presentes.values()]);
      }
      removerPresenciaSala(socket);
    });
  });

  return io;
}
