import { useState } from 'react';
import { ACTIVIDADES } from './data.js';
import { Indice, Retro } from './ui.jsx';

export default function Actividades() {
  const [respuestas, setRespuestas] = useState({});
  const [puntos, setPuntos] = useState(0);

  function responder(i, eleccion) {
    if (respuestas[i] !== undefined) return;
    const act = ACTIVIDADES[i];
    const ok = eleccion === act.correcto;
    if (ok) setPuntos((p) => p + 10);
    setRespuestas((r) => ({ ...r, [i]: { ok, eleccion } }));
  }

  const acertadas = Object.values(respuestas).filter((r) => r.ok).length;

  return (
    <div>
      <Indice puntos={puntos} meta="Aplicar los conceptos a situaciones que vivís todos los días." />

      <div className="termo-acciones">
        <span className="pill">Acertadas: {acertadas} / {ACTIVIDADES.length}</span>
      </div>

      <div className="termo-vida-chips" style={{ marginBottom: 12 }}>
        {ACTIVIDADES.slice(0, 5).map((a, i) => (
          <span key={i} className="termo-vida-chip">{a.emoji} {a.titulo}</span>
        ))}
      </div>

      {ACTIVIDADES.map((act, i) => {
        const r = respuestas[i];
        return (
          <div className="card termo-seccion" key={i}>
            <h3>{act.emoji} {i + 1}. {act.titulo} <span className="badge-tipo">Vida real</span></h3>
            <p>{act.texto}</p>
            <p><strong>Pregunta:</strong> {act.pregunta}</p>

            <div className="termo-opciones">
              {act.opciones.map((op, idx) => {
                let cls = 'btn';
                if (r) {
                  if (idx === act.correcto) cls += ' opt-correcta';
                  else if (idx === r.eleccion) cls += ' opt-error';
                  else cls += ' opt-dimmer';
                }
                return (
                  <button key={idx} className={cls} onClick={() => responder(i, idx)}>
                    {String.fromCharCode(65 + idx)}) {op}
                  </button>
                );
              })}
            </div>

            <Retro
              estado={r ? (r.ok ? 'ok' : 'error') : null}
              explicacion={act.explicacion}
              pista="Pensá qué ley o magnitud se está modificando en la situación."
            />
          </div>
        );
      })}
    </div>
  );
}