/* ------------------------------------------------ */
/* 1. CONFIGURACIÓN E IMPORTACIONES */
/* ------------------------------------------------ */
const React = window.React;
const { useState, useEffect, useRef } = React;
const ReactDOM = window.ReactDOM;

const ZONING_CAT_INFO = {
  AEE: { color: '#FF5F5F', label: 'Agroecológico Especial (AEE)' },
  AE: { color: '#FFB55A', label: 'Agroecológico (AE)' },
  AFE: { color: '#FFD447', label: 'Agroforestal Especial (AFE)' },
  AF: { color: '#7BE495', label: 'Agroforestal (AF)' },
  FPE: { color: '#5AD2FF', label: 'Forestal Protección Esp. (FPE)' },
  FP: { color: '#7FA6FF', label: 'Forestal Protección (FP)' },
  FCE: { color: '#C77DFF', label: 'Forestal Conservación Esp. (FCE)' },
  FC: { color: '#FF85D6', label: 'Forestal Conservación (FC)' },
  ANP_ZON: { color: '#8b5cf6', label: 'Zonificación ANP Específica' }
};



const ZONING_ORDER = ['FC', 'FCE', 'FP', 'FPE', 'AF', 'AFE', 'AE', 'AEE', 'ANP_ZON'];

const LAYER_STYLES = {
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
  alcaldias: { color: '#FFFFFF', border: '#555', label: 'Límite Alcaldías' },
  edomex: { color: '#FFD86B', label: 'Estado de México' },
  morelos: { color: '#B8A1FF', label: 'Estado de Morelos' }
};

const DATA_FILES = {
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

  // ✅ CSV real
  USOS_SUELO_CSV: './data/tabla_actividades_pgoedf.csv',

  // ✅ ANP real
  ANP: './data/anp_consolidada.geojson'

};


const MAPBOX_TOKEN = 'pk.eyJ1Ijoiam9yZ2VsaWJlcjI4IiwiYSI6ImNtajA0eHR2eTA0b2gzZnB0NnU2a2xwY2oifQ.2BDJUISBBvrm1wM8RwXusg';

// =====================================================
// ✅ ESTADO EXPORTABLE DEL MAPA (para PDF)
// =====================================================
// Vive fuera de React, pero se sincroniza desde App.
// NO usa window, NO rompe SSR, NO crea dependencias raras.

let EXPORT_STATE = {
  activeBaseLayer: 'SATELLITE',

  visibleMapLayers: {
    sc: true,
    anp: true,
    zoning: true,
    alcaldias: true,
    edomex: true,
    morelos: true,
    selectedAnpZoning: true // ✅ Nueva capa dinámica
  },

  visibleZoningCats: (() => {
    const d = {};
    ZONING_ORDER.forEach(k => (d[k] = true));
    return d;
  })()
};


// ✅ Mapa estático robusto para PDF (NO captura Leaflet)
const getStaticMapUrl = ({ lat, lng, zoom = 14, width = 900, height = 520 }) => {
  const clampedW = Math.min(Math.max(width, 300), 1280);
  const clampedH = Math.min(Math.max(height, 200), 1280);
  const overlay = `pin-s+9d2449(${lng},${lat})`;

  return (
    `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/` +
    `${overlay}/${lng},${lat},${zoom}/${clampedW}x${clampedH}` +
    `?access_token=${MAPBOX_TOKEN}&logo=false&attribution=false`
  );
};

// ✅ Espera a que una imagen cargue (para que html2canvas no capture "en blanco")
const preloadImage = (src) =>
  new Promise((resolve) => {
    if (!src) return resolve(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });



// ✅ Helper para tiles base (Leaflet)
const getBaseLayerUrl = (name) => {
  if (name === 'STREETS') {
    return `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/256/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`;
  }

  if (name === 'SATELLITE') {
    return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/256/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`;
  }

  if (name === 'TOPO') {
    return `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/256/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`;
  }

  // fallback seguro
  return `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/256/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`;
};

const INITIAL_CENTER = [19.3200, -99.1500];
const INITIAL_ZOOM = 10;
const FOCUS_ZOOM = 15; // Zoom al hacer una consulta puntual

const CONTACT_INFO = {
  phone: "55-5345-8000 ext. 1234",
  hours: "Lunes a Viernes de 9:00 a 18:00 hrs"
};

const FAQ_ITEMS = [
  { q: "1. ¿Qué beneficios obtengo?", a: "Conocer la información normativa..." },
  { q: "2. ¿Qué es Zonificación?", a: "Clasificación de áreas..." }
];

/* ------------------------------------------------ */
/* 2. UTILIDADES GEOESPACIALES Y GENERALES */
/* ------------------------------------------------ */

const getZoningColor = (c) => {
  const k = (c || 'DEFAULT').toString().toUpperCase().trim();
  return ZONING_CAT_INFO[k]?.color || '#8c564b';
};

const getZoningStyle = (f) => {
  let c;
  if (f.properties?.CLAVE) {
    c = getZoningColor(f.properties.CLAVE);
  } else if (f.properties?.ZONIFICACION) {
    c = ZONING_CAT_INFO.ANP_ZON?.color || '#8b5cf6';
  } else {
    c = '#8c564b';
  }

  return {
    color: c,
    weight: 1.5,
    dashArray: null, // Unified to solid line
    fillColor: c,
    fillOpacity: 0.5, // Unified opacity
    opacity: 1,
    stroke: true,
    interactive: true
  };
};

const getSectorStyle = (str) => {
  str = (str ?? '').toString(); // ✅ evita TypeError si viene null/undefined
  const styles = [
    { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
    { bg: '#f0fdf4', border: '#22c55e', text: '#15803d' },
    { bg: '#fefce8', border: '#eab308', text: '#a16207' },
    { bg: '#fff1f2', border: '#f43f5e', text: '#be123c' },
    { bg: '#fdf4ff', border: '#d946ef', text: '#a21caf' }
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return styles[Math.abs(hash) % styles.length];
};

// ----------------------------------------------------
// Búsqueda en Mapbox (autocompletado de direcciones)
// ----------------------------------------------------
const searchMapboxPlaces = async (query) => {
  const q = query.trim();
  if (!q || q.length < 3) return [];

  if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'TU_MAPBOX_TOKEN_AQUI') {
    console.warn('MAPBOX_TOKEN no configurado');
    return [];
  }

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json` +
    `?autocomplete=true` +
    `&language=es` +
    `&limit=5` +
    `&proximity=-99.1332,19.4326` +
    `&types=address,neighborhood,locality,place` +
    `&bbox=-99.3644,19.0185,-98.9401,19.5926` +
    `&access_token=${MAPBOX_TOKEN}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.features) return [];

    return data.features
      .map(f => {
        const ctx = f.context || [];

        let alcaldia = null;
        let ciudad = null;

        ctx.forEach(c => {
          // En CDMX, la alcaldía/municipio suele venir como locality o place
          if (c.id.startsWith('locality') || c.id.startsWith('place')) {
            alcaldia = c.text;
          } else if (c.id.startsWith('region')) {
            ciudad = c.text;
          }
        });

        // Texto corto para el dropdown: Calle · Alcaldía (o Ciudad)
        const principal = f.text; // nombre corto: calle, colonia, etc.
        const partesSecundarias = [];
        if (alcaldia) partesSecundarias.push(alcaldia);
        else if (ciudad) partesSecundarias.push(ciudad);

        const shortLabel = partesSecundarias.length
          ? `${principal} · ${partesSecundarias.join(' · ')}`
          : principal;

        return {
          id: f.id,
          label: shortLabel,       // lo que verás en la lista
          fullLabel: f.place_name, // texto completo de Mapbox
          lat: f.center[1],
          lng: f.center[0],
          alcaldia,
          ciudad
        };
      })
      .filter(f => {
        const full = f.fullLabel.toLowerCase();
        const alc = (f.alcaldia || '').toLowerCase();
        return (
          full.includes("ciudad de méxico") ||
          full.includes("cdmx") ||
          alc.includes("ciudad de méxico") ||
          alc.includes("cdmx")
        );
      });
  } catch (e) {
    console.error('Error en búsqueda Mapbox', e);
    return [];
  }
};

// ----------------------------------------------------
// Parser de coordenadas: decimal, DMS, Google copy-paste
// (UTM removido por completo)
// ----------------------------------------------------
const parseCoordinateInput = (value) => {
  if (!value) return null;
  let s = value.trim();
  if (!s) return null;

  // Quitar paréntesis envolventes: (19.41, -99.14)
  if (s.startsWith('(') && s.endsWith(')')) {
    s = s.slice(1, -1).trim();
  }

  // ------------ 1) Intento decimal (coma / espacio) ------------
  const tryDecimal = (text) => {
    // ✅ Solo aceptamos decimales PUROS (sin °, N/S/E/W, comillas, etc.)
    const isStrictNumber = (v) => /^[-+]?\d+(\.\d+)?$/.test(v);

    // Si trae símbolos de DMS o hemisferios, NO intentar decimal
    if (/[°'"NnSsEeWw]/.test(text)) return null;

    // Con coma: "19.41, -99.14"
    if (text.includes(',')) {
      const parts = text.split(',').map(p => p.trim());
      if (parts.length === 2 && isStrictNumber(parts[0]) && isStrictNumber(parts[1])) {
        const lat = Number(parts[0]);
        const lng = Number(parts[1]);
        if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
      }
    }

    // Con espacio: "19.41 -99.14"
    const spaceParts = text.trim().split(/\s+/);
    if (spaceParts.length === 2 && isStrictNumber(spaceParts[0]) && isStrictNumber(spaceParts[1])) {
      const lat = Number(spaceParts[0]);
      const lng = Number(spaceParts[1]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
    }

    return null;
  };

  const decimal = tryDecimal(s);
  if (decimal) return decimal;

  // ------------ 2) Intento DMS tipo Google: 19°25'04.3"N 99°08'37.9"W ------------
  const dmsToDecimal = (deg, min, sec, hemi) => {
    let d = parseFloat(deg) + parseFloat(min) / 60 + parseFloat(sec) / 3600;
    hemi = (hemi || '').toUpperCase();
    if (hemi === 'S' || hemi === 'W') d *= -1;
    return d;
  };

  const latMatch = s.match(/(\d+)[°\s]+(\d+)[\'’\s]+(\d+(?:\.\d+)?)[\"\s]*([NnSs])/);
  const lonMatch = s.match(/(\d+)[°\s]+(\d+)[\'’\s]+(\d+(?:\.\d+)?)[\"\s]*([EeWw])/);

  if (latMatch && lonMatch) {
    const lat = dmsToDecimal(latMatch[1], latMatch[2], latMatch[3], latMatch[4]);
    const lng = dmsToDecimal(lonMatch[1], lonMatch[2], lonMatch[3], lonMatch[4]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  // Si nada coincide
  return null;
};

/* ------------------------------------------------ */
/* 3. ICONOS (SVG) */
/* ------------------------------------------------ */

/* 1. PRIMERO defines el componente base */
const IconBase = ({ children, className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {children}
  </svg>
);

/* 2. LUEGO defines el objeto Icons (UNA SOLA VEZ) */
const Icons = {
  Search: (p) => (
    <IconBase {...p}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </IconBase>
  ),
  MapPin: (p) => (
    <IconBase {...p}>
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </IconBase>
  ),
  MapPinned: (p) => (
    <IconBase {...p}>
      <path d="M12 17v5" />
      <path d="M8 21h8" />
      <path d="M17 9a5 5 0 1 0-10 0c0 4 5 8 5 8s5-4 5-8z" />
      <circle cx="12" cy="9" r="1.5" />
    </IconBase>
  ),
  Navigation: (p) => (
    <IconBase {...p}>
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </IconBase>
  ),
  Layers: (p) => (
    <IconBase {...p}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </IconBase>
  ),
  CheckCircle: (p) => (
    <IconBase {...p}>
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </IconBase>
  ),
  AlertCircle: (p) => (
    <IconBase {...p}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </IconBase>
  ),
  XCircle: (p) => (
    <IconBase {...p}>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </IconBase>
  ),
  ChevronDown: (p) => (
    <IconBase {...p}>
      <polyline points="6 9 12 15 18 9" />
    </IconBase>
  ),
  RotateCcw: (p) => (
    <IconBase {...p}>
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
    </IconBase>
  ),
  MapIcon: (p) => (
    <IconBase {...p}>
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </IconBase>
  ),

  Copy: (p) => (
    <IconBase {...p}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </IconBase>
  ),
  Share: (p) => (
    <IconBase {...p}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </IconBase>
  ),
  Loader2: (p) => (
    <IconBase {...p} className={`${p.className || ''} spinner`}> {/* Added spinner class */}
      {/* Lucide Loader2 paths are complex, simpler spinner used in CSS, keeping svg structure valid though */}
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </IconBase>
  ),
  X: (p) => (
    <IconBase {...p}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </IconBase>
  ),
  Pdf: (p) => (
    <IconBase {...p}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
      <line x1="9" y1="18" x2="13" y2="18" />
    </IconBase>
  ),
  Menu: (p) => (
    <IconBase {...p}>
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </IconBase>
  ),
  Verified: (p) => (
    <IconBase {...p}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </IconBase>
  ),
  Clock: (p) => (
    <IconBase {...p}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </IconBase>
  )
};


/* ------------------------------------------------ */
/* 4. LÓGICA GEOESPACIAL (GEOJSON & DATOS) */
/* ------------------------------------------------ */

let dataCache = {
  cdmx: null,
  alcaldias: null,
  sc: null,
  edomex: null,
  morelos: null,
  zoning: null,
  anp: null,
  rules: null
};

const isPointInPolygon = (point, feature) => {
  if (!feature?.geometry?.type || !feature?.geometry?.coordinates) return false;
  const x = point.lng; // GeoJSON: X = longitud
  const y = point.lat; // GeoJSON: Y = latitud

  const { type, coordinates } = feature.geometry;

  const pointInRing = (ring) => {
    let inside = false;

    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0]; // lng
      const yi = ring[i][1]; // lat
      const xj = ring[j][0]; // lng
      const yj = ring[j][1]; // lat

      const intersect =
        yi > y !== yj > y &&
        x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }

    return inside;
  };

  if (type === 'Polygon') {
    // 1) Debe estar dentro del anillo exterior
    if (!pointInRing(coordinates[0])) return false;

    // 2) Si cae dentro de un hueco, entonces NO está dentro
    const holes = coordinates.slice(1);
    if (holes.length && holes.some(h => pointInRing(h))) return false;

    return true;
  }

  if (type === 'MultiPolygon') {
    return coordinates.some(poly => {
      if (!pointInRing(poly[0])) return false;
      const holes = poly.slice(1);
      if (holes.length && holes.some(h => pointInRing(h))) return false;
      return true;
    });
  }

  return false;
};

const findFeature = (p, c) => {
  if (!c?.features) return null;
  // ✅ Reverse loop: prioritize layers on top (last in array)
  for (let i = c.features.length - 1; i >= 0; i--) {
    const f = c.features[i];
    if (isPointInPolygon(p, f)) return f;
  }
  return null;
};

const loadCoreData = async () => {
  const fJ = async (u) => {
    try {
      const res = await fetch(u, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${u}`);
      return await res.json();
    } catch (e) {
      console.warn('No se pudo cargar JSON:', u, e);
      return { type: "FeatureCollection", features: [] };
    }
  };
  const [cdmx, alcaldias, sc] = await Promise.all([
    fJ(DATA_FILES.LIMITES_CDMX),
    fJ(DATA_FILES.LIMITES_ALCALDIAS),
    fJ(DATA_FILES.SUELO_CONSERVACION)
  ]);

  dataCache.cdmx = cdmx;
  dataCache.alcaldias = alcaldias;
  dataCache.sc = sc;

  return true;
};

/* ===== INICIO BLOQUE NUEVO (MERGE + loadExtraData) ===== */

// ✅ Merge: varios GeoJSON → 1 FeatureCollection (en memoria)
const mergeFeatureCollections = (collections) => {
  const out = { type: 'FeatureCollection', features: [] };
  (collections || []).forEach(fc => {
    if (fc?.features?.length) out.features.push(...fc.features);
  });
  return out;
};

const loadExtraData = async () => {
  const fJ = async (u) => {
    try {
      const res = await fetch(u, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${u}`);
      return await res.json();
    } catch (e) {
      console.warn('No se pudo cargar JSON:', u, e);
      return { type: "FeatureCollection", features: [] };
    }
  };

  const fC = async (u) =>
    new Promise((r) =>
      Papa.parse(u, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (res) => r(res.data),
        error: () => r([])
      })
    );

  // ✅ Cargar zonificación MAIN + zonificaciones extra
  const zoningUrls = [
    DATA_FILES.ZONIFICACION_MAIN,
    ...(DATA_FILES.ZONIFICACION_FILES || [])
  ].filter(Boolean);

  const [zoningCollections, rules, edomex, morelos, anp] = await Promise.all([
    Promise.all(zoningUrls.map(fJ)),
    fC(DATA_FILES.USOS_SUELO_CSV),
    fJ(DATA_FILES.LIMITES_EDOMEX),
    fJ(DATA_FILES.LIMITES_MORELOS),
    fJ(DATA_FILES.ANP)
  ]);

  dataCache.zoning = mergeFeatureCollections(zoningCollections);
  dataCache.rules = rules;
  dataCache.edomex = edomex;
  dataCache.morelos = morelos;
  dataCache.anp = anp;

  return true;
};

/* ===== FIN BLOQUE NUEVO (MERGE + loadExtraData) ===== */

const analyzeLocation = async (c) => {
  const r = {
    status: 'LOADING',
    isRestricted: false,
    allowedActivities: [],
    prohibitedActivities: [],
    timestamp: new Date().toLocaleString(),
    coordinate: c
  };

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

  const alc = findFeature(c, dataCache.alcaldias);
  r.alcaldia = alc ? (alc.properties.NOMBRE || alc.properties.NOMGEO) : "CDMX";

  if (!dataCache.sc || !dataCache.sc.features?.length) {
    r.status = 'NO_DATA';
    return r;
  }

  const sc = findFeature(c, dataCache.sc);
  if (!sc) {
    r.status = 'URBAN_SOIL';
    return r;
  }

  r.status = 'CONSERVATION_SOIL';
  r.isRestricted = true;

  // =====================================================
  // ✅ ANP detectada (pero NO bloquea zonificación interna)
  // =====================================================
  if (dataCache.anp?.features?.length) {
    const anpFeat = findFeature(c, dataCache.anp);
    if (anpFeat) {
      const p = (anpFeat.properties || {});

      r.isANP = true;
      r.anp = { ...p };

      // Campos explícitos
      r.anpId = p.ANP_ID ?? null;
      r.anpNombre = p.NOMBRE ?? null;
      r.anpTipoDecreto = p.TIPO_DECRETO ?? null;
      r.anpCategoria = p.CATEGORIA_PROTECCION ?? null;
      r.anpFechaDecreto = p.FECHA_DECRETO ?? null;
      r.anpSupDecretada = p.SUP_DECRETADA ?? null;

      // ✅ Importante:
      // NO hacemos return.
      // Dejamos que se evalúe zonificación (zoning) para que puedas ver la zonificación interna.
      // Si quieres seguir ocultando el catálogo de actividades por estar en ANP:
      r.noActivitiesCatalog = true;
    }
  }


  if (dataCache.zoning?.features?.length) {
    const z = findFeature(c, dataCache.zoning);

    if (z) {
      r.zoningKey = (z.properties.CLAVE || '').toString().trim().toUpperCase();
      r.zoningName = z.properties.PGOEDF || z.properties.UGA || r.zoningKey;

      if (dataCache.rules?.length) {
        const all = [];
        const pro = [];

        // 1) Detectar PDU / Poblados Rurales por nombre
        const zn = (r.zoningName || '').toString().toUpperCase();
        r.isPDU = zn.includes('PDU') || zn.includes('POBLAD');

        // 2) Detectar si el CSV NO trae columna para esa clave
        const hasColumn =
          dataCache.rules.length > 0 &&
          Object.prototype.hasOwnProperty.call(dataCache.rules[0], r.zoningKey);

        if (!hasColumn) {
          r.noActivitiesCatalog = true;
        } else if (dataCache.rules[0] && r.zoningKey in dataCache.rules[0]) {
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
      r.zoningName = "Sin zonificación específica";
      r.zoningKey = "SC";
      r.noActivitiesCatalog = true;
    }
  } else {
    r.zoningName = "Cargando detalles...";
    r.noActivitiesCatalog = true;
  }
  return r;
};

/* ------------------------------------------------ */
/* 5. COMPONENTES UI COMPARTIDOS */
/* ------------------------------------------------ */

/* 6.1 Mensajes de estado */

const StatusMessage = ({ analysis }) => {
  const { status, outsideContext, isANP } = analysis;

  // Sólo mostramos mensajes especiales en estos casos

  if (status === 'OUTSIDE_CDMX') return null;

  if (isANP)
    return (
      <div className="p-3 bg-purple-50 text-purple-800 text-xs border-l-4 border-purple-600 rounded-r">
        <strong>Área Natural Protegida:</strong> Consulte el Programa de Manejo correspondiente.
      </div>
    );

  if (status === 'NO_DATA')
    return (
      <div className="p-3 bg-yellow-50 text-yellow-800 text-xs border-l-4 border-yellow-400 rounded-r">
        <strong>Aviso:</strong> No se encontró información disponible para esta zona.
      </div>
    );

  // Para Suelo Urbano y Suelo de Conservación ya NO mostramos recuadro
  return null;
};

/* ------------------------------------------------ */
/* ------------------------------------------------ */
/* 6.2 Resumen Ejecutivo */
/* ------------------------------------------------ */

/* ------------------------------------------------ */
/* NEW COMPONENT: TOAST NOTIFICATIONS */
/* ------------------------------------------------ */
const ToastContext = React.createContext(null);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = React.useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  }, []);

  const removeToast = React.useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[5000] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`
              pointer-events-auto px-4 py-3 rounded-lg shadow-lg text-sm font-semibold text-white animate-slide-up flex items-center gap-2
              ${t.type === 'error' ? 'bg-red-600' : t.type === 'success' ? 'bg-green-600' : 'bg-gray-800'}
            `}
          >
            {t.type === 'error' && <Icons.AlertCircle className="h-4 w-4" />}
            {t.type === 'success' && <Icons.CheckCircle className="h-4 w-4" />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const useToast = () => React.useContext(ToastContext);

/* ------------------------------------------------ */
/* NEW COMPONENT: SKELETON ANALYSIS */
/* ------------------------------------------------ */
const SkeletonAnalysis = () => (
  <div className="animate-fade-in space-y-4 w-full">
    {/* Header Skeleton */}
    <div className="flex justify-between items-center mb-4">
      <div className="h-6 w-24 skeleton rounded bg-gray-200" />
      <div className="h-4 w-16 skeleton rounded bg-gray-200" />
    </div>

    {/* Banner Skeleton */}
    <div className="h-24 w-full skeleton rounded-xl bg-gray-100 mb-4" />

    {/* Details grid skeleton */}
    <div className="grid grid-cols-2 gap-3">
      <div className="h-12 w-full skeleton rounded bg-gray-100" />
      <div className="h-12 w-full skeleton rounded bg-gray-100" />
    </div>

    {/* Long block skeleton */}
    <div className="h-40 w-full skeleton rounded-xl bg-gray-100 mt-4" />
  </div>
);

const LocationSummary = ({ analysis, onExportPDF }) => {
  const { status } = analysis;
  const isOutside = status === 'OUTSIDE_CDMX';
  const isSC = status === 'CONSERVATION_SOIL';
  const isUrban = status === 'URBAN_SOIL';
  const isANP = analysis.isANP;

  const zoningColor = analysis.zoningKey ? getZoningColor(analysis.zoningKey) : '#9ca3af';
  const showZoningBlock = !isOutside && !isUrban; // Adjust logic as needed

  const [copied, setCopied] = useState(false);
  const copyCoords = () => {
    navigator.clipboard.writeText(`${analysis.coordinate.lat.toFixed(5)}, ${analysis.coordinate.lng.toFixed(5)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

  // State for tabs
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('prohibidas');

  return (
    <>
      <div className="glass-panel rounded-xl p-4 mb-4 animate-slide-up">
        {/* Header con Badge */}
        <div className="flex items-center justify-between mb-3">
          {!isOutside && (
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase shadow-sm"
              style={{
                backgroundColor: isSC ? '#3B7D23' : isUrban ? '#3b82f6' : '#6b7280',
                color: '#ffffff'
              }}
            >
              {isSC ? 'Suelo de Conservación' : 'Suelo Urbano'}
            </span>
          )}

          <button
            onClick={copyCoords}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            title="Copiar coordenadas"
          >
            <div className="flex items-center gap-1 text-[10px]">
              <Icons.Copy className="h-3 w-3" />
              <span className="font-mono">{analysis.coordinate.lat.toFixed(4)}, {analysis.coordinate.lng.toFixed(4)}</span>
            </div>
            {copied && <span className="absolute -mt-6 right-0 bg-black text-white text-[9px] px-2 py-0.5 rounded animate-fade-in">Copiado</span>}
          </button>
        </div>

        {/* Warning Outside */}
        {isOutside ? (
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-2 animate-pulse-subtle">
            <div className="flex items-center gap-2 text-red-700 font-bold text-sm mb-1">
              <Icons.XCircle className="h-4 w-4" />
              <span>Fuera de CDMX</span>
            </div>
            <p className="text-xs text-red-600 leading-snug">
              Este punto se encuentra en <strong>{analysis.outsideContext || 'otro estado'}</strong>.
            </p>
          </div>
        ) : (
          <div className="mb-3">
            <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">Alcaldía</div>
            <div className="text-lg font-bold text-gray-800 leading-tight">
              {analysis.alcaldia || 'Ciudad de México'}
            </div>
          </div>
        )}

        {/* Zonificación Badge */}
        {showZoningBlock && (
          <div className="mb-4">
            <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-1">
              {isANP ? 'Zonificación Interna' : 'Zonificación PGOEDF'}
            </div>
            {analysis.zoningName ? (
              <div className="flex items-start gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                  style={{ backgroundColor: zoningColor }}
                />
                <div className="text-sm font-semibold text-gray-700 leading-snug">
                  {analysis.zoningName} <span className="text-gray-400 font-normal">({analysis.zoningKey})</span>
                </div>
              </div>
            ) : (
              <span className="text-sm text-gray-400 italic">No disponible</span>
            )}
          </div>
        )}

        {/* ANP Block */}
        {isSC && isANP && (
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-1.5 text-purple-800 font-bold text-xs mb-2">
              <Icons.Verified className="h-3 w-3" /> {/* Assuming Verified exists or check Icons list. Using CheckCircle as fallback if needed manually but Verified would be nice. I will stick to what is in Icons obj or standard ones */}
              <span>Área Natural Protegida</span>
            </div>
            <div className="space-y-1 text-xs text-gray-700">
              <div className="font-medium text-purple-900">{analysis.anpNombre}</div>
              <div className="flex justify-between"><span>Categoría:</span> <span className="font-medium">{analysis.anpCategoria}</span></div>
              <div className="flex justify-between"><span>Decreto:</span> <span className="font-mono text-[10px]">{formatDate(analysis.anpFechaDecreto)}</span></div>
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
          <ActionButtonsDesktop analysis={analysis} onExportPDF={onExportPDF} />
        </div>

      </div>
    </>
  );
};
/* ------------------------------------------------ */
/* 6.3 Actividades agrupadas */
/* ------------------------------------------------ */
const GroupedActivities = ({ title, activities, icon, headerClass, bgClass, accentColor }) => {
  if (!activities || activities.length === 0) return null;

  const isProhibidas = (title || '').toUpperCase().includes('PROHIBIDAS');
  const isPermitidas = (title || '').toUpperCase().includes('PERMITIDAS');

  const groups = {};
  activities.forEach(a => {
    if (!groups[a.sector]) groups[a.sector] = {};
    if (!groups[a.sector][a.general]) groups[a.sector][a.general] = [];
    groups[a.sector][a.general].push(a.specific);
  });

  return (
    <details open className={`group rounded-lg border border-gray-200 overflow-hidden mb-3 shadow-sm ${bgClass}`}>
      <summary className={`flex items-center justify-between px-3 py-2 cursor-pointer ${headerClass}`}>
        <div className="flex items-center gap-2 font-bold text-xs">
          {icon}
          <span>
            {title}{' '}
            <span className="text-[10px] font-normal">
              ({activities.length})
            </span>
          </span>
        </div>
        <Icons.ChevronDown className="h-4 w-4 group-open:rotate-180 transition-transform" />
      </summary>

      <div className="px-3 py-2 bg-white border-t border-gray-100 space-y-3">
        {Object.entries(groups).map(([sector, generals], i) => {
          const st = (isProhibidas || isPermitidas)
            ? {
              bg: isProhibidas ? '#FEF2F2' : '#F0FDF4',              // ✅ rojo/verde MUY claro
              border: accentColor || (isProhibidas ? '#b91c1c' : '#15803d'),
              text: isProhibidas ? '#7f1d1d' : '#14532d'             // ✅ texto acorde, sin confundir
            }
            : getSectorStyle(sector);

          return (
            <div key={i} className="mb-3 rounded overflow-hidden border border-gray-100">
              <div
                className="px-3 py-2 font-bold text-[11px] uppercase tracking-wide border-l-4"
                style={{
                  backgroundColor: st.bg,
                  borderLeftColor: st.border,
                  color: st.text
                }}
              >
                {sector}
              </div>

              <div className="bg-white">
                {Object.entries(generals).map(([gen, specifics], j) => (
                  <details key={j} className="group/inner border-b border-gray-50 last:border-0">
                    <summary className="px-3 py-2 text-[11px] font-medium text-gray-700 cursor-pointer hover:bg-gray-50 flex justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor: (isProhibidas || isPermitidas)
                              ? (accentColor || (isProhibidas ? '#b91c1c' : '#15803d'))
                              : st.border
                          }}
                        />
                        <span>{gen}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 rounded-full">
                          {specifics.length}
                        </span>
                        <Icons.ChevronDown className="h-3 w-3 text-gray-400 group-open/inner:rotate-180 transition-transform" />
                      </div>
                    </summary>

                    <ul className="bg-gray-50/50 px-4 py-2 space-y-1">
                      {specifics.map((spec, k) => (
                        <li
                          key={k}
                          className="text-[10px] text-gray-600 pl-4 relative"
                        >
                          <span className="absolute left-0 top-1.5 w-1 h-1 bg-gray-300 rounded-full"></span>
                          {spec}
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </details>
  );
};

/* ------------------------------------------------ */
/* 6.4 Legal */
/* ------------------------------------------------ */

const LegalDisclaimer = () => (
  <div className="mt-6 p-3 bg-gray-50 border-t border-gray-200 text-[10px] text-gray-500 text-justify">
    <strong>Aviso Legal:</strong> La información mostrada es orientativa y no sustituye la interpretación oficial.
  </div>
);
// ------------------------------------------------
/* 6. EXPORTACIÓN Y PDF */
// ------------------------------------------------

// ✅ QR como IMG (para que html2canvas lo capture bien)
const QrCodeImg = ({ value, size = 74 }) => {
  const holderRef = React.useRef(null);
  const [src, setSrc] = React.useState(null);

  React.useEffect(() => {
    if (!holderRef.current || !value) return;
    if (typeof window.QRCode === 'undefined') return;

    holderRef.current.innerHTML = '';
    setSrc(null);

    new window.QRCode(holderRef.current, {
      text: value,
      width: size,
      height: size,
      correctLevel: window.QRCode.CorrectLevel.M
    });

    // Convertir canvas → dataURL para que siempre se capture
    setTimeout(() => {
      const canvas = holderRef.current.querySelector('canvas');
      if (canvas) setSrc(canvas.toDataURL('image/png'));
    }, 30);
  }, [value, size]);

  if (!value) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div ref={holderRef} style={{ width: size, height: size, display: 'none' }} />
      {src ? (
        <img
          src={src}
          alt="QR visor"
          style={{
            width: size,
            height: size,
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            display: 'block'
          }}
        />
      ) : (
        <div style={{ width: size, height: size, border: '1px solid #e5e7eb', borderRadius: 6, background: '#f9fafb' }} />
      )}
    </div>
  );
};
// ------------------------------------------------
// ------------------------------------------------
// FICHA PDF (plantilla oculta para exportar)
// ------------------------------------------------
const PdfFicha = React.forwardRef(({ analysis, mapImage }, ref) => {
  if (!analysis) return null;

  const fecha = analysis.timestamp || new Date().toLocaleString();
  const folio = `F-${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 12)}`;

  const isUrban = analysis.status === 'URBAN_SOIL';
  const isSC = analysis.status === 'CONSERVATION_SOIL';
  const isANP = analysis.isANP;

  const statusLabel =
    isANP ? 'Área Natural Protegida' :
      isSC ? 'Suelo de Conservación' :
        isUrban ? 'Suelo Urbano' :
          analysis.status === 'OUTSIDE_CDMX' ? 'Fuera de la Ciudad de México' :
            'Información no disponible';

  // Dirección: si no hay dato, usamos un mensaje neutro
  const direccion =
    analysis.address ||
    analysis.placeName ||
    analysis.label ||
    'Sin dirección disponible (consulta por coordenadas).';

  const coordText = `${analysis.coordinate.lat.toFixed(5)}, ${analysis.coordinate.lng.toFixed(5)}`;
  const visorUrl = `${window.location.origin}${window.location.pathname}?lat=${analysis.coordinate.lat}&lng=${analysis.coordinate.lng}&open=1`;
  const visorUrlShort = `${window.location.origin}${window.location.pathname}`;


  // Agrupa por Sector + Actividad general (SOLO para detalle, no se usará resumen)
  const detalleProhibidas = (analysis.prohibitedActivities || []).slice(0, 25);
  const detallePermitidas = (analysis.allowedActivities || []).slice(0, 25);

  // Para la simbología de zonificación reutilizamos ZONING_CAT_INFO
  const zonasParaLeyenda = ZONING_ORDER
    .filter(k => ZONING_CAT_INFO[k])
    .slice(0, 8)
    .map(k => [k, ZONING_CAT_INFO[k]]);

  // Estilo del badge de tipo de suelo
  let soilBadgeBg = '#e5e7eb';
  let soilBadgeColor = '#374151';

  if (isSC && !isANP) {
    soilBadgeBg = '#3B7D23'; // verde institucional SC
    soilBadgeColor = '#ffffff';
  }
  else if (isUrban) {
    soilBadgeBg = '#3b82f6';
    soilBadgeColor = '#ffffff';
  } else if (isANP) {
    soilBadgeBg = '#a855f7';
    soilBadgeColor = '#ffffff';
  }
  // ✅ Alias para el nuevo template editorial (evita ReferenceError)
  const soilBg = soilBadgeBg;
  const soilFg = soilBadgeColor;

  const zoningColor = analysis.zoningKey
    ? getZoningColor(analysis.zoningKey)
    : '#6b7280';

  let bandColor = '#e5e7eb';
  if (isANP) bandColor = '#e9d5ff';
  else if (isSC) bandColor = '#3B7D23';
  else if (isUrban) bandColor = '#3b82f6';

  return (() => {
    // ==========================
    // TOKENS EDITORIALES (PDF)
    // ==========================
    const T = {
      font: 'Roboto, Arial, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      base: 10.8,
      small: 9.2,
      micro: 8,          // footnotes/paginación
      h1: 13.5,          // título principal
      h2: 11.2,          // títulos de sección
      lead: 10,          // subtítulos/metadata
      lh: 1.42
    };

    const S = {
      pageW: 794,        // ~A4 a 96dpi
      pagePad: 28,       // margen editorial (px)
      gap1: 6,           // micro-espacios
      gap2: 10,          // espacios estándar
      gap3: 12,          // separación secciones
      radius: 6,
      hair: '1px solid #e5e7eb'
    };

    const C = {
      ink: '#111827',
      sub: '#4b5563',
      mute: '#6b7280',
      hair: '#e5e7eb',
      panel: '#f9fafb',
      guinda: '#9d2449',
      sc: '#3B7D23',
      su: '#3b82f6',
      anp: '#a855f7',
      red: '#b91c1c',
      green: '#166534'
    };

    // ==========================
    // HELPERS TABLAS (EDITORIAL)
    // ==========================
    const tbl = {
      table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: `${T.base}px`,
        lineHeight: T.lh
      },
      th: (bg = '#f3f4f6') => ({
        border: S.hair,
        background: bg,
        padding: '5px 8px',
        textAlign: 'left',
        verticalAlign: 'middle',
        fontSize: `${T.small}px`,
        fontWeight: 700,
        color: C.ink
      }),
      td: {
        border: S.hair,
        padding: '5px 8px',
        textAlign: 'left',
        verticalAlign: 'middle',
        fontSize: `${T.base}px`,
        color: C.ink
      },
      tdLabel: {
        border: S.hair,
        padding: '5px 8px',
        width: '34%',
        background: C.panel,
        fontSize: `${T.small}px`,
        fontWeight: 700,
        color: C.sub,
        verticalAlign: 'middle'
      },
      zebra: (i) => (i % 2 === 0 ? '#ffffff' : '#fbfbfc')
    };

    const badge = (bg, fg = '#fff', border = 'transparent') => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      borderRadius: 999,
      fontSize: `${T.small}px`,
      fontWeight: 800,
      letterSpacing: '0.02em',
      lineHeight: 1,
      backgroundColor: bg,
      color: fg,
      border: border === 'transparent' ? '1px solid transparent' : `1px solid ${border}`,
      whiteSpace: 'nowrap'
    });

    const h2 = (color = C.ink) => ({
      fontSize: `${T.h2}px`,
      fontWeight: 800,
      margin: `0 0 ${S.gap1}px 0`,
      color
    });

    const section = (mb = S.gap3) => ({ marginBottom: `${mb}px` });

    return (
      <div
        ref={ref}
        style={{
          width: `${S.pageW}px`,
          padding: `${S.pagePad}px`,
          fontFamily: T.font,
          fontSize: `${T.base}px`,
          lineHeight: T.lh,
          color: C.ink,
          backgroundColor: '#ffffff',
          boxSizing: 'border-box'
        }}
      >
        {/* ==========================
          ENCABEZADO (grilla 3 columnas)
         ========================== */}
        <header
          style={{
            display: 'grid',
            gridTemplateColumns: '64px 1fr 170px',
            columnGap: '14px',
            alignItems: 'center',
            marginBottom: `${S.gap2}px`
          }}
        >
          <div style={{ width: '64px' }}>
            <img src="./assets/logo-sedema.png" alt="SEDEMA" style={{ height: '46px', display: 'block' }} />

          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: `${T.h1}px`,
                fontWeight: 900,
                letterSpacing: '0.02em',
                color: C.ink,
                lineHeight: 1.15
              }}
            >
              VISOR DE CONSULTA CIUDADANA — FICHA DE RESULTADOS
            </div>

            <div style={{ fontSize: `${T.lead}px`, color: C.sub, marginTop: '3px' }}>
              Consulta normativa de Suelo Urbano y Suelo de Conservación en la Ciudad de México (PGOEDF 2000)
            </div>
          </div>

          <div
            style={{
              textAlign: 'right',
              fontSize: `${T.small}px`,
              color: C.sub,
              lineHeight: 1.35
            }}
          >
            <div style={{ fontWeight: 800, color: C.ink }}>Fecha de consulta</div>
            <div>{fecha}</div>
            <div style={{ marginTop: '6px', fontWeight: 800, color: C.ink }}>Folio orientativo</div>
            <div style={{ fontFamily: T.mono, fontSize: `${T.small}px` }}>{folio}</div>
          </div>
        </header>

        {/* CINTA INSTITUCIONAL (sobria) */}
        <div
          style={{
            height: '4px',
            borderRadius: '999px',
            backgroundColor: bandColor,
            marginBottom: `${S.gap2}px`
          }}
        />

        <div style={{ borderTop: `1px solid ${C.hair}`, marginBottom: `${S.gap2}px` }} />

        {/* ==========================
          0. MAPA + SIMBOLOGÍA (65/35)
         ========================== */}
        <section style={section(S.gap3)}>
          <h2 style={h2()}>0. Mapa de referencia y simbología</h2>

          <div style={{ display: 'flex', gap: '12px' }}>
            {/* MAPA */}
            <div
              style={{
                flex: '0 0 65%',
                border: S.hair,
                borderRadius: `${S.radius}px`,
                padding: '8px',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ fontSize: `${T.small}px`, color: C.sub, marginBottom: '6px' }}>
                <strong>Mapa de referencia (no a escala)</strong>
              </div>

              <div
                style={{
                  border: `1px solid ${C.hair}`,
                  borderRadius: '4px',
                  overflow: 'hidden',
                  height: '208px',
                  background: '#f3f4f6'
                }}
              >
                {mapImage ? (
                  <img
                    src={mapImage}
                    crossOrigin="anonymous"
                    alt="Mapa de referencia"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      position: 'relative',
                      background: '#eef2f7'
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: isSC ? C.sc : isUrban ? C.su : C.mute,
                        border: '3px solid #ffffff',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: `${T.small}px`,
                        fontWeight: 900,
                        color: '#ffffff'
                      }}
                    >
                      {isSC ? 'SC' : isUrban ? 'SU' : ''}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '6px', fontSize: `${T.micro}px`, color: C.mute }}>
                Para la vista interactiva del mapa, use el visor en línea.
              </div>
            </div>

            {/* SIMBOLOGÍA */}
            <div
              style={{
                flex: '1 1 35%',
                border: S.hair,
                borderRadius: `${S.radius}px`,
                padding: '8px',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ fontSize: `${T.small}px`, fontWeight: 800, marginBottom: '6px', color: C.ink }}>
                Simbología de puntos y zonificación
              </div>

              <div style={{ display: 'grid', gap: '6px', marginBottom: '8px' }}>
                {isSC && (
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: `${T.small}px`, color: C.sub }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: 999, background: C.sc, marginRight: '6px', border: '1px solid #fff', boxShadow: '0 0 1px rgba(0,0,0,0.25)' }} />
                    Punto “SC”: Suelo de Conservación
                  </div>
                )}
                {isUrban && (
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: `${T.small}px`, color: C.sub }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: 999, background: C.su, marginRight: '6px', border: '1px solid #fff', boxShadow: '0 0 1px rgba(0,0,0,0.25)' }} />
                    Punto “SU”: Suelo Urbano
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '6px' }}>
                <strong>{isANP ? 'Área Natural Protegida en el punto consultado' : 'Zonificación activa en el punto consultado'}</strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {isANP ? (
                  <>
                    <span style={{ width: '10px', height: '10px', borderRadius: 2, background: C.anp, border: '1px solid #9ca3af' }} />
                    <span style={{ fontSize: `${T.small}px` }}>
                      <strong>{analysis.anpNombre || '—'}</strong>
                    </span>
                  </>
                ) : analysis?.zoningKey ? (
                  <>
                    <span style={{ width: '10px', height: '10px', borderRadius: 2, background: zoningColor, border: '1px solid #9ca3af' }} />
                    <span style={{ fontSize: `${T.small}px` }}>
                      <strong>{analysis.zoningKey}</strong> — {analysis.zoningName || 'Sin descripción'}
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: `${T.small}px`, color: C.mute }}>Sin zonificación disponible.</span>
                )}
              </div>
              <div style={{ fontSize: `${T.micro}px`, color: C.mute, marginTop: '6px' }}>
                * Para categorías completas y simbología, consulte el visor.
              </div>
            </div>
          </div>

          {/* BLOQUE DIRECCIÓN + COORDENADAS (sobrio, sin gradientes) */}
          <div
            style={{
              marginTop: `${S.gap2}px`,
              padding: '10px 12px',
              borderRadius: `${S.radius}px`,
              border: S.hair,
              backgroundColor: '#fbfbfc'
            }}
          >
            <div
              style={{
                fontSize: `${T.small}px`,
                fontWeight: 900,
                marginBottom: `${S.gap1}px`,
                color: C.ink,
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}
            >
              Información esencial de la consulta
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 58%', minWidth: '240px' }}>
                <div style={{ fontSize: `${T.small}px`, fontWeight: 800, color: C.sub }}>Dirección</div>
                <div style={{ fontSize: `${T.base}px`, color: C.ink, marginTop: '2px' }}>
                  {direccion}
                </div>
              </div>

              <div style={{ flex: '0 0 190px' }}>
                <div style={{ fontSize: `${T.small}px`, fontWeight: 800, color: C.sub }}>Coordenadas (Lat, Lng)</div>
                <div
                  style={{
                    fontFamily: T.mono,
                    fontSize: `${T.base}px`,
                    color: C.ink,
                    lineHeight: 1.35,
                    padding: '6px 10px',
                    marginTop: '4px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}
                >
                  {coordText}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================
          1. IDENTIFICACIÓN NORMATIVA
         ========================== */}
        <section style={section(S.gap3)}>
          <h2 style={h2()}>1. Identificación normativa básica</h2>

          <table style={tbl.table}>
            <tbody>
              <tr style={{ background: tbl.zebra(0) }}>
                <td style={tbl.tdLabel}>Alcaldía</td>
                <td style={tbl.td}>{analysis.alcaldia || 'Ciudad de México'}</td>
              </tr>

              <tr style={{ background: tbl.zebra(1) }}>
                <td style={tbl.tdLabel}>Tipo de suelo</td>
                <td style={tbl.td}>
                  <span style={badge(soilBg, soilFg)}>{statusLabel}</span>
                  <div style={{ fontSize: `${T.micro}px`, color: C.mute, marginTop: '3px' }}>
                    {isSC ? 'Clasificación territorial: SC (PGOEDF 2000)' : isUrban ? 'Clasificación territorial: SU' : ''}
                  </div>
                </td>
              </tr>

              {!isUrban && !isANP && (
                <tr style={{ background: tbl.zebra(2) }}>
                  <td style={tbl.tdLabel}>Zonificación PGOEDF</td>
                  <td style={tbl.td}>
                    {analysis.zoningName ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', maxWidth: '100%' }}>
                        <span
                          style={{
                            ...badge(zoningColor, '#ffffff'),
                            fontWeight: 800,
                            maxWidth: '330px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          title={analysis.zoningName}
                        >
                          {analysis.zoningName}
                        </span>

                        {analysis.zoningKey && (
                          <span style={badge('#ffffff', C.ink, zoningColor)}>
                            {analysis.zoningKey}
                          </span>
                        )}
                      </span>
                    ) : (
                      'Sin información'
                    )}
                  </td>
                </tr>
              )}

              {/* ✅ ANP (solo si aplica) */}
              {isANP && (
                <tr style={{ background: tbl.zebra(2) }}>
                  <td style={tbl.tdLabel}>Área Natural Protegida</td>
                  <td style={tbl.td}>
                    <div style={{ display: 'grid', gap: '4px' }}>
                      <div><strong>NOMBRE:</strong> {analysis.anpNombre || '—'}</div>
                      <div><strong>TIPO_DECRETO:</strong> {analysis.anpTipoDecreto || '—'}</div>
                      <div><strong>CATEGORIA_PROTECCION:</strong> {analysis.anpCategoria || '—'}</div>
                      <div><strong>FECHA_DECRETO:</strong> {analysis.anpFechaDecreto ? String(analysis.anpFechaDecreto) : '—'}</div>
                      <div><strong>SUP_DECRETADA:</strong> {(analysis.anpSupDecretada ?? '—')}</div>
                    </div>
                  </td>
                </tr>
              )}




              <tr style={{ background: tbl.zebra(3) }}>
                <td style={tbl.tdLabel}>Base de referencia</td>
                <td style={tbl.td}>
                  Programa General de Ordenamiento Ecológico del Distrito Federal (PGOEDF 2000) y capas geoespaciales institucionales de SEDEMA.
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ==========================
          2. NOTA SUELO URBANO
         ========================== */}
        {isUrban && (
          <section style={section(S.gap3)}>
            <h2 style={h2()}>2. Referencia para Suelo Urbano</h2>
            <p style={{ fontSize: `${T.base}px`, color: C.sub, textAlign: 'justify', margin: 0 }}>
              La ubicación consultada se encuentra en Suelo Urbano. La regulación específica del uso del suelo corresponde a los Programas de Desarrollo Urbano aplicables, emitidos por la autoridad competente en materia de desarrollo urbano (SEDUVI). Esta ficha es de carácter orientativo y no sustituye los instrumentos oficiales.
            </p>
          </section>
        )}

        {/* ==========================
          3 y 4. ACTIVIDADES SC (tablas editoriales)
         ========================== */}
        {isSC && !isANP && !analysis.isPDU && !analysis.noActivitiesCatalog && (
          <>
            <section style={section(S.gap2)}>
              <h2 style={h2(C.red)}>3. Actividades prohibidas</h2>
              <div style={{ fontSize: `${T.micro}px`, color: C.mute, marginBottom: '6px' }}>
                Se muestran hasta 25 actividades específicas con clasificación “P” para la zonificación consultada.
              </div>
              {detalleProhibidas.length === 0 ? (
                <div style={{ fontSize: `${T.small}px`, color: C.sub }}>
                  No se identificaron actividades clasificadas como prohibidas para esta zonificación en el catálogo cargado.
                </div>
              ) : (
                <>
                  <table style={{ ...tbl.table, fontSize: `${T.small}px`, tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '22%' }} />
                      <col style={{ width: '30%' }} />
                      <col style={{ width: '48%' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th style={tbl.th('#fff1f2')}>Sector</th>
                        <th style={tbl.th('#fff1f2')}>Actividad general</th>
                        <th style={tbl.th('#fff1f2')}>Actividad específica</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalleProhibidas.map((a, i) => (
                        <tr key={i} style={{ background: tbl.zebra(i) }}>
                          <td style={{ ...tbl.td, fontSize: `${T.small}px`, verticalAlign: 'middle' }}>{a.sector || '-'}</td>
                          <td style={{ ...tbl.td, fontSize: `${T.small}px`, verticalAlign: 'middle' }}>{a.general || '-'}</td>
                          <td style={{ ...tbl.td, fontSize: `${T.small}px`, wordBreak: 'break-word' }}>
                            {a.specific || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ fontSize: `${T.micro}px`, color: C.mute, marginTop: '4px' }}>
                    * Se muestran hasta 25 actividades específicas prohibidas. Para el listado completo, consultar el visor.
                  </div>
                </>
              )}
            </section>

            <section style={section(S.gap2)}>
              <h2 style={h2(C.green)}>4. Actividades permitidas</h2>

              {detallePermitidas.length === 0 ? (
                <div style={{ fontSize: `${T.small}px`, color: C.sub }}>
                  No se identificaron actividades clasificadas como permitidas para esta zonificación en el catálogo cargado.
                </div>
              ) : (
                <>
                  <table style={{ ...tbl.table, fontSize: `${T.small}px`, tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '22%' }} />
                      <col style={{ width: '30%' }} />
                      <col style={{ width: '48%' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th style={tbl.th('#dcfce7')}>Sector</th>
                        <th style={tbl.th('#dcfce7')}>Actividad general</th>
                        <th style={tbl.th('#dcfce7')}>Actividad específica</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detallePermitidas.map((a, i) => (
                        <tr key={i} style={{ background: tbl.zebra(i) }}>
                          <td style={{ ...tbl.td, fontSize: `${T.small}px` }}>{a.sector || '-'}</td>
                          <td style={{ ...tbl.td, fontSize: `${T.small}px` }}>{a.general || '-'}</td>
                          <td style={{ ...tbl.td, fontSize: `${T.small}px`, wordBreak: 'break-word', verticalAlign: 'top' }}>
                            {a.specific || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ fontSize: `${T.micro}px`, color: C.mute, marginTop: '4px' }}>
                    * Se muestran hasta 25 actividades específicas permitidas. Para el listado completo, consultar el visor.
                  </div>
                </>
              )}
            </section>
          </>
        )}

        {/* ==========================
          5. ENLACES + AVISO LEGAL (cierre institucional)
         ========================== */}
        <section style={{ marginTop: `${S.gap2}px` }}>
          <h2 style={h2()}>5. Enlaces de referencia</h2>

          <div style={{ fontSize: `${T.small}px`, color: C.sub, marginBottom: `${S.gap2}px` }}>

            <strong>Visor:</strong> {visorUrlShort}
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: `${T.micro}px`, color: C.mute, marginBottom: '4px' }}>
                Escanea para abrir el visor en la ubicación consultada:
              </div>
              <QrCodeImg value={visorUrl} size={74} />
            </div>
            <div style={{ fontSize: `${T.micro}px`, color: C.mute, marginTop: '2px' }}>
              * Enlace profundo (lat/lng) vía QR.
            </div>

            <div style={{ marginTop: '4px' }}>
              Para mayor detalle normativo, consulte los instrumentos oficiales vigentes (PGOEDF 2000, Programas de Manejo de ANP y normatividad urbana aplicable).
            </div>
          </div>

          <div
            style={{
              borderTop: `1px solid ${C.hair}`,
              paddingTop: `${S.gap2}px`,
              fontSize: `${T.micro}px`,
              color: C.mute,
              textAlign: 'justify',
              lineHeight: 1.45
            }}
          >
            <strong>Aviso legal:</strong> La presente ficha tiene carácter orientativo y no sustituye dictámenes técnicos, resoluciones administrativas ni instrumentos jurídicos emitidos por las autoridades competentes. La información se basa en datos geoespaciales y normativos disponibles al momento de la consulta y puede estar sujeta a actualización.
          </div>
        </section>
      </div>
    );
  })();

}); // ✅ cierra React.forwardRef de PdfFicha


/* 6.5 CONTENIDO PRINCIPAL DEL PANEL */
/* ------------------------------------------------ */
const ResultsContent = ({ analysis, onExportReady }) => {
  const [activeTab, setActiveTab] = useState('prohibidas');
  const [showDetails, setShowDetails] = useState(true);
  const [mapImage, setMapImage] = useState(null);
  const pdfRef = useRef(null);

  // ✅ Guard: solo exporta si viene de click de usuario
  const exportArmedRef = useRef(false);
  // =====================================================
  // ✅ Genera imagen del mapa con capas activas (Leaflet → PNG)
  // =====================================================
  const buildExportMapImage = async ({ lat, lng, zoom = 14, analysisStatus }) => {
    return new Promise((resolve) => {
      const L = window.L;
      const leafletImageFn =
        window.leafletImage ||
        window.leafletImage?.default ||
        (typeof leafletImage !== 'undefined' ? leafletImage : null);

      if (!L || typeof leafletImageFn !== 'function') {
        console.warn('leaflet-image no disponible');
        return resolve(null);
      }

      const el = document.getElementById('export-map');
      if (!el) {
        console.warn('No existe #export-map');
        return resolve(null);
      }

      // Limpia contenido previo
      el.innerHTML = '';

      // Crear mapa oculto
      const m = L.map(el, {
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true
      }).setView([lat, lng], zoom);

      // --- Base layer (según EXPORT_STATE)
      const base = L.tileLayer(getBaseLayerUrl(EXPORT_STATE.activeBaseLayer || 'SATELLITE'), {
        crossOrigin: 'anonymous',
        maxZoom: 19
      }).addTo(m);

      // --- Overlays (según EXPORT_STATE.visibleMapLayers)
      const addGeoJson = (fc, style, paneZ = 400) => {
        if (!fc?.features?.length) return null;
        m.createPane(`p${paneZ}`);
        m.getPane(`p${paneZ}`).style.zIndex = paneZ;

        return L.geoJSON(fc, { pane: `p${paneZ}`, style, interactive: false }).addTo(m);
      };

      // SC
      if (EXPORT_STATE.visibleMapLayers?.sc) {
        addGeoJson(
          dataCache.sc,
          {
            color: LAYER_STYLES.sc.color,
            weight: 1.8,
            opacity: 0.9,
            fillColor: LAYER_STYLES.sc.fill,
            fillOpacity: 0.18
          },
          410
        );
      }

      // Alcaldías
      if (EXPORT_STATE.visibleMapLayers?.alcaldias) {
        addGeoJson(
          dataCache.alcaldias,
          { color: '#ffffff', weight: 3, dashArray: '8,4', opacity: 0.9, fillOpacity: 0 },
          420
        );
      }

      // EdoMex
      if (EXPORT_STATE.visibleMapLayers?.edomex) {
        addGeoJson(
          dataCache.edomex,
          { color: LAYER_STYLES.edomex.color, weight: 2, dashArray: '4,4', opacity: 0.9, fillOpacity: 0.1 },
          405
        );
      }

      // Morelos
      if (EXPORT_STATE.visibleMapLayers?.morelos) {
        addGeoJson(
          dataCache.morelos,
          { color: LAYER_STYLES.morelos.color, weight: 2, dashArray: '4,4', opacity: 0.9, fillOpacity: 0.1 },
          405
        );
      }

      // ✅ ANP (overlay independiente)
      if (EXPORT_STATE.visibleMapLayers?.anp) {
        addGeoJson(
          dataCache.anp,
          {
            color: LAYER_STYLES.anp.color,
            weight: 2.2,
            opacity: 0.95,
            fillColor: LAYER_STYLES.anp.fill,
            fillOpacity: 0.22   // ✅ misma transparencia que zonificación
          },
          428
        );
      }


      // Zonificación (por categoría, respetando visibleZoningCats)
      if (EXPORT_STATE.visibleMapLayers?.zoning && dataCache.zoning?.features?.length) {
        const byKey = {};
        ZONING_ORDER.forEach(k => (byKey[k] = []));

        dataCache.zoning.features.forEach(f => {
          const k = (f.properties?.CLAVE || '').toString().trim().toUpperCase();
          if (byKey[k]) byKey[k].push(f);
        });

        ZONING_ORDER.forEach((k, idx) => {
          const isOn = (EXPORT_STATE.visibleZoningCats?.[k] !== false);
          if (!isOn) return;

          const feats = byKey[k];
          if (!feats?.length) return;

          addGeoJson(
            { type: 'FeatureCollection', features: feats },
            (feature) => getZoningStyle(feature),
            430 + idx
          );
        });
      }

      // Marcador del punto (para que salga en el PDF)
      const isSC = (analysisStatus === 'CONSERVATION_SOIL');
      const isSU = (analysisStatus === 'URBAN_SOIL');
      const pinFill = isSC ? LAYER_STYLES.sc.color : isSU ? '#3b82f6' : '#9d2449';

      L.circleMarker([lat, lng], {
        radius: 8,
        color: '#ffffff',
        weight: 3,
        fillColor: pinFill,
        fillOpacity: 1
      }).addTo(m);

      // Espera a que carguen tiles y luego captura
      let settled = false;
      const done = (img) => {
        if (settled) return;
        settled = true;
        try { m.remove(); } catch { }
        resolve(img || null);
      };

      const timeout = setTimeout(() => {
        console.warn('Timeout export-map: capturando como esté');
        leafletImageFn(m, (err, canvas) => {
          if (err || !canvas) return done(null);
          done(canvas.toDataURL('image/png'));
        });
      }, 2200);

      base.once('load', () => {
        // pequeño delay para que pinte overlays
        setTimeout(() => {
          clearTimeout(timeout);
          leafletImageFn(m, (err, canvas) => {
            if (err || !canvas) return done(null);
            done(canvas.toDataURL('image/png'));
          });
        }, 250);
      });
    });
  };

  // ✅ Export estable (memoizado) + mapa estático (NO html2canvas del mapa Leaflet)
  const handleExportPDF = React.useCallback(async () => {
    // 🚫 Nunca exportar si no fue por acción directa del usuario
    if (!exportArmedRef.current) return;
    exportArmedRef.current = false;

    if (!analysis || !pdfRef.current) return;


    if (!window.jspdf?.jsPDF) {
      alert('Error: La librería de PDF no se ha cargado correctamente.');
      return;
    }
    const { jsPDF } = window.jspdf;

    if (typeof html2canvas === 'undefined') {
      alert('No se encontró html2canvas. Verifica que el script esté cargado.');
      return;
    }

    // 🚨 Seguridad: evita exportar si las capas aún no están cargadas
    if (!dataCache?.sc || !dataCache?.alcaldias || !dataCache?.anp) {
      alert('Aún se están cargando capas del mapa. Intenta de nuevo en unos segundos.');
      return;
    }

    // 1) ✅ Generar mapa exportable con capas activas (Leaflet → PNG)
    try {
      // OJO: si quieres exactamente el mismo zoom del mapa actual, puedes calcularlo,
      // pero por ahora dejamos 14 como en tu código.
      const img = await buildExportMapImage({
        lat: analysis.coordinate.lat,
        lng: analysis.coordinate.lng,
        zoom: 14,
        analysisStatus: analysis.status
      });

      // Si leaflet-image falló, fallback al static map (solo como plan B)
      if (img) {
        setMapImage(img);
      } else {
        const url = getStaticMapUrl({
          lat: analysis.coordinate.lat,
          lng: analysis.coordinate.lng,
          zoom: 14
        });
        const ok = await preloadImage(url);
        setMapImage(ok ? url : null);
      }

      // deja que React pinte la imagen en PdfFicha
      await new Promise(r => setTimeout(r, 80));
    } catch (e) {
      console.warn('No se pudo generar/cargar mapa exportable:', e);
      // fallback final
      try {
        const url = getStaticMapUrl({
          lat: analysis.coordinate.lat,
          lng: analysis.coordinate.lng,
          zoom: 14
        });
        const ok = await preloadImage(url);
        setMapImage(ok ? url : null);
        await new Promise(r => setTimeout(r, 80));
      } catch {
        setMapImage(null);
      }
    }



    // 2) Captura de la ficha completa (plantilla oculta)
    const element = pdfRef.current;

    const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
    const scale = isMobile ? 1.4 : 2;

    let canvas;
    try {
      canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
    } catch (e) {
      console.error('Fallo al renderizar la ficha para PDF:', e);
      alert('No se pudo generar la ficha PDF en este dispositivo/navegador. Intenta desde Chrome/desktop.');
      return;
    }

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const M = 12;          // margen editorial (mm)
    const FOOTER = 16;     // zona footer (mm)
    const usableW = pdfWidth - (M * 2);
    const usableH = pdfHeight - (M * 2) - FOOTER;

    const imgProps = pdf.getImageProperties(imgData);
    let imgW = usableW;
    let imgH = (imgProps.height * imgW) / imgProps.width;

    let totalPages = Math.max(1, Math.ceil(imgH / usableH));
    const remainder = imgH - usableH * (totalPages - 1);

    // ✅ Si la última página trae poco contenido (<28% de alto útil),
    // intenta encoger un poco para "caber" en una página menos.
    if (totalPages > 1 && remainder / usableH < 0.28) {
      const targetPages = totalPages - 1;
      const scaleDown = (usableH * targetPages) / imgH; // < 1 si cabe al encoger

      // No exagerar: máximo 8% de reducción (se ve bien)
      if (scaleDown > 0.92) {
        imgW = imgW * scaleDown;
        imgH = (imgProps.height * imgW) / imgProps.width;
        totalPages = Math.max(1, Math.ceil(imgH / usableH));
      }
    }

    const drawPage = (pageIndex) => {
      const yOffset = -(pageIndex * usableH);

      // ✅ HEADER MINI POR PÁGINA
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pdfWidth, M + 10, 'F');

      pdf.setFontSize(9);
      pdf.setTextColor(17, 24, 39);
      pdf.text('Visor de Consulta Ciudadana — Ficha', M, 10);

      // Folio/fecha (derecha)
      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);
      const headRight = `${(analysis?.alcaldia || 'CDMX')} · ${new Date().toISOString().slice(0, 10)}`;
      pdf.text(headRight, pdfWidth - M, 10, { align: 'right' });

      // Cinta sobria
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.2);
      pdf.line(M, 14, pdfWidth - M, 14);

      // 1) Imagen (se pinta “grande”)
      pdf.addImage(imgData, 'PNG', M, (M + 6) + yOffset, imgW, imgH);

      // 2) Borrar zona footer para evitar invasión visual
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, pdfHeight - (M + FOOTER), pdfWidth, (M + FOOTER), 'F');

      // 3) Regla editorial del footer (sobria)
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.2);
      pdf.line(M, pdfHeight - (M + FOOTER) + 4, pdfWidth - M, pdfHeight - (M + FOOTER) + 4);

      // 4) Paginación centrada
      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);
      pdf.text(`Página ${pageIndex + 1} de ${totalPages}`, pdfWidth / 2, pdfHeight - 6, { align: 'center' });
    };

    for (let i = 0; i < totalPages; i++) {
      if (i > 0) pdf.addPage();
      drawPage(i);
    }



    // ✅ Eliminar acentos y caracteres especiales del nombre de archivo
    const cleanAlcaldia = (analysis.alcaldia || 'CDMX')
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-zA-Z0-9]/g, "_")
      .toUpperCase();

    const nombreArchivo = `ficha-${cleanAlcaldia}-${new Date().toISOString().slice(0, 10)}.pdf`;

    pdf.save(nombreArchivo);
  }, [analysis]);

  // ✅ Esta es la ÚNICA función que deben usar botones / App
  const requestExportPDF = React.useCallback(() => {
    exportArmedRef.current = true;
    handleExportPDF();
  }, [handleExportPDF]);


  useEffect(() => {
    if (!onExportReady) return;
    onExportReady(requestExportPDF);
    return () => onExportReady(null);
  }, [onExportReady, requestExportPDF]);


  if (!analysis) return null;
  const isANP = !!analysis.isANP;
  return (
    <div className="space-y-4 animate-in bg-white border border-gray-200 rounded-lg px-4 pt-2 pb-3">
      {/* PLANTILLA OCULTA PARA PDF */}
      <div style={{ position: 'absolute', left: '-99999px', top: 0 }}>
        <div
          id="export-map"
          style={{
            width: '900px',
            height: '520px',
            background: '#fff'
          }}
        />
        <PdfFicha analysis={analysis} mapImage={mapImage} ref={pdfRef} />
      </div>



      {/* RESUMEN + ESTADO */}
      {analysis?.status !== 'OUTSIDE_CDMX' && <StatusMessage analysis={analysis} />}
      <LocationSummary analysis={analysis} onExportPDF={requestExportPDF} />


      {analysis.zoningName === 'Cargando detalles...' && (
        <div className="p-2 bg-yellow-50 text-yellow-800 text-[10px] rounded border border-yellow-200">
          Cargando detalles de zonificación y actividades. La ficha se actualizará automáticamente.
        </div>
      )}

      {analysis.status === 'CONSERVATION_SOIL' &&
        !isANP &&
        !analysis.isPDU &&
        !analysis.noActivitiesCatalog && (
          <>
            <div className="flex items-center justify-between mt-2">
              <div className="text-[11px] font-semibold text-gray-600">
                Detalle de actividades según zonificación PGOEDF 2000
              </div>

              <button
                onClick={() => setShowDetails(v => !v)}
                className="text-[10px] text-[#9d2449] hover:underline"
              >
                {showDetails ? 'Ocultar detalle' : 'Ver detalle'}
              </button>
            </div>

            {showDetails && (
              <div className="mt-2">
                <div className="relative w-full border-b border-gray-200 mb-4">
                  <div className="flex gap-3 px-1">
                    <button
                      onClick={() => setActiveTab('prohibidas')}
                      className={`px-4 py-2 rounded-t-lg text-[13px] font-extrabold transition
                        ${activeTab === 'prohibidas'
                          ? 'bg-[#b91c1c] text-white'
                          : 'bg-transparent text-gray-500 hover:text-[#b91c1c]'}
                      `}
                    >
                      PROHIBIDAS ({analysis.prohibitedActivities?.length || 0})
                    </button>

                    <button
                      onClick={() => setActiveTab('permitidas')}
                      className={`px-4 py-2 rounded-t-lg text-[13px] font-extrabold transition
                        ${activeTab === 'permitidas'
                          ? 'bg-[#15803d] text-white'
                          : 'bg-transparent text-gray-500 hover:text-[#15803d]'}
                      `}
                    >
                      PERMITIDAS ({analysis.allowedActivities?.length || 0})
                    </button>
                  </div>

                  <div className="absolute bottom-0 left-0 h-[3px] w-full pointer-events-none">
                    <div className="h-full flex">
                      <div
                        className="flex-1 transition-colors duration-300"
                        style={{ backgroundColor: activeTab === 'prohibidas' ? '#b91c1c' : 'transparent' }}
                      />
                      <div
                        className="flex-1 transition-colors duration-300"
                        style={{ backgroundColor: activeTab === 'permitidas' ? '#15803d' : 'transparent' }}
                      />
                    </div>
                  </div>
                </div>

                {activeTab === 'prohibidas' && (
                  <GroupedActivities
                    title="ACTIVIDADES PROHIBIDAS"
                    activities={analysis.prohibitedActivities}
                    icon={<Icons.XCircle className="h-4 w-4" />}
                    headerClass="text-red-900 bg-red-50"
                    bgClass="bg-white"
                    accentColor="#b91c1c"
                  />
                )}

                {activeTab === 'permitidas' && (
                  <GroupedActivities
                    title="ACTIVIDADES PERMITIDAS"
                    activities={analysis.allowedActivities}
                    icon={<Icons.CheckCircle className="h-4 w-4" />}
                    headerClass="text-green-900 bg-green-50"
                    bgClass="bg-white"
                    accentColor="#15803d"
                  />
                )}
              </div>
            )}
          </>
        )}

      <LegalDisclaimer />
    </div>
  );
};

/* ------------------------------------------------ */
/* 7. INTERFAZ: BÚSQUEDA, CONTROLES, SIDEBAR */
/* ------------------------------------------------ */
const MobileSearchBar = ({ onLocationSelect, onReset, setInputRef, initialValue }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef(null);
  const [flash, setFlash] = useState(false);

  // ✅ Sync con estado padre
  useEffect(() => {
    setQuery(initialValue || '');
  }, [initialValue]);

  // ✅ Setter externo (sin window) - Deprecated but kept for compatibility just in case
  useEffect(() => {
    if (!setInputRef) return;
    setInputRef.current = (text) => {
      setQuery(text || '');
      // setSuggestions([]); // No limpiar sugerencias al setear externo, o sí? Mejor solo update texto
    };
    return () => { setInputRef.current = null; };
  }, [setInputRef]);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim() || value.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      const res = await searchMapboxPlaces(value);
      setSuggestions(res);
      setIsSearching(false);
    }, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const coord = parseCoordinateInput(query);
    if (coord) {
      onLocationSelect(coord);
      setSuggestions([]);
      return;
    }

    if (suggestions.length > 0) {
      const s = suggestions[0];
      onLocationSelect({ lat: s.lat, lng: s.lng });
      setQuery(s.label);
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    const res = await searchMapboxPlaces(query);
    setIsSearching(false);

    if (res.length > 0) {
      const s = res[0];
      onLocationSelect({ lat: s.lat, lng: s.lng });
      setQuery(s.label);
      setSuggestions([]);
    } else {
      alert('No se encontraron coincidencias en Mapbox.');
    }
  };

  const handleSelectSuggestion = (s) => {
    setQuery(s.label);
    setSuggestions([]);
    onLocationSelect({ lat: s.lat, lng: s.lng });
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    onReset();
  };

  return (
    <div className="md:hidden fixed top-3 left-3 right-3 z-[2000] flex flex-col gap-2 pointer-events-none">
      <div className="pointer-events-auto">
        <form
          onSubmit={handleSubmit}
          className={`
    ${flash ? 'ring-2 ring-[#9d2449]/50 shadow-[0_0_0_6px_rgba(157,36,73,0.12)]' : ''}
    bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.18)]
    flex items-center px-2 py-1 border border-transparent
    focus-within:border-gray-300 transition-all duration-200 ease-out
  `}
        >
          <button type="submit" className="p-2 text-gray-500">
            <Icons.Search className="h-5 w-5" />
          </button>

          <input
            type="text"
            className="flex-1 bg-transparent outline-none text-[13px] text-gray-800 placeholder-gray-400 h-10"
            placeholder="Buscar dirección o coordenadas (Lat/Lng o DMS)"
            value={query}
            onChange={handleChange}
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                onReset(); // limpia resultados + re-encuadra mapa
              }}
              className="
      px-3 h-10 rounded-full bg-gray-100
      text-gray-700 text-[12px] font-semibold
      flex items-center gap-2
    "
            >
              <Icons.RotateCcw className="h-4 w-4" />
              Limpiar
            </button>
          )}

        </form>

        {(suggestions.length > 0 || isSearching) && (
          <div className="mt-1 bg-white border border-gray-200 rounded-lg shadow-md max-h-64 overflow-y-auto">
            {isSearching && (
              <div className="px-3 py-1.5 text-[11px] text-gray-500">Buscando en Mapbox…</div>
            )}
            {suggestions.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelectSuggestion(s)}
                className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-gray-50 border-t border-gray-50"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
const SearchLogicDesktop = ({ onLocationSelect, onReset, setInputRef, initialValue }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef(null);
  const localInputRef = useRef(null);

  // ✅ Sync con estado padre
  useEffect(() => {
    setQuery(initialValue || '');
  }, [initialValue]);

  // ✅ Setter externo (sin window)
  useEffect(() => {
    if (!setInputRef) return;
    setInputRef.current = (text) => {
      setQuery(text || '');
      setSuggestions([]);
    };
    return () => {
      setInputRef.current = null;
    };
  }, [setInputRef]);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim() || value.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      const res = await searchMapboxPlaces(value);
      setSuggestions(res);
      setIsSearching(false);
    }, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = query.trim();
    if (!value) return;

    const coord = parseCoordinateInput(value);
    if (coord) {
      onLocationSelect(coord);
      setSuggestions([]);
      return;
    }

    if (suggestions.length > 0) {
      const s = suggestions[0];
      onLocationSelect({ lat: s.lat, lng: s.lng });
      setQuery(s.fullLabel || s.label);
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    const res = await searchMapboxPlaces(value);
    setIsSearching(false);

    if (res.length > 0) {
      const s = res[0];
      onLocationSelect({ lat: s.lat, lng: s.lng });
      setQuery(s.fullLabel || s.label);
      setSuggestions([]);
    } else {
      alert('No se encontraron coincidencias en Mapbox.');
    }
  };

  const handleSelectSuggestion = (s) => {
    setQuery(s.fullLabel || s.label);
    setSuggestions([]);
    onLocationSelect({ lat: s.lat, lng: s.lng });
  };

  const handleResetAll = () => {
    setQuery('');
    setSuggestions([]);
    onReset();
  };

  return (
    <div className="space-y-2">
      <div className="relative shadow-sm">
        <div className="relative mb-3">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">
            Buscar por dirección
          </label>
          <div className="relative">
            <input
              type="text"
              ref={localInputRef}
              placeholder="Ej: Calle 5 de Mayo, Centro..."
              className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#9d2449] focus:border-transparent transition-all"
              value={query}
              onChange={handleChange}
              onFocus={() => {
                // Show history if query is empty
                if (!query.trim()) {
                  const history = JSON.parse(localStorage.getItem('search_history') || '[]');
                  if (history.length) setSuggestions(history.map(x => ({ ...x, _isHistory: true })));
                }
              }}
            />
            <Icons.Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />

            {isSearching && (
              <div className="absolute right-3 top-3">
                <div className="h-5 w-5 border-2 border-gray-200 border-t-[#9d2449] rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* Sugerencias y Recientes */}
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 z-[3000] overflow-hidden max-h-60 overflow-y-auto">
              {suggestions[0]._isHistory && (
                <div className="px-3 py-1.5 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  Búsquedas recientes
                </div>
              )}

              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    // Save to history logic
                    if (!s._isHistory) {
                      const history = JSON.parse(localStorage.getItem('search_history') || '[]');
                      const newEntry = { label: s.label, lat: s.lat, lng: s.lng, fullLabel: s.fullLabel };
                      const filtered = history.filter(h => h.label !== s.label).slice(0, 4); // Keep last 5
                      localStorage.setItem('search_history', JSON.stringify([newEntry, ...filtered]));
                    }
                    handleSelectSuggestion(s);
                  }}
                  className="w-full text-left px-3 py-2 text-[12px] hover:bg-gray-50 border-t border-gray-50 flex items-center gap-2"
                >
                  {s._isHistory ? <Icons.Clock className="h-3 w-3 text-gray-400" /> : <Icons.MapPin className="h-3 w-3 text-gray-400" />}
                  <div>
                    <div className="font-medium text-gray-800">{s.label}</div>
                    {s.fullLabel && <div className="text-[10px] text-gray-500">{s.fullLabel}</div>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {/* Mi ubicación */}
          <button
            onClick={() =>
              navigator.geolocation.getCurrentPosition(
                p => {
                  const coord = { lat: p.coords.latitude, lng: p.coords.longitude };
                  onLocationSelect(coord);
                },
                () => alert("No se pudo obtener tu ubicación.") // We will upgrade this to Toast later via props in App
              )
            }
            className="
      flex-1 h-11 bg-[#9d2449] text-white rounded-lg
      text-[14px] font-semibold flex items-center justify-center gap-2
      shadow-sm hover:bg-[#7d1d3a]
    "
          >
            <Icons.Navigation className="h-4 w-4" />
            Mi ubicación
          </button>

          {/* ✅ LIMPIAR (explícito) */}
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              onReset();
            }}
            className="
      h-11 px-4 bg-white border border-gray-300 rounded-lg
      text-gray-700 text-[13px] font-semibold
      flex items-center gap-2
      shadow-sm hover:bg-gray-50
    "
            title="Limpiar búsqueda y ver toda la CDMX"
          >
            <Icons.RotateCcw className="h-4 w-4" />
            Limpiar
          </button>
        </div>

      </div>
    </div>
  );
};


/* 7.1 Acciones rápidas */
/* ------------------------------------------------ */

const ActionButtonsDesktop = ({ analysis, onExportPDF }) => {
  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?lat=${analysis.coordinate.lat}&lng=${analysis.coordinate.lng}&open=1`;
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="grid grid-cols-3 gap-2 w-full">
      {/* Google Maps */}
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${analysis.coordinate.lat},${analysis.coordinate.lng}`}
        target="_blank"
        rel="noreferrer"
        className="flex flex-col items-center justify-center p-2 bg-white border rounded hover:border-[#9d2449] text-gray-600 hover:text-[#9d2449]"
      >
        <Icons.MapIcon className="h-5 w-5 mb-1" />
        <span className="text-[9px] font-bold">Google Maps</span>
      </a>

      {/* Copiar enlace */}
      <button
        type="button"
        onClick={handleCopyLink}
        className="flex flex-col items-center justify-center p-2 bg-white border rounded hover:border-[#9d2449] text-gray-600 hover:text-[#9d2449]"
      >
        <Icons.Share className="h-5 w-5 mb-1" />
        <span className="text-[9px] font-bold">Copiar enlace</span>
      </button>

      {/* Exportar PDF (solo por acción del usuario) */}
      <button
        type="button"
        onClick={() => onExportPDF?.()}
        className="flex flex-col items-center justify-center p-2 bg-white border rounded hover:border-[#9d2449] text-gray-600 hover:text-[#9d2449]"
      >
        <Icons.Pdf className="h-5 w-5 mb-1" />
        <span className="text-[9px] font-bold">Exportar PDF</span>
      </button>
    </div>
  );
};


/* ------------------------------------------------ */
/* 7.2 Sidebar Desktop */
/* ------------------------------------------------ */
const SidebarDesktop = ({
  analysis,
  onLocationSelect,
  onReset,
  isOpen,
  onToggle,
  onExportReady,
  desktopSearchSetRef,
  isLoading // ✅ New prop
}) => (
  <div className="hidden md:flex h-full z-[2000]">
    <div
      id="sidebar-desktop"
      className={`
        flex flex-col h-full overflow-y-auto custom-scrollbar
        transition-all duration-300 ease-out
        ${isOpen
          ? 'w-[360px] bg-white border-r border-gray-200 shadow-xl'
          : 'w-0 bg-transparent border-0 shadow-none'}
      `}
    >
      {isOpen && (
        <>
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#9d2449] text-white flex items-center justify-center">
                <Icons.MapIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-[18px] font-semibold text-gray-900 leading-tight">
                  Consulta Ciudadana
                </h2>
                <div className="text-[12px] text-gray-600 mt-0.5">
                  Dirección o coordenadas
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <SearchLogicDesktop
              onLocationSelect={onLocationSelect}
              onReset={onReset}
              setInputRef={desktopSearchSetRef}
              initialValue={analysis ? `${analysis.coordinate.lat.toFixed(6)}, ${analysis.coordinate.lng.toFixed(6)}` : ''}
            />

            {!analysis && !isLoading && (
              <div className="flex flex-col items-center justify-center text-center py-16 px-6 text-gray-400">
                <Icons.MapPinned className="h-12 w-12 mb-4 opacity-40" />
                <div className="text-[13px] font-medium text-gray-500">
                  Selecciona un punto en el mapa
                </div>
                <div className="text-[11px] text-gray-400 mt-1 max-w-xs">
                  Haz clic en el mapa o escribe una dirección o coordenadas para iniciar la consulta.
                </div>
              </div>
            )}

            {/* ✅ Show Skeleton when loading */}
            {isLoading && <SkeletonAnalysis />}

            {analysis && !isLoading && <ResultsContent analysis={analysis} onExportReady={onExportReady} />}
          </div>
        </>
      )}
    </div>

    <button
      onClick={onToggle}
      className="
        absolute top-24 transform -translate-x-1/2 z-[5000]
        w-8 h-16 bg-[#9d2449] text-white shadow-lg rounded-r-full
        flex items-center justify-center cursor-pointer
        hover:bg-[#7d1d3a] active:scale-95 transition-all duration-200
      "
      style={{ left: isOpen ? 360 : 0 }}
      title={isOpen ? 'Ocultar panel' : 'Mostrar panel'}
    >
      <span className="text-base font-extrabold">{isOpen ? '«' : '»'}</span>
    </button>
  </div>
);


/* ------------------------------------------------ */
/* 7.3 Bottom Sheet Móvil */
/* ------------------------------------------------ */
const BottomSheetMobile = ({ analysis, onLocationSelect, onReset, onClose, onStateChange, onExportPDF, onExportReady }) => {
  const [sheetState, setSheetState] = useState('collapsed'); // 'collapsed' | 'mid' | 'full'
  const sheetRef = useRef(null);
  const startY = useRef(0);

  useEffect(() => {
    if (onStateChange) onStateChange(sheetState);
  }, [sheetState, onStateChange]);

  useEffect(() => {
    if (analysis) setSheetState('mid');
    else setSheetState('collapsed');
  }, [analysis]);

  const goUp = () => setSheetState(prev => (prev === 'collapsed' ? 'mid' : prev === 'mid' ? 'full' : 'full'));
  const goDown = () => setSheetState(prev => (prev === 'full' ? 'mid' : prev === 'mid' ? 'collapsed' : 'collapsed'));
  const toggleFromTap = () => setSheetState(prev => (prev === 'mid' ? 'full' : 'mid'));

  const handleTouchStart = (e) => {
    if (e.target.closest('.sheet-header')) startY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const endY = e.changedTouches[0].clientY;
    const diff = startY.current - endY;
    if (Math.abs(diff) < 60) return;
    if (diff > 0) goUp();
    else goDown();
  };

  const getHeight = () => {
    if (sheetState === 'collapsed') return '18svh';
    if (sheetState === 'mid') return '45svh';
    return '85svh';
  };

  const isANP = analysis?.isANP;

  const statusLabel =
    !analysis
      ? 'Busca una dirección o toca el mapa para iniciar la consulta.'
      : analysis?.status === 'OUTSIDE_CDMX'
        ? 'El punto se encuentra fuera de la Ciudad de México.'
        : isANP
          ? 'Área Natural Protegida — consulte el Programa de Manejo correspondiente.'
          : analysis?.status === 'NO_DATA'
            ? 'No se encontró información disponible para esta zona.'
            : 'Detalle normativo del punto de consulta.';

  return (
    <div
      ref={sheetRef}
      className="
        md:hidden 
        fixed bottom-0 left-0 w-full 
        bg-white 
        rounded-t-2xl 
        shadow-[0_-5px_20px_rgba(0,0,0,0.2)] 
        z-[3000] 
        flex flex-col 
        transition-all duration-300 ease-out
      "
      style={{ height: getHeight() }}
    >
      <div
        className="sheet-header flex-shrink-0 pt-1 pb-2 px-4 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={analysis ? toggleFromTap : undefined}
      >
        <div className="w-10 h-1.5 bg-gray-300 rounded-full mx-auto mb-2" />

        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {analysis ? (
              <h3 className="font-bold text-sm text-[#9d2449] uppercase tracking-wide">
                RESULTADO DE CONSULTA
              </h3>
            ) : (
              <>
                <h3 className="font-bold text-gray-900 text-sm truncate">Visor de Consulta Ciudadana</h3>
                <p className="text-[18px] text-gray-900 line-clamp-2 mt-0.5">{statusLabel}</p>
              </>
            )}
          </div>

          {analysis && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1.5 rounded-full bg-[#9d2449] shadow-sm active:scale-95 transition"
            >
              <Icons.X className="h-4 w-4 text-white" />
            </button>
          )}
        </div>
      </div>

      {(sheetState === 'mid' || sheetState === 'full') && (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-gray-50/50 mobile-upscale">
          <ResultsContent analysis={analysis} onExportReady={onExportReady} />
        </div>
      )}

      {analysis && (
        <div className="flex-shrink-0 p-3 bg-white border-t border-gray-200 safe-area-bottom flex gap-3 overflow-x-auto">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${analysis.coordinate.lat},${analysis.coordinate.lng}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-[#9d2449] text-white py-2.5 px-4 rounded-full text-xs font-bold shadow-sm hover:bg-[#7d1d3a] transition-colors"
          >
            <Icons.MapIcon className="h-4 w-4" /> Google Maps
          </a>

          <button
            onClick={async () => {
              const url = `${window.location.origin}${window.location.pathname}?lat=${analysis.coordinate.lat}&lng=${analysis.coordinate.lng}&open=1`;
              if (navigator.share) {
                try {
                  await navigator.share({
                    title: 'Consulta Ciudadana SEDEMA',
                    text: `Ubicación: ${analysis.alcaldia}`,
                    url
                  });
                } catch { }
              } else {
                navigator.clipboard.writeText(url);
              }
            }}
            className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 py-2.5 px-4 rounded-full text-xs font-bold shadow-sm hover:bg-gray-50"
          >
            <Icons.Share className="h-4 w-4" /> Compartir
          </button>

          <button
            type="button"
            onClick={() => {
              if (onExportPDF) onExportPDF();
              else alert('No se pudo generar el PDF. Intenta recargar la página.');
            }}
            className="flex-1 min-w-[110px] flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 py-2.5 px-4 rounded-full text-xs font-bold shadow-sm hover:bg-gray-50"
          >
            <Icons.Pdf className="h-4 w-4" /> Exportar PDF
          </button>
        </div>
      )}
    </div>
  );
};


/* ------------------------------------------------ */
/* COMPONENTE TOGGLE SWITCH (FALTABA ESTO) */
/* ------------------------------------------------ */
const ToggleSwitch = ({ checked, onChange, disabled }) => (
  <div
    onClick={(e) => {
      e.stopPropagation();
      if (!disabled && onChange) onChange(!checked);
    }}
    className={`w-7 h-4 flex items-center rounded-full p-[2px] duration-300 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${checked && !disabled ? 'bg-[#9d2449]' : 'bg-gray-300'

      }`}
  >
    <div
      className={`bg-white w-3 h-3 rounded-full shadow-md transform duration-300 ${checked ? 'translate-x-3' : ''}`}
    />
  </div>
);

/* ------------------------------------------------ */
/* 8. VISOR DE MAPA (LEAFLET) */
/* ------------------------------------------------ */
const MapViewer = ({
  location,
  onLocationSelect,
  analysisStatus,
  visibleMapLayers,
  setVisibleMapLayers,
  visibleZoningCats,
  setVisibleZoningCats,
  isLegendOpen,
  setIsLegendOpen,
  extraDataLoaded,
  activeBaseLayer,
  setActiveBaseLayer,
  invalidateMapRef,   // ✅ CLAVE
  resetMapViewRef,     // ✅ NUEVO
  selectedAnpId        // ✅ Prop nueva para filtrado

}) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const layersRef = useRef({});          // sc, alcaldias, edomex, morelos, base
  const zoningLayersRef = useRef({});    // {ANP: layer, FC: layer, ... }
  const selectedAnpLayerRef = useRef(null); // ✅ Ref para la capa dinámica
  const markerRef = useRef(null);
  const [tilesLoading, setTilesLoading] = useState(true);

  const toggleLayer = (key, nextValue) => {
    setVisibleMapLayers(prev => ({
      ...prev,
      [key]: typeof nextValue === 'boolean' ? nextValue : !prev[key]
    }));
  };

  const toggleZoningGroup = () => {
    const enabled = !visibleMapLayers.zoning;

    setVisibleMapLayers(prev => ({
      ...prev,
      zoning: enabled
    }));

    setVisibleZoningCats(() => {
      const next = {};
      ZONING_ORDER.forEach(k => (next[k] = enabled));
      return next;
    });
  };

  // 1) INIT MAP
  useEffect(() => {
    if (!mapRef.current || mapInstance.current || !window.L) return;

    const bounds = window.L.latLngBounds([18.7, -99.6], [19.9, -98.7]);

    const map = window.L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 9,
      maxZoom: 18,
      preferCanvas: true,
      maxBounds: bounds,
      maxBoundsViscosity: 0.9
    }).setView(INITIAL_CENTER, INITIAL_ZOOM);

    window.L.control.attribution({ position: 'topleft', prefix: false }).addTo(map);
    mapInstance.current = map;
    // ✅ calcular bounds de CDMX una sola vez (si existe geojson)
    let cdmxBounds = null;
    try {
      if (dataCache?.cdmx?.features?.length) {
        const tmp = window.L.geoJSON(dataCache.cdmx);
        cdmxBounds = tmp.getBounds();
      }
    } catch { }

    // ✅ Exponer "reset view" a App
    if (resetMapViewRef) {
      resetMapViewRef.current = () => {
        try {
          const m = mapInstance.current;
          if (!m) return;

          if (cdmxBounds && cdmxBounds.isValid()) {
            m.fitBounds(cdmxBounds, { padding: [20, 20] });
          } else {
            m.setView(INITIAL_CENTER, INITIAL_ZOOM);
          }
        } catch { }
      };
    }

    // ✅ Exponer invalidateSize a App (sin window)
    if (invalidateMapRef) {
      invalidateMapRef.current = () => {
        try { mapInstance.current?.invalidateSize(); } catch { }
      };
    }

    // PANES
    map.createPane('paneBase');
    map.getPane('paneBase').style.zIndex = 300;

    map.createPane('paneContext');
    map.getPane('paneContext').style.zIndex = 350;

    map.createPane('paneOverlay');
    map.getPane('paneOverlay').style.zIndex = 400;

    // BASE TILE
    const base = window.L.tileLayer(getBaseLayerUrl(activeBaseLayer || 'SATELLITE'), {
      pane: 'paneBase',
      maxZoom: 19,
      tileSize: 256,
      zoomOffset: 0,
      crossOrigin: 'anonymous'
    });

    base.on('loading', () => setTilesLoading(true));
    base.on('load', () => setTilesLoading(false));
    base.addTo(map);
    layersRef.current.base = base;

    // CORE layers desde cache
    const { sc, alcaldias } = dataCache;

    const addCoreLayer = (name, data, style, tooltipField, pane, interactive = true) => {
      if (!data?.features?.length) return;

      const layer = window.L.geoJSON(data, {
        pane,
        style,
        interactive,
        onEachFeature: (feature, layerInstance) => {
          if (tooltipField && feature.properties?.[tooltipField]) {
            layerInstance.bindTooltip(feature.properties[tooltipField], {
              sticky: true,
              className: 'custom-tooltip'
            });
          }
        }
      });

      layersRef.current[name] = layer;
      map.addLayer(layer);
    };

    addCoreLayer(
      'sc',
      sc,
      {
        color: LAYER_STYLES.sc.color,
        weight: 1.8,
        opacity: 0.9,
        fillColor: LAYER_STYLES.sc.fill,
        fillOpacity: 0.18,
        interactive: false
      },
      null,
      'paneBase',
      false
    );

    addCoreLayer(
      'alcaldias',
      alcaldias,
      {
        color: LAYER_STYLES.alcaldias.color,
        weight: 3,
        dashArray: '8,4',
        opacity: 0.9,
        fillOpacity: 0
      },
      null,
      'paneContext'
    );

    map.on('click', e => onLocationSelect(e.latlng));

    setTimeout(() => {
      try { map.invalidateSize(); } catch { }
    }, 200);

    return () => {
      try { map.remove(); } catch { }
      mapInstance.current = null;
      if (resetMapViewRef) resetMapViewRef.current = null;
      layersRef.current = {};
      zoningLayersRef.current = {};
      markerRef.current = null;

      // ✅ limpiar ref al desmontar
      if (invalidateMapRef) invalidateMapRef.current = null;
    };
  }, []);

  // 2) EXTRA layers + zoning layers (una sola vez)
  useEffect(() => {
    if (!mapInstance.current || !extraDataLoaded || !window.L) return;

    const { edomex, morelos, zoning, anp } = dataCache;

    const addLayer = (name, data, style, tooltipField, pane, interactive = true) => {
      if (!data?.features?.length) return;

      const layer = window.L.geoJSON(data, {
        pane,
        style,
        interactive,
        onEachFeature: (feature, layerInstance) => {
          if (tooltipField && feature.properties?.[tooltipField]) {
            layerInstance.bindTooltip(feature.properties[tooltipField], {
              sticky: true,
              className: 'custom-tooltip'
            });
          }
        }
      });

      layersRef.current[name] = layer;
      mapInstance.current.addLayer(layer);
    };

    if (!layersRef.current.edomex) {
      addLayer(
        'edomex',
        edomex,
        {
          color: LAYER_STYLES.edomex.color,
          weight: 2,
          dashArray: '4,4',
          opacity: 0.9,
          fillOpacity: 0.1
        },
        'NOMGEO',
        'paneBase',
        false
      );
    }

    if (!layersRef.current.morelos) {
      addLayer(
        'morelos',
        morelos,
        {
          color: LAYER_STYLES.morelos.color,
          weight: 2,
          dashArray: '4,4',
          opacity: 0.9,
          fillOpacity: 0.1
        },
        'NOMGEO',
        'paneBase',
        false
      );
    }
    // ✅ ANP overlay (independiente de PGOEDF)
    if (!layersRef.current.anp) {
      addLayer(
        'anp',
        anp,
        {
          color: LAYER_STYLES.anp.color,
          weight: 2.2,
          opacity: 0.95,
          fillColor: LAYER_STYLES.anp.fill,
          fillOpacity: 0.22   // ✅ misma transparencia que zonificación
        },
        'NOMBRE',
        'paneOverlay',
        true
      );
    }


    // Build zoning layers por categoría una sola vez
    if (zoning?.features?.length && Object.keys(zoningLayersRef.current).length === 0) {
      const byKey = {};
      ZONING_ORDER.forEach(k => (byKey[k] = []));

      zoning.features.forEach(f => {
        let k = (f.properties?.CLAVE || '').toString().trim().toUpperCase();

        // ✅ Fix: Si no tiene CLAVE pero es un archivo específico (tiene ZONIFICACION), usar 'ANP_ZON'
        if (!k && f.properties?.ZONIFICACION) {
          k = 'ANP_ZON';
        }

        if (byKey[k]) byKey[k].push(f);
      });

      ZONING_ORDER.forEach(k => {
        const feats = byKey[k];
        if (!feats?.length) return;

        const fc = { type: 'FeatureCollection', features: feats };
        const layer = window.L.geoJSON(fc, {
          pane: 'paneOverlay',
          style: (feature) => getZoningStyle(feature),
          interactive: true,
          onEachFeature: (feature, layerInstance) => {
            layerInstance.on('mouseover', () => layerInstance.setStyle({ weight: 2.5 }));
            layerInstance.on('mouseout', () => layerInstance.setStyle({ weight: 1.4 }));

            const label = feature.properties?.PGOEDF;
            if (label) layerInstance.bindTooltip(label, { sticky: true, className: 'custom-tooltip' });
          }
        });

        zoningLayersRef.current[k] = layer;
      });
    }
  }, [extraDataLoaded]);

  // ✅ EFFECT: Manejo dinámico de Zonificación de ANP Seleccionada
  useEffect(() => {
    if (!mapInstance.current || !dataCache.zoning) return;

    // 1. Limpiar capa anterior si existe
    if (selectedAnpLayerRef.current) {
      mapInstance.current.removeLayer(selectedAnpLayerRef.current);
      selectedAnpLayerRef.current = null;
    }

    // 2. Si no hay ANP seleccionada o la capa "selectedAnpZoning" está apagada, salir
    if (!selectedAnpId || !visibleMapLayers.selectedAnpZoning) return;

    // 3. Filtrar features del ANP seleccionado
    const candidates = dataCache.zoning.features.filter(f => {
      const k = (f.properties?.CLAVE || '').toString().trim().toUpperCase();
      // Es un feature de zonificación específica (sin CLAVE)
      if (!k && f.properties?.ZONIFICACION) {
        // Si tiene ANP_ID y coincide
        if (f.properties.ANP_ID && f.properties.ANP_ID === selectedAnpId) return true;
        return false;
      }
      return false;
    });

    if (candidates.length) {
      const layer = window.L.geoJSON({ type: 'FeatureCollection', features: candidates }, {
        pane: 'paneOverlay',
        style: (feature) => getZoningStyle(feature),
        interactive: true,
        onEachFeature: (feature, layerInstance) => {
          const label = feature.properties?.ZONIFICACION || 'Zonificación ANP';
          layerInstance.bindTooltip(label, { sticky: true, className: 'custom-tooltip' });
        }
      });
      selectedAnpLayerRef.current = layer;
      mapInstance.current.addLayer(layer);
    }

  }, [selectedAnpId, visibleMapLayers.selectedAnpZoning, extraDataLoaded]);


  // 3) base layer change
  useEffect(() => {
    if (!mapInstance.current || !layersRef.current.base) return;
    setTilesLoading(true);
    layersRef.current.base.setUrl(getBaseLayerUrl(activeBaseLayer));
  }, [activeBaseLayer]);

  // 4) show/hide layers (core + extra + zoning)
  useEffect(() => {
    if (!mapInstance.current) return;

    ['sc', 'anp', 'alcaldias', 'edomex', 'morelos'].forEach(k => {
      const layer = layersRef.current[k];
      if (!layer) return;

      if (visibleMapLayers[k] && !mapInstance.current.hasLayer(layer)) mapInstance.current.addLayer(layer);
      if (!visibleMapLayers[k] && mapInstance.current.hasLayer(layer)) mapInstance.current.removeLayer(layer);
    });

    if (Object.keys(zoningLayersRef.current).length) {
      ZONING_ORDER.forEach(k => {
        const zLayer = zoningLayersRef.current[k];
        if (!zLayer) return;

        const shouldShow = !!visibleMapLayers.zoning && (visibleZoningCats[k] !== false);
        const has = mapInstance.current.hasLayer(zLayer);

        if (shouldShow && !has) mapInstance.current.addLayer(zLayer);
        if (!shouldShow && has) mapInstance.current.removeLayer(zLayer);
      });
    }
  }, [visibleMapLayers, visibleZoningCats, extraDataLoaded]);

  // 5) marker + flyTo
  useEffect(() => {
    if (!mapInstance.current || !location || !window.L) return;

    if (markerRef.current) markerRef.current.remove();

    const label =
      analysisStatus === 'CONSERVATION_SOIL' ? 'SC' :
        analysisStatus === 'URBAN_SOIL' ? 'SU' : '';

    const bgColor =
      analysisStatus === 'CONSERVATION_SOIL' ? LAYER_STYLES.sc.color :
        analysisStatus === 'URBAN_SOIL' ? '#3b82f6' : '#9ca3af';

    const iconHtml = `
      <div class="marker-pop" style="
        width:32px;height:32px;background:${bgColor};color:#fff;
        border:3px solid #fff;border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        font-weight:bold;font-size:12px;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
      ">
        ${label}
      </div>
      `;

    const icon = window.L.divIcon({
      html: iconHtml,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    markerRef.current = window.L.marker([location.lat, location.lng], { icon }).addTo(mapInstance.current);

    const currentZoom = mapInstance.current.getZoom();
    const targetZoom = Math.max(currentZoom, FOCUS_ZOOM);
    mapInstance.current.flyTo([location.lat, location.lng], targetZoom, { duration: 0.8 });
  }, [location, analysisStatus]);

  return (
    <div className="relative h-full w-full">
      <div id="main-map" ref={mapRef} className="h-full w-full bg-gray-200" />

      {tilesLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-[1200] bg-black/10 pointer-events-none">
          <div className="flex flex-col items-center gap-2 bg-white/90 px-4 py-3 rounded-lg shadow">
            <Icons.Loader2 className="h-5 w-5 animate-spin text-[#9d2449]" />
            <span className="text-[11px] text-gray-700 font-medium">Cargando información geográfica...</span>
          </div>
        </div>
      )}

      {/* PANEL CAPAS (MÓVIL + DESKTOP) */}
      {/* ✅ BOTÓN CAPAS — DESKTOP arriba-derecha */}
      <div className="hidden md:block absolute top-20 right-4 z-[3600]">
        {!isLegendOpen && (
          <button
            onClick={() => setIsLegendOpen(true)}
            aria-label="Mostrar capas"
            className="w-11 h-11 flex items-center justify-center bg-white shadow-lg rounded-full border border-gray-200 text-[#9d2449] hover:bg-gray-50"
          >
            <Icons.Layers className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* ✅ PANEL CAPAS (MÓVIL + DESKTOP) — flotante y con scroll */}
      {isLegendOpen && (
        <div
          className="absolute top-24 right-4 md:top-20 md:right-4 z-[4500]"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="
    w-[300px] max-w-[92vw]
    bg-white border border-gray-200
    rounded-2xl shadow-2xl
    overflow-hidden flex flex-col
  "
            style={{ maxHeight: "calc(100svh - 260px)" }}
          >
            {/* Header */}
            <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between flex-shrink-0">

              <div className="font-bold text-[#9d2449] text-sm uppercase tracking-wide">
                Capas del mapa
              </div>
              <button
                onClick={() => setIsLegendOpen(false)}
                className="w-8 h-8 rounded-full bg-[#9d2449] text-white flex items-center justify-center active:scale-95"
                aria-label="Cerrar"
                title="Cerrar"
              >
                <Icons.X className="h-4 w-4" />
              </button>
            </div>

            {/* ✅ BODY SCROLLEABLE */}
            <div className="p-2 space-y-2 overflow-y-auto custom-scrollbar flex-1"
              style={{
                // deja espacio al bottom sheet en móvil
                maxHeight: "calc(100svh - 340px)"
              }}
            >
              {/* Mapa base */}
              <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                <div className="text-[10px] font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                  Mapa base
                </div>

                <div className="grid grid-cols-3 rounded-lg overflow-hidden border border-gray-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setActiveBaseLayer('STREETS')}
                    className={`py-1.5 text-[11px] font-semibold ${activeBaseLayer === 'STREETS'
                      ? 'bg-[#9d2449] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    Mapa
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveBaseLayer('SATELLITE')}
                    className={`py-1.5 text-[11px] font-semibold ${activeBaseLayer === 'SATELLITE'
                      ? 'bg-[#9d2449] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    Satélite
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveBaseLayer('TOPO')}
                    className={`py-1.5 text-[11px] font-semibold ${activeBaseLayer === 'TOPO'
                      ? 'bg-[#9d2449] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    title="Topográfico suave"
                  >
                    Relieve
                  </button>
                </div>
              </div>

              {/* Límites y contexto */}
              <div>
                <div className="text-[11px] font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Límites y contexto
                </div>

                {['alcaldias', 'edomex', 'morelos'].map(k => (
                  <div
                    key={k}
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg  hover:bg-gray-50 cursor-pointer border border-gray-100"
                    onClick={() => toggleLayer(k)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-3 h-3 ${k === 'alcaldias'
                          ? 'border-2 border-gray-500 border-dashed bg-white'
                          : 'rounded-sm'
                          }`}
                        style={{ backgroundColor: k !== 'alcaldias' ? LAYER_STYLES[k].color : '' }}
                      />
                      <span className="text-[11px] text-gray-800 truncate">
                        {LAYER_STYLES[k].label}
                      </span>
                    </div>

                    <ToggleSwitch
                      checked={!!visibleMapLayers[k]}
                      onChange={() => toggleLayer(k)}
                    />
                  </div>
                ))}
              </div>

              {/* Suelo de conservación */}
              <div>
                <div className="text-[11px] font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Suelo de conservación
                </div>

                <div
                  className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-100"
                  onClick={() => toggleLayer('sc')}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: LAYER_STYLES.sc.fill }} />
                    <span className="text-[11px] text-gray-800 truncate">{LAYER_STYLES.sc.label}</span>
                  </div>

                  <ToggleSwitch checked={!!visibleMapLayers.sc} onChange={() => toggleLayer('sc')} />
                </div>
              </div>

            </div>

            {/* ANP */}
            <div>
              <div className="text-[11px] font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Conservación especial
              </div>

              <div className="space-y-1">
                {/* Capa General ANP */}
                <div
                  className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-100"
                  onClick={() => toggleLayer('anp')}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: LAYER_STYLES.anp.fill }} />
                    <span className="text-[11px] text-gray-800 truncate">{LAYER_STYLES.anp.label}</span>
                  </div>
                  <ToggleSwitch checked={!!visibleMapLayers.anp} onChange={() => toggleLayer('anp')} />
                </div>

                {/* ✅ Capa Específica ANP (Zon_...) - Dependiente */}
                <div
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg border border-gray-100 transition-colors
                      ${!selectedAnpId ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-50 cursor-pointer'}
                    `}
                  title={!selectedAnpId ? "Selecciona un ANP en el mapa para ver su zonificación" : ""}
                  onClick={() => {
                    if (!selectedAnpId) return;
                    // Restricción: No activar si la capa superior ANP está visible?
                    // O al revés? El usuario dijo: "no se pueda activar si la capa superior de anp está activada"
                    if (visibleMapLayers.anp) {
                      alert("Para ver la zonificación interna, desactiva primero la capa general de 'Áreas Naturales Protegidas'.");
                      return;
                    }
                    toggleLayer('selectedAnpZoning');
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-3 h-3 rounded border border-gray-300"
                      style={{ backgroundColor: ZONING_CAT_INFO.ANP_ZON?.color || '#8b5cf6' }} />
                    <span className="text-[11px] text-gray-800 truncate">
                      Zonificación ANP Selecc.
                    </span>
                  </div>

                  {/* Toggle deshabilitado visualmente si ANP general está activa (regla de negocio user) */}
                  <ToggleSwitch
                    checked={!!visibleMapLayers.selectedAnpZoning}
                    onChange={() => {
                      if (!selectedAnpId) return;
                      if (visibleMapLayers.anp) {
                        // Opción: Auto-desactivar ANP general? 
                        // El usuario dijo "no se pueda activar", implying disabled.
                        // Vamos a bloquearlo.
                        alert("Desactiva la capa 'Áreas Naturales Protegidas' para ver el detalle interno.");
                        return;
                      }
                      toggleLayer('selectedAnpZoning');
                    }}
                    disabled={!selectedAnpId || !!visibleMapLayers.anp}
                  />
                </div>
              </div>
            </div>



            {/* Zonificación PGOEDF */}
            <div className="border-t pt-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">
                  Zonificación PGOEDF
                </div>

                <ToggleSwitch checked={!!visibleMapLayers.zoning} onChange={toggleZoningGroup} />
              </div>


              {/* Sublista categorías */}
              <div className="mt-2 space-y-2">
                {ZONING_ORDER.filter(k => ZONING_CAT_INFO[k]).map(k => {
                  const info = ZONING_CAT_INFO[k];
                  const checked = visibleZoningCats[k] !== false;

                  return (
                    <div
                      key={k}
                      className="flex items-center justify-between px-2 py-1.5 rounded-lg  hover:bg-gray-50 cursor-pointer border border-gray-100"
                      onClick={() => setVisibleZoningCats(prev => ({ ...prev, [k]: prev[k] === false ? true : false }))}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: info.color }} />
                        <span className="text-[11px] text-gray-700 truncate">
                          {info.label}
                        </span>
                      </div>

                      <ToggleSwitch
                        checked={checked}
                        onChange={() => setVisibleZoningCats(prev => ({ ...prev, [k]: prev[k] === false ? true : false }))}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nota inicial desktop */}
      {!analysisStatus && (
        <div className="hidden md:flex absolute top-20 right-20 z-[1100]">
          <div className="bg-white/95 border border-gray-200 rounded-lg shadow-md px-3 py-2 text-[11px] text-gray-700 max-w-xs">
            Haz clic en el mapa o busca una dirección para iniciar la consulta de zonificación.
          </div>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------ */
/* 8. LEYENDA FLOTANTE (Mejorada - Unificada) */
/* ------------------------------------------------ */
const Legend = ({
  visibleMapLayers,
  toggleLayer,
  isOpen,
  setIsOpen,
  visibleZoningCats,
  toggleZoningGroup,
  setVisibleZoningCats,
  toggleZoningCat,
  activeBaseLayer,
  setActiveBaseLayer,
  selectedAnpId,
  anpGeneralVisible
}) => {
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="
          fixed bottom-8 right-4 z-[1000]
          w-14 h-14 bg-[#9d2449] text-white rounded-full shadow-lg
          flex items-center justify-center
          hover:bg-[#7d1d3a] hover:scale-110 active:scale-95 transition-all
        "
        title="Abrir Leyenda"
      >
        <Icons.Layers className="h-7 w-7" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 z-[2000] w-80 glass-panel rounded-xl shadow-soft animate-fade-in flex flex-col max-h-[75vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 rounded-t-xl shrink-0">
        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
          <Icons.Layers className="h-4 w-4 text-[#9d2449]" />
          Capas y Simbología
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Icons.X className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {/* Content Scrollable - Single Block */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-white/80 space-y-6">

        {/* 1. Contexto */}
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Contexto y Límites</div>
          <div className="space-y-3">
            <label className="flex items-center justify-between group cursor-pointer">
              <span className="text-[13px] text-gray-700 font-medium group-hover:text-gray-900 transition-colors">Alcaldías</span>
              <ToggleSwitch checked={visibleMapLayers.alcaldias} onChange={() => toggleLayer('alcaldias')} />
            </label>
            <label className="flex items-center justify-between group cursor-pointer">
              <span className="text-[13px] text-gray-700 font-medium group-hover:text-gray-900 transition-colors">Suelo de Conservación</span>
              <ToggleSwitch checked={visibleMapLayers.sc} onChange={() => toggleLayer('sc')} />
            </label>
            <label className="flex items-center justify-between group cursor-pointer">
              <span className="text-[13px] text-gray-700 font-medium group-hover:text-gray-900 transition-colors">Límite Edo. Méx</span>
              <ToggleSwitch checked={visibleMapLayers.edomex} onChange={() => toggleLayer('edomex')} />
            </label>
            <label className="flex items-center justify-between group cursor-pointer">
              <span className="text-[13px] text-gray-700 font-medium group-hover:text-gray-900 transition-colors">Límite Morelos</span>
              <ToggleSwitch checked={visibleMapLayers.morelos} onChange={() => toggleLayer('morelos')} />
            </label>

            {/* ANP Switch */}
            <div className="pt-2 border-t border-gray-100">
              <label className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#a855f7] border border-white shadow-sm" />
                  <span className="text-[13px] text-gray-800 font-bold">Áreas Naturales Protegidas</span>
                </div>
                <ToggleSwitch checked={visibleMapLayers.anp} onChange={() => toggleLayer('anp')} />
              </label>
            </div>

            {/* ANP Zonificación (Dinámica) */}
            <div
              className={`transition-opacity ${!selectedAnpId ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <label className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded border border-purple-500 bg-purple-100 shadow-sm" />
                  <span className="text-[13px] text-purple-900 font-bold">Zonificación Interna ANP</span>
                </div>
                <ToggleSwitch
                  checked={visibleMapLayers.selectedAnpZoning}
                  onChange={() => {
                    if (!selectedAnpId) return;
                    if (anpGeneralVisible) {
                      alert("Desactiva la capa 'Áreas Naturales Protegidas' para ver el detalle interno.");
                      return;
                    }
                    toggleLayer('selectedAnpZoning');
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        {/* 2. Zonificación PGOEDF */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Zonificación PGOEDF 2000</div>
            <button onClick={toggleZoningGroup} className="text-[10px] text-[#9d2449] font-bold hover:underline">
              {visibleMapLayers.zoning ? 'Ocultar todo' : 'Mostrar todo'}
            </button>
          </div>

          <div className={`space-y-2 pl-1 transition-opacity duration-200 ${!visibleMapLayers.zoning ? 'opacity-50 pointer-events-none' : ''}`}>
            {ZONING_ORDER.map(cat => {
              const info = ZONING_CAT_INFO[cat];
              const isChecked = visibleZoningCats[cat] !== false;
              return (
                <div key={cat} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded shadow-sm shrink-0"
                      style={{ backgroundColor: info?.color || '#999' }}
                    />
                    <span className="text-[11px] text-gray-600 font-medium leading-tight">
                      {info?.label || cat}
                    </span>
                  </div>
                  <ToggleSwitch
                    checked={isChecked}
                    onChange={() => setVisibleZoningCats(prev => ({ ...prev, [cat]: !isChecked }))}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Mapa Base */}
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Mapa Base</div>
          <div className="grid grid-cols-1 gap-2">
            {[
              { id: 'STREETS', label: 'Mapa Claro (Calles)' },
              { id: 'SATELLITE', label: 'Satélite + Calles' },
              { id: 'TOPO', label: 'Topográfico' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setActiveBaseLayer(opt.id)}
                className={`
                    w-full text-left px-3 py-2.5 rounded-lg border flex items-center justify-between transition-all
                    ${activeBaseLayer === opt.id
                    ? 'bg-[#9d2449]/5 border-[#9d2449] text-[#9d2449]'
                    : 'bg-gray-50 border-transparent text-gray-600 hover:bg-white hover:border-gray-200 shadow-sm'}
                 `}
              >
                <span className="text-[12px] font-bold">{opt.label}</span>
                {activeBaseLayer === opt.id && <Icons.CheckCircle className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

/* ------------------------------------------------ */
/* 9. APLICACIÓN PRINCIPAL */
/* ------------------------------------------------ */

const App = () => {
  const [loading, setLoading] = useState(true); // Carga inicial (datos)
  const [analyzing, setAnalyzing] = useState(false); // Carga de análisis (geocoding/polígonos)
  const [extraDataLoaded, setExtraDataLoaded] = useState(false);

  const { addToast } = useToast(); // ✅ Use newly added hook
  const [analysis, setAnalysis] = useState(null);
  const [location, setLocation] = useState(null);
  // const [addressText, setAddressText] = useState(''); // ✅ Nuevo estado compartido para la barra de búsqueda

  // Capas mapa
  const [visibleMapLayers, setVisibleMapLayers] = useState({
    sc: true,
    anp: true,
    zoning: true,
    alcaldias: true,
    edomex: true,
    morelos: true,
    selectedAnpZoning: true
  });

  // Categorías zonificación
  const [visibleZoningCats, setVisibleZoningCats] = useState(() => {
    const d = {};
    ZONING_ORDER.forEach(k => (d[k] = true));
    return d;
  });

  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeBaseLayer, setActiveBaseLayer] = useState('SATELLITE');

  // =====================================================
  // ✅ SINCRONIZA ESTADO DEL MAPA → EXPORT_STATE (para PDF)
  // =====================================================
  useEffect(() => {
    EXPORT_STATE.activeBaseLayer = activeBaseLayer;
    EXPORT_STATE.visibleMapLayers = { ...visibleMapLayers };
    EXPORT_STATE.visibleZoningCats = { ...visibleZoningCats };
  }, [activeBaseLayer, visibleMapLayers, visibleZoningCats]);

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [mobileSheetState, setMobileSheetState] = useState('collapsed'); // collapsed | mid | full

  // ✅ acá se guarda la función REAL que exporta el PDF (la define ResultsContent)
  const [exportHandler, setExportHandler] = useState(null);

  // ✅ Wrapper: solo se ejecuta por botón (acción del usuario)
  const handleExportClick = React.useCallback(() => {
    if (typeof exportHandler === 'function') {
      exportHandler();
    } else {
      alert('Aún no se puede exportar. Intenta de nuevo en un momento.');
    }
  }, [exportHandler]);

  // ✅ Refs (sin window.__*)
  const invalidateMapRef = useRef(null);
  const resetMapViewRef = useRef(null);
  const desktopSearchInputRef = useRef(null);
  const mobileSearchInputRef = useRef(null);

  const handleLocationSelect = async (c) => {
    const lat = Number(c?.lat);
    const lng = Number(c?.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    const coord = { lat, lng };
    const text = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    // ✅ Actualizamos local y global
    setLocation(coord);
    // setAddressText(text); // No longer needed, derived from analysis

    // ✅ Empuja al textbox en desktop y móvil
    desktopSearchInputRef.current?.(text);
    mobileSearchInputRef.current?.(text);

    setAnalyzing(true); // Start analysis loading

    try {
      const res = await analyzeLocation(coord);
      setAnalysis(res);

      if (res.status === 'OUTSIDE_CDMX') {
        addToast('El punto está fuera de la CDMX', 'error');
      } else {
        addToast('Análisis completado', 'success');
      }
    } catch (err) {
      addToast('Error al analizar la ubicación', 'error');
      console.error(err);
    } finally {
      setAnalyzing(false); // End analysis loading
    }
  };

  const handleReset = () => {
    setLocation(null);
    setAnalysis(null);
    setMobileSheetState('collapsed');

    setAnalysis(null);
    setMobileSheetState('collapsed');
    // setAddressText(''); // No longer needed

    resetMapViewRef.current?.();
  };

  const handleUserLocation = () => {
    navigator.geolocation.getCurrentPosition(
      p => {
        const coord = { lat: p.coords.latitude, lng: p.coords.longitude };
        handleLocationSelect(coord);

        const text = `${coord.lat.toFixed(6)}, ${coord.lng.toFixed(6)}`;
        desktopSearchInputRef.current?.(text);
        mobileSearchInputRef.current?.(text);
      },
      () => addToast("No se pudo obtener tu ubicación. Revisa permisos.", 'error')
    );
  };

  // Helper to toggle layers
  const toggleLayer = React.useCallback((key) => {
    setVisibleMapLayers(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Helper to toggle zoning group
  const toggleZoningGroup = React.useCallback(() => {
    setVisibleMapLayers(prev => ({ ...prev, zoning: !prev.zoning }));
  }, []);

  useEffect(() => {
    loadCoreData()
      .then(() => {
        setLoading(false);

        const params = new URLSearchParams(window.location.search);
        const lat = parseFloat(params.get("lat"));
        const lng = parseFloat(params.get("lng"));
        const hasCoords = !isNaN(lat) && !isNaN(lng);

        if (!hasCoords) setIsHelpOpen(true);
        if (hasCoords) handleLocationSelect({ lat, lng });

        loadExtraData().then(() => setExtraDataLoaded(true));
      })
      .catch(err => {
        console.error("Error loading initial data:", err);
        setLoading(false); // Stop loading spinner so user isn't stuck
      });
  }, []);

  useEffect(() => {
    setTimeout(() => invalidateMapRef.current?.(), 120);
    setTimeout(() => invalidateMapRef.current?.(), 600);
  }, [isHelpOpen]);

  useEffect(() => {
    setTimeout(() => invalidateMapRef.current?.(), 200);
  }, [isSidebarOpen]);

  useEffect(() => {
    if (location && extraDataLoaded) {
      analyzeLocation(location).then(setAnalysis);
    }
  }, [location, extraDataLoaded]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-[#9d2449]">
        <Icons.Loader2 className="animate-spin h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col md:flex-row bg-[#f3f4f6]">

      {/* ✅ BARRA SUPERIOR MÓVIL (APP HEADER) */}
      <div className="md:hidden absolute top-0 left-0 right-0 z-[1100] p-3 pointer-events-none">
        <MobileSearchBar
          onLocationSelect={handleLocationSelect}
          onReset={handleReset}
          setInputRef={mobileSearchInputRef}
          initialValue={analysis ? `${analysis.coordinate.lat.toFixed(6)}, ${analysis.coordinate.lng.toFixed(6)}` : ''}
        />
      </div>

      {/* Sidebar Desktop */}
      <SidebarDesktop
        analysis={analysis}
        onLocationSelect={handleLocationSelect}
        onReset={handleReset}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(v => !v)}
        onExportReady={setExportHandler}
        desktopSearchSetRef={desktopSearchInputRef}
        isLoading={analyzing} // ✅ Pass analyzing state
      />

      {/* Main Map Area */}
      <div className="relative flex-1 h-full w-full">
        <MapViewer
          location={location}
          onLocationSelect={handleLocationSelect}
          analysisStatus={analysis?.status}
          visibleMapLayers={visibleMapLayers}
          setVisibleMapLayers={setVisibleMapLayers}
          visibleZoningCats={visibleZoningCats}
          setVisibleZoningCats={setVisibleZoningCats}
          // isLegendOpen={isLegendOpen} // Removed, Legend handles its own visibility
          // setIsLegendOpen={setIsLegendOpen} // Removed
          extraDataLoaded={extraDataLoaded}
          activeBaseLayer={activeBaseLayer}
          setActiveBaseLayer={setActiveBaseLayer}
          invalidateMapRef={invalidateMapRef} // ✅ Pass REF
          resetMapViewRef={resetMapViewRef}     // ✅ Pass REF
          selectedAnpId={analysis?.anpId} // ✅ Pass ANP ID
        />

        {/* Loading Overlay - Only on initial data load, NOT analysis */}
        {loading && (
          <div className="absolute inset-0 z-[3000] bg-white/60 backdrop-blur-sm flex items-center justify-center animate-fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-gray-200 border-l-[#9d2449] rounded-full animate-spin mb-3"></div>
              <span className="text-gray-800 font-bold text-sm">Cargando mapa base...</span>
            </div>
          </div>
        )}

        {/* Legend */}
        <Legend
          visibleMapLayers={visibleMapLayers}
          toggleLayer={toggleLayer}
          isOpen={isLegendOpen}
          setIsOpen={setIsLegendOpen}
          visibleZoningCats={visibleZoningCats}
          toggleZoningGroup={toggleZoningGroup}
          setVisibleZoningCats={setVisibleZoningCats}
          activeBaseLayer={activeBaseLayer}
          setActiveBaseLayer={setActiveBaseLayer}
          selectedAnpId={analysis?.anpId}
          anpGeneralVisible={visibleMapLayers.anp}
        />

        {/* Nota inicial desktop */}
        {!analysis?.status && (
          <div className="hidden md:flex absolute top-20 right-20 z-[1100]">
            <div className="bg-white/95 border border-gray-200 rounded-lg shadow-md px-3 py-2 text-[11px] text-gray-700 max-w-xs">
              Haz clic en el mapa o busca una dirección para iniciar la consulta de zonificación.
            </div>
          </div>
        )}

        {/* BOTONES MÓVIL */}
        <div className="md:hidden absolute bottom-40 right-4 z-[3400] pointer-events-auto flex flex-col items-end gap-3">
          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 text-[#9d2449] active:scale-95 transition"
            aria-label="Ayuda"
            title="Ayuda"
          >
            ?
          </button>

          {(!analysis || mobileSheetState !== 'full') && (
            <>
              {/* The Legend component now handles its own button */}
              {/* <button
                type="button"
                onClick={() => setIsLegendOpen(o => !o)}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 text-[#9d2449] active:scale-95 transition"
                aria-label="Capas"
                title="Capas"
              >
                <Icons.Layers className="h-5 w-5" />
              </button> */}

              <button
                type="button"
                onClick={handleUserLocation}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 text-[#9d2449] active:scale-95 transition"
                aria-label="Mi ubicación"
                title="Mi ubicación"
              >
                <Icons.Navigation className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Bottom Sheet */}
      <BottomSheetMobile
        analysis={analysis}
        onLocationSelect={handleLocationSelect}
        onReset={handleReset}
        onStateChange={setMobileSheetState}
        onClose={() => {
          // Close logic if needed, usually just collapsing
          handleReset();
        }}
        onExportPDF={handleExportClick} // pass the handler that calls the state func
        onExportReady={setExportHandler}
      />
    </div>
  );
};


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ToastProvider>
    <App />
  </ToastProvider>
);

