(function () {
    const { useState, useEffect } = window.React;

    /* ------------------------------------------------ */
    /* BUNDLED CONFIGURATION (Single Source of Truth) */
    /* ------------------------------------------------ */
    const BUNDLED_CONSTANTS = {
        COLORS: {
            primary: '#9d2148',
            secondary: '#BC955C',
            success: '#15803d',
            warning: '#b45309',
            error: '#b91c1c',
            info: '#1d4ed8',
            sc: '#3B7D23',
            su: '#2563EB',
            anp: '#9333ea',
            text: '#111827',
            subtext: '#4b5563',
            border: '#d1d5db',
            bg: '#f3f4f6',
            white: '#ffffff'
        },
        ZONING_CAT_INFO: {
            FC: { color: '#15803d', label: 'Forestal Conservación' },
            FCE: { color: '#4ade80', label: 'Forestal Conservación Especial' },
            FP: { color: '#0e7490', label: 'Forestal Protección' },
            FPE: { color: '#0284c7', label: 'Forestal Protección Especial' },
            AE: { color: '#fbbf24', label: 'Agroecológico' },
            AEE: { color: '#eab308', label: 'Agroecológico Especial' },
            AF: { color: '#65a30d', label: 'Agroforestal' },
            AFE: { color: '#a3e635', label: 'Agroforestal Especial' },
            PDU_PP: { color: '#e11d48', label: 'Programas Parciales' },
            PDU_PR: { color: '#d97706', label: 'Poblados Rurales' },
            PDU_ZU: { color: '#94a3b8', label: 'Zona Urbana' },
            PDU_ER: { color: '#3b82f6', label: 'Equipamiento Rural' },
            ANP_ZON: { color: '#7e22ce', label: 'Zonificación ANP (interna)' },
            // Missing PGOEDF Categories
            RE: { color: '#10b981', label: 'Rescate Ecológico' },
            PRA: { color: '#f59e0b', label: 'Producción Rural Agroindustrial' },
            PE: { color: '#0ea5e9', label: 'Preservación Ecológica' }
        },
        ZONING_ORDER: [
            'FC', 'FCE', 'FP', 'FPE', 'AF', 'AFE', 'AE', 'AEE',
            'RE', 'PRA', 'PE',
            'PDU_PP', 'PDU_PR', 'PDU_ZU', 'PDU_ER'
        ],
        LAYER_STYLES: {
            sc: { color: '#3B7D23', fill: '#3B7D23', label: 'Suelo de Conservación' },
            anp: { color: '#a855f7', fill: '#a855f7', label: 'Áreas Naturales Protegidas' },
            alcaldias: { color: '#FFFFFF', border: '#555', label: 'Límite Alcaldías' },
            edomex: { color: '#FFD86B', label: 'Estado de México' },
            morelos: { color: '#B8A1FF', label: 'Estado de Morelos' }
        },
        DATA_FILES: {
            LIMITES_CDMX: './data/cdmx.geojson',
            LIMITES_ALCALDIAS: './data/alcaldias.geojson',
            LIMITES_EDOMEX: './data/edomex.geojson',
            LIMITES_MORELOS: './data/morelos.geojson',
            SUELO_CONSERVACION: './data/suelo-de-conservacion-2020.geojson',
            ZONIFICACION_MAIN: './data/zoonificacion_pgoedf_2000_sin_anp.geojson',
            ZONIFICACION_FILES: [
                './data/Zon_Bosque_de_Tlalpan.geojson',
                './data/Zon_Cerro_de_la_Estrella.geojson',
                './data/Zon_Desierto_de_los_Leones.geojson',
                './data/Zon_Ejidos_de_Xochimilco.geojson',
                './data/Zon_La_Loma.geojson',
                './data/Zon_Sierra_de_Guadalupe.geojson',
                './data/Zon_Sierra_de_Santa_Catarina.geojson'
            ],
            USOS_SUELO_CSV: './data/tabla_actividades_pgoedf.csv',
            ANP: './data/anp_consolidada.geojson'
        },
        MAPBOX_TOKEN: 'pk.eyJ1Ijoiam9yZ2VsaWJlcjI4IiwiYSI6ImNtajA0eHR2eTA0b2gzZnB0NnU2a2xwY2oifQ.2BDJUISBBvrm1wM8RwXusg',
        INITIAL_CENTER: [19.34, -99.145],
        INITIAL_ZOOM: 10,
        FOCUS_ZOOM: 16
    };

    // IMMEDIATE GLOBAL ASSIGNMENT
    // Replaces constants.js functionality
    window.App = window.App || {};
    window.App.Constants = BUNDLED_CONSTANTS;
    console.log('✅ Constants initialized from useAppData.js');

    const useAppData = () => {
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);
        const [dataCache, setDataCache] = useState({
            cdmx: null,
            alcaldias: null,
            sc: null,
            edomex: null,
            morelos: null,
            zoning: null,
            anpInternal: null,
            anp: null,
            rules: null
        });

        useEffect(() => {
            const loadData = async () => {
                const { DATA_FILES } = BUNDLED_CONSTANTS;

                const fetchJson = async (u) => {
                    try {
                        if (!u) return { type: "FeatureCollection", features: [] };
                        const res = await fetch(u, { cache: 'no-store' });
                        if (!res.ok) throw new Error(`HTTP ${res.status} ${u}`);
                        return await res.json();
                    } catch (e) {
                        console.warn('Error loading JSON:', u, e);
                        return { type: "FeatureCollection", features: [] };
                    }
                };

                const fetchCsv = async (u) =>
                    new Promise((r) =>
                        window.Papa.parse(u, {
                            download: true,
                            header: true,
                            skipEmptyLines: true,
                            complete: (res) => r(res.data),
                            error: () => r([])
                        })
                    );

                // Helper to merge features
                const mergeFeatures = (list) => {
                    const out = { type: 'FeatureCollection', features: [] };
                    (list || []).forEach(fc => {
                        if (fc?.features?.length) out.features.push(...fc.features);
                    });
                    return out;
                };

                try {
                    const [cdmx, alcaldias, sc, mainZoning, anpInternalList, rules, edomex, morelos, anp] = await Promise.all([
                        fetchJson(DATA_FILES.LIMITES_CDMX),
                        fetchJson(DATA_FILES.LIMITES_ALCALDIAS),
                        fetchJson(DATA_FILES.SUELO_CONSERVACION),
                        fetchJson(DATA_FILES.ZONIFICACION_MAIN),
                        Promise.all((DATA_FILES.ZONIFICACION_FILES || []).map(fetchJson)),
                        fetchCsv(DATA_FILES.USOS_SUELO_CSV),
                        fetchJson(DATA_FILES.LIMITES_EDOMEX),
                        fetchJson(DATA_FILES.LIMITES_MORELOS),
                        fetchJson(DATA_FILES.ANP)
                    ]);

                    setDataCache({
                        cdmx,
                        alcaldias,
                        sc,
                        zoning: mainZoning,
                        anpInternal: mergeFeatures(anpInternalList),
                        rules,
                        edomex,
                        morelos,
                        anp
                    });
                    setLoading(false);
                } catch (err) {
                    console.error("Critical Data Load Error:", err);
                    setError(err.message);
                    setLoading(false);
                }
            };

            loadData();
        }, []);

        return { loading, error, dataCache, constants: BUNDLED_CONSTANTS };
    };

    window.App.Hooks = window.App.Hooks || {};
    window.App.Hooks.useAppData = useAppData;
    console.log('✅ Hook loaded (useAppData.js)');
})();
