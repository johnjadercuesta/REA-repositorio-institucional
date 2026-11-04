import { useState } from 'react';

export function Skeleton({ w = '100%', h = 14, r = 8, style }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card s-card">
      <Skeleton h={16} w="60%" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} h={11} w={`${100 - i * 15}%`} style={{ marginTop: 8 }} />
      ))}
      <Skeleton h={32} w="40%" style={{ marginTop: 14, borderRadius: 8 }} />
    </div>
  );
}

export function EmptyState({ icon = '🗂️', titulo = 'Sin contenido', texto, accion, onAccion }) {
  return (
    <div className="estado-vacio">
      <span className="estado-vacio-ico">{icon}</span>
      <h3>{titulo}</h3>
      {texto && <p>{texto}</p>}
      {accion && (
        <button className="btn btn-primary" onClick={onAccion}>
          {accion}
        </button>
      )}
    </div>
  );
}

export function Breadcrumbs({ items }) {
  return (
    <nav className="migas" aria-label="Ruta de navegación">
      {items.map((it, i) => {
        const ultimo = i === items.length - 1;
        return (
          <span key={i}>
            {it.to ? (
              <a href={it.to}>{it.label}</a>
            ) : (
              <span className={ultimo ? 'actual' : ''}>{it.label}</span>
            )}
            {!ultimo && <span className="miga-sep">/</span>}
          </span>
        );
      })}
    </nav>
  );
}

export function Accordion({ titulo, icono, children, abiertoInicial = false }) {
  const [abierto, setAbierto] = useState(abiertoInicial);
  return (
    <div className={`acordeon ${abierto ? 'abierto' : ''}`}>
      <button className="acordeon-cab" onClick={() => setAbierto((a) => !a)} aria-expanded={abierto}>
        <span>{icono} {titulo}</span>
        <span className="acordeon-flecha">{abierto ? '▴' : '▾'}</span>
      </button>
      {abierto && <div className="acordeon-cuerpo">{children}</div>}
    </div>
  );
}

export function Modal({ abierto, titulo, children, onCerrar, footer }) {
  if (!abierto) return null;
  return (
    <div className="modal-capa" onClick={onCerrar}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={titulo} onClick={(e) => e.stopPropagation()}>
        <div className="modal-cab">
          <h3>{titulo}</h3>
          <button className="btn btn-ghost" onClick={onCerrar} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className="modal-cuerpo">{children}</div>
        {footer && <div className="modal-pie">{footer}</div>}
      </div>
    </div>
  );
}