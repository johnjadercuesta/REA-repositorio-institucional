# Repositorio Institucional de Recursos Educativos Abiertos (REA)

Sistema web para centralizar recursos educativos abiertos del área, optimizar la preparación de clases y dar seguimiento curricular.

## Documentación
- [`docs/00-proyecto.md`](docs/00-proyecto.md) — Propósito, alcance y objetivos
- [`docs/01-requisitos.md`](docs/01-requisitos.md) — Requisitos funcionales y no funcionales
- [`docs/02-diseno.md`](docs/02-diseno.md) — Modelo de datos, API y UX
- [`docs/03-arquitectura.md`](docs/03-arquitectura.md) — Stack y estructura del código
- [`docs/04-plan-fases.md`](docs/04-plan-fases.md) — Roadmap por fases
- [`docs/05-manual-despliegue.md`](docs/05-manual-despliegue.md) — Cómo correr el sistema

## Stack
- **Frontend:** React 18 + Vite
- **Backend:** Node.js + Express
- **BD:** SQLite embebido (migrable a PostgreSQL en Fase 2)

## Arranque rápido
```bash
cd backend && npm install && npm run seed && npm run dev
cd frontend && npm install && npm run dev
```
Abrir `http://localhost:5173`.

Credenciales demo: `coord@colegio.edu` / `Admin123!` y `docente@colegio.edu` / `Docente123!`.
