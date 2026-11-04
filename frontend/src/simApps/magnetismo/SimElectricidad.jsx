import { useCallback, useEffect, useRef, useState } from 'react';
import { useAnimacion, useCanvas, escenaFondo, dibujarDinamometro, EscalaIntensidad } from './ui.jsx';
import { useTour, PanelAula } from './Tour.jsx';

const PASOS = [
  { id: 'intro', texto: 'Un electroimán es un imán que se enciende y se apaga: el que produce la corriente eléctrica.', duracion: 4000 },
  { id: 'apagado', texto: 'Con el interruptor abierto no circula corriente: el imán no actúa (fuerza 0 N).', duracion: 4200 },
  { id: 'debil', texto: 'Poca corriente, electroimán débil: atrae al clip con poca fuerza.', duracion: 4500 },
  { id: 'fuerte', texto: 'Más voltaje → más corriente → campo muchísimo más fuerte.', duracion: 4800 },
  { id: 'vueltas', texto: 'Más espiras de cable en la bobina → más magnetismo con la misma corriente.', duracion: 5000 },
  { id: 'revertir', texto: 'Si invertimos la pila, los polos del electroimán se intercambian: N pasa a S.', duracion: 5200 },
  { id: 'cierre', texto: 'Las grúas de chatarra, los timbres y los motores usan electroimanes todos los días.', duracion: 4200 },
];

const ESCENARIOS = [
  { id: 'apagado', nombre: '🔌 Interruptor abierto', encendido: false, vueltas: 12, voltaje: 3, invertir: false },
  { id: 'debil', nombre: '⚡ Corriente débil', encendido: true, vueltas: 10, voltaje: 2, invertir: false },
  { id: 'fuerte', nombre: '💪 Más voltaje', encendido: true, vueltas: 12, voltaje: 12, invertir: false },
  { id: 'vueltas', nombre: '🌀 Más espiras', encendido: true, vueltas: 30, voltaje: 4, invertir: false },
  { id: 'revertir', nombre: '🔁 Invertir pila', encendido: true, vueltas: 12, voltaje: 9, invertir: true },
];

const LIMADURAS = [];
for (let i = 0; i < 8; i++) {
  for (let j = 0; j < 4; j++) {
    LIMADURAS.push([40 + i * 62, 60 + j * 46]);
  }
}

export default function SimElectricidad() {
  const canvasRef = useCanvas(() => {}, []);
  const tour = useTour(PASOS);
  const tourRef = useRef(tour);
  tourRef.current = tour;

  const valores = useRef({ encendido: true, vueltas: 12, voltaje: 3, inverso: false });
  const [estado, setEstado] = useState({ encendido: false, vueltas: 12, voltaje: 3, inverso: false });
  const [bateria, setBateria] = useState(100);
  const ultPaso = useRef(null);
  const [lectura, setLectura] = useState({ fuerza: 0, N: 'S', S: 'N', activo: false });

  const aplicar = useCallback((esc) => {
    valores.current = { encendido: esc.encendido, vueltas: esc.vueltas, voltaje: esc.voltaje, inverso: esc.invertir };
    setEstado({ ...valores.current });
  }, []);

  useEffect(() => {
    if (!tour.jugando) return;
    if (tour.pasoId === 'apagado') aplicar(ESCENARIOS[0]);
    else if (tour.pasoId === 'debil') aplicar(ESCENARIOS[1]);
    else if (tour.pasoId === 'fuerte') aplicar(ESCENARIOS[2]);
    else if (tour.pasoId === 'vueltas') aplicar(ESCENARIOS[3]);
    else if (tour.pasoId === 'revertir') aplicar(ESCENARIOS[4]);
  }, [tour.pasoId, tour.jugando, aplicar]);

  useEffect(() => {
    if (!valores.current.encendido) return;
    const t = setInterval(() => setBateria((b) => Math.max(0, b - (valores.current.vueltas / 20) * valores.current.voltaje * 0.04)), 900);
    return () => clearInterval(t);
  }, [estado.encendido]);

  useEffect(() => {
    if (bateria === 0) {
      valores.current.encendido = false;
      setEstado((s) => ({ ...s, encendido: false }));
    }
  }, [bateria]);

  function reiniciar() {
    setBateria(100);
    setEstado({ encendido: false, vueltas: 12, voltaje: 3, inverso: false });
    valores.current = { encendido: false, vueltas: 12, voltaje: 3, inverso: false };
    tour.reiniciar();
  }

  const toggle = () => {
    valores.current.encendido = !valores.current.encendido;
    setEstado((s) => ({ ...s, encendido: valores.current.encendido }));
  };

  const potencia = (estado.encendido && bateria > 0) ? Math.min(1, estado.voltaje / 12 + estado.vueltas / 30) : 0;

  useAnimacion((dt) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    const { vueltas, voltaje, encendido, inverso } = estado;
    const activo = encendido && bateria > 0;
    const pot = activo ? Math.min(1, voltaje / 12 + vueltas / 30) : 0;
    const fuerzaN = activo ? +(0.6 + pot * 2.4).toFixed(2) : 0;
    const poloN = inverso ? 'S' : 'N';
    const poloS = inverso ? 'N' : 'S';
    if (lectura.fuerza !== fuerzaN || lectura.activo !== activo || lectura.N !== poloN) {
      setLectura({ fuerza: fuerzaN, N: poloN, S: poloS, activo: activo });
    }

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    escenaFondo(ctx, w, h);

    const cy = h * 0.3;

    // limaduras que se alinean según potencia
    for (const [x, y] of LIMADURAS) {
      const ladoX = x < w / 2 ? -1 : 1;
      const ang = pot > 0.2 ? 0 : x * 0.3;
      const L = 4 + pot * 18;
      ctx.strokeStyle = `rgba(59,130,246,${0.2 + pot * 0.8})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      const dx = x < w / 2 ? Math.cos(ang) * L * ladoX : Math.cos(ang + Math.PI) * L * ladoX;
      const dy = Math.sin(ang) * L;
      ctx.moveTo(x - dx, y - dy);
      ctx.lineTo(x + dx, y + dy);
      ctx.stroke();
    }

    // marco del soporte
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 150, cy - 60);
    ctx.lineTo(w / 2 + 150, cy - 60);
    ctx.stroke();

    // núcleo de hierro
    ctx.fillStyle = activo ? '#64748b' : '#94a3b8';
    ctx.fillRect(w / 2 - 110, cy - 14, 220, 28);

    // bobina (espiras)
    ctx.strokeStyle = activo ? '#b45309' : '#d6d3d1';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    for (let i = 0; i < vueltas; i++) {
      const x = w / 2 - 100 + i * (200 / Math.max(1, vueltas - 1));
      ctx.beginPath();
      ctx.moveTo(x, cy - 20);
      ctx.lineTo(x, cy + 20);
      ctx.stroke();
    }

    // polos visibles cuando está activo
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    if (activo) {
      ctx.fillStyle = '#dc2626';
      ctx.fillText(poloN, w / 2 + 122, cy + 8);
      ctx.fillStyle = '#2563eb';
      ctx.fillText(poloS, w / 2 - 122, cy + 8);
    } else {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('?', w / 2 + 122, cy + 8);
      ctx.fillText('?', w / 2 - 122, cy + 8);
    }

    // clip colgante con resorte: se estira según la fuerza
    const clipY = pot > 0 ? cy + 60 + pot * 90 : cy + 62;
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const resorte = [];
    for (let k = 0; k <= 8; k++) {
      const sx = w / 2 + k / 8 * (pot * 70);
      const sy = cy + 14 + (k / 8) * (clipY - cy - 14);
      resorte.push([sx, sy]);
    }
    for (let k = 0; k < resorte.length; k++) {
      const [sx, sy] = resorte[k];
      const off = k % 2 ? 10 : -10;
      if (k === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx + off, sy);
    }
    ctx.stroke();
    ctx.font = '26px sans-serif';
    ctx.fillText('📎', w / 2 + pot * 70, clipY + 14);

    // dinamómetro
    dibujarDinamometro(ctx, w * 0.68, h * 0.12, fuerzaN, 3);

    if (pot === 0) {
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText('El electroimán está apagado: el clip cuelga sin atraerse.', w / 2, h - 40);
    }

    // cable a la batería
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w / 2 + 110, cy + 14);
    ctx.lineTo(w / 2 + 150, cy + 70);
    ctx.lineTo(w / 2 + 150, h - 110);
    ctx.stroke();

    // batería
    const bx = w / 2 + 122;
    const by = h - 105;
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.roundRect(bx, by, 56, 34, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.roundRect(bx, by - 4, 14, 8, 2);
    ctx.fill();
    const nivel = bateria / 100 * 46;
    ctx.fillStyle = activo ? '#16a34a' : '#94a3b8';
    ctx.fillRect(bx + 5, by + 5, Math.max(0, nivel - 10), 24);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔋', bx, by - 14);
    ctx.fillText(`${Math.round(bateria)}%`, bx + 28, by + 46);

    // interruptor
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w / 2 + 150, h - 110);
    ctx.lineTo(w / 2 + 150, h - 60);
    ctx.stroke();
  }, [estado, bateria, lectura, tour.jugando, tour.pasoId]);

  return (
    <div>
      <PanelAula
        objetivo="Armá un electroimán con una bobina y una pila: controlá voltaje y espiras."
        tour={tour}
        onReiniciar={reiniciar}
      />

      <div className="sim-controles">
        <button className={`btn ${estado.encendido ? 'activo' : ''}`} onClick={toggle}>
          {estado.encendido ? '⏻ APAGAR' : '⏻ ENCENDER'}
        </button>
        <button className="btn" onClick={() => setBateria(100)}>🔋 Recargar batería</button>
        <label>
          Espiras de la bobina
          <input type="range" min="4" max="30" step="1"
            value={estado.vueltas}
            onChange={(e) => {
              const v = Number(e.target.value);
              valores.current.vueltas = v;
              setEstado((s) => ({ ...s, vueltas: v }));
            }} />
          <strong>{estado.vueltas}</strong>
        </label>
        <label>
          Voltaje de la pila
          <input type="range" min="1" max="12" step="1"
            value={estado.voltaje}
            onChange={(e) => {
              const v = Number(e.target.value);
              valores.current.voltaje = v;
              setEstado((s) => ({ ...s, voltaje: v }));
            }} />
          <strong>{estado.voltaje} V</strong>
        </label>
        <label className="chk">
          <input type="checkbox" checked={estado.inverso}
            onChange={(e) => setEstado((s) => ({ ...s, inverso: e.target.checked }))} />
          Invertir pila (cambiar polos)
        </label>
      </div>

      <div className="sim-controles">
        <span className="muted">Escenarios:</span>
        {ESCENARIOS.map((e) => (
          <button key={e.id} className="btn" onClick={() => aplicar(e)}>
            {e.nombre}
          </button>
        ))}
      </div>

      <div className="sim-resultados">
        <span>
          Estado: {lectura.activo ? <strong className="ok">ACTIVO</strong> : <strong>APAGADO</strong>}
        </span>
        <span>
          Polos: <strong>{lectura.N}</strong>–<strong>{lectura.S}</strong>
        </span>
        <span>
          Fuerza: <strong>{lectura.fuerza} N</strong>
        </span>
        <EscalaIntensidad valor={lectura.fuerza / 3} />
      </div>

      <div className="sim-lienzo">
        <canvas ref={canvasRef} />
      </div>

      <div className="termo-retro ok">
        <strong>Conclusión</strong>
        <p>
          La corriente eléctrica que pasa por una bobina genera un campo magnético. A mayor <b>voltaje</b> o más
          <b> espiras</b>, más fuerte es el electroimán. Y como el campo se apaga con la corriente, es un imán que
          podemos encender a voluntad.
        </p>
      </div>
    </div>
  );
}