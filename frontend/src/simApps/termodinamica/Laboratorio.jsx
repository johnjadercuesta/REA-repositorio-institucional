import { useEffect, useState } from 'react';
import { MATERIALES } from './data.js';
import { Grafico, Dato, Indice } from './ui.jsx';

const PUNTO = { agua: 100, aceite: 240, aluminio: 660, hierro: 1538, cobre: 1085 };

export default function Laboratorio() {
  const [mat, setMat] = useState('agua');
  const [masa, setMasa] = useState(1);
  const [tin, setTin] = useState(20);
  const [pot, setPot] = useState(800);
  const [tseg, setTseg] = useState(30);
  const [resultado, setResultado] = useState(null);
  const [tabla, setTabla] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('rea_termo_tabla')) || [];
    } catch {
      return [];
    }
  });
  const [grafico, setGrafico] = useState('temp');
  const [series, setSeries] = useState([]);

  useEffect(() => {
    localStorage.setItem('rea_termo_tabla', JSON.stringify(tabla));
  }, [tabla]);

  function calcular(e) {
    e.preventDefault();
    const c = MATERIALES[mat].c;
    const tope = PUNTO[mat];
    let Q = pot * tseg;
    let dT = Q / (masa * c);
    let Tf = tin + dT;
    if (Tf > tope) {
      const Qmax = masa * c * (tope - tin);
      Q = Math.max(0, Qmax);
      dT = tope - tin;
      Tf = tope;
    }
    const Tin_K = tin + 273.15;
    const Tf_K = Tf + 273.15;
    const dS = masa > 0 && tin !== Tf ? masa * c * Math.log(Tf_K / Tin_K) : 0;
    const res = { Q, dT, Tf, dS, c, tope, eficiencia: pot * tseg > 0 ? (Q / (pot * tseg)) * 100 : 100 };
    setResultado(res);

    // series para gráficas (90 pasos)
    const pasos = 90;
    const sT = [];
    const sE = [];
    const sS = [];
    for (let i = 0; i <= pasos; i++) {
      const t = (i / pasos) * tseg;
      const qProg = pot * t;
      const dTprog = Math.min(qProg / (masa * c), tope - tin);
      const T = tin + dTprog;
      sT.push({ x: t, y: T });
      sE.push({ x: t, y: qProg });
      sS.push({ x: t, y: masa > 0 && tin !== T ? masa * c * Math.log((T + 273.15) / Tin_K) : 0 });
    }
    setSeries({ temp: sT, energia: sE, entropia: sS });
    setTabla((t) => [
      ...t,
      {
        tiempo: tseg, temperatura: Tf.toFixed(1), energia: (Q / 1000).toFixed(2), presion: (101.325).toFixed(1),
        volumen: (masa / MATERIALES[mat].densidad * 1000).toFixed(3), observaciones: '',
      },
    ]);
  }

  const graf = { temp: ['Temperatura', 'temp'], energia: ['Energía', 'energia'], entropia: ['Entropía', 'entropia'] };

  return (
    <div>
      <Indice meta="Experimentar libremente, calcular magnitudes termodinámicas y registrar datos." />

      <form className="sim-controles termo-controls" onSubmit={calcular}>
        <label>Material<select value={mat} onChange={(e) => setMat(e.target.value)}>{Object.keys(MATERIALES).map((k) => <option key={k} value={k}>{MATERIALES[k].nombre}</option>)}</select></label>
        <label>Masa: <strong>{masa} kg</strong><input type="range" min="0.1" max="3" step="0.1" value={masa} onChange={(e) => setMasa(Number(e.target.value))} /></label>
        <label>Temperatura inicial: <strong>{tin} °C</strong><input type="range" min="0" max="80" value={tin} onChange={(e) => setTin(Number(e.target.value))} /></label>
        <label>Potencia: <strong>{pot} W</strong><input type="range" min="100" max="2000" step="50" value={pot} onChange={(e) => setPot(Number(e.target.value))} /></label>
        <label>Tiempo: <strong>{tseg} s</strong><input type="range" min="5" max="120" value={tseg} onChange={(e) => setTseg(Number(e.target.value))} /></label>
        <button className="btn btn-primary" type="submit" style={{ alignSelf: 'end' }}>⚗️ Calcular y registrar</button>
      </form>

      {resultado && (
        <div className="termo-acciones">
          <Dato etiqueta="ΔT" valor={`${resultado.dT.toFixed(1)} °C`} />
          <Dato etiqueta="Q = m·c·ΔT" valor={`${(resultado.Q / 1000).toFixed(2)} kJ`} />
          <Dato etiqueta="Temperatura final" valor={`${resultado.Tf.toFixed(1)} °C`} />
          <Dato etiqueta="ΔU (cañón a presión cte)" valor={`${(resultado.Q / 1000).toFixed(2)} kJ`} />
          <Dato etiqueta="Rendimiento (Q/(P·t))" valor={`${resultado.eficiencia.toFixed(0)}%`} />
          <Dato etiqueta="ΔS (reversible)" valor={`${resultado.dS.toFixed(1)} J/K`} />
        </div>
      )}

      {resultado && (
        <div className="card termo-seccion">
          <h3>📈 Graficar resultados</h3>
          <div className="sim-controles termo-controls">
            <label>Elegí la gráfica<select value={grafico} onChange={(e) => setGrafico(e.target.value)}>
              <option value="temp">Temperatura vs. tiempo</option>
              <option value="energia">Energía vs. tiempo</option>
              <option value="entropia">Entropía vs. tiempo</option>
            </select></label>
          </div>
          <Grafico series={[{ nombre: graf[grafico][0], puntos: series[grafico] || [] }]} xLabel="tiempo (s)" yLabel={graf[grafico][0]} />
        </div>
      )}

      <div className="card termo-seccion">
        <h3>🗂️ Tabla de datos (editable)</h3>
        <div className="tabla-scroll">
          <table className="termo-tabla">
            <thead>
              <tr>
                <th>Tiempo (s)</th><th>Temperatura (°C)</th><th>Energía (kJ)</th><th>Presión (kPa)</th><th>Volumen (L)</th><th>Observaciones</th><th></th>
              </tr>
            </thead>
            <tbody>
              {tabla.map((fila, i) => (
                <tr key={i}>
                  <td>{fila.tiempo}</td><td>{fila.temperatura}</td><td>{fila.energia}</td><td>{fila.presion}</td><td>{fila.volumen}</td>
                  <td><input className="termo-tabla-input" value={fila.observaciones} onChange={(e) => setTabla((t) => t.map((r, j) => (j === i ? { ...r, observaciones: e.target.value } : r)))} /></td>
                  <td><button className="btn" onClick={() => setTabla((t) => t.filter((_, j) => j !== i))}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="btn" onClick={() => setTabla([])}>Vaciar tabla</button>
      </div>
    </div>
  );
}

export const PUNTO_EBULLICION2 = null;