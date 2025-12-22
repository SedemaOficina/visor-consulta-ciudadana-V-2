# Escenarios posibles en la Tarjeta de Resultados (y PDF)

Este documento describe las combinaciones posibles que arroja el motor de análisis (`analysisEngine.js`) y cómo se reflejan en la interfaz de usuario y en la exportación PDF.

## 1. Fuera de la CDMX
Se detecta cuando la coordenada no intersecta con el polígono de la Ciudad de México.
- **Estado (`status`):** `OUTSIDE_CDMX`
- **Indicador:** Tarjeta roja de advertencia "Fuera de CDMX" + Aviso Legal.
- **Mapa:** Marcador Rojo con "X".
- **Botones:** Muestra Google Maps y Exportar PDF (que generará una ficha de advertencia).

## 2. Suelo Urbano (SU)

### Caso 2.1: Suelo Urbano Estándar
Ubicación dentro de CDMX pero fuera del polígono de Suelo de Conservación y fuera de ANP.
- **Estado:** `URBAN_SOIL`
- **Etiqueta:** "Suelo Urbano" (Color Azul).
- **Zonificación PGOEDF:** Oculta o predeterminada a "Suelo Urbano".
- **Mensaje:** "La regulación corresponde a SEDUVI..."
- **Actividades:** No muestra tabla de actividades.

### Caso 2.2: Suelo Urbano con ANP (Nuevo)
Ubicación clasificada como Urbano pero que intersecta un polígono de Área Natural Protegida (ej. Histórico de Coyoacán, Bosque de Chapultepec).
- **Estado:** `URBAN_SOIL` + `isANP: true`
- **Etiqueta:** "ÁREA NATURAL PROTEGIDA" (Color Morado).
- **Zonificación Key:** `ANP`.
- **Comportamiento:** Se prioriza la visualización de ANP sobre la de Suelo Urbano. Muestra tarjeta de detalle ANP.

## 3. Suelo de Conservación (SC) - Jerarquía Estricta

Para cualquier punto dentro de Suelo de Conservación (`CONSERVATION_SOIL`), se aplica la siguiente jerarquía:

### Caso 3.1: SC + Área Natural Protegida
Si el punto cae dentro de un ANP (prioridad máxima).
- **Zonificación Display:** **"ÁREA NATURAL PROTEGIDA"**.
- **Color:** Morado (`#9333ea`).
- **Actividades:** No muestra catálogo.
- **Detalle:** Si existe información interna, muestra tarjeta secundaria "Detalle Área Natural Protegida".

### Caso 3.2: SC + PGOEDF Válido (Tablas Activas)
Si intersecta una zonificación estándar del PGOEDF (ej. Rescate Ecológico, Forestal, Agroforestal).
- **Zonificación Display:** Nombre descriptivo (ej. "Agroforestal (AF)").
- **Color:** Específico de la categoría (Ver `constants.js`).
- **Actividades:** Despliega dos tablas interactivas: **Permitidas** (verde) y **Prohibidas** (rojo).
- **Notas Normativas:** Aparece una sección colapsable al final con las notas legales generales.

### Caso 3.3: SC + Subcategorías PDU (PDU_*)
Si intersecta áreas marcadas originalmente como "PDU" o "Programas Parciales". El sistema sub-clasifica automáticamente:
- **Categorías:**
  - **Programas Parciales (PP):** Color Naranja.
  - **Poblados Rurales (PR):** Color Café.
  - **Zona Urbana (ZU):** Color Gris.
  - **Equipamiento Rural (ER):** Color Rojo.
- **Actividades:** **NO muestra tabla**. En su lugar muestra una caja de advertencia naranja: *"Consulta Específica Requerida - Consulte el Instrumento de Planeación correspondiente"*.
- **Mapa:** Los polígonos se dibujan con sus colores específicos (no gris genérico).

### Caso 3.4: SC + Hueco (Sin Datos)
Si está en SC pero no intersecta ningún polígono PGOEDF conocido.
- **Zonificación Display:** "Información no disponible".
- **Color:** Gris.

---

## 4. Notas Adicionales del Sistema

### PDF Export
El PDF generado respeta fielmente el escenario activo:
- **Si hay tablas:** Las imprime con paginación inteligente.
- **Si es PDU:** Muestra el aviso de consulta requerida y no imprime tablas vacías.
- **Si es ANP:** Incluye la ficha técnica del decreto/superficie.
- **Notas Normativas:** Se incluyen como una sección "5. Notas Normativas..." antes de los enlaces.

### Correcciones Recientes
- **Equipamiento Rural:** Se corrigió la prioridad de filtrado para que no sea ocultado por "Rural" (Poblados).
- **ANP en Urbano:** Se habilitó la detección de ANP incluso fuera de Suelo de Conservación.
- **Crash Pantalla Blanca:** Se corrigió error de sintaxis en `PdfExportController.js`.
