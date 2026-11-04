import { useState } from 'react';

const TIPOS = {
  reducir: 'Reducción de términos semejantes',
  valor: 'Valor numérico (evaluar expresión)',
  ecuacion: 'Ecuación de primer grado',
};

const OPERADORES = ['+', '-'];

function azar(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

// genera un ejercicio y su respuesta exacta
function generar(tipo) {
  if (tipo === 'reducir') {
    const n = azar(2, 3);
    const terminos = [];
    let res = 0;
    for (let i = 0; i < n; i++) {
      const coef = azar(1, 8) * (Math.random() < 0.5 ? -1 : 1);
      const variable = ['x', 'y'][azar(0, 1)];
      res += coef;
      const signo = coef >= 0 && i > 0 ? '+ ' : '';
      const c = coef === 1 ? '' : coef === -1 ? '−' : Math.abs(coef);
      terminos.push(`${signo}${c}${variable}`);
    }
    const expr = terminos.join(' ');
    return { pregunta: `Reducir: ${expr}`.replace('   ', ' '), respuestas: [String(res)], emoji: '➕' };
  }

  if (tipo === 'valor') {
    const v = azar(-5, 5);
    const a = azar(1, 6);
    const b = azar(-6, 6);
    const res = a * v + b;
    return { pregunta: `Hallar el valor numérico de ${a}x + ${b} cuando x = ${v}`, respuestas: [String(res)], emoji: '🔢' };
  }

  // ecuacion ax + b = c  (solucion entera garantizada)
  const a = azar(1, 4);
  const res = azar(-9, 9);
  const b = azar(-9, 9);
  const c = a * res + b;
  return {
    pregunta: `${a}x ${b < 0 ? '− ' : '+ '}${Math.abs(b)} = ${c}`,
    respuestas: [String(res)],
    emoji: '⚖️',
  };
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function SimBaldor() {
  const [tipo, setTipo] = useState('reducir');
  const [ej, setEj] = useState(() => generar('reducir'));
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState('');

  function nuevo() {
    setInput('');
    setFeedback('');
    setEj(generar(tipo));
  }

  const f = (e) => {
    e.preventDefault();
    const limpio = input.trim().replace(',', '.');
    const num = Number(limpio);
    const acierto = ej.respuestas.some((r) => Math.abs(Number(r) - num) < 1e-6);
    setFeedback(acierto ? 'ok' : 'no');
  };

  return (
    <div>
      <div className="sim-controles">
        <label>
          Tema
          <select value={tipo} onChange={(e) => { setTipo(e.target.value); setEj(generar(e.target.value)); setInput(''); setFeedback(''); }}>
            {Object.entries(TIPOS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <button className="btn" onClick={nuevo}>
          Nuevo ejercicio
        </button>
      </div>

      <div className="baldor-card">
        <div className="baldor-pregunta">{ej.emoji} {ej.pregunta}</div>
        {tipo === 'ecuacion' && (
          <p className="muted">Despejá x y escribí el resultado (número).</p>
        )}
        <form className="baldor-respuesta" onSubmit={f}>
          <input
            autoFocus
            value={input}
            onChange={(e) => { setInput(e.target.value); setFeedback(''); }}
            placeholder="Tu respuesta…"
          />
          <button className="btn btn-primary" type="submit">
            Comprobar
          </button>
        </form>
        {feedback === 'ok' && <div className="alerta ok">¡Correcto! La respuesta es {ej.respuestas[0]}.</div>}
        {feedback === 'no' && <div className="alerta error">No coincide. Revisá el planteo y volvé a intentar.</div>}
      </div>

      <p className="muted nota">Ejercicios tipo Álgebra de Baldor, generados al azar con verificador de respuestas.</p>
    </div>
  );
}