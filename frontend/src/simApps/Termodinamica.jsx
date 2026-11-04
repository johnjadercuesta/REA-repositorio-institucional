import { Component, useEffect, useState } from 'react';
import { MODULOS, HOOKS, VIDA_HOME } from './termodinamica/data.js';
import ModuloVida from './termodinamica/ModuloVida.jsx';
import SimTransferencia from './termodinamica/SimTransferencia.jsx';
import SimCalor from './termodinamica/SimCalor.jsx';
import SimEnergia from './termodinamica/SimEnergia.jsx';
import SimJoule from './termodinamica/SimJoule.jsx';
import SimLeyCero from './termodinamica/SimLeyCero.jsx';
import SimPrimeraLey from './termodinamica/SimPrimeraLey.jsx';
import SimCarnot from './termodinamica/SimCarnot.jsx';
import SimTerceraLey from './termodinamica/SimTerceraLey.jsx';
import SimProcesos from './termodinamica/SimProcesos.jsx';
import SimEntropia from './termodinamica/SimEntropia.jsx';
import Laboratorio from './termodinamica/Laboratorio.jsx';
import Actividades from './termodinamica/Actividades.jsx';
import Evaluacion from './termodinamica/Evaluacion.jsx';
import Glosario from './termodinamica/Glosario.jsx';
import Recursos from './termodinamica/Recursos.jsx';

const COMPONENTES = {
  'calor-temperatura': SimCalor,
  'transferencia': SimTransferencia,
  'energia-termica': SimEnergia,
  'equivalente-mecanico': SimJoule,
  'ley-cero': SimLeyCero,
  'primera-ley': SimPrimeraLey,
  'segunda-ley': SimCarnot,
  'tercera-ley': SimTerceraLey,
  procesos: SimProcesos,
  entropia: SimEntropia,
  laboratorio: Laboratorio,
  actividades: Actividades,
  evaluacion: Evaluacion,
  glosario: Glosario,
  recursos: Recursos,
};

const CLAVE = 'rea_termo_prog';

class Frontera extends Component {
  state = { error: null };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="alerta error">
          Ocurrió un problema al dibujar este módulo.
          <button className="btn" style={{ marginLeft: 8 }} onClick={() => this.setState({ error: null })}>Reintentar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const DIF_COLOR = { Básico: '#16a34a', Intermedio: '#d97706', Avanzado: '#dc2626', Variable: '#7c3aed', '—': '#64748b' };

export default function Termodinamica() {
  const [activo, setActivo] = useState(null);
  const [prog, setProg] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CLAVE)) || { completados: [], predichos: [], puntaje: 0 };
    } catch {
      return { completados: [], predichos: [], puntaje: 0 };
    }
  });

  useEffect(() => {
    localStorage.setItem(CLAVE, JSON.stringify(prog));
  }, [prog]);

  const completar = (slug) => {
    setProg((p) =>
      p.completados.includes(slug)
        ? { ...p, puntaje: p.puntaje + 5 }
        : { ...p, completados: [...p.completados, slug], puntaje: p.puntaje + 15 }
    );
  };
  const marcarPrediccion = (slug) => {
    setProg((p) =>
      (p.predichos || []).includes(slug) ? p : { ...p, predichos: [...(p.predichos || []), slug], puntaje: p.puntaje + 5 }
    );
  };
  const puntaje = prog.puntaje;
  const terminados = prog.completados;
  const pct = Math.round((MODULOS.filter((m) => terminados.includes(m.slug)).length / MODULOS.length) * 100);
  const siguientes = MODULOS.map((m) => m.slug).filter((s) => !terminados.includes(s));
  const siguiente = siguientes[0] || null;
  const accionRapida = (slug) => setActivo(slug);

  if (activo) {
    const mod = MODULOS.find((m) => m.slug === activo);
    const Comp = COMPONENTES[activo];
    const idx = MODULOS.findIndex((m) => m.slug === activo);
    const prox = MODULOS[idx + 1];
    return (
      <div>
        <div className="page-head">
          <div>
            <button className="btn btn-ghost" onClick={() => setActivo(null)}>‹ Tablero de módulos</button>
            <h1 style={{ marginTop: 8 }}>{mod.n} · {mod.titulo}</h1>
          </div>
        </div>
        <p className="badge-tipo" style={{ display: 'inline-block' }}>{mod.nivel}</p>
        <div className="alerta info" style={{ marginBottom: 14 }}>{mod.meta}</div>

        {!terminados.includes(activo) && (
          <div className="termo-acciones">
            <button className="btn btn-primary" onClick={() => completar(activo)}>✅ Marcar módulo completado (+15)</button>
            <button className="btn" onClick={() => setProg({ ...prog, puntaje: puntaje + 5 })}>Sumar 5 pts</button>
          </div>
        )}
        {terminados.includes(activo) && <p className="alerta ok" style={{ display: 'inline-block' }}>✔ Módulo completado</p>}

        <Frontera>
          <div className="termo-modulo">
            <ModuloVida hook={HOOKS[activo]} yaPredicho={(prog.predichos || []).includes(activo)} onMarcar={() => marcarPrediccion(activo)}>
              <Comp />
            </ModuloVida>
          </div>
        </Frontera>

        <div className="termo-acciones" style={{ marginTop: 18 }}>
          {prox && prox.slug !== activo && (
            <button className="btn btn-primary" onClick={() => setActivo(prox.slug)}>
              Continuar: {prox.n} · {prox.titulo} →
            </button>
          )}
          <button className="btn" onClick={() => setActivo(null)}>Volver al tablero</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="termo-hero">
        <div>
          <h1>TERMODINÁMICA INTERACTIVA</h1>
          <p>Experimentos virtuales + ejemplos de tu vida diaria: aprendé cómo se transfiere y transforma la energía.</p>
          <div className="termo-acciones">
            <button className="btn btn-primary" onClick={() => accionRapida(siguiente || 'calor-temperatura')}>
              {siguiente ? `Continuar: ${MODULOS.find((m) => m.slug === siguiente).titulo}` : 'Repasar desde el inicio'}
            </button>
            <button className="btn" onClick={() => accionRapida('laboratorio')}>🔬 Laboratorio virtual</button>
            <button className="btn" onClick={() => accionRapida('evaluacion')}>📝 Evaluación</button>
            <button className="btn" onClick={() => accionRapida('glosario')}>📖 Glosario</button>
          </div>
        </div>
        <div className="termo-hero-stat">
          <div className="termo-progress" style={{ width: 180 }}><div style={{ width: `${pct}%` }} /></div>
          <p className="muted" style={{ margin: 0 }}>Progreso general: {pct}%</p>
          <p className="muted" style={{ margin: 0 }}>Módulos completados: {MODULOS.filter((m) => terminados.includes(m.slug)).length}/{MODULOS.length}</p>
          <p className="muted" style={{ margin: 0 }}>Puntaje obtenido: <b>{puntaje} pts</b></p>
        </div>
      </div>

      <div className="card termo-vida-home">
        <h3>⚡ La termodinámica está en tu día a día: elegí una situación</h3>
        <p className="muted" style={{ marginTop: 0 }}>Cada ejemplo cotidiano abre el módulo que lo explica.</p>
        <div className="termo-home-chips">
          {VIDA_HOME.map((v) => {
            const mod = MODULOS.find((m) => m.slug === v.slug);
            const hecho = terminados.includes(v.slug);
            return (
              <button className={`termo-home-chip ${hecho ? 'hecho' : ''}`} key={v.slug} onClick={() => accionRapida(v.slug)}>
                <span className="termo-home-emoji">{v.e}</span>
                <span>
                  <strong>{v.t}</strong>
                  <small>{mod?.titulo}{hecho ? ' · ✔' : ''}</small>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="termo-grid">
        {MODULOS.map((m) => {
          const hecho = terminados.includes(m.slug);
          return (
            <div className={`card termo-tarjeta ${hecho ? 'hecho' : ''}`} key={m.slug}>
              <div className="termo-tarjeta-fila">
                <span className="badge-tipo">{m.nivel}</span>
                <span className="pill" style={{ borderColor: DIF_COLOR[m.dif] }}>{m.dif}</span>
              </div>
              <h3>{m.titulo}</h3>
              <p>{m.desc}</p>
              <div className="termo-acciones">
                <button className="btn btn-primary" onClick={() => accionRapida(m.slug)}>{hecho ? 'Repasar' : 'Comenzar'}</button>
                {hecho && <span className="pill ok">✔</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}