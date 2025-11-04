# ObrasApp – Frontend

Interfaz web (Angular 17) para la gestión diaria de obras, depósitos, faltantes y notas. La UI está optimizada para uso **mobile-first** e integra componentes PrimeNG con modo drawer para navegación en pantallas pequeñas.

## Requisitos

- Node.js 20+
- npm 10+

## Instalación y ejecución

```bash
npm install
npm run start
```

El frontend queda disponible en <http://localhost:4200/>. El proyecto asume un backend Nest escuchando en `http://localhost:3000` (configurable en `src/environment/environment.ts`).

### Scripts disponibles

- `npm run start`: modo desarrollo con recarga en caliente.
- `npm run build`: genera la salida productiva en `dist/`.
- `npm run lint`: valida estilo con ESLint.

## Funcionalidades destacadas

- **Gestión de elementos** con filtros por categoría y ubicación, edición inline y notas asociadas.
- **Ubicaciones reales**: las listas de obras y depósitos provienen del backend y se muestran con nombres legibles tanto en filtros como en formularios.
- **Notas enriquecidas** con editor WYSIWYG, sanitización en la vista y navegación de retorno al origen.
- **Historial de eventos** con filtros combinables (tabla, acción, usuario), selector de rango de fechas y vista detalle.
- **Layout responsive** para arquitectos y obreros, con drawers y tablas que se apilan automáticamente en móviles.

## Cambios recientes

- Normalización de datos de elementos para respetar `currentLocationType/currentLocationId` retornados por la API.
- Formulario de altas/ediciones reorganizado: ahora muestra todas las obras/de depósitos disponibles y preserva los filtros tras crear/editar.
- Historial de eventos actualizado con filtros independientes, ordenamiento descendente y soporte para datos JSON nativos.
- Diálogo de notas actualizado a `elementId`, alineado con la API y con retorno consistente (`returnUrl`).

## Buenas prácticas

- Mantener el `AuthService` sincronizado luego de iniciar sesión para que los layouts carguen menús y faltantes automáticamente.
- El módulo `ElementsService` centraliza los refrescos tras cada CRUD; reutilízalo antes de implementar nuevas llamadas directas al API.
- Para nuevos componentes recuerda agregar los módulos PrimeNG correspondientes en su declaración standalone.
