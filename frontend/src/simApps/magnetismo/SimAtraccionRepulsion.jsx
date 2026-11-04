import { useRef, useState } from 'react';
import { useAnimacion, useCanvas, punteroCanvas, dibujarIman, escenaFondo, dibujarFlechaValor } from './ui.jsx';
import { useTour, PanelAula } from './Tour.jsx';

const PASOS = [
  { id: 'intro', texto: 'Acá vas a ver la regla de oro del magnetismo: cada interacción depende de los polos que se enfrentan.', duracion: 3800 },
  { id: 'atrac', texto: 'Polos distintos (N–S): los imanes se atraen y se pegan. La fuerza es de atracción.', duracion: 6000 },
  { id: 'repul', texto: 'Polos iguales (N–N): los imanes se repelen y no pueden juntarse. La fuerza es de repulsión.', duracion: 6000 },
  { id: 'cierre', texto: 'Atracción y repulsión son la base de motores, parlantes y trenes de levitación.', duracion: 4000 },
];

const K = 0.35;
const R_MAX = 0.6;
const R_CONTACTO = 0.17;

const ESCENARIOS = [
  { id: 'atrac', nombre: 'N–S · Atracción', emoji: '🤝', invertL: false, invertR: false },
  { id: 'repel1', nombre: 'N–N · Repulsión', emoji: '🚫', invertL: false, invertR: true },
  { id: 'repel2', nombre: 'S–S · Repulsión', emoji: '🚫', invertL: true, invertR: false },
];

export default function SimAtraccionRepulsion() {
  const canvasRef = useCanvas(() => {}, []);
  const tour = useTour(PASOS);
  const tourRef = useRef(tour);
  tourRef.current = tour;

  const m1 = useRef({ x: 0.3, y: 0.5, vx: 0, vy: 0, invertido: false });
  const m2 = useRef({ x: 0.68, y: 0.5, vx: 0, vy: 0, invertido: false });
  const arrastrando = useRef(null);
  const ultPaso = useRef(null);
  const [info, setInfo] = useState({ tipo: '—', polos: '—', fuerza: 0 });
  const [registros, setRegistros] = useState([]);

  function configurar(invertL, invertR, x1 = 0.3, x2 = 0.68) {
    m1.current = { x: x1, y: 0.5, vx: 0, vy: 0, invertido: invertL };
    m2.current = { x: x2, y: 0.5, vx: 0, vy: 0, invertido: invertR };
  }

  function escenario(id) {
    const e = ESCENARIOS.find((s) => s.id === id);
    configurar(e.invertL, e.invertR);
    const polos = `${e.invertL ? 'S' : 'N'}—${e.invertR ? 'N' : 'S'}`;
    const tipo = e.id === 'atrac' ? 'ATRACCIÓN' : 'REPULSIÓN';
    setRegistros((r) => [...r.slice(-4), { nombre: e.nombre, polos, tipo }]);
  }

  function reiniciar() {
    configurar(false, false);
    setRegistros([]);
    tour.reiniciar();
  }

  function enPuntero(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const p = punteroCanvas(e, canvas);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const objetivo =
      Math.hypot(p.x - m1.current.x * w, p.y - m1.current.y * h) < 55
        ? m1.current
        : Math.hypot(p.x - m2.current.x * w, p.y - m2.current.y * h) < 55
          ? m2.current
          : null;
    if (!objetivo) return;
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
      if (tour.jugando && tour.pasoId === 'atrac') escenario('atrac');
      if (tour.jugando && tour.pasoId === 'repul') escenario('repel1');
    }

    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const r = Math.max(0.001, Math.hypot(dx, dy));
    const dirx = dx / r;
    const diry = dy / r;
    const poloA = A.invertido ? 'S' : 'N';
    const poloB = B.invertido ? 'N' : 'S';
    const repulsion = poloA === poloB;
    const tipo = repulsion ? 'REPULSIÓN' : 'ATRACCIÓN';
    const rC = Math.max(R_CONTACTO, r);
    const f = Math.min(1.6, K / (rC * rC));

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
      const sf = repulsion ? -1 : 1;
      A.vx += sf * dirx * f * dt;
      A.vy += sf * diry * f * dt;
      B.vx -= sf * dirx * f * dt;
      B.vy -= sf * diry * f * dt;
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

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    escenaFondo(ctx, w, h);

    const sizeIman = Math.min(w, h);
    dibujarIman(ctx, A.x * w, A.y * h, sizeIman * 0.24, sizeIman * 0.1, 0, poloA);
    dibujarIman(ctx, B.x * w, B.y * h, sizeIman * 0.24, sizeIman * 0.1, 0, poloB);

    if (r < R_MAX) {
      const color = repulsion ? '#dc2626' : '#16a34a';
      const ax = A.x * w + dirx * sizeIman * 0.14;
      const ay = A.y * h + diry * sizeIman * 0.14;
      const bx = B.x * w - dirx * sizeIman * 0.14;
      const by = B.y * h - diry * sizeIman * 0.14;
      dibujarFlechaValor(ctx, ax, ay, bx, by, color, `${tipo} · ${fuerzaN} N`);
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
    ctx.fillText('Elegí un escenario o arrastrá los imanes con el mouse', w / 2, h - 10);
  }, [info, tour.jugando, tour.pasoId]);

  return (
    <div>
      <PanelAula
        objetivo="Compará qué pasa cuando se enfrentan polos distintos y polos iguales."
        tour={tour}
        onReiniciar={reiniciar}
      />

      <div className="sim-controles">
        {ESCENARIOS.map((e) => (
          <button key={e.id} className="btn btn-primary" onClick={() => escenario(e.id)}>
            {e.emoji} {e.nombre}
          </button>
        ))}
      </div>

      <div className="sim-lienzo">
        <canvas ref={canvasRef} onPointerDown={enPuntero} />
      </div>

      <div className="sim-resultados">
        <span>
          Polos enfrentados: <strong>{info.polos}</strong>
        </span>
        <span className={info.tipo === 'REPULSIÓN' ? 'warn' : info.tipo === 'ATRACCIÓN' ? 'ok' : ''}>
          <strong>{info.tipo}</strong> · Fuerza: <strong>{info.fuerza} N</strong>
        </span>
      </div>

      {registros.length > 0 && (
        <div className="magneto-tabla-registros">
          <h4>Comparación de ensayos</h4>
          <table className="termo-tabla">
            <thead>
              <tr>
                <th>Escenario</th>
                <th>Polos</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r, i) => (
                <tr key={i}>
                  <td>{r.nombre}</td>
                  <td>{r.polos}</td>
                  <td>{r.tipo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="termo-retro ok">
        <strong>Conclusión</strong>
        <p>
          Polos <b>distintos</b> se atraen y polos <b>iguales</b> se repelen. La fuerza magnética entre imanes siempre
          actúa en línea recta entre ellos y depende de la orientación de los polos.
        </p>
      </div>
    </div>
  );
}