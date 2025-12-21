/* ------------------------------------------------ */
/* 1. CONFIGURACIÓN E IMPORTACIONES */
/* ------------------------------------------------ */
const React = window.React;
const { useState, useEffect, useRef } = React;
const ReactDOM = window.ReactDOM;

const {
  DATA_FILES,
  LAYER_STYLES,
  ZONING_CAT_INFO,
  ZONING_ORDER,
  CONTACT_INFO,
  FAQ_ITEMS,
  MAPBOX_TOKEN,
  INITIAL_CENTER,
  INITIAL_ZOOM,
  FOCUS_ZOOM
} = window.App.Constants;

const {
  isPointInPolygon,
  findFeature,
  getZoningColor,
  getZoningStyle,
  getSectorStyle,
  isStrictNumber,
  parseCoordinateInput,
  searchMapboxPlaces,
  getBaseLayerUrl
} = window.App.Utils;

// Componentes UI
const Icons = window.App.Components.Icons;
const InstitutionalHeader = window.App.Components.InstitutionalHeader;
const ToggleSwitch = window.App.Components.ToggleSwitch;
const Legend = window.App.Components.Legend;
const HelpModal = window.App.Components.HelpModal;
const MapViewer = window.App.Components.MapViewer;
const MobileSearchBar = window.App.Components.MobileSearchBar;
const SkeletonAnalysis = window.App.Components.SkeletonAnalysis;
const ResultsContent = window.App.Components.ResultsContent;
const SearchLogicDesktop = window.App.Components.SearchLogicDesktop;
const SidebarDesktop = window.App.Components.SidebarDesktop;

// (Moved to src/config/constants.js)

// (Moved to src/config/constants.js)


// (Moved to src/config/constants.js)

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
// (Moved to src/utils/geoUtils.js)

// (Moved to src/config/constants.js)

/* ------------------------------------------------ */
/* 2. UTILIDADES GEOESPACIALES Y GENERALES */
/* ------------------------------------------------ */

// (Moved to src/utils/geoUtils.js)

// (Moved to src/utils/geoUtils.js)

/* ------------------------------------------------ */
/* 3. ICONOS (SVG) */
/* ------------------------------------------------ */

/* 1. PRIMERO defines el componente base */
// (Icons moved to src/components/ui/Icons.js)


/* ------------------------------------------------ */
/* 4. LÓGICA GEOESPACIAL (GEOJSON & DATOS) */
/* ------------------------------------------------ */

let dataCache = {
  cdmx: null,
  alcaldias: null,
  sc: null,
  edomex: null,
  morelos: null,
  zoning: null,      // PGOEDF (Main)
  anpInternal: null, // Zonificación interna ANP (Archivos D)
  anp: null,         // Polígonos ANP (Archivo C)
  rules: null
};

// (Moved to src/utils/geoUtils.js)

// (Moved to src/utils/geoUtils.js)

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
  const [mainZoning, anpInternalList, rules, edomex, morelos, anp] = await Promise.all([
    fJ(DATA_FILES.ZONIFICACION_MAIN),
    Promise.all((DATA_FILES.ZONIFICACION_FILES || []).map(fJ)),
    fC(DATA_FILES.USOS_SUELO_CSV),
    fJ(DATA_FILES.LIMITES_EDOMEX),
    fJ(DATA_FILES.LIMITES_MORELOS),
    fJ(DATA_FILES.ANP)
  ]);

  dataCache.zoning = mainZoning; // Solo PGOEDF
  dataCache.anpInternal = mergeFeatureCollections(anpInternalList); // Zonificación interna unificada para búsqueda
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
      r.zoningName = "Sin zonificación PGOEDF detectada";
      r.zoningKey = "SC"; // Fallback
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
    // Opcional: filtrar primero por ANP_ID si el geojson interno lo trae,
    // pero findFeature geométrico es lo más seguro.
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
        // Optional: reset activities if needed, or keep PGOEDF as fallback
      }
    }
  }

  return r;
};

/* ------------------------------------------------ */
/* 5. COMPONENTES UI COMPARTIDOS */
/* ------------------------------------------------ */

/* 6.1 Mensajes de estado */

// (Moved to src/components/analysis/ResultsContent.js)

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
// (Moved to src/components/ui/SkeletonAnalysis.js and src/components/analysis/ResultsContent.js)
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
      guinda: '#9d2148',
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
/* 6.5 CONTENIDO PRINCIPAL DEL PANEL */
/* ------------------------------------------------ */
// (Moved to src/components/analysis/ResultsContent.js)

// =====================================================
// ✅ PDF EXPORT CONTROLLER (SINGLETON)
// =====================================================
const PdfExportController = ({ analysis, onExportReady }) => {
  const [mapImage, setMapImage] = useState(null);
  const pdfRef = useRef(null);
  const exportArmedRef = useRef(false);

  // =====================================================
  // ✅ Genera imagen del mapa con capas activas (Leaflet → PNG)
  // =====================================================
  const buildExportMapImage = ({ lat, lng, zoom = 14, analysisStatus }) => {
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
          { color: LAYER_STYLES.edomex.color, weight: 1, dashArray: '4,4', opacity: 0.9, fillOpacity: 0.08 },
          405
        );
      }

      // Morelos
      if (EXPORT_STATE.visibleMapLayers?.morelos) {
        addGeoJson(
          dataCache.morelos,
          { color: LAYER_STYLES.morelos.color, weight: 1, dashArray: '4,4', opacity: 0.9, fillOpacity: 0.08 },
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
            fillOpacity: 0.12
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
      const pinFill = isSC ? LAYER_STYLES.sc.color : isSU ? '#3b82f6' : '#9d2148';

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
      const img = await buildExportMapImage({
        lat: analysis.coordinate.lat,
        lng: analysis.coordinate.lng,
        zoom: 14,
        analysisStatus: analysis.status
      });

      // Si leaflet-image falló, fallback al static map
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

    // 2) Captura de la ficha completa
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

    if (totalPages > 1 && remainder / usableH < 0.28) {
      const targetPages = totalPages - 1;
      const scaleDown = (usableH * targetPages) / imgH;

      if (scaleDown > 0.92) {
        imgW = imgW * scaleDown;
        imgH = (imgProps.height * imgW) / imgProps.width;
        totalPages = Math.max(1, Math.ceil(imgH / usableH));
      }
    }

    const drawPage = (pageIndex) => {
      const yOffset = -(pageIndex * usableH);

      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pdfWidth, M + 10, 'F');

      pdf.setFontSize(9);
      pdf.setTextColor(17, 24, 39);
      pdf.text('Visor de Consulta Ciudadana — Ficha', M, 10);

      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);
      const headRight = `${(analysis?.alcaldia || 'CDMX')} · ${new Date().toISOString().slice(0, 10)}`;
      pdf.text(headRight, pdfWidth - M, 10, { align: 'right' });

      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.2);
      pdf.line(M, 14, pdfWidth - M, 14);

      pdf.addImage(imgData, 'PNG', M, (M + 6) + yOffset, imgW, imgH);

      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, pdfHeight - (M + FOOTER), pdfWidth, (M + FOOTER), 'F');

      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.2);
      pdf.line(M, pdfHeight - (M + FOOTER) + 4, pdfWidth - M, pdfHeight - (M + FOOTER) + 4);

      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);
      pdf.text(`Página ${pageIndex + 1} de ${totalPages}`, pdfWidth / 2, pdfHeight - 6, { align: 'center' });
    };

    for (let i = 0; i < totalPages; i++) {
      if (i > 0) pdf.addPage();
      drawPage(i);
    }

    const cleanAlcaldia = (analysis.alcaldia || 'CDMX')
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .toUpperCase();

    const nombreArchivo = `ficha-${cleanAlcaldia}-${new Date().toISOString().slice(0, 10)}.pdf`;

    pdf.save(nombreArchivo);
  }, [analysis]);

  // ✅ Callbacks para App (Single Source of Truth)
  const requestExportPDF = React.useCallback((e) => {
    if (!e || !e.isTrusted) {
      console.warn("Intento de exportación bloqueado (sin interacción de usuario)");
      return;
    }
    exportArmedRef.current = true;
    handleExportPDF();
  }, [handleExportPDF]);

  useEffect(() => {
    if (!onExportReady) return;
    onExportReady(requestExportPDF);
    return () => onExportReady(null);
  }, [onExportReady, requestExportPDF]);

  if (!analysis) return null;

  return (
    <>
      <div id="export-map" style={{ width: '900px', height: '520px', position: 'absolute', top: '-9999px', left: '-9999px', zIndex: -1 }}></div>
      <div style={{ position: 'absolute', top: -9999, left: -9999, width: '794px', zIndex: -1 }}>
        <PdfFicha ref={pdfRef} analysis={analysis} mapImage={mapImage} />
      </div>
    </>
  );
};

/* ------------------------------------------------ */
/* 7. INTERFAZ: BÚSQUEDA, CONTROLES, SIDEBAR */
/* ------------------------------------------------ */
// (Moved to src/components/search/MobileSearchBar.js)
// (Moved to src/components/search/SearchLogicDesktop.js)
// (Moved to src/components/analysis/ResultsContent.js)
// (Moved to src/components/layout/SidebarDesktop.js)


/* 7.3 Bottom Sheet Móvil */
/* ------------------------------------------------ */
const BottomSheetMobile = ({ analysis, onLocationSelect, onReset, onClose, onStateChange, onExportPDF }) => {
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
        z-[1050]
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
              <h3 className="font-bold text-sm text-[#9d2148] uppercase tracking-wide">
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
              className="p-1.5 rounded-full bg-[#9d2148] shadow-sm active:scale-95 transition"
              aria-label="Cerrar resultados"
              title="Cerrar ficha"
            >
              <Icons.X className="h-4 w-4 text-white" />
            </button>
          )}
        </div>
      </div>

      {(sheetState === 'mid' || sheetState === 'full') && (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-gray-50/50 mobile-upscale">
          <ResultsContent analysis={analysis} onExportPDF={onExportPDF} />
        </div>
      )}

      {analysis && (
        <div className="flex-shrink-0 p-3 bg-white border-t border-gray-200 safe-area-bottom flex gap-3 overflow-x-auto">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${analysis.coordinate.lat},${analysis.coordinate.lng}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-[#9d2148] text-white py-2.5 px-4 rounded-full text-xs font-bold shadow-sm hover:bg-[#7d1d3a] transition-colors"
            title="Ver ubicación en Google Maps"
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
            title="Compartir ubicación"
          >
            <Icons.Share className="h-4 w-4" /> Compartir
          </button>

          <button
            type="button"
            onClick={(e) => {
              if (onExportPDF) onExportPDF(e);
              else alert('No se pudo generar el PDF. Intenta recargar la página.');
            }}
            className="flex-1 min-w-[110px] flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 py-2.5 px-4 rounded-full text-xs font-bold shadow-sm hover:bg-gray-50"
            title="Descargar ficha técnica en PDF"
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
// (Moved to src/components/ui/ToggleSwitch.js)

/* ------------------------------------------------ */
/* 8. VISOR DE MAPA (LEAFLET) */
/* ------------------------------------------------ */
// (Moved to src/components/map/MapViewer.js)

/* ------------------------------------------------ */
/* 8. LEYENDA FLOTANTE (Mejorada - Unificada) */
/* ------------------------------------------------ */
// (Moved to src/components/map/Legend.js)

/* ------------------------------------------------ */
/* 9. APLICACIÓN PRINCIPAL */
/* ------------------------------------------------ */

const App = () => {
  const [loading, setLoading] = useState(true); // Carga inicial (datos)
  const [analyzing, setAnalyzing] = useState(false); // Carga de análisis (geocoding/polígonos)
  const [extraDataLoaded, setExtraDataLoaded] = useState(false);

  const [isHelpOpen, setIsHelpOpen] = useState(false); // ✅ Definir estado ayuda

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



  const [mobileSheetState, setMobileSheetState] = useState('collapsed'); // collapsed | mid | full

  // ✅ acá se guarda la función REAL que exporta el PDF (la define ResultsContent)
  const [exportHandler, setExportHandler] = useState(null);

  // ✅ Wrapper: solo se ejecuta por botón (acción del usuario)
  const handleExportClick = React.useCallback((e) => {
    if (typeof exportHandler === 'function') {
      exportHandler(e);
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

    // ✅ FIX: Reset armed state for PDF export to avoid auto-download
    // if (exportArmedRef) exportArmedRef.current = false; // ERROR: exportArmedRef not defined here
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
      <div className="h-screen flex items-center justify-center text-[#9d2148]">
        <Icons.Loader2 className="animate-spin h-10 w-10" />
      </div>
    );
  }

  return (
    <div className={`flex flex-col w-full h-full overflow-hidden bg-[#f3f4f6] ${loading || analyzing ? 'cursor-wait' : ''}`}>


      {/* ✅ HEADER INSTITUCIONAL (Desktop only, or responsive?) - User asked for "start of page" */}
      <InstitutionalHeader />

      {/* ✅ CONTENEDOR PRINCIPAL (Flex Row en Desktop, Col en Mobile) */}
      <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden">

        {/* ✅ BARRA SUPERIOR MÓVIL (APP HEADER) */}
        <div className="md:hidden absolute top-0 left-0 right-0 z-[1045] p-3 pointer-events-none">
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
          onExportPDF={handleExportClick}
          desktopSearchSetRef={desktopSearchInputRef}
          isLoading={analyzing}
          onOpenHelp={() => setIsHelpOpen(true)} // ✅ Pasar handler
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
            dataCache={dataCache}
          />

          {/* Loading Overlay - Only on initial data load, NOT analysis */}
          {loading && (
            <div className="absolute inset-0 z-[2000] bg-white/60 backdrop-blur-sm flex items-center justify-center animate-fade-in">
              <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-gray-200 border-l-[#9d2148] rounded-full animate-spin mb-3"></div>
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

          {/* CONTROLES DE MAPA (NUEVA UI UNIFICADA) */}
          <div className="absolute top-20 md:top-24 right-4 flex flex-col items-end gap-2.5 pointer-events-auto z-[1000]">

            {/* 1. Ayuda */}
            <button
              type="button"
              onClick={() => setIsHelpOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 text-[#9d2148] hover:scale-105 active:scale-95 transition"
              title="Ayuda"
              aria-label="Ayuda"
            >
              <span className="font-bold text-lg">?</span>
            </button>

            {/* 2. Capas */}
            <button
              type="button"
              onClick={() => setIsLegendOpen(v => !v)}
              className={`w-10 h-10 flex items-center justify-center rounded-full shadow-lg border border-gray-200 hover:scale-105 active:scale-95 transition ${isLegendOpen ? 'bg-[#9d2148] text-white' : 'bg-white text-[#9d2148]'}`}
              title="Capas y Simbología"
              aria-label="Capas"
            >
              <Icons.Layers className="h-5 w-5" />
            </button>

            {/* 3. Reset View (Siempre visible) */}
            <button
              type="button"
              onClick={() => resetMapViewRef.current?.()}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 text-[#9d2148] hover:scale-105 active:scale-95 transition"
              title="Restablecer vista"
              aria-label="Restablecer vista"
            >
              <Icons.RotateCcw className="h-5 w-5" />
            </button>

            {/* 4. Mi Ubicación */}
            <button
              type="button"
              onClick={handleUserLocation}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 text-[#9d2148] hover:scale-105 active:scale-95 transition"
              title="Mi ubicación"
              aria-label="Usar mi ubicación actual"
            >
              <Icons.Navigation className="h-5 w-5" />
            </button>

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
        />

        {/* ✅ MODAL DE AYUDA (Restaurado) */}
        <HelpModal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
        />

        {/* ✅ PDF EXPORT CONTROLLER (Singleton) */}
        <PdfExportController analysis={analysis} onExportReady={setExportHandler} />
      </div>
    </div>
  );
};


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ToastProvider>
    <App />
  </ToastProvider>
);

