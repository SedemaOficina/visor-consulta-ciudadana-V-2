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
