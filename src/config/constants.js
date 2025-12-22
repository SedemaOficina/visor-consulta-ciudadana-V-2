// Inicializar namespace
window.App = window.App || {};

window.App.Constants.COLORS = {
    primary: '#9d2148',   // Institutional Guinda
    secondary: '#BC955C', // Institutional Dorado
    success: '#15803d',   // Green 700 (Accessible on light bg)
    warning: '#b45309',   // Amber 700
    error: '#b91c1c',     // Red 700
    info: '#1d4ed8',      // Blue 700

    // Domain colors
    sc: '#3B7D23',     // Suelo Conservación Standard
    su: '#2563EB',     // Suelo Urbano Blue
    anp: '#9333ea',    // ANP Purple

    // Neutrals
    text: '#111827',      // Gray 900
    subtext: '#4b5563',   // Gray 600
    border: '#d1d5db',    // Gray 300
    bg: '#f3f4f6',        // Gray 100
    white: '#ffffff'
};


window.App.Constants.ZONING_CAT_INFO = {
    // Forestal (Verdes y Turquesas - Peso Visual Bajo)
    FC: { color: '#15803d', label: 'Forestal Conservación (FC)' },      // Green 700
    FCE: { color: '#4ade80', label: 'Forestal Conservación Esp. (FCE)' }, // Green 400
    FP: { color: '#0e7490', label: 'Forestal Protección (FP)' },        // Cyan 700
    FPE: { color: '#22d3ee', label: 'Forestal Protección Esp. (FPE)' }, // Cyan 400

    // Agro y Mixto (Amarillos y Limas - Tierra/Vegetación)
    AE: { color: '#fbbf24', label: 'Agroecológico (AE)' },              // Amber 400
    AEE: { color: '#fcd34d', label: 'Agroecológico Especial (AEE)' },   // Amber 300
    AF: { color: '#65a30d', label: 'Agroforestal (AF)' },               // Lime 600
    AFE: { color: '#a3e635', label: 'Agroforestal Especial (AFE)' },    // Lime 400

    // Restauración (Tierras)
    RE: { color: '#a16207', label: 'Rescate Ecológico (RE)' },          // Yellow 800

    // PDU y Otros (Estructurales - Colores Distintivos)
    PDU_PP: { color: '#c084fc', label: 'Programas Parciales (PP)' },    // Purple 400
    PDU_PR: { color: '#d97706', label: 'Poblados Rurales (PR)' },       // Amber 600
    PDU_ZU: { color: '#94a3b8', label: 'Zona Urbana (ZU)' },            // Slate 400
    PDU_ER: { color: '#3b82f6', label: 'Equipamiento Rural (ER)' },     // Blue 500

    ANP_ZON: { color: '#9333ea', label: 'Zonificación ANP (interna)' }  // Purple 600
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

window.App.Constants.PROVISIONS_NOTES = [
    "Adicionalmente a lo dispuesto en la tabla de usos del suelo, para cualquier obra o actividad que se pretenda desarrollar se deberán contemplar los criterios y lineamientos señalados en el programa de Ordenamiento Ecológico, así como cumplir con los permisos y autorizaciones en materia ambiental del Distrito Federal.",
    "Los usos del suelo no identificados en esta tabla deberán cumplir con los permisos y autorizaciones en materia urbana y ambiental aplicables en Suelo de Conservación.",
    "En las Areas Naturales Protegidas ANP regirá la zonificación especificada en su respectivo Programa de Manejo.",
    "La zonificación denominada PDU corresponde a las áreas normadas por los Programas Delegacionales o Parciales de Desarrollo Urbano vigentes.",
    "Las disposiciones de la presente regulación no prejuzgan sobre la propiedad de la tierra.",
    "El Suelo de Conservación definido por las barrancas estará regulado por la zonificación Forestal de Conservación FC, conforme a los límites establecidos por la Norma de Ordenación N° 21, señalada en los Programas de Desarrollo Urbano.",
    "* Se instrumentará un programa de reconversión de esta actividad por la producción de composta. Para ello, se elaborará un padrón de los productores y diseñar y ejecutar un programa de capacitación y proponer paquetes tecnológicos para transferencia y el desarrollo de estudios de mercado para la sustitución progresiva del producto y la reducción de la extracción directa."
];

window.App.Constants.MAPBOX_TOKEN = 'pk.eyJ1Ijoiam9yZ2VsaWJlcjI4IiwiYSI6ImNtajA0eHR2eTA0b2gzZnB0NnU2a2xwY2oifQ.2BDJUISBBvrm1wM8RwXusg';

window.App.Constants.INITIAL_CENTER = [19.34, -99.145]; // Centro CDMX aprox
window.App.Constants.INITIAL_ZOOM = 10;
window.App.Constants.FOCUS_ZOOM = 16;
