import { useEffect, useRef, useState } from 'react';
import { Modal } from './ui/index.jsx';

const COLORES = ['#0f172a', '#2563eb', '#dc2626', '#16a34a', '#f59e0b', '#9333ea', '#ffffff'];
const TAMANOS = [2, 4, 8, 14];
const SIMBOLOS = ['x', 'y', '²', '³', '⁻¹', '√', '·', '÷', '/', '(', ')', '=', '+', '−', '%'];

const SUP = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵',
  '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  a: 'ᵃ', b: 'ᵇ', c: 'ᶜ', d: 'ᵈ', e: 'ᵉ', i: 'ⁱ', n: 'ⁿ', o: 'ᵒ', r: 'ʳ', t: 'ᵗ', x: 'ˣ', y: 'ʸ',
};
// Convierte "^exp" en superíndices unicode (p. ej. x^2 -> x², x^-1 -> x⁻¹).
function superindices(texto) {
  return texto.replace(/\^([^\^]+)/g, (m, g) => [...g].map((c) => SUP[c] || c).join(''));
}

export default function PizarraCompartida({ socket, prefijo, joinPayload, puedeControlar, autor }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const trazosRef = useRef([]);
  const textosRef = useRef([]);
  const dibujandoRef = useRef(false);
  const trazoActualRef = useRef(null);

  const [conectado, setConectado] = useState(false);
  const [permiso, setPermiso] = useState(true); // true = todos dibujan
  const [color, setColor] = useState('#0f172a');
  const [tamano, setTamano] = useState(4);
  const [herramienta, setHerramienta] = useState('brush');
  const [abiertaEcuacion, setAbiertaEcuacion] = useState(false);
  const [textoEcuacion, setTextoEcuacion] = useState('');
  const [error, setError] = useState('');

  const puedoDibujar = conectado && (permiso || puedeControlar);

  function dibujarTrazo(t) {
    const ctx = ctxRef.current;
    if (!ctx || !t.puntos || !t.puntos.length) return;
    ctx.strokeStyle = t.tool === 'eraser' ? '#ffffff' : t.color || '#0f172a';
    ctx.lineWidth = t.size || 4;
    ctx.beginPath();
    const [x0, y0] = t.puntos[0];
    ctx.moveTo(x0, y0);
    for (let i = 1; i < t.puntos.length; i++) {
      const [x, y] = t.puntos[i];
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function dibujarTexto(objeto) {
    const ctx = ctxRef.current;
    if (!ctx || !objeto) return;
    const pos = objeto.pos || { x: 40, y: 44 };
    // Encabezado "✍ Nombre" pequeño sobre la ecuación.
    if (objeto.autor) {
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(`✍ ${objeto.autor}`, Math.max(0, pos.x - 4), pos.y + 6);
    }
    ctx.font = 'bold 26px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(superindices(objeto.texto), pos.x, pos.y + 34);
  }

  function repintar() {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const t of trazosRef.current) dibujarTrazo(t);
    for (const o of textosRef.current) dibujarTexto(o);
  }

  function prepararCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctxRef.current = ctx;
    repintar();
  }

  useEffect(() => {
    if (!socket) return;
    const prefijado = (ev) => `${prefijo}:${ev}`;
    socket.emit(prefijado('join'), joinPayload);
    const onEstado = ({ trazos, textos, permiso: p }) => {
      trazosRef.current = trazos || [];
      textosRef.current = textos || [];
      if (typeof p === 'boolean') setPermiso(p);
      setConectado(true);
      prepararCanvas();
    };
    const onTrazar = ({ trazo }) => {
      trazosRef.current.push(trazo);
      dibujarTrazo(trazo);
    };
    const onEcuacion = ({ objeto }) => {
      textosRef.current.push(objeto);
      repintar();
    };
    const onLimpiar = () => {
      trazosRef.current = [];
      textosRef.current = [];
      repintar();
    };
    const onPermiso = ({ permiso: p }) => setPermiso(Boolean(p));
    socket.on(prefijado('estado'), onEstado);
    socket.on(prefijado('trazar'), onTrazar);
    socket.on(prefijado('ecuacion'), onEcuacion);
    socket.on(prefijado('limpiar'), onLimpiar);
    socket.on(prefijado('permiso'), onPermiso);
    return () => {
      socket.off(prefijado('estado'), onEstado);
      socket.off(prefijado('trazar'), onTrazar);
      socket.off(prefijado('ecuacion'), onEcuacion);
      socket.off(prefijado('limpiar'), onLimpiar);
      socket.off(prefijado('permiso'), onPermiso);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, prefijo, JSON.stringify(joinPayload)]);

  useEffect(() => {
    prepararCanvas();
    window.addEventListener('resize', prepararCanvas);
    return () => window.removeEventListener('resize', prepararCanvas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const posicionDeEvento = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  };

  function onPointerDown(e) {
    if (!puedoDibujar) return;
    e.preventDefault();
    canvasRef.current.setPointerCapture?.(e.pointerId);
    dibujandoRef.current = true;
    trazoActualRef.current = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tool: herramienta,
      color,
      size: tamano,
      puntos: [posicionDeEvento(e)],
    };
  }

  function onPointerMove(e) {
    if (!dibujandoRef.current) return;
    trazoActualRef.current.puntos.push(posicionDeEvento(e));
    dibujarTrazo({ ...trazoActualRef.current });
  }

  function onPointerUp() {
    if (!dibujandoRef.current) return;
    dibujandoRef.current = false;
    const trazo = trazoActualRef.current;
    trazoActualRef.current = null;
    if (!trazo || !trazo.puntos.length) return;
    trazosRef.current.push({ ...trazo });
    socket?.emit(prefijar('trazar'), { trazo });
  }

  function prefijar(ev) {
    return `${prefijo}:${ev}`;
  }

  function limpiar() {
    if (!confirm('¿Limpiar toda la pizarra (dibujos y ecuaciones)?')) return;
    trazosRef.current = [];
    textosRef.current = [];
    socket?.emit(prefijar('limpiar'));
    repintar();
  }

  function agregarEcuacion(e) {
    e.preventDefault();
    const texto = superindices(textoEcuacion.trim()).slice(0, 200);
    if (!texto) return;
    const objeto = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      texto,
      autor: autor || 'Participante',
      pos: { x: 40, y: 44 + textosRef.current.length * 60 },
    };
    // Calcular el mismo id/pos del lado del docente y del alumno es suficiente porque
    // el servidor replica el objeto tal cual llega a los demás participantes.
    textosRef.current.push(objeto);
    repintar();
    socket?.emit(prefijar('ecuacion'), { texto: objeto.texto, pos: objeto.pos });
    setTextoEcuacion('');
    setAbiertaEcuacion(false);
  }

  function alternarPermiso() {
    const p = !permiso;
    setPermiso(p);
    socket?.emit(prefijar('permiso'), { permiso: p });
  }

  return (
    <div>
      <div className="pizarra-toolbar">
        <div className="grupo">
          <button
            className={`btn ${herramienta === 'brush' ? 'btn-primary' : ''}`}
            onClick={() => setHerramienta('brush')}
            disabled={!puedoDibujar}
          >
            Lápiz
          </button>
          <button
            className={`btn ${herramienta === 'eraser' ? 'btn-primary' : ''}`}
            onClick={() => setHerramienta('eraser')}
            disabled={!puedoDibujar}
          >
            Borrador
          </button>
          <button className="btn" onClick={() => setAbiertaEcuacion(true)} title="Insertar una ecuación para resolverla en grupo">
            Σ Ecuación
          </button>
        </div>
        <div className="grupo colores">
          {COLORES.map((c) => (
            <button
              key={c}
              className={`color-swatch${color === c && herramienta === 'brush' ? ' on' : ''}`}
              style={{ background: c }}
              onClick={() => {
                setColor(c);
                setHerramienta(c === '#ffffff' ? 'eraser' : 'brush');
              }}
              title={c === '#ffffff' ? 'Blanco (borrador)' : c}
              disabled={!puedoDibujar}
            />
          ))}
        </div>
        <div className="grupo">
          {TAMANOS.map((t) => (
            <button
              key={t}
              className={`btn btn-mini${tamano === t ? ' btn-primary' : ''}`}
              onClick={() => setTamano(t)}
              disabled={!puedoDibujar}
            >
              {t}
            </button>
          ))}
        </div>
        {puedeControlar && (
          <button
            className={`btn ${permiso ? '' : 'btn-primary'}`}
            onClick={alternarPermiso}
            title={permiso ? 'Ahora todos pueden dibujar' : 'Solo el docente dibuja'}
          >
            {permiso ? '✏️ Todos dibujan' : '🔒 Solo docente'}
          </button>
        )}
        {puedeControlar && (
          <button className="btn btn-danger" onClick={limpiar} title="Limpiar pizarra (dibujos y ecuaciones)">
            Limpiar
          </button>
        )}
      </div>

      {!puedoDibujar && conectado && (
        <div className="alerta info" style={{ marginBottom: 10 }}>
          🔒 Pizarra en solo lectura. Esperá a que el docente habilite el dibujo.
        </div>
      )}

      <div className="pizarra-lienzo">
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          style={{ cursor: puedoDibujar ? 'crosshair' : 'default' }}
        />
      </div>

      <Modal
        abierto={abiertaEcuacion}
        titulo="Crear ecuación"
        onCerrar={() => setAbiertaEcuacion(false)}
        footer={
          <button className="btn btn-primary" form="form-ecuacion" type="submit">
            Agregar a la pizarra
          </button>
        }
      >
        <form id="form-ecuacion" onSubmit={agregarEcuacion}>
          <label>Ecuación para resolver entre todos</label>
          <input
            value={textoEcuacion}
            onChange={(e) => setTextoEcuacion(e.target.value)}
            placeholder="Ej.: 3x + 5 = 20"
            autoFocus
            className="ecuacion-entrada"
          />
          <div className="ecuacion-simbolos">
            {SIMBOLOS.map((s) => (
              <button
                key={s}
                type="button"
                className="btn btn-mini"
                onClick={() => setTextoEcuacion((t) => t + s)}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="muted" style={{ marginBottom: 0 }}>
            Usá ` `<code>^</code> para potencias reales (3x^2 → 3x²) y resuelvan en la pizarra compartida.
          </p>
        </form>
      </Modal>
    </div>
  );
}