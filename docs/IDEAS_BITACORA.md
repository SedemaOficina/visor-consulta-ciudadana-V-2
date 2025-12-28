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
    *   � **Tutorial Guiado (Walkthrough)**: Al abrir por primera vez, mostrar 3 globos flotantes: "1. Busca", "2. Analiza", "3. Descarga". Reduciría dudas iniciales.
*   Navegación Desktop
    *   🟢 **Botón "Buscar" Explícito**: Añadir icono de lupa clicable junto a la barra de coordenadas para no depender solo del "Enter".
*   Accesibilidad
    *   🟢 **Búsqueda por Voz**: Icono de micrófono en el buscador móvil para dictar direcciones (Web Speech API).
    *   � **Modo Oscuro Automático**: Detectar preferencia del sistema y ajustar el mapa a "Dark Matter" y tarjetas oscuras.
*   Estética "Premium"
    *   🟡 **Dashboard de "KPIs"**: Rediseñar la sección de datos para que los metros cuadrados y usos clave se vean como indicadores financieros grandes, no solo texto.
    *   🟢 **Sello de Verificación Animado**: Animación sutil de "Sellado" al completar un análisis para dar certeza psicológica.

## 📄 2. Generación de Reportes (PDF)
Mejoras en la ficha descargable que se entrega al ciudadano.

*   Contenido
    *   🟢 **Enlace Directo a Programas de Manejo**: Si es ANP, que el PDF incluya un link clicable al documento oficial del Programa de Manejo específico.
    *   🔴 **Leyenda Incrustada en Mapa**: Generar visualmente la simbología DENTRO de la imagen del mapa capturado (complejo por limitantes de html2canvas).
*   Seguridad y Validación
    *   🟡 **Código QR de Autenticidad**: Que el QR generado apunte a una URL de validación única con los parámetros encriptados o firmados (simulado).
    *   🟢 **Marca de Agua Digital**: Añadir marca de agua sutil de "Documento Informativo - Sin Validez Legal" en el fondo de la página.

## �️ 3. Herramientas del Mapa
Funcionalidades geoespaciales para interacción avanzada.

*   Interacción
    *   🟡 **Herramienta de Medición (Regla)**: Botón para trazar líneas y medir distancia (ej. "Distancia a la barranca").
    *   MEDIO **Filtro de "Solo mi Alcaldía"**: Al buscar, oscurecer todo el mapa excepto la alcaldía de interés (masking).
*   Capas
    *   🟡 **Visualización 3D**: Activar extrusión de edificios en niveles de zoom alto (requiere vector tiles).

## ⚙️ 4. Lógica de Negocio y Datos
Funcionalidades core del sistema y gestión de información.

*   Retención
    *   FÁCIL **Historial de Búsquedas**: Guardar las últimas 5 consultas en `localStorage` para acceso rápido.
    *   MEDIO **Mis Ubicaciones Favoritas**: Permitir marcar puntos con estrella ("Casa", "Terreno") y guardarlos en el navegador.
*   IA y Soporte
    *   🔴 **Chat Normativo (IA)**: Integración futura con LLM para preguntar "¿Qué puedo construir aquí?" y responder basado en la Ley.

## � 5. Arquitectura y Mantenimiento
Mejoras técnicas invisibles pero críticas.

*   Plataforma
    *   🟡 **PWA (Progressive Web App)**: Permitir "instalar" el visor en iOS/Android para abrirlo sin navegador y con caché offline básico.
*   Calidad de Datos
    *   🟢 **Reporte de Errores Ciudadano**: Botón "¿Dato incorrecto?" que abra un form prellenado para que los usuarios reporten incongruencias en la zonificación.

---

## ✅ Histórico de Implementaciones (Ya Realizado)

### 📌 Fase 1: Consolidación Normativa
*   **[PDF] Nombres de Archivo Inteligentes**: Implementado formato `FICHA_FOLIO_TIPO_UBICACION.pdf` para fácil archivo.
*   **[UI] Badges Descriptivos**: Se reemplazaron las claves crudas (RE, PDU) por nombres completos (Rescate Ecológico, PDU Rural) en toda la interfaz.
*   **[CORE] Resumen Ciudadano**: Lógica determinista para explicar "qué significa" estar en SC o SU sin tecnicismos.
*   **[UI] Diseño Glassmorphism**: Paneles semitransparentes y tipografía oficial (Roboto) implementada.
