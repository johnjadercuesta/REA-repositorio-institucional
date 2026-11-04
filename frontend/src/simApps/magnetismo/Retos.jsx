import { useEffect, useState } from 'react';

export const PREGUNTAS = [
  { nivel: 1, texto: '¿Qué objetos atrae un imán?', opciones: ['Todos los metales', 'Los que contienen hierro', 'Solo los plásticos'], correcta: 1, ex: 'Un imán atrae principalmente objetos con hierro, cobalto o níquel.' },
  { nivel: 1, texto: '¿Cuántos polos tiene un imán?', opciones: ['Uno', 'Dos: Norte y Sur', 'Tres'], correcta: 1, ex: 'Todo imán tiene dos polos: el Norte (N) y el Sur (S).' },
  { nivel: 1, texto: 'Si acerco dos polos iguales (N con N)...', opciones: ['Se atraen', 'Se repelen', 'No pasa nada'], correcta: 1, ex: 'Los polos iguales se repelen y los distintos se atraen.' },
  { nivel: 1, texto: 'Si acerco dos polos distintos (N con S)...', opciones: ['Se atraen', 'Se repelen', 'Se desarman'], correcta: 0, ex: 'Los polos distintos siempre se atraen.' },
  { nivel: 1, texto: 'Las líneas del campo magnético...', opciones: ['Van de S a N', 'Van de N a S', 'No tienen dirección'], correcta: 1, ex: 'Salen del polo Norte y entran al Sur.' },
  { nivel: 2, texto: '¿Cuál de estos materiales es ferromagnético?', opciones: ['Aluminio', 'Hierro', 'Madera'], correcta: 1, ex: 'El hierro se magnetiza fácilmente, a diferencia del aluminio o la madera.' },
  { nivel: 2, texto: 'A mayor distancia entre el imán y el objeto...', opciones: ['Mayor atracción', 'Menor atracción', 'Igual atracción'], correcta: 1, ex: 'La fuerza del imán disminuye con la distancia (al cuadrado).' },
  { nivel: 2, texto: '¿Qué le pasa a un imán si lo calentamos mucho?', opciones: ['Se fortalece', 'Pierde magnetismo', 'Cambia de color'], correcta: 1, ex: 'Con calor los dominios se desordenan y el imán pierde fuerza.' },
  { nivel: 2, texto: '¿Qué material se magnetiza solo mientras está cerca del imán?', opciones: ['El hierro puro', 'El cobre (conductor)', 'El plástico'], correcta: 1, ex: 'Los conductores se magnetizan temporalmente: al alejar el imán vuelven a la normalidad.' },
  { nivel: 2, texto: 'Un electroimán se hace con...', opciones: ['Pila, cable y núcleo', 'Agua y sal', 'Papel y goma'], correcta: 0, ex: 'La corriente por la bobina crea el campo magnético.' },
];

const STORAGE = 'magneto_retos';

export default function Retos() {
  const [nivel, setNivel] = useState(1);
  const [respuestas, setRespuestas] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE)) || {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(respuestas));
    } catch {}
  }, [respuestas]);

  const preg = PREGUNTAS.filter((p) => p.nivel === nivel);
  const respondidas = preg.filter((p) => respuestas[p.texto] !== undefined);
  const correctas = preg.filter((p) => respuestas[p.texto] === p.correcta).length;
  const completo = respondidas.length === preg.length;

  return (
    <div>
      <div className="sim-controles">
        <label>
          Nivel
          <select value={nivel} onChange={(e) => setNivel(Number(e.target.value))}>
            <option value={1}>Nivel 1 · Polos y atracción</option>
            <option value={2}>Nivel 2 · Materiales y electroimanes</option>
          </select>
        </label>
        <button className="btn" onClick={() => setRespuestas({})}>Reiniciar</button>
      </div>

      <div className="sim-resultados">
        <span>
          Puntaje: <strong>{correctas} / {preg.length}</strong>
        </span>
        {completo && (
          <span className="ok">
            {correctas === preg.length ? '¡Perfecto! Eres un experto en magnetismo. 🌟' : '¡Muy bien! Revisá las que fallaste.'}
          </span>
        )}
      </div>

      {preg.map((p, i) => {
        const res = respuestas[p.texto];
        return (
          <div key={p.texto} className="reto-item">
            <p className="reto-pregunta">
              <strong>{i + 1}. </strong>{p.texto}
            </p>
            <div className="reto-opciones">
              {p.opciones.map((op, j) => {
                const elegida = res === j;
                const correcta = j === p.correcta;
                let cls = '';
                if (res !== undefined) cls = correcta ? 'correcta' : elegida ? 'incorrecta' : 'dormida';
                return (
                  <button
                    key={j}
                    className={`reto-opcion ${cls}`}
                    onClick={() => setRespuestas((r) => ({ ...r, [p.texto]: j }))}
                  >
                    {res !== undefined && (correcta ? '✓ ' : elegida ? '✗ ' : '')}{op}
                  </button>
                );
              })}
            </div>
            {res !== undefined && <p className="reto-explicacion">💡 {p.ex}</p>}
          </div>
        );
      })}
    </div>
  );
}