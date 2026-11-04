import { useState } from 'react';
import { CONSTANTES, UNIDADES, ETIQUETAS_FICHA } from './data.js';
import { Indice } from './ui.jsx';

const FORMULAS = [
  ['Calor sensible', 'Q = m·c·ΔT', 'Energía transferida por cambio de temperatura'],
  ['Trabajo mecánico', 'W = m·g·h', 'Neumático y potencial gravitatoria'],
  ['Primera ley', 'ΔU = Q − W', 'Conservación de la energía'],
  ['Rendimiento', 'η = W/Qₕ', 'Fracción de calor convertida en trabajo'],
  ['Rendimiento de Carnot', 'η_max = 1 − Tc/Th', 'Límite teórico de una máquina'],
  ['Entropía (rev.)', 'ΔS = Q_rev / T', 'Definición termodinámica'],
  ['Gas ideal', 'P·V = n·R·T', 'Relación entre estado'],
  ['Escala Kelvin', 'T(K) = T(°C) + 273,15', 'Conversión de temperatura'],
  ['Equivalente mecánico', '1 cal = 4,186 J', 'Medido por Joule'],
  ['Capacidad calorífica', 'C = m·c', 'Energía por grado del cuerpo completo'],
];

const CONVERSIONS = [
  '1 cal = 4,186 J',
  '1 kcal = 1 000 cal = 4 186 J',
  '0 °C = 273,15 K',
  '0 K = −273,15 °C',
  '1 atm = 101 325 Pa',
  '1 L = 0,001 m³',
  '1 W = 1 J/s',
];

export default function Recursos() {
  const [ficha, setFicha] = useState({});
  const guardarFicha = () => localStorage.setItem('rea_termo_ficha', JSON.stringify(ficha));
  const cargar = () => {
    try {
      setFicha(JSON.parse(localStorage.getItem('rea_termo_ficha')) || {});
    } catch {
      setFicha({});
    }
  };

  return (
    <div>
      <Indice meta="Resumen, fórmulas, unidades y material de consulta para repasar." />

      <div className="card termo-seccion">
        <h3>🧠 Resumen conceptual</h3>
        <p>La <b>temperatura</b> mide la agitación de las partículas; el <b>calor</b> es la energía que se transfiere entre cuerpos a distinta temperatura. La <b>primera ley</b> (ΔU = Q − W) dice que la energía se conserva; la <b>segunda ley</b> marca la dirección de los procesos: el calor va solo del caliente al frío y la entropía total de un sistema aislado no disminuye. La <b>tercera ley</b> fija el cero absoluto (0 K) como límite inalcanzable.</p>
      </div>

      <div className="card termo-seccion">
        <h3>🧮 Fórmulas principales</h3>
        <table className="termo-tabla">
          <thead><tr><th>Concepto</th><th>Fórmula</th><th>Uso</th></tr></thead>
          <tbody>{FORMULAS.map((f) => <tr key={f[0]}><td>{f[0]}</td><td><code>{f[1]}</code></td><td>{f[2]}</td></tr>)}</tbody>
        </table>
      </div>

      <div className="card termo-seccion">
        <h3>📦 Unidades y conversiones</h3>
        <table className="termo-tabla">
          <thead><tr><th>Unidad</th><th>Símbolo</th><th>Uso</th><th>Conversión</th></tr></thead>
          <tbody>{UNIDADES.map((u) => <tr key={u.nombre}><td>{u.nombre}</td><td>{u.simbolo}</td><td>{u.uso}</td><td>{u.conv || '—'}</td></tr>)}</tbody>
        </table>
        <p className="muted" style={{ marginTop: 8 }}>{CONVERSIONS.join(' · ')}</p>
      </div>

      <div className="card termo-seccion">
        <h3>🔢 Constantes útiles</h3>
        <table className="termo-tabla">
          <thead><tr><th>Nombre</th><th>Valor</th><th>Unidad</th></tr></thead>
          <tbody>{CONSTANTES.map((k) => <tr key={k.nombre}><td>{k.nombre}</td><td><code>{k.valor}</code></td><td>{k.unidad}</td></tr>)}</tbody>
        </table>
      </div>

      <div className="card termo-seccion">
        <h3>🧪 Ejemplos resueltos</h3>
        <ol className="termo-ejemplos">
          <li><b>Calor necesario:</b> Q = m·c·ΔT = 1 kg · 4186 J/(kg·K) · 50 K = <b>209 300 J</b> para calentar 1 kg de agua de 20 a 70 °C.</li>
          <li><b>Equivalente mecánico:</b> una pesa de 2 kg cae 1 m desde el reposo: W = 2·9,81·1 ≈ <b>19,6 J</b>, que equivalen a ~4,7 cal.</li>
          <li><b>Rendimiento:</b> motor con Qₕ = 1000 J y W = 250 J: η = 25 %.</li>
          <li><b>Primera ley:</b> si Q = 500 J y W = 200 J ⇒ ΔU = 300 J.</li>
        </ol>
      </div>

      <div className="card termo-seccion">
        <h3>🗒️ Ficha de laboratorio (para la clase)</h3>
        {ETIQUETAS_FICHA.map((et, i) => (
          <label key={i} className="termo-ficha-label">
            {et}
            <textarea rows="2" value={ficha[i] || ''} onChange={(e) => setFicha((f) => ({ ...f, [i]: e.target.value }))} placeholder="Escribí acá…" />
          </label>
        ))}
        <div className="termo-acciones">
          <button className="btn btn-primary" onClick={guardarFicha}>Guardar ficha</button>
          <button className="btn" onClick={cargar}>Cargar ficha guardada</button>
          <button className="btn" onClick={() => setFicha({})}>Limpiar</button>
        </div>
      </div>
    </div>
  );
}