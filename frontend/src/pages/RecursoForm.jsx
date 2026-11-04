import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api, tiposRecurso, licencias } from '../api.js';

export default function RecursoForm() {
  const { id } = useParams();
  const esEdicion = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    autor: '',
    tipo: 'documento',
    licencia: 'CC BY',
    url_externa: '',
    estado: 'publicado',
  });
  const [curriculo, setCurriculo] = useState([]);
  const [simuladores, setSimuladores] = useState([]);
  const [contenidoIds, setContenidoIds] = useState([]);
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    api('/curriculo').then(setCurriculo).catch(() => setCurriculo([]));
    api('/simuladores').then(setSimuladores).catch(() => setSimuladores([]));
    if (id) {
      api(`/recursos/${id}`)
        .then((r) => {
          setForm({
            titulo: r.titulo,
            descripcion: r.descripcion || '',
            autor: r.autor || '',
            tipo: r.tipo,
            licencia: r.licencia,
            url_externa: r.url_externa || '',
            estado: r.estado,
          });
          setContenidoIds((r.contenidos || []).map((c) => c.id));
        })
        .catch((e) => setError(e.message));
    }
  }, [id]);

  const grupos = {};
  for (const c of curriculo) {
    const clave = `${c.grado} · ${c.asignatura} · ${c.unidad}`;
    (grupos[clave] = grupos[clave] || []).push(c);
  }

  function toggle(idc) {
    setContenidoIds((prev) => (prev.includes(idc) ? prev.filter((x) => x !== idc) : [...prev, idc]));
  }

  async function enviar(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    if (
      (form.tipo === 'enlace' || form.tipo === 'h5' || form.tipo === 'simulacion') &&
      !esEdicion &&
      !archivo &&
      !form.url_externa
    ) {
      setError('Este tipo de recurso requiere un enlace o un archivo.');
      setCargando(false);
      return;
    }
    try {
      const esSubida = Boolean(archivo);
      const body = new FormData();
      body.append('titulo', form.titulo);
      body.append('descripcion', form.descripcion);
      body.append('autor', form.autor);
      body.append('tipo', form.tipo);
      body.append('licencia', form.licencia);
      body.append('estado', form.estado);
      if (!esSubida && form.url_externa) body.append('url_externa', form.url_externa);
      if (archivo) body.append('archivo', archivo);
      contenidoIds.forEach((cid) => body.append('contenido_ids', String(cid)));

      const ruta = esEdicion ? `/recursos/${id}` : '/recursos';
      await api(ruta, { method: esEdicion ? 'PUT' : 'POST', formData: body });
      navigate(esEdicion ? `/recursos/${id}` : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="form-wrap">
      <div className="page-head">
        <h1>{esEdicion ? 'Editar recurso' : 'Nuevo recurso'}</h1>
        <Link to="/" className="btn btn-ghost">
          ‹ Volver
        </Link>
      </div>

      <form className="card form" onSubmit={enviar}>
        <section className="form-seccion">
          <h2>Datos generales</h2>
          <label>
            Título *
            <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
          </label>
          <label>
            Descripción
            <textarea
              rows="3"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </label>
          <label>
            Autor / Fuente
            <input value={form.autor} onChange={(e) => setForm({ ...form, autor: e.target.value })} />
          </label>
          <div className="cols">
            <label>
              Tipo
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                {tiposRecurso.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Licencia
              <select value={form.licencia} onChange={(e) => setForm({ ...form, licencia: e.target.value })}>
                {licencias.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Estado
              <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                <option value="publicado">Publicado</option>
                <option value="borrador">Borrador</option>
                <option value="archivado">Archivado</option>
              </select>
            </label>
          </div>
        </section>

        <section className="form-sec">
          <h3>Contenido</h3>
          {form.tipo === 'libro' && (
            <p className="muted nota">
              <strong>Libro:</strong> subí un PDF para verlo como flipbook animado, o dejá el archivo vacío y agregá
              capítulos desde «Editar libro» tras guardar.
            </p>
          )}
          {form.tipo === 'simulacion' && (
            <>
              <label className="opcion">
                Tomar del catálogo de simuladores
                <select
                  value=""
                  onChange={(e) => {
                    const elegido = simuladores.find((s) => s.id === Number(e.target.value));
                    if (elegido) {
                      setForm({ ...form, url_externa: elegido.url });
                      setArchivo(null);
                    }
                  }}
                >
                  <option value="">— Elegí uno o pegá tu propia URL —</option>
                  {simuladores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <p className="muted nota">Al elegir una opción se completa el enlace de abajo automáticamente.</p>
            </>
          )}
          {form.tipo === 'h5' && (
            <p className="muted nota">
              <strong>H5P:</strong> pegá un enlace al contenido interactivo (se muestra embebido) o subí un paquete .h5p
              como archivo.
            </p>
          )}
          <label className="opcion">
            Subir archivo
            <input type="file" onChange={(e) => setArchivo(e.target.files[0] || null)} />
          </label>
          <label className="opcion">
            O enlace externo (si no subís archivo)
            <input
              type="url"
              placeholder="https://…"
              value={form.url_externa}
              onChange={(e) => setForm({ ...form, url_externa: e.target.value })}
            />
          </label>
        </section>

        <section className="form-sec">
          <h3>Vincular al currículo</h3>
          {Object.entries(grupos).map(([clave, items]) => (
            <fieldset key={clave}>
              <legend>{clave}</legend>
              {items.map((it) => (
                <label key={it.id} className="check">
                  <input type="checkbox" checked={contenidoIds.includes(it.id)} onChange={() => toggle(it.id)} />
                  {it.contenido}
                </label>
              ))}
            </fieldset>
          ))}
          {curriculo.length === 0 && <p className="muted">No hay currículo cargado.</p>}
        </section>

        {error && <div className="alerta error">{error}</div>}

        <div className="acciones">
          <button className="btn btn-primary" disabled={cargando}>
            {cargando ? 'Guardando…' : 'Guardar recurso'}
          </button>
        </div>
      </form>
    </div>
  );
}