import { useEffect, useRef, useState } from 'react';

export function Grafico({ series, xLabel, yLabel, alto = 200, marker }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const marg = { izq: 46, der: 18, top: 18, bot: 30 };
    const todos = series.flatMap((s) => s.puntos);
    if (!todos.length) return;
    let xMin = Math.min(...todos.map((p) => p.x));
    let xMax = Math.max(...todos.map((p) => p.x));
    let yMin = Math.min(...todos.map((p) => p.y));
    let yMax = Math.max(...todos.map((p) => p.y));
    if (xMax === xMin) xMax = xMin + 1;
    if (yMax === yMin) yMax = yMin + 1;
    const padx = (xMax - xMin) * 0.08;
    const pady = (yMax - yMin) * 0.12;
    xMin -= padx;
    xMax += padx;
    yMin -= pady;
    yMax += pady;

    const X = (x) => marg.izq + ((x - xMin) / (xMax - xMin)) * (w - marg.izq - marg.der);
    const Y = (y) => h - marg.bot - ((y - yMin) / (yMax - yMin)) * (h - marg.top - marg.bot);

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // grilla
    ctx.strokeStyle = '#eef2f7';
    ctx.lineWidth = 1;
    const nx = 5;
    for (let i = 0; i <= nx; i++) {
      const v = xMin + ((xMax - xMin) * i) / nx;
      const sx = X(v);
      ctx.beginPath();
      ctx.moveTo(sx, marg.top);
      ctx.lineTo(sx, h - marg.bot);
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(v.toLocaleString('es-AR'), sx, h - marg.bot + 14);
    }
    const ny = 5;
    ctx.textAlign = 'right';
    for (let i = 0; i <= ny; i++) {
      const v = yMin + ((yMax - yMin) * i) / ny;
      const sy = Y(v);
      ctx.beginPath();
      ctx.moveTo(marg.izq, sy);
      ctx.lineTo(w - marg.der, sy);
      ctx.stroke();
      ctx.fillText(v.toLocaleString('es-AR'), marg.izq - 5, sy + 3);
    }

    // ejes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(marg.izq, h - marg.bot);
    ctx.lineTo(w - marg.der, h - marg.bot);
    ctx.moveTo(marg.izq, h - marg.bot);
    ctx.lineTo(marg.izq, marg.top);
    ctx.stroke();

    // etiquetas de ejes
    ctx.fillStyle = '#475569';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(yLabel, marg.izq - 4, 12);
    ctx.textAlign = 'left';
    ctx.fillText(xLabel, w - marg.der - 60, h - marg.bot + 14);
    ctx.textAlign = 'left';

    // series
    const colores = ['#2563eb', '#dc2626', '#16a34a', '#9333ea'];
    series.forEach((s, idx) => {
      if (s.puntos.length < 2) return;
      ctx.strokeStyle = s.color || colores[idx % colores.length];
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      s.puntos.forEach((p, i) => {
        const sx = X(p.x);
        const sy = Y(p.y);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.stroke();
    });

    // legend
    let lx = marg.izq + 6;
    ctx.textAlign = 'left';
    series.forEach((s, idx) => {
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = s.color || colores[idx % colores.length];
      ctx.fillRect(lx, 8, 12, 4);
      const wtext = ctx.measureText(s.nombre).width;
      ctx.fillText(s.nombre, lx + 16, 13);
      lx += 16 + wtext + 14;
    });

    if (marker) {
      const sx = X(marker.x);
      const sy = Y(marker.y);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [series, xLabel, yLabel]);

  return (
    <div className="termo-grafico" style={{ height: alto }}>
      <canvas ref={ref} />
    </div>
  );
}

export function PanelVariables({ control, dependiente, constantes }) {
  const items = [
    { titulo: 'Variable controlada', lista: control, color: '#2563eb' },
    { titulo: 'Variable dependiente', lista: dependiente, color: '#dc2626' },
    { titulo: 'Constantes', lista: constantes, color: '#16a34a' },
  ];
  return (
    <div className="termo-variables">
      {items.map((it) => (
        <div key={it.titulo} className="termo-var">
          <h4 style={{ color: it.color }}>{it.titulo}</h4>
          <ul>
            {it.lista.map((li, i) => (
              <li key={i}>{li}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function ModoSelector({ modo, setModo, desafio }) {
  return (
    <div className="termo-modos">
      {[
        { k: 'guiado', label: '🎯 Guiado', desc: 'Pasos guiados para la clase' },
        { k: 'explora', label: '🔬 Exploración', desc: 'Controlás vos las variables' },
        { k: 'desafio', label: '🏅 Desafío', desc: desafio || 'Superá el reto propuesto' },
      ].map((m) => (
        <button key={m.k} className={`termo-modo-btn ${modo === m.k ? 'activo' : ''}`} onClick={() => setModo(m.k)}>
          <strong>{m.label}</strong>
          <small>{m.desc}</small>
        </button>
      ))}
    </div>
  );
}

export function Retro({ estado, explicacion, pista, alIntentar }) {
  if (!estado) return null;
  return (
    <div className={`termo-retro ${estado}`}>
      {estado === 'ok' ? (
        <>
          <strong>¡Correcto!</strong>
          {explicacion && <p>{explicacion}</p>}
        </>
      ) : (
        <>
          <strong>No es correcto todavía.</strong>
          {pista && <p className="termo-pista">💡 Pista: {pista}</p>}
          <p>Revisá el concepto trabajado en la simulación y probá de nuevo.</p>
          {alIntentar && (
            <button className="btn" onClick={alIntentar}>
              Reintentar
            </button>
          )}
        </>
      )}
    </div>
  );
}

export function Pregunta({ pregunta, onResponder, feedback, numero }) {
  const [entrada, setEntrada] = useState('');
  const responder = (resp) => {
    let ok = false;
    if (pregunta.tipo === 'num') ok = Math.abs(Number(entrada.replace(',', '.')) - pregunta.correcto) < 1e-6;
    else if (pregunta.tipo === 'vf') ok = resp === pregunta.correcto;
    else ok = resp === pregunta.correcto;
    onResponder(ok, { ...pregunta, dado: resp, entrada });
  };

  return (
    <div className="termo-pregunta">
      {numero && <span className="badge-tipo">{numero}</span>}
      <p className="termo-enunciado">{pregunta.texto}</p>
      {pregunta.tipo === 'mc' && (
        <div className="termo-opciones">
          {pregunta.opciones.map((op, i) => (
            <button key={i} className="btn" onClick={() => responder(i)}>
              {String.fromCharCode(65 + i)}) {op}
            </button>
          ))}
        </div>
      )}
      {pregunta.tipo === 'vf' && (
        <div className="termo-opciones">
          <button className="btn" onClick={() => responder(true)}>Verdadero</button>
          <button className="btn" onClick={() => responder(false)}>Falso</button>
        </div>
      )}
      {pregunta.tipo === 'num' && (
        <div className="termo-num">
          <input value={entrada} onChange={(e) => setEntrada(e.target.value)} placeholder="Respuesta numérica…" />
          {pregunta.unidad && <span className="pill">{pregunta.unidad}</span>}
          <button className="btn btn-primary" onClick={() => responder(entrada)}>
            Comprobar
          </button>
        </div>
      )}
      {feedback && (
        <div className={`termo-retro ${feedback.ok ? 'ok' : 'error'}`}>
          <strong>{feedback.ok ? '¡Correcto!' : 'No es correcto todavía.'}</strong>
          {!feedback.ok && feedback.pista && <p className="termo-pista">💡 {feedback.pista}</p>}
          <p>{feedback.explicacion}</p>
          {!feedback.ok && <button className="btn" onClick={() => onResponder(null)}>Reintentar</button>}
        </div>
      )}
    </div>
  );
}

export function Indice({ puntos, meta }) {
  return (
    <div className="termo-objetivo">
      <strong>🎯 Objetivo de aprendizaje:</strong> {meta}
      {puntos && (
        <div className="termo-indice">
          <span>Tu puntaje en este módulo:</span>
          <strong>{puntos} pts</strong>
        </div>
      )}
    </div>
  );
}

export function Dato({ etiqueta, valor, color }) {
  return (
    <span className="pill termo-dato" style={color ? { borderColor: color } : {}}>
      {etiqueta} <strong>{valor}</strong>
    </span>
  );
}

export function Num({ onChange, value, min, max, step }) {
  return (
    <input
      className="termo-num-input"
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}