# ObrasAppIA

Plataforma compuesta por un backend NestJS, un frontend Angular y una base de datos PostgreSQL, pensada para gestionar obras, inventario, notas y eventos en proyectos de arquitectura. El repositorio funciona como monorepo ligero donde conviven los tres componentes y los recursos auxiliares (scripts, volcado de datos, documentacion de la API).

## Estructura del repositorio

```
obrasAppIA/
├─ obras-api/          # Backend NestJS (API REST, autenticacion, TypeORM)
├─ obras-front/        # Frontend Angular 20 (standalone components)
├─ postgres-data/      # Volumen persistente de Postgres para desarrollo local
├─ docker-compose.yml  # Orquesta Postgres + API + Front
├─ schema.sql          # Esquema base de referencia para la BD
├─ postgre.sql         # Datos semillas opcionales
├─ postgre.bash        # Script de utilidades para Postgres
├─ apiDoc.md           # Documentacion detallada de los endpoints REST
└─ README.md           # Este archivo
```

## Backend (`obras-api/`)

- NestJS 11 con arquitectura modular; cada dominio funcional cuenta con su propio modulo (architect, auth, construction, deposit, element, missing, note, stadistics, etc.).
- TypeORM 0.3 configurado en `src/config/orm-common.ts`, con entidades ubicadas en `src/shared/entities`. En modo desarrollo (`NODE_ENV=development`) se habilita `synchronize` y `dropSchema`; en otros entornos se esperan migraciones.
- Autenticacion basada en el modulo `auth`, que expone `/auth/login` y gestiona credenciales de arquitectos (`architect`).
- Seeder opcional (`DevSeederModule`, `SeederModule`) para poblar datos iniciales durante el bootstrap.
- Servicios notables:
  - `ElementMoveModule` registra movimientos de inventario entre obras y depositos.
  - `EventsHistoryModule` construye el log de actividades.
  - `MissingModule` permite marcar elementos faltantes.
- Configuracion de entorno: se toma de `.env` (desarrollo) o `.env.prod` (docker/prod). Variables principales: `NODE_ENV`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`.

## Frontend (`obras-front/`)

- Angular 20 con arquitectura basada en componentes standalone y rutas declaradas en `src/app/app.routes.ts`.
- Layouts diferenciados por rol (`ArchitectLayout`, `WorkerLayout`) y proteccion con `AuthGuard`.
- Servicios de datos centralizados en `src/app/core/api.ts`, que encapsula `HttpClient` y apunta a `environment.apiBaseUrl` (definido en `src/environment/`).
- Paginas relevantes: dashboard, listado de obras y detalle, inventario, movimientos, registros de faltantes, notas y un editor enriquecido.
- Servidor Express (`server.mjs`) para servir assets compilados en despliegues (espera `dist/obrasApp/browser`). En desarrollo se suele usar `ng serve` o `ng build --watch`.

## Base de datos (`postgres-data/` y scripts)

- PostgreSQL 16, con volumen docker mapeado a `postgres-data/` para persistencia.
- Esquema y datos de referencia: `schema.sql` y `postgre.sql`. Puede importarse manualmente o adaptarse a migraciones TypeORM.
- El backend se conecta via TypeORM usando las credenciales definidas en las variables de entorno.

## Conexion entre capas

1. **Frontend -> Backend**: todas las peticiones pasan por `ApiService`, que construye URL absolutas usando `environment.apiBaseUrl`. Por defecto (`environment.ts`) apunta a `http://localhost:3000`. En produccion (`environment.prod.ts`) se usa `https://obras-api-production.up.railway.app`.
2. **Backend -> Base de datos**: `TypeOrmModule.forRoot(typeOrmConfig)` inicializa la conexion en `AppModule`. La API espera que Postgres este disponible antes de bootstrapping; `DbReadyLoggerService` notifica cuando la conexion esta lista.
3. **Autenticacion**: el front obtiene un token via `/auth/login`, lo almacena (ej. `localStorage`) y lo envia en `Authorization: Bearer <token>` para acceder a rutas protegidas. `AuthGuard` en Angular valida la sesion antes de renderizar layouts.
4. **Sincronizacion de inventario**: el backend expone endpoints REST por modulo (ver `apiDoc.md`) y mantiene consistencia mediante servicios como `element`, `element-move` y `events-history`. El front consume esos endpoints para poblar tablas, dashboards y formularios.

## Puesta en marcha

### Requisitos

- Node.js 20 o superior (para front y back).
- npm 10+.
- Docker Desktop (opcional pero recomendado para el flujo completo).
- Angular CLI (`npm install -g @angular/cli`) si se desea usar `ng serve`.

### Arranque rapido con Docker Compose

1. Copiar o crear los archivos de entorno:
   - `obras-api/.env.prod` ya contiene valores listos para docker (`DB_HOST=postgres`, credenciales admin/admin, base `testdb`).
2. Desde la raiz del repo ejecutar:

   ```bash
   docker compose up --build
   ```

3. Servicios expuestos:
   - API NestJS: `http://localhost:3000`.
   - Front Angular (build estatico + Nginx): `http://localhost:4200`.
   - PostgreSQL: `localhost:5432` (usuario `admin`, password `admin`, base `testdb`).

4. Para detener y liberar recursos:

   ```bash
   docker compose down
   ```

   Agregar `-v` si se desea eliminar el volumen `postgres_data`.

### Ejecucion local sin Docker

#### Base de datos

1. Levantar Postgres 16 localmente o mediante docker standalone:

   ```bash
   docker run --name postgres-local -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=admin -e POSTGRES_DB=testdb -p 5432:5432 -v $(pwd)/postgres-data:/var/lib/postgresql/data postgres:16
   ```

2. (Opcional) Importar `schema.sql` y `postgre.sql`:

   ```bash
   psql -h localhost -U admin -d testdb -f schema.sql
   psql -h localhost -U admin -d testdb -f postgre.sql
   ```

#### Backend (NestJS)

1. Crear `obras-api/.env` con valores locales (ejemplo):

   ```env
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=admin
   DB_PASS=admin
   DB_NAME=testdb
   ```

2. Instalar dependencias y arrancar en modo watch:

   ```bash
   cd obras-api
   npm install
   npm run start:dev
   ```

3. Endpoints disponibles en `http://localhost:3000`. Swagger puede configurarse activando `@nestjs/swagger` si se habilita en `main.ts`.

#### Frontend (Angular)

1. Configurar `src/environment/environment.ts` segun corresponda (por defecto apunta a `http://localhost:3000`).
2. Instalar dependencias y ejecutar:

   ```bash
   cd obras-front
   npm install
   ng serve --port 4200
   ```

   Alternativa sin Angular CLI global:

   ```bash
   npm run watch
   ```

3. Acceder a `http://localhost:4200`. El servidor Express (`npm run start`) sirve la build generada (`npm run build`).

### Datos iniciales y migraciones

- Durante el desarrollo (`start:dev`) TypeORM sincroniza las entidades eliminando el esquema anterior (`dropSchema`). Evitar esto en ambientes con datos reales.
- Para entornos productivos usar migraciones:

  ```bash
  cd obras-api
  npm run build
  npm run migration:run
  ```

- Los scripts `migration:create` y `migration:run` usan `src/config/data-source.ts` como entrypoint.

## Scripts utiles

- `obras-api`:
  - `npm run test`, `npm run test:e2e`, `npm run lint`.
  - `npm run start:prod` sirve la API compilada (`dist/`).
- `obras-front`:
  - `npm run build` genera `dist/obrasApp/browser` para despliegue.
  - `npm run start` levanta el servidor Express (`server.mjs`).

## Documentacion adicional

- Endpoints detallados y payloads: ver `apiDoc.md`.
- Configuracion Postgres: `postgres-data/postgresql.conf`, `pg_hba.conf` (copiados del contenedor para reproducir el entorno local).
- Notas y tareas pendientes: `tareas.txt`.

Con esto deberias contar con una vision completa de la arquitectura y los pasos necesarios para levantar el proyecto completo (front + back + base de datos).
