import { useEffect, useRef, useState } from 'react';
import { useTour, PanelAula } from './Tour.jsx';

const PASOS = [
  { id: 'intro', texto: 'No todos los materiales responden al imán. Probá cada uno y clasificá cuáles son atraídos.', duracion: 3800 },
  { id: 'ferro', texto: 'El clip, el tornillo y la llave son de hierro o acero: el imán los atrae con fuerza.', duracion: 5000 },
  { id: 'noferro', texto: 'El aluminio, el plástico, el vidrio y la piedra NO son magnéticos.', duracion: 5000 },
  { id: 'regla', texto: 'Regla básica: hierro, acero, níquel y cobalto = magnéticos. El resto, casi nunca.', duracion: 5200 },
  { id: 'cierre', texto: 'Ser metal no basta: muchos metales (cobre, aluminio, oro) no son atraídos.', duracion: 4200 },
];

const MATERIALES = [
  { id: 'clip', nombre: 'Clip de papel', emoji: '📎', mag: true },
  { id: 'tornillo', nombre: 'Tornillo', emoji: '🔩', mag: true },
  { id: 'llave', nombre: 'Llave de metal', emoji: '🔑', mag: true },
  { id: 'cuchara', nombre: 'Cuchara de acero', emoji: '🥄', mag: true },
  { id: 'broche', nombre: 'Broche', emoji: '🧷', mag: true },
  { id: 'moneda', nombre: 'Moneda', emoji: '🪙', mag: false },
  { id: 'lata', nombre: 'Latita de aluminio', emoji: '🥫', mag: false },
  { id: 'lapiz', nombre: 'Lápiz', emoji: '✏️', mag: false },
  { id: 'goma', nombre: 'Goma de borrar', emoji: '🧽', mag: false },
  { id: 'regla', nombre: 'Regla de plástico', emoji: '📏', mag: false },
  { id: 'vaso', nombre: 'Vaso de plástico', emoji: '🥤', mag: false },
  { id: 'piedra', nombre: 'Piedra', emoji: '🪨', mag: false },
];

const OBJETIVO_TOUR = { ferro: ['clip', 'tornillo'], noferro: ['regla', 'lata', 'vaso'] };

export default function SimMateriales() {
  const tour = useTour(PASOS);
  const tourRef = useRef(tour);
  tourRef.current = tour;

  const [seleccion, setSeleccion] = useState('clip');
  const [probados, setProbados] = useState({});

  const actual = MATERIALES.find((m) => m.id === seleccion);
  const resultado = probados[seleccion];
  const probadosList = Object.keys(probados).length;
  const aciertos = MATERIALES.filter((m) => probados[m.id] !== undefined && probados[m.id] === m.mag).length;

  function probar() {
    setProbados((p) => ({ ...p, [seleccion]: actual.mag }));
  }

  function reiniciar() {
    setSeleccion('clip');
    setProbados({});
    tour.reiniciar();
  }

  useEffect(() => {
    if (!tour.jugando) return;
    if (tour.pasoId === 'ferro') {
      setSeleccion('clip');
      setProbados((p) => ({ ...p, clip: true, tornillo: true }));
    } else if (tour.pasoId === 'noferro') {
      setSeleccion('regla');
      setProbados((p) => ({ ...p, regla: false, lata: false, vaso: false }));
    }
  }, [tour.pasoId, tour.jugando]);

  return (
    <div>
      <PanelAula
        objetivo="Clasificá cada material: ¿lo atrae el imán o no?"
        tour={tour}
        onReiniciar={reiniciar}
      />

      <div className="sim-controles">
        <label>
          Elegí un material
          <select value={seleccion} onChange={(e) => setSeleccion(e.target.value)}>
            {MATERIALES.map((m) => (
              <option key={m.id} value={m.id}>{m.emoji} {m.nombre}</option>
            ))}
          </select>
        </label>
        <button className="btn btn-primary" onClick={probar}>Probar con el imán 🧲</button>
        {tour.jugando && (
          <span className="muted">Durante el recorrido, la simulación prueba los materiales automáticamente.</span>
        )}
      </div>

      <div className="magneto-banco">
        <div className={`magneto-colgante ${resultado !== undefined ? (resultado ? 'si' : 'no') : ''}`}>
          <span className="magneto-iman-cuerpo">🧲</span>
          <span className="magneto-item-probando">{actual.emoji}</span>
        </div>
        <div className="magneto-tabla">
          {resultado === undefined && <p className="muted">Elegí un material y tocá «Probar con el imán».</p>}
          {resultado === true && (
            <p className="ok">✓ {actual.nombre} es <strong>ATRAÍDO</strong>. Contiene hierro, cobalto o níquel.</p>
          )}
          {resultado === false && (
            <p className="warn">✗ {actual.nombre} <strong>NO</strong> es atraído. No tiene materiales ferromagnéticos.</p>
          )}
        </div>
      </div>

      <div className="sim-resultados">
        <span>
          Probados: <strong>{probadosList} / {MATERIALES.length}</strong> · Aciertos: <strong>{aciertos}</strong>
        </span>
        {tour.jugando && (
          <span className="muted">La mayoría de los metales <strong>no</strong> son magnéticos.</span>
        )}
      </div>

      <div className="magneto-grilla">
        {MATERIALES.map((m) => {
          const p = probados[m.id];
          const resaltar = tour.jugando && p === undefined && (OBJETIVO_TOUR[tour.pasoId] || []).includes(m.id);
          return (
            <div
              key={m.id}
              className={`magneto-objeto ${p === m.mag ? 'acierto' : p !== undefined ? 'error' : ''} ${resaltar ? 'dentro' : ''}`}
              onClick={() => setSeleccion(m.id)}
            >
              <div className="magneto-objeto-emoji">{m.emoji}</div>
              <div className="magneto-objeto-nombre">{m.nombre}</div>
              <div className={`magneto-resultado ${p !== undefined ? (p ? 'si' : 'no') : 'oculto'}`}>
                {p !== undefined ? (p ? 'ATRAÍDO' : 'NO ATRAÍDO') : '?'}
              </div>
            </div>
          );
        })}
      </div>

      <div className="termo-retro ok">
        <strong>Conclusión</strong>
        <p>
          Los materiales <b>magnéticos</b> son los que contienen hierro, acero, níquel o cobalto. Que un objeto sea
          metálico <b>no</b> garantiza que sea atraído: el aluminio y el cobre, por ejemplo, no lo son.
        </p>
      </div>
    </div>
  );
}