import { useEffect, useState, Fragment } from 'react';
import { api } from '../api.js';

export default function Cursos() {
  const [cursos, setCursos] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [form, setForm] = useState({ nombre: '', grado: '', asignatura: '', nivel: 'Secundaria', periodo: '' });
  const [nuevoEst, setNuevoEst] = useState({ nombre: '', email: '', password: '' });
  const [expandido, setExpandido] = useState(null);
  const [matriculados, setMatriculados] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  async function cargar() {
    try {
      setCursos(await api('/cursos'));
      setEstudiantes(await api('/usuarios/estudiantes'));
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    cargar();
  }, []);

  async function crearCurso(e) {
    e.preventDefault();
    setError('');
    try {
      await api('/cursos', { method: 'POST', body: form });
      setForm({ nombre: '', grado: '', asignatura: '', nivel: 'Secundaria', periodo: '' });
      setMensaje('Curso creado.');
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function crearEstudiante(e) {
    e.preventDefault();
    setError('');
    try {
      await api('/usuarios', { method: 'POST', body: { ...nuevoEst, rol: 'estudiante' } });
      setNuevoEst({ nombre: '', email: '', password: '' });
      setMensaje('Estudiante creado.');
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function verMatriculados(cursoId) {
    if (expandido === cursoId) {
      setExpandido(null);
      return;
    }
    setExpandido(cursoId);
    const lista = await api(`/cursos/${cursoId}/matriculados`);
    setMatriculados((prev) => ({ ...prev, [cursoId]: lista }));
  }

  async function matricular(cursoId, usuarioId) {
    await api(`/cursos/${cursoId}/matricular`, { method: 'POST', body: { usuarioId } });
    verMatriculados(cursoId);
    setMensaje('Matriculado.');
  }

  async function desmatricular(cursoId, usuarioId) {
    await api(`/cursos/${cursoId}/matricular/${usuarioId}`, { method: 'DELETE' });
    verMatriculados(cursoId);
    setMensaje('Desmatriculado.');
  }

  return (
    <div>
      <div className="page-head">
        <h1>Cursos y matrícula</h1>
      </div>
      {mensaje && <div className="alerta ok">{mensaje}</div>}
      {error && <div className="alerta error">{error}</div>}

      <div className="cols">
        <form className="card form" onSubmit={crearCurso}>
          <h2>Crear curso</h2>
          <label>
            Nombre
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </label>
          <label>
            Grado
            <input value={form.grado} placeholder="3°" onChange={(e) => setForm({ ...form, grado: e.target.value })} required />
          </label>
          <label>
            Asignatura
            <input value={form.asignatura} onChange={(e) => setForm({ ...form, asignatura: e.target.value })} required />
          </label>
          <div className="cols">
            <label>
              Nivel
              <input value={form.nivel} onChange={(e) => setForm({ ...form, nivel: e.target.value })} />
            </label>
            <label>
              Periodo
              <input value={form.periodo} placeholder="2026" onChange={(e) => setForm({ ...form, periodo: e.target.value })} />
            </label>
          </div>
          <button className="btn btn-primary">Crear curso</button>
        </form>

        <form className="card form" onSubmit={crearEstudiante}>
          <h2>Alta de estudiante</h2>
          <label>
            Nombre y apellido
            <input value={nuevoEst.nombre} onChange={(e) => setNuevoEst({ ...nuevoEst, nombre: e.target.value })} required />
          </label>
          <label>
            Email
            <input type="email" value={nuevoEst.email} onChange={(e) => setNuevoEst({ ...nuevoEst, email: e.target.value })} required />
          </label>
          <label>
            Contraseña
            <input type="password" value={nuevoEst.password} onChange={(e) => setNuevoEst({ ...nuevoEst, password: e.target.value })} required />
          </label>
          <button className="btn btn-primary">Crear estudiante</button>
        </form>
      </div>

      <h2 style={{ marginTop: 24 }}>Cursos existentes</h2>
      <table className="tabla">
        <thead>
          <tr>
            <th>Curso</th>
            <th>Grado</th>
            <th>Asignatura</th>
            <th>Periodo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {cursos.map((c) => (
            <Fragment key={c.id}>
              <tr>
                <td>{c.nombre}</td>
                <td>{c.grado}</td>
                <td>{c.asignatura}</td>
                <td>{c.periodo || '—'}</td>
                <td>
                  <button className="btn btn-ghost" onClick={() => verMatriculados(c.id)}>
                    {expandido === c.id ? 'Ocultar alumnos' : 'Ver alumnos'}
                  </button>
                </td>
              </tr>
              {expandido === c.id && (
                <tr>
                  <td colSpan={5}>
                    <div className="matricula">
                      <ul>
                        {(matriculados[c.id] || []).map((s) => (
                          <li key={s.id}>
                            {s.nombre} <span className="muted">({s.email})</span>
                            <button className="btn btn-ghost btn-mini" onClick={() => desmatricular(c.id, s.id)}>
                              Quitar
                            </button>
                          </li>
                        ))}
                        {(matriculados[c.id] || []).length === 0 && <li className="muted">Sin alumnos.</li>}
                      </ul>
                      <select
                        onChange={(e) => {
                          if (e.target.value) matricular(c.id, Number(e.target.value));
                          e.target.value = '';
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Agregar estudiante…
                        </option>
                        {estudiantes
                          .filter((s) => !(matriculados[c.id] || []).some((m) => m.id === s.id))
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.nombre}
                            </option>
                          ))}
                      </select>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
      {cursos.length === 0 && <div className="vacio">Todavía no hay cursos. Creá el primero.</div>}
    </div>
  );
}