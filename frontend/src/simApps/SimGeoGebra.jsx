import { useEffect, useRef, useState } from 'react';

const PRESETS = {
  lineal: { expr: 'x', desc: 'y = x (recta)' },
  cuadratica: { expr: 'x^2 - 2*x + 1', desc: 'y = x² – 2x + 1 (parábola)' },
  seno: { expr: 'sin(x)', desc: 'y = sin(x)' },
  coseno: { expr: 'cos(x)', desc: 'y = cos(x)' },
  valorAbs: { expr: 'abs(x)', desc: 'y = |x|' },
  exponencial: { expr: '2^x', desc: 'y = 2^x' },
  logaritmo: { expr: 'log(x)', desc: 'y = log(x)' },
  cúbica: { expr: 'x^3 - 3*x', desc: 'y = x³ – 3x' },
};

export default function SimGeoGebra() {
  const canvasRef = useRef(null);
  const [expr, setExpr] = useState('sin(x) + cos(x)');
  const [mostradas, setMostradas] = useState(['sin(x) + cos(x)']);
  const [error, setError] = useState('');
  const [escala, setEscala] = useState(1);
  const [cx, setCx] = useState(0);
  const [cy, setCy] = useState(0);
  const colores = ['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#d97706'];

  function graficar(e) {
    e.preventDefault();
    const limpias = mostradas.filter(Boolean);
    if (!expr.trim()) {
      setError('Escribí una función, p. ej. x^2 - 3');
      return;
    }
    if (limpias.includes(expr)) {
      setError('Esa función ya está graficada');
      return;
    }
    setError('');
    setMostradas([...limpias, expr]);
    setExpr('');
  }

  useEffect(() => {
    let raf;
    const frame = () => {
      dibujar();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostradas, escala, cx, cy]);

  function dibujar() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    const unid = 40 * escala; // píxeles por unidad
    const oX = w / 2 - cx * unid;
    const oY = h / 2 + cy * unid;

    const X = (x) => oX + x * unid;
    const Y = (y) => oY - y * unid;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // cuadrícula
    ctx.strokeStyle = '#eef2f7';
    ctx.lineWidth = 1;
    const xMin = -(oX / unid);
    const xMax = (w - oX) / unid;
    const yMin = -(oY / unid);
    const yMax = (h - oY) / unid;
    for (let i = Math.floor(xMin); i <= Math.ceil(xMax); i++) {
      const sx = X(i);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
      ctx.stroke();
    }
    for (let i = Math.floor(yMin); i <= Math.ceil(yMax); i++) {
      const sy = Y(i);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
      ctx.stroke();
    }

    // ejes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, oY);
    ctx.lineTo(w, oY);
    ctx.moveTo(oX, 0);
    ctx.lineTo(oX, h);
    ctx.stroke();

    // flechas y etiquetas
    ctx.fillStyle = '#475569';
    ctx.font = '12px sans-serif';
    ctx.fillText('x', w - 14, oY - 8);
    ctx.fillText('y', oX + 8, 14);

    // marcas en ejes
    ctx.fillStyle = '#64748b';
    ctx.font = '10px sans-serif';
    for (let i = Math.ceil(xMin); i <= Math.floor(xMax); i++) {
      if (i === 0) continue;
      const sx = X(i);
      ctx.fillText(i, sx - 3, oY + 14);
      ctx.beginPath();
      ctx.arc(sx, oY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#94a3b8';
      ctx.fill();
    }
    for (let i = Math.ceil(yMin); i <= Math.floor(yMax); i++) {
      if (i === 0) continue;
      const sy = Y(i);
      ctx.fillText(i, oX + 6, sy + 4);
      ctx.beginPath();
      ctx.arc(oX, sy, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#94a3b8';
      ctx.fill();
    }
    ctx.fillStyle = '#64748b';
    ctx.fillText('(0,0)', oX + 6, oY - 6);

    // graficar cada función
    mostradas.forEach((fn, idx) => {
      const f = parseExpr(fn);
      if (!f) return;
      ctx.strokeStyle = colores[idx % colores.length];
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let prevOk = false;
      for (let px = 0; px <= w; px++) {
        const x = (px - oX) / unid;
        let y;
        try {
          y = f(x);
        } catch {
          y = NaN;
        }
        const ok = Number.isFinite(y) && y > yMin - 10 && y < yMax + 10;
        const sy = Y(y);
        if (ok) {
          if (!prevOk) ctx.moveTo(px, sy);
          else ctx.lineTo(px, sy);
        }
        prevOk = ok;
      }
      ctx.stroke();
    });
  }

  return (
    <div>
      <form className="sim-controles" onSubmit={graficar}>
        <label style={{ gridColumn: '1 / -1' }}>
          f(x) =
          <input
            value={expr}
            onChange={(e) => {
              setExpr(e.target.value);
              setError('');
            }}
            placeholder="Ej: x^2 - 3, sin(x), abs(x), 2^x"
          />
          {error && <span className="alerta error" style={{ marginTop: 6 }}>{error}</span>}
        </label>
        <button className="btn btn-primary" type="submit">
          Graficar
        </button>
        <button className="btn" type="button" onClick={() => setMostradas([])}>
          Limpiar
        </button>
        <label className="chk">
          Zoom
          <input type="range" min="0.4" max="4" step="0.1" value={escala} onChange={(e) => setEscala(Number(e.target.value))} />
          <strong>{escala.toFixed(1)}×</strong>
        </label>
      </form>

      <div className="sim-presets">
        {Object.entries(PRESETS).map(([k, v]) => (
          <button
            key={k}
            className="btn btn-ghost"
            onClick={() => {
              setExpr(v.expr);
              setError('');
            }}
            title={v.desc}
          >
            {v.desc}
          </button>
        ))}
      </div>

      <div className="geogebra-wrap">
        <div className="sim-lienzo">
          <canvas ref={canvasRef} />
        </div>
        <div className="geogebra-zoom">
          <button className="btn" onClick={() => setEscala((z) => Math.min(4, z + 0.2))}>+</button>
          <button className="btn" onClick={() => setEscala((z) => Math.max(0.4, z - 0.2))}>−</button>
          <button className="btn btn-ghost" onClick={() => { setEscala(1); setCx(0); setCy(0); }}>Reiniciar vista</button>
        </div>
      </div>

      {mostradas.length > 0 && (
        <div className="geogebra-lista">
          {mostradas.map((fn, i) => (
            <span key={i} className="pill" style={{ borderColor: colores[i % colores.length] }}>
              <b style={{ color: colores[i % colores.length] }}>f{i + 1}:</b> y = {fn}
              <button className="pill-x" onClick={() => setMostradas((m) => m.filter((_, j) => j !== i))}>×</button>
            </span>
          ))}
        </div>
      )}
      <p className="muted nota">
        Operadores: + − * / ^ · Funciones: sin, cos, tan, abs, sqrt, log, exp, pi · Se pueden graficar varias funciones a la
        vez.
      </p>
    </div>
  );
}

// --- evaluador de expresiones (recursive descent) ---
function parseExpr(src) {
  const tokens = tokenize(src);
  if (tokens === null) return null;
  let i = 0;
  function peek() {
    return tokens[i];
  }
  function next() {
    return tokens[i++];
  }
  function parseE() {
    return parseAdd();
  }
  function parseAdd() {
    let left = parseMul();
    while (peek() === '+' || peek() === '-') {
      const op = next();
      const right = parseMul();
      left = makeOp(left, right, op);
    }
    return left;
  }
  function parseMul() {
    let left = parsePow();
    while (peek() === '*' || peek() === '/') {
      const op = next();
      const right = parsePow();
      left = makeOp(left, right, op);
    }
    return left;
  }
  function parsePow() {
    const base = parseUnary();
    if (peek() === '^') {
      next();
      const exp = parsePow();
      return (x) => Math.pow(base(x), exp(x));
    }
    return base;
  }
  function parseUnary() {
    if (peek() === '-') {
      next();
      const v = parseUnary();
      return (x) => -v(x);
    }
    if (peek() === '+') {
      next();
      return parseUnary();
    }
    return parseAtom();
  }
  function parseAtom() {
    const t = next();
    if (t === undefined) return null;
    if (t === '(') {
      const inner = parseAdd();
      if (peek() !== ')') return null;
      next();
      return inner;
    }
    if (t === 'x') return (x) => x;
    if (t === 'pi') return () => Math.PI;
    if (t === 'e') return () => Math.E;
    if (/^\d/.test(t)) {
      const num = Number(t);
      return () => num;
    }
    const f = FUNCS[t];
    if (f) {
      const arg = parseAtom();
      if (!arg) return null;
      return (x) => f(arg(x));
    }
    return null;
  }
  const root = parseAdd();
  if (tokens[i] !== undefined) return null;
  return root;
}

function makeOp(a, b, op) {
  if (op === '+') return (x) => a(x) + b(x);
  if (op === '-') return (x) => a(x) - b(x);
  if (op === '*') return (x) => a(x) * b(x);
  return (x) => a(x) / b(x);
}

const FUNCS = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  abs: Math.abs,
  sqrt: Math.sqrt,
  log: Math.log10,
  ln: Math.log,
  exp: Math.exp,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
};

function tokenize(src) {
  const out = [];
  let i = 0;
  const s = src.replace(/\s+/g, '');
  if (!s) return out;
  const re = /(\d+(?:\.\d+)?|[a-z]+|\(|\)|\+|-|\*|\/|\^)/g;
  let m;
  while ((m = re.exec(s)) !== null) out.push(m[1]);
  return out.join('') === s ? out : null;
}