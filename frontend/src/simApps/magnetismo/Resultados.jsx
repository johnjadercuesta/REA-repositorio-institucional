import { useState } from 'react';
import { obtenerVisitas, obtenerRetos, reiniciarProgreso } from './almacen.js';
import { PREGUNTAS } from './Retos.jsx';

const SIMULACIONES = [
  { id: 'SimQueAtrae', nombre: '¿Qué atrae un imán?', emoji: '🧲' },
  { id: 'SimPolos', nombre: 'Polos del imán', emoji: '🔴🔵' },
  { id: 'SimAtraccionRepulsion', nombre: 'Atracción y repulsión', emoji: '↔️' },
  { id: 'SimCampo', nombre: 'Campo magnético', emoji: '🌀' },
  { id: 'SimIntensidad', nombre: 'Intensidad y temperatura', emoji: '🔥' },
  { id: 'SimMateriales', nombre: 'Materiales', emoji: '🧱' },
  { id: 'SimFuerzasDistancia', nombre: 'Fuerza y distancia', emoji: '📏' },
  { id: 'SimConstruccion', nombre: 'Construí tu imán', emoji: '🛠️' },
  { id: 'SimPermanente', nombre: 'Magnético o no', emoji: '💡' },
  { id: 'SimElectricidad', nombre: 'Electroimán', emoji: '⚡' },
  { id: 'SimTierra', nombre: 'La Tierra, un imán', emoji: '🌍' },
  { id: 'SimCotidiano', nombre: 'En la vida diaria', emoji: '🏠' },
];

export default function Resultados() {
  const [datos, setDatos] = useState(() => ({ visitas: obtenerVisitas(), retos: obtenerRetos() }));

  const totalVisitas = Object.values(datos.visitas).reduce((a, b) => a + b, 0);
  const visitadas = SIMULACIONES.filter((s) => (datos.visitas[s.id] || 0) > 0).length;

  const retosPreguntas = Object.keys(datos.retos);
  const retosBien = retosPreguntas.filter((t) => {
    const p = PREGUNTAS.find((q) => q.texto === t);
    return p && datos.retos[t] === p.correcta;
  }).length;

  return (
    <div>
      <div className="sim-controles">
        <button className="btn" onClick={() => { reiniciarProgreso(); setDatos({ visitas: {}, retos: {} }); }}>
          Reiniciar progreso
        </button>
      </div>

      <div className="resultados-resumen">
        <div className="resultado-tarjeta">
          <b>{visitadas} / {SIMULACIONES.length}</b>
          <span>simulaciones visitadas</span>
        </div>
        <div className="resultado-tarjeta">
          <b>{totalVisitas}</b>
          <span>visitas totales</span>
        </div>
        <div className="resultado-tarjeta">
          <b>{retosPreguntas.length} / 10</b>
          <span>preguntas respondidas</span>
        </div>
        <div className="resultado-tarjeta">
          <b>{retosBien}</b>
          <span>respuestas correctas</span>
        </div>
      </div>

      <h3 className="resultados-titulo">Exploración por simulación</h3>
      <div className="magneto-grilla resultados">
        {SIMULACIONES.map((s) => {
          const v = datos.visitas[s.id] || 0;
          return (
            <div key={s.id} className={`magneto-objeto ${v > 0 ? 'acierto' : ''}`}>
              <div className="magneto-objeto-emoji">{s.emoji}</div>
              <div className="magneto-objeto-nombre">{s.nombre}</div>
              <div className="magneto-resultado">{v > 0 ? `${v} visita${v !== 1 ? 's' : ''}` : 'Sin visitas'}</div>
            </div>
          );
        })}
      </div>

      <p className="muted">El progreso se guarda automáticamente en este dispositivo.</p>
    </div>
  );
}