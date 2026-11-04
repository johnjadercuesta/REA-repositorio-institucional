import { useRef, useState } from 'react';
import {
  useAnimacion, useCanvas, punteroCanvas, campoDipolo, dibujarMagnet, dibujarBrujula,
  dibujarLineasCampo, dibujarLimaduras, medidorCampo, escenaFondo, campoEnPunto,
} from './ui.jsx';
import { useTour, PanelAula } from './Tour.jsx';

const PASOS = [
  { id: 'intro', texto: 'El campo magnético es la zona invisible donde el imán ejerce su fuerza.', duracion: 3800 },
  { id: 'lineas', texto: 'Las líneas de campo salen del polo N, rodean el imán y entran por el S.', duracion: 6000 },
  { id: 'brj', texto: 'La brújula se alinea con el campo: su aguja siempre señala hacia el polo norte magnético.', duracion: 6500 },
  { id: 'limaduras', texto: 'Las limaduras de hierro dibujan las líneas del campo: así vemos lo invisible.', duracion: 6000 },
  { id: 'cierre', texto: 'Donde las líneas están más juntas el campo es más fuerte (mayor μT).', duracion: 4200 },
];

const FIJAS = [
  [0, -0.26], [0, 0.26], [-0.24, 0], [0.24, 0],
  [-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17],
  [-0.12, 0], [0.12, 0], [0, -0.13], [0, 0.13],
];

const LIMADURAS = Array.from({ length: 16 * 10 }, (_, i) => {
  const col = i % 16;
  const fila = Math.floor(i / 16);
  return { x: 0.06 + col * 0.058, y: 0.08 + fila * 0.088, umbral: Math.random(), desvio: (Math.random() - 0.5) * 1.4 };
});

function girarHacia(actual, objetivo, dt, k = 10) {
  let d = objetivo - actual;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return actual + d * Math.min(1, k * dt);
}

export default function SimCampo() {
  const canvasRef = useCanvas(() => {}, []);
  const tour = useTour(PASOS);
  const tourRef = useRef(tour);
  tourRef.current = tour;

  const mag = useRef({ x: 0.5, y: 0.44 });
  const brj = useRef({ x: 0.78, y: 0.3 });
  const angBase = useRef({}); // ángulos actuales de las brújulas fijas
  const angBrj = useRef(0);
  const arrastrando = useRef(null);
  const rastro = useRef([]);

  const [ang, setAng] = useState(0);
  const [intensidad, setIntensidad] = useState(0.6);
  const [lineas, setLineas] = useState(true);
  const [limaduras, setLimaduras] = useState(false);
  const [lectura, setLectura] = useState({ ut: 0, grados: 0 });
  const [reinicio, setReinicio] = useState(0);

  const ultPaso = useRef(null);

  function reiniciar() {
    mag.current = { x: 0.5, y: 0.44 };
    brj.current = { x: 0.78, y: 0.3 };
    angBase.current = {};
    angBrj.current = 0;
    rastro.current = [];
    setAng(0);
    setIntensidad(0.6);
    setLineas(true);
    setLimaduras(tour.pasoId === 'limaduras');
    tour.reiniciar();
    setReinicio((r) => r + 1);
  }

  function enPuntero(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const p = punteroCanvas(e, canvas);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (Math.hypot(p.x - mag.current.x * w, p.y - mag.current.y * h) < 90) {
      arrastrando.current = 'mag';
    } else if (Math.hypot(p.x - brj.current.x * w, p.y - brj.current.y * h) < 45) {
      arrastrando.current = 'brj';
    } else return;
    const mover = (ev) => {
      const q = punteroCanvas(ev, canvas);
      const tgt = arrastrando.current;
      if (tgt === 'mag') {
        mag.current.x = Math.max(0.18, Math.min(0.82, q.x / canvas.clientWidth));
        mag.current.y = Math.max(0.2, Math.min(0.8, q.y / canvas.clientHeight));
      } else {
        brj.current.x = Math.max(0.04, Math.min(0.96, q.x / canvas.clientWidth));
        brj.current.y = Math.max(0.04, Math.min(0.96, q.y / canvas.clientHeight));
      }
    };
    const up = () => {
      arrastrando.current = null;
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', up);
  }

  useAnimacion((dt) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const rad = (ang * Math.PI) / 180;
    const mx = mag.current.x * w;
    const my = mag.current.y * h;
    const tiempo = performance.now() / 1000;
    const fase = tiempo * 0.25;

    if (tour.pasoId !== ultPaso.current) {
      ultPaso.current = tour.pasoId;
      if (tour.jugando && tour.pasoId === 'limaduras') setLimaduras(true);
      if (tour.jugando && tour.pasoId === 'brj') {
        // arranca la brújula desde el polo N
        const nx = mx + Math.cos(rad) * 40;
        const ny = my + Math.sin(rad) * 40;
        brj.current = { x: nx / w, y: ny / h };
        rastro.current = [];
      }
    }

    // recorrido automático de la brújula
    if (tour.jugando && (tour.pasoId === 'lineas' || tour.pasoId === 'brj')) {
      const f = campoDipolo(brj.current.x * w, brj.current.y * h, mx, my, rad);
      const m = Math.hypot(f.Bx, f.By) || 1;
      const rapidez = 0.16;
      brj.current.x += (f.Bx / m) * rapidez * dt;
      brj.current.y += (f.By / m) * rapidez * dt;
      rastro.current.push([brj.current.x * w, brj.current.y * h]);
      if (rastro.current.length > 40) rastro.current.shift();
      const px = brj.current.x * w;
      const py = brj.current.y * h;
      if (px < 16 || px > w - 16 || py < 16 || py > h - 16) {
        const nx = mx + Math.cos(rad) * 40;
        const ny = my + Math.sin(rad) * 40;
        brj.current = { x: nx / w, y: ny / h };
        rastro.current = [];
      }
    }

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    escenaFondo(ctx, w, h);

    const nLineas = 6 + Math.round(intensidad * 8);
    if (limaduras) {
      dibujarLimaduras(ctx, LIMADURAS, (x, y) => campoDipolo(x, y, mx, my, rad), intensidad);
    }
    if (lineas) {
      dibujarLineasCampo(ctx, mx, my, rad, Math.min(w, h) * 0.5, 56, nLineas, intensidad, fase);
    }

    // brújulas fijas
    FIJAS.forEach(([dx, dy], i) => {
      const px = w / 2 + dx * w;
      const py = h / 2 + dy * h;
      const f = campoDipolo(px, py, mx, my, rad);
      const objetivo = Math.atan2(f.By, f.Bx);
      const prev = angBase.current[i] ?? objetivo;
      const nuevo = girarHacia(prev, objetivo, dt, 8);
      angBase.current[i] = nuevo;
      dibujarBrujula(ctx, px, py, nuevo, 0.85);
    });

    // rastro de la brújula automática
    if (rastro.current.length > 1) {
      ctx.strokeStyle = 'rgba(168,85,247,0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(rastro.current[0][0], rastro.current[0][1]);
      for (let i = 1; i < rastro.current.length; i++) ctx.lineTo(rastro.current[i][0], rastro.current[i][1]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // brújula arrastrable
    const bpx = brj.current.x * w;
    const bpy = brj.current.y * h;
    const fb = campoDipolo(bpx, bpy, mx, my, rad);
    const doel = Math.atan2(fb.By, fb.Bx);
    angBrj.current = girarHacia(angBrj.current, doel, dt, 12);
    dibujarBrujula(ctx, bpx, bpy, angBrj.current, 1.15);

    const campo = campoEnPunto(bpx, bpy, mx, my, 900 * (0.5 + intensidad));
    const ut = Math.round(campo.mag * 260);
    const grados = Math.round(((angBrj.current * 180) / Math.PI + 360) % 360);
    const lec = { ut, grados };
    if (Math.abs(lec.ut - lectura.ut) > 1 || Math.abs(lec.grados - lectura.grados) > 2) {
      setLectura(lec);
    }
    medidorCampo(ctx, bpx + 14, bpy - 30, 120, 16, ut, 260);

    // imán
    dibujarMagnet(ctx, mx, my, Math.min(w, h) * 0.3, Math.min(w, h) * 0.11, rad);

    if (arrastrando.current) {
      ctx.strokeStyle = 'rgba(220,38,38,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(arrastrando.current === 'mag' ? mx : bpx, arrastrando.current === 'mag' ? my : bpy, arrastrando.current === 'mag' ? 90 : 45, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [ang, intensidad, lineas, limaduras, lectura, tour.jugando, tour.pasoId, reinicio]);

  return (
    <div>
      <PanelAula
        objetivo="Explorá el campo magnético con brújulas, líneas de campo y limaduras."
        tour={tour}
        onReiniciar={reiniciar}
      />

      <div className="sim-controles">
        <label>
          Orientación del imán
          <input type="range" min="0" max="180" step="1" value={ang} onChange={(e) => setAng(Number(e.target.value))} />
          <strong>{ang}°</strong>
        </label>
        <label>
          Intensidad
          <input type="range" min="0" max="1" step="0.05" value={intensidad} onChange={(e) => setIntensidad(Number(e.target.value))} />
          <strong>{Math.round(intensidad * 100)}%</strong>
        </label>
        <label className="chk">
          <input type="checkbox" checked={lineas} onChange={(e) => setLineas(e.target.checked)} />
          Líneas de campo
        </label>
        <label className="chk">
          <input type="checkbox" checked={limaduras} onChange={(e) => setLimaduras(e.target.checked)} />
          Limaduras
        </label>
      </div>

      <div className="sim-lienzo">
        <canvas ref={canvasRef} onPointerDown={enPuntero} />
      </div>

      <div className="sim-resultados">
        <span>
          Campo en la brújula: <strong>{lectura.ut} μT</strong> · aguja en <strong>{lectura.grados}°</strong>
        </span>
        <span className="ok">
          Las líneas salen del <strong>N</strong> y entran al <strong>S</strong>.
        </span>
        <span className="muted">Arrastrá el imán y la brújula para explorar .</span>
      </div>
    </div>
  );
}