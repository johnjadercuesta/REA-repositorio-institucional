import { useState } from 'react';
import { PREGUNTAS } from './data.js';
import { Indice } from './ui.jsx';

export default function Evaluacion() {
  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] = useState([]);
  const [finalizado, setFinalizado] = useState(false);

  const preguntas = [...PREGUNTAS];

  function responder(ok) {
    const r = [...respuestas];
    r[paso] = ok;
    setRespuestas(r);
    if (ok && paso < preguntas.length - 1) setPaso((p) => p + 1);
    else if (ok) setFinalizado(true);
  }

  function saltar() {
    if (paso < preguntas.length - 1) setPaso((p) => p + 1);
    else setFinalizado(true);
  }

  const respondidas = respuestas.filter(Boolean).length;

  if (finalizado) {
    const correctas = respuestas.filter(Boolean).length;
    const pct = (correctas / preguntas.length) * 100;
    const porSeccion = {};
    for (const [i, q] of preguntas.entries()) {
      porSeccion[q.seccion] = porSeccion[q.seccion] || { ok: 0, total: 0 };
      porSeccion[q.seccion].total++;
      if (respuestas[i]) porSeccion[q.seccion].ok++;
    }
    const dominados = Object.entries(porSeccion).filter(([, v]) => v.ok / v.total >= 0.8).map(([k]) => k);
    const reforzar = Object.entries(porSeccion).filter(([, v]) => v.ok / v.total < 0.8).map(([k]) => k);

    return (
      <div>
        <Indice meta="Ver tu resultado final y qué temas dominás." />
        <div className="card termo-seccion termo-resultado">
          <h2>📊 Resultado de la evaluación</h2>
          <div className="termo-resultado-num">
            <strong>{correctas}/{preguntas.length}</strong>
            <span>{pct.toFixed(0)} %</span>
          </div>
          <div className="termo-resultado-bar">
            <div style={{ width: `${pct}%` }} />
          </div>
          <h3>✅ Temas dominados</h3>
          {dominados.length ? dominados.map((d) => <span key={d} className="pill ok" style={{ margin: 4 }}>{d}</span>) : <p className="muted">Por ahora ninguno: revisá los módulos.</p>}
          <h3>📚 Temas a reforzar</h3>
          {reforzar.length ? reforzar.map((d) => <span key={d} className="pill falta" style={{ margin: 4 }}>{d}</span>) : <p className="muted">¡Excelente! Dominás todos los temas.</p>}
          <div className="termo-acciones">
            <button className="btn btn-primary" onClick={() => { setPaso(0); setRespuestas([]); setFinalizado(false); }}>Reintentar evaluación</button>
            <button className="btn" onClick={() => window.print()}>Imprimir resultado</button>
          </div>
        </div>
      </div>
    );
  }

  const q = preguntas[paso];

  return (
    <div>
      <Indice meta="Preguntas con conceptos, cálculos, gráficas y situaciones problema." />
      <div className="termo-progress">
        <div style={{ width: `${(paso / preguntas.length) * 100}%` }} />
      </div>
      <p className="muted">Pregunta {paso + 1} de {preguntas.length} · Respondidas correctas: {respuestas.filter(Boolean).length}</p>
      <div className="card termo-seccion">
        <span className="badge-tipo">{q.seccion}</span>
        <p className="termo-enunciado">{q.texto}</p>
        {q.tipo === 'mc' && (
          <div className="termo-opciones">
            {q.opciones.map((op, i) => (
              <button key={i} className="btn" onClick={() => responder(i === q.correcto)}>
                {String.fromCharCode(65 + i)}) {op}
              </button>
            ))}
          </div>
        )}
        {q.tipo === 'vf' && (
          <div className="termo-opciones">
            <button className="btn" onClick={() => responder(q.correcto === true)}>Verdadero</button>
            <button className="btn" onClick={() => responder(q.correcto === false)}>Falso</button>
          </div>
        )}
        {q.tipo === 'num' && (
          <NumPreg q={q} onOk={() => responder(true)} onFail={() => responder(false)} />
        )}
        <button className="btn" style={{ marginTop: 10 }} onClick={() => { setRespuestas((r) => { const rr = [...r]; rr[paso] = false; return rr; }); saltar(); }}>Saltar (contar como incorrecta)</button>
      </div>
      <p className="muted">
        {q.explicacion}
      </p>
      <p className="muted">Respondí las {preguntas.length} preguntas. Podés saltar y volver al final.</p>
    </div>
  );
}

function NumPreg({ q, onOk, onFail }) {
  const [v, setV] = useState('');
  return (
    <div className="termo-num">
      <input placeholder="Respuesta numérica…" value={v} onChange={(e) => setV(e.target.value)} />
      {q.unidad && <span className="pill">{q.unidad}</span>}
      <button className="btn btn-primary" onClick={() => (Math.abs(Number(v.replace(',', '.')) - q.correcto) < 1e-6 ? onOk() : onFail())}>Responder</button>
    </div>
  );
}