import { Component, useEffect, useState, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import { getSimApp, SIMAPPS } from '../simApps/index.js';

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="alerta error" style={{ padding: 16 }}>
          No se pudo cargar la aplicación interactiva.
          <button className="btn" onClick={() => this.setState({ error: null })} style={{ marginLeft: 10 }}>
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Convierte URLs de PhET (páginas /simulations/) a la versión embebible (sims/html).
function urlEmbebible(url) {
  if (!url) return null;
  const m = url.match(/phet\.colorado\.edu\/(?:es\/)?simulations\/([a-z0-9-]+)/i);
  if (m) {
    const slug = m[1];
    return `https://phet.colorado.edu/sims/html/${slug}/latest/${slug}_es.html`;
  }
  return url;
}

export default function Simulador() {
  const { id } = useParams();
  const [sim, setSim] = useState(null);
  const [error, setError] = useState('');
  const [prog, setProg] = useState({ favorito: 0, completado: 0, veces_visto: 0 });

  useEffect(() => {
    api('/simuladores')
      .then((lista) => {
        const encontrado = lista.find((s) => s.id === Number(id));
        if (!encontrado) setError('Simulador no encontrado');
        else {
          setSim(encontrado);
          api('/progreso/vista', { method: 'POST', body: { tipo: 'simulador', id: encontrado.id } }).catch(() => {});
          api(`/progreso/estado?tipo=simulador&id=${encontrado.id}`).then(setProg).catch(() => {});
        }
      })
      .catch((e) => setError(e.message));
  }, [id]);

  async function toggleFav() {
    try {
      setProg(await api('/progreso/favorito', { method: 'POST', body: { tipo: 'simulador', id: sim.id } }));
    } catch (e) {
      setError(e.message);
    }
  }

  async function toggleCompletar() {
    try {
      setProg(await api('/progreso/completar', { method: 'POST', body: { tipo: 'simulador', id: sim.id } }));
    } catch (e) {
      setError(e.message);
    }
  }

  if (error) return <div className="alerta error">{error}</div>;
  if (!sim) return <div className="alerta info">Cargando simulador…</div>;

  const AppPro = getSimApp(sim.aplicacion);
  const esPropia = Boolean(sim.aplicacion && SIMAPPS[sim.aplicacion]);
  const src = esPropia ? null : urlEmbebible(sim.url);

  return (
    <div>
      <div className="page-head">
        <Link to="/simuladores" className="btn btn-ghost">
          ‹ Catálogo de simuladores
        </Link>
        <div className="detalle-acciones">
          <button className="btn btn-favorito" onClick={toggleFav}>
            {prog.favorito ? '★ Guardado' : '☆ Guardar'}
          </button>
          <button className={`btn${prog.completado ? ' btn-ok' : ''}`} onClick={toggleCompletar}>
            {prog.completado ? '✓ Completado' : 'Marcar como completo'}
          </button>
          {sim.url && !esPropia && (
            <a className="btn" href={sim.url} target="_blank" rel="noopener noreferrer">
              Abrir ↗
            </a>
          )}
        </div>
      </div>
      <article className="card">
        <span className="badge-tipo">{sim.area}</span>
        <h1>{sim.nombre}</h1>
        {sim.descripcion && <p className="detalle-desc">{sim.descripcion}</p>}
        {sim.nivel && <p className="muted">Nivel: {sim.nivel}</p>}
      </article>
      <section className="card" style={{ marginTop: 16 }}>
        {esPropia ? (
          <div>
            <p className="badge-tipo sim-etiqueta-tag">{SIMAPPS[sim.aplicacion].etiqueta}</p>
            <ErrorBoundary>
              <Suspense fallback={<div className="alerta info">Cargando aplicación interactiva…</div>}>
                <AppPro />
              </Suspense>
            </ErrorBoundary>
          </div>
        ) : (
          <div className="sim-externo">
            <div className="sim-embed">
              <iframe
                title={sim.nombre}
                src={src}
                allow="fullscreen; accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="sim-externo-aviso">
              <p>¿No se ve el simulador? Abrílo en una pestaña nueva para trabajarlo a pantalla completa.</p>
              <a className="btn btn-primary" href={sim.url} target="_blank" rel="noopener noreferrer">
                Abrir en pestaña nueva ↗
              </a>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}