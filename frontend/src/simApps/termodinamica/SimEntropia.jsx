import { useEffect, useRef, useState } from 'react';
import { Grafico, PanelVariables, ModoSelector, Retro, Dato, Indice } from './ui.jsx';

export default function SimEntropia() {
  const canvasRef = useRef(null);
  const canvasCajaRef = useRef(null);
  const [parte, setParte] = useState('mezcla');
  const [th0, setTh0] = useState(373);
  const [tc0, setTc0] = useState(273);
  const [corriendo, setCorriendo] = useState(false);
  const [retro, setRetro] = useState(null);
  const [puntos, setPuntos] = useState(0);
  const [estado, setEstado] = useState({ t: 0, Th: th0, Tc: tc0, S: 0, series: [] });
  const ref = useRef(estado);

  const C = 100; // J/K de cada contenedor
  const k = 0.06;

  useEffect(() => {
    ref.current = { t: 0, Th: th0, Tc: tc0, S: 0, series: [], dT: th0 - tc0 };
    setEstado({ ...ref.current });
  }, [th0, tc0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const caja = canvasCajaRef.current;
    if (caja) {
      const c2 = caja.getContext('2d');
      caja.width = caja.clientWidth * dpr;
      caja.height = caja.clientHeight * dpr;
      c2.setTransform(dpr, 0, 0, dpr, 0, 0);
      caja.dataset.abierta = 'false';
    }
  }, []);

  useEffect(() => {
    let raf;
    let ultimo = performance.now();
    const frame = (ahora) => {
      const s = ref.current;
      const dt = Math.min((ahora - ultimo) / 1000, 0.05);
      ultimo = ahora;
      if (corriendo && s.Th - s.Tc > 0.5) {
        s.t += dt;
        const dQ = k * (s.Th - s.Tc) * dt * C * 0.5;
        const dS = -dQ / s.Th + dQ / s.Tc;
        s.S += Math.max(0, dS);
        s.Th -= dQ / C;
        s.Tc += dQ / C;
        s.series.push({ x: s.t, y: s.S });
        if (s.series.length > 500) s.series.shift();
        setEstado({ ...s });
      } else if (corriendo) {
        setCorriendo(false);
      }
      dibujarMezcla();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [corriendo]);

  function dibujarMezcla() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = canvas.getContext('2d');
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#f8fafc';
    c.fillRect(0, 0, w, h);

    const ancho = w / 2 - 40;
    dibujarEnvase(c, 18, 40, ancho, h - 70, ref.current.Th, 'Caliente', true);
    dibujarEnvase(c, w / 2 + 22, 40, ancho, h - 70, ref.current.Tc, 'Frío', false);

    if (corriendo) {
      c.strokeStyle = '#f97316';
      c.lineWidth = 3;
      c.setLineDash([7, 6]);
      c.beginPath();
      c.moveTo(w / 2, h / 2);
      c.lineTo(w / 2 + (ref.current.Th > ref.current.Tc ? 1 : -1) * 100, h / 2);
      c.stroke();
      c.setLineDash([]);
    }
  }

  function dibujarEnvase(c, x, top, ancho, alto, T, nombre, caliente) {
    const liq = Math.max(0.15, T / 500);
    c.strokeStyle = '#64748b';
    c.lineWidth = 3;
    c.strokeRect(x, top, ancho, alto);
    c.fillStyle = caliente ? 'rgba(249,115,22,0.4)' : 'rgba(59,130,246,0.4)';
    c.fillRect(x + 3, top + alto - (alto * liq), ancho - 6, alto * liq);
    c.fillStyle = '#0f172a';
    c.font = 'bold 13px sans-serif';
    c.textAlign = 'left';
    c.fillText(`${nombre} · ${T.toFixed(0)} K`, x, top - 8);
  }

  return (
    <div>
      <Indice puntos={puntos} meta="Comprender la entropía como distribución de la energía y el sentido de los procesos espontáneos." />
      <ModoSelector modo="guiado" setModo={() => {}} />

      <div className="tabs termo-tabs">
        <button className={parte === 'mezcla' ? 'active' : ''} onClick={() => setParte('mezcla')}>🌡️ Contacto térmico</button>
        <button className={parte === 'caja' ? 'active' : ''} onClick={() => setParte('caja')}>📦 Caja de partículas</button>
      </div>

      {parte === 'mezcla' ? (
        <>
          <div className="sim-controles termo-controls">
            <label>Foco caliente: <strong>{th0} K</strong><input type="range" min="300" max="500" value={th0} onChange={(e) => setTh0(Number(e.target.value))} /></label>
            <label>Foco frío: <strong>{tc0} K</strong><input type="range" min="200" max="350" value={tc0} onChange={(e) => setTc0(Number(e.target.value))} /></label>
          </div>
          <div className="termo-acciones">
            <button className="btn btn-primary" onClick={() => setCorriendo(true)} disabled={corriendo}>🔗 Conectar</button>
            <button className="btn" onClick={() => { setCorriendo(false); ref.current = { t: 0, Th: th0, Tc: tc0, S: 0, series: [], dT: th0 - tc0 }; setEstado({ ...ref.current }); }}>Reiniciar</button>
            <Dato etiqueta="Entropía total ΔS" valor={`${ref.current.S.toFixed(2)} J/K`} />
            <Dato etiqueta="ΔS total esperado" valor={`${((ref.current.Th - ref.current.Tc) * C * 0.01).toFixed(1) > 0 ? '> 0' : ''}`} />
          </div>
          <div className="termo-lienzo"><canvas ref={canvasRef} /></div>
          <div className="card termo-seccion">
            <h3>📈 Entropía total vs. tiempo</h3>
            <Grafico series={[{ nombre: 'ΔS total', puntos: ref.current.series, color: '#2563eb' }]} xLabel="tiempo (s)" yLabel="Entropía (J/K)" />
            <p className="muted">Notá que la entropía total <strong>siempre crece</strong> hasta que se alcanza el equilibrio térmico: esa es la segunda ley.</p>
          </div>

          <div className="card termo-seccion">
            <h3>❓ Pregunta</h3>
            <p>¿Qué sucede con la entropía total de un sistema aislado durante un proceso espontáneo?</p>
            <div className="termo-opciones">
              <button className="btn" onClick={() => setRetro(false)}>Disminuye</button>
              <button className="btn" onClick={() => setRetro(true)}>Aumenta (o se mantiene si es reversible)</button>
            </div>
            <Retro estado={retro === true ? 'ok' : retro === false ? 'error' : null} explicacion="ΔS_total ≥ 0. Los procesos espontáneos aumentan la entropía hasta el equilibrio; solo un proceso idealmente reversible la mantendría." pista="Mirá la pendiente de la gráfica mientras avanza." />
            <button className="btn" style={{ marginTop: 10 }} onClick={() => setRetro(null)}>Reintentar</button>
          </div>
        </>
      ) : (
        <CajaParticles retro={retro} setRetro={setRetro} puntos={puntos} setPuntos={setPuntos} canvasRef={canvasCajaRef} />
      )}
      <PanelVariables
        control={parte === 'mezcla' ? ['Temperaturas iniciales de los focos'] : ['Abrir/cerrar la compuerta']}
        dependiente={parte === 'mezcla' ? ['Temperatura final', 'ΔS total'] : ['Distribución de partículas']}
        constantes={['Sistema aislado (sin intercambio con el entorno)']}
      />
    </div>
  );
}

function CajaParticles({ setPuntos, puntos, canvasRef, retro, setRetro }) {
  const [abierta, setAbierta] = useState(false);
  const [part, setPart] = useState(0);
  const openRef = useRef(false);
  const partRef = useRef(0);

  useEffect(() => {
    let raf;
    const frame = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const c = canvas.getContext('2d');
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const target = openRef.current ? 1 : 0;
      partRef.current += (target - partRef.current) * 0.03;
      setPart(partRef.current);
      c.clearRect(0, 0, w, h);
      c.fillStyle = '#f8fafc';
      c.fillRect(0, 0, w, h);
      const mitad = w / 2;
      c.strokeStyle = '#64748b';
      c.lineWidth = 3;
      const compuerta = openRef.current ? 0 : 18;
      c.strokeRect(10, 20, w - 20, h - 40);
      c.beginPath();
      c.moveTo(mitad, 20 + (h - 40) * 0.4);
      c.lineTo(mitad, 20 + (h - 40) * 0.4 + compuerta);
      c.stroke();
      for (let i = 0; i < 44; i++) {
        const lado = openRef.current ? 0.5 : 0.2; // fracción inicial
        let px = 15 + (i % 22) * ((w - 30) / 22);
        if (!openRef.current) px = 15 + (i % 22) * ((w / 2 - 30) / 22);
        else {
          const lado2 = i < 22 ? 0.3 : 0.7;
          px = lado2 * w + (Math.sin(performance.now() / 300 + i * 2) * w * 0.15);
        }
        const py = 24 + 12 * (i % 8) + Math.sin(performance.now() / 250 + i * 1.3) * 3;
        c.fillStyle = '#0f172a';
        c.beginPath();
        c.arc(px, py, 3, 0, Math.PI * 2);
        c.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [canvasRef]);

  const responder = (ok) => {
    if (ok) setPuntos((p) => p + 10);
    setRetro(ok);
  };

  return (
    <>
      <div className="termo-acciones">
        <button className="btn btn-primary" onClick={() => { openRef.current = !openRef.current; setAbierta(!abierta); }}>{abierta ? 'Cerrar compuerta' : 'Abrir compuerta'}</button>
        <button className="btn" onClick={() => { openRef.current = false; setAbierta(false); partRef.current = 0; }}>Reiniciar</button>
      </div>
      <div className="termo-lienzo"><canvas ref={canvasRef} /></div>
      <div className="card termo-seccion">
        <h3>❓ Irreversibilidad</h3>
        <p>Después de abrir la compuerta y esparcirse las partículas, ¿volverán solas a un solo lado?</p>
        <div className="termo-opciones">
          <button className="btn" onClick={() => responder(false)}>Sí, siempre</button>
          <button className="btn" onClick={() => responder(true)}>No espontáneamente: esa configuración es muchísimo menos probable</button>
        </div>
        <Retro estado={retro === true ? 'ok' : retro === false ? 'error' : null} explicacion="La distribución uniforme tiene una entropía mayor. Que todas las partículas vuelvan a un lado sería un proceso que disminuiría la entropía y, por eso, no ocurre espontáneamente." pista="¿Cuántas formas de acomodar las partículas hay en cada lado?" />
      </div>
    </>
  );
}