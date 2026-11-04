import { useRef, useState } from 'react';
import { useAnimacion, useCanvas, campoDipolo, dibujarBrujula, escenaFondo, medidorCampo } from './ui.jsx';
import { useTour, PanelAula } from './Tour.jsx';

const PASOS = [
  { id: 'intro', texto: 'La Tierra se comporta como un imán gigante: tiene un campo magnético que la rodea por completo.', duracion: 4000 },
  { id: 'norte', texto: 'Viajemos de un polo al otro: la brújula acompaña el viaje girando según el campo terrestre.', duracion: 6000 },
  { id: 'polos', texto: 'Cerca del polo sur, el norte de la brújula apunta hacia abajo: el campo se "sumerge" en el planeta.', duracion: 5500 },
  { id: 'dato', texto: 'Dato curioso: el polo norte magnético está cerca del polo sur geográfico. ¡El imán está invertido!', duracion: 5500 },
  { id: 'cierre', texto: 'Gracias a este campo, la brújula siempre señala el norte... aunque sea un imán "patas arriba".', duracion: 4200 },
];

export default function SimTierra() {
  const canvasRef = useCanvas(() => {}, []);
  const tour = useTour(PASOS);
  const tourRef = useRef(tour);
  tourRef.current = tour;

  const [lat, setLat] = useState(0);
  const [flip, setFlip] = useState(false);
  const viajero = useRef(0); // latitud animada
  const ang = useRef(0);
  const ultPaso = useRef(null);
  const [lectura, setLectura] = useState({ grados: 0, ut: 0 });

  function reiniciar() {
    viajero.current = 0;
    setLat(0);
    setFlip(false);
    ang.current = 0;
    tour.reiniciar();
  }

  useAnimacion((dt) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    if (tour.pasoId !== ultPaso.current) {
      ultPaso.current = tour.pasoId;
      if (tour.pasoId === 'norte') viajero.current = -70;
      if (tour.pasoId === 'polos') viajero.current = -30;
    }

    if (tour.jugando && tour.pasoId === 'norte') {
      viajero.current = -70 + tour.prog * 140;
      setLat(Math.round(viajero.current));
    } else if (tour.jugando && tour.pasoId === 'polos') {
      viajero.current -= dt * 26;
      if (viajero.current < -60) viajero.current = 60;
      setLat(Math.round(viajero.current));
    }

    const cx = w / 2;
    const cy = h / 2;
    const R = 120;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    escenaFondo(ctx, w, h);

    // líneas de campo del planeta
    ctx.strokeStyle = 'rgba(59,130,246,0.5)';
    ctx.lineWidth = 2;
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI;
      const r1 = R + 40;
      const topX = cx + Math.cos(a) * r1;
      const botX = cx - Math.cos(a) * r1;
      ctx.beginPath();
      ctx.moveTo(topX, cy - R - 30);
      ctx.quadraticCurveTo(topX, cy, botX, cy + R + 30);
      ctx.stroke();
    }

    // flechas N→S sobre las líneas (movimiento)
    const t = performance.now() / 1000;
    for (let k = 0; k < 6; k++) {
      const f = ((t * 0.3 + k * 0.4) % 1) * 0.9;
      const a = (k / 6) * Math.PI + Math.PI / 2;
      const px = cx + Math.cos(a) * (R + 20 + f * 60);
      const py = cy - Math.sin(a) * (R + 20 + f * 60);
      ctx.fillStyle = 'rgba(29,78,216,0.7)';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('▾', px, py);
    }

    // planeta
    const grad = ctx.createRadialGradient(cx - 30, cy - 30, 20, cx, cy, R);
    grad.addColorStop(0, '#60a5fa');
    grad.addColorStop(1, '#1d4ed8');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 3;
    ctx.stroke();

    // eje y polos geográficos
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx, cy - R, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy + R, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('N(geo)', cx, cy - R - 14);
    ctx.fillText('S(geo)', cx, cy + R + 20);

    // viajero
    const rad = (viajero.current * Math.PI) / 180;
    const mx = cx + Math.sin(rad) * (R + 40);
    const my = cy - Math.cos(rad) * (R + 40);

    const f = campoDipolo(mx, my, cx, cy, 0);
    const objetivo = Math.atan2(f.By, f.Bx);
    let d = objetivo - ang.current;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    ang.current += d * Math.min(1, dt * 8);

    // trayectoria sombreada
    ctx.strokeStyle = 'rgba(148,163,184,0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 6]);
    ctx.beginPath();
    ctx.arc(cx, cy, R + 40, Math.PI, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    dibujarBrujula(ctx, mx, my, ang.current, 1.2);
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`Viajero en latitud ${Math.round(viajero.current)}°`, mx, my + 38);

    const ut = Math.round(Math.abs(f.By) * 1200) + 40;
    const grados = Math.round(((ang.current * 180) / Math.PI + 360) % 360);
    if (Math.abs(lectura.ut - ut) > 2 || Math.abs(lectura.grados - grados) > 2) {
      setLectura({ ut, grados });
    }
    medidorCampo(ctx, 16, 16, w * 0.28, 16, ut, 300, 'μT');
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.fillText(`Brújula orientada a ${grados}°`, 16, 54);
  }, [tour.jugando, tour.pasoId, lat, flip, lectura]);

  return (
    <div>
      <PanelAula
        objetivo="Descubrí por qué la brújula apunta al norte: la Tierra es un imán gigante."
        tour={tour}
        onReiniciar={reiniciar}
      />

      <div className="sim-controles">
        <label>
          Posición del viajero (latitud)
          <input
            type="range"
            min="-80"
            max="80"
            step="2"
            value={Math.round(viajero.current)}
            onChange={(e) => {
              viajero.current = Number(e.target.value);
              setLat(Number(e.target.value));
            }}
          />
          <strong>{Math.round(viajero.current)}°</strong>
        </label>
        <label className="chk">
          <input type="checkbox" checked={flip} onChange={(e) => setFlip(e.target.checked)} />
          Mostrar el polo norte magnético
        </label>
      </div>

      <div className="sim-lienzo">
        <canvas ref={canvasRef} />
      </div>

      <div className="sim-resultados">
        <span>
          Campo en el viajero: <strong>{lectura.ut} μT</strong> · aguja en <strong>{lectura.grados}°</strong>
        </span>
        <span>
          La Tierra es un <strong>imán gigante</strong>: su campo protege de las partículas del Sol.
        </span>
      </div>

      {flip && (
        <div className="termo-retro ok">
          <strong>El truco de los polos</strong>
          <p>
            El polo <b>norte magnético</b> está cerca del <b>sur geográfico</b>. Por eso el norte de la brújula apunta
            "al norte": se siente atraído hacia el sur magnético del planeta.
          </p>
        </div>
      )}

      {!flip && (
        <div className="termo-retro ok">
          <strong>Conclusión</strong>
          <p>
            La Tierra genera un campo magnético que orienta las brújulas. Viajar con una brújula funciona porque ese
            campo existe en todo el planeta y la aguja se alinea con él.
          </p>
        </div>
      )}
    </div>
  );
}