import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, tiposRecurso } from '../api.js';
import { areaPorSlug } from '../catalog.js';
import { SkeletonCard, EmptyState } from '../components/ui/index.jsx';

const ICONO_TIPO = {
  documento: '📄', video: '🎥', audio: '🎧', imagen: '🖼️', enlace: '🔗', libro: '📖', h5: '🧩',
};

const ETIQUETA_ESTADO = {
  completado: 'Completado',
  'en-progreso': 'En progreso',
  pendiente: 'Pendiente',
};

export default function Ruta() {
  const { slug } = useParams();
  const [ruta, setRuta] = useState(null);
  const [error, setError] = useState('');
  const [trabajando, setTrabajando] = useState(null);

  function cargar() {
    api(`/progreso/rutas/${slug}`).then(setRuta).catch((e) => setError(e.message));
  }
  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function marcar(nodo, completado) {
    setTrabajando(`${nodo.tipo}-${nodo.id}`);
    try {
      await api('/progreso/completar', { method: 'POST', body: { tipo: nodo.tipo, id: nodo.id, activo: completado ? 1 : 0 } });
    } finally {
      setTrabajando(null);
      cargar();
    }
  }

  if (error) return <div className="alerta error">{error}</div>;
  if (!ruta) return <div className="alerta info">Cargando ruta…</div>;

  const area = areaPorSlug(ruta.slug);
  const pct = ruta.total ? Math.round((ruta.completados / ruta.total) * 100) : 0;

  return (
    <div>
      <div className="migras">
        <Link to="/rutas">Rutas</Link>
        <span className="miga-sep">›</span>
        <span className="actual">{area.nombre}</span>
      </div>

      <section className="ruta-hero" style={{ '--ac': area.color }}>
        <span className="area-ico" style={{ background: area.color }}>{area.ic}</span>
        <div className="ruta-hero-txt">
          <h1>{area.nombre}</h1>
          <p>{area.desc}</p>
          <div className="barra"><div className="barra-fill" style={{ width: `${pct}%`, background: area.color, maxWidth: 420 }} /></div>
          <p className="muted" style={{ marginBottom: 0 }}>
            {ruta.completados} de {ruta.total} checkpoints completados ({pct}%) · {ruta.enProgreso} en progreso
          </p>
        </div>
        <Link to={`/area/${ruta.slug}`} className="btn">Ver área completa</Link>
      </section>

      <section className="reco-seccion">
        <h2>Checkpoints</h2>
        <ol className="checkpoints">
          {ruta.nodos.map((nodo, i) => (
            <li
              className={`checkpoint cp-${nodo.estado}`}
              key={`${nodo.tipo}-${nodo.id}`}
              style={{ '--ac': area.color }}
            >
              <span className="cp-num">{nodo.completado ? '✓' : i + 1}</span>
              <div className="cp-txt">
                <Link to={nodo.tipo === 'recurso' ? `/recursos/${nodo.id}` : `/simuladores/${nodo.id}`}>
                  <strong>{nodo.titulo}</strong>
                </Link>
                {nodo.descripcion && <p>{nodo.descripcion}</p>}
                <div className="card-meta">
                  <span className="cp-badge">
                    {nodo.tipo === 'recurso' ? ICONO_TIPO[nodo.meta] || '📄' : '🎮'} {nodo.tipo === 'recurso' ? (tiposRecurso.includes(nodo.meta) ? nodo.meta : 'Recurso') : 'Simulador'}
                  </span>
                  <span className={`estado-chip chip-${nodo.estado}`}>{ETIQUETA_ESTADO[nodo.estado]}</span>
                </div>
              </div>
              <div className="cp-accion">
                <button
                  className={`btn btn-mini${nodo.completado ? ' btn-ok' : ''}`}
                  disabled={trabajando === `${nodo.tipo}-${nodo.id}`}
                  onClick={() => marcar(nodo, !nodo.completado)}
                >
                  {nodo.completado ? 'Desmarcar' : 'Marcar completo'}
                </button>
              </div>
            </li>
          ))}
        </ol>
        {!ruta.nodos.length && (
          <EmptyState icon="🗺️" titulo="Área sin contenido" texto="Todavía no hay recursos ni simuladores para esta área." />
        )}
      </section>
    </div>
  );
}