import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, getUsuario } from '../api.js';
import { EmptyState } from '../components/ui/index.jsx';

export default function Seguimiento() {
  const usuario = getUsuario();
  const navigate = useNavigate();
  const esCoord = usuario?.rol === 'coordinacion';
  const [cursos, setCursos] = useState([]);
  const [cursoId, setCursoId] = useState('');
  const [q, setQ] = useState('');
  const [dato, setDato] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const p = esCoord ? api('/cursos') : api('/cursos/miaula');
    p.then(setCursos).catch(() => setCursos([]));
  }, [esCoord]);

  function cargar() {
    const params = new URLSearchParams();
    if (cursoId) params.set('cursoId', cursoId);
    if (q.trim()) params.set('q', q.trim());
    api(`/progreso/seguimiento?${params.toString()}`).then(setDato).catch((e) => setError(e.message));
  }
  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function exportarCsv() {
    const params = new URLSearchParams();
    if (cursoId) params.set('cursoId', cursoId);
    if (q.trim()) params.set('q', q.trim());
    try {
      const res = await api(`/progreso/seguimiento?csv&${params.toString()}`);
      const texto = await res.text();
      const blob = new Blob(['\uFEFF' + texto], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'seguimiento_progreso.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    }
  }

  const estudiantes = dato?.estudiantes || [];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Seguimiento de progreso</h1>
          <p className="muted">
            {esCoord ? 'Progreso de todos los estudiantes.' : 'Progreso de los estudiantes de tus cursos.'}
          </p>
        </div>
        <button className="btn" onClick={exportarCsv} disabled={!estudiantes.length}>
          ⬇ Exportar CSV
        </button>
      </div>

      {error && <div className="alerta error">{error}</div>}

      <div className="filtros">
        <select value={cursoId} onChange={(e) => setCursoId(e.target.value)}>
          <option value="">Todos los cursos</option>
          {cursos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.grado} · {c.asignatura} — {c.nombre}
            </option>
          ))}
        </select>
        <input className="buscar" placeholder="Buscar por nombre o email…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-primary" onClick={cargar}>
          Filtrar
        </button>
      </div>

      {!dato ? (
        <div className="alerta info">Cargando…</div>
      ) : !estudiantes.length ? (
        <EmptyState icon="👩‍🎓" titulo="Sin estudiantes" texto="No hay estudiantes en los cursos seleccionados o aún no tienen actividad." />
      ) : (
        <div className="tabla-scroll">
          <table className="tabla">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Cursos</th>
                <th className="num">Vistos</th>
                <th className="num">Completados</th>
                <th className="num">Favoritos</th>
                <th>Última actividad</th>
              </tr>
            </thead>
            <tbody>
              {estudiantes.map((e) => (
                <tr className="fila-click" key={e.id} onClick={() => navigate(`/seguimiento/${e.id}`)}>
                  <td>
                    <strong>{e.nombre}</strong>
                    <div className="muted" style={{ fontSize: 12 }}>{e.email}</div>
                  </td>
                  <td>
                    {e.cursos.length ? (
                      <div className="chips">
                        {e.cursos.slice(0, 2).map((c) => (
                          <span key={c.id} className="pill">{c.grado} · {c.asignatura}</span>
                        ))}
                        {e.cursos.length > 2 && <span className="pill muted">+{e.cursos.length - 2}</span>}
                      </div>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td className="num">{e.vistos}</td>
                  <td className="num"><strong>{e.completados}</strong></td>
                  <td className="num">{e.favoritos}</td>
                  <td className="muted">{e.ultima_actividad ? e.ultima_actividad.replace('T', ' ').slice(0, 16) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="muted" style={{ fontSize: 13 }}>
        <Link to="/rutas">Ver rutas de aprendizaje</Link> para comprender los avances por área.
      </p>
    </div>
  );
}