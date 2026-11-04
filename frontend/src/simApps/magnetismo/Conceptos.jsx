import { useState } from 'react';

const SECCIONES = [
  {
    id: 'iman',
    emoji: '🧲',
    titulo: '¿Qué es un imán?',
    resumen: 'Un objeto que atrae el hierro y algunos metales.',
    detalle: [
      'Un imán tiene una propiedad llamada magnetismo: atrae objetos que contienen hierro, cobalto o níquel.',
      'Los imanes pueden ser naturales (como la magnetita) o artificiales (hechos por las personas).',
      'No atraen plástico, madera ni vidrio.',
    ],
    dato: 'La palabra "imán" viene del griego "magnetis lithos", la piedra de Magnesia, una ciudad antigua.',
  },
  {
    id: 'polos',
    emoji: '🔴🔵',
    titulo: 'Polos magnéticos',
    resumen: 'Todo imán tiene dos polos: Norte (N) y Sur (S).',
    detalle: [
      'El polo Norte es el extremo que apunta al norte geográfico cuando el imán gira libremente.',
      'El polo Sur es el extremo opuesto.',
      'Si partís un imán por la mitad, cada mitad vuelve a tener dos polos. ¡Imposible aislar un polo solo!',
    ],
    dato: 'No existen los "monopolos": un imán siempre tiene N y S, aunque lo partas mil veces.',
  },
  {
    id: 'atraccion',
    emoji: '↔️',
    titulo: 'Atracción y repulsión',
    resumen: 'Polos iguales se repelen; polos distintos se atraen.',
    detalle: [
      'N con N se repelen: se empujan y no pueden juntarse.',
      'N con S se atraen: se acercan con fuerza.',
      'Esta es la regla de oro del magnetismo y la que usan los motores.',
    ],
    dato: 'Los "imanes flotantes" de los trenes de levitación usan la repulsión para viajar sin rozamiento.',
  },
  {
    id: 'materiales',
    emoji: '🧱',
    titulo: 'Materiales magnéticos',
    resumen: 'Solo algunos materiales responden al imán.',
    detalle: [
      'Ferromagnéticos: hierro, cobalto y níquel. Se magnetizan mucho y pueden quedar imantados.',
      'Paramagnéticos: aluminio, cobre. Se magnetizan poco y solo mientras hay imán cerca.',
      'Diamagnéticos / no magnéticos: plástico, madera, vidrio, goma. No son atraídos.',
    ],
    dato: 'Un clip de hierro común es invisiblemente magnético: sus "dominios" están desordenados hasta que pasa un imán.',
  },
  {
    id: 'campo',
    emoji: '🌀',
    titulo: 'El campo magnético',
    resumen: 'La zona invisible donde el imán ejerce su fuerza.',
    detalle: [
      'Las líneas de campo salen del polo N y entran por el polo S.',
      'Las líneas juntas y cerca del imán significan campo fuerte; separadas, campo débil.',
      'Las limaduras de hierro dibujan estas líneas: es la forma de "ver" el campo invisible.',
    ],
    dato: 'El campo magnético atraviesa papel, cartón, madera e incluso tu cuerpo.',
  },
  {
    id: 'tierra',
    emoji: '🌍',
    titulo: 'La Tierra es un imán',
    resumen: 'Nuestro planeta tiene un campo magnético gigante.',
    detalle: [
      'El núcleo de la Tierra, hecho de hierro líquido, genera el campo.',
      'Por eso una brújula siempre apunta al norte: sigue las líneas del campo terrestre.',
      'El norte magnético está cerca del sur geográfico: ¡por eso el polo S del "imán Tierra" queda arriba!',
    ],
    dato: 'El campo magnético terrestre protege la vida desviando las partículas peligrosas del Sol.',
  },
  {
    id: 'electro',
    emoji: '⚡',
    titulo: 'Electroimanes',
    resumen: 'Electricidad que crea magnetismo: la corriente por una bobina.',
    detalle: [
      'Un electroimán se construye con una pila, un cable enrollado (bobina) y un núcleo de hierro.',
      'La corriente eléctrica crea el campo magnético; a más espiras o voltaje, más fuerza.',
      'A diferencia de un imán común, el electroimán se puede encender y apagar.',
    ],
    dato: 'Las grúas de los depósitos de chatarra usan electroimanes gigantes para levantar autos enteros.',
  },
  {
    id: 'vida',
    emoji: '🏠',
    titulo: 'Magnetismo en la vida diaria',
    resumen: 'Los imanes están escondidos en muchísimos objetos.',
    detalle: [
      'Heladeras, auriculares, parlantes, teléfonos, carteras y juguetes.',
      'Los trenes de levitación, las tarjetas con banda magnética y las resonancias magnéticas.',
      'La brújula, uno de los inventos más importantes de la historia, funciona con magnetismo.',
    ],
    dato: 'Sin imanes no existirían los parlantes de tu celular ni los motores de los autos eléctricos.',
  },
];

export default function Conceptos() {
  const [abierta, setAbierta] = useState(SECCIONES[0].id);

  return (
    <div className="conceptos">
      {SECCIONES.map((s) => (
        <div key={s.id} className={`concepto ${abierta === s.id ? 'abierto' : ''}`}>
          <button className="concepto-cabecera" onClick={() => setAbierta(abierta === s.id ? null : s.id)}>
            <span className="concepto-emoji">{s.emoji}</span>
            <span className="concepto-texto">
              <strong>{s.titulo}</strong>
              <small>{s.resumen}</small>
            </span>
            <span className="concepto-flecha">{abierta === s.id ? '▾' : '▸'}</span>
          </button>
          {abierta === s.id && (
            <div className="concepto-cuerpo">
              {s.detalle.map((d, i) => (
                <p key={i}>{d}</p>
              ))}
              <p className="reto-explicacion">⭐ {s.dato}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}