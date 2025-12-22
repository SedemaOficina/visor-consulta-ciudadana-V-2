# Escenarios posibles en la Tarjeta de Resultados (y PDF)

Este documento describe las combinaciones posibles que arroja el motor de análisis (`analysisEngine.js`) y cómo se reflejan en la interfaz.

## 1. Fuera de la CDMX
Se detecta cuando la coordenada no intersecta con el polígono de la Ciudad de México.
- **Estado (`status`):** `OUTSIDE_CDMX`
- **Indicador:** Mensaje de error o advertencia "Ubicación fuera de la CDMX".
- **Contexto extra:** Puede indicar si cae en "Edo. Méx" o "Morelos" si las capas están disponibles.
- **Acciones:** No muestra zonificación ni actividades. Oculta el botón de exportación PDF y Google Maps.

## 2. Suelo Urbano (SU)
Ubicación dentro de CDMX pero fuera del polígono de Suelo de Conservación.
- **Estado:** `URBAN_SOIL`
- **Etiqueta:** "Suelo Urbano" (Color Azul).
- **Zonificación:** No aplica PGOEDF 2000.
- **Mensaje:** "La regulación corresponde a SEDUVI (Programas de Desarrollo Urbano)."
- **Actividades:** No muestra tabla de permitidas/prohibidas.

## 3. Suelo de Conservación (SC) - Estándar
Ubicación dentro de Suelo de Conservación y con zonificación PGOEDF identificada.
- **Estado:** `CONSERVATION_SOIL`
- **ANP:** `false`
- **Etiqueta:** "Suelo de Conservación" (Color Verde).
- **Zonificación PGOEDF:** Muestra Clave (ej. `RE`) y Nombre (ej. `Rescate Ecológico`).
- **Actividades:** Despliega tabla de Actividades Permitidas y Prohibidas (basado en catálogo CSV).

## 4. Suelo de Conservación (SC) - PDU / Poblado Rural
Ubicación en SC, pero la zonificación detectada corresponde a un Poblado Rural o PDU (Plan de Desarrollo Urbano específico).
- **Estado:** `CONSERVATION_SOIL`
- **Zonificación:** Detecta nombre con "PDU" o "POBLAD".
- **Comportamiento:**
    - **No muestra actividades:** Se activa la bandera `noActivitiesCatalog`.
    - **Mensaje:** Indica que se debe consultar el instrumento específico del poblado.

## 5. Área Natural Protegida (ANP) - Genérica
Ubicación que intersecta con una capa de ANP (Overlay).
- **Bandera `isANP`:** `true`
- **Etiqueta:** "Área Natural Protegida" (Color Morado).
- **Datos ANP:** Muestra Nombre, Categoría, Decreto.
- **Zonificación PGOEDF:**
    - En la interfaz web: Puede mostrarse como dato secundario.
    - En el PDF: Se prioriza el badge de "Suelo de Conservación" o "Suelo Urbano" según corresponda. La información de ANP se muestra en bloques separados.
- **Actividades:**
    - Se oculta el catálogo estándar del PGOEDF (`noActivitiesCatalog` implícito visualmente o forzado), ya que rige el Programa de Manejo de la ANP.
    - Muestra mensaje: "Consulte el Programa de Manejo correspondiente".

## 6. Área Natural Protegida (ANP) - Con Zonificación Interna
Caso avanzado donde se cuenta con la capa de *zonificación interna* (sub-zonas) de la ANP.
- **Bandera `hasInternalAnpZoning`:** `true`
- **Etiqueta:** "Área Natural Protegida" + Nombre de la Zona Interna (ej. "Zona de Uso Público").
- **Detalle:** Muestra el nombre específico de la sub-zona en lugar de solo el nombre de la ANP general.
- **Actividades:** Sigue remitiendo al Programa de Manejo (no muestra tabla CSV genérica).

## 7. Sin Datos / Error
- **Estado:** `NO_DATA`
- Ocurre si las capas no cargan o hay un error de conexión al consultar.

---

> **Nota:** Se ha eliminado la visualización de coordenadas y el botón de copiado de todas las tarjetas para limpiar la interfaz.

### Resumen de Variables Clave (JSON de Análisis)

```json
{
  "status": "URBAN_SOIL | CONSERVATION_SOIL | OUTSIDE_CDMX",
  "isANP": true/false,
  "zoningKey": "RE | PE | ...",
  "isPDU": true/false,
  "noActivitiesCatalog": true/false,
  "hasInternalAnpZoning": true/false
}
```
