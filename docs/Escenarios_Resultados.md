# Escenarios de Resultados de Análisis - Visor Ciudadano

Este documento detalla todos los casos posibles de resultados de análisis que puede arrojar el visor, las condiciones lógicas que los detonan y la información específica que se muestra al usuario (UI) y en el PDF exportado.

## Resumen de Lógica General
El sistema evalúa la ubicación en el siguiente orden jerárquico:
1.  **Ubicación Geográfica**: ¿Está dentro de la CDMX?
2.  **Tipo de Suelo (Suelo de Conservación vs Suelo Urbano)**: ¿Cae en la capa oficial de SC?
3.  **Áreas Naturales Protegidas (ANP)**: ¿Cae sobre un polígono de ANP? (Aplica para ambos suelos).
4.  **Zonificación (PGOEDF/PDU)**: ¿Qué clave de zonificación le aplica?
5.  **Reglas de Uso**: ¿Existen actividades permitidas/prohibidas para esa zonificación?

---

## A. Fuera de la Ciudad de México (OUTSIDE_CDMX)
Este estado se activa cuando la coordenada consultada no intersecta con el polígono límite de la CDMX.

### A.1. Estado de México
*   **Condición**: Fuera de CDMX + Dentro del polígono de "Edomex".
*   **Mensaje UI**: Alerta Roja: "La ubicación consultada se localiza en el **Estado de México**. Las regulaciones de la Ciudad de México no aplican en este territorio..."
*   **Tarjetas Mostradas**: Ninguna.
*   **PDF**: Genera ficha de "Ubicación Externa" (Mapa + Mensaje de error).

### A.2. Morelos
*   **Condición**: Fuera de CDMX + Dentro del polígono de "Morelos".
*   **Mensaje UI**: Alerta Roja: "La ubicación consultada se localiza en el **Estado de Morelos**. Las regulaciones de la Ciudad de México no aplican en este territorio..."
*   **Tarjetas Mostradas**: Ninguna.
*   **PDF**: Genera ficha de "Ubicación Externa".

### A.3. Otro Estado / Desconocido
*   **Condición**: Fuera de CDMX + Fuera de Edomex/Morelos.
*   **Mensaje UI**: Alerta Roja: "La ubicación consultada se localiza en **otro estado**. Las regulaciones de la Ciudad de México no aplican..."
*   **Tarjetas Mostradas**: Ninguna.
*   **PDF**: Genera ficha de "Ubicación Externa".

---

## B. Suelo Urbano (URBAN_SOIL)
Se detona cuando el punto está en CDMX pero **NO** intersecta la capa de Suelo de Conservación.

### B.1. Suelo Urbano Estándar
*   **Condición**: CDMX + No SC + No ANP.
*   **Encabezado (Badges)**:
    *   `SUELO URBANO` (Gris/Azul)
    *   `ALCALDÍA`: Nombre de la alcaldía detectada.
*   **Tarjetas Mostradas**:
    *   **Instrumento Rector**: Muestra "Programa Delegacional de Desarrollo Urbano" (o Parcial). Incluye links a SEDUVI.
*   **Tablas de Actividades**: **NO SE MUESTRAN** (El visor actualmente no carga catálogos extensos de Uso de Suelo Urbano, solo SC).
*   **PDF**: Ficha Estándar Suelo Urbano (Mapa + Datos Básicos + Aviso de consultar SEDUVI).

### B.2. Suelo Urbano dentro de ANP
Se divide en dos casos dependiendo de si el ANP cuenta con datos de zonificación interna cargados.

#### B.2.1. Suelo Urbano dentro de ANP (Estándar)
*   **Condición**: CDMX + No SC + Dentro de Polígono ANP + Sin zonificación interna.
*   **Encabezado**: `SUELO URBANO` + `ANP` (Morado).
*   **Alerta UI**: Alerta Morada "Área Natural Protegida".
*   **Tarjetas Mostradas**:
    *   **Instrumento Rector**: Programa Delegacional/Parcial.
    *   **Tarjeta ANP General**: Nombre, Decreto, Superficie, Categoría.
*   **PDF**: Ficha Híbrida (Info Urbana + Info ANP General).

#### B.2.2. Suelo Urbano dentro de ANP con Zonificación Interna
*   **Condición**: CDMX + No SC + Dentro de Polígono ANP + Con zonificación interna (Ej. Cerro de la Estrella con zonas de uso público definidas).
*   **Encabezado**: `SUELO URBANO` + `ANP` (Morado).
*   **Alerta UI**: Alerta Morada "Área Natural Protegida".
*   **Tarjetas Mostradas**:
    *   **Instrumento Rector**: Programa Delegacional/Parcial.
    *   **Tarjeta ANP General**: Dato global del ANP.
    *   **Tarjeta ANP Interna**: Muestra la zonificación específica (Ej. "Zona de Uso Público").
*   **PDF**: Ficha Híbrida Detallada (Incluye sección de zonificación interna del ANP).

---

## C. Suelo de Conservación (CONSERVATION_SOIL)
Se detona cuando el punto intersecta la capa de Suelo de Conservación. Aquí aplica el **Ordenamiento Ecológico (PGOEDF)**.

### C.1. Suelo de Conservación Zonificado (Estándar)
*   **Condición**: SC + Zonificación Válida (Ej. RE, PI, A) + Reglas encontradas en CSV.
*   **Encabezado**:
    *   `SUELO DE CONSERVACIÓN` (Verde)
    *   `CLAVE ZONIFICACIÓN` (Ej. "RE") con color específico.
*   **Tarjetas Mostradas**:
    *   **Instrumento Rector**: "Ordenamiento Ecológico (PGOEDF)".
    *   **Zonificación PGOEDF**: Muestra el nombre completo y color (Ej. "Rescate Ecológico").
    *   **Catálogo de Actividades**:
        *   Tab "Permitidas": Lista agrupada por sector.
        *   Tab "Prohibidas": Lista agrupada por sector.
    *   **Notas Normativas**: Acordeón desplegable con marco legal.
*   **PDF**: **Ficha Completa**. Incluye tablas desglosadas de actividades permitidas/prohibidas, mapa de ubicación y notas legales.

### C.2. Suelo de Conservación en ANP
*   **Condición**: SC + Dentro de Polígono ANP.
*   **Caso C.2.1: Con Zonificación PGOEDF Subyacente**
    *   Si existe zonificación (Ej. PE) debajo del ANP, se comporta como C.1 pero añade la **Tarjeta ANP General** y la alerta de ANP.
*   **Caso C.2.2: Sin Zonificación (Solo ANP)**
    *   Si la capa de zonificación define el área solo como "ANP" (Clave ANP).
    *   **No muestra catálogo de actividades** del PGOEDF (porque rige el Plan de Manejo del ANP).
    *   Muestra Tarjeta ANP General e Interna (si existe).
    *   **Mensaje**: "Área Natural Protegida — consulte el Programa de Manejo correspondiente."

### C.3. Suelo de Conservación - Programas Parciales (PDU)
*   **Condición**: SC + La zonificación detectada es de tipo PDU (Ej. Poblados Rurales, Programa Parcial).
*   **Clave**: "PDU", "PDU_PR", "PDU_ZU".
*   **Comportamiento Especial**:
    *   **Catálogo de Actividades OCULTO**: El visor no muestra tablas para PDUs dentro de SC porque estas se rigen por documentos PDF específicos y no por la tabla general del PGOEDF.
    *   **Tarjeta Zonificación**: Muestra el nombre del Programa (Ej. "Programa Parcial de San Miguel Topilejo").
*   **PDF**: Ficha informativa indicando que aplica un Programa Parcial, sin tablas de actividades.

### C.4. Suelo de Conservación - Sin Datos (NO_DATA)
*   **Condición**: SC + No se encuentra polígono de zonificación (Hueco en el mapa).
*   **UI**:
    *   Alerta Amarilla: "Sin Información: No se encontraron datos de zonificación".
    *   Encabezado muestra "Suelo de Conservación" pero sin clave.
*   **PDF**: Ficha de error/sin datos.

---

## Resumen de Matriz de Componentes

| Componente UI | A. Fuera CDMX | B. Urbano | C.1 SC Zonif. | C.2 SC ANP | C.3 SC PDU |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Header (Alcaldía/Coords)** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Badge Suelo Base** | ❌ | ✅ (Urbano) | ✅ (SC) | ✅ (SC) | ✅ (SC) |
| **Badge ANP** | ❌ | ⚠️ (Si aplica) | ❌ | ✅ | ⚠️ (Si aplica) |
| **Alerta "Fuera de CDMX"** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Alerta "ANP"** | ❌ | ⚠️ (Si aplica) | ❌ | ✅ | ⚠️ (Si aplica) |
| **Tarjeta Instrumento Rector**| ❌ | ✅ (SEDUVI) | ✅ (PGOEDF) | ✅ (PGOEDF) | ✅ (PGOEDF) |
| **Tarjeta Zonificación** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Tarjeta Detalle ANP** | ❌ | ⚠️ (Si aplica) | ❌ | ✅ | ⚠️ (Si aplica) |
| **Tablas Actividades** | ❌ | ❌ | ✅ | ❌ (Generalmente)| ❌ |
| **Notas Normativas** | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Sello Verificado** | ❌ | ✅ | ✅ | ✅ | ✅ |

### D. Interfaz y Herramientas (Nuevas)
Adicionalmente a los resultados, la interfaz cuenta con:
*   **Sello de Verificación**: Animación "Premium" de validación al cargar datos normativos.
*   **Control de Opacidad**: Slider en Leyendas para ajustar transparencia de zonificación.
*   **Ayuda de Búsqueda**: Tooltip interactivo con ejemplos de formatos (Coords, DMS, Dirección).


---

## Notas Técnicas para PDF

El controlador de PDF (`PdfExportController.js`) utiliza estas mismas banderas (`status`, `isANP`, `zoningKey`, `noActivitiesCatalog`) para decidir qué pintar:

1.  Si `status === 'OUTSIDE_CDMX'`: Renderiza solo mapa y mensaje de error.
2.  Si `status === 'URBAN_SOIL'`: Renderiza layout urbano (sin tablas).
3.  Si `status === 'CONSERVATION_SOIL'`:
    *   Si `noActivitiesCatalog` es true (Casos ANP pura o PDU): Omite la sección de tablas ("Normatividad Aplicable") y expande la sección de datos generales/ANP.
    *   Si hay actividades: Genera páginas adicionales con las tablas de permitidas/prohibidas.
