# Arquitectura y stack tecnológico

## Stack (MVP actual)

| Capa | Tecnología | Motivo |
|---|---|---|
| Frontend | React 18 + Vite | SPA rápida, componentes, JSX; Dev server y build sencillo |
| Backend | Node.js 24 + Express | Runtime instalado, ecosistema maduro, REST simple |
| Base de datos | node:sqlite (SQLite integrado en Node) | Cero servidores/tiene que correr local sin instalar nada |
| Validación | Zod | Tipado de entradas en el borde (best practice) |
| Autenticación | jsonwebtoken + bcryptjs | Tokens + hash seguro |
| Subida de archivos | multer | Manejo de multipart |
| Almacenamiento | `backend/uploads/` | Archivos en disco; backup simple |

## Decisión de diseño

Para el MVP se usa **SQLite embebido** por simplicidad y portabilidad en cualquier Windows/macOS/Linux con Node instalado. La capa de datos se aísla en un **répertoire/repositorio** (`src/repositories/`) para que la migración a **PostgreSQL** en Fase 2 solo requiera reescribir los repositorios, no los servicios ni las rutas.

```
src/
  router/          rutas HTTP (delgadas)
  services/        lógica de negocio y reglas (RDBN)
  repositories/    acceso a datos (SQLite hoy, PostgreSQL mañana)
  middleware/      auth + role + validación
  schema/          esquemas Zod
  seed/            datos iniciales (usuarios, currículo)
server.js          arranque
```

## Migración futura (Fase 2)
- Sustituir `node:sqlite` por `pg` (PostgreSQL).
- Reescribir repositorios manteniendo la misma interfaz.
- Mover archivos a **MinIO/S3**.
- Contenerizar con `Dockerfile` + `docker-compose` si el colegio tiene servidor.
- Desplegar en un VPS (Nginx sobre Express + build estático React) para acceso web.

## Mejores prácticas aplicadas
- Secretos por variable de entorno (`.env`), nunca en código.
- Contraseñas con bcrypt; tokens JWT con expiración.
- Validación con Zod en cada endpoint.
- Código organizado por módulos y capas.
- API REST con códigos de estado correctos (200/201/400/401/403/404).
- Paginación en catálogo y reportes.
- Backup: `uploads/` + archivo SQLite copiables.