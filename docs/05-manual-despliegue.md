# Manual de despliegue y uso

## Requisitos
- Node.js 20+ (probado con Node 24) — usa `node:sqlite` (sin dependencias de BD externas).
- Solo JDK de un host; base SQLite embebida, sin servicios externos.

## Estructura del proyecto
- `backend/`  → API REST + Socket.IO (Express + node:sqlite) y **en producción sirve la SPA**
- `frontend/` → SPA (React + Vite)

---

## Desarrollo (dos procesos)

### 1. Backend
```bash
cd backend
npm install
npm run seed      # crea la BD y carga usuarios/currículo/aulas/sesiones demo
npm run dev       # http://localhost:4000 (API + WebSocket)
```
### 2. Frontend (con recarga en caliente)
```bash
cd frontend
npm install
npm run dev       # http://localhost:5173 (proxy /api y /socket.io a :4000)
```
Abrí `http://localhost:5173`.

### Credenciales seed
| Rol | Email | Password |
|---|---|---|
| Coordinación | `coord@colegio.edu` | `Admin123!` |
| Docente | `docente@colegio.edu` | `Docente123!` |
| Estudiante | `estudiante@colegio.edu` | `Estudiante123!` |
| Estudiante | `ana@colegio.edu` / `bruno@colegio.edu` | `Estudiante123!` |

---

## Producción (un solo puerto)

Una vez construido el frontend, el backend sirve la SPA, la API y el WebSocket en **un único puerto (4000)**.

```bash
cd frontend
npm install
npm run build     # genera frontend/dist

cd ../backend
npm install --omit=dev
set JWT_SECRET=CLAVE-LARGA-Y-SEGURA   # o copiá backend/.env
npm start          # http://localhost:4000 (SPA + API + pizarra en vivo)
```

El backend detecta `frontend/dist` automáticamente y:
- sirve los estáticos del build,
- hace *fallback* a `index.html` para las rutas del cliente (p. ej. `/aulas/5`),
- NO intercepta `/api/*` ni `/socket.io` (devuelve JSON 404 para rutas de API desconocidas),
- monta Socket.IO en el mismo puerto (pizarra colaborativa).

> En desarrollo (`npm run dev`) esto no aplica: la SPA se sirve desde Vite en `http://localhost:5173`.

## Configuración (backend/.env)
Copiá `backend/.env.example` → `backend/.env`:

```
PORT=4000
JWT_SECRET=cambiar-por-secreto-fuerte
JWT_EXPIRES=12h
DB_PATH=./data/rea.db
UPLOAD_DIR=./uploads
BACKUP_DIR=./backups
#SPA_DIST=./frontend/dist     # ruta del build (por defecto ya la resuelve)
```

> Generá un secreto fuerte con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
> **NUNCA** commitees secretos reales ni `*.db` con datos personales.

## Scripts útiles (backend)
| Comando | Descripción |
|---|---|
| `npm run seed` | (Re)crea la BD y carga el seed demo |
| `npm test` | Pruebas de integración (supertest) |
| `npm run dev` | Servidor dev con recarga automática |
| `npm start` | Servidor de producción (sirve también la SPA) |
| `npm run backup` | Copia BD + uploads a `backups/` |

## Backup
- Copiar `backend/data/rea.db` y `backend/uploads/`. Sugerido programar copia diaria (Task Scheduler) a `backend/backups/`.

## Despliegue en un VPS / hosting
1. Instalar Node 20+ en el servidor.
2. `npm ci --omit=dev` en `backend/`; `npm ci && npm run build` en `frontend/`.
3. Elegir un gestor de procesos: **PM2** (`pm2 start src/server.js`) o **systemd**.
4. Reverso proxy con **Nginx + HTTPS (Let's Encrypt)** hacia `http://127.0.0.1:4000` (incluye `/socket.io` como upgrade de WebSocket).
5. Configurar `JWT_SECRET`, `CORS_ORIGIN` (dominio real) y volcar la BD/upload del entorno anterior.

### Notas de la pizarra en vivo
- La pizarra mantiene los trazos y la presencia **en memoria** por sesión activa (no persistidos en BD). Al reiniciar el servidor la pizarra se vacía; la asistencia y las sesiones sí están en BD.
- Para escalar a varios nodos habría que mover la pizarra a un redis/adapter compartido (fuera del alcance del MVP).

## Alta demanda / siguientes pasos
- Base de datos: esta estructura aislada en `repositories/` permite migrar a PostgreSQL/MinIO sin tocar la API.
- Contenido H5P completo (reproducir paquetes `.h5p`) requiere un servidor H5P (`h5p-nodejs-library`) cuando se defina el hosting.