import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, getUsuario } from '../api.js';

const nombreEstado = { programada: 'Programada', activa: 'Activa', finalizada: 'Finalizada' };

export default function Aula() {
  const { id } = useParams();
  const navigate = useNavigate();
  const usuario = getUsuario();
  const esCoord = usuario?.rol === 'coordinacion';

  const [aula, setAula] = useState(null);
  const [sesiones, setSesiones] = useState([]);
  const [matriculados, setMatriculados] = useState([]);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [form, setForm] = useState({ titulo: '', descripcion: '', fecha_inicio: '', estado: 'programada' });

  async function cargar() {
    try {
      setAula(await api(`/cursos/${id}`));
      setSesiones(await api(`/sesiones/curso/${id}`));
      try {
        setMatriculados(await api(`/cursos/${id}/matriculados`));
      } catch {
        setMatriculados([]);
      }
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const puedeGestionar = esCoord || usuario?.id === aula?.docente_id;

  async function crearSesion(e) {
    e.preventDefault();
    setError('');
    try {
      await api(`/sesiones/curso/${id}`, { method: 'POST', body: form });
      setForm({ titulo: '', descripcion: '', fecha_inicio: '', estado: 'programada' });
      setMensaje('Sesión creada.');
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function cambiarEstado(sesion, estado) {
    try {
      await api(`/sesiones/${sesion.id}`, { method: 'PATCH', body: { estado } });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function eliminarSesion(sesion) {
    if (!confirm(`¿Eliminar la sesión "${sesion.titulo}"?`)) return;
    try {
      await api(`/sesiones/${sesion.id}`, { method: 'DELETE' });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) return <div className="alerta error">{error}</div>;
  if (!aula) return <div className="alerta info">Cargando aula…</div>;

  return (
    <div>
      <div className="page-head">
        <Link to="/aulas" className="btn btn-ghost">
          ‹ Mis aulas
        </Link>
        <h1>{aula.nombre}</h1>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <span className="badge-tipo">{aula.grado} · {aula.asignatura}</span>
        <p className="detalle-desc" style={{ marginTop: 8 }}>
          {aula.periodo || '—'} · Docente: {aula.docente_nombre || 'Sin asignar'} · {matriculados.length} alumnos
        </p>
      </div>

      {mensaje && <div className="alerta ok">{mensaje}</div>}

      {puedeGestionar && (
        <form className="card form" onSubmit={crearSesion} style={{ marginBottom: 18 }}>
          <h2>Nueva sesión del aula</h2>
          <label>
            Título *
            <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
          </label>
          <label>
            Descripción
            <textarea rows="2" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </label>
          <div className="cols">
            <label>
              Fecha / horario
              <input value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} />
            </label>
            <label>
              Estado
              <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                <option value="programada">Programada</option>
                <option value="activa">Activa</option>
                <option value="finalizada">Finalizada</option>
              </select>
            </label>
          </div>
          <button className="btn btn-primary">Crear sesión</button>
        </form>
      )}

      <h2>Sesiones</h2>
      {sesiones.length === 0 && <div className="vacio">Aún no hay sesiones en este aula.</div>}
      <table className="tabla">
        <thead>
          <tr>
            <th>Título</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sesiones.map((s) => (
            <tr key={s.id}>
              <td>
                <strong>{s.titulo}</strong>
                {s.descripcion && <div className="muted" style={{ fontSize: 13 }}>{s.descripcion}</div>}
              </td>
              <td>{s.fecha_inicio || '—'}</td>
              <td>
                <span className={`pill ${s.estado === 'activa' ? 'ok' : 'falta'}`}>{nombreEstado[s.estado]}</span>
              </td>
              <td>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate(`/pizarra/${s.id}`)}
                    disabled={s.estado !== 'activa'}
                    title={s.estado !== 'activa' ? 'La pizarra se abre cuando la sesión está activa' : ''}
                  >
                    Abrir pizarra
                  </button>
                  <Link to={`/asistencia/${s.id}`} className="btn">
                    Asistencia
                  </Link>
                  {esCoord && (
                    <button className="btn" onClick={() => cambiarEstado(s, 'activa')}>
                      Activar
                    </button>
                  )}
                  {puedeGestionar && (
                    <button className="btn btn-danger" onClick={() => eliminarSesion(s)}>
                      Eliminar
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}