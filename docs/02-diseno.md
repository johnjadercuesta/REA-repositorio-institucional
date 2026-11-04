# Diseño

## 1. Arquitectura en capas

```
┌────────────────────────────┐
│  Frontend (React SPA)      │  Vite + React
└────────────┬───────────────┘
             │  HTTP / JSON (REST)
┌────────────▼───────────────┐
│  Backend (Node + Express)  │  rutas → servicios → repositorio
└────────────┬───────────────┘
             │
┌────────────▼───────────────┬─────────────┐
│  Datos/BD (node:sqlite)    │  Uploads/   │
│  metadatos + currículos    │  archivos   │
└────────────────────────────┴─────────────┘
```

**Principios**: separación de responsabilidades, autenticación por middleware, validación en el borde, paginación.

## 2. Modelo de datos

### `usuarios`
| campo | tipo | notas |
|---|---|---|
| id | INTEGER PK | autoincremental |
| nombre | TEXT | |
| email | TEXT UNIQUE | login |
| password_hash | TEXT | bcrypt |
| rol | TEXT | `coordinacion` / `docente` |
| activo | INTEGER | 1/0 |

### `curriculo_anio` (periodo vigente)
| campo | tipo |
|---|---|
| id | INTEGER PK |
| anio | INTEGER |
| vigente | INTEGER |

### `curriculo`
| campo | tipo |
|---|---|
| id | INTEGER PK | |
| anio_id | FK | estructura por año |
| nivel | TEXT | EJ: Secundaria |
| grado | TEXT | EJ: 3° |
| asignatura | TEXT | EJ: Matemática |
| unidad | TEXT | EJ: Unidad 2 · Álgebra |
| contenido | TEXT | EJ: Ecuaciones de 1er grado |

### `recursos`
| campo | tipo |
|---|---|
| id | INTEGER PK |
| titulo | TEXT |
| descripcion | TEXT |
| autor | TEXT |
| usuario_id | FK | quien lo sube |
| tipo | TEXT | `documento`/`video`/`audio`/`imagen`/`enlace` |
| formato | TEXT | pdf/docx/mp4/… |
| licencia | TEXT | CC BY, CC BY-SA… |
| url_externa | TEXT | si es enlace |
| archivo | TEXT | ruta en uploads |
| contador_descargas | INTEGER | 0 |
| estado | TEXT | `publicado`/`borrador`/`archivado` |
| creado_en / actualizado_en | TEXT | ISO |

### `recurso_contenido` (N:M recurso ↔ contenido)
| campo | tipo |
|---|---|
| recurso_id | FK |
| contenido_id | FK |

### `valoraciones`
| campo | tipo |
|---|---|
| recurso_id | FK |
| usuario_id | FK |
| puntaje | INTEGER 1-5 |
| comentario | TEXT |
| creado_en | TEXT |

### `uso_descargas`
| campo | tipo |
|---|---|
| id | INTEGER PK |
| recurso_id | FK |
| usuario_id | FK |
| creado_en | TEXT |

### `cursos` (Fase 1)
| campo | tipo |
|---|---|
| id | INTEGER PK |
| nombre | TEXT |
| anio_id | FK (curriculo_anio) |
| nivel / grado / asignatura | TEXT |
| docente_id | FK |
| periodo | TEXT |
| estado | TEXT |

### `matricula` (Fase 1, N:M curso ↔ estudiante)
| campo | tipo |
|---|---|
| curso_id | FK |
| usuario_id | FK |

### `capitulos` (Fase 2, libro por capítulos)
| campo | tipo |
|---|---|
| id | INTEGER PK |
| recurso_id | FK (recurso tipo 'libro') |
| titulo | TEXT |
| orden | INTEGER |
| tipo | texto / pdf / imagen / h5 |
| archivo / archivo_nombre_original | archivo almacenado |
| url | enlace externo (h5) |
| html | contenido de tipo texto |

> Un libro puede mostrarse como **flipbook** (si el recurso tiene un PDF en su `archivo`) o como **lector por capítulos** (si tiene filas en `capitulos`).

### `simuladores` (Fase 3, catálogo curado de laboratorios virtuales)
| campo | tipo |
|---|---|
| id | INTEGER PK |
| nombre | TEXT |
| descripcion | TEXT |
| area | fisica / quimica / biologia / matematica / otro |
| url | TEXT (enlace embebible) |
| nivel | TEXT |
| activo | 0/1 |

> Los **recursos tipo `simulacion`/`h5`** reutilizan `recursos.url_externa` para embeder el iframe en el detalle; un recurso `h5` también puede guardar un paquete `.h5p` en `recursos.archivo`.

### `sesiones` (Fase 4, sesiones de aula)
| campo | tipo |
|---|---|
| id | INTEGER PK |
| curso_id | FK (el **aula**) |
| titulo | TEXT |
| descripcion | TEXT |
| fecha_inicio | TEXT |
| estado | programada / activa / finalizada |
| creado_por | FK usuario |

> La **pizarra colaborativa** vive dentro de una sesión activa (`/pizarra/:sesionId`). Los trazos y la presencia se mantienen en memoria por sesión y se sincronizan con **Socket.IO** (rooms `pizarra:{id}`); al unirse se recibe el estado actual de la pizarra.

### `asistencia` (Fase 5, por sesión)
| campo | tipo |
|---|---|
| id | INTEGER PK |
| sesion_id | FK (sesión del aula) |
| usuario_id | FK (estudiante matriculado) |
| estado | presente / ausente / justificado |
| registrado_por | FK usuario (docente/coord) |
| UNIQUE | (sesion_id, usuario_id) |

> La asistencia se toma **por sesión** sobre los estudiantes matriculados del curso. La puede editar el docente del aula o coordinación (`/asistencia/:sesionId`); los estudiantes la ven en modo solo lectura (con su propio estado resaltado). El resumen por alumno/curso alimenta los reportes (Fase 6).

## 3. API REST (resumen)

| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| POST | `/api/auth/login` | Login | público |
| GET | `/api/usuarios` | Listar usuarios | coordinacion |
| GET | `/api/curriculo` | Estructura curricular | autenticado |
| GET | `/api/contenidos` | Lista de contenidos por filtros | autenticado |
| GET | `/api/recursos` | Catálogo + búsqueda + filtros | autenticado |
| POST | `/api/recursos` | Crear recurso | autenticado |
| GET | `/api/recursos/:id` | Detalle + mÃ©dia valoración | autenticado |
| PUT | `/api/recursos/:id` | Editar | autenticado |
| DELETE | `/api/recursos/:id` | Baja lógica (archivado) | autenticado/coord |
| POST | `/api/recursos/:id/valorar` | Valorar + comentar | autenticado |
| GET | `/api/recursos/:id/descargar` | Descargar archivo + log | autenticado |
| GET | `/api/reportes/cobertura` | Cobertura curricular | coordinacion |
| GET | `/api/reportes/uso` | Uso por recurso | coordinacion |
| GET | `/api/cursos` | Listar cursos | autenticado |
| POST | `/api/cursos` | Crear curso | coordinacion |
| GET | `/api/cursos/miaula` | Cursos del usuario | autenticado |
| GET | `/api/cursos/:id/matriculados` | Alumnos del curso | autenticado |
| POST | `/api/cursos/:id/matricular` | Matricular estudiante | coordinacion |
| DELETE | `/api/cursos/:id/matricular/:usuarioId` | Desmatricular | coordinacion |
| POST | `/api/usuarios` | Crear cuenta (rol docente/estudiante) | coordinacion |
| GET | `/api/usuarios/estudiantes` | Listar estudiantes | coordinacion |
| GET | `/api/recursos/:id/capitulos` | Capítulos de un libro | autenticado |
| POST | `/api/recursos/:id/capitulos` | Agregar capítulo | autenticado (dueño/coord) |
| PUT | `/api/recursos/:id/capitulos/orden` | Reordenar capítulos | autenticado (dueño/coord) |
| PUT | `/api/recursos/:id/capitulos/:capId` | Editar capítulo | autenticado (dueño/coord) |
| DELETE | `/api/recursos/:id/capitulos/:capId` | Eliminar capítulo | autenticado (dueño/coord) |
| GET | `/api/recursos/:id/capitulos/:capId/archivo` | Archivo del capítulo | autenticado |
| GET | `/api/simuladores` | Catálogo de simuladores activos | autenticado |
| GET | `/api/simuladores?todos=1` | Incluye inactivos | coordinacion || POST | `/api/simuladores` | Crear simulador | coordinacion |
| PUT | `/api/simuladores/:id` | Editar / activar-desactivar | coordinacion |
| DELETE | `/api/simuladores/:id` | Eliminar | coordinacion |
| GET | `/api/sesiones/curso/:cursoId` | Sesiones de un aula | integrante del aula |
| POST | `/api/sesiones/curso/:cursoId` | Crear sesión | docente del aula / coord |
| GET | `/api/sesiones/:id` | Detalle de sesión | integrante del aula |
| PATCH | `/api/sesiones/:id` | Cambiar estado/editar | creador / coord |
| DELETE | `/api/sesiones/:id` | Eliminar | creador / coord |
| GET | `/api/sesiones/:id/asistencia` | Estudiantes + estado en la sesión | integrante del aula |
| PUT | `/api/sesiones/:id/asistencia` | Marcar lote de asistencia | docente de la sesión / coord |
| PUT | `/api/sesiones/:id/asistencia/todos` | Marcar a todos con un estado | docente de la sesión / coord |
| GET | `/api/reportes/cobertura` | Cobertura curricular | coordinacion |
| GET | `/api/reportes/uso` | Descargas y valoración | coordinacion |
| GET | `/api/reportes/asistencia` | Asistencia por alumno/curso | coordinacion |

> Cualquier `/api/reportes/*?csv` devuelve el CSV descargable.

### Tiempo real (Socket.IO, pizarra)
| Evento | Dirección | Descripción |
|---|---|---|
| `pizarra:join` | c→s (ack) | Unirse a la pizarra de una sesión |
| `pizarra:estado` | s→c | Estado actual (trazos + presentes) al unirse |
| `pizarra:trazar` | c→s / s→c (room) | Trazo nuevo |
| `pizarra:limpiar` | c→s / s→c (room) | Vaciar pizarra |
| `pizarra:presencia` | s→c (room) | Lista de participantes |

## 3. Experiencia de usuario (pantallas)

1. **Login**.
2. **Catálogo**: barra de búsqueda + filtros laterales + lista de tarjetas de recursos + paginación.
3. **Detalle**: metadatos, vista previa/enlace, descarga, valoración, comentarios.
4. **Alta/Edición**: formulario con campos de metadatos + estructura curricular.
5. **Reportes**: dos vistas (cobertura y uso) con exportar a CSV.
6. **Usuarios** (solo coordinación): listar y cambiar rol.

**Principios UX**: mínimo 2 clics para encontrar un recurso, feedback siempre en cada acción (mensajes de éxito/error), responsive (mobile-first).