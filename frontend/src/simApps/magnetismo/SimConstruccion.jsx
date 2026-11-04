import { useEffect, useMemo, useRef, useState } from 'react';
import { useTour, PanelAula } from './Tour.jsx';

const PASOS = [
  { id: 'intro', texto: 'Construí un imán: una barra de hierro comienza sin magnetismo, pero vos la vas a magnetizar.', duracion: 4000 },
  { id: 'tocar', texto: 'Una forma de magnetizarla es frotarla con un imán. Cuando la barra queda magnetizada, muestra sus polos N y S.', duracion: 5000 },
  { id: 'atrae', texto: 'La barra magnetizada atrae a los clips de hierro cercanos: ¡ya es un imán!', duracion: 4500 },
  { id: 'perder', texto: 'Si golpeás la barra o la calentás demasiado, puede perder su magnetismo.', duracion: 4800 },
  { id: 'cierre', texto: 'La barra de hierro se vuelve un imán artificial mientras dura la magnetización.', duracion: 4200 },
];

let nid = 100;

const PALETA = [
  { tipo: 'barra', emoji: '🧲', nombre: 'Barra de hierro' },
  { tipo: 'clip', emoji: '📎', nombre: 'Clip' },
  { tipo: 'brujula', emoji: '🧭', nombre: 'Brújula' },
  { tipo: 'llave', emoji: '🔑', nombre: 'Llave' },
];

export default function SimConstruccion() {
  const tour = useTour(PASOS);
  const tourRef = useRef(tour);
  tourRef.current = tour;

  const [items, setItems] = useState([
    { id: 0, tipo: 'barra', x: 150, y: 120, mag: true },
    { id: 1, tipo: 'clip', x: 420, y: 180, mag: false },
  ]);

  useEffect(() => {
    if (!tour.jugando) return;
    if (tour.pasoId === 'tocar') {
      setItems((l) => l.map((i) => (i.tipo === 'barra' ? { ...i, mag: true } : i)));
    } else if (tour.pasoId === 'atrae') {
      setItems((l) => [
        ...l.map((i) => (i.tipo === 'barra' ? { ...i, mag: true } : i)),
        { id: nid++, tipo: 'clip', x: 200, y: 210, mag: false, pegado: true },
      ]);
    } else if (tour.pasoId === 'perder') {
      setItems((l) => l.map((i) => (i.tipo === 'barra' ? { ...i, mag: false } : i)));
    }
  }, [tour.pasoId, tour.jugando]);

  const estado = useMemo(() => {
    const bars = items.filter((i) => i.tipo === 'barra' && i.mag);
    return items.map((i) => {
      if (i.tipo !== 'clip' || bars.length === 0) return i;
      const b = bars.reduce((best, bb) =>
        Math.hypot(bb.x - i.x, bb.y - i.y) < Math.hypot(best.x - i.x, best.y - i.y) ? bb : best, bars[0]);
      const ang = Math.atan2(i.y - b.y, i.x - b.x);
      const dx = Math.cos(ang) * 55;
      const dy = Math.sin(ang) * 55;
      return { ...i, x: b.x + dx, y: b.y + dy, pegado: true };
    });
  }, [items]);

  function agregar(tipo) {
    setItems((l) => [...l, {
      id: nid++, tipo,
      x: 60 + Math.random() * 480,
      y: 40 + Math.random() * 200,
      mag: false,
    }]);
  }

  function onClicItem(id) {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    if (it.tipo === 'barra') {
      setItems((l) => l.map((i) => (i.id === id ? { ...i, mag: !i.mag } : i)));
    } else if (it.tipo === 'clip') {
      if (items.some((i) => i.tipo === 'barra' && i.mag)) {
        setItems((l) => l.map((i) => (i.id === id ? { ...i, pegado: true } : i)));
      }
    } else if (it.tipo === 'brujula') {
      setItems((l) => l.map((i) => (i.id === id ? { ...i, rot: ((i.rot || 0) + 60) % 360 } : i)));
    }
  }

  function cambiarBarra() {
    const barra = items.find((i) => i.tipo === 'barra');
    if (barra) onClicItem(barra.id);
    else agregar('barra');
  }

  function reiniciar() {
    setItems([
      { id: 0, tipo: 'barra', x: 150, y: 120, mag: true },
      { id: 1, tipo: 'clip', x: 420, y: 180, mag: false },
    ]);
    tour.reiniciar();
  }

  return (
    <div>
      <PanelAula
        objetivo="Magnetizá una barra de hierro y mirá cómo atrae a los objetos."
        tour={tour}
        onReiniciar={reiniciar}
      />

      <div className="sim-controles">
        <span className="muted">Tocá un elemento para interactuar: </span>
        <button className="btn btn-primary" onClick={cambiarBarra}>
          🧲 Cambiar barra (magnética/no)
        </button>
        <span className="muted">Agregar objetos:</span>
        {PALETA.map((p) => (
          <button key={p.tipo} className="btn" onClick={() => agregar(p.tipo)} title={p.nombre}>
            {p.emoji}
          </button>
        ))}
      </div>

      <div className="magneto-escritorio">
        {estado.map((i) => (
          <div
            key={i.id}
            className={`magneto-escritorio-item ${i.mag ? 'mag' : ''} ${i.pegado ? 'pegado' : ''}`}
            style={{
              left: i.x,
              top: i.y,
              transform: i.tipo === 'brujula' ? `rotate(${i.rot || 0}deg)` : undefined,
              transition: 'left .3s, top .3s',
            }}
            onClick={() => onClicItem(i.id)}
          >
            <span className="magneto-escritorio-emoji">{PALETA.find((p) => p.tipo === i.tipo).emoji}</span>
            {i.tipo === 'barra' && i.mag && (
              <span className="magneto-polos-mini">
                <i>N</i><i>S</i>
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="sim-resultados">
        <span>
          {items.some((i) => i.tipo === 'barra' && i.mag)
            ? 'La barra está magnetizada: atrae a los clips cercanos.'
            : 'Ninguna barra magnetizada. Magnetizala tocándola.'}
        </span>
        <span>
          Clips pegados: <strong>{estado.filter((i) => i.pegado).length}</strong>
        </span>
      </div>

      <div className="termo-retro ok">
        <strong>Conclusión</strong>
        <p>
          Las barras de hierro o acero pueden convertirse en <b>imanes artificiales</b> al frotarlas con un imán. Ese
          magnetismo puede perderse si el material se golpea o se calienta demasiado.
        </p>
      </div>
    </div>
  );
}