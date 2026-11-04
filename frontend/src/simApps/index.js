import { lazy } from 'react';

const registradas = {
  tiro: lazy(() => import('./SimTiro.jsx')),
  pendulo: lazy(() => import('./SimPendulo.jsx')),
  tabla: lazy(() => import('./SimTabla.jsx')),
  bohr: lazy(() => import('./SimBohr.jsx')),
  funcion: lazy(() => import('./SimFuncion.jsx')),
  algebra: lazy(() => import('./SimBaldor.jsx')),
  probabilidad: lazy(() => import('./SimProbabilidad.jsx')),
  geogebra: lazy(() => import('./SimGeoGebra.jsx')),
  estadistica: lazy(() => import('./SimEstadistica.jsx')),
  termodinamica: lazy(() => import('./Termodinamica.jsx')),
  fuerzas: lazy(() => import('./SimFuerzas.jsx')),
  atomo: lazy(() => import('./SimAtomo.jsx')),
  magnetismo: lazy(() => import('./magnetismo/Magnetismo.jsx')),
};

export const SIMAPPS = {
  tiro: { etiqueta: 'Tiro parabólico' },
  pendulo: { etiqueta: 'Péndulo simple' },
  tabla: { etiqueta: 'Tabla periódica interactiva' },
  bohr: { etiqueta: 'Átomos y modelo de Bohr' },
  funcion: { etiqueta: 'Gráfica de funciones' },
  algebra: { etiqueta: 'Álgebra de Baldor' },
  probabilidad: { etiqueta: 'Probabilidad' },
  geogebra: { etiqueta: 'Graficador (GeoGebra)' },
  estadistica: { etiqueta: 'Estadística' },
  termodinamica: { etiqueta: 'Termodinámica interactiva' },
  fuerzas: { etiqueta: 'Equilibrio de fuerzas' },
  atomo: { etiqueta: 'Construye un átomo' },
  magnetismo: { etiqueta: 'Laboratorio de magnetismo' },
};

export function getSimApp(slug) {
  return registradas[slug] || null;
}

export function esAplicacionPropia(slug) {
  return Boolean(registradas[slug]);
}