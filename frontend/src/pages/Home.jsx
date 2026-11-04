import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, tiposRecurso } from '../api.js';
import { AREAS, contarAreas, areaDeSimulador, areaPorSlug } from '../catalog.js';
import { SkeletonCard } from '../components/ui/index.jsx';

const ICONO_TIPO = {
  documento: '📄', video: '🎥', audio: '🎧', imagen: '🖼️', enlace: '🔗', libro: '📖', h5: '🧩', simulacion: '🎮',
};

function RecursosFila({ titulo, items, areaFiltro }) {
  if (!items) return <SkeletonCard />;
  if (!items.length) return null;
  return (
    <section className="reco-seccion">
      <div className="reco-cab">
        <h2>{titulo}</h2>
        <Link to={areaFiltro ? `/area/${areaFiltro}` : '/recursos'} className="btn btn-ghost">
          Ver todos →
        </Link>
      </div>
      <div className="grid">
        {items.slice(0, 6).map((r) => (
          <Link to={`/recursos/${r.id}`} className="card" key={r.id}>
            <div className="card-badge">{ICONO_TIPO[r.tipo] || '📄'} {tiposRecurso.find((t) => t === r.tipo) || r.tipo}</div>
            <h3>{r.titulo}</h3>
            {r.descripcion && <p>{r.descripcion}</p>}
            <div className="card-meta">
              <span>⭐ {(Number(r.puntaje_promed) || 0).toFixed(1)} ({r.total_valoraciones ?? 0})</span>
              <span>⬇ {r.contador_descargas}</span>
            </div>
            <div className="card-grado">{r.grados || ''}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function SimuladoresFila({ simuladores }) {
  if (!simuladores) return <SkeletonCard />;
  const destacados = simuladores.slice(0, 6);
  if (!destacados.length) return null;
  return (
    <section className="reco-seccion">
      <div className="reco-cab">
        <h2>Simuladores destacados</h2>
        <Link to="/simuladores" className="btn btn-ghost">
          Ver todos →
        </Link>
      </div>
      <div className="grid">
        {destacados.map((s) => {
          const area = areaPorSlug(areaDeSimulador(s.area));
          return (
            <Link to={`/simuladores/${s.id}`} className="card" key={s.id}>
              <div className="card-badge" style={{ borderColor: area.color }}>{area.ic} Simulador</div>
              <h3>{s.nombre}</h3>
              {s.descripcion && <p>{s.descripcion}</p>}
              <div className="card-meta">
                <span>{s.nivel || ''}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function TarjetaArea({ a }) {
  return (
    <Link
      to={`/area/${a.slug}`}
      className="area-tarjeta"
      style={{ '--ac': a.color }}
    >
      <span className="area-ico" style={{ background: a.color }}>{a.ic}</span>
      <h3>{a.nombre}</h3>
      <p>{a.desc}</p>
      <div className="area-metas">
        <span>📦 {a.recursos} recursos</span>
        <span className="btn btn-mini">Explorar</span>
      </div>
    </Link>
  );
}

export default function Home() {
  const [areas, setAreas] = useState(null);
  const [nuevos, setNuevos] = useState(null);
  const [usados, setUsados] = useState(null);
  const [simuladores, setSimuladores] = useState(null);
  const [continuar, setContinuar] = useState(null);

  useEffect(() => {
    api('/busqueda/areas/resumen')
      .then((d) => setAreas(contarAreas(d)))
      .catch(() => setAreas([]));
    api('/recursos?orden=recientes&pageSize=6')
      .then((d) => setNuevos(d.data))
      .catch(() => setNuevos([]));
    api('/recursos?orden=descargas&pageSize=6')
      .then((d) => setUsados(d.data))
      .catch(() => setUsados([]));
    api('/simuladores')
      .then((d) => setSimuladores(d))
      .catch(() => setSimuladores([]));
    api('/progreso/continuar')
      .then(setContinuar)
      .catch(() => setContinuar([]));
  }, []);

  return (
    <div>
      <section className="hero">
        <div className="hero-tex">
          <h1>
            Aprende. Explora. <span>Experimenta.</span>
          </h1>
          <p>Un espacio para aprender, practicar y descubrir mediante recursos educativos interactivos.</p>
          <div className="hero-acciones">
            <Link to="/recursos" className="btn btn-primary btn-lg">
              Explorar recursos
            </Link>
            <Link to="/simuladores" className="btn btn-turquesa btn-lg">
              Explorar simuladores
            </Link>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-orbita orb1" />
          <div className="hero-orbita orb2" />
          <div className="hero-orbita orb3" />
          <span className="hero-atomo">⚛️</span>
          <span className="hero-grafico">📈</span>
          <span className="hero-lab">🧪</span>
        </div>
      </section>

      <section>
        <div className="reco-cab">
          <h2>Áreas académicas</h2>
          <Link to="/areas" className="btn btn-ghost">Ver todas →</Link>
        </div>
        {!areas ? (
          <div className="grid"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        ) : (
          <div className="area-grid">
            {areas.map((a) => <TarjetaArea key={a.slug} a={a} />)}
          </div>
        )}
      </section>

      <RecursosFila titulo="Nuevos recursos" items={nuevos} />
      <RecursosFila titulo="Más utilizados" items={usados} />
      <SimuladoresFila simuladores={simuladores} />

      <section className="reco-seccion">
        <div className="reco-cab">
          <h2>Continúa aprendiendo</h2>
          <Link to="/perfil" className="btn btn-ghost">Ver mi progreso →</Link>
        </div>
        {!continuar ? (
          <SkeletonCard />
        ) : continuar.length ? (
          <div className="grid">
            {continuar.slice(0, 4).map((c) => {
              const area = areaPorSlug(c.area);
              return (
                <Link to={c.tipo === 'recurso' ? `/recursos/${c.id}` : `/simuladores/${c.id}`} className="card" key={`${c.tipo}-${c.id}`}>
                  <div className="card-badge">
                    {c.tipo === 'recurso' ? ICONO_TIPO[c.metasub] || '📄' : area.ic}
                    {' '}{c.tipo === 'recurso' ? 'Recurso' : 'Simulador'}
                  </div>
                  <h3>{c.titulo}</h3>
                  {c.descripcion && <p>{c.descripcion}</p>}
                  <div className="card-meta">
                    <span>{area.nombre}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="card conti">
            <p className="muted">Comenzá explorando un área o un simulador: tu progreso se guardará automáticamente.</p>
            <div className="hero-acciones">
              <Link to="/areas" className="btn btn-primary">Ir a las áreas</Link>
              <Link to="/simuladores" className="btn">Abrir simuladores</Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}