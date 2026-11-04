# Requisitos del sistema

## 1. Requisitos funcionales

### 1.1 Usuarios y roles
- **RF-01** Registrar usuario con apellido, nombre, email y contraseña.
- **RF-02** Iniciar sesión y obtener un token.
- **RF-03** Definir roles: `coordinacion` (admin) y `docente`.
- **RF-04** El coordinador puede listar y cambiar el rol de los usuarios.
- **RF-05** Solo un usuario autenticado puede operar sobre los recursos.

### 1.2 Catálogo de recursos
- **RF-10** Crear un recurso con metadatos: título, descripción, autor, tipo, formato, licencia, vigencia, grado, asignatura, unidad y contenido curricular.
- **RF-11** Un recurso es o un **archivo** (PDF, Word, video, audio, imagen) o un **enlace externo** (YouTube, simuladores, sitios).
- **RF-12** Editar metadatos de un recurso existente.
- **RF-13** Cambiar el estado de un recurso: `publicado`, `borrador`, `archivado`.
- **RF-14** Eliminación **lógica** (no se borra físicamente).

### 1.3 Búsqueda y filtros
- **RF-15** Búsqueda de texto libre sobre título, descripción, autor y etiquetas.
- **RF-16** Filtros combinables: grado, asignatura, unidad, tipo de recurso, licencia, estado.
- **RF-17** Ordenar por más reciente, título, valoración o descargas.

### 1.4 Metadatos curriculares
- **RF-18** La estructura curricular es **versionable**: `periodo` (año), nivel, grado, asignatura, unidad, contenido.
- **RF-19** Un recurso se vincula a uno o más contenidos curriculares.

### 1.5 Interacción
- **RF-20** Descargar un recurso registra un evento de uso.
- **RF-21** Valorar un recurso (1-5 estrellas) y dejarlo promediado.
- **RF-22** Comentar un recurso.

### 1.6 Reportes y seguimiento
- **RF-23** Reporte de cobertura: contenidos con/sin recursos por grado/asignatura/unidad.
- **RF-24** Reporte de uso: descargas y valoración por recurso.
- **RF-25** Exportar reportes a CSV.

## 2. Requisitos no funcionales

- **RNF-01** **Seguridad**: contraseñas con hash (bcrypt), tokens JWT, validación de entradas (Zod), limitación de tamaño/tipo de subida.
- **RNF-02** **Usabilidad**: interfaz web responsive, accesible desde móvil, tablets y PC.
- **RNF-03** **Mantenibilidad**: separación en capas (routes, servicios, repositorios), código organizado por módulos.
- **RNF-04** **Escalabilidad**: en Fase 2 la BD SQLite podrá migrarse a PostgreSQL sin reescribir la lógica (abstracción por repositorio).
- **RNF-05** **Backup**: base de datos y carpeta `uploads/` accesibles para copia automática.
- **RNF-06** **Rendimiento**: búsqueda indexada; paginación de catálogo y reportes.

## 3. Reglas de negocio (RDBN)

- **RDBN-1** Todo recurso debe tener licencia explícita para ser considerado "abierto".
- **RDBN-2** El contenido curricular debe referirse a una estructura vigente del área (año).
- **RDBN-3** Solo la coordinación puede eliminar usuarios o archivar recursos de otros.
- **RDBN-4** Un recurso archivado no aparece en la búsqueda pública por defecto.