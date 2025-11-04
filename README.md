# ObrasApp — Gestión de Obras e Inventario, Simplificada

ObrasApp es una plataforma moderna y ligera diseñada para ayudar a arquitectos y equipos de construcción a gestionar proyectos, rastrear inventario, mantener notas y registrar eventos — todo en un solo lugar. Construida como un monorepo práctico con una API NestJS, un frontend Angular y persistencia PostgreSQL, ObrasApp se enfoca en flujos de trabajo reales: reduce el tiempo perdido en inventarios manuales, previene escasez de materiales y mantiene los equipos alineados.

## El problema

Gestionar proyectos de construcción hoy significa malabarear muchas listas desconectadas: dónde están ubicados los materiales, quién movió qué, artículos faltantes que retrasan el trabajo, y notas dispersas. Esto causa pérdida de tiempo, esfuerzo duplicado y retrasos costosos.

## Nuestra solución

ObrasApp centraliza flujos de proyecto, inventario y comunicación para que los equipos puedan:

- Rastrear materiales y movimientos entre obras y depósitos.
- Reportar y dar seguimiento a artículos faltantes.
- Mantener notas simples y contextuales para cada proyecto y evento.
- Autenticar roles (arquitecto vs obrero) y presentar flujos de trabajo específicos por rol.

El resultado: menos interrupciones, responsabilidad clara y operaciones de obra más rápidas.

## Beneficios clave

- Productividad: encuentra materiales y su historial más rápido.
- Confiabilidad: reduce incidentes de artículos faltantes y retrasos inesperados.
- Colaboración: notas compartidas y registros de eventos mantienen los equipos sincronizados.
- UX basada en roles: los obreros obtienen vistas enfocadas de inventario; los arquitectos acceden a paneles de proyecto y características de administración.

## Características destacadas

- API REST (NestJS) con dominios modulares: Architect, Auth, Construction, Elements, ElementMove, Missing, Note, EventsHistory.
- Frontend Angular 20 con componentes standalone y layouts basados en roles (Architect / Worker).
- ApiService centralizado con manejo robusto de solicitudes/respuestas y logging.
- Persistencia Postgres con TypeORM y seeders opcionales para comodidad en desarrollo.
- UI responsiva, drawers mobile-friendly y confirmaciones accionables para operaciones clave.

## Prueba rápida (recomendado: Docker)

Inicia todo el stack con Docker Compose (recomendado para un entorno local repetible):

```bash
docker compose up --build
```

Puertos por defecto:

- API: http://localhost:3000
- Frontend: http://localhost:4200
- Postgres: localhost:5432 (usuario: `admin`, contraseña: `admin`, base: `testdb`)

Para detener:

```bash
docker compose down
```

Agrega `-v` para también eliminar el volumen Postgres.

## Ejecutar localmente sin Docker

1. Inicia Postgres (ejemplo usando Docker):

```bash
docker run --name postgres-local -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=admin -e POSTGRES_DB=testdb -p 5432:5432 -v $(pwd)/postgres-data:/var/lib/postgresql/data postgres:16
```

2. Backend (desarrollo):

```bash
cd obras-api
npm install
npm run start:dev
```

3. Frontend (desarrollo):

```bash
cd obras-front
npm install
ng serve --port 4200
```

## Para mantenedores

- Usa migraciones TypeORM para despliegues en producción. El modo desarrollo puede habilitar sincronización/eliminación de esquema; evítalo en producción.
- Los módulos Seeder (DevSeederModule) ayudan a poblar datos de demostración durante el desarrollo.

## Qué incluye este repositorio

Resumen breve de la estructura:

```
obrasAppIA/
├─ obras-api/      # API NestJS (TypeORM, controllers, services)
├─ obras-front/    # Frontend Angular 20 (standalone components)
├─ postgres-data/  # Datos y configuraciones Postgres de ejemplo
├─ docker-compose.yml
└─ docs & scripts
```

---

# ObrasApp — Construction & Inventory, Made Simple

ObrasApp is a modern, lightweight platform designed to help architects and construction teams manage projects, track inventory, keep notes and log events — all in one place. Built as a practical monorepo with a NestJS API, an Angular frontend and PostgreSQL persistence, ObrasApp focuses on real workflows: reduce time lost on manual inventory, prevent material shortages, and keep teams aligned.

## The problem

Managing construction projects today means juggling many disconnected lists: where materials are located, who moved what, missing items that delay work, and scattered notes. This causes wasted time, duplicated effort, and costly delays.

## Our solution

ObrasApp centralizes project, inventory and communication flows so teams can:

- Track materials and movements between sites and depots.
- Report and follow up on missing items.
- Keep simple, contextual notes for every project and event.
- Authenticate roles (architect vs worker) and present role-specific workflows.

The result: fewer interruptions, clear accountability, and faster site operations.

## Key benefits

- Productivity: find materials and their history faster.
- Reliability: reduce missing-item incidents and unexpected delays.
- Collaboration: shared notes and event logs keep teams in sync.
- Role-based UX: workers get focused inventory views; architects access project dashboards and admin features.

## Highlights / Features

- REST API (NestJS) with modular domains: Architect, Auth, Construction, Elements, ElementMove, Missing, Note, EventsHistory.
- Angular 20 frontend with standalone components and role-based layouts (Architect / Worker).
- Centralized ApiService with robust request/response handling and logging.
- Postgres persistence with TypeORM and optional seeders for development convenience.
- Responsive UI, mobile-friendly drawers and actionable confirmations for key operations.

## Quick try (recommended: Docker)

Start the whole stack with Docker Compose (recommended for a repeatable local environment):

```bash
docker compose up --build
```

Default ports:

- API: http://localhost:3000
- Frontend: http://localhost:4200
- Postgres: localhost:5432 (user: `admin`, pass: `admin`, db: `testdb`)

To stop:

```bash
docker compose down
```

Add `-v` to also remove the Postgres volume.

## Run locally without Docker

1. Start Postgres (example using Docker):

```bash
docker run --name postgres-local -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=admin -e POSTGRES_DB=testdb -p 5432:5432 -v $(pwd)/postgres-data:/var/lib/postgresql/data postgres:16
```

2. Backend (development):

```bash
cd obras-api
npm install
npm run start:dev
```

3. Frontend (development):

```bash
cd obras-front
npm install
ng serve --port 4200
```

## For maintainers

- Use TypeORM migrations for production deployments. Development mode may enable schema sync/drop; avoid it in production.
- Seeder modules (DevSeederModule) help populate demo data during development.

## What's included in this repo

Short summary of structure:

```
obrasAppIA/
├─ obras-api/      # NestJS API (TypeORM, controllers, services)
├─ obras-front/    # Angular 20 frontend (standalone components)
├─ postgres-data/  # Example Postgres data and configs
├─ docker-compose.yml
└─ docs & scripts
```
---
*Generated / updated on 04/11/2025*

