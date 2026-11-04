import PizarraCompartida from './PizarraCompartida.jsx';

export default function SalaPizarra({ socket, salaId, esAnfitrion, autor }) {
  return (
    <div>
      <PizarraCompartida
        socket={socket}
        prefijo="sala:pizarra"
        joinPayload={{ salaId }}
        puedeControlar={esAnfitrion}
        autor={autor}
      />
    </div>
  );
}