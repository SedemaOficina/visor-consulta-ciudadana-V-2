(function () {
    window.App.Analysis = window.App.Analysis || {};

    const { findFeature } = window.App.Utils;
    // We assume dataCache is passed as argument, avoiding global dependency

    /**
     * Core Analysis Logic
     * @param {Object} c - {lat, lng}
     * @param {Object} dataCache - The globally loaded data object
     */
    const analyzeLocation = async (c, dataCache) => {
        const r = {
            status: 'LOADING',
            isRestricted: false,
            allowedActivities: [],
            prohibitedActivities: [],
            timestamp: new Date().toLocaleString(),
        };
        const r = { ...defaultResult, coordinate: c };

        // ---------------------------------------------------
        // 1. Validar si está fuera de CDMX
        // ---------------------------------------------------
        // Safety check for empty/missing cache
        if (!dataCache) return r;
        if (!dataCache.cdmx) return r;

        if (dataCache.cdmx?.features.length && !findFeature(c, dataCache.cdmx)) {
            r.status = 'OUTSIDE_CDMX';
            if (dataCache.edomex && dataCache.morelos) {
                const inEM = findFeature(c, dataCache.edomex);
                const inMOR = findFeature(c, dataCache.morelos);
                r.outsideContext = inEM ? "Edo. Méx" : inMOR ? "Morelos" : null;
            }
            return r;
        }

        // Alcaldía
        const alc = findFeature(c, dataCache.alcaldias);
        r.alcaldia = alc ? alc.properties.NOMBRE : "CDMX";

        // ---------------------------------------------------
        // 2. Determinar STATUS: URBAN vs CONSERVATION
        // ---------------------------------------------------
        if (!dataCache.sc || !dataCache.sc.features?.length) {
            r.status = 'NO_DATA';
            return r;
        }

        const sc = findFeature(c, dataCache.sc);
        if (!sc) {
            r.status = 'URBAN_SOIL';
            // Nota: Aunque sea urbano, podría caer en ANP (paso 3).
        } else {
            r.status = 'CONSERVATION_SOIL';
            r.isRestricted = true;
        }

        // ---------------------------------------------------
        // 3. Detectar ANP (Cualquier suelo)
        // ---------------------------------------------------
        if (dataCache.anp?.features?.length) {
            const anpFeat = findFeature(c, dataCache.anp);
            if (anpFeat) {
                const p = (anpFeat.properties || {});
                r.isANP = true;
                r.anp = { ...p };

                r.anpId = p.ANP_ID ?? null;
                r.anpNombre = p.NOMBRE ?? null;
                r.anpTipoDecreto = p.TIPO_DECRETO ?? null;
                r.anpCategoria = p.CATEGORIA_PROTECCION ?? null;
                r.anpFechaDecreto = p.FECHA_DECRETO ?? null;
                r.anpSupDecretada = p.SUP_DECRETADA ?? null;
            }
        }

        // ---------------------------------------------------
        // 4. Zonificación PGOEDF (JERARQUÍA ESTRICTA)
        // ---------------------------------------------------
        if (r.status === 'CONSERVATION_SOIL') {
            const z = dataCache.zoning?.features?.length ? findFeature(c, dataCache.zoning) : null;

            // CASO A: Punto dentro de Suelo de Conservación y con ANP encima
            if (r.isANP) {
                r.zoningName = "ÁREA NATURAL PROTEGIDA";
                r.zoningKey = "ANP"; // Clave especial para manejo de actividades
            }
            // CASO C: Punto intersecta un polígono PGOEDF válido
            else if (z) {
                // Usa el campo CLAVE para determinar la zonificación
                let k = (z.properties.CLAVE || '').toString().trim().toUpperCase();

                // Lógica para separar subtipos de PDU (Programas, Poblados, Urbana)
                if (k === 'PDU' || k === 'PROGRAMAS' || k === 'ZONA URBANA') {
                    const desc = (z.properties.PGOEDF || '').toLowerCase();
                    if (desc.includes('parcial')) {
                        k = 'PDU_PP';
                    } else if (desc.includes('poblad') || desc.includes('rural') || desc.includes('habitacional')) {
                        k = 'PDU_PR';
                    } else if (desc.includes('urbana') || desc.includes('urbano') || desc.includes('barrio')) {
                        k = 'PDU_ZU';
                    } else if (desc.includes('equipamiento')) {
                        k = 'PDU_ER';
                    }
                    r.noActivitiesCatalog = true; // No hay catálogo para PDU en CSV
                }

                r.zoningKey = k;
                r.zoningName = z.properties.PGOEDF || r.zoningKey; // El nombre legible viene del campo PGOEDF
            }
            // CASO B: Punto dentro de SC pero en "hueco" (NO intersecta polígono PGOEDF)
            else {
                r.zoningName = "Información no disponible";
                r.zoningKey = "NODATA";
            }

            // ---------------------------------------------------
            // 4.1 Cruzar con CSV de actividades
            // ---------------------------------------------------
            if (dataCache.rules?.length) {
                const all = [];
                const pro = [];
                const zn = (r.zoningName || '').toString().toUpperCase();
                r.isPDU = zn.includes('PDU') || zn.includes('POBLAD'); // Detección legacy por si acaso

                // Si es ANP o NODATA o PDU, no mostrar catálogo
                if (r.zoningKey === 'ANP' || r.zoningKey === 'NODATA' || r.isPDU) {
                    r.noActivitiesCatalog = true;
                } else {
                    // Validar si la columna existe
                    const hasColumn = Object.prototype.hasOwnProperty.call(dataCache.rules[0], r.zoningKey);

                    if (!hasColumn) {
                        r.noActivitiesCatalog = true;
                    } else {
                        dataCache.rules.forEach(row => {
                            const val = (row[r.zoningKey] || '').trim().toUpperCase();
                            if (!val) return;
                            const act = {
                                sector: (row['Sector'] || row['ector'] || '').trim(),
                                general: (row['Actividad general'] || row['Act_general'] || '').trim(),
                                specific: (row['Actividad específica'] || row['Actividad especifica'] || '').trim()
                            };
                            if (val === 'A') all.push(act);
                            else if (val === 'P') pro.push(act);
                        });
                        r.allowedActivities = all;
                        r.prohibitedActivities = pro;
                    }
                }
            }
        } else if (r.status === 'URBAN_SOIL') {
            r.noActivitiesCatalog = true;
            if (r.isANP) {
                // CASO ESPECIAL: ANP en Suelo Urbano (ej. Histórico Coyoacán)
                r.zoningName = "ÁREA NATURAL PROTEGIDA";
                r.zoningKey = "ANP";
            } else {
                r.zoningName = "Suelo Urbano"; // Valor por defecto para SU
            }
        }

        // ---------------------------------------------------
        // 5. Zonificación Interna ANP (Caso Especial)
        // ---------------------------------------------------
        // Si cae dentro de un ANP que cuenta con archivo de zonificación interna
        if (r.isANP && r.anpId && dataCache.anpInternal?.features?.length) {
            const zInt = findFeature(c, dataCache.anpInternal);
            if (zInt) {
                r.anpInternalFeature = zInt;
                r.anpZoningData = { ...zInt.properties };
                r.hasInternalAnpZoning = true;
                // NOTA: No sobrescribimos r.zoningName porque el Caso A ("ÁREA NATURAL PROTEGIDA") tiene prioridad en ese campo.
                // Esta información se mostrará en una tarjeta adicional.
            }
        }

        return r;
    };

    window.App.Analysis.analyzeLocation = analyzeLocation;
})();
