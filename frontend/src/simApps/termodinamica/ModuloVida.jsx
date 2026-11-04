import { useState } from 'react';

function Predice({ predice, yaPredicho, onMarcar }) {
  const [eleccion, setEleccion] = useState(null);
  if (!predice) return null;

  const elegir = (i) => {
    if (eleccion !== null) return;
    setEleccion(i);
    if (i === predice.ok && !yaPredicho) onMarcar?.();
  };

  return (
    <div className="termo-predice">
      <p className="termo-predice-q">🤔 <strong>Antes de experimentar, predecí:</strong> {predice.q}</p>
      <div className="termo-opciones">
        {predice.opciones.map((op, i) => {
          let cls = 'btn';
          if (eleccion !== null) {
            if (i === predice.ok) cls = 'btn predice-correcta';
            else if (i === eleccion) cls = 'btn predice-error';
            else cls = 'btn predice-dimmer';
          }
          return (
            <button key={i} className={cls} onClick={() => elegir(i)} disabled={eleccion !== null}>
              {String.fromCharCode(65 + i)}) {op}
            </button>
          );
        })}
      </div>
      {eleccion !== null && (
        <div className={`termo-retro ${eleccion === predice.ok ? 'ok' : 'error'}`}>
          <strong>{eleccion === predice.ok ? `¡Acertaste! ${yaPredicho ? '' : '+5 pts'}` : 'Tu predicción fue distinta…'}</strong>
          <p>{eleccion === predice.ok ? predice.acierto : predice.fallo}</p>
          <p className="termo-pista">💡 Ahora comprobá si tenías razón en la simulación de abajo.</p>
        </div>
      )}
    </div>
  );
}

export default function ModuloVida({ hook, children, yaPredicho, onMarcar }) {
  if (!hook) return <div>{children}</div>;

  return (
    <div>
      <div className="card termo-vida">
        <h3>🌍 ¿Lo viste en tu vida?</h3>
        <div className="termo-vida-chips">
          {hook.vida?.map((v, i) => <span className="termo-vida-chip" key={i}>{v}</span>)}
        </div>
      </div>

      <div className="card termo-criollo">
        <h3>🗣️ En palabras simples</h3>
        <p>{hook.criollo}</p>
      </div>

      <Predice predice={hook.predice} yaPredicho={yaPredicho} onMarcar={onMarcar} />

      <div className="termo-modulo-inner">{children}</div>

      {hook.ejemplos?.length > 0 && <Ejemplos items={hook.ejemplos} />}
    </div>
  );
}

function Ejemplos({ items }) {
  const [abiertos, setAbiertos] = useState([]);
  const toggle = (i) =>
    setAbiertos((a) => (a.includes(i) ? a.filter((x) => x !== i) : [...a, i]));

  return (
    <div className="card termo-seccion">
      <h3>🧠 Conectá con tu vida</h3>
      <p className="muted" style={{ marginTop: 0 }}>Tocá cada caso para ver la explicación.</p>
      <div className="termo-ejemplos-lista">
        {items.map((ex, i) => (
          <div className={`termo-ejemplo-item ${abiertos.includes(i) ? 'abierto' : ''}`} key={i}>
            <button className="termo-ejemplo-btn" onClick={() => toggle(i)}>
              <span className="termo-ejemplo-emoji">{ex.e}</span>
              <span className="termo-ejemplo-t">{ex.t}</span>
              <span className="termo-ejemplo-chevron">{abiertos.includes(i) ? '▴' : '▾'}</span>
            </button>
            {abiertos.includes(i) && <p className="termo-ejemplo-d">{ex.d}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}