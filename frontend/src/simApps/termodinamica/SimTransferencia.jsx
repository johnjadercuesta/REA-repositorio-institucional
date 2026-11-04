import { useEffect, useRef, useState } from 'react';
import { ModoSelector, Retro, Dato, Indice } from './ui.jsx';

const MECANISMOS = [
  { k: 'conduccion', label: '🍴 Conducción', desc: 'Contacto directo (sólidos)' },
  { k: 'conveccion', label: '🌊 Convección', desc: 'Movimiento de fluidos' },
  { k: 'radiacion', label: '☀️ Radiación', desc: 'Ondas (sin medio)' },
];

const OBJETIVOS = {
  conduccion: 'Observá cómo el calor viaja partícula a partícula a través del metal, desde el extremo caliente. Eso es conducción: solo hace falta contacto directo.',
  conveccion: 'Mirá el agua hirviendo: la parte caliente sube (baja densidad) y la fría desciende, formando corrientes de convección.',
  radiacion: 'El Sol te calienta sin tocar el aire: la energía viaja como ondas. A más distancia, más débil llega (ley del inverso del cuadrado).',
};

const EJEMPLOS = [
  { texto: 'La cuchara de metal dentro de la sopa caliente quema la mano.', correcto: 'conduccion' },
  { texto: 'El agua de la olla da vueltas solas cuando hierve.', correcto: 'conveccion' },
  { texto: 'El calor del Sol llega a la Tierra por el espacio vacío.', correcto: 'radiacion' },
  { texto: 'La base caliente de la plancha alisa la camisa al tocarla.', correcto: 'conduccion' },
  { texto: 'Encender el aire acondicionado mueve el aire fresco por la habitación.', correcto: 'conveccion' },
  { texto: 'Te calentás alrededor de la fogata sin tocarla.', correcto: 'radiacion' },
  { texto: 'Sostenés una barra de hierro calentada por el otro extremo y se calienta.', correcto: 'conduccion' },
  { texto: 'Las corrientes de aire de un ventilador te refrescan.', correcto: 'conveccion' },
  { texto: 'Una estufa infrarroja te calienta sin acercarte ni mover el aire.', correcto: 'radiacion' },
  { texto: 'El mango de la olla de metal se calienta aunque solo la llama tenga contacto con el fondo.', correcto: 'conduccion' },
];

function seed(i) {
  return Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
}

export default function SimTransferencia() {
  const canvasRef = useRef(null);
  const [modo, setModo] = useState('conduccion');
  const [tFuente, setTFuente] = useState(80);
  const [flama, setFlama] = useState(false);
  const [distancia, setDistancia] = useState(40);
  const [puntos, setPuntos] = useState(0);
  const [pregunta, setPregunta] = useState(null);
  const estadoRef = useRef({ t: 0, paso: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let ultimo = performance.now();

    const frame = (ahora) => {
      const dt = Math.min((ahora - ultimo) / 1000, 0.05);
      ultimo = ahora;
      estadoRef.current.t += dt;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, w, h);
      if (modo === 'conduccion') dibujarConduccion(ctx, w, h, tFuente, estadoRef.current.t);
      else if (modo === 'conveccion') dibujarConveccion(ctx, w, h, flama, estadoRef.current.t);
      else dibujarRadiacion(ctx, w, h, distancia, estadoRef.current.t);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, tFuente, flama, distancia]);

  function dibujarConduccion(ctx, w, h, tF, t) {
    const ancho = w - 80;
    const x0 = 70;
    const y = h / 2;
    // barra
    const grad = ctx.createLinearGradient(x0, 0, x0 + ancho, 0);
    grad.addColorStop(0, '#ef4444');
    grad.addColorStop(0.5, '#f59e0b');
    grad.addColorStop(1, '#3b82f6');
    ctx.fillStyle = '#475569';
    ctx.fillRect(x0 - 6, y - 26, ancho + 12, 52);
    ctx.fillStyle = grad;
    ctx.fillRect(x0, y - 20, ancho, 40);
    // partículas que vibran (más rápido cuanto más caliente)
    const n = 26;
    for (let i = 0; i < n; i++) {
      const px = x0 + (i / n) * ancho;
      const temp = tF * (1 - i / n) + 20 * (i / n);
      const vel = 0.3 + (temp / 100) * 9;
      const amp = 1.5 + (temp / 100) * 6;
      const py = y + Math.sin(seed(i) * 100 + t * vel) * amp;
      ctx.fillStyle = temp > 50 ? '#dc2626' : temp > 30 ? '#f59e0b' : '#2563eb';
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // flechas de calor
    ctx.fillStyle = '#f97316';
    for (let i = 0; i < 3; i++) {
      const ax = x0 + ((t * 40 + i * ancho / 3) % ancho);
      ctx.beginPath();
      ctx.moveTo(ax - 8, y - 30);
      ctx.lineTo(ax + 4, y - 30);
      ctx.lineTo(ax, y - 38);
      ctx.fill();
    }
    // fuente y etiquetas
    ctx.fillStyle = '#7c2d12';
    ctx.font = 'icon 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🔥 fuente', 4, y - 26);
    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`${tF} °C`, x0 + 4, y - 28);
  }

  function dibujarConveccion(ctx, w, h, on, t) {
    const x0 = w / 2 - 110;
    const ancho = 220;
    const baseY = h - 40;
    // olla
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.strokeRect(x0, baseY - 150, ancho, 150);
    ctx.fillStyle = 'rgba(96,165,250,0.35)';
    ctx.fillRect(x0, baseY - 150, ancho, 150);
    if (on) {
      // llama
      for (let i = 0; i < 4; i++) {
        const lx = x0 + (i + 0.5) * ancho / 4;
        const alto = 16 + Math.sin(t * 8 + i * 1.7) * 4;
        const grd = ctx.createLinearGradient(0, baseY, 0, baseY - alto);
        grd.addColorStop(0, '#f97316');
        grd.addColorStop(1, '#fde047');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.moveTo(lx - 8, baseY);
        ctx.quadraticCurveTo(lx, baseY - alto, lx + 8, baseY);
        ctx.fill();
      }
      // corrientes: circulación en dos columnas
      const n = 14;
      for (let i = 0; i < n; i++) {
        const frac = ((t * 0.22 + i / n) % 1);
        const pos = frac < 0.5 ? 0.5 + frac * 2 : frac * 2 - 0.5;
        const lado = frac < 0.5 ? 0 : 1; // 0=sube izq, 1=baja der
        const px = x0 + (lado === 0 ? ancho * 0.3 : ancho * 0.7) + Math.sin(t * 3 + i) * 3;
        const py = baseY - 8 - pos * (150 - 16);
        ctx.fillStyle = lado === 0 ? '#ef4444' : '#2563eb';
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      // flechas de corrientes
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(x0 + ancho * 0.3, baseY - 8);
      ctx.lineTo(x0 + ancho * 0.3, baseY - 130);
      ctx.moveTo(x0 + ancho * 0.7, baseY - 130);
      ctx.lineTo(x0 + ancho * 0.7, baseY - 8);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'italic 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sin fuego: el agua descansa', w / 2, h / 2);
    }
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(on ? '🔥 agua hirviendo → corrientes' : '💦 agua fría', w / 2, baseY - 6);
  }

  function dibujarRadiacion(ctx, w, h, d, t) {
    const solX = 70;
    const solY = h / 2;
    const objX = w - 120;
    // Sol
    const grad = ctx.createRadialGradient(solX, solY, 4, solX, solY, 44);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.7, '#facc15');
    grad.addColorStop(1, '#f97316');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(solX, solY, 42, 0, Math.PI * 2);
    ctx.fill();
    // ondas hacia el objeto
    const tamp = 30 + d;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    for (let r = 1; r <= 3; r++) {
      ctx.beginPath();
      for (let k = 0; k <= 24; k++) {
        const px = solX + ((objX - solX) * k) / 24;
        const py = solY + Math.sin(t * 6 + k * 0.7 + r) * (4 + r * 2);
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    // objeto receptor
    ctx.fillStyle = '#475569';
    ctx.fillRect(objX - 25, solY - 55, 50, 110);
    const temp = Math.min(95, 18 + 12000 / Math.max(d * d, 30));
    const grad2 = ctx.createLinearGradient(0, solY + 55, 0, solY - 55);
    grad2.addColorStop(0, '#3b82f6');
    grad2.addColorStop(1 / (temp / 100), '#f59e0b');
    grad2.addColorStop(1, '#ef4444');
    ctx.fillStyle = grad2;
    ctx.fillRect(objX - 20, solY - 50, 40, 100);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${temp.toFixed(0)} °C`, objX, solY - 62);
    ctx.fillText('receptor', objX, solY + 72);
    // etiqueta espacio vacío
    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 12px sans-serif';
    ctx.fillText('☀️ viaja por el vacío (sin aire)', w / 2, 20);
  }

  const responder = (m) => {
    if (pregunta?.ok) return;
    const ok = m === EJEMPLOS[pregunta?.idx]?.correcto;
    if (ok && !pregunta?.ok) setPuntos((p) => p + 10);
    setPregunta((prev) => ({ ...prev, ok, dado: m }));
  };

  const siguiente = () => {
    const idx = Math.floor(seed(pregunta?.idx ?? 0 + 1) * EJEMPLOS.length) === (pregunta?.idx ?? 0)
      ? (pregunta?.idx ?? 0 + 1) % EJEMPLOS.length
      : Math.floor(seed(pregunta?.idx ?? 0 + 1) * EJEMPLOS.length);
    setPregunta({ idx, ok: null, dado: null });
  };

  const preguntaActual = pregunta?.idx != null ? EJEMPLOS[pregunta.idx] : null;

  return (
    <div>
      <Indice puntos={puntos} meta="Identificar cómo viaja el calor: conducción, convección y radiación." />
      <ModoSelector modo={modo} setModo={setModo} desafio="Clasificá 10 situaciones reales." />

      <div className="alerta info">{OBJETIVOS[modo]}</div>

      <div className="termo-modos">
        {MECANISMOS.map((m) => (
          <button key={m.k} className={`termo-modo-btn ${modo === m.k ? 'activo' : ''}`} onClick={() => setModo(m.k)}>
            <strong>{m.label}</strong>
            <small>{m.desc}</small>
          </button>
        ))}
      </div>

      <div className="termo-lienzo">
        <canvas ref={canvasRef} />
      </div>

      <div className="termo-acciones">
        {modo === 'conduccion' && <Dato etiqueta="Temperatura de la fuente" valor={`${tFuente} °C`} />}
        {modo === 'conveccion' && <Dato etiqueta="Fuego" valor={flama ? 'ENCENDIDO 🔥' : 'apagado'} />}
        {modo === 'radiacion' && <Dato etiqueta="Distancia al receptor" valor={`${distancia} m`} />}
      </div>

      {modo === 'conduccion' && (
        <div className="sim-controles termo-controls">
          <label>Temperatura de la fuente: <strong>{tFuente} °C</strong><input type="range" min="20" max="100" value={tFuente} onChange={(e) => setTFuente(Number(e.target.value))} /></label>
        </div>
      )}
      {modo === 'conveccion' && (
        <div className="termo-acciones">
          <button className="btn btn-primary" onClick={() => setFlama(!flama)}>{flama ? 'Apagar el fuego' : 'Encender el fuego'}</button>
        </div>
      )}
      {modo === 'radiacion' && (
        <div className="sim-controles termo-controls">
          <label>Distancia del receptor al Sol: <strong>{distancia} m</strong><input type="range" min="10" max="100" value={distancia} onChange={(e) => setDistancia(Number(e.target.value))} /></label>
        </div>
      )}

      <div className="card termo-seccion">
        <h3>📚 Definiciones rápidas</h3>
        <ul className="termo-definiciones">
          <li><strong>🍴 Conducción:</strong> calor por <em>contacto directo</em>. Ocurre sobre todo en sólidos. Ej: cuchara en la sopa, planchar, barra metálica.</li>
          <li><strong>🌊 Convección:</strong> calor por <em>movimiento de líquidos o gases</em>. El fluido caliente sube (menos denso) y el frío baja. Ej: agua hirviendo, corrientes de aire, ventilador.</li>
          <li><strong>☀️ Radiación:</strong> calor por <em>ondas electromagnéticas</em>, no necesita medio. Ej: Sol, fogata, estufa infrarroja.</li>
          <li><strong>⚖️ Equilibrio térmico:</strong> dos cuerpos en contacto intercambian calor hasta igualar su temperatura.</li>
        </ul>
      </div>

      <div className="card termo-seccion">
        <h3>🏅 Desafío: ¿qué mecanismo es?</h3>
        {!preguntaActual ? (
          <button className="btn btn-primary" onClick={siguiente}>Comenzar desafío (+10 por acierto)</button>
        ) : (
          <>
            <p>{preguntaActual.texto}</p>
            <div className="termo-opciones">
              {MECANISMOS.map((m) => (
                <button key={m.k} className="btn" disabled={pregunta.ok != null} onClick={() => responder(m.k)}>{m.label.replace(/^\S*\s/, '')}</button>
              ))}
            </div>
            <Retro
              estado={pregunta.ok != null ? (pregunta.ok ? 'ok' : 'error') : null}
              explicacion={pregunta.ok ? '¡Correcto! Ese es el mecanismo de transferencia, tal como aparece en la teórica.' : 'Revisá las definiciones: pensá si hay contacto, movimiento de fluido o radiación a distancia.'}
              pista="Preguntate: ¿toca algo (conducción)? ¿se mueve aire/agua (convección)? ¿o llega a distancia (radiación)?"
              alIntentar={() => setPregunta((prev) => ({ ...prev, ok: null, dado: null }))}
            />
            {pregunta.ok && (
              <div className="termo-acciones" style={{ marginTop: 10 }}>
                <button className="btn btn-primary" onClick={siguiente}>Siguiente ejemplo →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}