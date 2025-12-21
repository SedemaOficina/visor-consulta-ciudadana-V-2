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
            coordinate: c
        };

        // ---------------------------------------------------
        // 1. Validar si está fuera de CDMX
        // ---------------------------------------------------
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
        r.alcaldia = alc ? (alc.properties.NOMBRE || alc.properties.NOMGEO) : "CDMX";

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
        // 4. Zonificación PGOEDF (SOLO si es Suelo de Conservación)
        // ---------------------------------------------------
        if (r.status === 'CONSERVATION_SOIL' && dataCache.zoning?.features?.length) {
            const z = findFeature(c, dataCache.zoning); // PGOEDF

            if (z) {
                r.zoningKey = (z.properties.CLAVE || '').toString().trim().toUpperCase();
                r.zoningName = z.properties.PGOEDF || z.properties.UGA || r.zoningKey;

                // 4.1 Cruzar con CSV de actividades
                if (dataCache.rules?.length) {
                    const all = [];
                    const pro = [];

                    // Filtro especial: PDU o Poblados -> no mostrar catálogo
                    const zn = (r.zoningName || '').toString().toUpperCase();
                    r.isPDU = zn.includes('PDU') || zn.includes('POBLAD');

                    const hasColumn = Object.prototype.hasOwnProperty.call(dataCache.rules[0], r.zoningKey);

                    if (!hasColumn || r.isPDU) {
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
            } else {
                // ✅ Fallback: Si no hay polígono PGOEDF (porque se recortó), pero es ANP:
                if (r.isANP) {
                    r.zoningName = r.anpNombre || "Área Natural Protegida";
                    r.zoningKey = "ANP";
                } else {
                    r.zoningName = "Sin zonificación PGOEDF detectada";
                    r.zoningKey = "SC";
                }
                r.noActivitiesCatalog = true;
            }
        } else if (r.status === 'URBAN_SOIL') {
            // Si es urbano, no aplicamos PGOEDF (catálogo SC)
            r.noActivitiesCatalog = true;
        }

        // ---------------------------------------------------
        // 5. Zonificación Interna ANP (Si aplica)
        // ---------------------------------------------------
        if (r.isANP && r.anpId && dataCache.anpInternal?.features?.length) {
            // Buscar si cae en algún polígono interno
            const zInt = findFeature(c, dataCache.anpInternal);
            if (zInt) {
                // Si encontramos zonificación interna, la guardamos para mostrarla
                r.anpInternalFeature = zInt;
                r.anpZoningData = { ...zInt.properties };
                // Aquí indicamos que EXISTE zonificación específica
                r.hasInternalAnpZoning = true;

                // ✅ OVERWRITE UI fields
                if (zInt.properties?.ZONIFICACION) {
                    r.zoningName = zInt.properties.ZONIFICACION;
                }
            }
        }

        return r;
    };

    window.App.Analysis.analyzeLocation = analyzeLocation;
})();
