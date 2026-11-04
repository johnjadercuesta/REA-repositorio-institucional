import { useEffect, useRef, useState } from 'react';
import { MATERIALES } from './data.js';
import { Grafico, PanelVariables, ModoSelector, Retro, Dato, Indice } from './ui.jsx';

const PUNTO_EBULLICION = { agua: 100, aceite: 240, hielo: 0, aluminio: 660, hierro: 1538, cobre: 1085 };

export default function SimEnergia() {
  const canvasRef = useRef(null);
  const [mat, setMat] = useState('agua');
  const [masa, setMasa] = useState(1);
  const [t0, setT0] = useState(20);
  const [pot, setPot] = useState(800);
  const [corriendo, setCorriendo] = useState(false);
  const [modo, setModo] = useState('guiado');
  const [puntos, setPuntos] = useState(0);
  const [preguntas, setPreguntas] = useState({ p1: null, p2: null });
  const [estado, setEstado] = useState({ t: 0, T: t0, E: 0, seriesT: [], seriesE: [], objetivo: false, resultado: null });

  const ref = useRef(estado);

  useEffect(() => {
    const s = ref.current;
    s.t = 0;
    s.T = t0;
    s.E = 0;
    s.seriesT = [];
    s.seriesE = [];
    s.objetivo = false;
    s.resultado = null;
    setEstado({ ...s });
  }, [mat, masa, t0, pot]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  useEffect(() => {
    let raf;
    let ultimo = performance.now();
    const c = MATERIALES[mat].c;
    const tope = PUNTO_EBULLICION[mat];
    const frame = (ahora) => {
      const s = ref.current;
      const dt = Math.min((ahora - ultimo) / 1000, 0.05);
      ultimo = ahora;
      if (corriendo) {
        s.t += dt;
        s.E += pot * dt;
        const dT = (pot * dt) / (masa * c);
        s.T = Math.min(tope, s.T + dT);
        if (s.T >= tope) setCorriendo(false);
        s.seriesT.push({ x: s.t, y: s.T });
        s.seriesE.push({ x: s.t, y: s.E });
        if (s.seriesT.length > 600) { s.seriesT.shift(); s.seriesE.shift(); }
        if (modo === 'desafio' && s.T >= t0 + 20) {
          setCorriendo(false);
          s.resultado = { energia: s.E, ok: true };
        }
        setEstado({ ...s });
      }
      dibujar(ctx, s, c);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corriendo, mat, masa, t0, pot, modo]);

  function dibujar(ctx, s, c) {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    // mesa
    ctx.fillStyle = '#e7e5e4';
    ctx.fillRect(0, h - 26, w, 26);

    // llama
    if (corriendo) {
      const f = Math.sin(performance.now() / 90) * 0.4 + 0.6;
      ctx.fillStyle = `rgba(249,115,22,${0.5 + f * 0.5})`;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 26, h - 52);
      ctx.lineTo(w / 2 + 26, h - 52);
      ctx.lineTo(w / 2 + 10, h - 88);
      ctx.lineTo(w / 2 - 10, h - 88);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = `rgba(250,204,21,${0.7 + f * 0.3})`;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 14, h - 60);
      ctx.lineTo(w / 2 + 14, h - 60);
      ctx.lineTo(w / 2 + 6, h - 78);
      ctx.lineTo(w / 2 - 6, h - 78);
      ctx.closePath();
      ctx.fill();
    }

    // recipiente
    const bx = w / 2 - 70;
    const bw = 140;
    const baseY = h - 60;
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.strokeRect(bx, 46, bw, baseY - 46);
    const liq = Math.min(1, 0.55 * (masa / 2) + 0.15);
    const col = COLORES[mat];
    ctx.fillStyle = `rgba(${col},0.5)`;
    ctx.fillRect(bx + 3, baseY - (baseY - 46) * liq, bw - 6, (baseY - 46) * liq);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${MATERIALES[mat].nombre} · ${masa} kg`, bx, 34);
    ctx.fillText(`${s.T.toFixed(1)} °C`, bx + 4, baseY - (baseY - 46) * liq - 12);

    // burbujas si hierve
    if (s.T >= PUNTO_EBULLICION[mat]) {
      for (let i = 0; i < 12; i++) {
        const bx2 = bx + 10 + ((i * 37) % (bw - 20));
        const by = baseY - ((performance.now() / 60 + i * 40) % (baseY - 60));
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(bx2, by, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // termómetro
    const tx = bx + bw + 26;
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(tx - 4, 30, 10, baseY - 30);
    const escala = (baseY - 30) / 200;
    const th = Math.max(2, Math.min(200, s.T) * escala);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(tx - 4, baseY - th, 10, th);

    // indicador de potencia
    ctx.fillStyle = '#334155';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`⚡ Potencia: ${pot} W`, w - 12, 30);
    ctx.fillText(`Energía: ${(s.E / 1000).toFixed(2)} kJ`, w - 12, 50);
    ctx.fillText(`ΔT: ${(s.T - t0).toFixed(1)} °C`, w - 12, 70);
  }

  const s = ref.current;
  const seriesT = [{ nombre: MATERIALES[mat].nombre, puntos: s.seriesT, color: '#2563eb' }];
  const seriesE = [{ nombre: 'Energía suministrada', puntos: s.seriesE, color: '#16a34a' }];

  const responder = (k, ok) => {
    if (ok) setPuntos((p) => p + 10);
    setPreguntas((q) => ({ ...q, [k]: { ok } }));
  };

  return (
    <div>
      <Indice puntos={puntos} meta="Analizar cómo la masa, el material y la potencia influyen en la energía transferida (Q = m·c·ΔT)." />
      <ModoSelector modo={modo} setModo={setModo} desafio="Elevá la temperatura 20 °C con la menor energía posible." />
      {modo === 'guiado' && <div className="alerta info">1) Elegí material y masa. 2) Ajustá la potencia. 3) Encendé la fuente y mirá cómo sube la temperatura.</div>}
      {modo === 'desafio' && <div className="alerta info">Objetivo: alcanzar T = {t0 + 20} °C. Cuando lo logres se corta solo y verás la energía usada.</div>}

      <div className="sim-controles termo-controls">
        <label>Material<select value={mat} onChange={(e) => { setMat(e.target.value); setCorriendo(false); }}>{Object.keys(MATERIALES).map((k) => <option key={k} value={k}>{MATERIALES[k].nombre}</option>)}</select></label>
        <label>Masa: <strong>{masa} kg</strong><input type="range" min="0.1" max="2" step="0.1" value={masa} onChange={(e) => { setMasa(Number(e.target.value)); setCorriendo(false); }} /></label>
        <label>Temperatura inicial: <strong>{t0} °C</strong><input type="range" min="0" max="90" value={t0} onChange={(e) => { setT0(Number(e.target.value)); setCorriendo(false); }} /></label>
        <label>Potencia: <strong>{pot} W</strong><input type="range" min="100" max="2000" step="50" value={pot} onChange={(e) => { setPot(Number(e.target.value)); setCorriendo(false); }} /></label>
      </div>

      <div className="termo-acciones">
        <button className="btn btn-primary" onClick={() => setCorriendo((v) => !v)}>{corriendo ? '⏸ Apagar' : '🔥 Encender'}</button>
        <button className="btn" onClick={() => { setCorriendo(false); ref.current.t = 0; ref.current.T = t0; ref.current.E = 0; ref.current.seriesT = []; ref.current.seriesE = []; setEstado({ ...ref.current }); }}>Reiniciar</button>
        <Dato etiqueta="Temperatura" valor={`${s.T.toFixed(1)} °C`} />
        <Dato etiqueta="Energía suministrada" valor={`${(s.E / 1000).toFixed(2)} kJ`} />
        <Dato etiqueta="ΔT" valor={`${(s.T - t0).toFixed(1)} °C`} />
        {modo === 'desafio' && s.resultado && <Dato etiqueta="Energía usada" valor={`${(s.resultado.energia / 1000).toFixed(2)} kJ`} />}
      </div>

      <div className="termo-lienzo"><canvas ref={canvasRef} /></div>

      <div className="card termo-seccion">
        <h3>📈 Temperatura vs. tiempo</h3>
        <Grafico series={seriesT} xLabel="tiempo (s)" yLabel="T (°C)" />
      </div>
      <div className="card termo-seccion">
        <h3>📈 Energía suministrada vs. tiempo</h3>
        <Grafico series={seriesE} xLabel="tiempo (s)" yLabel="Energía (J)" />
      </div>

      <PanelVariables
        control={['Material', 'Masa', 'Temperatura inicial', 'Potencia de la fuente']}
        dependiente={['Temperatura', 'Energía suministrada', 'ΔT', 'Pendiente de la gráfica']}
        constantes={['Calor específico del material', 'Punto de ebullición']}
      />

      <div className="card termo-seccion">
        <h3>❓ Actividad</h3>
        <p>Con la misma masa y la misma potencia, ¿qué material aumenta más lento su temperatura?</p>
        <div className="termo-opciones">
          <button className="btn" onClick={() => responder('p1', true)}>Agua (mayor calor específico)</button>
          <button className="btn" onClick={() => responder('p1', false)}>Cobre (menor calor específico)</button>
          <button className="btn" onClick={() => responder('p1', false)}>Hierro</button>
        </div>
        <Retro estado={preguntas.p1?.ok ? 'ok' : preguntas.p1 ? 'error' : null} explicacion="El agua (c ≈ 4186 J/(kg·K)) necesita más energía por kg y por grado que el cobre (c ≈ 385), por eso tarda más en calentarse." pista="Compará los valores de calor específico en la tabla de recursos." />

        <p style={{ marginTop: 16 }}>Si duplicás la masa de agua, con la misma potencia…</p>
        <div className="termo-opciones">
          <button className="btn" onClick={() => responder('p2', true)}>Sube la temperatura más lento</button>
          <button className="btn" onClick={() => responder('p2', false)}>Sube más rápido</button>
        </div>
        <Retro estado={preguntas.p2?.ok ? 'ok' : preguntas.p2 ? 'error' : null} explicacion="Al doble de masa, la misma potencia calienta a la mitad de velocidad: ΔT = P·t/(m·c)." pista="La energía se reparte entre más materia." />
        {preguntas.p1?.ok && preguntas.p2?.ok && <div className="alerta ok" style={{ marginTop: 10 }}>+20 puntos · Módulo completo</div>}
      </div>
    </div>
  );
}

const COLORES = { agua: '96,165,250', aceite: '250,204,21', hielo: '147,197,253', aluminio: '203,213,225', hierro: '148,163,184', cobre: '240,171,133' };