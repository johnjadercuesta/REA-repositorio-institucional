import { useMemo, useState } from 'react';

export default function SimEstadistica() {
  const [entrada, setEntrada] = useState('4, 7, 8, 8, 9, 10, 12, 15');
  const [bins, setBins] = useState(5);

  const datos = useMemo(() => {
    try {
      const nums = entrada
        .split(/[,\s;]+/)
        .map((s) => Number(s.replace(',', '.')))
        .filter((n) => Number.isFinite(n));
      return nums;
    } catch {
      return [];
    }
  }, [entrada]);

  const stats = useMemo(() => {
    if (!datos.length) return null;
    const sorted = [...datos].sort((a, b) => a - b);
    const n = sorted.length;
    const suma = sorted.reduce((a, b) => a + b, 0);
    const media = suma / n;

    const frec = {};
    let moda = null;
    let maxF = 0;
    for (const v of sorted) {
      frec[v] = (frec[v] || 0) + 1;
      if (frec[v] > maxF) {
        maxF = frec[v];
        moda = v;
      }
    }
    let unicomas = null;
    const modas = [];
    const maxV = Math.max(...Object.values(frec));
    for (const [k, v] of Object.entries(frec)) {
      if (v === maxV) modas.push(Number(k));
    }
    if (modas.length === n) unicomas = 'No hay moda (todos distintos)';
    else unicomas = modas.join(' y ');

    const mediana = n % 2 ? sorted[Math.floor(n / 2)] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
    const varianza = sorted.reduce((a, b) => a + (b - media) ** 2, 0) / n;
    const desvio = Math.sqrt(varianza);
    const rango = sorted[n - 1] - sorted[0];
    return {
      n,
      min: sorted[0],
      max: sorted[n - 1],
      media,
      mediana,
      moda: unicomas,
      varianza,
      desvio,
      rango,
    };
  }, [datos]);

  const histograma = useMemo(() => {
    if (!datos.length) return null;
    const min = Math.min(...datos);
    const max = Math.max(...datos);
    const width = Math.max((max - min) / bins, 1e-9);
    const conteo = new Array(bins).fill(0);
    const etiquetas = [];
    for (const v of datos) {
      const idx = Math.min(bins - 1, Math.floor((v - min) / width));
      conteo[idx]++;
    }
    for (let i = 0; i < bins; i++) {
      const a = min + i * width;
      const b = min + (i + 1) * width;
      etiquetas.push(`${fmt(a)}–${fmt(b)}`);
    }
    const maxC = Math.max(...conteo);
    return { conteo, etiquetas, maxC };
  }, [datos, bins]);

  function fmt(n) {
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
  }

  const probarDatos = ['12, 15, 18, 14, 16, 20, 22, 19, 17, 14', '2, 2, 3, 3, 3, 4, 5, 5'];

  return (
    <div>
      <div className="sim-controles">
        <label style={{ gridColumn: '1 / -1' }}>
          Datos (separados por comas)
          <input value={entrada} onChange={(e) => setEntrada(e.target.value)} placeholder="Ingresá los valores…" />
        </label>
        <label>
          Nº de intervalos (histograma): <strong>{bins}</strong>
          <input type="range" min="3" max="10" value={bins} onChange={(e) => setBins(Number(e.target.value))} />
        </label>
        <div className="sim-presets">
          {probarDatos.map((d, i) => (
            <button key={i} className="btn btn-ghost" onClick={() => setEntrada(d)}>
              Ejemplo {i + 1}
            </button>
          ))}
        </div>
      </div>

      {stats ? (
        <>
          <div className="sim-resultados">
            <span>n = <strong>{stats.n}</strong></span>
            <span>Media (x̄) = <strong>{fmt(stats.media)}</strong></span>
            <span>Mediana = <strong>{fmt(stats.mediana)}</strong></span>
            <span>Moda = <strong>{stats.moda}</strong></span>
            <span>Rango = <strong>{fmt(stats.max - stats.min)}</strong></span>
            <span>Varianza = <strong>{fmt(stats.varianza)}</strong></span>
            <span>Desvío estándar = <strong>{fmt(stats.desvio)}</strong></span>
          </div>

          {histograma && (
            <div className="card" style={{ marginTop: 10 }}>
              <h3>Histograma de frecuencias</h3>
              <div className="hist">
                {histograma.conteo.map((v, i) => (
                  <div key={i} className="hist-bar-col">
                    <span className="hist-num">{v}</span>
                    <div className="hist-fila" style={{ '--p': `${(v / histograma.maxC) * 100}%` }} />
                    <span className="hist-ejex">{histograma.etiquetas[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="alerta info">Ingresá al menos un número para ver el análisis.</div>
      )}

      <p className="muted nota">Medidas de tendencia central, dispersión y un histograma de frecuencias agrupado en intervalos.</p>
    </div>
  );
}