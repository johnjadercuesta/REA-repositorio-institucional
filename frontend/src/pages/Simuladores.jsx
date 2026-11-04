import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getUsuario } from '../api.js';
import { SIMAPPS } from '../simApps/index.js';

const AREAS = ['fisica', 'quimica', 'biologia', 'matematica', 'otro'];
const nombreArea = {
  fisica: 'Física',
  quimica: 'Química',
  biologia: 'Biología',
  matematica: 'Matemática',
  otro: 'Otro',
};

export default function Simuladores() {
  const usuario = getUsuario();
  const esCoord = usuario?.rol === 'coordinacion';
  const [sims, setSims] = useState([]);
  const [areaFiltro, setAreaFiltro] = useState('todas');
  const [error, setError] = useState('');
  const [muestraForm, setMuestraForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', descripcion: '', area: 'fisica', url: '', nivel: '', aplicacion: '' });
  const usaApp = Boolean(form.aplicacion);

  async function cargar() {
    try {
      const url = esCoord ? '/simuladores?todos=1' : '/simuladores';
      setSims(await api(url));
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibles = areaFiltro === 'todas' ? sims : sims.filter((s) => s.area === areaFiltro);

  async function guardar(e) {
    e.preventDefault();
    setError('');
    const body = { ...form };
    if (usaApp) {
      body.url = null;
    } else {
      body.aplicacion = null;
    }
    try {
      await api('/simuladores', { method: 'POST', body });
      setForm({ nombre: '', descripcion: '', area: 'fisica', url: '', nivel: '', aplicacion: '' });
      setMuestraForm(false);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function togglear(s) {
    try {
      await api(`/simuladores/${s.id}`, { method: 'PUT', body: { activo: s.activo ? 0 : 1 } });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function eliminar(s) {
    if (!confirm(`¿Eliminar "${s.nombre}"?`)) return;
    try {
      await api(`/simuladores/${s.id}`, { method: 'DELETE' });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Simuladores y laboratorios virtuales</h1>
          <p className="muted">Espacios interactivos para experimentar dentro de la materia.</p>
        </div>
        {esCoord && (
          <button className="btn btn-primary" onClick={() => setMuestraForm((v) => !v)}>
            + Agregar simulador
          </button>
        )}
      </div>

      {esCoord && muestraForm && (
        <form className="card form" onSubmit={guardar} style={{ marginBottom: 18 }}>
          <h2>Nuevo simulador del catálogo</h2>
          <label>
            Nombre *
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </label>
          <label>
            Descripción
            <textarea rows="2" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </label>
          <div className="cols">
            <label>
              Área
              <select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}>
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {nombreArea[a]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nivel / grado
              <input value={form.nivel} onChange={(e) => setForm({ ...form, nivel: e.target.value })} />
            </label>
          </div>
          <label>
            Origen *
            <select value={form.aplicacion} onChange={(e) => setForm({ ...form, aplicacion: e.target.value })}>
              <option value="">Enlace externo (URL)</option>
              <option value="" disabled>— Aplicaciones propias —</option>
              {Object.entries(SIMAPPS).map(([slug, app]) => (
                <option key={slug} value={slug}>
                  Propia: {app.etiqueta}
                </option>
              ))}
            </select>
          </label>
          {!usaApp && (
            <label>
              URL * (enlace del simulador)
              <input
                type="url"
                placeholder="https://…"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
            </label>
          )}
          {usaApp && <p className="muted">Esta aplicación es propia del sitio y se ejecutará dentro de la plataforma.</p>}
          {error && <div className="alerta error">{error}</div>}
          <div className="acciones">
            <button className="btn btn-primary" type="submit">
              Guardar
            </button>
            <button className="btn" type="button" onClick={() => setMuestraForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="tabs" style={{ marginBottom: 16 }}>
        {['todas', ...AREAS].map((a) => (
          <button key={a} className={areaFiltro === a ? 'active' : ''} onClick={() => setAreaFiltro(a)}>
            {a === 'todas' ? 'Todas' : nombreArea[a]}
          </button>
        ))}
      </div>

      <div className="grid">
        {visibles.map((s) => (
          <div className="card" key={s.id}>
            <span className="card-badge">{nombreArea[s.area] || s.area}</span>
            {s.aplicacion && SIMAPPS[s.aplicacion] && (
              <span className="pill" style={{ marginLeft: 8 }}>
                App propia
              </span>
            )}
            {!s.activo && (
              <span className="pill falta" style={{ marginLeft: 8 }}>
                Inactivo
              </span>
            )}
            <h3>{s.nombre}</h3>
            {s.descripcion && <p>{s.descripcion}</p>}
            <div className="card-meta">{s.nivel || '—'}</div>
            <div className="acciones" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link to={`/simuladores/${s.id}`} className="btn btn-primary">
                Abrir
              </Link>
              {esCoord && (
                <>
                  <button className="btn" onClick={() => togglear(s)}>
                    {s.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button className="btn btn-danger" onClick={() => eliminar(s)}>
                    Eliminar
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {visibles.length === 0 && <div className="vacio">No hay simuladores en esta área.</div>}
    </div>
  );
}
