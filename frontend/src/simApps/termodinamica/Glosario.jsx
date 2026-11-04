import { useState } from 'react';
import { GLOSARIO } from './data.js';
import { Indice } from './ui.jsx';

export default function Glosario() {
  const [busca, setBusca] = useState('');
  const filtrados = GLOSARIO.filter((g) => g.termino.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div>
      <Indice meta="Consultar con rapidez los conceptos clave de la termodinámica." />
      <div className="sim-controles termo-controls">
        <label style={{ gridColumn: '1 / -1' }}>
          🔎 Buscar término
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Escribí una palabra: energía, entropía…" />
        </label>
      </div>
      <div className="termo-glosario">
        {filtrados.map((g) => (
          <div className="card termo-glosario-item" key={g.termino}>
            <div className="termo-glosario-inicial">{g.termino[0].toUpperCase()}</div>
            <div>
              <h4>{g.termino}</h4>
              <p>{g.def}</p>
              <p className="muted"><b>Ejemplo:</b> {g.ejemplo}</p>
            </div>
          </div>
        ))}
        {filtrados.length === 0 && <div className="vacio">No se encontraron términos.</div>}
      </div>
    </div>
  );
}