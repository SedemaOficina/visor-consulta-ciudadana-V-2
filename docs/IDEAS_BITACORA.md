# 📓 Bitácora de Ideas y Futuras Implementaciones

Este documento centraliza las ideas, mejoras y deuda técnica del proyecto.

---

## 🏷️ Simbología
*   🟢 **Fácil**: Implementación rápida (< 2 horas).
*   🟡 **Medio**: Requiere diseño o cambios en varios archivos (2-5 horas).
*   🔴 **Difícil**: Requiere arquitectura nueva o dependencias externas (> 5 horas).
*   🏗️ **Requiere Validación**: Necesita más definición por parte del usuario.

---

## 🚀 Propuestas del Usuario

Aqui se listan las ideas que TÚ has mencionado o sugerido.

### 1. Botón de Búsqueda en Desktop (UI/UX)
*   **Dificultad**: 🟢 **Fácil**
*   **Descripción**: Agregar un botón explícito de "Buscar" junto a la barra de coordenadas en versión Desktop, para no depender solo de la tecla Enter.
*   **Estado**: Pendiente.

### 2. Enlace a Programas de Manejo ANP (PDF)
*   **Dificultad**: 🟢 **Fácil** (Técnicamente) / 🏗️ **Alta** (Dependencia de Archivos)
*   **Descripción**: Incluir enlace clicable en el PDF para ver el Programa de Manejo de la ANP correspondiente.
*   **Bloqueo**: Falta que el usuario proporcione las URLs o archivos PDF oficiales.

### 3. Chat con IA Normativo
*   **Dificultad**: 🔴 **Difícil** (Requiere Backend + OpenAI/Gemini API + Costos)
*   **Descripción**: Chatbot que responda preguntas sobre la ley basándose en documentos PDF.
*   **Estado**: Idea Conceptual (Fuera del alcance actual).

---

## 🤖 Sugerencias Técnicas (Aportes de la IA)

Mejoras que sugiero para elevar la calidad, rendimiento y usabilidad del Visor.

### 1. Historial de Búsquedas Recientes
*   **Dificultad**: 🟢 **Fácil**
*   **Impacto**: Alto (Mejora UX)
*   **Descripción**: Guardar las últimas 5 direcciones/coordenadas consultadas en `localStorage` para que el usuario pueda volver a ellas rápidamente sin re-escribir.

### 2. Aplicación Instalable (PWA)
*   **Dificultad**: 🟡 **Medio**
*   **Impacto**: Muy Alto
*   **Descripción**: Convertir el Visor en una Progressive Web App. Permitiría a los ciudadanos "instalar" la app en su celular (Android/iOS) y acceder a ella desde un icono en el inicio, incluso con funcionalidades offline básicas (cache).

### 3. Modo Oscuro Automático
*   **Dificultad**: 🟡 **Medio**
*   **Impacto**: Medio (Estética/Accesibilidad)
*   **Descripción**: Detectar si el dispositivo del usuario está en modo oscuro y ajustar los colores de la interfaz (mapa oscuro, tarjetas oscuras) automáticamente.

### 4. Filtros de Capas por Alcaldía
*   **Dificultad**: 🔴 **Difícil** (Requiere PostGIS o Turf.js pesado)
*   **Impacto**: Alto
*   **Descripción**: Que al seleccionar una Alcaldía, se "apague" visualmente todo lo que está fuera de ella, para limpiar el mapa. Requiere operaciones geométricas complejas en el cliente.

### 5. Botón "Compartir Ubicación" (Share URL)
*   **Dificultad**: 🟡 **Medio**
*   **Impacto**: Alto (Viralidad)
*   **Descripción**: Generar una URL única (ej. `?lat=19.4&lng=-99.1`) que al abrirla cargue el visor directamente en ese punto y con el análisis abierto. Ideal para que vecinos se pasen la info por WhatsApp.

### 6. Herramienta de Medición (Regla)
*   **Dificultad**: 🟡 **Medio**
*   **Impacto**: Medio (Utilidad Técnica)
*   **Descripción**: Un botón para medir distancias lineales (ej. "A cuántos metros estoy de la barranca"). Mapbox tiene plugins para esto (`mapbox-gl-draw` o similar), pero hay que integrarlo con cuidado en la UI móvil.

### 7. Tutorial Guiado (Onboarding)
*   **Dificultad**: 🟢 **Fácil** / 🟡 **Medio** (Depende de la librería)
*   **Impacto**: Alto (Reducción de soporte)
*   **Descripción**: Cuando un usuario entra por primera vez, mostrar 3 pasos flotantes: "1. Busca aquí", "2. Toca el mapa", "3. Descarga tu ficha PDF". Se puede usar `driver.js`.

### 8. Reporte de Errores en Datos
*   **Dificultad**: 🟢 **Fácil** (Link a Google Forms) / 🔴 **Difícil** (Formulario integrado)
*   **Impacto**: Medio (Calidad de datos)
*   **Descripción**: Si un vecino ve que su calle está mal zonificada, un botón discretito "¿Ves un error?" que abra un Google Form prellenado con la coordenada. Es la forma más barata de limpiar tus datos.

---

## 🛠️ Deuda Técnica y Mantenimiento

Cosas que "funcionan" pero podrían estar mejor estructuradas.

### Validación de Dirección en PDF
*   **Dificultad**: 🟡 **Medio**
*   **Descripción**: Asegurar que la dirección escrita por el usuario se pase fielmente al PDF. Actualmente a veces se pierde si el usuario navega por el mapa después de buscar.

### Simbología Incrustada en Mapa PDF
*   **Dificultad**: 🔴 **Difícil**
*   **Descripción**: Generar una leyenda dinámica DENTRO de la imagen del mapa en el PDF. Es complejo porque `html2canvas` o la API de impresión de mapas no renderizan controles HTML superpuestos fácilmente.

---

## ✅ Implementado / Resuelto

*   **Resumen Ciudadano (Versión Normativa)**: Se implementó una versión basada en reglas (sin AI costosa) que traduce las claves (RE, FC) a explicaciones claras.

---

## 🎨 Experiencia de Usuario y Diseño Visual (Naturalidad y Fluidez)

Ideas enfocadas en mejorar la *comodidad* visual, la *naturalidad* de uso y la percepción de calidad gráfica.

### 1. Sistema de "Glassmorphism" y Capas Visuales
*   **Dificultad**: 🟡 **Medio**
*   **Impacto**: Muy Alto (Modernidad)
*   **Descripción**: Actualizar los paneles sólidos (blancos) por superficies semitransparentes con desenfoque (`backdrop-filter: blur(12px)`). Esto da contexto visual manteniendo la legibilidad, haciendo que la interfaz se sienta "flotando" sobre el mapa de forma natural.

### 2. Transiciones Orgánicas (Motion Design)
*   **Dificultad**: 🟡 **Medio**
*   **Impacto**: Alto (Fluidez)
*   **Descripción**: Suavizar todas las interacciones. Que los modales no "aparezcan" de golpe, sino que surjan (slide-up) con curvas de animación naturales (spring physics). Que los botones tengan efectos de "prensa" al tocarlos.

### 3. Micro-interacciones de Retroalimentación
*   **Dificultad**: 🟢 **Fácil**
*   **Impacto**: Medio (Satisfacción)
*   **Descripción**: Pequeños detalles que dan vida. Un "pulso" sutil en el punto seleccionado en el mapa. Un check animado al copiar un enlace. Hacen que el sistema se sienta vivo y responsivo.

### 4. Lenguaje "Humano" en Interfaz
*   **Dificultad**: 🟢 **Fácil**
*   **Impacto**: Alto (Cercanía)
*   **Descripción**: Revisar todos los textos de error ("Error 404", "No Data") y cambiarlos por frases amables ("No encontramos información de este punto, ¿quizás está muy cerca del borde?"). Eliminar tecnicismos innecesarios en la vista principal.

### 5. Paleta de Colores Inspirada en Naturaleza
*   **Dificultad**: 🟡 **Medio** (Requiere Diseño)
*   **Impacto**: Medio (Identidad)
*   **Descripción**: Ajustar los tonos institucionales duros (guinda/oro) con matices más suaves para fondos y acentos, reduciendo la fatiga visual. Usar degradados sutiles que evoquen el entorno (Suelo de Conservación) sin perder la identidad oficial.
