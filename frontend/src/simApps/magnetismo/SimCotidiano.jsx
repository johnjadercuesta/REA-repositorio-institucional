import { useEffect, useRef, useState } from 'react';
import { useTour, PanelAula } from './Tour.jsx';

const PASOS = [
  { id: 'intro', texto: 'El magnetismo está en muchos objetos de tu casa. Tocá cada uno y adiviná si esconde un imán.', duracion: 4200 },
  { id: 'parlante', texto: 'El parlante de los auriculares usa un imán que hace vibrar la membrana con el sonido.', duracion: 5000 },
  { id: 'heladera', texto: 'La puerta de la heladera se sella sola gracias a una banda magnética en el borde.', duracion: 4800 },
  { id: 'no', texto: 'La madera, el vidrio, la cerámica y la goma no esconden imanes: el imán no las atrae.', duracion: 5000 },
  { id: 'cierre', texto: 'Brújulas, parlantes, motores y cierres magnéticos usan esta fuerza todos los días.', duracion: 4200 },
];

const OBJETOS = [
  { id: 'heladera', nombre: 'Heladera', emoji: '🧊', es: true, ex: 'El cierre de la puerta usa una banda magnética para sellar.' },
  { id: 'pizarra', nombre: 'Pizarra blanca', emoji: '📋', es: true, ex: 'Los marcadores se pegan con un pequeño imán.' },
  { id: 'auris', nombre: 'Auriculares', emoji: '🎧', es: true, ex: 'Dentro del parlante hay un imán que hace vibrar el sonido.' },
  { id: 'cartera', nombre: 'Cartera con cierre', emoji: '👝', es: true, ex: 'El cierre se mantiene cerrado con un imán.' },
  { id: 'telefono', nombre: 'Teléfono', emoji: '📱', es: true, ex: 'Su micro-altavoz y el cargador inalámbrico usan imanes.' },
  { id: 'brújula', nombre: 'Brújula', emoji: '🧭', es: true, ex: 'Es un imán que gira libremente: siempre señala el norte.' },
  { id: 'juguete', nombre: 'Juguete de bloques', emoji: '🧸', es: true, ex: 'Los bloques se unen gracias a imanes adentro.' },
  { id: 'taza', nombre: 'Taza de cerámica', emoji: '☕', es: false, ex: 'La cerámica no es atraída por un imán.' },
  { id: 'cuaderno', nombre: 'Cuaderno', emoji: '📓', es: false, ex: 'El papel no contiene materiales magnéticos.' },
  { id: 'cucharon', nombre: 'Cucharón de madera', emoji: '🍜', es: false, ex: 'La madera no se magnetiza.' },
  { id: 'pelota', nombre: 'Pelota de goma', emoji: '🏀', es: false, ex: 'La goma no responde al imán.' },
  { id: 'botella', nombre: 'Botella de vidrio', emoji: '🍾', es: false, ex: 'El vidrio no es magnético.' },
];

export default function SimCotidiano() {
  const tour = useTour(PASOS);
  const tourRef = useRef(tour);
  tourRef.current = tour;

  const [vistos, setVistos] = useState({});

  useEffect(() => {
    if (!tour.jugando) return;
    if (tour.pasoId === 'parlante') {
      setVistos((s) => ({ ...s, auris: true, telefono: true }));
    } else if (tour.pasoId === 'heladera') {
      setVistos((s) => ({ ...s, heladera: true, pizarra: true }));
    } else if (tour.pasoId === 'no') {
      setVistos((s) => ({ ...s, taza: false, cucharon: false, pelota: false, botella: false }));
    }
  }, [tour.pasoId, tour.jugando]);

  const aciertos = OBJETOS.filter((o) => vistos[o.id] !== undefined && vistos[o.id] === o.es).length;
  const total = Object.keys(vistos).length;
  const completado = total === OBJETOS.length;

  function reiniciar() {
    setVistos({});
    tour.reiniciar();
  }

  return (
    <div>
      <PanelAula
        objetivo="Descubrí en qué objetos de tu vida cotidiana se esconde un imán."
        tour={tour}
        onReiniciar={reiniciar}
      />

      <div className="sim-controles">
        <span className="muted">
          Tocá cada objeto y adiviná: <strong>¿esconde un imán?</strong> Después tocá el círculo para confirmar.
        </span>
      </div>

      <div className="magneto-grilla cotidiano">
        {OBJETOS.map((o) => {
          const v = vistos[o.id];
          return (
            <div
              key={o.id}
              className={`magneto-objeto ${v !== undefined ? (v === o.es ? 'acierto' : 'error') : ''}`}
              onClick={() => setVistos((s) => ({ ...s, [o.id]: o.es }))}
            >
              <div className="magneto-objeto-emoji">{o.emoji}</div>
              <div className="magneto-objeto-nombre">{o.nombre}</div>
              <div className={`magneto-resultado ${v !== undefined ? (o.es ? 'si' : 'no') : 'oculto'}`}>
                {v !== undefined ? (v ? 'ES UN IMÁN' : 'SIN IMÁN') : '? ADIVINÁ'}
              </div>
              {v !== undefined && <div className="magneto-explicacion">{o.ex}</div>}
            </div>
          );
        })}
      </div>

      <div className="sim-resultados">
        <span>
          Descubiertos: <strong>{total} / {OBJETOS.length}</strong> · Aciertos: <strong>{aciertos}</strong>
        </span>
        {completado && <span className="ok">¡Completaste el desafío! El magnetismo está en todos lados. 🎉</span>}
      </div>

      <div className="termo-retro ok">
        <strong>Conclusión</strong>
        <p>
          El magnetismo no es solo de la clase de física: brújulas, parlantes, motores, timbres, cierres de carteras y
          heladeras lo usan todos los días.
        </p>
      </div>
    </div>
  );
}