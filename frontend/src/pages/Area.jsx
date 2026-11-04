import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, tiposRecurso } from '../api.js';
import { AREAS, areaPorSlug, areaDeSimulador } from '../catalog.js';
import { SkeletonCard, EmptyState } from '../components/ui/index.jsx';

const ICONO_TIPO = {
  documento: '📄', video: '🎥', audio: '🎧', imagen: '🖼️', enlace: '🔗', libro: '📖', h5: '🧩', simulacion: '🎮',
};

export default function Area() {
  const { slug } = useParams();
  const area = areaPorSlug(slug);
  const [recursos, setRecursos] = useState(null);
  const [simuladores, setSimuladores] = useState(null);

  useEffect(() => {
    let activo = true;
    const qs = `asignaturas=${encodeURIComponent(area.asignaturas.join(','))}&pageSize=100`;
    api(`/recursos?${qs}`).then((d) => activo && setRecursos(d.data)).catch(() => activo && setRecursos([]));
    api('/simuladores').then((d) => activo && setSimuladores(d.filter((s) => areaDeSimulador(s.area) === slug))).catch(() => activo && setSimuladores([]));
    return () => { activo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="migras">
            <Link to="/areas">Áreas</Link> <span>/</span> {area.nombre}
          </p>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, color: area.color }}>
            <span>{area.ic}</span> {area.nombre}
          </h1>
          <p>{area.desc}</p>
        </div>
        <Link to={`/ruta/${slug}`} className="btn btn-turquesa">🗺️ Ruta de aprendizaje</Link>
      </div>

      <h2 className="seccion-titulo">🎮 Simuladores</h2>
      {!simuladores ? (
        <div className="grid"><SkeletonCard /><SkeletonCard /></div>
      ) : simuladores.length === 0 ? (
        <EmptyState icon="🎮" titulo="Todavía no hay simuladores en esta área" texto="Podés explorar otras áreas mientras se agregan más." />
      ) : (
        <div className="grid">
          {simuladores.map((s) => (
            <Link to={`/simuladores/${s.id}`} className="card" key={s.id}>
              <div className="card-badge" style={{ borderColor: area.color }}>{area.ic} Simulador</div>
              <h3>{s.nombre}</h3>
              {s.descripcion && <p>{s.descripcion}</p>}
              <div className="card-meta"><span>{s.nivel || ''}</span></div>
            </Link>
          ))}
        </div>
      )}

      <h2 className="seccion-titulo">📚 Recursos</h2>
      {!recursos ? (
        <div className="grid"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      ) : recursos.length === 0 ? (
        <EmptyState
          icon="📚"
          titulo="Este área todavía no tiene recursos"
          texto="Los recursos se vinculan al currículo según su asignatura. Podés explorar otra área."
          accion="Ver otras áreas"
          onAccion={() => (window.location.href = '/areas')}
        />
      ) : (
        <div className="grid">
          {recursos.map((r) => (
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
      )}
    </div>
  );
}