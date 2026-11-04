import { useEffect, useRef, useState } from 'react';
import { R } from './data.js';
import { Grafico, PanelVariables, ModoSelector, Retro, Dato, Indice } from './ui.jsx';

const N = 1;
const CV = (3 / 2) * R;
const T0 = 300;
const V0 = 0.001; // m³

export default function SimPrimeraLey() {
  const canvasRef = useRef(null);
  const [Q, setQ] = useState(500);
  const [W, setW] = useState(300);
  const [corriendo, setCorriendo] = useState(false);
  const [modo, setModo] = useState('guiado');
  const [puntos, setPuntos] = useState(0);
  const [retroCalc, setRetroCalc] = useState(null);
  const [esa, setEsa] = useState('');
  const [estado, setEstado] = useState({ Q: 0, W: 0, U: 0, V: V0, T: T0, serie: [{ x: V0 * 1000, y: barra(N, T0, V0) }], f: 0 });

  const ref = useRef(estado);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  function aplicar(tipo) {
    const s = ref.current;
    if (tipo === 'calor') s.Q += Q;
    if (tipo === 'enfriar') s.Q -= Q;
    if (tipo === 'expandir') s.W += W;
    if (tipo === 'comprimir') s.W -= W;
    s.V = Math.min(0.003, Math.max(0.0004, s.V + (tipo === 'expandir' ? 0.0001 : tipo === 'comprimir' ? -0.0001 : 0)));
    s.U = s.Q - s.W;
    s.T = T0 + s.U / (N * CV);
    s.serie = [...s.serie.slice(-60), { x: s.V * 1000, y: barra(N, s.T, s.V) }];
    setEstado({ ...s });
  }

  function barra(n, T, V) {
    return (n * R * T) / V;
  }

  const s = ref.current;

  useEffect(() => {
    let raf;
    const frame = () => {
      const st = ref.current;
      st.f += 1;
      dibujar(ctx(st.f));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function ctx(f) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }

  function dibujar(c) {
    if (!c) return;
    const s = ref.current;
    const w = canvasRef.current.clientWidth;
    const h = canvasRef.current.clientHeight;
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#f8fafc';
    c.fillRect(0, 0, w, h);

    const paredI = 40;
    const ancho = w - 120;
    const tope = 60;
    const base = h - 60;
    const fracV = (s.V - 0.0004) / (0.003 - 0.0004);
    const yPiston = tope + (base - tope) * (1 - fracV);

    // cilindro
    c.strokeStyle = '#64748b';
    c.lineWidth = 3;
    c.strokeRect(paredI, tope, ancho + 20, base - tope);

    // gas
    c.fillStyle = 'rgba(147,197,253,0.5)';
    c.fillRect(paredI + 3, tope + 3, ancho + 14, yPiston - tope - 3);
    const nP = 40;
    const vel = Math.sqrt(Math.max(0.001, s.T / T0));
    for (let i = 0; i < nP; i++) {
      const px = paredI + 12 + ((Math.sin(s.f / (30 / vel) + i) * 0.5 + 0.5) * (ancho - 20));
      const py = tope + 10 + ((Math.cos(s.f / (40 / vel) + i * 1.3) * 0.5 + 0.5) * Math.max(4, yPiston - tope - 16));
      c.fillStyle = s.T > T0 * 1.3 ? '#ef4444' : s.T < T0 * 0.7 ? '#3b82f6' : '#64748b';
      c.beginPath();
      c.arc(px, py, 2.5, 0, Math.PI * 2);
      c.fill();
    }

    // pistón
    c.fillStyle = '#334155';
    c.fillRect(paredI, yPiston - 8, ancho + 20, 10);

    // termómetro
    c.fillStyle = '#e2e8f0';
    c.fillRect(w - 34, tope, 12, base - tope);
    c.fillStyle = '#dc2626';
    const esc = (base - tope) / 600;
    c.fillRect(w - 34, base - Math.min(600, s.T) * esc, 12, Math.min(600, s.T) * esc);

    // datos
    c.fillStyle = '#0f172a';
    c.font = 'bold 13px sans-serif';
    c.textAlign = 'left';
    c.fillText(`Q = ${s.Q.toFixed(0)} J  ·  W = ${s.W.toFixed(0)} J  ·  ΔU = ${s.U.toFixed(0)} J`, 12, 24);
    c.fillStyle = '#475569';
    c.font = '12px sans-serif';
    c.fillText(`T = ${s.T.toFixed(0)} K  ·  P = ${(s.serie[s.serie.length - 1]?.y || 0).toFixed(0)} Pa  ·  V = ${(s.V * 1000).toFixed(2)} L`, 12, 42);
  }

  function comprobar() {
    const r = Math.abs(Number(esa.replace(',', '.')) - 300) < 1e-6;
    if (r) setPuntos((p) => p + 15);
    setRetroCalc(r);
  }

  return (
    <div>
      <Indice puntos={puntos} meta="Comprender la conservación de la energía: ΔU = Q − W." />
      <ModoSelector modo={modo} setModo={setModo} desafio="Resolvé el cálculo de ΔU del desafío." />
      <div className="alerta info">{modo === 'guiado' ? 'Usá los botones para sumar calor o trabajo y observá cómo se conserva la energía (ΔU = Q − W).' : 'Explorá combinaciones de Q y W hasta internalizar el signo de cada término.'}</div>

      <div className="sim-controles termo-controls">
        <label>Calor a transferir:<br /><Dato etiqueta="Q" valor={`${Q} J`} /><input type="range" min="100" max="1000" step="50" value={Q} onChange={(e) => setQ(Number(e.target.value))} /></label>
        <label>Trabajo a transferir:<br /><Dato etiqueta="W" valor={`${W} J`} /><input type="range" min="100" max="1000" step="50" value={W} onChange={(e) => setW(Number(e.target.value))} /></label>
      </div>

      <div className="termo-acciones">
        <button className="btn" onClick={() => aplicar('calor')}>🔥 +Q al sistema</button>
        <button className="btn" onClick={() => aplicar('enfriar')}>❄️ −Q al sistema</button>
        <button className="btn" onClick={() => aplicar('expandir')}>⬆️ Expandir (W &gt; 0)</button>
        <button className="btn" onClick={() => aplicar('comprimir')}>⬇️ Comprimir (W &lt; 0)</button>
        <button className="btn" onClick={() => { ref.current = estadoRefFresco(); setEstado(ref.current); }}>Reiniciar</button>
      </div>

      <div className="termo-acciones">
        <Dato etiqueta="Q acumulado" valor={`${s.Q} J`} />
        <Dato etiqueta="W acumulado" valor={`${s.W} J`} />
        <Dato etiqueta="ΔU = Q − W" valor={`${s.U} J`} />
        <Dato etiqueta="Temperatura" valor={`${s.T.toFixed(0)} K`} />
        <Dato etiqueta="Presión" valor={`${(s.serie[s.serie.length - 1]?.y || 0).toFixed(0)} Pa`} />
      </div>

      <div className="termo-lienzo"><canvas ref={canvasRef} /></div>

      <div className="card termo-seccion">
        <h3>📈 Presión vs. volumen (P-V)</h3>
        <Grafico series={[{ nombre: 'Camino del estado', puntos: s.serie, color: '#2563eb' }]} xLabel="Volumen (L)" yLabel="Presión (Pa)" />
      </div>

      <PanelVariables
        control={['Calor transferido Q', 'Trabajo W (expandir o comprimir)']}
        dependiente={['ΔU (energía interna)', 'Temperatura', 'Presión', 'Volumen']}
        constantes={['Cantidad de gas (1 mol)', 'R = 8,314 J/(mol·K)', 'Cv = (3/2)·R']}
      />

      <div className="card termo-seccion">
        <h3>🏅 Desafío</h3>
        <p>Se suministran <strong>500 J</strong> de calor al gas y este realiza <strong>200 J</strong> de trabajo. ¿Cuál es el cambio de energía interna ΔU?</p>
        <div className="termo-num">
          <input value={esa} onChange={(e) => setEsa(e.target.value)} placeholder="Resultado en J…" />
          <span className="pill">J</span>
          <button className="btn btn-primary" onClick={comprobar}>Comprobar</button>
        </div>
        <Retro estado={retroCalc === true ? 'ok' : retroCalc === false ? 'error' : null} explicacion="ΔU = Q − W = 500 − 200 = 300 J. La energía interna aumentó porque entró más calor del que salió como trabajo." pista="Recordá el SIGNO: el gasto del sistema resta: ΔU = Q − W." />
      </div>
    </div>
  );

  function estadoRefFresco() {
    return {
      Q: 0, W: 0, U: 0, V: V0, T: T0, f: 0,
      serie: [{ x: V0 * 1000, y: barra(N, T0, V0) }],
    };
  }
}