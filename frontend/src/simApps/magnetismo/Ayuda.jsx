const AYUDAS = [
  { sim: '¿Qué atrae un imán?', accion: 'Arrastrá el imán o mové el deslizador por la pista. Acercalo a cada objeto para descubrir si lo atrae.' },
  { sim: 'Polos del imán', accion: 'Arrastrá los imanes para acercarlos y activá los interruptores para invertir sus polos.' },
  { sim: 'Atracción y repulsión', accion: 'Mové el deslizador de distancia y probá las combinaciones de polos. Mirá las flechas y la escala.' },
  { sim: 'Campo magnético', accion: 'Cambiá la orientación y la intensidad. Arrastrá la brújula por el lienzo para explorar el campo.' },
  { sim: 'Intensidad y temperatura', accion: 'Subí la fuerza del imán y, después, subí la temperatura para ver cómo se desordenan las limaduras.' },
  { sim: 'Materiales', accion: 'Elegí un material de la lista y tocá «Probar con el imán». Llená la grilla de la derecha.' },
  { sim: 'Fuerza y distancia', accion: 'Achicá y agrandá la distancia para ver cómo cambia la flecha de fuerza.' },
  { sim: 'Construí tu imán', accion: 'Agregá objetos con los botones. Tocá la barra para magnetizarla y acercá clips.' },
  { sim: 'Magnético o no', accion: 'Elegí el material y experimentá con la cercanía del imán y la temperatura.' },
  { sim: 'Electroimán', accion: 'Encendelo, probá con más espiras y más voltaje. Cuidá la batería: se gasta.' },
  { sim: 'La Tierra, un imán', accion: 'Mové el viajero por distintas latitudes y mirá cómo gira la brújula.' },
  { sim: 'En la vida diaria', accion: 'Tocá cada objeto para descubrir si esconde un imán y leé la explicación.' },
];

const PREGUNTAS_FREC = [
  ['¿Necesito instalar algo?', 'No. El laboratorio funciona en cualquier navegador moderno (celular, tablet o computadora).'],
  ['¿Por qué algunos metales no se atraen?', 'Porque solo los que contienen hierro, cobalto o níquel responden al imán. El aluminio o el cobre puros casi no reaccionan.'],
  ['¿Qué es un polo magnético?', 'Es el extremo del imán. Todo imán tiene un polo Norte y un polo Sur.'],
  ['¿Por qué se apaga el electroimán?', 'Porque el magnetismo lo crea la corriente eléctrica: al cortar la corriente, desaparece el campo. La batería también se gasta con el uso.'],
  ['¿Cómo se guarda mi progreso?', 'Las respuestas de los retos y las visitas se guardan en el navegador de tu dispositivo. Podés reiniciarlo desde la pestaña Resultados.'],
];

export default function Ayuda() {
  return (
    <div className="ayuda">
      <h3>¿Cómo usar el laboratorio?</h3>
      <ol className="ayuda-pasos">
        <li>Elegí una simulación en la pestaña «Simulaciones».</li>
        <li>Experimentá con los controles: deslizadores, interruptores y arrastres.</li>
        <li>Respondé los retos en la pestaña «Retos» para poner a prueba lo aprendido.</li>
        <li>Consultá la pestaña «Conceptos» para repasar la teoría con datos curiosos.</li>
      </ol>

      <h3>Guía rápida de cada simulación</h3>
      <ul className="ayuda-guia">
        {AYUDAS.map((a) => (
          <li key={a.sim}>
            <strong>{a.sim}:</strong> {a.accion}
          </li>
        ))}
      </ul>

      <h3>Preguntas frecuentes</h3>
      {PREGUNTAS_FREC.map(([p, r]) => (
        <div key={p} className="ayuda-faq">
          <p className="reto-pregunta"><strong>❓ {p}</strong></p>
          <p>{r}</p>
        </div>
      ))}

      <h3>Para docentes</h3>
      <p>
        Este laboratorio acompaña contenidos de ciencias naturales sobre magnetismo (primer ciclo de secundaria). Las
        simulaciones permiten experimentar de manera segura conceptos que en el aula necesitan material físico. Sugerencia:
        combinar la simulación «Materiales» con objetos reales para comparar.
      </p>
    </div>
  );
}