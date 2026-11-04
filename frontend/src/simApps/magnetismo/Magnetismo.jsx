import { useEffect, useRef, useState } from 'react';
import SimQueAtrae from './SimQueAtrae.jsx';
import SimPolos from './SimPolos.jsx';
import SimAtraccionRepulsion from './SimAtraccionRepulsion.jsx';
import SimCampo from './SimCampo.jsx';
import SimIntensidad from './SimIntensidad.jsx';
import SimMateriales from './SimMateriales.jsx';
import SimFuerzasDistancia from './SimFuerzasDistancia.jsx';
import SimConstruccion from './SimConstruccion.jsx';
import SimPermanente from './SimPermanente.jsx';
import SimElectricidad from './SimElectricidad.jsx';
import SimTierra from './SimTierra.jsx';
import SimCotidiano from './SimCotidiano.jsx';
import Retos from './Retos.jsx';
import Conceptos from './Conceptos.jsx';
import Guia from './Guia.jsx';
import Resultados from './Resultados.jsx';
import Ayuda from './Ayuda.jsx';
import { registrarVisita } from './almacen.js';
import { usePantallaCompleta } from './ui.jsx';

const SIMS = [
  { id: 'SimQueAtrae', nombre: '¿Qué atrae un imán?', comp: SimQueAtrae, emoji: '🧲' },
  { id: 'SimPolos', nombre: 'Polos del imán', comp: SimPolos, emoji: '🔀' },
  { id: 'SimAtraccionRepulsion', nombre: 'Atracción y repulsión', comp: SimAtraccionRepulsion, emoji: '↔️' },
  { id: 'SimCampo', nombre: 'Campo magnético', comp: SimCampo, emoji: '🌀' },
  { id: 'SimIntensidad', nombre: 'Intensidad y temperatura', comp: SimIntensidad, emoji: '🔥' },
  { id: 'SimMateriales', nombre: 'Materiales', comp: SimMateriales, emoji: '🧱' },
  { id: 'SimFuerzasDistancia', nombre: 'Fuerza y distancia', comp: SimFuerzasDistancia, emoji: '📏' },
  { id: 'SimConstruccion', nombre: 'Construí tu imán', comp: SimConstruccion, emoji: '🛠️' },
  { id: 'SimPermanente', nombre: 'Magnético o no', comp: SimPermanente, emoji: '💡' },
  { id: 'SimElectricidad', nombre: 'Electroimán', comp: SimElectricidad, emoji: '⚡' },
  { id: 'SimTierra', nombre: 'La Tierra, un imán', comp: SimTierra, emoji: '🌍' },
  { id: 'SimCotidiano', nombre: 'En la vida diaria', comp: SimCotidiano, emoji: '🏠' },
];

const OTRAS = [
  { id: 'retos', nombre: 'Retos', comp: Retos, emoji: '🏆' },
  { id: 'conceptos', nombre: 'Conceptos', comp: Conceptos, emoji: '📚' },
  { id: 'guia', nombre: 'Guía del aula', comp: Guia, emoji: '👩‍🏫' },
  { id: 'resultados', nombre: 'Resultados', comp: Resultados, emoji: '📊' },
  { id: 'ayuda', nombre: 'Ayuda', comp: Ayuda, emoji: '💬' },
];

export default function Magnetismo() {
  const [activa, setActiva] = useState('SimQueAtrae');
  const [pantallaCompleta, togglePantalla] = usePantallaCompleta();
  const appRef = useRef(null);

  useEffect(() => {
    if (SIMS.some((s) => s.id === activa)) registrarVisita(activa);
  }, [activa]);

  const simActiva = [...SIMS, ...OTRAS].find((s) => s.id === activa);
  const Comp = simActiva?.comp;

  return (
    <div className="sim-app" ref={appRef}>
      <div className="sim-app-cabecera">
        <h2>🧲 Laboratorio de Magnetismo</h2>
        <p className="muted">Experimentá, jugá y aprendé cómo funcionan los imanes.</p>
        <button
          className="btn"
          onClick={() => togglePantalla(appRef.current)}
          title="Proyectar la actividad en pantalla completa"
        >
          {pantallaCompleta ? '⛶ Salir de pantalla completa' : '⛶ Proyectar en pantalla completa'}
        </button>
      </div>

      <div className="sim-tabs">
        <button className={`sim-tab ${SIMS.some((s) => s.id === activa) ? 'activo' : ''}`}>Simulaciones</button>
        {OTRAS.map((o) => (
          <button
            key={o.id}
            className={`sim-tab ${activa === o.id ? 'activo' : ''}`}
            onClick={() => setActiva(o.id)}
          >
            {o.emoji} {o.nombre}
          </button>
        ))}
      </div>

      {SIMS.some((s) => s.id === activa) && (
        <div className="sim-subs">
          {SIMS.map((s) => (
            <button
              key={s.id}
              className={`sim-sub ${activa === s.id ? 'activo' : ''}`}
              onClick={() => setActiva(s.id)}
              title={s.nombre}
            >
              {s.emoji}
            </button>
          ))}
        </div>
      )}

      <div className="sim-app-cuerpo">
        <h3 className="sim-titulo">{simActiva?.emoji} {simActiva?.nombre}</h3>
        {Comp && <Comp onAbrir={setActiva} />}
      </div>
    </div>
  );
}