import { useRef, useState } from 'react';
import { useAnimacion, useCanvas, punteroCanvas, dibujarIman, fuerzaPunto, pasoMovil, escenaFondo } from './ui.jsx';
import { useTour, PanelAula } from './Tour.jsx';

const PASOS = [
  { id: 'intro', texto: 'El magnetismo atrae principalmente a los materiales que contienen hierro, cobalto o níquel.', duracion: 3600 },
  { id: 'clips', texto: 'Los clips, tornillos y llaves son de acero: contienen hierro y por eso se pegan al imán.', duracion: 5200 },
  { id: 'aluminio', texto: 'El aluminio y el cobre NO son ferromagnéticos: por más cerca que esté el imán, no se pegan.', duracion: 5200 },
  { id: 'niquel', texto: 'El níquel y el cobalto sí responden al imán, aunque son menos conocidos que el hierro.', duracion: 5000 },
  { id: 'cierre', texto: 'El imán no necesita tocar los objetos: los atrae desde cierta distancia, sin contacto.', duracion: 4000 },
];

const OBJETOS = [
  { id: 'clip', nombre: 'Clip', emoji: '📎', mag: true, motivo: 'Contiene hierro.' },
  { id: 'tornillo', nombre: 'Tornillo', emoji: '🔩', mag: true, motivo: 'Es de acero (hierro).' },
  { id: 'llave', nombre: 'Llave', emoji: '🔑', mag: true, motivo: 'El acero de la llave tiene hierro.' },
  { id: 'cuchara', nombre: 'Cuchara', emoji: '🥄', mag: true, motivo: 'Acero inoxidable con hierro.' },
  { id: 'broche', nombre: 'Broche', emoji: '🧷', mag: true, motivo: 'Contiene hierro.' },
  { id: 'niquel', nombre: 'Moneda de níquel', emoji: '🪙', mag: true, motivo: 'El níquel es ferromagnético.' },
  { id: 'cobalto', nombre: 'Objeto de cobalto', emoji: '🔧', mag: true, motivo: 'El cobalto es ferromagnético.' },
  { id: 'moneda', nombre: 'Moneda común', emoji: '🪙', mag: false, motivo: 'Tiene poco o nada de hierro.' },
  { id: 'aluminio', nombre: 'Latita de aluminio', emoji: '🥫', mag: false, motivo: 'El aluminio no es ferromagnético.' },
  { id: 'cobre', nombre: 'Cable de cobre', emoji: '🔌', mag: false, motivo: 'El cobre casi no reacciona al imán.' },
  { id: 'papel', nombre: 'Papel', emoji: '📄', mag: false, motivo: 'No contiene metales magnéticos.' },
  { id: 'madera', nombre: 'Bloque de madera', emoji: '🪵', mag: false, motivo: 'La madera no es magnética.' },
  { id: 'plastico', nombre: 'Vaso de plástico', emoji: '🥤', mag: false, motivo: 'El plástico no responde al imán.' },
  { id: 'vidrio', nombre: 'Vaso de vidrio', emoji: '🥛', mag: false, motivo: 'El vidrio no se magnetiza.' },
  { id: 'goma', nombre: 'Goma', emoji: '🛞', mag: false, motivo: 'La goma no es magnética.' },
];

const OBJETIVO_TOUR = { clips: 'clip', aluminio: 'aluminio', niquel: 'niquel' };

// posiciones iniciales (fijas, distribución tipo mesa)
const POS_INICIAL = [
  [0.12, 0.2], [0.32, 0.16], [0.55, 0.14], [0.78, 0.2], [0.9, 0.42],
  [0.18, 0.44], [0.42, 0.4], [0.66, 0.38], [0.86, 0.62], [0.14, 0.68],
  [0.34, 0.66], [0.56, 0.62], [0.74, 0.78], [0.5, 0.82], [0.9, 0.84],
];

const K = 0.35;
const R_MAX = 0.32;
const R_CONTACTO = 0.09;

export default function SimQueAtrae({ onAbrir }) {
  const canvasRef = useCanvas(() => {}, []);
  const tour = useTour(PASOS);
  const tourRef = useRef(tour);
  tourRef.current = tour;

  const iman = useRef({ x: 0.5, y: 0.62, vx: 0, vy: 0 });
  const objetos = useRef(
    OBJETOS.map((o, i) => ({
      ...o,
      x: POS_INICIAL[i][0],
      y: POS_INICIAL[i][1],
      vx: 0,
      vy: 0,
      pegado: false,
      angAta: 0,
      probado: false,
    }))
  );
  const arrastrando = useRef(false);
  const [info, setInfo] = useState({ atraidos: 0, total: OBJETOS.filter((o) => o.mag).length, probados: 0 });
  const [reinicio, setReinicio] = useState(0);

  function mezclar() {
    objetos.current.forEach((o) => {
      o.x = 0.1 + Math.random() * 0.8;
      o.y = 0.12 + Math.random() * 0.76;
      o.vx = 0;
      o.vy = 0;
      o.pegado = false;
      o.probado = false;
    });
    setInfo((i) => ({ ...i, atraidos: 0, probados: 0 }));
  }

  function reiniciar() {
    objetos.current.forEach((o, i) => {
      o.x = POS_INICIAL[i][0];
      o.y = POS_INICIAL[i][1];
      o.vx = 0;
      o.vy = 0;
      o.pegado = false;
      o.probado = false;
    });
    iman.current = { x: 0.5, y: 0.62, vx: 0, vy: 0 };
    setInfo((i) => ({ ...i, atraidos: 0, probados: 0 }));
    setReinicio((r) => r + 1);
  }

  function enPuntero(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const p = punteroCanvas(e, canvas);
    const w = canvas.clientWidth;
    const im = iman.current;
    const ix = im.x * w;
    const iy = im.y * canvas.clientHeight;
    if (Math.hypot(p.x - ix, p.y - iy) < 42) {
      arrastrando.current = true;
      const mover = (ev) => {
        const q = punteroCanvas(ev, canvas);
        im.x = Math.max(0.02, Math.min(0.98, q.x / canvas.clientWidth));
        im.y = Math.max(0.02, Math.min(0.98, q.y / canvas.clientHeight));
        im.vx = 0;
        im.vy = 0;
      };
      const up = () => {
        arrastrando.current = false;
        window.removeEventListener('pointermove', mover);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', mover);
      window.addEventListener('pointerup', up);
    }
  }

  useAnimacion((dt) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const im = iman.current;
    const objs = objetos.current;

    // modo automático: el imán viaja hacia el objetivo del paso
    if (!arrastrando.current && tour.jugando) {
      const objetivoId = OBJETIVO_TOUR[tour.pasoId];
      if (objetivoId) {
        const ob = objs.find((o) => o.id === objetivoId);
        if (ob && !ob.pegado) {
          const dirx = ob.x - im.x;
          const diry = ob.y - im.y;
          const d = Math.hypot(dirx, diry) || 1;
          const vel = 0.3;
          im.x += (dirx / d) * vel * dt;
          im.y += (diry / d) * vel * dt;
        }
      }
    }

    // física: atracción de los materiales magnéticos
    let atraidos = 0;
    let probados = 0;
    for (const o of objs) {
      if (o.mag) {
        if (o.pegado) {
          o.x = im.x + Math.cos(o.angAta) * R_CONTACTO;
          o.y = im.y + Math.sin(o.angAta) * R_CONTACTO;
          o.vx = 0;
          o.vy = 0;
          atraidos++;
          continue;
        }
        const f = fuerzaPunto(im.x - o.x, im.y - o.y, K, R_CONTACTO, R_MAX);
        pasoMovil(o, f.fx, f.fy, dt, 1, 0.9, 0.6);
        if (f.mag > 0 && Math.hypot(im.x - o.x, im.y - o.y) < R_CONTACTO) {
          o.pegado = true;
          o.angAta = Math.atan2(o.y - im.y, o.x - im.x);
          atraidos++;
        }
      } else {
        if (!o.probado && Math.hypot(im.x - o.x, im.y - o.y) < 0.12) {
          o.probado = true;
        }
        if (o.probado) probados++;
      }
    }

    const prev = info;
    if (prev.atraidos !== atraidos || prev.probados !== probados) {
      setInfo({ atraidos, total: prev.total, probados });
    }

    // dibujo
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    escenaFondo(ctx, w, h);

    // zona de atracción (alcance del campo)
    const rZona = R_MAX * w;
    ctx.strokeStyle = 'rgba(37,99,235,0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(im.x * w, im.y * h, rZona, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(37,99,235,0.6)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('zona de atracción', im.x * w, im.y * h - rZona - 8);

    // objetos
    const fontObj = Math.max(22, Math.min(44, w * 0.05));
    for (const o of objs) {
      const px = o.x * w;
      const py = o.y * h;
      ctx.globalAlpha = 1;
      ctx.font = `${fontObj}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(o.emoji, px, py + fontObj * 0.35);
      ctx.fillStyle = '#334155';
      ctx.font = '11px sans-serif';
      ctx.fillText(o.nombre, px, py + fontObj * 0.65 + 10);

      if (o.pegado) {
        ctx.fillStyle = '#16a34a';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('¡ATRAÍDO!', px, py - fontObj * 0.4 - 6);
      } else if (o.probado) {
        ctx.fillStyle = '#b45309';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('NO ATRAÍDO', px, py - fontObj * 0.4 - 6);
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#78716c';
        ctx.fillText(o.motivo, px, py + fontObj * 0.8 + 20);
      }
    }

    // imán
    dibujarIman(ctx, im.x * w, im.y * h, Math.max(70, w * 0.09), Math.max(30, h * 0.06), 0, null);

    if (arrastrando.current) {
      ctx.strokeStyle = 'rgba(220,38,38,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(im.x * w, im.y * h, 42, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [info, tour.jugando, tour.pasoId, reinicio]);

  const pistas = tour.jugando ? null : info.atraidos === 0 ? 'Acercá el imán a los objetos de la mesa para descubrir cuáles se pegan.' : null;

  return (
    <div>
      <PanelAula
        objetivo="Descubrí qué materiales se pegan al imán arrastrándolo por toda la mesa."
        tour={tour}
        onReiniciar={reiniciar}
      />
      <div className="sim-controles">
        <span className="muted">Arrastrá el imán con el mouse o el dedo por toda la mesa.</span>
        <button className="btn" onClick={mezclar}>🎲 Mezclar objetos</button>
        <button className="btn" onClick={() => { objetos.current.forEach((o) => { o.probado = true; }); }}>👀 Mostrar respuestas</button>
      </div>

      <div className="sim-lienzo">
        <canvas ref={canvasRef} onPointerDown={enPuntero} />
      </div>

      <div className="sim-resultados">
        <span>
          Objetos atraídos: <strong>{info.atraidos} de {info.total}</strong>
        </span>
        <span>
          Materiales comprobados: <strong>{info.probados}</strong>
        </span>
        {pistas && <span className="warn">{pistas}</span>}
      </div>

      <div className="termo-retro ok">
        <strong>Conclusión</strong>
        <p>
          El imán atrae a los materiales que contienen hierro, cobalto o níquel (ferromagnéticos). Los demás materiales
          (plástico, madera, vidrio, aluminio, cobre…) no responden al imán, sin importar la distancia.
        </p>
      </div>
    </div>
  );
}