import { useEffect, useRef, useState } from 'react';

/* ---------- animación y arrastre ---------- */

export function useAnimacion(fn, deps = []) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    let raf;
    let ultimo = performance.now();
    const tick = (ahora) => {
      const dt = Math.min(0.05, (ahora - ultimo) / 1000);
      ultimo = ahora;
      fnRef.current(dt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function punteroCanvas(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

export function usePantallaCompleta() {
  const [activo, setActivo] = useState(false);
  useEffect(() => {
    const on = () => setActivo(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);
  const toggle = (el) => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el?.requestFullscreen?.().catch(() => {});
    }
  };
  return [activo, toggle];
}

export function useCanvas(dibujar, deps) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const redibujar = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dibujar(ctx, w, h);
    };
    redibujar();
    window.addEventListener('resize', redibujar);
    return () => window.removeEventListener('resize', redibujar);
  }, deps);
  return ref;
}

export function useArrastrarX(ini, [min, max], onMove) {
  const [x, setX] = useState(ini);
  const ref = useRef(null);
  function enPointerDown(e) {
    e.preventDefault();
    const mover = (ev) => {
      const nx = Math.max(min, Math.min(max, ev.clientX));
      setX(nx);
      onMove?.(nx);
    };
    const up = () => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', up);
  }
  return [x, ref, enPointerDown, setX];
}

/* ---------- física ---------- */

export function fuerzaPunto(dx, dy, k, rMin, rMax) {
  const r = Math.hypot(dx, dy) || 1;
  if (r > rMax) return { fx: 0, fy: 0, mag: 0 };
  const r2 = Math.max(rMin * rMin, r * r);
  const m = k / r2;
  return { fx: (dx / r) * m, fy: (dy / r) * m, mag: m };
}

export function pasoMovil(o, fx, fy, dt, masa = 1, amort = 0.88, vMax = 420) {
  o.vx = (o.vx + (fx / masa) * dt) * amort;
  o.vy = (o.vy + (fy / masa) * dt) * amort;
  const v = Math.hypot(o.vx, o.vy);
  if (v > vMax) {
    o.vx = (o.vx / v) * vMax;
    o.vy = (o.vy / v) * vMax;
  }
  o.x += o.vx * dt;
  o.y += o.vy * dt;
}

export function campoDipolo(Bx, By, mx, my, ang) {
  const dx = Bx - mx;
  const dy = By - my;
  const r2 = dx * dx + dy * dy || 1;
  const r = Math.sqrt(r2);
  const mx0 = Math.cos(ang);
  const my0 = Math.sin(ang);
  const rhatx = dx / r;
  const rhaty = dy / r;
  const mDotR = mx0 * rhatx + my0 * rhaty;
  return {
    Bx: (3 * mDotR * rhatx - mx0) / r2,
    By: (3 * mDotR * rhaty - my0) / r2,
  };
}

// magnitud para lecturas (p. ej. μT simulados): decrece con 1/r³
export function campoEnPunto(Bx, By, mx, my, k = 900) {
  const dx = Bx - mx;
  const dy = By - my;
  const r2 = dx * dx + dy * dy || 1;
  const r = Math.sqrt(r2);
  const mag = Math.min(1, k / (r2 * r));
  return { Bx: (dx / r) * mag, By: (dy / r) * mag, mag, r };
}

/* ---------- dibujo de escena ---------- */

export function escenaFondo(ctx, w, h) {
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#eef2f7';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

export function dibujarFlecha(ctx, x1, y1, x2, y2, color, ancho) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const largo = Math.hypot(x2 - x1, y2 - y1);
  const punta = Math.min(14, largo / 3);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = ancho;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - Math.cos(ang) * punta, y2 - Math.sin(ang) * punta);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(ang - 0.5) * punta * 1.7, y2 - Math.sin(ang - 0.5) * punta * 1.7);
  ctx.lineTo(x2 - Math.cos(ang + 0.5) * punta * 1.7, y2 - Math.sin(ang + 0.5) * punta * 1.7);
  ctx.closePath();
  ctx.fill();
}

export function dibujarFlechaValor(ctx, x1, y1, x2, y2, color, texto) {
  dibujarFlecha(ctx, x1, y1, x2, y2, color, 4);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 - 12;
  ctx.fillStyle = color;
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(texto, mx, my);
}

export function dibujarMagnet(ctx, cx, cy, w, h, rad) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rad);
  ctx.lineCap = 'round';

  const mitad = w / 2;
  const punta = h * 0.55;

  ctx.fillStyle = '#e11d48';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-mitad + punta / 2, -h / 2, w - punta, h, h / 3);
  } else {
    ctx.rect(-mitad + punta / 2, -h / 2, w - punta, h);
  }
  ctx.fill();

  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(mitad - punta / 2, -h / 2);
  ctx.lineTo(mitad, 0);
  ctx.lineTo(mitad - punta / 2, h / 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.moveTo(-mitad + punta / 2, -h / 2);
  ctx.lineTo(-mitad, 0);
  ctx.lineTo(-mitad + punta / 2, h / 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('N', mitad - punta / 2 - 5, 5);
  ctx.fillText('S', -mitad + punta / 2 + 5, 5);

  ctx.restore();
}

// imán grande con polos visibles (para escenas interactivas)
export function dibujarIman(ctx, cx, cy, w, h, rad = 0, resaltar = null) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rad);
  const m = w / 2;
  const r = h / 2;

  ctx.lineWidth = 2;
  ctx.strokeStyle = '#475569';
  const grad = ctx.createLinearGradient(-m, 0, m, 0);
  grad.addColorStop(0, '#2563eb');
  grad.addColorStop(0.5, '#7c3aed');
  grad.addColorStop(1, '#dc2626');
  ctx.fillStyle = grad;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-m, -r, w, h, r);
  } else {
    ctx.rect(-m, -r, w, h);
  }
  ctx.fill();
  ctx.stroke();

  // divisor central
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(0, r);
  ctx.stroke();

  // resaltar polo enfrentado
  if (resaltar) {
    const ex = resaltar === 'N' ? m - 10 : -m + 10;
    ctx.strokeStyle = 'rgba(255,255,0,0.95)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(ex, 0, r + 7, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.max(16, h * 0.5)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 3;
  ctx.fillText('N', m - r * 0.55, r * 0.4);
  ctx.fillText('S', -m + r * 0.55, r * 0.4);
  ctx.shadowBlur = 0;

  ctx.restore();
}

export function dibujarBrujula(ctx, x, y, ang, escala) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  const r = 16 * escala;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, r + 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.5, 0);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(0, r);
  ctx.lineTo(r * 0.5, 0);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.font = `bold ${Math.max(8, 11 * escala)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('N', 0, -r - 5);
  ctx.restore();
}

export function dibujarLineasCampo(ctx, cx, cy, rad, maxR, rIni, n, fuerza, fase = 0) {
  ctx.lineWidth = 1.5;
  for (let k = 0; k < n; k++) {
    const a0 = -0.9 + (k / (n - 1)) * 1.8;
    const x0 = cx + Math.cos(rad + a0) * rIni;
    const y0 = cy + Math.sin(rad + a0) * rIni;
    let x = x0;
    let y = y0;
    ctx.strokeStyle = `rgba(59,130,246,${0.25 + fuerza * 0.6})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    let pasos = 0;
    const s = 8;
    const pts = [];
    while (pasos < 70 && Math.hypot(x - cx, y - cy) < maxR) {
      const f = campoDipolo(x, y, cx, cy, rad);
      const m = Math.hypot(f.Bx, f.By) || 1;
      x += (f.Bx / m) * s;
      y += (f.By / m) * s;
      pts.push([x, y]);
      ctx.lineTo(x, y);
      pasos++;
    }
    ctx.stroke();

    // flechas que fluyen por la línea (N → S)
    if (fase !== null) {
      const des = (fase + k * 0.37) % 1;
      const idx = Math.floor(des * (pts.length - 1));
      if (pts[idx]) {
        const [ax, ay] = pts[idx];
        ctx.fillStyle = 'rgba(29,78,216,0.85)';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('▸', ax, ay + 4);
      }
    }
  }
}

// limaduras animadas: `puntos` = [{x, y, umbral, desvio}]
export function dibujarLimaduras(ctx, puntos, fnCampo, alineacion) {
  ctx.lineWidth = 2;
  for (let i = 0; i < puntos.length; i++) {
    const p = puntos[i];
    const f = fnCampo(p.x, p.y);
    const mag = Math.hypot(f.Bx, f.By);
    let ang = Math.atan2(f.By, f.Bx);
    let L = 4;
    if (p.umbral > alineacion) {
      ang += p.desvio;
      L = 5;
    } else {
      L = 5 + Math.min(11, mag * 500) * alineacion;
    }
    ctx.strokeStyle = `rgba(59,130,246,${0.22 + alineacion * 0.7})`;
    ctx.beginPath();
    ctx.moveTo(p.x - Math.cos(ang) * L, p.y - Math.sin(ang) * L);
    ctx.lineTo(p.x + Math.cos(ang) * L, p.y + Math.sin(ang) * L);
    ctx.stroke();
  }
}

export function dibujarDinamometro(ctx, x, y, fuerza, maxF) {
  const t = Math.max(0, Math.min(1, fuerza / maxF));
  const w = 80;
  const h = 50;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y - h / 2, w, h, 6);
  } else {
    ctx.rect(x, y - h / 2, w, h);
  }
  ctx.fill();
  ctx.stroke();

  // resorte
  const cx0 = x + 14;
  const ext = t * 26;
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 6; i++) {
    const sx = cx0 + (i / 6) * ext;
    const sy = y + (i % 2 ? 12 : -12);
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.stroke();
  ctx.fillStyle = '#475569';
  ctx.fillRect(cx0 + ext, y - 9, 4, 18);

  // aguja (deflexión proporcional)
  const ax = x + w - 10;
  const ang = -Math.PI / 2 + t * Math.PI;
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(ax, y);
  ctx.lineTo(ax - Math.cos(ang) * 13, y - Math.sin(ang) * 13);
  ctx.stroke();
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${fuerza.toFixed(1)} N`, x + w / 2, y + h / 2 + 5);
}

export function medidorCampo(ctx, x, y, ancho, alto, valor, maximo, unidad = 'μT') {
  const v = Math.max(0, Math.min(1, valor / maximo));
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(x, y, ancho, alto);
  ctx.fillStyle = v > 0.66 ? '#22c55e' : v > 0.33 ? '#f59e0b' : '#dc2626';
  ctx.fillRect(x, y, ancho * v, alto);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, ancho, alto);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(valor)} ${unidad}`, x + ancho / 2, y - 8);
}

/* ---------- componentes ---------- */

export function EscalaIntensidad({ valor }) {
  const n = 10;
  const llenas = Math.round(Math.max(0, Math.min(1, valor)) * n);
  return (
    <span className="escala-intensidad" title="Intensidad">
      {Array.from({ length: n }, (_, i) => (
        <i key={i} className={i < llenas ? 'llena' : ''} />
      ))}
      <b>{Math.round(valor * 100)}%</b>
    </span>
  );
}
