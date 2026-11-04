import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { api, getToken, getUsuario } from '../api.js';
import PizarraCompartida from '../components/PizarraCompartida.jsx';

export default function Pizarra() {
  const { sesionId } = useParams();
  const socketRef = useRef(null);
  const usuario = getUsuario();

  const [conectado, setConectado] = useState(false);
  const [presentes, setPresentes] = useState([]);
  const [aulaId, setAulaId] = useState(null);
  const [error, setError] = useState('');

  const esDocente = usuario?.rol !== 'estudiante';

  useEffect(() => {
    api(`/sesiones/${sesionId}`)
      .then((s) => setAulaId(s.curso_id))
      .catch(() => setAulaId(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesionId]);

  useEffect(() => {
    const socket = io('/', { auth: { token: getToken() }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('pizarra:join', { sesionId: Number(sesionId) }, (resp) => {
        if (resp?.ok === false) {
          setError(resp.error || 'No se pudo unir a la pizarra');
        } else {
          setConectado(true);
        }
      });
    });
    socket.on('connect_error', (err) => setError(err.message));
    socket.on('pizarra:presencia', (lista) => setPresentes(lista.map((p) => p.nombre)));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesionId]);

  return (
    <div>
      <div className="page-head">
        <Link to={aulaId ? `/aulas/${aulaId}` : '/aulas'} className="btn btn-ghost">
          ‹ Volver al aula
        </Link>
        <div className="pizarra-conexion">
          <span className={`pill ${conectado ? 'ok' : 'falta'}`}>{conectado ? 'En vivo' : 'Conectando…'}</span>
          <span className="muted">
            {presentes.length > 0 ? `Participantes: ${presentes.join(', ')}` : 'Sin participantes aún'}
          </span>
        </div>
      </div>

      {error && <div className="alerta error">{error}</div>}

      {socketRef.current && (
        <PizarraCompartida
          socket={socketRef.current}
          prefijo="pizarra"
          joinPayload={{ sesionId: Number(sesionId) }}
          puedeControlar={esDocente}
          autor={usuario?.nombre}
        />
      )}
    </div>
  );
}