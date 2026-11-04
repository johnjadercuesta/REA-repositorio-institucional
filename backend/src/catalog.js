// Catálogo canónico de áreas académicas (espejo de frontend/src/catalog.js).
export const AREAS = [
  { slug: 'matematicas', nombre: 'Matemáticas', asignaturas: ['Matemática', 'Matemáticas', 'Álgebra', 'Geometría', 'Estadística', 'Probabilidad', 'Aritmética', 'Funciones'], desc: 'Números, álgebra, geometría, estadística y funciones.' },
  { slug: 'fisica', nombre: 'Física', asignaturas: ['Física', 'Ciencias Naturales'], desc: 'Materia, energía y las leyes que rigen el universo.' },
  { slug: 'quimica', nombre: 'Química', asignaturas: ['Química'], desc: 'Composición, estructura y transformaciones de la materia.' },
  { slug: 'biologia', nombre: 'Biología', asignaturas: ['Biología'], desc: 'La vida, los seres vivos y sus procesos.' },
  { slug: 'tecnologia', nombre: 'Tecnología e Informática', asignaturas: ['Tecnología', 'Informática', 'Programación', 'Robótica', 'Inteligencia Artificial', 'Computación'], desc: 'Informática, programación, robótica y ciudadanía digital.' },
  { slug: 'lenguaje', nombre: 'Lenguaje', asignaturas: ['Lengua', 'Lenguaje', 'Lengua Castellana', 'Literatura', 'Comunicación', 'Comprensión Lectora'], desc: 'Lengua castellana, comprensión lectora y producción textual.' },
  { slug: 'sociales', nombre: 'Ciencias Sociales', asignaturas: ['Ciencias Sociales', 'Historia', 'Geografía', 'Constitución', 'Economía', 'Ciencias Políticas'], desc: 'Historia, geografía, constitución, economía y ciudadanía.' },
  { slug: 'ingles', nombre: 'Inglés', asignaturas: ['Inglés', 'English'], desc: 'Vocabulary, grammar, reading, listening y writing.' },
  { slug: 'artistica', nombre: 'Educación Artística', asignaturas: ['Educación Artística', 'Artes', 'Música', 'Diseño'], desc: 'Artes visuales, música, diseño y creatividad.' },
  { slug: 'ambiental', nombre: 'Educación Ambiental', asignaturas: ['Educación Ambiental', 'Ambiente', 'Sostenibilidad', 'Ciencias de la Tierra'], desc: 'Medio ambiente, sostenibilidad y cambio climático.' },
  { slug: 'otro', nombre: 'Otras áreas', asignaturas: ['Otro', 'Otra', 'General'], desc: 'Otros contenidos y materiales generales.' },
];

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
  const lim = String(asignatura).toLowerCase().trim();
  return AREAS.find((a) => a.asignaturas.some((s) => s.toLowerCase().trim() === lim))?.slug || 'otro';
}

export function areaDeSimulador(area) {
  return AREA_SIM[(area || '').toLowerCase()] || 'otro';
}

export function areaPorSlug(slug) {
  return AREAS.find((a) => a.slug === slug) || AREAS[AREAS.length - 1];
}