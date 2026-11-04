import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getUsuario } from '../api.js';

export default function Aulas() {
  const usuario = getUsuario();
  const esCoord = usuario?.rol === 'coordinacion';
  const [aulas, setAulas] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const p = esCoord ? api('/cursos') : api('/cursos/miaula');
    p.then(setAulas).catch((e) => setError(e.message));
  }, [esCoord]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Mis aulas</h1>
          <p className="muted">
            {esCoord ? 'Todas las aulas del establecimiento.' : 'Entrá a tus aulas para participar de las sesiones.'}
          </p>
        </div>
      </div>
      {error && <div className="alerta error">{error}</div>}

      <div className="grid">
        {aulas.map((a) => (
          <Link to={`/aulas/${a.id}`} className="card" key={a.id}>
            <span className="badge-tipo">{a.grado} · {a.asignatura}</span>
            <h3>{a.nombre}</h3>
            <p>{a.periodo || '—'}</p>
            <div className="card-meta">
              <span>{a.docente_nombre || 'Sin docente asignado'}</span>
            </div>
          </Link>
        ))}
      </div>
      {aulas.length === 0 && (
        <div className="vacio">
          {esCoord ? 'Todavía no hay aulas. Creá cursos desde la sección «Cursos».' : 'No estás matriculado en ninguna aula.'}
        </div>
      )}
    </div>
  );
}