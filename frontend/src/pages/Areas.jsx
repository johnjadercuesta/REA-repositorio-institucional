import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { AREAS, contarAreas } from '../catalog.js';
import { SkeletonCard } from '../components/ui/index.jsx';

export default function Areas() {
  const [areas, setAreas] = useState(null);

  useEffect(() => {
    api('/busqueda/areas/resumen')
      .then((d) => setAreas(contarAreas(d)))
      .catch(() => setAreas([]));
  }, []);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Áreas académicas</h1>
          <p>Elegí un área para explorar sus recursos, temas y simuladores.</p>
        </div>
      </div>
      {!areas ? (
        <div className="grid"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      ) : (
        <div className="area-grid">
          {areas.map((a) => (
            <Link
              to={`/area/${a.slug}`}
              className="area-tarjeta"
              style={{ '--ac': a.color }}
              key={a.slug}
            >
              <span className="area-ico" style={{ background: a.color }}>{a.ic}</span>
              <h3>{a.nombre}</h3>
              <p>{a.desc}</p>
              <div className="area-metas">
                <span>📦 {a.recursos} recursos y simuladores</span>
                <span className="btn btn-mini">Explorar</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}