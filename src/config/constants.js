// Inicializar namespace
window.App = window.App || {};
window.App.Constants = {};

window.App.Constants.ZONING_CAT_INFO = {
    AEE: { color: '#FF5F5F', label: 'Agroecológico Especial (AEE)' },
    AE: { color: '#FFB55A', label: 'Agroecológico (AE)' },
    AFE: { color: '#FFD447', label: 'Agroforestal Especial (AFE)' },
    AF: { color: '#7BE495', label: 'Agroforestal (AF)' },
    FPE: { color: '#5AD2FF', label: 'Forestal Protección Esp. (FPE)' },
    FP: { color: '#7FA6FF', label: 'Forestal Protección (FP)' },
    FCE: { color: '#C77DFF', label: 'Forestal Conservación Esp. (FCE)' },
    FC: { color: '#FF85D6', label: 'Forestal Conservación (FC)' },
    RE: { color: '#166534', label: 'Rescate Ecológico (RE)' },
    // Removed non-existent categories: PE, PRA, ERA, E
    PDU_PP: { color: '#fb923c', label: 'Programas Parciales (PP)' },
    PDU_PR: { color: '#8d6e63', label: 'Poblados Rurales (PR)' },
    PDU_ZU: { color: '#64748b', label: 'Zona Urbana (ZU)' },
    PDU_ER: { color: '#dc2626', label: 'Equipamiento Rural (ER)' },
    ANP_ZON: { color: '#8b5cf6', label: 'Zonificación ANP (interna)' }
};

window.App.Constants.ZONING_ORDER = [
    'FC', 'FCE', 'FP', 'FPE', 'AF', 'AFE', 'AE', 'AEE',
    'PDU_PP', 'PDU_PR', 'PDU_ZU', 'PDU_ER'
];

window.App.Constants.LAYER_STYLES = {
    sc: {
        color: '#3B7D23',
        fill: '#3B7D23',
        label: 'Suelo de Conservación'
    },
    anp: {
        color: '#a855f7',
        fill: '#a855f7',
        label: 'Áreas Naturales Protegidas'
    },
    alcaldias: { color: '#FFFFFF', border: '#555', label: 'Límite Alcaldías' }, // W: 2 (Hierarchy)
    edomex: { color: '#FFD86B', label: 'Estado de México' },
    morelos: { color: '#B8A1FF', label: 'Estado de Morelos' }
};

window.App.Constants.DATA_FILES = {
    LIMITES_CDMX: './data/cdmx.geojson',
    LIMITES_ALCALDIAS: './data/alcaldias.geojson',
    LIMITES_EDOMEX: './data/edomex.geojson',
    LIMITES_MORELOS: './data/morelos.geojson',
    SUELO_CONSERVACION: './data/suelo-de-conservacion-2020.geojson',

    // ✅ Zonificación principal (base)
    ZONIFICACION_MAIN: './data/zoonificacion_pgoedf_2000_sin_anp.geojson',

    // ✅ Zonificaciones extra (se agregan encima)
    ZONIFICACION_FILES: [
        './data/Zon_Bosque_de_Tlalpan.geojson',
        './data/Zon_Cerro_de_la_Estrella.geojson',
        './data/Zon_Desierto_de_los_Leones.geojson',
        './data/Zon_Ejidos_de_Xochimilco.geojson',
        './data/Zon_La_Loma.geojson',
        './data/Zon_Sierra_de_Guadalupe.geojson',
        './data/Zon_Sierra_de_Santa_Catarina.geojson'
    ],

    // ✅ TABLA DE USOS
    USOS_SUELO_CSV: './data/tabla_actividades_pgoedf.csv',

    // ✅ ANP (Polígonos generales, no zonificación)
    ANP: './data/anp_consolidada.geojson'
};

window.App.Constants.CONTACT_INFO = {
    phone: '55 5345 8000 ext. 1234',
    hours: 'Lun - Vie, 9:00 - 18:00 hrs'
};

window.App.Constants.FAQ_ITEMS = [
    {
        q: '¿Qué significa Suelo de Conservación?',
        a: 'Es la zona de la CDMX que tiene características ecológicas valiosas y donde aplica el PGOEDF.'
    },
    {
        q: '¿Qué hago si mi predio está en ANP?',
        a: 'Debes consultar el Programa de Manejo específico de esa Área Natural Protegida.'
    },
    {
        q: '¿La consulta tiene validez legal?',
        a: 'No, este visor es solo informativo. Para trámites oficiales, acude a la SEDEMA o SEDUVI según corresponda.'
    }
];

window.App.Constants.MAPBOX_TOKEN = 'pk.eyJ1Ijoiam9yZ2VsaWJlcjI4IiwiYSI6ImNtajA0eHR2eTA0b2gzZnB0NnU2a2xwY2oifQ.2BDJUISBBvrm1wM8RwXusg';

window.App.Constants.INITIAL_CENTER = [19.34, -99.145]; // Centro CDMX aprox
window.App.Constants.INITIAL_ZOOM = 10;
window.App.Constants.FOCUS_ZOOM = 16;
