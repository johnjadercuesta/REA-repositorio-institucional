import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';

const tipoLabel = { texto: 'Texto', pdf: 'PDF', imagen: 'Imagen', h5: 'H5P' };

export default function LibroEditor() {
  const { id } = useParams();
  const [recurso, setRecurso] = useState(null);
  const [capitulos, setCapitulos] = useState([]);
  const [form, setForm] = useState({ titulo: '', tipo: 'texto', url: '', html: '' });
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  async function cargar() {
    try {
      const [r, caps] = await Promise.all([api(`/recursos/${id}`), api(`/recursos/${id}/capitulos`)]);
      setRecurso(r);
      setCapitulos(caps);
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function agregar(e) {
    e.preventDefault();
    setError('');
    setMensaje('');
    try {
      const esArchivo = form.tipo === 'pdf' || form.tipo === 'imagen' || (form.tipo === 'h5' && archivo);
      const body = new FormData();
      body.append('titulo', form.titulo);
      body.append('tipo', form.tipo);
      if (esArchivo) {
        if (!archivo) {
          setError('Este tipo de capítulo requiere un archivo.');
          return;
        }
        body.append('archivo', archivo);
      } else if (form.tipo === 'h5') {
        body.append('url', form.url);
      } else {
        body.append('html', form.html);
      }
      await api(`/recursos/${id}/capitulos`, { method: 'POST', formData: body });
      setForm({ titulo: '', tipo: 'texto', url: '', html: '' });
      setArchivo(null);
      setMensaje('Capítulo agregado.');
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function reordenar(listaNueva) {
    try {
      const res = await api(`/recursos/${id}/capitulos/orden`, {
        method: 'PUT',
        body: { capitulos: listaNueva.map((c) => c.id) },
      });
      setCapitulos(res);
    } catch (err) {
      setError(err.message);
    }
  }

  function mover(idx, delta) {
    const lista = [...capitulos];
    const destino = idx + delta;
    if (destino < 0 || destino >= lista.length) return;
    [lista[idx], lista[destino]] = [lista[destino], lista[idx]];
    reordenar(lista);
  }

  async function eliminar(capId) {
    if (!confirm('¿Eliminar este capítulo?')) return;
    await api(`/recursos/${id}/capitulos/${capId}`, { method: 'DELETE' });
    setMensaje('Capítulo eliminado.');
    cargar();
  }

  if (error && !recurso) return <div className="alerta error">{error}</div>;
  if (!recurso) return <div className="alerta info">Cargando…</div>;

  return (
    <div className="libro-wrap">
      <div className="page-head">
        <div>
          <Link to={`/recursos/${id}/leer`} className="btn btn-ghost">
            ‹ Leer libro
          </Link>
          <h1>Editar «{recurso.titulo}»</h1>
        </div>
      </div>

      {mensaje && <div className="alerta ok">{mensaje}</div>}
      {error && <div className="alerta error">{error}</div>}

      <form className="card form cap-form" onSubmit={agregar}>
        <h2>Agregar capítulo</h2>
        <div className="cols">
          <label>
            Título
            <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
          </label>
          <label>
            Tipo
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              <option value="texto">Texto</option>
              <option value="pdf">PDF</option>
              <option value="imagen">Imagen</option>
              <option value="h5">H5P</option>
            </select>
          </label>
        </div>

        {form.tipo === 'texto' && (
          <label>
            Contenido (HTML o texto)
            <textarea
              rows="4"
              value={form.html}
              placeholder="<h3>Subtítulo</h3><p>Contenido del capítulo…</p>"
              onChange={(e) => setForm({ ...form, html: e.target.value })}
            />
          </label>
        )}

        {['pdf', 'imagen'].includes(form.tipo) && (
          <label>
            Archivo ({form.tipo === 'pdf' ? '.pdf' : 'imagen'})
            <input
              type="file"
              accept={form.tipo === 'pdf' ? '.pdf' : 'image/*'}
              onChange={(e) => setArchivo(e.target.files[0] || null)}
            />
          </label>
        )}

        {form.tipo === 'h5' && (
          <>
            <label>
              URL del H5P (opcional, si está publicado en otra web)
              <input type="url" placeholder="https://…" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </label>
            <label>
              O archivo .h5p
              <input type="file" accept=".h5p" onChange={(e) => setArchivo(e.target.files[0] || null)} />
            </label>
          </>
        )}

        <button className="btn btn-primary">Agregar</button>
      </form>

      <h2 style={{ marginTop: 24 }}>Capítulos ({capitulos.length})</h2>
      {capitulos.length === 0 && <div className="vacio">Todavía no hay capítulos. Agregá el primero.</div>}
      <ul className="cap-lista">
        {capitulos.map((c, i) => (
          <li key={c.id}>
            <span className="cap-num">{i + 1}</span>
            <div className="cap-info">
              <strong>{c.titulo}</strong>
              <small>{tipoLabel[c.tipo]}</small>
            </div>
            <div className="cap-acciones">
              <button className="btn btn-mini" disabled={i === 0} onClick={() => mover(i, -1)}>
                ↑
              </button>
              <button className="btn btn-mini" disabled={i === capitulos.length - 1} onClick={() => mover(i, 1)}>
                ↓
              </button>
              <button className="btn btn-mini btn-danger" onClick={() => eliminar(c.id)}>
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}