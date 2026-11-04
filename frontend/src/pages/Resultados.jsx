import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { areaDeAsignatura, areaPorSlug } from '../catalog.js';
import { SkeletonCard, EmptyState } from '../components/ui/index.jsx';

const ICONO_TIPO = {
  documento: '📄', video: '🎥', audio: '🎧', imagen: '🖼️', enlace: '🔗', libro: '📖', h5: '🧩', simulacion: '🎮',
};

export default function Resultados() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    if (!q) return;
    api(`/busqueda?q=${encodeURIComponent(q)}`).then(setData).catch(() => setData({ recursos: [], simuladores: [], contenidos: [] }));
  }, [q]);

  const grupos = [
    { k: 'recursos', titulo: '📦 Recursos', items: data?.recursos || [], a: (i) => `/recursos/${i.id}`, extra: (i) => `${ICONO_TIPO[i.tipo] || ''} ${i.grados || ''}` },
    { k: 'simuladores', titulo: '🎮 Simuladores', items: data?.simuladores || [], a: (i) => `/simuladores/${i.id}`, extra: (i) => { const a = areaPorSlug(areaDeSimulador(i.area)); return `${a.ic} ${i.nivel || ''}`; } },
    { k: 'contenidos', titulo: '📘 Temas y contenidos', items: data?.contenidos || [], a: (i) => `/resultados?q=${encodeURIComponent(i.titulo)}`, extra: (i) => `${i.asignatura} · ${i.grado} · ${i.unidad || ''}` },
  ];

  const total = data ? data.recursos.length + data.simuladores.length + data.contenidos.length : 0;

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="migras">
            <Link to="/">Inicio</Link> <span>/</span> Búsqueda
          </p>
          <h1>Resultados para «{q}»</h1>
          <p>{data ? `${total} resultado${total === 1 ? '' : 's'}` : 'Buscando…'}</p>
        </div>
      </div>

      {!data && (
        <div className="grid"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      )}

      {data && total === 0 && (
        <EmptyState icon="🔍" titulo="Sin resultados" texto={`No encontramos nada para «${q}». Probá con otra palabra o explorá un área.`} accion="Ir a las áreas" onAccion={() => (window.location.href = '/areas')} />
      )}

      {grupos.map((g) =>
        g.items.length ? (
          <section className="reco-seccion" key={g.k}>
            <div className="reco-cab"><h2>{g.titulo}</h2><span className="pill">{g.items.length}</span></div>
            <div className="grid">
              {g.items.map((i) => (
                <Link to={g.a(i)} className="card" key={`${g.k}-${i.id}`}>
                  <div className="card-badge">{g.extra(i) || g.titulo}</div>
                  <h3>{i.titulo || i.nombre || i.contenido}</h3>
                  {i.descripcion && <p>{i.descripcion}</p>}
                </Link>
              ))}
            </div>
          </section>
        ) : null
      )}
    </div>
  );
}