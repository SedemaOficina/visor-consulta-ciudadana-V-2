# Documentación de Tarjetas de Resultados

A continuación se describen las combinaciones posibles de tarjetas que se muestran al usuario tras realizar una consulta (`click`, `búsqueda` o `mi ubicación`).

El contenido se renderiza verticalmente en el orden listado para cada caso.

---

## 1. Fuera de CDMX (Sin Contexto)
Se muestra cuando el punto cae fuera del límite político de la Ciudad de México y no intersecta con capas de contexto (Edomex/Morelos).

*   **Aviso:** Tarjeta Roja única ("Fuera de CDMX")
    *   Texto: "Este punto se encuentra en **otro estado**."
*   **Botones:** Google Maps / Exportar PDF
*   **Aviso Legal**

## 2. Fuera de CDMX (Con Contexto)
Se muestra cuando el punto cae en Estado de México o Morelos (si las capas de contexto están cargadas).

*   **Aviso:** Tarjeta Roja única ("Fuera de CDMX")
    *   Texto: "Este punto se encuentra en **Edo. Méx**" (o Morelos).
*   **Botones:** Google Maps / Exportar PDF
*   **Aviso Legal**

---

## 3. Suelo Urbano (Estándar)
Punto dentro de CDMX pero fuera del Suelo de Conservación.

*   **Header:**
    *   Badge Azul: "SUELO URBANO"
*   **Título Principal:** Alcaldía (ej. "Cuauhtémoc")
*   **Aviso PDU:** Tarjeta Azul ("Consulta Específica Requerida")
    *   Texto: "Esta zona se rige por un Programa de Desarrollo Urbano específico..."
*   **Botones:** Google Maps / Exportar PDF
*   **Aviso Legal**

## 4. Suelo Urbano + PDU (Programa Parcial)
Punto en Suelo Urbano que cae dentro de un Programa Parcial (ej. Polanco, Santa Fe).

*   **Header:**
    *   Badge Azul: "SUELO URBANO"
*   **Título Principal:** Alcaldía
*   **Zonificación:**
    *   Color: Variable (Rose/Amber/etc)
    *   Valor: Nombre del Programa (ej. "Programas Parciales")
*   **Aviso PDU:** Tarjeta Azul ("Consulta Específica Requerida")
    *   Texto: "Esta zona se rige por un Programa de Desarrollo Urbano específico..."
*   **Botones:** Google Maps / Exportar PDF
*   **Aviso Legal**

---

## 5. Suelo de Conservación (Zonificado)
El caso principal. Punto en SC con zonificación PGOEDF válida (Forestal, Agroecológica, etc.).

*   **Header:**
    *   Badge Verde: "SUELO DE CONSERVACIÓN"
*   **Título Principal:** Alcaldía (ej. "Tlalpan")
*   **Zonificación:**
    *   Color: Específico (ej. Verde Bosque para FC)
    *   Valor: Nombre Limpio (ej. "Forestal Conservación")
    *   Clave: (ej. "(FC)")
*   **Botones:** Google Maps / Exportar PDF
*   **Acordeón de Actividades:**
    *   Tab: **PROHIBIDAS** (Activado por defecto) -> Lista agrupada por sectores
    *   Tab: **PERMITIDAS** -> Lista agrupada por sectores
    *   **Notas Normativas:** Desplegable con texto legal.
*   **Aviso Legal**

## 6. Suelo de Conservación + ANP (Genérica)
Punto en SC que también cae dentro de un polígono general de ANP.

*   **Header:**
    *   Badge Verde: "SUELO DE CONSERVACIÓN"
    *   *Nota:* No hay badge de ANP en el header, pero el título cambia su contexto.
*   **Aviso ANP:** Tarjeta Morada ("Atención")
    *   Texto: "Este punto se encuentra en un Área Natural Protegida..."
*   **Título Principal:** Alcaldía
*   **Zonificación:**
    *   Color: Morado sólido (si no tiene zonificación PGOEDF específica debajo) o Color PGOEDF si existe.
    *   Valor: "ÁREA NATURAL PROTEGIDA" (si ANP domina) o Nombre PGOEDF.
*   **Tarjeta Datos ANP:** (Bloque Morado)
    *   Icono: `Leaf`
    *   Nombre Oficial
    *   Categoría / Tipo Decreto / Fecha / Superficie
*   **Botones:** Google Maps / Exportar PDF
*   **Acordeón de Actividades:** (Solo si tiene zonificación PGOEDF válida subyacente que permita cruce, ej. FC. Si es solo ANP genérica, no muestra actividades).
*   **Aviso Legal**

---

## 7. ANP con Zonificación Interna (Detallada)
Caso especial donde existe un shapefile específico para la zonificación interna del ANP (ej. Bosque de Tlalpan).

Se suman elementos al "Caso 6":

*   ...(Elementos del Caso 6)...
*   **Tarjeta Datos ANP** (General)
*   **Tarjeta Zonificación Interna ANP:** (Bloque Morado Secundario)
    *   Icono: `Verified`
    *   Título: "Zonificación del Área Natural Protegida"
    *   **Nombre Oficial:** (ej. "Zona de Uso Público")
    *   **Zonificación Programa de Manejo:** (Valor del campo `ZONIFICACION`, ej. "Uso público")
*   **Botones:** Google Maps / Exportar PDF
*   **Aviso Legal**

---

## Resumen de Elementos UI (Orden Estricto)

1.  **Header Container:**
    *   Badge de Suelo (Urbano/Conservación)
2.  **Mensajes de Estado:**
    *   *Warning* de ANP (Morado)
    *   *Warning* de No Data (Amarillo)
3.  **Warning Fuera de CDMX** (Rojo) -> Si aplica, reemplaza al título de Alcaldía.
4.  **Bloque Principal:**
    *   Nombre Alcaldía
    *   Bloque Zonificación (Color + Nombre + Clave)
5.  **Tarjeta Datos ANP (General)** -> Solo si es ANP
6.  **Tarjeta Zonificación Interna ANP** -> Solo si tiene datos internos
7.  **Botones de Acción:** (Google Maps / PDF)
8.  **Aviso PDU** (Azul) -> Solo si es PDU
9.  **Sección de Actividades PGOEDF:** -> Solo si es SC y no está prohibido
    *   Toggle "Ver detalle"
    *   Tabs (Prohibidas/Permitidas)
    *   Listas de actividades
    *   Notas Normativas
10. **Aviso Legal (Footer)**
