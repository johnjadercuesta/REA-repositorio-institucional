import { useEffect, useRef, useState } from 'react';

const MASAS = [
  { kg: 1, color: '#2563eb' },
  { kg: 5, color: '#16a34a' },
  { kg: 10, color: '#f59e0b' },
  { kg: 20, color: '#dc2626' },
];

const ESCALA = 40; // px por unidad de distancia

export default function SimFuerzas() {
  const canvasRef = useRef(null);
  const [masaSel, setMasaSel] = useState(5);
  const [distIzq, setDistIzq] = useState(4);
  const [distDer, setDistDer] = useState(4);
  const [izq, setIzq] = useState([{ kg: 10, dist: 3 }, { kg: 5, dist: 6 }]);
  const [der, setDer] = useState([{ kg: 20, dist: 3 }]);

  const momIzq = izq.reduce((s, o) => s + o.kg * o.dist, 0);
  const momDer = der.reduce((s, o) => s + o.kg * o.dist, 0);
  const dif = momIzq - momDer;
  const angulo = Math.max(-14, Math.min(14, dif / 40));

  function agregar(lado) {
    const objeto = { kg: masaSel, dist: lado === 'izq' ? distIzq : distDer };
    if (lado === 'izq') setIzq((arr) => [...arr, objeto]);
    else setDer((arr) => [...arr, objeto]);
  }

  function quitarUltimo(lado) {
    if (lado === 'izq') setIzq((arr) => arr.slice(0, -1));
    else setDer((arr) => arr.slice(0, -1));
  }

  function reiniciar() {
    setIzq([]);
    setDer([]);
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
    dibujar(ctx, w, h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [izq, der, distIzq, distDer]);

  function dibujar(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2 + 40;
    const media = cx - 60; // media longitud de cada brazo en px

    // fulcro
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(cx - 26, cy + 46);
    ctx.lineTo(cx + 26, cy + 46);
    ctx.lineTo(cx, cy + 22);
    ctx.closePath();
    ctx.fill();

    // viga (rotada levemente según el momento)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((angulo * Math.PI) / 180);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-media, 0);
    ctx.lineTo(media, 0);
    ctx.stroke();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 20);
    ctx.stroke();

    // objetos izquierda
    for (const o of izq) {
      const x = -Math.min(o.dist, 10) * (media / 10);
      pintaBloque(ctx, x, o.kg);
    }
    // objetos derecha
    for (const o of der) {
      const x = Math.min(o.dist, 10) * (media / 10);
      pintaBloque(ctx, x, o.kg);
    }
    ctx.restore();

    // regla de distancias
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    for (let d = 1; d <= 10; d++) {
      const x = cx + d * (media / 10);
      ctx.beginPath();
      ctx.moveTo(x, cy + 52);
      ctx.lineTo(x, cy + 60);
      ctx.stroke();
    }
  }

  function pintaBloque(ctx, x, kg) {
    const color = (MASAS.find((m) => m.kg === kg) || MASAS[0]).color;
    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x - 17, -14, 34, 26, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${kg} kg`, x, 0);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  let estado = 'En equilibrio';
  let estadoClase = 'balance';
  if (dif > 0.5) {
    estado = 'Inclina a la izquierda';
    estadoClase = 'izq';
  } else if (dif < -0.5) {
    estado = 'Inclina a la derecha';
    estadoClase = 'der';
  }

  return (
    <div>
      <div className="sim-controles">
        <label>
          Masa del objeto
          <select value={masaSel} onChange={(e) => setMasaSel(Number(e.target.value))}>
            {MASAS.map((m) => (
              <option key={m.kg} value={m.kg}>
                {m.kg} kg
              </option>
            ))}
          </select>
        </label>
        <label>
          Distancia a la izquierda
          <input type="range" min="1" max="10" value={distIzq} onChange={(e) => setDistIzq(Number(e.target.value))} />
          <strong>{distIzq} m</strong>
        </label>
        <label>
          Distancia a la derecha
          <input type="range" min="1" max="10" value={distDer} onChange={(e) => setDistDer(Number(e.target.value))} />
          <strong>{distDer} m</strong>
        </label>
      </div>

      <div className="sim-resultados">
        <span>
          Momento ↙: <strong>{momIzq.toFixed(0)} kg·m</strong>
        </span>
        <span>
          Momento ↘: <strong>{momDer.toFixed(0)} kg·m</strong>
        </span>
        <span className={`sim-estado-${estadoClase}`}>
          Estado: <strong>{estado}</strong>
        </span>
      </div>

      <div className="sim-lienzo">
        <canvas ref={canvasRef} />
      </div>

      <div className="sim-botones">
        <button className="btn btn-primary" onClick={() => agregar('izq')}>
          Colocar {masaSel} kg a la izquierda
        </button>
        <button className="btn btn-primary" onClick={() => agregar('der')}>
          Colocar {masaSel} kg a la derecha
        </button>
        <button className="btn" onClick={() => quitarUltimo('izq')}>
          Quitar última izq.
        </button>
        <button className="btn" onClick={() => quitarUltimo('der')}>
          Quitar última der.
        </button>
        <button className="btn btn-danger" onClick={reiniciar}>
          Reiniciar
        </button>
      </div>
      <p className="muted nota">
        Momento = masa × distancia al centro. En equilibrio los momentos de ambos lados son iguales.
      </p>
    </div>
  );
}