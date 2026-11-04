import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, getUsuario } from '../api.js';
import FlipBookPDF from '../components/FlipBookPDF.jsx';

const tipoLabel = {
  texto: 'Texto',
  pdf: 'PDF',
  imagen: 'Imagen',
  h5: 'H5P',
};

function ContenidoCapitulo({ cap }) {
  const archivo = `/api/recursos/${cap.recurso_id}/capitulos/${cap.id}/archivo`;
  if (cap.tipo === 'texto') {
    return <div className="cap-texto" dangerouslySetInnerHTML={{ __html: cap.html || '' }} />;
  }
  if (cap.tipo === 'imagen') {
    return cap.archivo ? <img className="cap-imagen" src={archivo} alt={cap.titulo} /> : null;
  }
  if (cap.tipo === 'pdf') {
    return cap.archivo ? <iframe className="cap-pdf" src={archivo} title={cap.titulo} /> : null;
  }
  if (cap.tipo === 'h5') {
    if (cap.url) return <iframe className="cap-h5" src={cap.url} title={cap.titulo} allowFullScreen />;
    if (cap.archivo) {
      return (
        <div className="cap-file">
          <p>
            Archivo H5P subido: <strong>{cap.archivo_nombre_original}</strong>
          </p>
          <a className="btn btn-primary" href={archivo} target="_blank" rel="noreferrer">
            Abrir / descargar
          </a>
        </div>
      );
    }
  }
  return <p className="muted">Capítulo sin contenido.</p>;
}

export default function LibroLectura() {
  const { id } = useParams();
  const [recurso, setRecurso] = useState(null);
  const [capitulos, setCapitulos] = useState([]);
  const [idx, setIdx] = useState(0);
  const [error, setError] = useState('');
  const usuario = getUsuario();

  useEffect(() => {
    (async () => {
      try {
        const [r, caps] = await Promise.all([api(`/recursos/${id}`), api(`/recursos/${id}/capitulos`)]);
        setRecurso(r);
        setCapitulos(caps);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [id]);

  if (error) return <div className="alerta error">{error}</div>;
  if (!recurso) return <div className="alerta info">Cargando libro…</div>;

  const puedeEditar = recurso.usuario_id === usuario?.id || usuario?.rol === 'coordinacion';
  const esPorCapitulos = capitulos.length > 0;
  const cap = capitulos[idx];

  return (
    <div className="libro-wrap">
      <div className="page-head">
        <div>
          <Link to={`/recursos/${id}`} className="btn btn-ghost">
            ‹ Volver
          </Link>
          <h1>{recurso.titulo}</h1>
        </div>
        {puedeEditar && (
          <Link to={`/recursos/${id}/editar-libro`} className="btn">
            Editar capítulos
          </Link>
        )}
      </div>

      {!esPorCapitulos ? (
        recurso.archivo ? (
          <FlipBookPDF url={`/api/recursos/${id}/archivo`} />
        ) : (
          <div className="alerta error">Este libro no tiene contenido: subí un PDF o agregá capítulos.</div>
        )
      ) : (
        <div className="lector">
          <aside className="lector-indice">
            <h3>Capítulos</h3>
            <ul>
              {capitulos.map((c, i) => (
                <li key={c.id}>
                  <button className={i === idx ? 'active' : ''} onClick={() => setIdx(i)}>
                    {i + 1}. {c.titulo}
                    <span className="tipo">{tipoLabel[c.tipo]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
          <article className="lector-pagina">
            <h2>
              {idx + 1}. {cap?.titulo}
            </h2>
            {cap ? <ContenidoCapitulo cap={cap} /> : <p className="muted">Seleccioná un capítulo.</p>}
            <div className="lector-nav">
              <button className="btn" disabled={idx <= 0} onClick={() => setIdx(idx - 1)}>
                ‹ Anterior
              </button>
              <span>
                {idx + 1} de {capitulos.length}
              </span>
              <button className="btn" disabled={idx >= capitulos.length - 1} onClick={() => setIdx(idx + 1)}>
                Siguiente ›
              </button>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}