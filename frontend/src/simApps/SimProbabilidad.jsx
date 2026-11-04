import { useState } from 'react';

function fact(n) {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}
function comb(n, k) {
  if (k < 0 || k > n) return 0;
  return fact(n) / (fact(k) * fact(n - k));
}

const CARAS = ['1', '2', '3', '4', '5', '6'];

export default function SimProbabilidad() {
  const [modo, setModo] = useState('permu');
  const [n, setN] = useState(5);
  const [r, setR] = useState(3);
  const [tiradas, setTiradas] = useState(60);
  const [dado, setDado] = useState(null);
  const [res, setRes] = useState(null);

function calcular(e) {
    e.preventDefault();
    if (modo === 'permu') {
      setRes({ texto: `P(${n}) = ${fact(n)}`, detalle: `Permutaciones: formas de ordenar los ${n} elementos` });
    } else {
      setRes({ texto: `C(${n}, ${r}) = ${comb(n, r)}`, detalle: `Grupos de ${r} elementos elegidos entre ${n}, sin importar el orden` });
    }
  }

  function lanzar(e) {
    e.preventDefault();
    const t = Number(tiradas);
    const conteo = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < t; i++) conteo[Math.floor(Math.random() * 6)]++;
    setDado({ conteo, total: t });
  }

  return (
    <div>
      <div className="tabs sim-app-tab" style={{ marginBottom: 14 }}>
<button className={modo === 'permu' || modo === 'comb' ? 'active' : ''} onClick={() => setModo('permu')}>
          Conteo / ordenar
        </button>
        <button className={modo === 'dado' ? 'active' : ''} onClick={() => setModo('dado')}>
          Experimento: dado
        </button>
      </div>

      {modo === 'dado' ? (
        <div className="sim-controles">
          <label>
            Tiradas: <strong>{tiradas}</strong>
            <input type="range" min="12" max="600" step="12" value={tiradas} onChange={(e) => setTiradas(Number(e.target.value))} />
          </label>
          <button className="btn" onClick={lanzar} style={{ alignSelf: 'end' }}>
            Lanzar dado
          </button>
        </div>
      ) : (
        <form className="sim-controles" onSubmit={calcular}>
          <label>
            Tipo
            <select
              value={modo}
              onChange={(e) => {
                setModo(e.target.value);
                setRes(null);
              }}
            >
              <option value="permu">Permutaciones P(n)</option>
              <option value="comb">Combinaciones C(n, r)</option>
            </select>
          </label>
          <label>
            n: <strong>{n}</strong>
            <input type="range" min="1" max="10" value={n} onChange={(e) => setN(Number(e.target.value))} />
          </label>
          {modo === 'comb' && (
            <label>
              r: <strong>{Math.min(r, n)}</strong>
              <input type="range" min="1" max={n} value={Math.min(r, n)} onChange={(e) => setR(Number(e.target.value))} />
            </label>
          )}
          <button className="btn" type="submit">
            Calcular
          </button>
        </form>
      )}

      {res && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3>{res.texto}</h3>
          <p className="muted">{res.detalle}</p>
        </div>
      )}

      {dado && (
        <div className="card" style={{ marginTop: 12 }}>
          <p>
            En <strong>{dado.total}</strong> tiradas, la frecuencia relativa se aproxima a la probabilidad teórica P = 1/6 (
            ≈ 0,1667).
          </p>
          <div className="dado-barras">
            {dado.conteo.map((v, i) => (
              <div key={i} className="dado-barra">
                <span className="dado-num">{v}</span>
                <div className="dado-fila" style={{ '--p': `${(v / dado.total) * 100}%` }} />
                <span className="dado-ejex">{CARAS[i]}</span>
              </div>
            ))}
          </div>
          <p className="muted">
            P(resultado par) ≈ <strong>{(FreqPar(dado) / dado.total).toFixed(3)}</strong> · P(≥ 4) ≈{' '}
            <strong>{((dado.conteo[3] + dado.conteo[4] + dado.conteo[5]) / dado.total).toFixed(3)}</strong>
          </p>
        </div>
      )}

      <p className="muted nota">
        La probabilidad teórica de cada cara es 1/6. A mayor cantidad de tiradas, la frecuencia relativa se acerca más al valor
        teórico (Ley de los grandes números).
      </p>
    </div>
  );
}

function FreqPar(d) {
  return d.conteo[1] + d.conteo[3] + d.conteo[5];
}