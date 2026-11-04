import { useEffect, useRef, useState } from 'react';

const G = 9.81;

export default function SimPendulo() {
  const canvasRef = useRef(null);
  const [largo, setLargo] = useState(1.2);
  const [angulo, setAngulo] = useState(30);
  const [animando, setAnimando] = useState(true);
  const t0Ref = useRef(0);

  const rad = (angulo * Math.PI) / 180;
  const omega = Math.sqrt(G / largo);
  const periodo = 2 * Math.PI / omega;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    t0Ref.current = performance.now();
  }, []);

  useEffect(() => {
    let raf;
    const frame = () => {
      const t = (performance.now() - t0Ref.current) / 1000;
      dibujar(animando ? t : periodo / 4);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animando, largo, angulo]);

  function dibujar(t) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    const pivotX = w / 2;
    const pivotY = 30;
    const pxPerM = Math.min((h - 90) / (largo * 1.6), (w - 60) / (largo * 1.6));
    const L = largo * pxPerM;

    // techo
    ctx.fillStyle = '#64748b';
    ctx.fillRect(pivotX - L * 0.6, pivotY - 6, L * 1.2, 10);

    // arco de referencia
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, L, -Math.PI, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // posición actual
    const theta = rad * Math.cos(omega * t);
    const bx = pivotX + L * Math.sin(theta);
    const by = pivotY + L * Math.cos(theta);

    // varilla
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(bx, by);
    ctx.stroke();

    // pivote
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 5, 0, Math.PI * 2);
    ctx.fill();

    // masa
    const radio = 12;
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(bx, by, radio, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.arc(bx, by, radio * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // etiquetas
    ctx.fillStyle = '#334155';
    ctx.font = '12px sans-serif';
    ctx.fillText(`L = ${largo} m`, 12, h - 14);
    ctx.fillText(`θ = ${angulo}°`, pivotX + 10, 20);
  }

  return (
    <div>
      <div className="sim-controles">
        <label>
          Largo: <strong>{largo} m</strong>
          <input type="range" min="0.4" max="3" step="0.1" value={largo} onChange={(e) => setLargo(Number(e.target.value))} />
        </label>
        <label>
          Ángulo inicial: <strong>{angulo}°</strong>
          <input type="range" min="5" max="80" value={angulo} onChange={(e) => setAngulo(Number(e.target.value))} />
        </label>
        <button className="btn" onClick={() => setAnimando((v) => !v)}>
          {animando ? 'Pausa' : 'Animar'}
        </button>
      </div>
      <div className="sim-resultados">
        <span>Período: <strong>{periodo.toFixed(2)} s</strong></span>
        <span>Frecuencia: <strong>{(1 / periodo).toFixed(2)} Hz</strong></span>
      </div>
      <div className="sim-lienzo">
        <canvas ref={canvasRef} />
      </div>
      <p className="muted nota">Péndulo simple: el período no depende de la masa (g = 9,81 m/s²).</p>
    </div>
  );
}