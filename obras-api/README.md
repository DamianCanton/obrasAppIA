# ObrasApp – API (NestJS)

Backend modular en NestJS + TypeORM que expone los servicios de obras, elementos, depósitos, notas, faltantes y el historial de eventos para la app móvil/web.

## Requisitos

- Node.js 20+
- npm 10+
- PostgreSQL 15+ (o Docker)

## Instalación

```bash
npm install
```

Configura las credenciales de base en `.env` (se incluye un ejemplo):

```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASS=admin
DB_NAME=testdb
```

## Ejecución

```bash
# desarrollo con reload
npm run start:dev

# producción
npm run start

# construir a dist/
npm run build
```

Swagger queda disponible en <http://localhost:3000/api>.

### Docker compose

Se incluye `docker-compose.yml` para levantar PostgreSQL + API + Front de una manera rápida:

```bash
docker compose up --build
```

## Módulos principales

- **auth** – login de arquitectos y obreros con contraseñas `bcrypt` y logging de inicios de sesión.
- **element** – CRUD de elementos, asignación de ubicación actual y registro en `events_history`.
- **note** – creación/edición/borrado de notas sobre elementos, con tracking del actor (`createdBy/updatedBy/deletedBy`).
- **missing** – gestión de faltantes con paginación y acciones de arquitecto (`status`).
- **events-history** – listado enriquecido con datos del usuario que ejecutó cada acción.
- **stadistics** – totales para dashboard y últimos movimientos derivados del historial.

## Cambios recientes

- Eventos históricos guardan `oldData/newData` como JSON nativo y se sanitiza `changedByUser` para no exponer hashes.
- Estadísticas reconocen descripciones traducidas de movimientos y normalizan datos antes de enviarlos.
- Login de obreros valida contraseña `bcrypt` y emite evento “Obrero inició sesión”.
- DTOs de notas alineados con el frontend (`elementId`, `updatedBy`, `deletedBy`).

## Pruebas manuales recomendadas

1. Login de arquitecto y obrero (debe registrar eventos de sesión).
2. Crear/editar/borrar elementos verificando que `events-history` se actualiza.
3. Crear notas desde el front y comprobar que el backend exige `elementId` y registra el evento.
4. Consultar `/architect/:id/stadistics` para confirmar movimientos recientes.

## Estilo de desarrollo

- Servicios centralizan las reglas de negocio y se apoyan en `EventsHistoryLoggerService` para los logs.
- TypeORM se utiliza con `jsonb` para trackear snapshots y eventos.
- Los DTOs usan `class-validator`; mantener los nombres en `camelCase` para que coincidan con el frontend.

