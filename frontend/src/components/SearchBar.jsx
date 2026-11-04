import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

const ETIQUETAS = { recurso: 'Recursos', simulador: 'Simuladores', contenido: 'Temas y contenidos' };
const ICONO_TIPO = {
  documento: '📄', video: '🎥', audio: '🎧', imagen: '🖼️', enlace: '🔗', libro: '📖', h5: '🧩', simulacion: '🎮',
};

export default function SearchBar() {
  const [texto, setTexto] = useState('');
  const [resultado, setResultado] = useState(null);
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (texto.trim().length < 2) {
      setResultado(null);
      setAbierto(false);
      return;
    }
    setCargando(true);
    const timer = setTimeout(async () => {
      try {
        const data = await api(`/busqueda?q=${encodeURIComponent(texto)}`);
        setResultado(data);
        setAbierto(true);
      } catch {
        setResultado(null);
      } finally {
        setCargando(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [texto]);

  useEffect(() => {
    function fuera(e) {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    }
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, []);

  function irClase(clase, id) {
    setAbierto(false);
    setTexto('');
    if (clase === 'recurso') navigate(`/recursos/${id}`);
    else if (clase === 'simulador') navigate(`/simuladores/${id}`);
    else navigate(`/resultados?q=${encodeURIComponent(texto)}`);
  }

  const grupos = resultado
    ? [['recurso', ETIQUETAS.recurso], ['simulador', ETIQUETAS.simulador], ['contenido', ETIQUETAS.contenido]].map(
        ([k, label]) => ({ k, label, items: resultado[k] || [] })
      ).filter((g) => g.items.length > 0)
    : [];

  const total = resultado ? resultado.recursos.length + resultado.simuladores.length + resultado.contenidos.length : 0;

  return (
    <div className="busqueda-global" ref={ref}>
      <div className="busqueda-global-input">
        <span>🔍</span>
        <input
          placeholder="Buscar recursos, simuladores, temas…"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onFocus={() => resultado && setAbierto(true)}
          aria-label="Buscar en la plataforma"
        />
        {cargando && <span className="busqueda-spinner" />}
      </div>
      {abierto && (
        <div className="busqueda-drop">
          {!total && !cargando && <p className="muted" style={{ padding: 12 }}>Sin resultados para «{texto}».</p>}
          {grupos.map((g) => (
            <div key={g.k} className="busqueda-grupo">
              <p className="busqueda-grupo-titulo">{g.label}</p>
              {g.items.map((it) => (
                <button key={`${g.k}-${it.id}`} className="busqueda-item" onClick={() => irClase(g.k, it.id)}>
                  <span>{g.k === 'recurso' ? ICONO_TIPO[it.tipo] || '📄' : g.k === 'simulador' ? '🎮' : '📘'}</span>
                  <span className="busqueda-item-txt">
                    <strong>{it.titulo || it.nombre || it.contenido}</strong>
                    <small>{it.descripcion || it.grados || it.asignatura || ''}</small>
                  </span>
                </button>
              ))}
            </div>
          ))}
          {total > 0 && (
            <button className="busqueda-ver-todas" onClick={() => { setAbierto(false); navigate(`/resultados?q=${encodeURIComponent(texto)}`); setTexto(''); }}>
              Ver todos los resultados →
            </button>
          )}
        </div>
      )}
    </div>
  );
}