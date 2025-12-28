# 📓 Bitácora de Evolución: Visor Consulta Ciudadana

Este documento clasifica las ideas de mejora, deuda técnica y funcionalidades pendientes por **categoría funcional** para facilitar la planificación del desarrollo.

---

## 🏷️ Prioridad y Esfuerzo
*   🟢 **FÁCIL**: Implementación rápida "Quick Win" (< 2 horas).
*   🟡 **MEDIO**: Requiere lógica nueva o diseño UI (2-5 horas).
*   🔴 **COMPLEJO**: Requiere arquitectura, backend o librerías externas (> 5 horas).

---

## 📂 1. Experiencia de Usuario (UX) e Interfaz Visual (UI)
Mejoras enfocadas en la facilidad de uso, estética y accesibilidad.

*   Onboarding
    *   🟡 **Tutorial Guiado (Walkthrough)**: Al abrir por primera vez, muestra un recorrido por los elementos clave. (Versión básica implementada como modal centralizado).
*   Estética "Premium"
    *   � **Dashboard de "KPIs"**: Rediseñar la sección de datos para que los metros cuadrados y usos clave se vean como indicadores financieros grandes, no solo texto.

## 📄 2. Generación de Reportes (PDF)
Mejoras en la ficha descargable que se entrega al ciudadano.

*   Contenido
    *   🟢 **Enlace Directo a Programas de Manejo**: Si es ANP, que el PDF incluya un link clicable al documento oficial del Programa de Manejo específico.
    *   🔴 **Leyenda Incrustada en Mapa**: Generar visualmente la simbología DENTRO de la imagen del mapa capturado (complejo por limitantes de html2canvas).
*   Seguridad y Validación
    *   🟡 **Código QR de Autenticidad**: Que el QR generado apunte a una URL de validación única con los parámetros encriptados o firmados (simulado).

## 🗺️ 3. Herramientas del Mapa
Funcionalidades geoespaciales para interacción avanzada.

*  
    *   🟢 **Enlace a Street View / Google Earth**: Un botón en la ficha para "Ver en 3D" que abra Google Earth Web en las mismas coordenadas para inspección visual del terreno.
*   Capas
    *   🟡 **Visualización 3D**: Activar extrusión de edificios en niveles de zoom alto (requiere vector tiles).
 

## ⚙️ 4. Lógica de Negocio y Datos
Funcionalidades core del sistema y gestión de información.

*   Retención
    *   MEDIO **Mis Ubicaciones Favoritas**: Permitir marcar puntos con estrella ("Casa", "Terreno") y guardarlos en el navegador (Local Storage avanzado).
*   IA y Soporte
    *   🔴 **Chat Normativo (IA)**: Integración futura con LLM para preguntar "¿Qué puedo construir aquí?" y responder basado en la Ley (Plan de Implementación ya diseñado).
*   Herramientas
    *   🟡 **Calculadora de Potencial Constructivo**: Un "widget" donde el usuario ingrese la superficie del terreno y el sistema calcule automáticamente el Máximo de Construcción permitido (Fórmula: `Superficie * CoeficienteUtilizacion`).

## 🧱 5. Arquitectura y Mantenimiento
Mejoras técnicas invisibles pero críticas.

*   Plataforma
    *   🟡 **PWA (Progressive Web App)**: Permitir "instalar" el visor en iOS/Android para abrirlo sin navegador y con caché offline básico.
    *   🟢 **Modo "Impresión Web"**: Hoja de estilos CSS `@media print` optimizada para que `Ctrl+P` genere una ficha limpia sin necesidad del PDF Generator (como alternativa rápida).
*   Calidad de Datos
    *   🟢 **Reporte de Errores Ciudadano**: Botón "¿Dato incorrecto?" que abra un form prellenado para que los usuarios reporten incongruencias en la zonificación.

---

## ✅ Histórico de Implementaciones (Ya Realizado)

### 📌 Fase 2: Robustez y Usabilidad (Diciembre 2025)
*   **[PDF] Encabezado Unificado Vectorial**: Se eliminó la captura de imagen para la primera página. Ahora todas las páginas usan un encabezado vectorial nítido, resolviendo problemas de calidad y consistencia.
*   **[PDF] Corrección de Layout**: Ajuste de coordenadas para que el número de página no se encime con la línea dorada ni la fecha.
*   **[UX] Buscador Inteligente**:
    *   **Historial de Búsquedas**: Se guarda localmente las últimas consultas.
    *   **Supresión de Ruido**: Si el usuario escribe coordenadas, el buscador ya no estorba con sugerencias irrelevantes.
    *   **Botón de Ayuda**: Tooltip integrado explicando formatos (Dirección, Coordenadas Decimales y DMS).
*   **[UX] Botón Buscar Explícito**: Se añadió botón clicable para usuarios que no usan "Enter".
*   **[CORE] Manejo "Fuera de CDMX"**: Lógica refinada para mostrar explicaciones claras cuando un punto cae en EDOMEX o Morelos, diferenciando estados específicos de genéricos.
*   **[UI] Opacidad de Capas**: Se implementó un slider en el panel de Leyenda para controlar la transparencia de la zonificación sobre el satélite.
*   **[UI] Sello de Verificación**: Ícono animado de "Verificado" al obtener resultados normativos.
*   **[UI] Toggle Sidebar Ajustado**: Se centró verticalmente el botón de colapsar panel para mejorar visibilidad.

### 📌 Fase 1: Consolidación Normativa
*   **[PDF] Nombres de Archivo Inteligentes**: Implementado formato `FICHA_FOLIO_TIPO_UBICACION.pdf` para fácil archivo.
*   **[UI] Badges Descriptivos**: Se reemplazaron las claves crudas (RE, PDU) por nombres completos (Rescate Ecológico, PDU Rural) en toda la interfaz.
*   **[CORE] Resumen Ciudadano**: Lógica determinista para explicar "qué significa" estar en SC o SU sin tecnicismos.
*   **[UI] Diseño Glassmorphism**: Paneles semitransparentes y tipografía oficial (Roboto) implementada.
