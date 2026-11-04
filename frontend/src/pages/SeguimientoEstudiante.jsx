import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, getUsuario } from '../api.js';
import { areaPorSlug } from '../catalog.js';
import { EmptyState, SkeletonCard } from '../components/ui/index.jsx';

export default function SeguimientoEstudiante() {
  const { usuarioId } = useParams();
  const usuario = getUsuario();
  const [detalle, setDetalle] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/progreso/seguimiento/${usuarioId}`).then(setDetalle).catch((e) => setError(e.message));
  }, [usuarioId]);

  if (error) return <div className="alerta error">{error}</div>;
  if (!detalle) return <div className="alerta info">Cargando…</div>;

  const { usuario: est, cursos, resumen, continuar, favoritos } = detalle;

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="migras">
            <Link to="/seguimiento">Seguimiento</Link> <span>/</span> {est.nombre}
          </p>
          <h1>
            {usuario?.rol === 'coordinacion' || usuario?.rol === 'docente'
              ? `Progreso de ${est.nombre}`
              : 'Mi progreso'}
          </h1>
          <p className="muted">{est.email}</p>
        </div>
      </div>

      <div className="card perfil-cab">
        <span className="perfil-avatar">{est.nombre[0]}</span>
        <div>
          <h2 style={{ margin: 0 }}>{est.nombre}</h2>
          {cursos.length ? (
            <div className="chips" style={{ marginTop: 6 }}>
              {cursos.map((c) => (
                <span key={c.id} className="pill">{c.grado} · {c.asignatura} — {c.nombre}</span>
              ))}
            </div>
          ) : (
            <p className="muted" style={{ margin: 4, fontSize: 13 }}>Sin cursos matriculados</p>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><strong>{resumen.recurso.vistos}</strong><span>Recursos vistos</span></div>
        <div className="stat-card"><strong>{resumen.simulador.vistos}</strong><span>Simuladores usados</span></div>
        <div className="stat-card"><strong>{resumen.total.completados}</strong><span>Completados</span></div>
        <div className="stat-card"><strong>{resumen.total.favoritos}</strong><span>Favoritos</span></div>
      </div>

      <div className="reco-seccion">
        <h2>Avance por área</h2>
        {resumen.porArea.filter((a) => a.total > 0).length ? (
          <div className="prog-areas">
            {resumen.porArea.filter((a) => a.total > 0).map((a) => {
              const area = areaPorSlug(a.slug);
              const pct = a.total ? Math.round((a.completados / a.total) * 100) : 0;
              return (
                <div className="prog-area" key={a.slug}>
                  <span className="area-ico" style={{ background: area.color }}>{area.ic}</span>
                  <div className="prog-area-txt">
                    <strong>{a.nombre}</strong>
                    <div className="barra"><div className="barra-fill" style={{ width: `${pct}%`, background: area.color }} /></div>
                    <small className="muted">{a.completados} de {a.total} completados · {a.enProgreso} en progreso</small>
                  </div>
                  <span className="muted">{pct}%</span>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState icon="🗺️" titulo="Sin avance todavía" texto="Este estudiante aún no tiene actividad de aprendizaje." />
        )}
      </div>

      {continuar.length > 0 && (
        <div className="reco-seccion">
          <h2>Continúa aprendiendo</h2>
          <div className="grid">
            {continuar.map((c) => (
              <Link to={c.tipo === 'recurso' ? `/recursos/${c.id}` : `/simuladores/${c.id}`} className="card" key={`${c.tipo}-${c.id}`}>
                <h3>{c.titulo}</h3>
                {c.descripcion && <p>{c.descripcion}</p>}
                <div className="card-meta"><span>{c.tipo === 'recurso' ? '📄 Recurso' : '🎮 Simulador'}</span></div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {favoritos.length > 0 && (
        <div className="reco-seccion">
          <h2>Favoritos</h2>
          <div className="grid">
            {favoritos.slice(0, 4).map((c) => (
              <Link to={c.tipo === 'recurso' ? `/recursos/${c.id}` : `/simuladores/${c.id}`} className="card" key={`${c.tipo}-${c.id}`}>
                <h3>{c.titulo}</h3>
                <div className="card-meta"><span>{c.tipo === 'recurso' ? '📄 Recurso' : '🎮 Simulador'}</span></div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}