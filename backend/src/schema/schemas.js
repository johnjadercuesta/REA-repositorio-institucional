import { z } from 'zod';

export const registrarSchema = z.object({
  nombre: z.string().min(3, 'Nombre muy corto'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

const TIPOS = ['documento', 'video', 'audio', 'imagen', 'enlace', 'libro', 'h5', 'simulacion'];
const LICENCIAS = ['CC BY', 'CC BY-SA', 'CC BY-NC', 'CC BY-NC-SA', 'CC BY-ND', 'Dominio público', 'Otra', 'Solo referencia'];
const ESTADOS = ['publicado', 'borrador', 'archivado'];

export const recursoSchema = z.object({
  titulo: z.string().min(1, 'El título es obligatorio'),
  descripcion: z.string().optional().nullable(),
  autor: z.string().optional().nullable(),
  tipo: z.enum(TIPOS).default('documento'),
  formato: z.string().optional().nullable(),
  licencia: z.enum(LICENCIAS).default('CC BY'),
  url_externa: z.string().url('Debe ser un enlace válido').optional().nullable().or(z.literal('')),
  contenido_ids: z
    .preprocess((v) => (Array.isArray(v) ? v : v === undefined || v === null || v === '' ? [] : [v]), z.array(z.coerce.number().int().positive()))
    .optional()
    .default([]),
  estado: z.enum(ESTADOS).optional().default('publicado'),
});

export const editarRecursoSchema = recursoSchema.partial();

export const buscarRecursoSchema = z.object({
  q: z.string().optional(),
  tipo: z.enum(TIPOS).optional(),
  grado: z.string().optional(),
  asignatura: z.string().optional(),
  asignaturas: z.string().optional(),
  unidad: z.string().optional(),
  licencia: z.string().optional(),
  estado: z.enum(ESTADOS).optional(),
  orden: z.enum(['recientes', 'titulo', 'valoracion', 'descargas']).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export const valoracionSchema = z.object({
  puntaje: z.number().int().min(1).max(5),
  comentario: z.string().optional().nullable(),
});

export const curriculoEntrySchema = z.object({
  nivel: z.string().optional(),
  grado: z.string().optional(),
  asignatura: z.string().optional(),
  unidad: z.string().optional(),
  contenido: z.string().min(1),
});

export const cursoSchema = z.object({
  nombre: z.string().min(1, 'El nombre del curso es obligatorio'),
  grado: z.string().min(1, 'El grado es obligatorio'),
  asignatura: z.string().min(1, 'La asignatura es obligatoria'),
  nivel: z.string().optional(),
  anioId: z.coerce.number().int().positive().optional(),
  docenteId: z.coerce.number().int().positive().optional().nullable(),
  periodo: z.string().optional(),
});

export const matriculaSchema = z.object({
  usuarioId: z.coerce.number().int().positive(),
});

export const crearUsuarioSchema = z.object({
  nombre: z.string().min(3, 'Nombre muy corto'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rol: z.enum(['coordinacion', 'docente', 'estudiante']).default('estudiante'),
});

const TIPOS_CAPITULO = ['texto', 'pdf', 'imagen', 'h5'];

export const capituloSchema = z.object({
  titulo: z.string().min(1, 'El título es obligatorio'),
  tipo: z.enum(TIPOS_CAPITULO).default('texto'),
  url: z.string().optional().nullable(),
  html: z.string().optional().nullable(),
});

export const reordenarCapitulosSchema = z.object({
  capitulos: z.array(z.number().int().positive()).min(1),
});

export const AREAS_SIMULACION = ['fisica', 'quimica', 'biologia', 'matematica', 'otro'];

export const APLICACIONES_SIMULADOR = ['tiro', 'pendulo', 'tabla', 'bohr', 'funcion', 'algebra', 'probabilidad', 'geogebra', 'estadistica', 'termodinamica', 'fuerzas', 'atomo', 'magnetismo'];

export const simuladorSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  descripcion: z.string().optional().nullable(),
  area: z.enum(AREAS_SIMULACION).default('otro'),
  url: z.string().url('Debe ser un enlace válido').optional().nullable(),
  nivel: z.string().optional().nullable(),
  aplicacion: z.enum(APLICACIONES_SIMULADOR).optional().nullable(),
  activo: z.coerce.number().int().min(0).max(1).optional().default(1),
});

export const ESTADOS_SESION = ['programada', 'activa', 'finalizada'];

export const sesionSchema = z.object({
  titulo: z.string().min(1, 'El título es obligatorio'),
  descripcion: z.string().optional().nullable(),
  fecha_inicio: z.string().optional().nullable(),
  estado: z.enum(ESTADOS_SESION).optional().default('programada'),
});

export const TIPOS_SALA = ['clase', 'reunion'];
export const ACCESOS_SALA = ['abierto', 'restringido'];
export const ESTADOS_SALA = ['programada', 'activa', 'finalizada'];
export const ROLES_SALA = ['anfitrion', 'comoderador', 'participante', 'observador'];

export const salaSchema = z.object({
  tipo: z.enum(TIPOS_SALA).default('reunion'),
  titulo: z.string().min(1, 'El título es obligatorio'),
  descripcion: z.string().optional().nullable(),
  acceso: z.enum(ACCESOS_SALA).default('abierto'),
  password: z
    .preprocess(
      (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
      z.string().min(1).max(50).nullable()
    )
    .optional(),
  cursoId: z.coerce.number().int().positive().optional().nullable(),
  sesionId: z.coerce.number().int().positive().optional().nullable(),
  fecha_inicio: z.string().optional().nullable(),
  estado: z.enum(ESTADOS_SALA).optional().default('programada'),
});

export const salaPasswordSchema = z.object({
  password: z.string().optional().nullable(),
});

export const ESTADOS_ASISTENCIA = ['presente', 'ausente', 'justificado'];

export const asistenciaLoteSchema = z.object({
  registros: z
    .array(
      z.object({
        usuarioId: z.coerce.number().int().positive(),
        estado: z.enum(ESTADOS_ASISTENCIA),
      })
    )
    .min(1, 'Debe registrar al menos un estudiante'),
});

export const progresoItemSchema = z.object({
  tipo: z.enum(['recurso', 'simulador']),
  id: z.coerce.number().int().positive(),
});

export const progresoAccionSchema = z.object({
  tipo: z.enum(['recurso', 'simulador']),
  id: z.coerce.number().int().positive(),
  activo: z.coerce.number().int().min(0).max(1).optional(),
});