import { useEffect, useRef, useState } from 'react';
import { G, MATERIALES } from './data.js';
import { Grafico, PanelVariables, ModoSelector, Retro, Dato, Indice } from './ui.jsx';

const C_AGUA = MATERIALES.agua.c;

export default function SimJoule() {
  const canvasRef = useRef(null);
  const [mPesas, setMPesas] = useState(1);
  const [altura, setAltura] = useState(1);
  const [mAgua, setMAgua] = useState(0.3);
  const [nVueltas, setNVueltas] = useState(10);
  const [corriendo, setCorriendo] = useState(false);
  const [modo, setModo] = useState('guiado');
  const [puntos, setPuntos] = useState(0);
  const [retro, setRetro] = useState(null);
  const [estado, setEstado] = useState({ fase: 0, completados: 0, W: 0, dT: 0, T: 20, series: [] });

  const ref = useRef(estado);
  const fracRef = useRef(0);

  useEffect(() => { reset(); }, [mPesas, altura, mAgua, nVueltas]);

  function reset() {
    ref.current.fase = 0;
    ref.current.completados = 0;
    ref.current.W = 0;
    ref.current.dT = 0;
    ref.current.T = 20;
    ref.current.series = [];
    setEstado({ ...ref.current });
  }

  function soltar() {
    if (corriendo) return;
    ref.current.series = [];
    setEstado({ ...ref.current });
    setCorriendo(true);
  }

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
    const frame = (ahora) => {
      const s = ref.current;
      const dt = Math.min((ahora - ultimo) / 1000, 0.05);
      ultimo = ahora;
      if (corriendo) {
        fracRef.current += dt;
        const paso = altura / 90; // velocidad visual
        if (fracRef.current >= paso) {
          fracRef.current = 0;
          s.fase += 1;
          if (s.fase >= 180) {
            s.fase = 0;
            s.completados += 1;
            const w1 = mPesas * G * altura;
            s.W += w1;
            s.dT += w1 / (mAgua * C_AGUA);
            s.T = 20 + s.dT;
            s.series.push({ x: s.W, y: s.dT });
            if (s.completados >= nVueltas) setCorriendo(false);
            else if (modo === 'desafio' && s.dT >= 2) setCorriendo(false);
          }
        }
        setEstado({ ...s });
      }
      dibujar(ctx, s, fracRef.current);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corriendo, mPesas, altura, mAgua, nVueltas, modo]);

  function dibujar(ctx, s, frac) {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    // estructura
    ctx.fillStyle = '#64748b';
    ctx.fillRect(w / 2 - 60, 0, 120, 10); // barra superior
    ctx.fillRect(w / 2 - 2, 0, 4, h); // cuerda central virtual

    // polea
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(w / 2, 26, 8, 0, Math.PI * 2);
    ctx.fill();

    const desc = (frac / 90) * (h - 150);
    // pesa izquierda (baja) y derecha (sube) - simplificado como una pesa que baja
    const py = 26 + desc;
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2, 26);
    ctx.lineTo(w / 2, py);
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(w / 2 - 14, py, 28, 22);
    ctx.fillStyle = '#fff';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${mPesas} kg`, w / 2, py + 14);

    // recipiente con agua a la derecha
    const bx = w / 2 + 60;
    const baseY = h - 40;
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.strokeRect(bx, 60, 130, baseY - 60);
    const liq = 0.5;
    ctx.fillStyle = 'rgba(96,165,250,0.5)';
    ctx.fillRect(bx + 3, baseY - (baseY - 60) * liq, 124, (baseY - 60) * liq);

    // paletas girando
    const cxp = bx + 34;
    const cyp = baseY - 36;
    const ang = (s.fase / 18) * Math.PI;
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 3;
    for (let k = 0; k < 4; k++) {
      const a = ang + (k * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(cxp, cyp);
      ctx.lineTo(cxp + 30 * Math.cos(a), cyp + 30 * Math.sin(a));
      ctx.stroke();
    }
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(cxp, cyp, 4, 0, Math.PI * 2);
    ctx.fill();

    // termómetro
    const tx = bx + 140;
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(tx - 4, 60, 10, baseY - 60);
    ctx.fillStyle = '#dc2626';
    const esc = (baseY - 60) / 30;
    ctx.fillRect(tx - 4, baseY - s.dT * esc, 10, s.dT * esc);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${s.T.toFixed(2)} °C`, bx + 4, 48);

    ctx.fillStyle = '#334155';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Vueltas: ${s.completados}/${nVueltas}`, 12, h - 12);
  }

  const s = ref.current;
  const series = [{ nombre: 'ΔT vs trabajo', puntos: s.series, color: '#2563eb' }];

  const okGrafico = (o) => {
    if (o) setPuntos((p) => p + 10);
    setRetro(o);
  };

  return (
    <div>
      <Indice puntos={puntos} meta="Comprender que el trabajo mecánico puede convertirse en energía térmica (Joule)." />
      <ModoSelector modo={modo} setModo={setModo} desafio="Conseguí que el agua suba 2 °C con el menor trabajo." />
      {modo === 'guiado' && <div className="alerta info">1) Elegí masa de pesas, altura y masa de agua. 2) Definí cuántas vueltas. 3) Soltá y mirá cómo se calienta el agua.</div>}
      {modo === 'desafio' && <div className="alerta info">Cuando el agua suba 2 °C la simulación se detiene sola.</div>}

      <div className="sim-controles termo-controls">
        <label>Masa de las pesas: <strong>{mPesas} kg</strong><input type="range" min="0.2" max="3" step="0.1" value={mPesas} onChange={(e) => setMPesas(Number(e.target.value))} /></label>
        <label>Altura de caída: <strong>{altura} m</strong><input type="range" min="0.4" max="1.5" step="0.1" value={altura} onChange={(e) => setAltura(Number(e.target.value))} /></label>
        <label>Masa de agua: <strong>{mAgua} kg</strong><input type="range" min="0.05" max="0.5" step="0.01" value={mAgua} onChange={(e) => setMAgua(Number(e.target.value))} /></label>
        <label>Vueltas: <strong>{nVueltas}</strong><input type="range" min="1" max="60" value={nVueltas} onChange={(e) => setNVueltas(Number(e.target.value))} /></label>
      </div>

      <div className="termo-acciones">
        <button className="btn btn-primary" onClick={soltar} disabled={corriendo}>⚙️ Soltar pesas</button>
        <button className="btn" onClick={() => { setCorriendo(false); reset(); }}>Reiniciar</button>
        <Dato etiqueta="Trabajo realizado (W = m·g·h·n)" valor={`${(s.W / 1000).toFixed(2)} kJ`} />
        <Dato etiqueta="ΔT" valor={`${s.dT.toFixed(3)} °C`} />
        <Dato etiqueta="Calor absorbido (Q = m·c·ΔT)" valor={`${((mAgua * C_AGUA * s.dT) / 1000).toFixed(2)} kJ`} />
      </div>

      <div className="termo-lienzo"><canvas ref={canvasRef} /></div>

      <div className="card termo-seccion">
        <h3>📈 Trabajo realizado vs. aumento de temperatura</h3>
        <Grafico series={series} xLabel="Trabajo acumulado (J)" yLabel="ΔT (°C)" />
        {s.W > 0 && (
          <p className="muted">
            Equivalencia: 1 cal = 4,186 J. Trabajo <strong>{s.W.toFixed(1)} J</strong> produjo <strong>{s.dT.toFixed(3)} °C</strong> en {mAgua} kg de agua ⇒ Q ≈ {((mAgua * C_AGUA * s.dT)).toFixed(0)} J (deberían coincidir).
          </p>
        )}
      </div>

      <PanelVariables
        control={['Masa de las pesas', 'Altura', 'Masa de agua', 'N° de vueltas']}
        dependiente={['Trabajo realizado W', 'ΔT', 'Temperatura final']}
        constantes={['Gravedad g = 9,81 m/s²', 'Calor específico del agua']}
      />

      <div className="card termo-seccion">
        <h3>❓ Interpretación</h3>
        <p>¿Qué pasa con la temperatura del agua si duplicás la masa de las pesas?</p>
        <div className="termo-opciones">
          <button className="btn" onClick={() => okGrafico(false)}>Disminuye</button>
          <button className="btn" onClick={() => okGrafico(true)}>Aumenta (el trabajo es mayor)</button>
          <button className="btn" onClick={() => okGrafico(false)}>No cambia</button>
        </div>
        <Retro estado={retro === true ? 'ok' : retro === false ? 'error' : null} explicacion="El trabajo W = m·g·h·n es proporcional a la masa: a mayor masa, más trabajo y más calor entregado al agua." pista="Mirá la fórmula de W en el panel de variables." />
      </div>
    </div>
  );
}