# Plan de fases y roadmap

## Fase 1 — MVP y cimientos (implementada)
- Catálogo de recursos + metadatos.
- Búsqueda y filtros.
- Vínculo curricular (estructura versionable).
- Autenticación con roles.
- Valoraciones y comentarios.
- Reportes de cobertura y uso + exportar CSV.
- **Rol `estudiante`**: cuenta propia y login.
- **Cursos y matrícula**: alta de cursos, alta de estudiantes y matrícula por curso (solo coordinación).
- **Tipos de recurso ampliados**: `libro`, `h5` y `simulacion` (base para Fases 2 y 3).

## Fase 2 — Libros y flipbooks (implementada)
- Visor de libros estilo flipbook **```PDF → páginas animadas```** con `pdf.js` + StPageFlip.
- **Dos modos de creación de libros**:
  1. **Subir PDF** y visualizarlo como libro animado (rápido).
  2. **Crear libro por capítulos** dentro de la web (capítulos de tipo texto/PDF/imagen/H5), con edición, reorden y borrado.
- Rutas: `/recursos/:id/leer` (lector) y `/recursos/:id/editar-libro` (editor).
- API de capítulos en `/api/recursos/:id/capitulos` (+ orden y archivo).

## Fase 3 — Contenido interactivo y laboratorio virtual (implementada)
- **Simuladores / laboratorios virtuales**: catálogo curado (tabla `simuladores`) gestionado por coordinación (área: física, química, biología, matemática). Recursos tipo `simulacion` enlazan una URL y se **embeben** en el detalle con iframe.
- **Contenido interactivo H5P**: recursos tipo `h5` por **URL** (se muestra embebido) o **paquete `.h5p`** subido como archivo (para publicación en plataforma H5P).
- Página `Simuladores` para todos los roles, con filtro por área; CRUD solo coordinación.
- Categorías de recursos ampliadas en catálogo y formulario.

## Fase 4 — Aulas, sesiones y pizarra colaborativa en vivo (implementada)
- **Aulas** = cursos (se crean primero). Sección «Aulas» para todos los roles: coordinación ve todas, docentes las que dan, estudiantes las matriculadas.
- **Sesiones** dentro del aula (`sesiones` con estado programada/activa/finalizada). Solo el docente del aula o coordinación las crea; estudiantes pueden entrar.
- **Pizarra colaborativa en vivo** (`/pizarra/:sesionId`, solo sesiones activas): lienzo con lápiz, borrador, colores y grosores; sincronización por **Socket.IO** (rooms por sesión) con presencia de participantes y limpieza compartida.
- Backend servido con HTTP + WebSocket (`node:http` + `socket.io`); Vite proxea `/socket.io` con `ws: true`.

## Fase 5 — Toma de asistencia en las sesiones (implementada)
- Tabla `asistencia` (sesión, estudiante, estado presente/ausente/justificado). Unicidad por sesión+estudiante.
- Página `/asistencia/:sesionId`: el docente del aula o coordinación marca presente/ausente/justificado por estudiante (acciones rápidas: todos presentes/ausentes) y guarda en lote; los **estudiantes ven solo lectura** con su propio como resaltado.
- El resumen por alumno/curso queda listo para los reportes de la Fase 6.

## Fase 6 — Reportes (implementada)
- **Cobertura curricular**: % del currículo con al menos un recurso + desglose por grado/asignatura/unidad.
- **Uso**: descargas (total y por período), valoración promedio por recurso.
- **Asistencia**: por alumno y curso — sesiones, presentes, ausentes, justificados, % de asistencia; resumen global y filtro por curso.
- Exportación **CSV** en los tres reportes (`?csv`).

## Fase 7 — Despliegue web (implementada)
- **Un solo puerto en producción**: el backend (Express + Socket.IO) sirve la SPA construida desde `frontend/dist`, la API y el WebSocket en `http://localhost:4000`.
- `servirSPA()` en `src/app.js`: estáticos + *history fallback* para rutas de cliente, sin interceptar `/api/*` ni `/socket.io`.
- Manual de despliegue actualizado (`docs/05-manual-despliegue.md`): dev, producción, variable de entorno (`JWT_SECRET`, `SPA_DIST`, `CORS_ORIGIN`), PM2/systemd y Nginx+HTTPS.
- Verificado en producción: SPA 200 (incl. rutas anidadas), assets del build, API JSON, websocket de la pizarra en vivo sobre el puerto único.

## Roadmap futuro (fuera del MVP)
- **Alta disponibilidad de la pizarra**: persistir trazos en BD y tipo compartido para varios nodos (adapter Redis de Socket.IO).
- **Contenido H5P completo**: reproducir paquetes `.h5p` en la web con `h5p-nodejs-library` (requiere definir hosting).
- **Chat en vivo** dentro de las sesiones.
- **Migración a PostgreSQL/MinIO** cuando la escala lo justifique (la capa de repositorios está aislada).

---

# Evolución: repositorio de experiencias de aprendizaje (F0–F4)

Nueva visión del producto apoyada sobre el MVP: además de catálogo y aulas, el sistema acompaña el **aprendizaje del estudiante** con un dashboard, seguimiento de progreso y rutas de aprendizaje.

## F0 — Sistema de diseño, navegación y buscador (implementada)
- Tokens nuevos en `styles.css` (turquesa, ámbar, violeta, colores por área `--area-*`).
- Nav nueva (`Inicio | Áreas | Recursos | Simuladores | Aulas`) + hamburguesa móvil + buscador global.
- **Buscador global** (`GET /api/busqueda?q=`): recursos, simuladores y contenidos curriculares en un dropdown con debounce.
- Catálogo canónico de áreas (`frontend/src/catalog.js`): 11 slugs con asignaturas, color e ícono; helpers `areaDeAsignatura()`, `areaDeSimulador()`, `contarAreas()`.

## F1 — Home dashboard y tarjetas de áreas (implementada)
- Hero "Aprende. Explora. Experimenta." (SVG/emoji, sin stock).
- Grilla de áreas académicas + filas "Nuevos recursos", "Más utilizados", "Simuladores destacados".
- Páginas `/areas`, `/area/:slug` (simuladores + recursos del área), `/resultados`, `/perfil` (placeholder).

## F2 — Progreso persistente (backend + API) (implementada)
- Tabla `progreso_usuario` (usuario, tipo `recurso|simulador`, item, veces_visto, ultima_vista, completado, favorito) con unicidad por usuario+tipo+item.
- API `/api/progreso`: `GET /` (resumen), `GET /estado`, `GET /continuar`, `GET /favoritos`, `GET /rutas`, `GET /rutas/:slug`, `POST /vista`, `POST /favorito`, `POST /completar`.
- Los detalles (`Detalle.jsx`, `Simulador.jsx`) registran vista automáticamente y ofrecen guardar como favorito y marcar como completado.

## F3 — Perfil real y "Continúa aprendiendo" persistente (implementada)
- `Home.jsx` muestra items continuables reales desde `/progreso/continuar`.
- `Perfil.jsx`: avatar, estadísticas (recursos/simuladores/completados/favoritos), "Continúa aprendiendo", "Mi progreso por área" con barras y "Mis favoritos".

## F4 — Learning paths por área con checkpoints (implementada)
- Rutas construidas dinámicamente por área (sin migración de BD): nodos = simuladores del área + recursos de sus asignaturas, con estado `pendiente | en-progreso | completado` por usuario.
- Páginas `/rutas` (mapa de rutas con avance) y `/ruta/:slug` (checkpoints con "marcar completo").
- `Layout` incluye el enlace "Rutas"; `Area.jsx` enlaza a su ruta.

## F5 — Seguimiento del progreso por parte de docentes (implementada)
- Docentes ven el progreso de los estudiantes de **sus cursos**; coordinación ve todos los estudiantes. Un estudiante no puede acceder (403).
- `GET /api/progreso/seguimiento` (filtros por curso y texto, exportación CSV con `?csv`) y `GET /api/progreso/seguimiento/:usuarioId` (detalle: estadísticas, avance por área, continuar, favoritos).
- Página `/seguimiento` (tabla con filtros + botón de exportar CSV) y `/seguimiento/:usuarioId` (ficha de avance de un estudiante). Nav "Seguimiento" visible para docentes y coordinación.

## F6 — Salas virtuales (videollamadas) (implementada)
- **Salas de reunión y de clase** (`salas`), con acceso `abierto` o `restringido` (contraseña). Los estudiantes no pueden crearlas; las de clase requieren ser del docente del aula o coordinación y pueden anclarse a un curso o sesión.
- API `/api/salas`: listado por visibilidad de rol, crear, detalle, entrar (registra participante + rol: anfitrión/comoderador/participante), salir, participantes, editar y eliminar.
- **Sala en vivo** (`/salas/:id`) con Socket.IO: presencia en tiempo real, **WebRTC mesh** (video/audio punto a punto por señalización `sala:oferta|respuesta|candidato`), chat en vivo, mano alzada, silencio (micrófono propio y control remoto por anfitrión), cronómetro de reunión controlado por el anfitrión (inicio/parar/extender +5min).
- Página "Salas" en la nav para todos los roles. En modo producción se sirve desde el mismo puerto (single-port SPA).
