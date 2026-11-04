import { useEffect, useMemo, useRef, useState } from 'react';
import { useTour, PanelAula } from './Tour.jsx';

const PASOS = [
  { id: 'intro', texto: 'El hierro puede quedarse magnetizado. El cobre (conductor) y el plástico no se comportan igual.', duracion: 4200 },
  { id: 'hierro', texto: 'Con el hierro cerca del imán, sus dominios se alinean: la barra se vuelve un imán permanente.', duracion: 5200 },
  { id: 'conductor', texto: 'El cobre solo se magnetiza mientras el imán está cerca: al alejarlo, vuelve a su estado normal.', duracion: 5400 },
  { id: 'plastico', texto: 'El plástico no tiene dominios que puedan alinearse: el imán no lo atrae ni lo magnetiza.', duracion: 4800 },
  { id: 'cierre', texto: 'Permanente = conserva el magnetismo. Temporal = solo mientras dura la causa. No magnético = no responde.', duracion: 5000 },
];

const MATERIALES = [
  { id: 'hierro', nombre: 'Hierro (permanente)', emoji: '🧲', desc: 'Puede quedar magnetizado de forma permanente.' },
  { id: 'conductor', nombre: 'Cobre (temporal)', emoji: '🔌', desc: 'Se magnetiza solo mientras hay campo; al alejarlo vuelve a ser normal.' },
  { id: 'plastico', nombre: 'Plástico (no magnético)', emoji: '🧊', desc: 'Sus dominios no pueden alinearse: el imán no lo atrae.' },
];

const BASE = Array.from({ length: 96 }, (_, i) => Math.sin(i * 12.9898) * 43758.5453 % 1 * 160 - 80);

export default function SimPermanente() {
  const tour = useTour(PASOS);
  const tourRef = useRef(tour);
  tourRef.current = tour;

  const [mat, setMat] = useState('hierro');
  const [cerca, setCerca] = useState(0.4);
  const [temp, setTemp] = useState(20);

  const actual = MATERIALES.find((m) => m.id === mat);

  useEffect(() => {
    if (!tour.jugando) return;
    if (tour.pasoId === 'hierro') { setMat('hierro'); setCerca(0.9); setTemp(20); }
    else if (tour.pasoId === 'conductor') { setMat('conductor'); setCerca(0.85); setTemp(20); }
    else if (tour.pasoId === 'plastico') { setMat('plastico'); setCerca(0.85); setTemp(20); }
  }, [tour.pasoId, tour.jugando]);

  useEffect(() => {
    if (!tour.jugando) return;
    if (tour.pasoId === 'conductor') {
      const t = setTimeout(() => setCerca(0.1), tour.prog < 0.15 ? 1500 : 200);
      return () => clearTimeout(t);
    }
  }, [tour.pasoId, tour.jugando, tour.prog]);

  const dominio = useMemo(() => {
    let alineacion;
    if (mat === 'hierro') {
      alineacion = Math.max(0, cerca - Math.max(0, (temp - 300) / 300));
    } else if (mat === 'conductor') {
      alineacion = cerca * 0.7;
    } else {
      alineacion = 0.03;
    }
    return alineacion;
  }, [mat, cerca, temp]);

  function reiniciar() {
    setMat('hierro');
    setCerca(0.4);
    setTemp(20);
    tour.reiniciar();
  }

  return (
    <div>
      <PanelAula
        objetivo="Compará un material que conserva el magnetismo con otros que lo pierden o nunca lo tienen."
        tour={tour}
        onReiniciar={reiniciar}
      />

      <div className="sim-controles">
        <label>
          Material
          <select value={mat} onChange={(e) => setMat(e.target.value)}>
            {MATERIALES.map((m) => (
              <option key={m.id} value={m.id}>{m.emoji} {m.nombre}</option>
            ))}
          </select>
        </label>
        <label>
          Cercanía del imán
          <input type="range" min="0" max="1" step="0.05" value={cerca} onChange={(e) => setCerca(Number(e.target.value))} />
          <strong>{Math.round(cerca * 100)}%</strong>
        </label>
        <label>
          Temperatura
          <input type="range" min="20" max="400" step="5" value={temp} onChange={(e) => setTemp(Number(e.target.value))} />
          <strong>{temp}°C</strong>
        </label>
      </div>

      <div className="magneto-dominios">
        {BASE.map((b, i) => {
          const col = i % 12;
          const fila = Math.floor(i / 12);
          const distBorde = Math.abs(fila - 4) / 4;
          const peso = (1 - distBorde * 0.6) * dominio;
          const ang = b * (1 - peso) + 90 * peso;
          return (
            <div key={i} className="magneto-dominio">
              <span
                className={`magneto-dominio-flecha ${mat === 'hierro' && dominio > 0.3 && (fila < 2 ? 'arriba' : fila > 6 ? 'abajo' : '')}`}
                style={{ transform: `rotate(${ang}deg)` }}
              >
                ↑
              </span>
            </div>
          );
        })}
      </div>

      <div className="sim-resultados">
        <span>{actual.emoji} <strong>{actual.nombre}</strong>: {actual.desc}</span>
        <span>
          Dominios alineados: <strong>{Math.round(dominio * 100)}%</strong>
          {temp > 250 && mat === 'hierro' && <span className="warn"> — Cerca del punto de Curie, pierde su magnetismo.</span>}
        </span>
      </div>

      <div className="termo-retro ok">
        <strong>Conclusión</strong>
        <p>
          Los <b>imanes permanentes</b> conservan su magnetismo; los <b>temporales</b> solo mientras dura la causa; los
          materiales <b>no magnéticos</b> no responden. El calor extremo desordena los dominios de cualquier imán.
        </p>
      </div>
    </div>
  );
}