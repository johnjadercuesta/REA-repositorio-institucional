import { useRef, useState } from 'react';
import { useAnimacion, useCanvas, punteroCanvas, dibujarIman, pasoMovil, escenaFondo, dibujarFlechaValor } from './ui.jsx';
import { useTour, PanelAula } from './Tour.jsx';

const PASOS = [
  { id: 'intro', texto: 'Todo imán tiene dos polos: el Norte (N) y el Sur (S). Nunca existe un polo solo.', duracion: 4000 },
  { id: 'atrac', texto: 'Los polos distintos se atraen: acercá dos imanes y se pegan solos.', duracion: 5500 },
  { id: 'repul', texto: 'Los polos iguales se repelen: los imanes se empujan y no se tocan.', duracion: 5500 },
  { id: 'cierre', texto: 'Esta regla es la base de los motores eléctricos y de los trenes de levitación.', duracion: 4000 },
];

const K = 0.35;
const R_MAX = 0.6;
const R_CONTACTO = 0.17;

export default function SimPolos() {
  const canvasRef = useCanvas(() => {}, []);
  const tour = useTour(PASOS);
  const tourRef = useRef(tour);
  tourRef.current = tour;

  const m1 = useRef({ x: 0.28, y: 0.5, vx: 0, vy: 0, invertido: false });
  const m2 = useRef({ x: 0.68, y: 0.5, vx: 0, vy: 0, invertido: false });
  const arrastrando = useRef(null);
  const ultPaso = useRef(null);
  const [info, setInfo] = useState({ tipo: '—', polos: '—', fuerza: 0 });

  function aplicarTour(pasoId) {
    if (pasoId === 'atrac') {
      m1.current = { x: 0.28, y: 0.5, vx: 0, vy: 0, invertido: false };
      m2.current = { x: 0.66, y: 0.5, vx: 0, vy: 0, invertido: false };
    } else if (pasoId === 'repul') {
      m1.current = { x: 0.28, y: 0.5, vx: 0, vy: 0, invertido: false };
      m2.current = { x: 0.66, y: 0.5, vx: 0, vy: 0, invertido: true };
    }
  }

  function girar(magnet) {
    magnet.current.invertido = !magnet.current.invertido;
  }

  function reiniciar() {
    m1.current = { x: 0.28, y: 0.5, vx: 0, vy: 0, invertido: false };
    m2.current = { x: 0.68, y: 0.5, vx: 0, vy: 0, invertido: false };
    tour.reiniciar();
  }

  function enPuntero(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const p = punteroCanvas(e, canvas);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const a = m1.current;
    const b = m2.current;
    const hit1 = Math.hypot(p.x - a.x * w, p.y - a.y * h) < 55;
    const hit2 = Math.hypot(p.x - b.x * w, p.y - b.y * h) < 55;
    if (!hit1 && !hit2) return;
    const objetivo = hit1 ? a : b;
    arrastrando.current = objetivo;
    const mover = (ev) => {
      const q = punteroCanvas(ev, canvas);
      objetivo.x = Math.max(0.06, Math.min(0.94, q.x / canvas.clientWidth));
      objetivo.y = Math.max(0.06, Math.min(0.94, q.y / canvas.clientHeight));
      objetivo.vx = 0;
      objetivo.vy = 0;
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
    const A = m1.current;
    const B = m2.current;

    if (tour.pasoId !== ultPaso.current) {
      ultPaso.current = tour.pasoId;
      if (tour.jugando) aplicarTour(tour.pasoId);
    }

    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const r = Math.max(0.001, Math.hypot(dx, dy));
    const dirx = dx / r;
    const diry = dy / r;

    // polos enfrentados según qué extremo está más cerca del otro imán
    const poloA = A.invertido ? 'S' : 'N'; // extremo derecho de A
    const poloB = B.invertido ? 'N' : 'S'; // extremo izquierdo de B
    const repulsion = poloA === poloB;
    const tipo = repulsion ? 'REPULSIÓN' : 'ATRACCIÓN';

    const rC = Math.max(R_CONTACTO, r);
    const f = Math.min(1.6, K / (rC * rC));

    // contacto: no se superponen
    if (r < R_CONTACTO) {
      A.x = B.x - dirx * R_CONTACTO;
      A.y = B.y - diry * R_CONTACTO;
      const v1r = A.vx * dirx + A.vy * diry;
      A.vx -= v1r * dirx;
      A.vy -= v1r * diry;
      const v2r = B.vx * dirx + B.vy * diry;
      B.vx -= v2r * dirx;
      B.vy -= v2r * diry;
    }

    if (r < R_MAX && !arrastrando.current) {
      const dirFuerza = repulsion ? -1 : 1;
      A.vx += dirFuerza * dirx * f * dt;
      A.vy += dirFuerza * diry * f * dt;
      B.vx -= dirFuerza * dirx * f * dt;
      B.vy -= dirFuerza * diry * f * dt;
    }
    if (!arrastrando.current) {
      const vA = Math.hypot(A.vx, A.vy);
      const vB = Math.hypot(B.vx, B.vy);
      if (vA > 0.5) { A.vx = (A.vx / vA) * 0.5; A.vy = (A.vy / vA) * 0.5; }
      if (vB > 0.5) { B.vx = (B.vx / vB) * 0.5; B.vy = (B.vy / vB) * 0.5; }
      A.x += A.vx * dt;
      A.y += A.vy * dt;
      B.x += B.vx * dt;
      B.y += B.vy * dt;
      A.x = Math.max(0.06, Math.min(0.94, A.x));
      A.y = Math.max(0.06, Math.min(0.94, A.y));
      B.x = Math.max(0.06, Math.min(0.94, B.x));
      B.y = Math.max(0.06, Math.min(0.94, B.y));
    }

    const fuerzaN = r < R_MAX ? +(f * 4).toFixed(1) : 0;
    if (info.tipo !== tipo || info.polos !== `${poloA}—${poloB}` || info.fuerza !== fuerzaN) {
      setInfo({ tipo, polos: `${poloA}—${poloB}`, fuerza: fuerzaN });
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

    const sizeIman = Math.min(w, h);
    const resaltarA = poloA;
    const resaltarB = poloB;
    dibujarIman(ctx, A.x * w, A.y * h, sizeIman * 0.22, sizeIman * 0.09, 0, resaltarA);
    dibujarIman(ctx, B.x * w, B.y * h, sizeIman * 0.22, sizeIman * 0.09, 0, resaltarB);

    // flecha de fuerza entre imanes
    if (r < R_MAX) {
      const ax = A.x * w + dirx * sizeIman * 0.13;
      const ay = A.y * h + diry * sizeIman * 0.13;
      const bx = B.x * w - dirx * sizeIman * 0.13;
      const by = B.y * h - diry * sizeIman * 0.13;
      const color = repulsion ? '#dc2626' : '#16a34a';
      const texto = `${repulsion ? 'repelen' : 'atraen'} · ${fuerzaN} N`;
      dibujarFlechaValor(ctx, ax, ay, bx, by, color, texto);
    }

    if (arrastrando.current) {
      const c = arrastrando.current;
      ctx.strokeStyle = 'rgba(220,38,38,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(c.x * w, c.y * h, 55, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Arrastrá los imanes · tocá ⟳ para girar el polo enfrentado', w / 2, h - 10);
  }, [info, tour.jugando, tour.pasoId]);

  return (
    <div>
      <PanelAula
        objetivo="Acercá dos imanes para descubrir cuándo se atraen y cuándo se repelen."
        tour={tour}
        onReiniciar={reiniciar}
      />

      <div className="sim-controles">
        <button className="btn btn-primary" onClick={() => girar(m1)}>⟳ Girar imán izquierdo</button>
        <button className="btn btn-primary" onClick={() => girar(m2)}>⟳ Girar imán derecho</button>
        <span className="muted">Tocá cada imán y arrastralo por la mesa.</span>
      </div>

      <div className="sim-lienzo">
        <canvas ref={canvasRef} onPointerDown={enPuntero} />
      </div>

      <div className="sim-resultados">
        <span>
          Polos enfrentados: <strong>{info.polos}</strong>
        </span>
        <span className={info.tipo === 'REPULSIÓN' ? 'warn' : info.tipo === 'ATRACCIÓN' ? 'ok' : ''}>
          Interacción: <strong>{info.tipo}</strong> {info.fuerza > 0 ? `· ${info.fuerza} N` : ''}
        </span>
      </div>

      <div className="termo-retro ok">
        <strong>Conclusión</strong>
        <p>
          Los polos <b>distintos</b> (N–S) se atraen y los polos <b>iguales</b> (N–N o S–S) se repelen. La fuerza entre
          imanes cambia según la distancia y la orientación de los polos.
        </p>
      </div>
    </div>
  );
}