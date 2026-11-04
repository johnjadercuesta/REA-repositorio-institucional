import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, tiposRecurso, getUsuario } from '../api.js';

const ordenes = [
  ['recientes', 'Más recientes'],
  ['titulo', 'Título'],
  ['valoracion', 'Mejor valorados'],
  ['descargas', 'Más descargados'],
];

export default function Catalogo() {
  const [filtros, setFiltros] = useState({ q: '', tipo: '', grado: '', asignatura: '', orden: 'recientes' });
  const [opciones, setOpciones] = useState({ grados: [], asignaturas: [], unidades: [] });
  const [resultado, setResultado] = useState({ data: [], total: 0, page: 1, pageSize: 12 });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const usuario = getUsuario();

  useEffect(() => {
    api('/curriculo/filtros').then(setOpciones).catch(() => setOpciones({ grados: [], asignaturas: [], unidades: [] }));
  }, []);

  async function cargar(pagina = 1) {
    setCargando(true);
    setError('');
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(filtros)) if (v) qs.set(k, v);
    qs.set('page', String(pagina));
    qs.set('pageSize', '12');
    try {
      const data = await api(`/recursos?${qs}`);
      setResultado(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  const totalPaginas = Math.max(1, Math.ceil(resultado.total / resultado.pageSize));

  function etiquetaTipo(t) {
    return tiposRecurso.find((x) => x === t) || t;
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Catálogo de recursos</h1>
          <p>
            {resultado.total} resultado{resultado.total === 1 ? '' : 's'}
          </p>
        </div>
        <Link to="/nuevo" className="btn btn-primary">
          + Nuevo recurso
        </Link>
      </div>

      <form
        className="filtros"
        onSubmit={(e) => {
          e.preventDefault();
          cargar(1);
        }}
      >
        <input
          className="buscar"
          placeholder="Buscar por título, descripción o autor…"
          value={filtros.q}
          onChange={(e) => setFiltros({ ...filtros, q: e.target.value })}
        />
        <select value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}>
          <option value="">Tipo</option>
          {tiposRecurso.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select value={filtros.grado} onChange={(e) => setFiltros({ ...filtros, grado: e.target.value })}>
          <option value="">Grado</option>
          {opciones.grados.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select value={filtros.unidad} onChange={(e) => setFiltros({ ...filtros, unidad: e.target.value })}>
          <option value="">Unidad</option>
          {opciones.unidades.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <select value={filtros.orden} onChange={(e) => setFiltros({ ...filtros, orden: e.target.value })}>
          {ordenes.map(([v, n]) => (
            <option key={v} value={v}>
              {n}
            </option>
          ))}
        </select>
      </form>

      {usuario?.rol === 'coordinacion' && (
        <div className="avisos">
          <Link to="/reportes">Ver seguimiento curricular del área →</Link>
        </div>
      )}

      {error && <div className="alerta error">{error}</div>}
      {cargando && <div className="alerta info">Cargando…</div>}

      <div className="grid">
        {resultado.data.map((r) => (
          <Link to={`/recursos/${r.id}`} className="card" key={r.id}>
            <div className="card-badge">{etiquetaTipo(r.tipo)}</div>
            <h3>{r.titulo}</h3>
            {r.descripcion && <p>{r.descripcion}</p>}
            <div className="card-meta">
              <span>
                ⭐ {(Number(r.puntaje_promed) || 0).toFixed(1)} ({r.total_valoraciones ?? 0})
              </span>
              <span>⬇ {r.contador_descargas}</span>
            </div>
            <div className="card-grado">{r.grados || ''}</div>
          </Link>
        ))}
      </div>

      {resultado.data.length === 0 && !cargando && <div className="vacio">No se encontraron recursos.</div>}

      <div className="paginacion">
        <button className="btn" disabled={resultado.page <= 1} onClick={() => cargar(resultado.page - 1)}>
          ‹ Anterior
        </button>
        <span>
          Página {resultado.page} de {totalPaginas}
        </span>
        <button
          className="btn"
          disabled={resultado.page >= totalPaginas}
          onClick={() => cargar(resultado.page + 1)}
        >
          Siguiente ›
        </button>
      </div>
    </div>
  );
}