# Visor de Consulta Ciudadana (V-2)

Aplicación web para la consulta de normatividad urbana y ambiental de la Ciudad de México (SEDEMA).

## Arquitectura

Este proyecto utiliza una arquitectura **Frontend sin Build System**, basándose puramente en estándares web (ES6 Modules) e importación de dependencias vía CDN.

### Estructura de Directorios

```
/
├── index.html            # Punto de entrada único. Carga scripts en orden estricto.
├── README.md             # Documentación técnica.
└── src/
    ├── components/       # Componentes React (funcionales y puros).
    ├── hooks/            # Lógica de Estado y Datos (useAppData, useVisorState).
    ├── styles/           # Estilos globales y overrides.
    └── utils/            # Funciones de ayuda (Geo, Date, AnalysisEngine).
```

### Gestión de Dependencias (CDN)

Al no usar `package.json` ni `npm install`, las dependencias se gestionan manualmente en `index.html`.

| Librería      | Versión | CDN Utilizado | Propósito |
|Link |---|---|---|
| **React**     | 18.x    | unpkg         | Framework UI |
| **ReactDOM**  | 18.x    | unpkg         | Renderizado DOM |
| **Leaflet**   | 1.9.4   | unpkg         | Mapas Interactivos |
| **Tailwind**  | 3.4.x   | cdn.tailwindcss | Estilos Utility-First |
| **Day.js**    | 1.x     | jsdelivr      | Manejo de fechas |
| **Desmos**    | 1.x     | desmos.com    | Calculadora Gráfica (Embed) |

### Orden de Carga Crítico

El orden de los scripts en `index.html` es vital para el funcionamiento:

1.  **Vendor Scripts:** React, Leaflet, Tailwind.
2.  **Config & Hooks:** `useAppData.js`, `useVisorState.js` (Definen `window.App.Hooks`).
3.  **Utils:** `geoUtils.js`, `dateUtils.js`.
4.  **Components:** Todos los componentes UI (Definen `window.App.Components`).
5.  **App Entry:** `App.js` (Consume todo lo anterior).

## Desarrollo

Para editar el proyecto:

1.  Abrir la carpeta raíz en VS Code.
2.  Usar "Live Server" para servir el `index.html`.
3.  Editar los archivos en `src/`. Los cambios requieren recargar el navegador (no hay Hot Module Replacement).

## Seguridad

- **Tokens:** El token de Mapbox debe estar restringido por dominio desde el dashboard de Mapbox para evitar uso no autorizado.
