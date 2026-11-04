const EXPERIENCIAS = [
  {
    id: 'SimQueAtrae',
    emoji: '🧲',
    titulo: 'Atracción de diferentes materiales',
    sims: ['SimQueAtrae', 'SimMateriales'],
    acciones: [
      'Arrastrá el imán por la pista y pasalo por cada objeto.',
      'En «Materiales», probá distintos objetos contra el imán.',
    ],
  },
  {
    id: 'SimPolos',
    emoji: '🔀',
    titulo: 'Polos magnéticos',
    sims: ['SimPolos'],
    acciones: [
      'Acercá los dos imanes y observá sus extremos.',
      'Activá «Invertir polos» y volvé a acercarlos.',
    ],
  },
  {
    id: 'SimAtraccionRepulsion',
    emoji: '↔️',
    titulo: 'Atracción y repulsión',
    sims: ['SimAtraccionRepulsion', 'SimPolos'],
    acciones: [
      'Combiná los polos enfrentados con el interruptor de inversión.',
      'Mirá las flechas de fuerza y la escala de intensidad.',
    ],
  },
  {
    id: 'SimCampo',
    emoji: '🌀',
    titulo: 'Campo magnético',
    sims: ['SimCampo', 'SimIntensidad'],
    acciones: [
      'Observá las líneas alrededor del imán.',
      'Arrastrá la brújula por distintos puntos del lienzo.',
      'En «Intensidad», mirá cómo se alinean las limaduras de hierro.',
    ],
  },
  {
    id: 'SimFuerzasDistancia',
    emoji: '📏',
    titulo: 'Fuerzas magnéticas a distancia',
    sims: ['SimFuerzasDistancia'],
    acciones: [
      'Cambiá la distancia entre el imán y el clip de hierro.',
      'Aumentá la fuerza del imán y compará la flecha de fuerza.',
    ],
  },
];

const PREGUNTAS_ANTES = [
  '¿Qué creen que sucederá?',
  '¿Por qué creen que ocurrirá eso?',
  '¿Qué deberíamos cambiar en la simulación para comprobarlo?',
];

const REFLEXIONES = [
  '¿Qué ocurrió realmente?',
  '¿Coincidió con nuestra predicción?',
  '¿Qué evidencia nos proporciona la simulación?',
  '¿Qué diferencia encontramos entre atracción y repulsión?',
  '¿Por qué algunos materiales reaccionaron frente al imán y otros no?',
  '¿Cómo podemos saber que existe un campo magnético si no podemos verlo directamente?',
  '¿Qué demuestra que la fuerza magnética puede actuar sin contacto?',
];

const CONCEPTOS = [
  { termino: 'Magnetismo', sims: 'SimQueAtrae' },
  { termino: 'Imanes', sims: 'SimQueAtrae' },
  { termino: 'Polos magnéticos', sims: 'SimPolos' },
  { termino: 'Atracción y repulsión', sims: 'SimAtraccionRepulsion' },
  { termino: 'Materiales magnéticos', sims: 'SimMateriales' },
  { termino: 'Campo magnético', sims: 'SimCampo' },
  { termino: 'Fuerzas a distancia', sims: 'SimFuerzasDistancia' },
];

const CONCLUSIONES = [
  'Un imán atrae solo algunos materiales: los que contienen hierro, cobalto o níquel.',
  'Todo imán tiene dos polos: el Norte y el Sur.',
  'Los polos distintos se atraen y los iguales se repelen.',
  'El magnetismo actúa sin contacto: hay un campo magnético alrededor del imán.',
  'La fuerza magnética disminuye cuando aumenta la distancia.',
  'El campo existe aunque no lo veamos: lo revelan las limaduras y la brújula.',
];

export default function Guia({ onAbrir }) {
  return (
    <div className="guia">
      <div className="guia-hero">
        <h3>👩‍🏫 Guía para el aula: Magnetismo con el simulador</h3>
        <p>
          Se proyecta el laboratorio con un videobeam y se desarrollan las experiencias de forma progresiva: los
          estudiantes observan y <strong>formulan sus propias predicciones antes de comprobarlas</strong>.
        </p>
      </div>

      <section>
        <h4 className="guia-titulo">1. ¿Cómo se desarrolla la práctica?</h4>
        <ol className="guia-pasos">
          <li>El docente proyecta el simulador y explica brevemente cómo interactuar con él.</li>
          <li>Se realizan las experiencias de manera progresiva, permitiendo observar y predecir antes de comprobar.</li>
          <li>Durante cada experiencia se plantean preguntas <em>antes</em> de ejecutar la acción.</li>
          <li>Después de cada demostración, algunos estudiantes pasan a la computadora a manipular el simulador.</li>
          <li>Se cierra con una reflexión colectiva y una puesta en común de conclusiones.</li>
        </ol>
      </section>

      <section>
        <h4 className="guia-titulo">2. Experiencias a realizar</h4>
        <p className="guia-nota">Clic en cada experiencia para abrir la simulación correspondiente.</p>
        <div className="guia-experiencias">
          {EXPERIENCIAS.map((e) => (
            <div className="guia-experiencia" key={e.titulo}>
              <div className="guia-experiencia-cab">
                <span className="guia-emoji">{e.emoji}</span>
                <strong>{e.titulo}</strong>
                <span className="guia-sims">
                  {e.sims.map((s) => (
                    <button key={s} className="btn btn-ghost" onClick={() => onAbrir?.(s)}>
                      Abrir →
                    </button>
                  ))}
                </span>
              </div>
              <ul className="guia-acciones">
                {e.acciones.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h4 className="guia-titulo">3. Preguntas antes de ejecutar la acción</h4>
        <div className="guia-preguntas">
          {PREGUNTAS_ANTES.map((p) => (
            <div className="guia-pregunta" key={p}>❓ {p}</div>
          ))}
        </div>
      </section>

      <section>
        <h4 className="guia-titulo">4. Después de cada demostración</h4>
        <p>
          Algunos estudiantes pasan a la computadora para manipular directamente el simulador: cambiar posiciones,
          acercar o alejar los imanes, invertir los polos o seleccionar diferentes materiales. El resto del grupo
          observa el procedimiento y participa indicando qué cree que ocurrirá.
        </p>
      </section>

      <section>
        <h4 className="guia-titulo">5. Reflexión colectiva</h4>
        <div className="guia-preguntas">
          {REFLEXIONES.map((p) => (
            <div className="guia-pregunta" key={p}>💬 {p}</div>
          ))}
        </div>
      </section>

      <section>
        <h4 className="guia-titulo">6. Orientación hacia los conceptos científicos</h4>
        <p className="guia-nota">
          El docente guía las intervenciones para relacionar la experiencia con estos conceptos del desarrollo
          temático:
        </p>
        <div className="guia-conceptos">
          {CONCEPTOS.map((c) => (
            <button key={c.termino} className="guia-concepto" onClick={() => onAbrir?.(c.sims)}>
              {c.termino}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h4 className="guia-titulo">7. Puesta en común de conclusiones</h4>
        <ul className="guia-conclusiones">
          {CONCLUSIONES.map((c) => (
            <li key={c}>✔ {c}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}