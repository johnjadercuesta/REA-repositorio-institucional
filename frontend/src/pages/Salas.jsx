import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getUsuario } from '../api.js';
import { Modal } from '../components/ui/index.jsx';

const nombreEstado = { programada: 'Programada', activa: 'Activa', finalizada: 'Finalizada' };

export default function Salas() {
  const usuario = getUsuario();
  const puedeCrear = usuario?.rol !== 'estudiante';
  const [salas, setSalas] = useState([]);
  const [error, setError] = useState('');
  const [creando, setCreando] = useState(false);
  const [cursos, setCursos] = useState([]);
  const [form, setForm] = useState({
    tipo: 'reunion',
    titulo: '',
    descripcion: '',
    acceso: 'abierto',
    password: '',
    cursoId: '',
    fecha_inicio: '',
    estado: 'programada',
  });

  async function cargar() {
    try {
      setSalas(await api('/salas'));
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function abrirForm() {
    setError('');
    setForm((f) => ({ ...f, titulo: '', descripcion: '', password: '', cursoId: '', fecha_inicio: '' }));
    try {
      const lista = usuario?.rol === 'coordinacion' ? await api('/cursos') : await api('/cursos/miaula');
      setCursos(lista);
      setCreando(true);
    } catch (e) {
      setError(e.message);
    }
  }

  async function crear(e) {
    e.preventDefault();
    setError('');
    const body = {
      ...form,
      password: form.acceso === 'restringido' ? form.password : null,
      cursoId: form.cursoId ? Number(form.cursoId) : null,
    };
    try {
      await api('/salas', { method: 'POST', body });
      setCreando(false);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Salas virtuales</h1>
          <p className="muted">Reuniones y encuentros en vivo para tus aulas y equipos.</p>
        </div>
        {puedeCrear && (
          <button className="btn btn-primary" onClick={abrirForm}>
            + Nueva sala
          </button>
        )}
      </div>

      {error && <div className="alerta error">{error}</div>}

      <div className="grid">
        {salas.map((s) => (
          <Link
            to={`/salas/${s.id}`}
            className="card"
            key={s.id}
            style={{ borderColor: s.estado === 'activa' ? 'var(--verde)' : undefined }}
          >
            <span className="badge-tipo">
              {s.tipo === 'clase' ? 'Clase' : 'Reunión'} · {nombreEstado[s.estado]}
            </span>
            <h3>{s.titulo}</h3>
            <p>{s.descripcion || '—'}</p>
            <div className="card-meta">
              <span>
                {s.curso_nombre || s.sesion_titulo ? `📚 ${s.curso_nombre || s.sesion_titulo}` : ''}{' '}
                {s.protegida ? '· 🔒' : ''} {s.fecha_inicio ? `· ${s.fecha_inicio}` : ''}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {salas.length === 0 && (
        <div className="vacio">
          {puedeCrear
            ? 'Todavía no hay salas. Creá la primera para empezar un encuentro en vivo.'
            : 'No tenés salas disponibles todavía.'}
        </div>
      )}

      <Modal
        abierto={creando}
        titulo="Nueva sala"
        onCerrar={() => setCreando(false)}
        footer={
          <>
            <button className="btn" onClick={() => setCreando(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" form="form-sala">
              Crear sala
            </button>
          </>
        }
      >
        <form id="form-sala" className="form" onSubmit={crear}>
          <label>
            Tipo
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              <option value="reunion">Reunión</option>
              <option value="clase">Clase</option>
            </select>
          </label>
          <label>
            Título *
            <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
          </label>
          <label>
            Descripción
            <textarea rows="2" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </label>
          {form.tipo === 'clase' && (
            <label>
              Aula / curso
              <select
                value={form.cursoId}
                onChange={(e) => setForm({ ...form, cursoId: e.target.value })}
                required
              >
                <option value="">Seleccionar aula…</option>
                {cursos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.grado} · {c.asignatura})
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Acceso
            <select value={form.acceso} onChange={(e) => setForm({ ...form, acceso: e.target.value })}>
              <option value="abierto">Abierto (sin contraseña)</option>
              <option value="restringido">Restringido (con contraseña)</option>
            </select>
          </label>
          {form.acceso === 'restringido' && (
            <label>
              Contraseña *
              <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </label>
          )}
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
        </form>
      </Modal>
    </div>
  );
}