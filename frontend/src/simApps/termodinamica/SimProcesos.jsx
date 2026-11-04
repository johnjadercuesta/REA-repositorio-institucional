import { useEffect, useRef, useState } from 'react';
import { R } from './data.js';
import { Grafico, PanelVariables, ModoSelector, Retro, Dato, Indice } from './ui.jsx';

const N = 1;
const CV = (3 / 2) * R;
const CP = (5 / 2) * R;
const GAMMA = 5 / 3;

const T0 = 300;
const V0 = 0.001;
const P0 = (N * R * T0) / V0;

export const PROCESOS = {
  isotermico: {
    nombre: 'Isotérmico', formula: 'P·V = cte', q: 0, def: 'Temperatura constante. P varía en forma inversa con V.', color: '#2563eb',
  },
  isobarico: {
    nombre: 'Isobárico', formula: 'V/T = cte', q: 1, def: 'Presión constante. V y T aumentan juntos.', color: '#dc2626',
  },
  isocorico: {
    nombre: 'Isocórico', formula: 'P/T = cte', q: 2, def: 'Volumen constante. P crece con T.', color: '#16a34a',
  },
  adiabatico: {
    nombre: 'Adiabático', formula: 'P·V^γ = cte', q: 3, def: 'Sin calor (Q=0). Todo el cambio viene del trabajo.', color: '#9333ea',
  },
};

function estados(id, u) {
  const V = V0 * (1 + 0.6 * u);
  switch (id) {
    case 'isotermico':
      return { V, P: P0 * V0 / V, T: T0 };
    case 'isobarico':
      return { V, P: P0, T: (P0 * V) / (N * R) };
    case 'isocorico': {
      const T = T0 * (1 + 0.8 * u);
      return { V: V0, P: (N * R * T) / V0, T };
    }
    case 'adiabatico':
    default: {
      const Vv = V0 * (1 + 0.5 * u);
      return { V: Vv, P: P0 * Math.pow(V0 / Vv, GAMMA), T: T0 * Math.pow(V0 / Vv, GAMMA - 1) };
    }
  }
}

export default function SimProcesos() {
  const canvasRef = useRef(null);
  const [tipo, setTipo] = useState('isotermico');
  const [u, setU] = useState(0);
  const [series, setSeries] = useState([]);
  const [retro, setRetro] = useState(null);
  const [puntos, setPuntos] = useState(0);

  useEffect(() => {
    setSeries([{ x: V0 * 1000, y: P0 }]);
    setU(0);
  }, [tipo]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  const e = estados(tipo, u);

  function mover(nu) {
    const nu2 = Math.max(-0.95, Math.min(0.95, nu));
    setU(nu2);
    setSeries((serie) => {
      const nuevo = [...serie.slice(-160), { x: estados(tipo, nu2).V * 1000, y: estados(tipo, nu2).P }];
      return nuevo;
    });
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = canvas.getContext('2d');
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#f8fafc';
    c.fillRect(0, 0, w, h);

    const pared = 44;
    const ancho = w - 130;
    const tope = 50;
    const base = h - 50;
    const fracV = (e.V - V0 * 0.4) / (V0 * 1.6 - V0 * 0.4);
    const yP = tope + (base - tope) * (1 - Math.min(1, Math.max(0, fracV)));

    c.strokeStyle = '#64748b';
    c.lineWidth = 3;
    c.strokeRect(pared, tope, ancho + 18, base - tope);

    const col = PROCESOS[tipo].color;
    c.fillStyle = col + '44';
    c.fillRect(pared + 3, tope + 3, ancho + 12, yP - tope - 3);
    c.strokeStyle = col;
    c.strokeRect(pared + 3, tope + 3, ancho + 12, yP - tope - 3);

    for (let i = 0; i < 26; i++) {
      const px = pared + 12 + ((Math.sin(performance.now() / 220 + i * 1.6) * 0.5 + 0.5) * (ancho - 16));
      const py = tope + 8 + ((Math.cos(performance.now() / 260 + i * 2.1) * 0.5 + 0.5) * Math.max(4, yP - tope - 14));
      c.fillStyle = e.T > T0 * 1.2 ? '#ef4444' : e.T < T0 * 0.8 ? '#3b82f6' : '#64748b';
      c.beginPath();
      c.arc(px, py, 2.2, 0, Math.PI * 2);
      c.fill();
    }

    c.fillStyle = '#334155';
    c.fillRect(pared, yP - 7, ancho + 18, 9);

    c.fillStyle = '#0f172a';
    c.font = 'bold 13px sans-serif';
    c.textAlign = 'left';
    c.fillText(`${PROCESOS[tipo].nombre} · ${PROCESOS[tipo].formula}`, 12, 22);
    c.fillStyle = '#475569';
    c.font = '12px sans-serif';
    c.fillText(`P = ${(e.P / 1000).toFixed(2)} kPa · V = ${(e.V * 1000).toFixed(2)} L · T = ${e.T.toFixed(0)} K`, 12, 40);
  }, [tipo, u, e, series]);

  const q = e.V !== undefined ? computarQ(tipo, u) : null;

  return (
    <div>
      <Indice puntos={puntos} meta="Comparar los cuatro procesos termodinámicos y sus gráficas P-V." />
      <ModoSelector modo="guiado" setModo={() => {}} />

      <div className="sim-controles termo-controls">
        <label>Proceso
          <select value={tipo} onChange={(ev) => setTipo(ev.target.value)}>
            {Object.entries(PROCESOS).map(([k, p]) => <option key={k} value={k}>{p.nombre}</option>)}
          </select>
          <small className="muted">{PROCESOS[tipo].def}</small>
        </label>
        <label>Desplazamiento del pistón: <strong>{u.toFixed(2)}</strong><input type="range" min="-0.95" max="0.95" step="0.01" value={u} onChange={(ev) => mover(Number(ev.target.value))} /></label>
      </div>

      <div className="termo-lienzo"><canvas ref={canvasRef} /></div>

      <div className="termo-acciones">
        <Dato etiqueta="Presión" valor={`${(e.P / 1000).toFixed(2)} kPa`} />
        <Dato etiqueta="Volumen" valor={`${(e.V * 1000).toFixed(2)} L`} />
        <Dato etiqueta="Temperatura" valor={`${e.T.toFixed(0)} K`} />
        {q && <Dato etiqueta="Calor Q" valor={q.qText} />}
        {q && <Dato etiqueta="Trabajo W" valor={q.wText} />}
        {q && <Dato etiqueta="ΔU" valor={q.uText} />}
      </div>

      <div className="card termo-seccion">
        <h3>📈 Diagrama P-V (proceso actual)</h3>
        <Grafico series={[{ nombre: PROCESOS[tipo].nombre, puntos: series, color: PROCESOS[tipo].color }]} xLabel="V (L)" yLabel="P (Pa)" />
      </div>

      <div className="card termo-seccion">
        <h3>🧾 Comparación de procesos</h3>
        <table className="termo-tabla">
          <thead><tr><th>Proceso</th><th>Constante</th><th>Relación</th><th>Calor</th><th>Trabajo</th></tr></thead>
          <tbody>
            <tr><td>Isotérmico</td><td>T</td><td>P·V = cte</td><td>Q = W</td><td>W = nRT·ln(V₂/V₁)</td></tr>
            <tr><td>Isobárico</td><td>P</td><td>V/T = cte</td><td>Q = n·Cp·ΔT</td><td>W = P·ΔV</td></tr>
            <tr><td>Isocórico</td><td>V</td><td>P/T = cte</td><td>Q = n·Cv·ΔT</td><td>W = 0</td></tr>
            <tr><td>Adiabático</td><td>Q = 0</td><td>P·V^γ = cte</td><td>Q = 0</td><td>W = −ΔU</td></tr>
          </tbody>
        </table>
      </div>

      <PanelVariables
        control={['Tipo de proceso', 'Posición del pistón']}
        dependiente={['P', 'V', 'T', 'Q', 'W']}
        constantes={['1 mol de gas ideal', 'γ = 5/3 (monoatómico)']}
      />

      <div className="card termo-seccion">
        <h3>❓ Relacionar</h3>
        <p>Calentar un gas en un recipiente rígido es un proceso…</p>
        <div className="termo-opciones">
          <button className="btn" onClick={() => setRetro(false)}>Isotérmico</button>
          <button className="btn" onClick={() => setRetro(true)}>Isocórico</button>
          <button className="btn" onClick={() => setRetro(false)}>Isobárico</button>
        </div>
        <Retro estado={retro === true ? 'ok' : retro === false ? 'error' : null} explicacion="Volumen constante ⇒ la presión y la temperatura aumentan juntas. El trabajo es cero porque no cambia V." pista="¿Cuál de los cuatro procesos mantiene V fijo?" />
        {retro === true && <span className="alerta ok" style={{ display: 'inline-block', marginTop: 8 }}>+10 puntos</span>}
      </div>
    </div>
  );

  function computarQ(id, uu) {
    const ini = estados(id, 0);
    const fin = estados(id, uu);
    if (id === 'isotermico') {
      const W = N * R * T0 * Math.log(fin.V / ini.V);
      return { qText: `${W.toFixed(0)} J`, wText: `${W.toFixed(0)} J`, uText: '0 J' };
    }
    if (id === 'isobarico') {
      const W = P0 * (fin.V - ini.V);
      const dU = N * CV * (fin.T - ini.T);
      const Q = dU + W;
      return { qText: `${Q.toFixed(0)} J`, wText: `${W.toFixed(0)} J`, uText: `${dU.toFixed(0)} J` };
    }
    if (id === 'isocorico') {
      const dU = N * CV * (fin.T - ini.T);
      return { qText: `${dU.toFixed(0)} J`, wText: '0 J', uText: `${dU.toFixed(0)} J` };
    }
    const dU = N * CV * (fin.T - ini.T);
    return { qText: '0 J', wText: `${(-dU).toFixed(0)} J`, uText: `${dU.toFixed(0)} J` };
  }
}