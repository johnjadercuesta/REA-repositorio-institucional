import { useEffect, useRef, useState } from 'react';
import { PanelVariables, ModoSelector, Retro, Dato, Indice } from './ui.jsx';

export default function SimTerceraLey() {
  const canvasRef = useRef(null);
  const [tK, setTK] = useState(300); // 10 .. 300 K
  const [modo] = useState('guiado');
  const [retro, setRetro] = useState(null);
  const [puntos, setPuntos] = useState(0);

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
    const frame = () => {
      dibujar();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tK]);

  function dibujar() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = tK < 60 ? '#0b1020' : '#1e293b';
    ctx.fillRect(0, 0, w, h);

    const n = 34;
    const vel = Math.sqrt(Math.max(0.001, tK / 300)) * 1.6;
    for (let i = 0; i < n; i++) {
      const px = (Math.sin(performance.now() / (80 / vel) + i * 1.7) * 0.5 + 0.5) * (w - 20) + 10;
      const py = (Math.cos(performance.now() / (95 / vel) + i * 2.3) * 0.5 + 0.5) * (h - 20) + 10;
      ctx.fillStyle = tK < 60 ? '#93c5fd' : tK < 150 ? '#60a5fa' : tK < 250 ? '#fbbf24' : '#f87171';
      ctx.beginPath();
      ctx.arc(px, py, 2 + vel * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`T = ${tK} K`, w / 2, 24);
    ctx.font = '12px sans-serif';
    ctx.fillText(`= ${(tK - 273.15).toFixed(1)} °C`, w / 2, 42);
  }

  const responder = (ok) => {
    if (ok) setPuntos((p) => p + 10);
    setRetro(ok);
  };

  return (
    <div>
      <Indice puntos={puntos} meta="Comprender el comportamiento de las partículas a temperaturas cercanas al cero absoluto." />
      <ModoSelector modo="guiado" setModo={() => {}} />
      <div className="alerta info">Deslizá la temperatura desde 300 K hasta valores cercanos a 0 K y observá el movimiento de las partículas.</div>

      <div className="sim-controles termo-controls">
        <label>Temperatura: <strong>{tK} K</strong><input type="range" min="1" max="300" value={tK} onChange={(e) => setTK(Number(e.target.value))} /></label>
      </div>

      <div className="termo-acciones">
        <Dato etiqueta="En °C" valor={`${(tK - 273.15).toFixed(1)} °C`} />
        <Dato etiqueta="0 K = −273,15 °C" valor="cero absoluto" />
      </div>

      <div className="termo-lienzo"><canvas ref={canvasRef} /></div>

      <PanelVariables
        control={['Temperatura (K)']}
        dependiente={['Velocidad de las partículas', 'Energía cinética media']}
        constantes={['0 K = −273,15 °C (inaccesible)']}
      />

      <div className="card termo-seccion">
        <h3>❓ Análisis</h3>
        <p>Cuando la temperatura se aproxima a 0 K, el movimiento de las partículas…</p>
        <div className="termo-opciones">
          <button className="btn" onClick={() => responder(false)}>Aumenta sin límite</button>
          <button className="btn" onClick={() => responder(true)}>Se vuelve prácticamente nulo (mínimo de energía)</button>
          <button className="btn" onClick={() => responder(false)}>No cambia</button>
        </div>
        <Retro estado={retro === true ? 'ok' : retro === false ? 'error' : null} explicacion="La energía cinética media es proporcional a la temperatura absoluta. Cerca de 0 K las partículas quedan casi inmóviles (solo queda su energía del punto cero)." pista="Pensá en la definición microscópica de temperatura: agitación de partículas." />
        <p className="muted" style={{ marginTop: 10 }}>Alcanzar el cero absoluto exacto es imposible con un número finito de procesos (tercera ley).</p>
      </div>
    </div>
  );
}