import { useRef, useState } from 'react';
import { useAnimacion, useCanvas, punteroCanvas, dibujarIman, escenaFondo, dibujarDinamometro } from './ui.jsx';
import { useTour, PanelAula } from './Tour.jsx';

const PASOS = [
  { id: 'intro', texto: 'La fuerza magnética actúa sin contacto: el imán mueve el clip sin tocarlo, a través del espacio.', duracion: 4200 },
  { id: 'lejos', texto: 'Mirá el dinamómetro: lejos, la fuerza es débil.', duracion: 4500 },
  { id: 'cerca', texto: 'Al acercar el clip, la fuerza crece rápidamente.', duracion: 5000 },
  { id: 'cuadrado', texto: 'Si la distancia se reduce a la mitad, la fuerza se multiplica por 4: es proporcional a 1/d².', duracion: 6000 },
  { id: 'cierre', texto: 'La fuerza a distancia decae con el cuadrado de la distancia: nunca desaparece del todo, pero se debilita muy rápido.', duracion: 4500 },
];

const D_MIN = 70; // distancia mínima en px
const DIST_MAX = 520;

function fuerzaPara(px) {
  const d = Math.max(D_MIN, px);
  const fr = (DIST_MAX / d) ** 2;
  return { N: Math.min(3, +(0.28 * fr).toFixed(2)), rel: Math.min(1, (DIST_MAX / d) ** 2) };
}

export default function SimFuerzasDistancia() {
  const canvasRef = useCanvas(() => {}, []);
  const tour = useTour(PASOS);
  const tourRef = useRef(tour);
  tourRef.current = tour;

  const clip = useRef(0.55); // distancia normalizada (0=pegado al imán, 1=lejos)
  const arrastrando = useRef(null);
  const [distNorm, setDistNorm] = useState(0.55);
  const [info, setInfo] = useState({ N: 0, cm: 0 });
  const ultPaso = useRef(null);

  function reiniciar() {
    clip.current = 0.55;
    setDistNorm(0.55);
    tour.reiniciar();
  }

  function enPuntero(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const p = punteroCanvas(e, canvas);
    const w = canvas.clientWidth;
    const xClip = xClipPx(w);
    if (Math.abs(p.x - xClip) < 40 && p.y > canvas.clientHeight * 0.18 && p.y < canvas.clientHeight * 0.85) {
      arrastrando.current = true;
      const mover = (ev) => {
        const q = punteroCanvas(ev, canvas);
        const n = Math.max(0.08, Math.min(0.98, q.x / canvas.clientWidth));
        clip.current = n;
        setDistNorm(n);
      };
      const up = () => {
        arrastrando.current = null;
        window.removeEventListener('pointermove', mover);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', mover);
      window.addEventListener('pointerup', up);
    }
  }

  function xClipPx(w) {
    // imán ocupa el 18% izquierdo; el recorrido va de ahí hasta el 88% del ancho
    const m = w * 0.17;
    const rango = w * (0.88 - 0.17);
    return m + (1 - distNorm) * rango;
  }

  useAnimacion((dt) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    // recorrido automático del clip en el tour
    if (tour.pasoId !== ultPaso.current) {
      ultPaso.current = tour.pasoId;
      if (tour.jugando && tour.pasoId === 'cerca') {
        clip.current = 0.3;
        setDistNorm(0.3);
      }
    }
    if (tour.jugando) {
      const t = Math.min(1, tour.prog);
      if (tour.pasoId === 'lejos') {
        clip.current = 0.55 + t * 0.3;
        setDistNorm(clip.current);
      } else if (tour.pasoId === 'cerca' || tour.pasoId === 'cuadrado') {
        const linea = t < 0.7 ? 0 : (t - 0.7) / 0.3;
        clip.current = 0.3 - linea * 0.22;
        setDistNorm(clip.current);
      }
    }

    const px = xClipPx(w);
    const mImg = w * 0.14;
    const fuerza = fuerzaPara(xClipPx(w) - mImg - 10);
    if (info.N !== fuerza.N || info.cm !== px) {
      setInfo({ N: fuerza.N, cm: px });
    }

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    escenaFondo(ctx, w, h);

    const cy = h * 0.42;

    // recorrido (regla)
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.moveTo(w * 0.05, cy + 40);
    ctx.lineTo(w * 0.95, cy + 40);
    ctx.stroke();
    ctx.setLineDash([]);

    // marcas de distancia
    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    for (let k = 0; k <= 4; k++) {
      const x = w * 0.17 + (w * 0.71 * k) / 4;
      ctx.fillText(`${k * 5} cm`, x, cy + 60);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(x - 0.5, cy + 36, 1, 8);
      ctx.fillStyle = '#64748b';
    }

    // imán
    dibujarIman(ctx, mImg, cy, mImg * 0.9, mImg * 0.4, 0, null);

    // clip sobre la bandeja
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📎', px, cy + 26);

    // flecha de fuerza
    const fcolor = fuerza.N > 1.5 ? '#dc2626' : fuerza.N > 0.5 ? '#d97706' : '#16a34a';
    ctx.strokeStyle = fcolor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(px - Math.min(60, 12 + fuerza.rel * 60), cy - 10);
    ctx.lineTo(px, cy - 10);
    ctx.stroke();
    ctx.fillStyle = fcolor;
    ctx.beginPath();
    ctx.moveTo(px, cy - 18);
    ctx.lineTo(px + 9, cy - 10);
    ctx.lineTo(px - 9, cy - 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = fcolor;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`${fuerza.N.toFixed(2)} N`, px, cy - 24);

    // dinamómetro
    dibujarDinamometro(ctx, w * 0.7, h * 0.12, fuerza.N, 3);

    // minigráfica F vs d
    const gx = w * 0.05;
    const gy = h * 0.7;
    const gw = w * 0.34;
    const gh = h * 0.2;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(gx, gy, gw, gh, 8);
    else ctx.rect(gx, gy, gw, gh);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Fuerza vs distancia', gx + 8, gy + 16);

    ctx.strokeStyle = 'rgba(37,99,235,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const d = DIST_MAX * (1 - t * 0.9) + 10;
      const f = fuerzaPara(d).rel;
      const X = gx + 8 + t * (gw - 16);
      const Y = gy + gh - 12 - f * (gh - 30);
      if (i === 0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    }
    ctx.stroke();

    const Xc = gx + 8 + (1 - distNorm) * (gw - 16);
    const Yc = gy + gh - 12 - fuerza.rel * (gh - 30);
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(Xc, Yc, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#b91c1c';
    ctx.fillText('clip', Xc, Yc - 9);

    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.fillText('lejos', gx + 8, gy + gh - 2);
    ctx.fillText('cerca', gx + gw - 10, gy + gh - 2);

    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'center';
    ctx.fillText('Arrastrá el clip por la bandeja para medir la fuerza', w / 2, h - 12);

    if (arrastrando.current) {
      ctx.strokeStyle = 'rgba(220,38,38,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, cy, 40, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [info, tour.jugando, tour.pasoId, distNorm]);

  return (
    <div>
      <PanelAula
        objetivo="Medí la fuerza que el imán ejerce sobre el clip a distintas distancias."
        tour={tour}
        onReiniciar={reiniciar}
      />

      <div className="sim-controles">
        <label>
          Distancia del clip al imán
          <input
            type="range"
            min="0.08"
            max="0.98"
            step="0.01"
            value={distNorm}
            onChange={(e) => {
              const n = Number(e.target.value);
              clip.current = n;
              setDistNorm(n);
            }}
          />
          <strong>{Math.round((1 - distNorm) * 50)} cm ... {Math.round(distNorm * 40)} cm</strong>
        </label>
        <span className="muted">También podés arrastrar el clip 📎 sobre la bandeja.</span>
      </div>

      <div className="sim-lienzo">
        <canvas ref={canvasRef} onPointerDown={enPuntero} />
      </div>

      <div className="sim-resultados">
        <span>
          Fuerza medida: <strong>{info.N.toFixed(2)} N</strong>
        </span>
        <span>
          La fuerza <strong>no</strong> necesita contacto: actúa a través del espacio.
        </span>
        <span>
          A la mitad de la distancia, la fuerza es <strong>4× mayor</strong>.
        </span>
      </div>

      <div className="termo-retro ok">
        <strong>Conclusión</strong>
        <p>
          La fuerza magnética es una <b>fuerza a distancia</b>: se transmite por el campo magnético sin tocar el objeto.
          Su intensidad cae con el <b>cuadrado de la distancia</b> (F ∝ 1/d²): lejos es casi imperceptible y cerca se vuelve intensa.
        </p>
      </div>
    </div>
  );
}