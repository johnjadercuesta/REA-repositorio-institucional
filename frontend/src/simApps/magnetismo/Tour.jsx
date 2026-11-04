import { useEffect, useRef, useState } from 'react';

/**
 * Recorrido guiado paso a paso. Cada paso: { id, texto, duracion } (duración en ms).
 * La simulación lee `idxRef.current` y `progRef.current` en su bucle de animación
 * para guiar el comportamiento de cada etapa sin closures obsoletas.
 */
export function useTour(pasos, autoPlay = true) {
  const [idx, setIdx] = useState(0);
  const [prog, setProg] = useState(0);
  const [jugando, setJugando] = useState(autoPlay);
  const idxRef = useRef(0);
  const progRef = useRef(0);
  const total = pasos.length;

  useEffect(() => {
    if (!jugando || total === 0) return;
    let raf;
    let ultimo = performance.now();
    const tick = (ahora) => {
      const dt = Math.min(0.1, (ahora - ultimo) / 1000);
      ultimo = ahora;
      const paso = pasos[idxRef.current] || pasos[0];
      const dur = (paso.duracion || 3000) / 1000;
      progRef.current = Math.min(1, progRef.current + dt / dur);
      setProg(progRef.current);
      if (progRef.current >= 1 && idxRef.current < total - 1) {
        idxRef.current += 1;
        progRef.current = 0;
        setIdx(idxRef.current);
        setProg(0);
      } else if (progRef.current >= 1) {
        setJugando(false);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [jugando, total, pasos]);

  const reiniciar = () => {
    idxRef.current = 0;
    progRef.current = 0;
    setIdx(0);
    setProg(0);
    setJugando(true);
  };
  const irA = (i) => {
    idxRef.current = Math.max(0, Math.min(total - 1, i));
    progRef.current = 0;
    setIdx(idxRef.current);
    setProg(0);
  };

  const paso = pasos[idx] || {};
  return {
    idx,
    prog,
    pasoId: paso.id,
    texto: paso.texto || '',
    jugando,
    total,
    idxRef,
    progRef,
    play: () => setJugando(true),
    pausar: () => setJugando(false),
    reiniciar,
    irA,
  };
}

export function PanelAula({ objetivo, tour, onReiniciar, onFullscreen, alto }) {
  return (
    <div className="panel-aula">
      <div className="panel-aula-row">
        <div className="panel-aula-objetivo">🎯 {objetivo}</div>
        <div className="panel-aula-botones">
          {onReiniciar && (
            <button className="btn" onClick={onReiniciar}>
              ↺ Reiniciar
            </button>
          )}
          {onFullscreen && (
            <button className="btn" onClick={onFullscreen}>
              ⛶ {alto ? 'Salir de pantalla completa' : 'Pantalla completa'}
            </button>
          )}
        </div>
      </div>

      {tour && tour.total > 0 && (
        <div className="tour">
          <div className="tour-controls">
            <button className="btn btn-primary" onClick={tour.jugando ? tour.pausar : tour.play}>
              {tour.jugando ? '⏸ Pausa' : '▶ Reproducir'}
            </button>
            <span className="tour-paso">
              {tour.idx + 1} / {tour.total}
            </span>
            <input
              type="range"
              className="tour-slider"
              min={0}
              max={tour.total - 1}
              step={1}
              value={tour.idx}
              onChange={(e) => tour.irA(Number(e.target.value))}
            />
            <button className="btn" onClick={tour.reiniciar} title="Volver a empezar">
              ↺
            </button>
          </div>
          <div className="tour-narra">
            <div className="tour-progreso">
              <div style={{ width: `${tour.prog * 100}%` }} />
            </div>
            <p>{tour.texto}</p>
          </div>
        </div>
      )}
    </div>
  );
}