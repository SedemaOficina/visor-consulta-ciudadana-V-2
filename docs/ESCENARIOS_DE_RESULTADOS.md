# Documentación del Visor de Consulta Ciudadana (V-2)

Este documento describe la arquitectura lógica, los escenarios de resultados posibles el sistema de diseño implementado en la aplicación.

## 1. Arquitectura y Componentes Clave

### 1.1 Motor de Análisis (`analysisEngine.js`)
Es el corazón de la aplicación. Recibe una coordenada (`lat, lng`) y la base de datos precargada (`dataCache`) para ejecutar la siguiente lógica secuencial:
1.  **Detección Frontera CDMX:** Verifica si el punto está dentro del polígono geoespacial de la Ciudad de México.
2.  **Suelo de Conservación (SC):** Determina si el punto cae dentro de la capa oficial de Suelo de Conservación.
3.  **Áreas Naturales Protegidas (ANP):** Detecta intersecciones con polígonos ANP (federales o locales).
    *   *Nota:* Las ANP tienen prioridad visual sobre cualquier otra zonificación.
4.  **Zonificación PGOEDF:** Si está en SC, identifica la categoría específica (Forestal, Agroecológico, etc.) y recupera las reglas normativas asociadas (actividades permitidas/prohibidas).

### 1.2 Sistema de Constantes (`constants.js`)
*Centralización de la Configuración*
Se ha implementado un objeto global `window.App.Constants` que gestiona:
*   **`COLORS`:** Paleta de colores institucional unificada.
*   **`ZONING_CAT_INFO`:** Definiciones de etiquetas y colores por categoría.
*   **`LAYER_STYLES`:** Estilos visuales para las capas del mapa (Leaflet).
*   **`PROVISIONS_NOTES`:** Notas normativas legales que aparecen al pie de los resultados.

---

## 2. Escenarios de Resultados

### Escenario A: Fuera de la CDMX
*   **Condición:** Coordenada fuera del límite político-administrativo.
*   **Resultado Visual:** Tarjeta de advertencia roja.
*   **Acciones:** Bloqueo de análisis normativo. Solo permite ver ubicación en mapa.

### Escenario B: Suelo Urbano (Sin ANP)
*   **Condición:** Dentro de CDMX pero fuera de Suelo de Conservación.
*   **Resultado Visual:** Etiqueta azul "SUELO URBANO".
*   **Mensaje:** Informa que la regulación corresponde a SEDUVI y no muestra tabla de actividades rurales.

### Escenario C: Área Natural Protegida (ANP)
*   **Condición:** Intersección con capa ANP (ya sea en Suelo Urbano o Conservación).
*   **Prioridad:** ALTA. Sobrescribe la visualización de zonificación base.
*   **Visualización:**
    *   **Color:** Morado Institucional (`#9333ea`).
    *   **Ficha Técnica:** Muestra tarjeta con Nombre, Categoría, Decreto y Superficie (si los datos internos existen).
    *   **Actividades:** No muestra tablas de PGOEDF automáticamente.

### Escenario D: Suelo de Conservación (Zonificado)
*   **Condición:** Dentro de SC y con zonificación PGOEDF válida (ej. Forestal, Agroecológico).
*   **Visualización:**
    *   **Cabecera:** Muestra la categoría (ej. "Forestal de Conservación").
    *   **Tablas:** Despliega pestañas interactivas de **"Actividades Prohibidas"** (Rojo) y **"Permitidas"** (Verde).
    *   **Notas:** Sección colapsable con fundamentos legales.

### Escenario E: Programas Parciales y Poblados (PDU)
*   **Condición:** Zonificación marcada como "PDU", "Poblado Rural" o "Programa Parcial".
*   **Visualización:**
    *   **Alerta:** Muestra aviso de "Consulta Específica Requerida".
    *   **Tablas:** Ocultas. Se debe consultar el instrumento específico del poblado.
    *   **Colores:** Distintivos (Naranja PDU, Café Rural, Gris Urbano).

---

## 3. Paleta de Colores Institucional

Se ha rediseñado la paleta para reducir el ruido visual y garantizar accesibilidad.

### Colores Base
*   **Primario (Guinda):** `#9d2148` (Botones, encabezados principales).
*   **Secundario (Dorado):** `#BC955C` (Acentos institucionales).
*   **Texto Principal:** `#111827` (Gris casi negro).
*   **Fondos:** `#f3f4f6` (Gris claro para reducir fatiga visual).

### Colores Semánticos (Zonificación)
*   **Forestal (Naturaleza):** Gama de Verdes y Turquesas (`#15803d`, `#0e7490`).
*   **Agroecológico (Producción):** Gama de Amarillos y Limas (`#fbbf24`, `#65a30d`).
*   **Estructural (PDU/Urbano):** Gama de Morados, Azules y Grises (`#c084fc`, `#94a3b8`).
*   **Alertas:**
    *   **Error:** `#b91c1c` (Rojo oscuro).
    *   **Éxito:** `#15803d` (Verde bosque).
    *   **Info:** `#1d4ed8` (Azul rey).

---

## 4. Solución de Problemas (Troubleshooting)

### Error: "Pantalla Blanca" o Crash al hacer clic
**Causa:** El navegador tiene en caché una versión antigua de `app.js` o `constants.js`.
**Solución:** Realizar una **Recarga Forzada** (Hard Reload):
*   Windows/Linux: `Ctrl` + `F5` o `Ctrl` + `Shift` + `R`.
*   Mac: `Cmd` + `Shift` + `R`.
*   *Verificación:* Abrir consola (F12) y buscar el mensaje `APP VERSION: DEBUG 2.2`.

### Error: "Cannot read properties of undefined (reading 'PROVISIONS_NOTES')"
**Causa:** Inconsistencia en la carga de constantes (frecuente tras actualizaciones).
**Estado:** **Corregido** en la versión 2.2 con validaciones de seguridad (null-checks) en `ResultsContent.js` y `analysisEngine.js`.

### Error: Datos de PDF incompletos o Mapa en Blanco
**Causa:** Fallo en la generación de imagen del mapa (leaflet-image) por timeouts o carga de tiles.
**Estado:** **Corregido** (v2.3). Se implementó estrategia híbrida:
1.  **Mapbox Static API (Prioridad):** Genera una imagen de alta resolución desde el servidor.
2.  **Fallback Robusto:** Si falla Static, usa renderizado local con protección contra crashes.
3.  **Diseño:** Se actualizó el formato a estilo "Oficio" institucional.
