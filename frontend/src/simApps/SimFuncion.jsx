import { useEffect, useRef, useState } from 'react';

export default function SimFuncion() {
  const canvasRef = useRef(null);
  const [a, setA] = useState(1);
  const [b, setB] = useState(1);
  const [tipo, setTipo] = useState('lineal');

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dibujar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    dibujar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, b, tipo]);

  function fy(x) {
    if (tipo === 'parabolica') return a * (x - b) * (x - b) - 1;
    if (tipo === 'seno') return Math.sin(a * x) * b;
    return a * x + b;
  }

  function dibujar() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    const rango = 6;
    const X = (x) => w / 2 + (x * w) / (2 * rango);
    const Y = (y) => h / 2 - (y * h) / (2 * rango);

    // cuadrícula
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = -rango; i <= rango; i++) {
      if (i === 0) continue;
      const vx = X(i);
      ctx.beginPath();
      ctx.moveTo(vx, 0);
      ctx.lineTo(vx, h);
      ctx.stroke();
      const vy = Y(i);
      ctx.beginPath();
      ctx.moveTo(0, vy);
      ctx.lineTo(w, vy);
      ctx.stroke();
    }

    // ejes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();

    // etiquetas
    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.fillText('x', w - 14, h / 2 - 8);
    ctx.fillText('y', w / 2 + 8, 14);
    ctx.fillText('(0,0)', w / 2 + 6, h / 2 + 16);

    // función
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
    ctx.beginPath();
    let inicio = true;
    for (let sxp = 0; sxp <= w; sxp += 1) {
      const x = (sxp - w / 2) / (w / (2 * rango));
      const y = fy(x);
      const sx = X(x);
      const sy = Y(y);
      if (inicio) {
        ctx.moveTo(sx, sy);
        inicio = false;
      } else {
        ctx.lineTo(sx, sy);
      }
    }
    ctx.stroke();
  }

  return (
    <div>
      <div className="sim-controles">
        <label>
          Parámetro a: <strong>{a}</strong>
          <input type="range" min="-4" max="4" step="0.1" value={a} onChange={(e) => setA(Number(e.target.value))} />
        </label>
        <label>
          Parámetro b: <strong>{b}</strong>
          <input type="range" min="-4" max="4" step="0.1" value={b} onChange={(e) => setB(Number(e.target.value))} />
        </label>
        <label>
          Tipo:
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="lineal">Lineal: y = ax + b</option>
            <option value="parabolica">Parábola: y = a(x–b)² – 1</option>
            <option value="seno">Seno: y = sen(ax)·b</option>
          </select>
        </label>
      </div>
      <div className="sim-resultados">
        <span>
          Función: <strong>{formula(tipo, a, b)}</strong>
        </span>
        {tipo === 'lineal' && (
          <span>
            Pendiente: <strong>{a}</strong> · Ordenada al origen: <strong>{b}</strong>
          </span>
        )}
      </div>
      <div className="sim-lienzo">
        <canvas ref={canvasRef} />
      </div>
      <p className="muted nota">
        Arrastrá los controles para modificar los parámetros y observar cómo cambia la gráfica.
      </p>
    </div>
  );
}

function formula(tipo, a, b) {
  if (tipo === 'lineal') return `y = ${a}x ${b < 0 ? '− ' : '+ '}${Math.abs(b)}`;
  if (tipo === 'parabolica') return `y = ${a}(x − ${b})² − 1`;
  return `y = sen(${a}·x)·${b}`;
}