import { useEffect, useRef, useState } from 'react';

const CAPAS = [2, 8, 8, 2];
const AMPLIAR = {
  1: '1er período — H, He',
  2: '2° período — 8 elementos',
  3: '3er período — 8 elementos',
  4: '4° período — 18 elementos',
};

export default function SimBohr() {
  const canvasRef = useRef(null);
  const [z, setZ] = useState(11); // sodio
  const [electron, setElectron] = useState(false);

  // distribución por capas (aproximación 2,8,8,2)
  const capas = [];
  let rest = z;
  for (const cap of CAPAS) {
    const en = Math.min(rest, cap);
    capas.push(en);
    rest -= en;
    if (rest === 0) break;
  }

  // radio de valencia (1/n² de la última capa) - simplificado

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  useEffect(() => {
    let raf;
    const frame = () => {
      dibujar();
      raf = requestAnimationFrame(frame);
    };
    const id = setTimeout(() => {
      raf = requestAnimationFrame(frame);
    }, 0);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [z]);

  function dibujar() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const radioMax = Math.min(w, h) / 2 - 30;
    const anchoCapas = capas.length;
    const paso = radioMax / anchoCapas;

    // núcleo
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${z}`, cx, cy);

    for (let i = 0; i < capas.length; i++) {
      const r = paso(i) + paso(0) * 0.6;
      ctx.strokeStyle = 'rgba(148,163,184,0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      const n = capas[i];
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + (electron ? (performance.now() / 1000) * (1 / (i + 1)) : 0);
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '11px sans-serif';
      ctx.fillText(`K⁺ n=${i + 1}  ${n}e⁻`, cx, cy);
      if (i === capas.length - 1) {
        ctx.fillText(`${n} valencia`, cx, r + 18);
      }
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  function paso(i) {
    return radioMax / anchoCapas;
  }

  return (
    <div>
      <div className="sim-controles">
        <label>
          Elemento: <strong>{elemento(z)} (Z = {z})</strong>
          <input type="range" min="1" max="20" value={z} onChange={(e) => setZ(Number(e.target.value))} />
        </label>
        <label className="chk">
          <input type="checkbox" checked={electron} onChange={(e) => setElectron(e.target.checked)} />
          Girar electrones
        </label>
      </div>
      <div className="sim-resultados">
        <span>Configuración electrónica: <strong>2, 8, 8, 2</strong> → {capas.join(' – ')}</span>
        <span>Electrones de valencia: <strong>{capas[capas.length - 1]}</strong></span>
      </div>
      <div className="sim-lienzo">
        <canvas ref={canvasRef} />
      </div>
      <p className="muted nota">Modelo planetario de Bohr simplificado para elementos del 1 al 20.</p>
    </div>
  );
}

const SIMBOLOS = 'H HeLi Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca'.split(' ');
function elemento(z) {
  return SIMBOLOS[z - 1] || '?';
}