import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, tiposRecurso, getUsuario } from '../api.js';
import { areaPorSlug } from '../catalog.js';
import { EmptyState, SkeletonCard } from '../components/ui/index.jsx';

export default function Perfil() {
  const usuario = getUsuario();
  const [resumen, setResumen] = useState(null);
  const [continuar, setContinuar] = useState(null);
  const [favoritos, setFavoritos] = useState(null);

  useEffect(() => {
    api('/progreso').then(setResumen).catch(() => setResumen(null));
    api('/progreso/continuar?limit=5').then(setContinuar).catch(() => setContinuar([]));
    api('/progreso/favoritos').then(setFavoritos).catch(() => setFavoritos([]));
  }, []);

  const nombreRol = usuario?.rol === 'coordinacion' ? 'Coordinación' : usuario?.rol === 'estudiante' ? 'Estudiante' : 'Docente';

  const ItemProgreso = ({ c }) => {
    const area = areaPorSlug(c.area);
    const etiqueta = c.tipo === 'recurso' ? (tiposRecurso.includes(c.metasub) ? c.metasub : 'Recurso') : 'Simulador';
    return (
      <Link to={c.tipo === 'recurso' ? `/recursos/${c.id}` : `/simuladores/${c.id}`} className="card">
        <div className="card-badge">{c.tipo === 'recurso' ? '📄' : area.ic} {etiqueta}</div>
        <h3>{c.titulo}</h3>
        {c.descripcion && <p>{c.descripcion}</p>}
        <div className="card-meta"><span>{area.nombre}</span></div>
      </Link>
    );
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Mi perfil</h1>
          <p>Tu progreso, favoritos y rutas de aprendizaje.</p>
        </div>
        <Link to="/rutas" className="btn btn-turquesa">Rutas de aprendizaje</Link>
      </div>

      <div className="card perfil-cab">
        <span className="perfil-avatar">{(usuario?.nombre || '?')[0]}</span>
        <div>
          <h2 style={{ margin: 0 }}>{usuario?.nombre}</h2>
          <p className="muted" style={{ margin: 0 }}>{usuario?.email} · {nombreRol}</p>
        </div>
      </div>

      {resumen ? (
        <>
          <div className="stats-grid">
            <div className="stat-card"><strong>{resumen.recurso.vistos}</strong><span>Recursos vistos</span></div>
            <div className="stat-card"><strong>{resumen.simulador.vistos}</strong><span>Simuladores usados</span></div>
            <div className="stat-card"><strong>{resumen.total.completados}</strong><span>Completados</span></div>
            <div className="stat-card"><strong>{resumen.total.favoritos}</strong><span>Favoritos</span></div>
          </div>

          <div className="reco-seccion">
            <div className="reco-cab">
              <h2>Continúa aprendiendo</h2>
              <Link to="/areas" className="btn btn-ghost">Explorar áreas →</Link>
            </div>
            {!continuar ? (
              <SkeletonCard />
            ) : continuar.length ? (
              <div className="grid">{continuar.map((c) => <ItemProgreso key={`${c.tipo}-${c.id}`} c={c} />)}</div>
            ) : (
              <EmptyState icon="🚀" titulo="Nada pendiente" texto="Todo lo que viste está completado. Seguí explorando el repositorio." />
            )}
          </div>

          <div className="reco-seccion">
            <h2>Mi progreso por área</h2>
            {resumen.porArea.filter((a) => a.total > 0).length ? (
              <div className="prog-areas">
                {resumen.porArea.filter((a) => a.total > 0).map((a) => {
                  const area = areaPorSlug(a.slug);
                  const pct = a.total ? Math.round((a.completados / a.total) * 100) : 0;
                  return (
                    <Link to={`/ruta/${a.slug}`} className="prog-area" key={a.slug}>
                      <span className="area-ico" style={{ background: area.color }}>{area.ic}</span>
                      <div className="prog-area-txt">
                        <strong>{a.nombre}</strong>
                        <div className="barra"><div className="barra-fill" style={{ width: `${pct}%`, background: area.color }} /></div>
                        <small className="muted">{a.completados} de {a.total} completados · {a.enProgreso} en progreso</small>
                      </div>
                      <span className="muted">{pct}%</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState icon="🗺️" titulo="Empezá tu primera ruta" texto="Abandoná un área o un simulador y tu progreso empezará a contarse acá." />
            )}
          </div>

          <div className="reco-seccion">
            <h2>Mis favoritos</h2>
            {!favoritos ? (
              <SkeletonCard />
            ) : favoritos.length ? (
              <div className="grid">{favoritos.slice(0, 6).map((c) => <ItemProgreso key={`${c.tipo}-${c.id}`} c={c} />)}</div>
            ) : (
              <EmptyState icon="☆" titulo="Sin favoritos todavía" texto="Guardá recursos y simuladores con el botón estrella y aparecerán acá." />
            )}
          </div>
        </>
      ) : (
        <EmptyState icon="📊" titulo="Cargando tu actividad…" texto="Estamos recuperando tu progreso." />
      )}
    </div>
  );
}