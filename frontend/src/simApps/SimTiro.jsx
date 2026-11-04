import { useEffect, useRef, useState } from 'react';

const G = 9.81;

export default function SimTiro() {
  const canvasRef = useRef(null);
  const [vel, setVel] = useState(25);
  const [angulo, setAngulo] = useState(55);
  const [altInicial, setAltInicial] = useState(0);
  const [animando, setAnimando] = useState(false);
  const lastRef = useRef(null);

  const rad = (angulo * Math.PI) / 180;
  const vx = vel * Math.cos(rad);
  const vy0 = vel * Math.sin(rad);
  const tVuelo = (vy0 + Math.sqrt(vy0 * vy0 + 2 * G * altInicial)) / G;
  const hMax = altInicial + (vy0 * vy0) / (2 * G);
  const alcance = vx * tVuelo;
  const ancho = Math.max(9, alcance + 1.5);
  const alto = Math.max(4, hMax + 1.5);

  function coordenar(x, y) {
    const canvas = canvasRef.current;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const m = 26;
    const px = (w - 2 * m) / ancho;
    const py = (h - 2 * m) / alto;
    return [m + x * px, h - m - y * py];
  }

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
      dibujar(animando ? (performance.now() / 1000) % tVuelo : tVuelo);
      if (animando) raf = requestAnimationFrame(frame);
    };
    if (animando) {
      raf = requestAnimationFrame(frame);
    } else {
      dibujar(tVuelo);
    }
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animando, vel, angulo, altInicial]);

  function dibujar(t) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    const [, sy] = coordenar(0, 0);
    const [ex, ey] = coordenar(ancho, 0);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.lineTo(w, sy);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = '11px sans-serif';
    for (let m = 0; m <= Math.ceil(ancho); m++) {
      const [x, y] = coordenar(m, 0);
      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 6);
      ctx.stroke();
      ctx.fillText(`${m}`, x - 5, y + 16);
    }
    for (let m = 0; m <= Math.ceil(alto); m++) {
      const [x, y] = coordenar(0, m);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 6, y);
      ctx.stroke();
      ctx.fillText(`${m}`, 4, y + 4);
    }
    ctx.fillText(`${ancho}m`, ex, ey + 16);

    // trayectoria
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const pasos = 120;
    for (let i = 0; i <= pasos; i++) {
      const p = posicionT((i / pasos) * tVuelo);
      const [x, y] = coordenar(p.x, p.y);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // proyectil
    const p = posicionT(t);
    const [px, py] = coordenar(p.x, p.y);
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.arc(px, py, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  function posicionT(t) {
    return {
      x: vx * t,
      y: Math.max(0, altInicial + vy0 * t - 0.5 * G * t * t),
    };
  }

  return (
    <div>
      <div className="sim-controles">
        <label>
          Velocidad inicial: <strong>{vel} m/s</strong>
          <input type="range" min="5" max="60" value={vel} onChange={(e) => setVel(Number(e.target.value))} />
        </label>
        <label>
          Ángulo: <strong>{angulo}°</strong>
          <input type="range" min="0" max="90" value={angulo} onChange={(e) => setAngulo(Number(e.target.value))} />
        </label>
        <label>
          Altura inicial: <strong>{altInicial} m</strong>
          <input type="range" min="0" max="20" value={altInicial} onChange={(e) => setAltInicial(Number(e.target.value))} />
        </label>
        <button className="btn" onClick={() => setAnimando((v) => !v)}>
          {animando ? 'Pausa' : 'Animar'}
        </button>
      </div>
      <div className="sim-resultados">
        <span>Alcance: <strong>{alcance.toFixed(1)} m</strong></span>
        <span>Altura máx.: <strong>{hMax.toFixed(1)} m</strong></span>
        <span>Tiempo de vuelo: <strong>{tVuelo.toFixed(2)} s</strong></span>
      </div>
      <div className="sim-lienzo">
        <canvas ref={canvasRef} />
      </div>
      <p className="muted nota">Tiro parabólico con velocidad constante y gravedad g = 9,81 m/s² (sin fricción).</p>
    </div>
  );
}