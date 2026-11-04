import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, getUsuario } from '../api.js';

const nombreTipo = {
  documento: 'Documento',
  video: 'Video',
  audio: 'Audio',
  imagen: 'Imagen',
  enlace: 'Enlace',
  libro: 'Libro',
  h5: 'H5P',
  simulacion: 'Simulación',
};

export default function Detalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const usuario = getUsuario();
  const [recurso, setRecurso] = useState(null);
  const [puntaje, setPuntaje] = useState(0);
  const [comentario, setComentario] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [prog, setProg] = useState({ favorito: 0, completado: 0, veces_visto: 0 });

  async function cargar() {
    try {
      const r = await api(`/recursos/${id}`);
      setRecurso(r);
      api('/progreso/vista', { method: 'POST', body: { tipo: 'recurso', id: Number(id) } }).catch(() => {});
      api(`/progreso/estado?tipo=recurso&id=${id}`).then(setProg).catch(() => {});
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function valorar(e) {
    e.preventDefault();
    setError('');
    setMensaje('');
    try {
      await api(`/recursos/${id}/valorar`, {
        method: 'POST',
        body: { puntaje: Number(puntaje), comentario },
      });
      setComentario('');
      setPuntaje(0);
      setMensaje('Valoración guardada.');
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) return <div className="alerta error">{error}</div>;
  if (!recurso) return <div className="alerta info">Cargando…</div>;

  const puedeEditar = recurso.usuario_id === usuario?.id || usuario?.rol === 'coordinacion';

  function descargar() {
    window.open(`/api/recursos/${id}/descargar`);
    setTimeout(cargar, 600);
  }

  async function toggleFav() {
    try {
      setProg(await api('/progreso/favorito', { method: 'POST', body: { tipo: 'recurso', id: Number(id) } }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleCompletar() {
    try {
      setProg(await api('/progreso/completar', { method: 'POST', body: { tipo: 'recurso', id: Number(id) } }));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="detalle">
      <div className="page-head">
        <Link to="/" className="btn btn-ghost">
          ‹ Catálogo
        </Link>
        <div className="detalle-acciones">
          {recurso.tipo === 'libro' && (
            <Link to={`/recursos/${id}/leer`} className="btn btn-primary">
              Leer libro
            </Link>
          )}
          {puedeEditar && (
            <>
              <Link to={`/recursos/${id}/editar`} className="btn">
                Editar
              </Link>
              {recurso.tipo === 'libro' && (
                <Link to={`/recursos/${id}/editar-libro`} className="btn">
                  Editar libro
                </Link>
              )}
              <button
                className="btn btn-danger"
                onClick={async () => {
                  if (confirm('¿Archivar este recurso?')) {
                    await api(`/recursos/${id}`, { method: 'DELETE' });
                    navigate('/');
                  }
                }}
              >
                Archivar
              </button>
            </>
          )}
        </div>
      </div>

      <article className="card">
        <div className="detalle-hero">
          <div>
            <span className="badge-tipo">{nombreTipo[recurso.tipo] || recurso.tipo}</span>
            <h1>{recurso.titulo}</h1>
          </div>
          <div className="detalle-acciones">
            <button className={`btn btn-favorito`} onClick={toggleFav}>
              {prog.favorito ? '★ Guardado' : '☆ Guardar'}
            </button>
            <button className={`btn${prog.completado ? ' btn-ok' : ''}`} onClick={toggleCompletar}>
              {prog.completado ? '✓ Completado' : 'Marcar como completado'}
            </button>
            <button className="btn btn-primary" onClick={descargar}>
              {recurso.url_externa ? 'Abrir enlace' : 'Descargar'}
            </button>
          </div>
        </div>

        {recurso.descripcion && <p className="detalle-desc">{recurso.descripcion}</p>}

        {(prog.veces_visto > 0 || prog.completado) && (
          <p className="muted">
            {prog.completado && 'Completado. '}Visto {prog.veces_visto} {prog.veces_visto === 1 ? 'vez' : 'veces'} por vos.
          </p>
        )}

        <dl className="meta-lista">
          <div>
            <dt>Autor</dt>
            <dd>{recurso.autor || '—'}</dd>
          </div>
          <div>
            <dt>Licencia</dt>
            <dd>{recurso.licencia}</dd>
          </div>
          <div>
            <dt>Formato</dt>
            <dd>{recurso.formato || '—'}</dd>
          </div>
          <div>
            <dt>Subido por</dt>
            <dd>{recurso.usuario_nombre}</dd>
          </div>
          <div>
            <dt>Valoración</dt>
            <dd>
              ⭐ {(Number(recurso.puntaje_promed) || 0).toFixed(1)} ({recurso.total_valoraciones ?? 0})
            </dd>
          </div>
          <div>
            <dt>Descargas</dt>
            <dd>{recurso.contador_descargas}</dd>
          </div>
        </dl>

        {recurso.tipo === 'imagen' && recurso.archivo && (
          <img className="vista-previa" src={`/api/recursos/${id}/archivo`} alt={recurso.titulo} />
        )}
        {recurso.tipo === 'video' && recurso.archivo && (
          <video className="vista-previa" controls src={`/api/recursos/${id}/archivo`} />
        )}

        {(recurso.tipo === 'simulacion' || recurso.tipo === 'h5') && recurso.url_externa && (
          <section className="sim-embed">
            <iframe
              title={recurso.titulo}
              src={recurso.url_externa}
              allow="fullscreen; accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </section>
        )}
        {recurso.tipo === 'h5' && recurso.archivo && !recurso.url_externa && (
          <p className="muted">
            Paquete H5P subido ({recurso.nombre_archivo_original}). Usá «Descargar» para obtenerlo y publicarlo en tu
            plataforma H5P.
          </p>
        )}

        {recurso.contenidos?.length > 0 && (
          <section>
            <h2>Contenidos curriculares vinculados</h2>
            <ul className="chips">
              {recurso.contenidos.map((c) => (
                <li key={c.id}>
                  {c.grado} · {c.asignatura} · {c.unidad} — <strong>{c.contenido}</strong>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>

      <section className="card">
        <h2>Valorar y comentar</h2>
        <form onSubmit={valorar}>
          <div className="estrellas">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} className={`estrella${n <= puntaje ? ' on' : ''}`} onClick={() => setPuntaje(n)}>
                ★
              </button>
            ))}
          </div>
          <textarea
            rows="2"
            placeholder="Comentario (opcional)"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
          />
          <button className="btn btn-primary" disabled={!puntaje}>
            Enviar valoración
          </button>
          {mensaje && <div className="alerta ok">{mensaje}</div>}
        </form>

        {recurso.valoraciones?.length > 0 && (
          <ul className="comentarios">
            {recurso.valoraciones.map((v, i) => (
              <li key={i}>
                <strong>{v.usuario_nombre}</strong> · {'★'.repeat(v.puntaje)}
                {v.comentario && <p>{v.comentario}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}