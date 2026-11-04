import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { api, getToken, getUsuario } from '../api.js';
import SalaPizarra from '../components/SalaPizarra.jsx';
import SalaSimuladores from '../components/SalaSimuladores.jsx';

const nombreEstado = { programada: 'Programada', activa: 'Activa', finalizada: 'Finalizada' };

const ICESERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

function formatTiempo(ms) {
  if (ms == null || ms <= 0) return '—';
  const t = Math.max(0, ms);
  const h = Math.floor(t / 3600000);
  const m = Math.floor((t % 3600000) / 60000);
  const s = Math.floor((t % 60000) / 1000);
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export default function Sala() {
  const { id } = useParams();
  const navigate = useNavigate();
  const usuario = getUsuario();
  const salaId = Number(id);

  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const peersRef = useRef(new Map()); // usuarioId -> { pc }
  const remoteStreamsRef = useRef(new Map()); // usuarioId -> MediaStream (cámara)
  const remoteScreensRef = useRef(new Map()); // usuarioId -> MediaStream (pantalla compartida)
  const videoRefs = useRef(new Map()); // usuarioId -> video element (cámara)
  const screenRefs = useRef(new Map()); // usuarioId -> video element (pantalla)
  const localVideoRef = useRef(null);
  const pantallaStreamRef = useRef(null);
  const pantallaPreviaRef = useRef(null);

  const [sala, setSala] = useState(null);
  const [error, setError] = useState('');
  const [entrando, setEntrando] = useState(false);
  const [dentro, setDentro] = useState(false);
  const [password, setPassword] = useState('');
  const [necesitaPassword, setNecesitaPassword] = useState(false);

  const [miRol, setMiRol] = useState('participante');
  const [conectado, setConectado] = useState(false);
  const [yo, setYo] = useState(null);
  const [presentes, setPresentes] = useState([]);
  const [remotos, setRemotos] = useState([]); // [usuarioId]
  const [camara, setCamara] = useState(false);
  const [mic, setMic] = useState(true);
  const [mano, setMano] = useState(false);
  const [muteAll, setMuteAll] = useState(false);
  const [pantallaCompartida, setPantallaCompartida] = useState(false);
  const [pantallas, setPantallas] = useState([]); // [{ usuarioId, nombre }]
  const [chat, setChat] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [reloj, setReloj] = useState({ inicio: null, fin: null, extras: 0 });
  const [ahora, setAhora] = useState(Date.now());
  const [pestana, setPestana] = useState('llamada');

  const esAnfitrion = miRol === 'anfitrion' || miRol === 'comoderador';
  const nombreDe = (u) => presentes.find((p) => p.id === u)?.nombre || 'Participante';

  function asignarStreams() {
    for (const [uid, video] of videoRefs.current) {
      const stream = remoteStreamsRef.current.get(uid);
      if (video && stream && video.srcObject !== stream) video.srcObject = stream;
    }
  }

  function crearConexion(remotoId) {
    const miId = usuario.id;
    if (peersRef.current.has(remotoId)) return peersRef.current.get(remotoId).pc;
    const pc = new RTCPeerConnection({ iceServers: ICESERVERS });
    pc.onicecandidate = (e) => {
      if (e.candidate) socketRef.current?.emit('sala:candidato', { para: remotoId, candidato: e.candidate });
    };
    pc.ontrack = (e) => {
      if (!e.streams[0]) return;
      const stream = e.streams[0];
      const existente = remoteStreamsRef.current.get(remotoId);
      if (existente && existente.id !== stream.id) {
        // Es la captura de pantalla del remoto, no su cámara.
        remoteScreensRef.current.set(remotoId, stream);
        setPantallas((prev) =>
          prev.some((x) => x.usuarioId === remotoId) ? prev : [...prev, { usuarioId: remotoId }]
        );
      } else {
        remoteStreamsRef.current.set(remotoId, stream);
        setRemotos([...remoteStreamsRef.current.keys()]);
      }
    };
    pc.onconnectionstatechange = () => {
      if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) despedir(remotoId);
    };
    if (localStreamRef.current) {
      for (const t of localStreamRef.current.getTracks()) pc.addTrack(t, localStreamRef.current);
    }
    if (pantallaStreamRef.current) {
      for (const t of pantallaStreamRef.current.getVideoTracks()) pc.addTrack(t, pantallaStreamRef.current);
    }
    peersRef.current.set(remotoId, { pc });
    return pc;
  }

  function negociar(remotoId) {
    const pc = crearConexion(remotoId);
    if (pc.signalingState !== 'stable') return;
    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .then(() => socketRef.current?.emit('sala:oferta', { para: remotoId, descripcion: pc.localDescription }))
      .catch(() => {});
  }

  function despedir(remotoId) {
    const p = peersRef.current.get(remotoId);
    if (p) {
      p.pc.close();
      peersRef.current.delete(remotoId);
    }
    const video = videoRefs.current.get(remotoId);
    if (video) video.srcObject = null;
    remoteStreamsRef.current.delete(remotoId);
    const screen = screenRefs.current.get(remotoId);
    if (screen) screen.srcObject = null;
    remoteScreensRef.current.get(remotoId)?.getTracks().forEach((t) => t.stop());
    remoteScreensRef.current.delete(remotoId);
    setRemotos([...remoteStreamsRef.current.keys()]);
    setPantallas((prev) => prev.filter((x) => x.usuarioId !== remotoId));
  }

  async function conectarMedia() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      return stream;
    } catch {
      try {
        return await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        return null;
      }
    }
  }

  async function entrar(e) {
    e?.preventDefault();
    setError('');
    if (sala.acceso === 'restringido' && sala.creado_por !== usuario.id && usuario.rol !== 'coordinacion') {
      if (!password) return setNecesitaPassword(true);
    }
    setEntrando(true);
    try {
      const res = await api(`/salas/${salaId}/entrar`, {
        method: 'POST',
        body: { password: password || null },
      });
      setMiRol(res.rol);
      setSala(res);
      setNecesitaPassword(false);
      const media = await conectarMedia();
      localStreamRef.current = media;
      if (media) {
        const video = media.getVideoTracks()[0];
        setCamara(Boolean(video));
        const audio = media.getAudioTracks()[0];
        setMic(Boolean(audio));
      }
      setDentro(true);
    } catch (err) {
      if (err.message.includes('Contraseña')) setNecesitaPassword(true);
      setError(err.message);
    } finally {
      setEntrando(false);
    }
  }

  useEffect(() => {
    api(`/salas/${salaId}`)
      .then(setSala)
      .catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salaId]);

  // Conexión del socket y señalización WebRTC.
  useEffect(() => {
    if (!dentro) return;
    const socket = io('/', { auth: { token: getToken() }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socketRef.current?.emit('sala:join', { salaId, password: password || null }, (resp) => {
        if (resp?.ok === false) setError(resp.error || 'No se pudo ingresar a la sala');
      });
    });
    socket.on('connect_error', (err) => setError(err.message));

    socket.on('sala:estado', ({ presentes: lista, chat: msjs, reloj: r, rol, muteAll: ma, pantalla: pta }) => {
      setYo(usuario.id);
      setPresentes(lista);
      setChat(msjs || []);
      setReloj(r || { inicio: null, fin: null, extras: 0 });
      setMiRol(rol);
      setMuteAll(Boolean(ma));
      setPantallas(pta ? [{ usuarioId: pta.usuarioId, nombre: pta.nombre }] : []);
      setConectado(true);
    });

    socket.on('sala:muteAll', ({ muted }) => setMuteAll(Boolean(muted)));

    socket.on('sala:pantalla', ({ activo, usuarioId: u, nombre }) => {
      if (u === usuario.id) return; // mi propia captura ya se muestra como vista previa
      if (!activo) {
        remoteScreensRef.current.get(u)?.getTracks().forEach((t) => t.stop());
        remoteScreensRef.current.delete(u);
      }
      setPantallas((prev) =>
        activo
          ? prev.some((x) => x.usuarioId === u)
            ? prev
            : [...prev, { usuarioId: u, nombre }]
          : prev.filter((x) => x.usuarioId !== u)
      );
    });

    socket.on('sala:presencia', (lista) => {
      setPresentes((prev) => {
        const ids = new Set(lista.map((p) => p.id));
        for (const uid of prev) if (uid && !ids.has(uid)) despedir(uid);
        return lista;
      });
    });

    socket.on('sala:mano', ({ usuarioId: u, mano: m }) => {
      if (u === usuario.id) setMano(m);
      setPresentes((ps) => ps.map((p) => (p.id === u ? { ...p, mano: m } : p)));
    });

    socket.on('sala:mute', ({ usuarioId: u, muted: m }) => {
      setPresentes((ps) => ps.map((p) => (p.id === u ? { ...p, muted: m } : p)));
      if (u === usuario.id) {
        localStreamRef.current?.getAudioTracks().forEach((t) => {
          t.enabled = !m;
        });
        setMic(!m);
      } else {
        const trozos = remoteStreamsRef.current.get(u);
        trozos?.getAudioTracks().forEach((t) => {
          t.enabled = !m;
        });
      }
    });

    socket.on('sala:chat', (msj) => setChat((c) => [...c, msj]));
    socket.on('sala:reloj', (r) => setReloj(r));

    socket.on('sala:oferta', async ({ de, descripcion }) => {
      const pc = crearConexion(de);
      try {
        await pc.setRemoteDescription(descripcion);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketRef.current?.emit('sala:respuesta', { para: de, descripcion: pc.localDescription });
      } catch {}
    });

    socket.on('sala:respuesta', ({ de, descripcion }) => {
      const pc = peersRef.current.get(de)?.pc;
      if (pc && pc.signalingState !== 'stable') {
        pc.setRemoteDescription(descripcion).catch(() => {});
      }
    });

    socket.on('sala:candidato', ({ de, candidato }) => {
      const pc = peersRef.current.get(de)?.pc;
      if (pc && pc.remoteDescription) pc.addIceCandidate(candidato).catch(() => {});
    });

    return () => {
      socket.emit('sala:leave');
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dentro, salaId]);

  // P2P: conectar con participantes (quien tiene mayor id ofrece).
  useEffect(() => {
    if (!dentro || !conectado || !usuario) return;
    const miId = usuario.id;
    for (const p of presentes) {
      if (p.id === miId) continue;
      if (peersRef.current.has(p.id)) continue;
      if (miId > p.id) negociar(p.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dentro, conectado, presentes]);

  useEffect(() => {
    asignarStreams();
    for (const [uid, video] of screenRefs.current) {
      const stream = remoteScreensRef.current.get(uid);
      if (video && stream && video.srcObject !== stream) video.srcObject = stream;
    }
  }, [remotos.length, pantallas.length, dentro, conectado]);

  // Asignar el stream local una sola vez (evita el parpadeo de la cámara).
  useEffect(() => {
    const el = localVideoRef.current;
    const s = localStreamRef.current;
    if (el && s && el.srcObject !== s) el.srcObject = s;
  }, [camara, dentro]);

  // Previsualización de la pantalla que estoy compartiendo.
  useEffect(() => {
    const el = pantallaPreviaRef.current;
    const s = pantallaStreamRef.current;
    if (el && s && el.srcObject !== s) el.srcObject = s;
  }, [pantallaCompartida, dentro]);

  // Aplicar estado de audio de una sesión ya iniciada.
  useEffect(() => {
    if (!dentro || !reloj) return;
    setAhora(Date.now());
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [dentro]);

  async function salir() {
    if (!confirm('¿Salir de la sala?')) return;
    try {
      await api(`/salas/${salaId}/salir`, { method: 'POST' });
    } catch {
      /* no crítico */
    }
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pantallaStreamRef.current?.getTracks().forEach((t) => t.stop());
    for (const { pc } of peersRef.current.values()) pc.close();
    peersRef.current.clear();
    socketRef.current?.emit('sala:leave');
    socketRef.current?.disconnect();
    navigate('/salas');
  }

  function alternarMic() {
    const m = !mic;
    setMic(m);
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = m;
    });
    socketRef.current?.emit('sala:mute', { usuarioId: usuario.id, muted: !m });
  }

  function alternarCamara() {
    const c = !camara;
    setCamara(c);
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = c;
    });
  }

  function alternarMuteAll() {
    const m = !muteAll;
    setMuteAll(m);
    socketRef.current?.emit('sala:muteAll', { muted: m });
  }

  async function alternarPantalla() {
    if (pantallaCompartida) {
      detenerPantalla();
      return;
    }
    try {
      // El selector del navegador permite elegir pestaña, ventana, pantalla o una región/app específica.
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 12, cursor: 'always' },
      });
      const track = stream.getVideoTracks()[0];
      if (!track) return;
      pantallaStreamRef.current = stream;
      setPantallaCompartida(true);
      socketRef.current?.emit('sala:pantalla', { activo: true });
      for (const [rid, { pc }] of peersRef.current) {
        pc.addTrack(track, stream);
        negociar(rid);
      }
      track.addEventListener('ended', () => {
        if (pantallaStreamRef.current === stream) detenerPantalla();
      });
    } catch {
      /* el usuario canceló la selección de pantalla */
    }
  }

  function detenerPantalla() {
    const stream = pantallaStreamRef.current;
    pantallaStreamRef.current = null;
    if (stream) {
      for (const { pc } of peersRef.current) {
        for (const s of pc.getSenders()) {
          if (stream.getTracks().includes(s.track)) pc.removeTrack(s);
        }
      }
      for (const t of stream.getTracks()) t.stop();
    }
    setPantallaCompartida(false);
    socketRef.current?.emit('sala:pantalla', { activo: false });
  }

  function alternarMano() {
    socketRef.current?.emit('sala:mano', { abajo: mano });
  }

  function enviarChat(e) {
    e.preventDefault();
    const texto = mensaje.trim();
    if (!texto) return;
    socketRef.current?.emit('sala:chat', { texto });
    setMensaje('');
  }

  function iniciarReloj() {
    socketRef.current?.emit('sala:reloj', { inicio: Date.now() });
  }

  function terminarReloj() {
    socketRef.current?.emit('sala:reloj', { fin: Date.now() });
  }

  const restante = reloj.fin ? reloj.fin - ahora : null;

  if (!sala && !error) return <div className="alerta info">Cargando sala…</div>;
  if (error && !sala) return <div className="alerta error">{error}</div>;
  if (!sala) return <div className="alerta error">{error}</div>;

  // ===== Pantalla previa (lobby) =====
  if (!dentro) {
    return (
      <div>
        <div className="page-head">
          <Link to="/salas" className="btn btn-ghost">
            ‹ Salas
          </Link>
          <h1>{sala.titulo}</h1>
        </div>
        <div className="card form" style={{ maxWidth: 480 }}>
          <span className="badge-tipo">
            {sala.tipo === 'clase' ? 'Clase' : 'Reunión'} · {nombreEstado[sala.estado]}
          </span>
          <p className="detalle-desc" style={{ marginTop: 10 }}>
            {sala.descripcion || 'Sin descripción.'}
          </p>
          <div className="card-meta" style={{ marginBottom: 14 }}>
            {sala.curso_nombre && <span>📚 {sala.curso_nombre}</span>}
            {sala.sesion_titulo && <span>🎓 {sala.sesion_titulo}</span>}
            {sala.fecha_inicio && <span>🗓 {sala.fecha_inicio}</span>}
            {sala.protegida && <span>🔒 Acceso con contraseña</span>}
          </div>
          {sala.estado === 'finalizada' && <div className="alerta error">Esta sala ya finalizó.</div>}
          {sala.estado !== 'finalizada' && (
            <form onSubmit={entrar}>
              {(necesitaPassword || (sala.acceso === 'restringido' && sala.creado_por !== usuario.id && usuario.rol !== 'coordinacion')) && (
                <label>
                  Contraseña
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                    required
                  />
                </label>
              )}
              <button className="btn btn-primary" disabled={entrando}>
                {entrando ? 'Ingresando…' : 'Entrar a la sala'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ===== Dentro de la sala =====
  return (
    <div className="sala-muro">
      <div className="sala-cab">
        <Link to="/salas" className="btn btn-ghost">
          ‹ Salir
        </Link>
        <div className="sala-titulo">
          <strong>{sala.titulo}</strong>
          <span className={`pill ${conectado ? 'ok' : 'falta'}`}>{conectado ? 'En vivo' : 'Conectando…'}</span>
        </div>
        <div className="sala-reloj">
          {reloj.fin && <span className="pill ok">⏱ {formatTiempo(restante)}</span>}
          {!reloj.fin && <span className="pill falta">Sin reloj</span>}
        </div>
      </div>

      {error && <div className="alerta error">{error}</div>}

      <nav className="sala-tabs">
        <button className={`sala-tab${pestana === 'llamada' ? ' on' : ''}`} onClick={() => setPestana('llamada')}>
          🎥 Llamada
        </button>
        <button className={`sala-tab${pestana === 'pizarra' ? ' on' : ''}`} onClick={() => setPestana('pizarra')}>
          ✏️ Pizarra
        </button>
        <button
          className={`sala-tab${pestana === 'simuladores' ? ' on' : ''}`}
          onClick={() => setPestana('simuladores')}
        >
          🧪 Simuladores
        </button>
      </nav>

      {pestana === 'pizarra' &&
        (socketRef.current ? (
          <SalaPizarra socket={socketRef.current} salaId={salaId} esAnfitrion={esAnfitrion} autor={usuario.nombre} />
        ) : (
          <div className="alerta info">Conectando pizarra…</div>
        ))}

      {pestana === 'simuladores' &&
        (socketRef.current ? (
          <SalaSimuladores socket={socketRef.current} esAnfitrion={esAnfitrion} />
        ) : (
          <div className="alerta info">Conectando catálogo…</div>
        ))}

      {pestana === 'llamada' && (
        <div className="sala-cuerpo">
          <div className="sala-videos">
          <div className="sala-grid">
            <div className="sala-tile">
              {camara ? (
                <video ref={localVideoRef} autoPlay playsInline muted />
              ) : (
                <div className="sala-tile-sin">{usuario.nombre.slice(0, 2).toUpperCase()}</div>
              )}
              <div className="sala-tile-pie">
                <span>{usuario.nombre} (vos)</span>
                <span>{mano ? '✋' : ''}</span>
              </div>
            </div>

            {remotos.map((uid) => (
              <div className="sala-tile" key={uid}>
                <video
                  ref={(el) => {
                    if (el) videoRefs.current.set(uid, el);
                    else videoRefs.current.delete(uid);
                  }}
                  autoPlay
                  playsInline
                />
                <div className="sala-tile-pie">
                  <span>{nombreDe(uid)}</span>
                  <span>
                    {presentes.find((p) => p.id === uid)?.rol === 'anfitrion' ? '👑' : ''}
                    {presentes.find((p) => p.id === uid)?.mano ? ' ✋' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {pantallaCompartida && (
            <div className="sala-pantalla">
              <div className="sala-pantalla-cab">
                <span className="pill ok">🖥 Compartiendo tu pantalla</span>
                <button className="btn btn-danger btn-mini" onClick={detenerPantalla}>
                  Dejar de compartir
                </button>
              </div>
              <div className="sala-pantalla-lienzo">
                <video ref={pantallaPreviaRef} autoPlay playsInline muted />
              </div>
            </div>
          )}

          {pantallas.map(({ usuarioId, nombre }) => (
            <div className="sala-pantalla" key={usuarioId}>
              <div className="sala-pantalla-cab">
                <span className="pill ok">🖥 {nombre || nombreDe(usuarioId)} está compartiendo</span>
              </div>
              <div className="sala-pantalla-lienzo">
                <video
                  ref={(el) => {
                    if (el) screenRefs.current.set(usuarioId, el);
                    else screenRefs.current.delete(usuarioId);
                  }}
                  autoPlay
                  playsInline
                />
              </div>
            </div>
          ))}

          <div className="sala-controles">
            <button className={`btn btn-circle${!mic ? ' off' : ''}`} onClick={alternarMic} title="Micrófono">
              {mic ? '🎙' : '🔇'}
            </button>
            <button className={`btn btn-circle${!camara ? ' off' : ''}`} onClick={alternarCamara} title="Cámara">
              {camara ? '📹' : '🚫'}
            </button>
            <button className={`btn btn-circle${mano ? ' on' : ''}`} onClick={alternarMano} title="Levantar la mano">
              ✋
            </button>
            {esAnfitrion && (
              <button
                className={`btn btn-circle${pantallaCompartida ? ' on' : ''}`}
                onClick={alternarPantalla}
                title={pantallaCompartida ? 'Dejar de compartir pantalla' : 'Compartir pantalla, pestaña o ventana'}
              >
                🖥
              </button>
            )}
            {esAnfitrion && (
              <button
                className={`btn btn-circle${muteAll ? ' on' : ''}`}
                onClick={alternarMuteAll}
                title={muteAll ? 'Activar todos los micrófonos' : 'Silenciar todos los micrófonos'}
              >
                {muteAll ? '🔊' : '🔇'}
              </button>
            )}
            {esAnfitrion && reloj.fin == null && (
              <button className="btn btn-circle" onClick={iniciarReloj} title="Iniciar cronómetro">
                ▶️
              </button>
            )}
            {esAnfitrion && reloj.fin != null && (
              <button className="btn btn-circle" onClick={terminarReloj} title="Detener cronómetro">
                ⏹
              </button>
            )}
            {esAnfitrion && (
              <button
                className="btn btn-circle"
                onClick={() => socketRef.current?.emit('sala:extender')}
                title="Extender 5 minutos"
              >
                ⏰
              </button>
            )}
            <button className="btn btn-danger btn-sair" onClick={salir}>
              Salir
            </button>
          </div>
        </div>

        <aside className="sala-panel">
          <div className="sala-panel-block">
            <h3>
              Participantes ({presentes.length}){' '}
              {esAnfitrion && presentes.filter((p) => p.mano).length > 0
                ? `· ${presentes.filter((p) => p.mano).length} con la mano`
                : ''}
            </h3>
            <ul className="sala-lista">
              {presentes.map((p) => (
                <li key={p.id}>
                  <span className={`punto${p.id === yo ? ' yo' : ''}`}></span>
                  <span className="sala-lista-nom">
                    {p.nombre}
                    {p.id === yo ? ' (vos)' : ''}
                  </span>
                  <span className="sala-lista-ico">
                    {p.muted ? '🔇' : ''}
                    {p.mano ? ' ✋' : ''}
                    {p.rol === 'anfitrion' ? ' 👑' : ''}
                  </span>
                  {esAnfitrion && p.id !== yo && (
                    <button
                      className="btn btn-mini"
                      onClick={() => socketRef.current?.emit('sala:mute', { usuarioId: p.id, muted: !p.muted })}
                      title="Silenciar/activar"
                    >
                      {p.muted ? '🔊' : '🔇'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="sala-panel-block sala-chat">
            <h3>Chat</h3>
            <div className="sala-chat-lista">
              {chat.length === 0 && <div className="vacio">Escribí el primer mensaje.</div>}
              {chat.map((m, i) => (
                <div className="sala-msj" key={i}>
                  <strong>{m.autor}</strong>
                  <span className="muted">{new Date(m.hora).toLocaleTimeString()}</span>
                  <p>{m.texto}</p>
                </div>
              ))}
            </div>
            <form className="sala-chat-form" onSubmit={enviarChat}>
              <input
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Escribí un mensaje…"
                maxLength={500}
              />
              <button className="btn btn-primary" type="submit">
                Enviar
              </button>
            </form>
          </div>
        </aside>
        </div>
      )}
    </div>
  );
}