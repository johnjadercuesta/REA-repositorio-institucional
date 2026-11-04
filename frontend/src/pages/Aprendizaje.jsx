import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { areaPorSlug } from '../catalog.js';
import { SkeletonCard, EmptyState } from '../components/ui/index.jsx';

export default function Aprendizaje() {
  const [rutas, setRutas] = useState(null);

  useEffect(() => {
    api('/progreso/rutas').then(setRutas).catch(() => setRutas([]));
  }, []);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Rutas de aprendizaje</h1>
          <p>Recorridos guiados por área académica. Completá los checkpoints para avanzar.</p>
        </div>
      </div>

      {!rutas ? (
        <div className="grid"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      ) : rutas.filter((r) => r.total > 0).length ? (
        <div className="ruta-grid">
          {rutas
            .filter((r) => r.total > 0)
            .map((r) => {
              const area = areaPorSlug(r.slug);
              const pct = r.total ? Math.round((r.completados / r.total) * 100) : 0;
              return (
                <Link to={`/ruta/${r.slug}`} className="ruta-tarjeta" style={{ '--ac': area.color }} key={r.slug}>
                  <span className="area-ico" style={{ background: area.color }}>{area.ic}</span>
                  <h3>{area.nombre}</h3>
                  <p>{area.desc}</p>
                  <div className="barra"><div className="barra-fill" style={{ width: `${pct}%`, background: area.color }} /></div>
                  <div className="ruta-pie">
                    <span className="muted">{r.completados} de {r.total} · {pct}%</span>
                    <span className="btn btn-mini" style={{ borderColor: area.color, color: area.color }}>Ver ruta</span>
                  </div>
                </Link>
              );
            })}
        </div>
      ) : (
        <EmptyState icon="🗺️" titulo="No hay rutas todavía" texto="Aún no hay recursos ni simuladores para armar los recorridos." />
      )}
    </div>
  );
}