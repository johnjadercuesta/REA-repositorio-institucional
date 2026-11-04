export const AREAS = [
  { slug: 'matematicas', nombre: 'Matemáticas', asignaturas: ['Matemática', 'Matemáticas', 'Álgebra', 'Geometría', 'Estadística', 'Probabilidad', 'Aritmética', 'Funciones'], ic: '🔢', color: 'var(--area-matematicas)', desc: 'Números, álgebra, geometría, estadística y funciones.' },
  { slug: 'fisica', nombre: 'Física', asignaturas: ['Física', 'Ciencias Naturales'], ic: '🪐', color: 'var(--area-fisica)', desc: 'Materia, energía y las leyes que rigen el universo.' },
  { slug: 'quimica', nombre: 'Química', asignaturas: ['Química'], ic: '⚗️', color: 'var(--area-quimica)', desc: 'Composición, estructura y transformaciones de la materia.' },
  { slug: 'biologia', nombre: 'Biología', asignaturas: ['Biología'], ic: '🧬', color: 'var(--area-biologia)', desc: 'La vida, los seres vivos y sus procesos.' },
  { slug: 'tecnologia', nombre: 'Tecnología e Informática', asignaturas: ['Tecnología', 'Informática', 'Programación', 'Robótica', 'Inteligencia Artificial', 'Computación'], ic: '💻', color: 'var(--area-tecnologia)', desc: 'Informática, programación, robótica y ciudadanía digital.' },
  { slug: 'lenguaje', nombre: 'Lenguaje', asignaturas: ['Lengua', 'Lenguaje', 'Lengua Castellana', 'Literatura', 'Comunicación', 'Comprensión Lectora'], ic: '📖', color: 'var(--area-lenguaje)', desc: 'Lengua castellana, comprensión lectora y producción textual.' },
  { slug: 'sociales', nombre: 'Ciencias Sociales', asignaturas: ['Ciencias Sociales', 'Historia', 'Geografía', 'Constitución', 'Economía', 'Ciencias Políticas'], ic: '🌎', color: 'var(--area-sociales)', desc: 'Historia, geografía, constitución, economía y ciudadanía.' },
  { slug: 'ingles', nombre: 'Inglés', asignaturas: ['Inglés', 'English'], ic: '🇬🇧', color: 'var(--area-ingles)', desc: 'Vocabulary, grammar, reading, listening y writing.' },
  { slug: 'artistica', nombre: 'Educación Artística', asignaturas: ['Educación Artística', 'Artes', 'Música', 'Diseño'], ic: '🎨', color: 'var(--area-artistica)', desc: 'Artes visuales, música, diseño y creatividad.' },
  { slug: 'ambiental', nombre: 'Educación Ambiental', asignaturas: ['Educación Ambiental', 'Ambiente', 'Sostenibilidad', 'Ciencias de la Tierra'], ic: '🌱', color: 'var(--area-ambiental)', desc: 'Medio ambiente, sostenibilidad y cambio climático.' },
  { slug: 'otro', nombre: 'Otras áreas', asignaturas: ['Otro', 'Otra', 'General'], ic: '📚', color: 'var(--area-otro)', desc: 'Otros contenidos y materiales generales.' },
];

// Áreas del simulador (columna simuladores.area) → slug canónico.
const AREA_SIM = {
  fisica: 'fisica',
  quimica: 'quimica',
  biologia: 'biologia',
  matematica: 'matematicas',
  tecnologia: 'tecnologia',
  informatica: 'tecnologia',
  lenguaje: 'lenguaje',
  sociales: 'sociales',
  ingles: 'ingles',
  artistica: 'artistica',
  ambiental: 'ambiental',
  otro: 'otro',
};

export function areaDeAsignatura(asignatura) {
  if (!asignatura) return 'otro';
  const lim = asignatura.toLowerCase().trim();
  return AREAS.find((a) => a.asignaturas.some((s) => s.toLowerCase().trim() === lim))?.slug || 'otro';
}

export function areaDeSimulador(area) {
  return AREA_SIM[(area || '').toLowerCase()] || 'otro';
}

export function areaPorSlug(slug) {
  return AREAS.find((a) => a.slug === slug) || AREAS[AREAS.length - 1];
}

export function contarAreas({ recursoPorAsignatura = [], simPorArea = [] } = {}) {
  const mapa = {};
  for (const a of AREAS) mapa[a.slug] = 0;
  for (const x of recursoPorAsignatura) mapa[areaDeAsignatura(x.asignatura)] += Number(x.total || 0);
  for (const x of simPorArea) mapa[areaDeSimulador(x.area)] += Number(x.total || 0);
  return AREAS.map((a) => ({ ...a, recursos: mapa[a.slug] }));
}