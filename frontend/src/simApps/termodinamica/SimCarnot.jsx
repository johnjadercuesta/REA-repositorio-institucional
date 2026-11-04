import { useState } from 'react';
import { Grafico, PanelVariables, ModoSelector, Retro, Dato, Indice } from './ui.jsx';

function barras(qh, w, qc) {
  const max = Math.max(qh, w, qc, 1);
  return { qh: (qh / max) * 100, w: (w / max) * 100, qc: (qc / max) * 100 };
}

export default function SimCarnot() {
  const [mA0, setA0] = useState({ th: 600, tc: 300, qh: 800 });
  const [mB0, setB0] = useState({ th: 400, tc: 320, qh: 800 });
  const [modo] = useState('guiado');
  const [retro, setRetro] = useState(null);
  const [puntos, setPuntos] = useState(0);

  function calc(m) {
    const etamax = 1 - m.tc / m.th;
    const eta = Math.max(0, Math.min(0.65, etamax * 0.9));
    const w = eta * m.qh;
    const qc = m.qh - w;
    return { ...m, etamax, eta, w, qc };
  }
  const A = calc(mA0);
  const B = calc(mB0);

  function responder(ok) {
    if (ok) setPuntos((p) => p + 10);
    setRetro(ok);
  }

  return (
    <div>
      <Indice puntos={puntos} meta="Comprender por qué no es posible convertir todo el calor en trabajo." />
      <ModoSelector modo="guiado" setModo={() => {}} />
      <div className="alerta info">Qₕ (calor tomado del foco caliente) → máquina → W (trabajo) + Qc (calor cedido al foco frío).</div>

      {[['Máquina 1', mA0, setA0], ['Máquina 2', mB0, setB0]].map(([nombre, m, setM]) => (
        <div key={nombre} className="card termo-seccion">
          <h3>{nombre}</h3>
          <div className="sim-controles termo-controls">
            <label>Foco caliente (Th): <strong>{m.th} K</strong><input type="range" min="350" max="1200" step="10" value={m.th} onChange={(e) => setM({ ...m, th: Number(e.target.value) })} /></label>
            <label>Foco frío (Tc): <strong>{m.tc} K</strong><input type="range" min="200" max="400" step="10" value={m.tc} onChange={(e) => setM({ ...m, tc: Number(e.target.value) })} /></label>
            <label>Calor Qₕ: <strong>{m.qh} J</strong><input type="range" min="100" max="1500" step="50" value={m.qh} onChange={(e) => setM({ ...m, qh: Number(e.target.value) })} /></label>
          </div>
          <div className="termo-maquina">
            <div className="termo-foco termo-foco-cal">☀️ T₂ = {m.th} K</div>
            <div className="termo-engine">🛠 Máquina</div>
            <div className="termo-foco termo-foco-frio">❄️ Tc = {m.tc} K</div>
          </div>
          <div className="termo-barras">
            <div className="termo-barra-col"><span>Qₕ</span><div className="termo-barra" style={{ height: `${barras(m.qh, m.w, m.qc).qh}%`, background: '#f97316' }} /></div>
            <div className="termo-barra-col"><span>W</span><div className="termo-barra" style={{ height: `${barras(m.qh, m.w, m.qc).w}%`, background: '#16a34a' }} /></div>
            <div className="termo-barra-col"><span>Qc</span><div className="termo-barra" style={{ height: `${barras(m.qh, m.w, m.qc).qc}%`, background: '#3b82f6' }} /></div>
          </div>
          <div className="termo-acciones">
            <Dato etiqueta="Rendimiento η" valor={`${(m.eta * 100).toFixed(1)}%`} />
            <Dato etiqueta="η máximo (Carnot)" valor={`${(m.etamax * 100).toFixed(1)}%`} />
            <Dato etiqueta="Trabajo W" valor={`${m.w.toFixed(0)} J`} />
            <Dato etiqueta="Calor cedido Qc" valor={`${m.qc.toFixed(0)} J`} />
          </div>
        </div>
      ))}

      <div className="card termo-seccion">
        <h3>📊 Comparación</h3>
        <Grafico
          series={[
            { nombre: 'Máquina 1', puntos: [{ x: 1, y: A.eta * 100 }], color: '#2563eb' },
            { nombre: 'Máquina 2', puntos: [{ x: 2, y: B.eta * 100 }], color: '#dc2626' },
          ]}
          xLabel="Máquina" yLabel="Rendimiento (%)" alto={180}
        />
        <p className="muted">El rendimiento es mayor cuando el foco frío está a menor temperatura (la diferencia Th − Tc crece).</p>
      </div>

      <PanelVariables
        control={['Temperatura del foco caliente', 'Temperatura del foco frío', 'Calor Qₕ']}
        dependiente={['Trabajo W', 'Calor cedido Qc', 'Rendimiento η']}
        constantes={['Ley de Carnot: η ≤ 1 − Tc/Th']}
      />

      <div className="card termo-seccion">
        <h3>❓ Análisis</h3>
        <p>¿Por qué una máquina no puede transformar TODO el calor Qₕ en trabajo?</p>
        <div className="termo-opciones">
          <button className="btn" onClick={() => responder(true)}>Por la segunda ley: parte del calor debe cederse al foco frío</button>
          <button className="btn" onClick={() => responder(false)}>Porque el calor es poco</button>
          <button className="btn" onClick={() => responder(false)}>Sí podría, con una máquina perfecta</button>
        </div>
        <Retro estado={retro === true ? 'ok' : retro === false ? 'error' : null} explicacion="La segunda ley establece que el calor fluye espontáneamente del caliente al frío; convertir todo el calor en trabajo implicaría disminuir la entropía del universo." pista="Pensá en el ciclo: parte de la energía debe «desecharse» en el entorno." />
      </div>
    </div>
  );
}