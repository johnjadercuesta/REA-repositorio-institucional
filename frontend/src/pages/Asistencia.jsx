import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, getUsuario } from '../api.js';

const nombreEstado = {
  presente: 'Presente',
  ausente: 'Ausente',
  justificado: 'Justificado',
  'sin-registrar': 'Sin registrar',
};

export default function Asistencia() {
  const { sesionId } = useParams();
  const usuario = getUsuario();
  const [sesion, setSesion] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [estados, setEstados] = useState({});
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);

  const esDocente = usuario?.rol === 'coordinacion' || sesion?.creado_por === usuario?.id;

  async function cargar() {
    try {
      const s = await api(`/sesiones/${sesionId}`);
      setSesion(s);
      const fila = await api(`/sesiones/${sesionId}/asistencia`);
      const lista = fila.estudiantes;
      setEstudiantes(lista);
      setEstados(Object.fromEntries(lista.map((e) => [e.usuario_id, e.estado])));
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesionId]);

  function cambiar(usuarioId, estado) {
    setEstados((prev) => ({ ...prev, [usuarioId]: estado }));
  }

  async function guardar() {
    setGuardando(true);
    setError('');
    setMensaje('');
    try {
      const registros = estudiantes
        .filter((e) => estados[e.usuario_id] !== 'sin-registrar')
        .map((e) => ({ usuarioId: e.usuario_id, estado: estados[e.usuario_id] }));
      await api(`/sesiones/${sesionId}/asistencia`, { method: 'PUT', body: { registros } });
      setMensaje('Asistencia guardada.');
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function marcarTodos(estado) {
    try {
      await api(`/sesiones/${sesionId}/asistencia/todos`, { method: 'PUT', body: { estado } });
      setMensaje(`Todos marcados como ${nombreEstado[estado]}.`);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  const conteo = {
    presente: estudiantes.filter((e) => estados[e.usuario_id] === 'presente').length,
    ausente: estudiantes.filter((e) => estados[e.usuario_id] === 'ausente').length,
    justificado: estudiantes.filter((e) => estados[e.usuario_id] === 'justificado').length,
  };

  if (error) return <div className="alerta error">{error}</div>;
  if (!sesion) return <div className="alerta info">Cargando asistencia…</div>;

  return (
    <div>
      <div className="page-head">
        <Link to={`/aulas/${sesion.curso_id}`} className="btn btn-ghost">
          ‹ Volver al aula
        </Link>
        <div>
          <h1>Asistencia</h1>
          <p className="muted">
            {sesion.titulo} · {sesion.curso_nombre}
          </p>
        </div>
      </div>

      {mensaje && <div className="alerta ok">{mensaje}</div>}

      {esDocente && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <strong>Acciones rápidas:</strong>
            <button className="btn" onClick={() => marcarTodos('presente')}>
              Todos presentes
            </button>
            <button className="btn" onClick={() => marcarTodos('ausente')}>
              Todos ausentes
            </button>
            <span className="muted" style={{ marginLeft: 'auto' }}>
              Presentes: <strong>{conteo.presente}</strong> · Ausentes: <strong>{conteo.ausente}</strong> ·
              Justificados: <strong>{conteo.justificado}</strong> / {estudiantes.length}
            </span>
          </div>
        </div>
      )}

      <table className="tabla">
        <thead>
          <tr>
            <th>Estudiante</th>
            <th>Estado</th>
            {esDocente && <th>Marcar</th>}
          </tr>
        </thead>
        <tbody>
          {estudiantes.map((e) => {
            const actual = estados[e.usuario_id] || 'sin-registrar';
            return (
              <tr key={e.usuario_id} className={e.usuario_id === usuario?.id ? 'fila-propia' : ''}>
                <td>
                  {e.nombre}
                  <span className="muted"> ({e.email})</span>
                  {e.usuario_id === usuario?.id && <span className="pill ok" style={{ marginLeft: 8 }}>Sos vos</span>}
                </td>
                <td>
                  <span className={`pill ${actual === 'presente' ? 'ok' : 'falta'}`}>{nombreEstado[actual]}</span>
                </td>
                {esDocente && (
                  <td>
                    <div className="grupo-asistencia">
                      {['presente', 'ausente', 'justificado'].map((est) => (
                        <button
                          key={est}
                          className={`btn btn-mini${estados[e.usuario_id] === est ? ' btn-primary' : ''}`}
                          onClick={() => cambiar(e.usuario_id, est)}
                        >
                          {nombreEstado[est]}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {estudiantes.length === 0 && <div className="vacio">Este aula aún no tiene estudiantes matriculados.</div>}

      {esDocente && (
        <div className="acciones">
          <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar asistencia'}
          </button>
        </div>
      )}
    </div>
  );
}