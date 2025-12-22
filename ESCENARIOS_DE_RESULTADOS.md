# Escenarios posibles en la Tarjeta de Resultados (y PDF)

Este documento describe las combinaciones posibles que arroja el motor de análisis (`analysisEngine.js`) y cómo se reflejan en la interfaz.

## 1. Fuera de la CDMX
Se detecta cuando la coordenada no intersecta con el polígono de la Ciudad de México.
- **Estado (`status`):** `OUTSIDE_CDMX`
- **Indicador:** Tarjeta roja de advertencia "Fuera de CDMX" + Aviso Legal.
- **Mapa:** Marcador Rojo con "X".
- **Acciones:** Muestra botones de exportación PDF, compartir y Google Maps (Barra inferior visible en móvil).

## 2. Suelo Urbano (SU)
Ubicación dentro de CDMX pero fuera del polígono de Suelo de Conservación.
- **Estado:** `URBAN_SOIL`
- **Etiqueta:** "Suelo Urbano" (Color Azul).
- **Zonificación:** Oculta (No aplica PGOEDF 2000).
- **Mensaje:** "La regulación corresponde a SEDUVI..."
- **Actividades:** No muestra tabla de actividades.

## 3. Suelo de Conservación (SC) - Jerarquía Estricta

Para cualquier punto dentro de Suelo de Conservación (`CONSERVATION_SOIL`), se aplica la siguiente jerarquía para determinar el campo "Zonificación PGOEDF":

### Caso A: SC + Área Natural Protegida
Si el punto cae dentro de un ANP (independientemente de si hay polígono PGOEDF debajo).
- **Zonificación PGOEDF:** Muestra texto fijo **"ÁREA NATURAL PROTEGIDA"**.
- **Color:** Morado (`#9333ea`).
- **Actividades:** No muestra catálogo (remite al Programa de Manejo).

### Caso B: SC + Hueco (Sin Datos)
Si el punto está en SC pero no intersecta ningún polígono de la capa de Zonificación PGOEDF.
- **Zonificación PGOEDF:** Muestra **"Información no disponible"**.
- **Color:** Gris.
- **Actividades:** No muestra catálogo.

### Caso C: SC + PGOEDF Válido
Si el punto está en SC, NO es ANP, e intersecta un polígono PGOEDF válido.
- **Zonificación PGOEDF:** Muestra la **CLAVE** del polígono (ej. `RE`, `PI`).
- **Color:** Determinado por la clave (ej. Verde para RE, Amarillo para PI).
- **Actividades:** Despliega tabla de Permitidas y Prohibidas basándose en la `CLAVE`.

## 4. Área Natural Protegida - Detalle Secundario

### Zonificación Interna (Tarjeta Adicional)
Si el punto cae dentro de una ANP que cuenta con capa de *zonificación interna*:
1.  **Tarjeta Principal:** Muestra "Zonificación PGOEDF" = "ÁREA NATURAL PROTEGIDA" (Por Caso A).
2.  **Tarjeta Secundaria:** Aparece un nuevo bloque debajo titulado **"Detalle Área Natural Protegida"**.
    -   **Campos:** Nombre, Categoría, Tipo Decreto, Superficie, Fecha.
    -   **PDF:** Se genera una sección adicional con esta misma tabla técnica.

## 5. Sin Datos / Error
- **Estado:** `NO_DATA`
- Ocurre si las capas no cargan o hay un error de conexión crítico.

---

### Resumen de Variables Clave (JSON de Análisis)

```json
{
  "status": "URBAN_SOIL | CONSERVATION_SOIL | OUTSIDE_CDMX",
  "isANP": true/false,
  "zoningKey": "ANP | NODATA | [CLAVE]",
  "zoningName": "ÁREA NATURAL PROTEGIDA | Información no disponible | [CLAVE]",
  "hasInternalAnpZoning": true/false
}
```
