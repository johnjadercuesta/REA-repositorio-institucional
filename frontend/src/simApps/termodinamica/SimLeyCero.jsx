import { useState } from 'react';
import { PanelVariables, ModoSelector, Retro, Dato, Indice } from './ui.jsx';

export default function SimLeyCero() {
  const [tA, setTA] = useState(20);
  const [tB, setTB] = useState(60);
  const [tC, setTC] = useState(95);
  const [paso, setPaso] = useState(0); // 0 inicio, 1 A-B, 2 A-B y B-C, 3 todos
  const [modo] = useState('guiado');
  const [retro, setRetro] = useState(null);
  const [puntos, setPuntos] = useState(0);

  const tAB = paso >= 1 ? (tA + tB) / 2 : tB;
  const tBC = paso >= 2 ? (tAB + tC) / 2 : tC;
  const finales = {
    0: [tA, tB, tC],
    1: [tAB, tAB, tC],
    2: [tAB, tBC, tBC],
    3: [(tA + tB + tC) / 3, (tA + tB + tC) / 3, (tA + tB + tC) / 3],
  }[paso];

  function avanzar() {
    if (paso < 3) setPaso((p) => p + 1);
  }

  const responder = (ok) => {
    if (ok) setPuntos((p) => p + 10);
    setRetro(ok);
  };

  return (
    <div>
      <Indice puntos={puntos} meta="Comprender el equilibrio térmico y su propiedad transitiva (ley cero)." />
      <ModoSelector modo="guiado" setModo={() => {}} />
      <div className="alerta info">1) Fijá las temperaturas. 2) Poné A en contacto con B. 3) Después B con C. 4) Observá el equilibrio total.</div>

      <div className="sim-controles termo-controls">
        <label>Temperatura A: <strong>{tA} °C</strong><input type="range" min="0" max="100" value={tA} onChange={(e) => { setTA(Number(e.target.value)); setPaso(0); }} /></label>
        <label>Temperatura B: <strong>{tB} °C</strong><input type="range" min="0" max="100" value={tB} onChange={(e) => { setTB(Number(e.target.value)); setPaso(0); }} /></label>
        <label>Temperatura C: <strong>{tC} °C</strong><input type="range" min="0" max="100" value={tC} onChange={(e) => { setTC(Number(e.target.value)); setPaso(0); }} /></label>
      </div>

      <div className="termo-acciones">
        <button className="btn btn-primary" onClick={avanzar} disabled={paso >= 3}>{paso === 0 ? '1) Contacto A ↔ B' : paso === 1 ? '2) Contacto B ↔ C' : '3) Equilibrio total'}</button>
        <button className="btn" onClick={() => setPaso(0)}>Reiniciar</button>
        <Dato etiqueta="A" valor={`${finales[0].toFixed(0)} °C`} />
        <Dato etiqueta="B" valor={`${finales[1].toFixed(0)} °C`} />
        <Dato etiqueta="C" valor={`${finales[2].toFixed(0)} °C`} />
      </div>

      <div className="termo-tres">
        {['A', 'B', 'C'].map((n, i) => {
          const t = finales[i];
          const color = t > 70 ? '#ef4444' : t > 40 ? '#f59e0b' : '#3b82f6';
          return (
            <div key={n} className="termo-cuerpo" style={{ borderColor: color }}>
              <strong>{n}</strong>
              <span>{t.toFixed(0)} °C</span>
              <div className="termo-cuerpo-fill" style={{ height: `${Math.max(10, (t / 100) * 140)}px`, background: color }} />
            </div>
          );
        })}
        {paso >= 1 && <div className="termo-flecha">⇄</div>}
        {paso >= 2 && <div className="termo-flecha f2">⇄</div>}
      </div>

      <PanelVariables
        control={['Temperaturas iniciales de A, B y C']}
        dependiente={['Temperatura final común (equilibrio)']}
        constantes={['Masa (igual en los tres)']}
      />

      <div className="card termo-seccion">
        <h3>❓ Transitividad</h3>
        <p>«Si A está en equilibrio térmico con B, y B está en equilibrio con C, ¿qué podemos afirmar de A y C?»</p>
        <div className="termo-opciones">
          <button className="btn" onClick={() => responder(false)}>No se puede saber</button>
          <button className="btn" onClick={() => responder(false)}>A está más caliente que C</button>
          <button className="btn" onClick={() => responder(true)}>A está en equilibrio térmico con C</button>
        </div>
        <Retro estado={retro === true ? 'ok' : retro === false ? 'error' : null} explicacion="Si A comparte temperatura con B y B con C, entonces A y C tienen la misma temperatura: la relación de equilibrio es transitiva. Esta propiedad define a la ley cero." pista="Pensá en la temperatura como un «número que se iguala»." />
      </div>
    </div>
  );
}