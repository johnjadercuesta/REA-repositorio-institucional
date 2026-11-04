import { useEffect, useRef, useState } from 'react';

const ELEMENTOS = [
  'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne',
  'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca',
];
const CAPAS = [2, 8, 8, 2];

export default function SimAtomo() {
  const canvasRef = useRef(null);
  const [protones, setProtones] = useState(6);
  const [neutrones, setNeutrones] = useState(6);
  const [electrones, setElectrones] = useState(6);

  const masa = protones + neutrones;
  const carga = protones - electrones;
  const simb = ELEMENTOS[protones - 1] || '?';
  const estado = carga === 0 ? 'Átomo neutro' : carga > 0 ? `Catión ${carga}+` : `Anión ${-carga}-`;
  const completo = electrones === protones;

  // distribución de electrones por capas (máximo según la tabla)
  const capas = [];
  let rest = electrones;
  for (const cap of CAPAS) {
    const en = Math.min(rest, cap);
    capas.push(en);
    rest -= en;
    if (rest === 0) break;
  }
  while (capas.length < 1) capas.push(0);

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
  }, [protones, neutrones, electrones]);

  // posiciones de nucleones en anillos
  function posicionesNucleon(total) {
    const pts = [];
    let anillo = 0;
    while (pts.length < total) {
      const n = anillo === 0 ? 1 : anillo * 6;
      if (anillo === 0) {
        pts.push([0, 0]);
      } else {
        for (let i = 0; i < n && pts.length < total; i++) {
          const a = (i / n) * Math.PI * 2;
          pts.push([anillo * 11 * Math.cos(a), anillo * 11 * Math.sin(a)]);
        }
      }
      anillo++;
    }
    return pts; // escala: anillo n -> radio n*11
  }

  function dibujar(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;

    // capas de electrones
    const capasUsadas = Math.max(capas.length, Math.min(3, Math.ceil(protones / 8)));
    const radioMax = Math.min(w, h) / 2 - 40;
    const paso = radioMax / (capasUsadas + 1);
    const nucleones = posicionesNucleon(protones + neutrones);

    // anillos
    for (let i = 1; i <= capasUsadas; i++) {
      const r = paso * i;
      ctx.strokeStyle = 'rgba(148,163,184,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      if (capas[i - 1]) {
        for (let k = 0; k < capas[i - 1]; k++) {
          const a = (k / capas[i - 1]) * Math.PI * 2;
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(cx + r * Math.cos(a), cy + r * Math.sin(a), 6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#475569';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${capas[i - 1]} e⁻`, cx + r, cy - 8);
        ctx.textAlign = 'left';
      }
    }

    // núcleo: protones (rojo) y neutrones (gris)
    const radioNucleo = 18 + nucleones.length * 1.2;
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(cx, cy, radioNucleo, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < nucleones.length; i++) {
      const [x, y] = nucleones[i];
      ctx.fillStyle = i < protones ? '#ef4444' : '#94a3b8';
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx + x, cy + y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${simb}`, cx, cy);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  return (
    <div>
      <div className="sim-controles">
        <label>
          Protones
          <input type="range" min="1" max="20" value={protones} onChange={(e) => setProtones(Number(e.target.value))} />
          <strong>{protones}</strong>
        </label>
        <label>
          Neutrones
          <input type="range" min="0" max="30" value={neutrones} onChange={(e) => setNeutrones(Number(e.target.value))} />
          <strong>{neutrones}</strong>
        </label>
        <label>
          Electrones
          <input type="range" min="0" max="20" value={electrones} onChange={(e) => setElectrones(Number(e.target.value))} />
          <strong>{electrones}</strong>
        </label>
      </div>

      <div className="sim-resultados">
        <span>
          Elemento: <strong>{simb}</strong> (Z = {protones})
        </span>
        <span>
          Número másico: <strong>A = {masa}</strong>
        </span>
        <span>
          Carga: <strong>{carga === 0 ? '0 (neutra)' : `${carga > 0 ? '+' : ''}${carga}`}</strong>
        </span>
        <span>
          Estado: <strong>{estado}</strong>
        </span>
      </div>

      <div className="sim-lienzo">
        <canvas ref={canvasRef} />
      </div>

      <div className="sim-botones">
        {([6, 11, 18]).map((z) => (
          <button
            key={z}
            className="btn"
            onClick={() => {
              setProtones(z);
              setNeutrones(Math.round(z * 1.2));
              setElectrones(z);
            }}
          >
            {ELEMENTOS[z - 1]} (Z={z})
          </button>
        ))}
        <button
          className="btn btn-danger"
          onClick={() => {
            setProtones(6);
            setNeutrones(6);
            setElectrones(6);
          }}
        >
          Reiniciar
        </button>
      </div>
      <p className="muted nota">
        El elemento depende de los protones, el número másico de protones + neutrones y la carga de protones − electrones.
        {!completo && <span> ¡Ajustá los electrones para conseguir un átomo {protones >= electrones && protones > electrones ? 'neutro' : 'estable'}!</span>}
      </p>
    </div>
  );
}