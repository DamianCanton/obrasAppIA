# Manual Interno de Desarrollo - ObrasApp

## Propósito

Este documento es una guía interna de referencia para entender la estructura y patrones arquitectónicos del proyecto **ObrasApp**. Todos los puntos aquí descritos deben respetarse para evitar inconsistencias y deuda técnica.

---

## 1. Metodología y Filosofía de Desarrollo (El "Cómo" Desarrollamos)

### Arquitectura Angular: Standalone Components

El frontend (**obras-front**) utiliza **Angular Standalone Components**, NO NgModules. Esto significa:

- Cada componente se define de forma independiente con el decorador `@Component`.
- No hay módulos explícitos en el proyecto.
- La inyección de dependencias se hace a nivel de componente.
- Es más ligero, modular y alineado con las tendencias modernas de Angular.

### Carga de Rutas: Lazy Loading

Se implementa **Lazy Loading** (carga perezosa) de rutas para optimizar el rendimiento:

- Las rutas se cargan solo cuando el usuario las accede.
- Reducimos el tamaño inicial del bundle.
- Las rutas están definidas en `src/app/app.routes.ts`.

### Patrón de Componentes: Smart & Dumb

Mantenemos una clara separación entre dos tipos de componentes:

#### Componentes "Smart" (Contenedores)
- Ubicación: `src/app/pages/`
- Ejemplos: `construction/`, `deposit/`, `dashboard/`, `notes/`
- **Responsabilidades:**
  - Manejan la lógica de negocio.
  - Obtienen datos de los servicios.
  - Gestionan el estado local.
  - Declaran y pasan datos a componentes "Dumb".

#### Componentes "Dumb" (Presentacionales)
- Ubicación: `src/app/shared/`
- Ejemplos: `menu/`, `element-table/`, `missing-menu/`, `note-edit/`
- **Responsabilidades:**
  - Solo reciben datos a través de `@Input()`.
  - Emiten eventos a través de `@Output()`.
  - NO tienen dependencias de servicios.
  - Son reutilizables y fáciles de testear.

### Manejo de Estado (¡CRÍTICO!)

#### Lo que NO hacemos:
- ❌ **NO usamos NgRx** (Redux para Angular).
- ❌ **NO usamos Redux**.
- Esto mantiene el proyecto simple y sin sobreingeniería.

#### Lo que SÍ hacemos:
- ✅ Todo el estado se maneja en **Servicios de Angular** (`src/app/services/`).
- ✅ Los servicios utilizan **Observables y Subjects (RxJS)** para comunicar el estado.
- ✅ Ejemplos de servicios:
  - `auth.service.ts`: Autenticación y datos del usuario.
  - `elements.service.ts`: Gestión de elementos.
  - `missings.service.ts`: Gestión de elementos faltantes.
  - `notes.service.ts`: Gestión de notas.
  - `event-data.service.ts`: Gestión de eventos.
  - `drawer_visibility.service.ts`: Estado de la UI (menú lateral).

### Manejo de Suscripciones

La preferencia es usar el **async pipe** en las plantillas HTML siempre que sea posible:

```html
<!-- ✅ CORRECTO -->
<p>{{ dato$ | async }}</p>
<div *ngIf="(loading$ | async)">Cargando...</div>

<!-- ❌ EVITAR -->
<p>{{ dato }}</p>
<div *ngIf="loading">Cargando...</div>
```

Ventajas:
- Angular gestiona automáticamente la suscripción y desinscripción.
- Evitamos memory leaks.
- Código más limpio y mantenible.

### Formularios: Reactive Forms

Se deben usar **Reactive Forms** para formularios complejos:

```typescript
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';

export class MiComponente {
  form = this.fb.group({
    nombre: ['', Validators.required],
    email: ['', Validators.email]
  });

  constructor(private fb: FormBuilder) {}
}
```

Ventajas:
- Mejor control sobre la validación.
- Más fácil de testear.
- Ideal para formularios con lógica compleja.

### Estilos: SCSS

Usamos **SCSS** (Sass) para todos los estilos:

- Archivos: `*.scss`
- Reutilización de variables y mixins.
- Estructura anidada y modular.
- Variables globales en `src/styles.scss`.

### TypeScript: Strict Mode

El frontend tiene configuración `strict: true` en `tsconfig.json`:

- ✅ Mejor detección de errores en tiempo de compilación.
- ✅ Código más robusto y mantenible.
- ✅ No permitimos `any` sin razón válida.

---

## 2. Links, Librerías y Stack Tecnológico

### Links Útiles

| Recurso | URL |
|---------|-----|
| **Frontend (Aplicación)** | http://localhost:4200 |
| **Backend (API)** | http://localhost:3000 |
| **Documentación API (Swagger)** | http://localhost:3000/api |

🔴 **La documentación de Swagger es la "biblia" de la API.** Siempre consulta ahí para entender los endpoints disponibles, parámetros y respuestas.

### Librerías del Frontend (Lo que SÍ usamos)

| Librería | Versión | Propósito |
|----------|---------|----------|
| **Angular** | ^20.0.0 | Framework principal |
| **PrimeNG** | ^19.1.3 | Componentes UI (tablas, botones, diálogos, etc.) |
| **PrimeFlex** | ^4.0.0 | Sistema de grid y layout |
| **PrimeIcons** | ^7.0.0 | Iconos para la interfaz |
| **RxJS** | ~7.8.0 | Programación reactiva |
| **TypeScript** | ~5.8.2 | Lenguaje tipado |
| **Quill** | ^2.0.3 | Editor de texto enriquecido (notas) |
| **DOMPurify** | ^3.2.6 | Sanitización de HTML |
| **Express** | ^5.1.0 | Servidor para producción |

### Librerías del Backend 

| Librería | Versión | Propósito |
|----------|---------|----------|
| **NestJS** | ^11.0.1 | Framework backend (similar a Express pero con estructura modular) |
| **NestJS/TypeORM** | ^11.0.0 | Integración de ORM con NestJS |
| **TypeORM** | ^0.3.25 | ORM para mapeo objeto-relacional |
| **PostgreSQL** | (driver: pg ^8.16.2) | Base de datos relacional |
| **class-validator** | ^0.14.2 | Validación de DTOs en los controladores |
| **bcryptjs** | ^3.0.2 | Encriptación de contraseñas |
| **Swagger/OpenAPI** | ^11.2.0 | Documentación interactiva de API |

### Librerías que NO usamos (¡Importante!)

❌ `@ngrx/store` (Redux para Angular)  
❌ `Angular Material` (usamos PrimeNG en su lugar)  
❌ `Bootstrap o Tailwind` (usamos PrimeFlex en su lugar)  

---

## 3. Puesta en Marcha 

### Backend: Contenedores Docker

El backend y la base de datos corren en **contenedores Docker**.

#### Comando de Inicio

```bash
docker-compose up
```

Esto levanta:
- **PostgreSQL**: Base de datos.
- **API NestJS**: Servidor backend.

#### Credenciales de Base de Datos (Desarrollo)

```
Usuario: admin
Contraseña: admin
Nombre de BD: testdb
```

#### Primera Ejecución

Si es la primera vez que ejecutas el proyecto:

```bash
docker-compose up --build
```

### Frontend: El Paso CRÍTICO ⚠️

**Conflicto de Versiones:**  
Existe un conflicto entre **Angular v20** y **PrimeNG v19** (PrimeNG aún no tiene soporte completo para Angular 20).

#### Instalación de Dependencias (OBLIGATORIO)

Usa **uno** de estos comandos:

```bash
# Opción 1: Forzar instalación (recomendado)
npm install --force

# Opción 2: Usar dependencias heredadas
npm install --legacy-peer-deps
```

**Sin este paso, `npm install` fallará.**

#### Comando de Inicio

```bash
# Opción 1: Usando Angular CLI (RECOMENDADO en desarrollo)
ng serve

# Opción 2: Alternativa con npm
npm run start
```

Luego accede a la aplicación en: **http://localhost:4200**

---

## 4. Estructura de Archivos (Dónde está cada cosa)

### División General

```
obrasAppIA/
├── obras-api/          # Backend (NestJS)
├── obras-front/        # Frontend (Angular)
├── docker-compose.yml  # Orquestación de contenedores
└── schema.sql          # Script inicial de BD
```

### Archivos Clave del Frontend (obras-front/src/app/)

```
src/app/
├── pages/                    # 🧠 Componentes Smart (lógica)
│   ├── construction/
│   ├── construction-detail/
│   ├── construction-workers/
│   ├── dashboard/
│   ├── deposit/
│   ├── event-detail/
│   ├── events/
│   ├── login/
│   ├── missing-registry/
│   ├── note-editor/
│   ├── notes/
│   └── ...
│
├── shared/                   # 👁️ Componentes Dumb (presentación)
│   ├── element-table/
│   ├── menu/
│   ├── missing-menu/
│   ├── note-edit/
│   └── ...
│
├── services/                 # 📦 Lógica de negocio y estado
│   ├── auth.service.ts
│   ├── drawer_visibility.service.ts
│   ├── elements.service.ts
│   ├── event-data.service.ts
│   ├── missings.service.ts
│   └── notes.service.ts
│
├── models/                   # 📋 Interfaces y tipos TypeScript
│   └── interfaces.model.ts
│
├── core/                     # 🔧 Servicios de infraestructura
│   ├── api.ts               # Configuración del cliente HTTP
│   └── missings-bootstrap.service.ts  # Inicialización de missings
│
├── guards/                   # 🔐 Guards de rutas
│   └── auth.guard.ts        # Protege rutas autenticadas
│
├── layouts/                  # 🎨 Layouts reutilizables
│   ├── architect-layout.ts   # Layout para arquitectos
│   ├── worker-layout.ts      # Layout para trabajadores
│   └── worker-menu.ts        # Menú de trabajadores
│
├── app.routes.ts            # 🛣️ Definición de rutas (lazy loading + roles)
├── app.config.ts            # ⚙️ Configuración global
├── app.ts                   # 📱 Componente raíz (Standalone)
├── app.html                 # Template raíz
├── app.scss                 # Estilos globales
└── preset.ts                # Presets de PrimeNG (temas)
```

#### Estructura de Rutas (app.routes.ts)

El sistema usa rutas organizadas por **rol de usuario** (architect/worker):

```typescript
export const routes: Routes = [
  { path: 'login', component: LoginComponent },  // Sin guard

  // Rutas protegidas para ARQUITECTO
  {
    path: '',
    component: ArchitectLayout,
    canActivate: [AuthGuard],
    data: { roles: ['architect'] },
    children: [
      { path: '', component: Dashboard },
      { path: 'construction-workers', component: ConstructionWorkers },
      { path: 'constructions', component: ConstructionComponent },
      { path: 'construction/:id', component: ConstructionDetail },
      { path: 'deposit', component: Deposit },
      { path: 'events', component: Events },
      { path: 'missings', component: MissingRegistry },
      { path: 'event/:id', component: EventDetail },
      { path: 'notes', component: Notes },
      // ... más rutas
    ]
  },

  // Rutas protegidas para TRABAJADOR
  {
    path: 'worker',
    component: WorkerLayout,
    canActivate: [AuthGuard],
    data: { roles: ['worker'] },
    children: [
      // Rutas específicas para trabajadores
    ]
  }
];
```

**Puntos clave:**
- Las rutas están agrupadas por layout (ArchitectLayout / WorkerLayout).
- Cada grupo tiene su propio `canActivate: [AuthGuard]` con `data: { roles }`.
- Las rutas hijas heredan la protección del padre.

### Archivos Clave del Backend (obras-api/src/)

```
src/
├── main.ts                   # Punto de entrada
├── app.module.ts             # Módulo raíz
├── config/                   # 🔧 Configuración BD
│   ├── typeorm.config.ts
│   ├── data-source.ts
│   └── orm-common.ts
│
├── architect/                # 👷 Módulo de Arquitectos
├── auth/                     # 🔐 Módulo de Autenticación
├── category/                 # 📂 Módulo de Categorías
├── construction/             # 🏗️ Módulo de Obras
├── construction-snapshot/    # 📸 Snapshots de obras
├── construction-worker/      # 👷 Relación Obra-Trabajador
├── deposit/                  # 📦 Módulo de Depósitos
├── element/                  # 🧱 Módulo de Elementos
├── element-move/             # 🔄 Módulo de Movimiento de Elementos
├── events-history/           # 📝 Módulo de Auditoría
├── missing/                  # ⚠️ Módulo de Elementos Faltantes
├── note/                     # 📌 Módulo de Notas
├── plan-limit/               # 📊 Módulo de Límites de Planificación
│
└── shared/                   # 🔌 Código compartido
    ├── entities/             # Entidades de BD
    ├── enums/                # Enumeraciones
    ├── filters/              # Filtros globales
    ├── interceptors/         # Interceptores HTTP
    ├── services/             # Servicios comunes
    └── encrypt/              # Servicios de encriptación
```

---

## 5. Flujos y Conceptos Importantes del Sistema

### Autenticación: JWT

El sistema usa **JSON Web Tokens (JWT)** para autenticación:

#### Flujo de Autenticación

1. **Login:**
   ```bash
   POST /auth/login
   Body: { email: "user@example.com", password: "password" }
   Response: { token: "eyJhbGc..." }
   ```

2. **Enviar token en peticiones posteriores:**
   ```bash
   GET /construction
   Headers: Authorization: Bearer eyJhbGc...
   ```

3. **El token se almacena localmente** en el cliente y se envía en cada petición.

#### En el código frontend:

```typescript
// auth.service.ts gestiona el token
export class AuthService {
  login(credentials) {
    return this.http.post('/auth/login', credentials);
  }

  getToken() {
    return localStorage.getItem('token');
  }
}
```

### Multi-Tenant: Arquitecto-Centrismo

El sistema es **multi-arquitecto**. Cada arquitecto solo ve:

- ✅ Sus propias obras (construcciones).
- ✅ Sus propios depósitos.
- ✅ Sus propios elementos.
- ✅ Sus propios trabajadores.
- ✅ Sus propios eventos.

**Implementación:** El `auth.service` mantiene el usuario autenticado, y los servicios filtran datos basados en el `architectId`.

### Auditoría: Trazabilidad (Events History)

**Todos los movimientos se registran automáticamente en Events History.**

Esto incluye:

- ✅ Creación de elementos.
- ✅ Movimiento de elementos entre depósitos y obras.
- ✅ Cambios de estado.
- ✅ Creación/eliminación de notas.
- ✅ Cambios en trabajadores.

**Endpoint:** `GET /events-history` (consulta el historial completo).

**Importancia:** Permite auditoría completa del sistema y debugging de problemas.

### Inventario: Flujo Core de Element-Move

El **movimiento de elementos** es el corazón del sistema de inventario:

#### Flujo General

```
1. Elemento existe en Depósito
        ↓
2. POST /element-move (transferencia)
        ↓
3. Elemento ahora en Obra (o en otro Depósito)
        ↓
4. Evento registrado automáticamente
```

#### Endpoint de Element-Move

```bash
POST /element-move
Body: {
  elementId: number,
  fromLocation: "DEPOSIT" | "CONSTRUCTION",
  toLocation: "DEPOSIT" | "CONSTRUCTION",
  fromId: number,          # ID del depósito/obra origen
  toId: number,            # ID del depósito/obra destino
  quantity: number,        # Cantidad a mover
  reason?: string          # Razón del movimiento (opcional)
}
```

#### En el frontend

El servicio `elements.service.ts` maneja esta lógica:

```typescript
moveElement(moveData) {
  return this.http.post('/element-move', moveData);
}
```

### Elementos Faltantes: Sistema de Missing

Cuando un elemento falta, se registra en el sistema de **Missing**:

#### Flujo de Missing

1. **Detectar que falta un elemento** en una obra.
2. **POST /missing** (crear reporte de faltante).
3. **El estado puede cambiar:** PENDING → RESOLVED.
4. **Se registra en Events History.**

#### Endpoints de Missing

```bash
POST /missing                 # Crear reporte de faltante
GET /missing                  # Listar faltantes
PATCH /missing/:id/status    # Actualizar estado (RESOLVED, etc)
```

---

## 6. Guía de Buenas Prácticas

### En el Frontend

1. **Siempre usa `async` pipe** en templates.
2. **Crea servicios para lógica compartida**, no dupliques código.
3. **Mantén los componentes "Smart" simples**, delega presentación a "Dumb".
4. **Usa tipos fuerte** (no hagas `any`).
5. **Imports: Sigue el patrón** de las carpetas existentes.

### En el Backend

1. **Usa DTOs** para validación de entrada.
2. **Registra movimientos importantes** en Events History.
3. **Implementa filtrado por `architectId`** en queries.
4. **Usa TypeORM relations** para evitar N+1 queries.
5. **Sigue el patrón Controller → Service → Repository**.

### Git y Colaboración

1. **Rama master:** Código producción.
2. **Ramas de feature:** `feature/nombre-descriptivo`.
3. **Commits descriptivos:** `feat: añadir campo a construcción` o `fix: bug en element-move`.
4. **PRs antes de mergear:** Revisión de código.

---

## 7. Comandos Útiles

### Backend (NestJS)

```bash
# Levantar en desarrollo
npm run start:dev

# Build para producción
npm run build

# Tests
npm run test
npm run test:e2e

# Linting
npm run lint
```

### Frontend (Angular)

```bash
# Instalar dependencias (con solución de conflicto)
npm install --force

# Servir en desarrollo (RECOMENDADO)
ng serve

# Build para producción
npm run build

# Build en modo watch para desarrollo
npm run watch

# Tests unitarios
npm run test
```

### Docker

```bash
# Levantar servicios
docker-compose up

# Levantar con rebuild
docker-compose up --build

# Detener servicios
docker-compose down

# Ver logs
docker-compose logs -f postgres
docker-compose logs -f api
```

---

## 8. Troubleshooting Común

| Problema | Solución |
|----------|----------|
| `npm install` falla en frontend | Usa `npm install --force` o `npm install --legacy-peer-deps` |
| Angular no encuentra módulos | Verifica los imports, recuerda Standalone Components |
| Página no se carga en `localhost:4200` | Revisa que `ng serve` está corriendo en terminal |
| Error "Cannot find module" en frontend | Limpia `node_modules/`, `.angular/cache/` y reinstala con `npm install --force` |
| API devuelve 401 (Unauthorized) | Token expirado o no enviado. Revisa header `Authorization: Bearer <token>` |
| Elemento no se mueve entre depósitos | Verifica que el body de `element-move` tiene: elementId, fromLocation, toLocation, fromId, toId, quantity |
| Base de datos vacía | Ejecuta `docker-compose up --build` para reinicializar |
| Docker no inicia | Verifica que Docker Desktop está corriendo en Windows |
| Puerto 3000 o 4200 ya en uso | Mata el proceso: `lsof -i :3000` (Mac/Linux) o `netstat -ano` (Windows) |

---

## 9. Roles y Permisos en el Sistema

### Arquitecto (Architect)

**Acceso completo a:**
- ✅ Crear y gestionar obras (construcciones).
- ✅ Crear y gestionar depósitos.
- ✅ Gestionar elementos e inventario.
- ✅ Asignar trabajadores a obras.
- ✅ Ver historial de eventos (auditoría).
- ✅ Crear y gestionar notas.
- ✅ Reportar elementos faltantes (missings).
- ✅ Dashboard con estadísticas.

**Layout:** `ArchitectLayout` (menú completo con todas las opciones)

### Trabajador (Worker)

**Acceso limitado a:**
- ✅ Ver datos de la obra asignada.
- ✅ Crear notas en la obra.
- ✅ Reportar elementos faltantes.
- ❌ NO puede crear/editar obras, depósitos o elementos.
- ❌ NO puede gestionar inventario.

**Layout:** `WorkerLayout` (menú simplificado)

---

## 10. Variables de Entorno

### Frontend (.env no visible, configurado en environment.ts)

```typescript
// src/environment/environment.ts
export const environment = {
  apiUrl: 'http://localhost:3000/api'
};

// src/environment/environment.prod.ts
export const environment = {
  apiUrl: 'https://api.produccion.com'
};
```

### Backend (.env en raíz)

```bash
NODE_ENV=development
DB_HOST=postgres
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=admin
DB_NAME=testdb
JWT_SECRET=tu_secret_jwt_aqui
JWT_EXPIRATION=24h
```

---

## 11. Historial de Cambios Realizados con IA

### 📅 Fecha: 04/11/2025

#### Resumen General

Se realizó una **documentación completa y profesional en inglés** de los archivos fuente principales del proyecto ObrasApp. Todos los comentarios fueron añadidos con formato **JSDoc** siguiendo estándares de código profesional. Los comentarios incluyen descripciones de responsabilidades, parámetros, valores de retorno, ejemplos de uso y explicaciones de arquitectura.

#### Objetivo

Mejorar la mantenibilidad y comprensión del código para futuros desarrolladores, documentando el flujo de datos, patrones de diseño y responsabilidades de cada componente.

#### Archivos Comentados

| Archivo | Ubicación | Tipo | Descripción |
|---------|-----------|------|-------------|
| `main.ts` | `obras-api/src/` | Backend | Punto de entrada de la API NestJS - Bootstrap, CORS, Swagger, interceptores |
| `main.ts` | `obras-front/src/` | Frontend | Bootstrap de la aplicación Angular - Inicialización de plataforma |
| `app.ts` | `obras-front/src/app/` | Frontend | Componente raíz standalone - RouterOutlet principal |
| `app.config.ts` | `obras-front/src/app/` | Frontend | Configuración global - Providers, rutas, temas, servicios |
| `app.routes.ts` | `obras-front/src/app/` | Frontend | Definición de rutas - Lazy loading, role-based access, layouts |
| `api.ts` | `obras-front/src/app/core/` | Frontend | API Service - HTTP client, request genérico, response unwrapping |
| `auth.service.ts` | `obras-front/src/app/services/` | Frontend | Autenticación - Session management, localStorage, signals |
| `auth.guard.ts` | `obras-front/src/app/guards/` | Frontend | Route Guard - Validación de autenticación y roles |
| `architect-layout.ts` | `obras-front/src/app/layouts/` | Frontend | Layout para Arquitectos - Sidebar responsivo, drawer móvil |
| `worker-layout.ts` | `obras-front/src/app/layouts/` | Frontend | Layout para Trabajadores - Header específico, navegación limitada |
| `login.component.ts` | `obras-front/src/app/pages/login/` | Frontend | Componente de Login - Formulario reactivo, validación, redirección por rol |
| `construction.ts` | `obras-front/src/app/pages/construction/` | Frontend | Página de Construcciones - CRUD de proyectos, lista dinámica |
| `elements.service.ts` | `obras-front/src/app/services/` | Frontend | Servicio de Elementos - State management, caching, computed signals |

#### Detalles de los Comentarios Agregados

**Backend:**
- ✅ `main.ts`: Explicación del bootstrap, configuración CORS, Swagger setup, interceptores y filtros globales

**Frontend - Archivos Principales:**
- ✅ `main.ts`: Inicialización de Angular, bootstrap application
- ✅ `app.ts`: Componente raíz, standalone component, router outlet
- ✅ `app.config.ts`: Providers, PrimeNG theme, HTTP client, APP_INITIALIZER
- ✅ `app.routes.ts`: Rutas públicas, rutas protegidas por rol, lazy loading, redirecciones

**Frontend - Core Services:**
- ✅ `api.ts`: Request genérico para todos los HTTP verbs, response unwrapping, parameter sanitization, logging
- ✅ `auth.service.ts`: Session persistence, timeout detection, reactive signals, setAuth, logout, isAuthenticated
- ✅ `auth.guard.ts`: Route protection, role validation, role-based redirects

**Frontend - Layouts:**
- ✅ `architect-layout.ts`: Sidebar fijo desktop, drawer móvil, menú contextual
- ✅ `worker-layout.ts`: Header con identificación de rol, navegación responsiva

**Frontend - Page Components:**
- ✅ `login.component.ts`: Formulario reactivo, validación, autenticación API, redirección por rol, error handling
- ✅ `construction.ts`: Lista de construcciones, CRUD operations, confirmación de eliminación, notificaciones

**Frontend - Data Services:**
- ✅ `elements.service.ts`: Signals reactivas, computed categories/locations, request caching, loading states

#### Características de los Comentarios

Todos los comentarios siguen este formato profesional:

```typescript
/**
 * Descripción general del archivo/clase
 *
 * Responsabilidades clave:
 * - Punto 1
 * - Punto 2
 * - Punto 3
 *
 * Características:
 * - Característica 1
 * - Característica 2
 */
```

Para métodos:
```typescript
/**
 * Descripción de qué hace el método
 *
 * Proceso/Flujo:
 * 1. Paso 1
 * 2. Paso 2
 * 3. Paso 3
 *
 * @param {Tipo} nombreParam - Descripción del parámetro
 * @returns {TipoRetorno} Descripción del retorno
 * @example
 * // Ejemplo de uso
 * metodo(parametro);
 */
```
