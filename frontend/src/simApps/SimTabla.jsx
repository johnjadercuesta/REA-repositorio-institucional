import { useState } from 'react';

const GRUPOS = {
  noMetal: { color: '#bfdbfe', etiqueta: 'No metal' },
  metaloide: { color: '#cbd5e1', etiqueta: 'Metaloide' },
  metal: { color: '#e2e8f0', etiqueta: 'Metal' },
  gasNoble: { color: '#c7d2fe', etiqueta: 'Gas noble' },
  alcalino: { color: '#fecaca', etiqueta: 'Metal alcalino' },
  alcalin: { color: '#fed7aa', etiqueta: 'Alcalinotérreo' },
  halogeno: { color: '#bbf7d0', etiqueta: 'Halógeno' },
};

const ELEMENTOS = [
  { z: 1, s: 'H', n: 'Hidrógeno', m: '1,008', g: 'noMetal', f: 1, c: 1 },
  { z: 2, s: 'He', n: 'Helio', m: '4,003', g: 'gasNoble', f: 1, c: 18 },
  { z: 3, s: 'Li', n: 'Litio', m: '6,94', g: 'alcalino', f: 2, c: 1 },
  { z: 4, s: 'Be', n: 'Berilio', m: '9,01', g: 'alcalin', f: 2, c: 2 },
  { z: 5, s: 'B', n: 'Boro', m: '10,81', g: 'metaloide', f: 2, c: 13 },
  { z: 6, s: 'C', n: 'Carbono', m: '12,01', g: 'noMetal', f: 2, c: 14 },
  { z: 7, s: 'N', n: 'Nitrógeno', m: '14,01', g: 'noMetal', f: 2, c: 15 },
  { z: 8, s: 'O', n: 'Oxígeno', m: '16,00', g: 'noMetal', f: 2, c: 16 },
  { z: 9, s: 'F', n: 'Flúor', m: '18,99', g: 'halogeno', f: 2, c: 17 },
  { z: 10, s: 'Ne', n: 'Neón', m: '20,18', g: 'gasNoble', f: 2, c: 18 },
  { z: 11, s: 'Na', n: 'Sodio', m: '22,99', g: 'alcalino', f: 3, c: 1 },
  { z: 12, s: 'Mg', n: 'Magnesio', m: '24,30', g: 'alcalin', f: 3, c: 2 },
  { z: 13, s: 'Al', n: 'Aluminio', m: '26,98', g: 'metal', f: 3, c: 13 },
  { z: 14, s: 'Si', n: 'Silicio', m: '28,09', g: 'metaloide', f: 3, c: 14 },
  { z: 15, s: 'P', n: 'Fósforo', m: '30,97', g: 'noMetal', f: 3, c: 15 },
  { z: 16, s: 'S', n: 'Azufre', m: '32,06', g: 'noMetal', f: 3, c: 16 },
  { z: 17, s: 'Cl', n: 'Cloro', m: '35,45', g: 'halogeno', f: 3, c: 17 },
  { z: 18, s: 'Ar', n: 'Argón', m: '39,95', g: 'gasNoble', f: 3, c: 18 },
  { z: 19, s: 'K', n: 'Potasio', m: '39,10', g: 'alcalino', f: 4, c: 1 },
  { z: 20, s: 'Ca', n: 'Calcio', m: '40,08', g: 'alcalin', f: 4, c: 2 },
];

export default function SimTabla() {
  const [sel, setSel] = useState(6);
  const seleccionado = ELEMENTOS.find((e) => e.z === sel);

  return (
    <div>
      <div className="leyendas">
        {Object.entries(GRUPOS).map(([k, v]) => (
          <span key={k} className="leyenda" style={{ color: '#334155' }}>
            <span className="swatch" style={{ background: v.color }} />
            {v.etiqueta}
          </span>
        ))}
      </div>

      <div className="tabla">
        {ELEMENTOS.map((e) => {
          const color = GRUPOS[e.g]?.color || '#e2e8f0';
          const activo = e.z === sel;
          return (
            <button
              key={e.z}
              onClick={() => setSel(e.z)}
              className={`celda ${activo ? 'activa' : ''}`}
              style={{
                gridRow: e.f,
                gridColumn: e.c,
                borderColor: color,
                outline: activo ? '3px solid #2563eb' : 'none',
              }}
              title={`${e.n} (${e.z}) — ${GRUPOS[e.g]?.etiqueta}`}
            >
              <b>{e.z}</b>
              <strong>{e.s}</strong>
              <span>{e.n}</span>
            </button>
          );
        })}
      </div>

      {seleccionado && (
        <div className="card ficha" >
          <h3>
            {seleccionado.s} <span className="badge-tipo">{GRUPOS[seleccionado.g]?.etiqueta}</span>
          </h3>
          <p><b>Nombre:</b> {seleccionado.n}</p>
          <p><b>Número atómico (Z):</b> {seleccionado.z}</p>
          <p><b>Masa atómica:</b> {seleccionado.m} u</p>
          <p><b>Período / columna:</b> {seleccionado.f} / {seleccionado.c}</p>
        </div>
      )}
    </div>
  );
}