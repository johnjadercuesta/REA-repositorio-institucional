import { useRef, useState } from 'react';
import { useAnimacion, useCanvas, campoDipolo, dibujarMagnet, EscalaIntensidad, escenaFondo } from './ui.jsx';
import { useTour, PanelAula } from './Tour.jsx';

const PASOS = [
  { id: 'intro', texto: 'Las limaduras de hierro se alinean con el campo del imán: más alineadas, más intenso es el magnetismo.', duracion: 4000 },
  { id: 'subir', texto: 'Aumentando la fuerza del imán, las limaduras se ordenan bien de punta a punta.', duracion: 5000 },
  { id: 'bajar', texto: 'Al bajar la fuerza, las limaduras se desordenan: el campo ya no las puede alinear.', duracion: 4500 },
  { id: 'calor', texto: '¡Cuidado con el calor! Si la temperatura sube demasiado, el material pierde el magnetismo (punto de Curie).', duracion: 5200 },
  { id: 'cierre', texto: 'La intensidad del campo depende de la fuerza del imán y de la temperatura del material.', duracion: 4000 },
];

const LIMADURAS = [];
for (let i = 0; i < 12; i++) {
  for (let j = 0; j < 7; j++) {
    LIMADURAS.push([120 + i * 24, 40 + j * 22]);
  }
}
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(2026);
const DESORDEN = LIMADURAS.map(() => ({ umbral: rnd(), desvio: (rnd() - 0.5) * 1.6 }));

export default function SimIntensidad() {
  const canvasRef = useCanvas(() => {}, []);
  const tour = useTour(PASOS);
  const tourRef = useRef(tour);
  tourRef.current = tour;

  const [intensidad, setIntensidad] = useState(0.5);
  const [temperatura, setTemperatura] = useState(20);
  const ultPaso = useRef(null);

  function reiniciar() {
    setIntensidad(0.5);
    setTemperatura(20);
    tour.reiniciar();
  }

  useAnimacion((dt) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    if (tour.pasoId !== ultPaso.current) {
      ultPaso.current = tour.pasoId;
      if (tour.pasoId === 'calor') {
        setIntensidad(0.8);
        setTemperatura(360);
      }
    }
    if (tour.jugando) {
      const t = Math.min(1, tour.prog);
      if (tour.pasoId === 'subir') {
        setIntensidad(0.2 + t * 0.75);
      } else if (tour.pasoId === 'bajar') {
        setIntensidad(0.95 - t * 0.85);
      }
    }

    const alineacion = Math.max(0, Math.min(1, intensidad - (temperatura - 20) / 400));

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    escenaFondo(ctx, w, h);

    const cx = 55;
    const cy = h / 2;

    for (let k = 0; k < LIMADURAS.length; k++) {
      const [x, y] = LIMADURAS[k];
      const d = DESORDEN[k];
      const f = campoDipolo(x, y, cx, cy, 0);
      let mag = Math.hypot(f.Bx, f.By);
      let a = Math.atan2(f.By, f.Bx);
      if (d.umbral < 1 - alineacion) {
        a += d.desvio;
        mag *= 0.4;
      }
      const L = 6 + mag * 22 * alineacion;
      const r = 8 + 16 * Math.min(1, mag * 3);
      ctx.strokeStyle = `rgba(59,130,246,${Math.max(0.15, Math.min(1, r / 24))})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(a) * L, y - Math.sin(a) * L);
      ctx.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L);
      ctx.stroke();
    }

    dibujarMagnet(ctx, cx, cy, 110, 44, 0);

    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText('Limaduras de hierro: se ordenan cuando el campo es fuerte', w / 2, h - 10);
  }, [intensidad, temperatura, tour.jugando, tour.pasoId]);

  return (
    <div>
      <PanelAula
        objetivo="Descubrí cómo la fuerza del imán y la temperatura cambian el magnetismo."
        tour={tour}
        onReiniciar={reiniciar}
      />

      <div className="sim-controles">
        <label>
          Fuerza del imán
          <input type="range" min="0" max="1" step="0.05" value={intensidad} onChange={(e) => setIntensidad(Number(e.target.value))} />
          <strong>{Math.round(intensidad * 100)}%</strong>
        </label>
        <label>
          Temperatura del material
          <input type="range" min="20" max="400" step="5" value={temperatura} onChange={(e) => setTemperatura(Number(e.target.value))} />
          <strong>{temperatura}°C</strong>
        </label>
      </div>

      <div className="sim-resultados">
        <EscalaIntensidad valor={Math.max(0, Math.min(1, intensidad - (temperatura - 20) / 400))} />
        <span>
          Alineación de las limaduras: <strong>{Math.round(Math.max(0, Math.min(1, intensidad - (temperatura - 20) / 400)) * 100)}%</strong>
          {temperatura >= 250 && <span className="warn"> — ¡Demasiado calor! Pierde magnetismo.</span>}
        </span>
      </div>

      <div className="sim-lienzo">
        <canvas ref={canvasRef} />
      </div>

      <div className="termo-retro ok">
        <strong>Conclusión</strong>
        <p>
          La intensidad del magnetismo depende de la <b>fuerza del imán</b> y de la <b>temperatura</b>: a más calor, los
          dominios se desordenan y el material pierde su magnetismo (punto de Curie).
        </p>
      </div>
    </div>
  );
}