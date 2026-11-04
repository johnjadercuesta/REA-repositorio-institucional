import { useEffect, useRef, useState } from 'react';
import { MATERIALES } from './data.js';
import { Grafico, PanelVariables, ModoSelector, Retro, Dato, Indice } from './ui.jsx';

const COLOR_AGUA_BASE = { agua: '208,225,255', aceite: '255,230,150', hielo: '220,235,245', aluminio: '225,228,232', hierro: '210,215,225', cobre: '240,200,180' };

export default function SimCalor() {
  const canvasRef = useRef(null);
  const [tA0, setTA0] = useState(20);
  const [tB0, setTB0] = useState(90);
  const [mA, setMA] = useState(1);
  const [mB, setMB] = useState(1);
  const [matA, setMatA] = useState('agua');
  const [matB, setMatB] = useState('cobre');
  const [corriendo, setCorriendo] = useState(false);
  const [tiempo, setTiempo] = useState(0);
  const [modo, setModo] = useState('guiado');
  const [pregunta, setPregunta] = useState(null);
  const [puntos, setPuntos] = useState(0);

  const refTA = useRef(tA0);
  const refTB = useRef(tB0);
  const estadoRef = useRef({ tA: tA0, tB: tB0, t: 0, series: { A: [], B: [] } });

  useEffect(() => {
    state().tA = tA0;
    state().tB = tB0;
    state().t = 0;
    state().series = { A: [], B: [] };
    refTA.current = tA0;
    refTB.current = tB0;
  }, [tA0, tB0, mA, mB, matA, matB]);

  function state() {
    return estadoRef.current;
  }

  const cA = MATERIALES[matA].c;
  const cB = MATERIALES[matB].c;
  const Tf = (mA * cA * tA0 + mB * cB * tB0) / (mA * cA + mB * cB);

  function ponerContacto() {
    if (corriendo) return;
    state().tA = tA0;
    state().tB = tB0;
    state().t = 0;
    state().series = { A: [], B: [] };
    refTA.current = tA0;
    refTB.current = tB0;
    setCorriendo(true);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  useEffect(() => {
    const st = estadoRef.current;
    st.tA = refTA.current;
    st.tB = refTB.current;
  }, [tA0, tB0]);

  useEffect(() => {
    let raf;
    let ultimo = performance.now();
    const TAU = 2.8;

    const frame = (ahora) => {
      const st = estadoRef.current;
      const dt = Math.min((ahora - ultimo) / 1000, 0.05);
      ultimo = ahora;
      if (corriendo) {
        st.t += dt;
        const dif = st.tB - st.tA;
        if (Math.abs(dif) > 0.02) {
          const k = TAU;
          const paso = Math.exp(-dt / k);
          st.tA = Tf + (st.tA - Tf) * paso;
          st.tB = Tf + (st.tB - Tf) * paso;
        } else {
          st.tA = Tf;
          st.tB = Tf;
          setCorriendo(false);
        }
        refTA.current = st.tA;
        refTB.current = st.tB;
        setTiempo(st.t);
        st.series.A.push({ x: st.t, y: st.tA });
        st.series.B.push({ x: st.t, y: st.tB });
        if (st.series.A.length > 400) st.series.A.shift();
        if (st.series.B.length > 400) st.series.B.shift();
      }
      dibujar(ctx, canvas, st, corriendo);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corriendo, Tf]);

  function dibujar(ctx, canvas, st, on) {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    const ancho = w / 2 - 30;
    const top = 34;
    const ab = h - 34;
    const cAcolor = COLOR_AGUA_BASE[matA];
    const cBcolor = COLOR_AGUA_BASE[matB];

    dibujarRecipiente(ctx, 20, top, ancho, ab, cAcolor, st.tA, tA0, 'A', 'Recipiente A', matA);
    dibujarRecipiente(ctx, w / 2 + 10, top, ancho, ab, cBcolor, st.tB, tB0, 'B', 'Recipiente B', matB);

    if (on) {
      const dir = st.tA < st.tB ? 1 : -1;
      const cy = h / 2;
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(w / 2, cy);
      ctx.lineTo(w / 2 + dir * (w / 2 - 30), cy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(dir === 1 ? '► calor' : '◄ calor', w / 2 + dir * 90, cy - 10);
      const calientes = st.tA > st.tB ? 'A' : 'B';
      ctx.fillText(`A → B: el calor va de A hacia B`.replace('A → B:', calientes === 'A' ? '◄✔' : '✔►'), w / 2, cy + 20);
    }
  }

  function dibujarRecipiente(ctx, x, top, ancho, ab, col, temp, tempIni, etiqueta, nombre, mat) {
    const liq = Math.max(0.08, temp / 120);
    const altoL = (ab - top) * 0.7 * Math.max(liq, 0.2);
    const baseY = ab - 18;

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, top, ancho, baseY - top);

    ctx.fillStyle = `rgba(${col},0.55)`;
    ctx.fillRect(x + 3, baseY - altoL, ancho - 6, altoL);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(nombre, x, top - 10);
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`${temp.toFixed(1)} °C`, x + 4, baseY - altoL - 14);

    // termómetro
    const tx = x + ancho - 10;
    const scala = (ab - top) / 120;
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(tx - 3, top, 8, baseY - top);
    ctx.fillStyle = '#dc2626';
    const th = Math.max(2, temp * scala);
    ctx.fillRect(tx - 3, baseY - th, 8, th);

    // partículas
    const n = 16;
    const vel = Math.sqrt(temp / 120) || 0.1;
    for (let i = 0; i < n; i++) {
      const px = x + 8 + ((Math.sin(nowSeed(i) + performance.now() / (900 / vel)) * 0.5 + 0.5) * (ancho - 16));
      const py = baseY - Math.max(4, (i % 8) / 8) * altoL - (Math.cos(nowSeed(i + 99) + performance.now() / (1100 / vel)) * 4);
      ctx.fillStyle = temp > 50 ? '#ef4444' : temp > 25 ? '#f59e0b' : '#3b82f6';
      ctx.beginPath();
      ctx.arc(px, py, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function nowSeed(i) {
    return Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
  }

  const series = [
    { nombre: 'Recipiente A', puntos: estadoRef.current.series.A, color: '#2563eb' },
    { nombre: 'Recipiente B', puntos: estadoRef.current.series.B, color: '#dc2626' },
  ];

  const objetivoModo = {
    guiado: 'Configurá dos temperaturas distintas, poné los cuerpos en contacto y observá el flujo de calor.',
    explora: 'Modificá masas y materiales libremente. ¿Qué pasa si el calor específico es muy distinto?',
    desafio: 'Desafío: lográ que la temperatura final sea más cercana a 50 °C eligiendo las temperaturas iniciales.',
  };

  const resultadoPregunta = (ok, det) => {
    if (ok) setPuntos((p) => p + 10);
    setPregunta({ ok, det });
  };

  return (
    <div>
      <Indice puntos={puntos} meta="Comprender la diferencia entre calor y temperatura y su relación con el movimiento de las partículas." />
      <ModoSelector modo={modo} setModo={setModo} desafio="Lográ una T final ≈ 50 °C." />
      <div className="alerta info">{objetivoModo[modo]}</div>

      <div className="sim-controles termo-controls">
        <label>Temperatura inicial A: <strong>{tA0} °C</strong><input type="range" min={modo === 'desafio' ? 0 : 0} max="100" value={tA0} onChange={(e) => { setTA0(Number(e.target.value)); setCorriendo(false); }} /></label>
        <label>Temperatura inicial B: <strong>{tB0} °C</strong><input type="range" min="0" max="100" value={tB0} onChange={(e) => { setTB0(Number(e.target.value)); setCorriendo(false); }} /></label>
        <label>Masa A: <strong>{mA} kg</strong><input type="range" min="0.2" max="5" step="0.1" value={mA} onChange={(e) => { setMA(Number(e.target.value)); setCorriendo(false); }} /></label>
        <label>Masa B: <strong>{mB} kg</strong><input type="range" min="0.2" max="5" step="0.1" value={mB} onChange={(e) => { setMB(Number(e.target.value)); setCorriendo(false); }} /></label>
        <label>Material A<select value={matA} onChange={(e) => { setMatA(e.target.value); setCorriendo(false); }}>{Object.keys(MATERIALES).map((k) => <option key={k} value={k}>{MATERIALES[k].nombre}</option>)}</select></label>
        <label>Material B<select value={matB} onChange={(e) => { setMatB(e.target.value); setCorriendo(false); }}>{Object.keys(MATERIALES).map((k) => <option key={k} value={k}>{MATERIALES[k].nombre}</option>)}</select></label>
      </div>

      <div className="termo-acciones">
        <button className="btn btn-primary" onClick={ponerContacto} disabled={corriendo}>🔗 Poner en contacto</button>
        <button className="btn" onClick={() => setCorriendo(false)}>Reiniciar</button>
        <Dato etiqueta="Temperatura A" valor={`${estadoRef.current.tA.toFixed(1)} °C`} />
        <Dato etiqueta="Temperatura B" valor={`${estadoRef.current.tB.toFixed(1)} °C`} />
        <Dato etiqueta="T final (equilibrio)" valor={`${Tf.toFixed(1)} °C`} />
        <Dato etiqueta="Tiempo" valor={`${tiempo.toFixed(1)} s`} />
      </div>

      <div className="termo-lienzo">
        <canvas ref={canvasRef} />
      </div>

      <div className="card termo-seccion">
        <h3>📈 Temperatura vs. tiempo</h3>
        <Grafico series={series} xLabel="tiempo (s)" yLabel="T (°C)" marker={corriendo ? null : { x: estadoRef.current.t, y: Tf }} />
      </div>

      <PanelVariables
        control={['Temperatura inicial de A y B', 'Masa y material de cada cuerpo']}
        dependiente={['Temperatura final (equilibrio)', 'Dirección del flujo de calor', 'Velocidad de las partículas']}
        constantes={['Calor específico de cada material']}
      />

      <div className="card termo-seccion">
        <h3>❓ Actividad de análisis</h3>
        <p>¿Por qué se detiene la transferencia de calor entre los recipientes?</p>
        <div className="termo-opciones">
          <button className="btn" onClick={() => resultadoPregunta(false, {})}>Porque la temperatura es igual (equilibrio térmico)</button>
          <button className="btn" onClick={() => resultadoPregunta(false, {})}>Porque el calor se agota</button>
          <button className="btn" onClick={() => resultadoPregunta(true, {})}>Porque los cuerpos alcanzan la misma temperatura y no hay más flujo</button>
        </div>
        <Retro estado={pregunta?.ok ? 'ok' : pregunta ? 'error' : null} explicacion="Cuanto mayor la temperatura, mayor agitación de las partículas. Cuando ambas temperaturas se igualan, el flujo neto de calor se detiene: es el equilibrio térmico." pista="Recordá qué magnitud se iguala cuando el calor deja de fluir." />
        {pregunta?.ok && <p className="alerta ok" style={{ marginTop: 10 }}>+10 puntos</p>}
      </div>
    </div>
  );
}