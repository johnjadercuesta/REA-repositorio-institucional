import { Component, Suspense, useEffect, useState } from 'react';
import { api } from '../api.js';
import { getSimApp, SIMAPPS } from '../simApps/index.js';
import { Modal } from './ui/index.jsx';

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

function urlEmbebible(url) {
  if (!url) return null;
  const m = url.match(/phet\.colorado\.edu\/(?:es\/)?simulations\/([a-z0-9-]+)/i);
  if (m) {
    const slug = m[1];
    return `https://phet.colorado.edu/sims/html/${slug}/latest/${slug}_es.html`;
  }
  return url;
}

function Contenido({ sim }) {
  if (!sim) return null;
  const AppPro = getSimApp(sim.aplicacion);
  const esPropia = Boolean(sim.aplicacion && SIMAPPS[sim.aplicacion]);
  const src = esPropia ? null : urlEmbebible(sim.url);
  return (
    <div>
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
    </div>
  );
}

export default function SalaSimuladores({ socket, esAnfitrion }) {
  const [lista, setLista] = useState([]);
  const [error, setError] = useState('');
  const [compartido, setCompartido] = useState(null);
  const [abierto, setAbierto] = useState(null);

  useEffect(() => {
    api('/simuladores')
      .then(setLista)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onCompartir = (dato) => setCompartido(dato);
    socket.on('sala:compartir', onCompartir);
    return () => socket.off('sala:compartir', onCompartir);
  }, [socket]);

  function compartir(sim) {
    const dato = {
      tipo: 'simulador',
      id: sim.id,
      nombre: sim.nombre,
      aplicacion: sim.aplicacion || null,
      src: urlEmbebible(sim.url),
    };
    socket.emit('sala:compartir', dato);
    setCompartido(dato);
  }

  function dejarCompartir() {
    socket.emit('sala:compartir', null);
    setCompartido(null);
  }

  if (error) return <div className="alerta error">{error}</div>;

  return (
    <div>
      {compartido && (
        <div className="sala-compartido">
          <div className="sala-compartido-cab">
            <span className="pill ok">Compartiendo</span>
            <strong>{compartido.nombre}</strong>
            {esAnfitrion && (
              <button className="btn btn-danger btn-mini" onClick={dejarCompartir}>
                Dejar de compartir
              </button>
            )}
          </div>
          <Contenido sim={compartido} />
        </div>
      )}

      <h3 style={{ marginTop: compartido ? 16 : 0 }}>Simuladores del catálogo</h3>
      <div className="grid">
        {lista.map((s) => (
          <div className="card" key={s.id}>
            <span className="badge-tipo">{s.area}</span>
            <h3>{s.nombre}</h3>
            <p>{s.descripcion || '—'}</p>
            {s.nivel && <div className="card-meta"><span>Nivel: {s.nivel}</span></div>}
            <div className="card-meta" style={{ marginTop: 10 }}>
              {esAnfitrion ? (
                <button className="btn btn-primary" onClick={() => compartir(s)}>
                  Compartir
                </button>
              ) : (
                <span className="muted" style={{ fontSize: 13 }}>Solo el anfitrión comparte</span>
              )}
              <button className="btn" onClick={() => setAbierto(s)}>
                Ver
              </button>
            </div>
          </div>
        ))}
      </div>
      {lista.length === 0 && <div className="vacio">Todavía no hay simuladores en el catálogo.</div>}

      <Modal abierto={Boolean(abierto)} titulo={abierto?.nombre} onCerrar={() => setAbierto(null)} footer={null}>
        {abierto && <Contenido sim={abierto} />}
      </Modal>
    </div>
  );
}