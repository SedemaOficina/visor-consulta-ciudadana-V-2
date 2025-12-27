(function () {
    const { useState, useEffect, useRef } = window.React;

    /* ------------------------------------------------ */
    /* HELPERS INTERNOS SAFE ACCESS */
    /* ------------------------------------------------ */
    const getConstants = () => window.App?.Constants || {};
    const getUtils = () => window.App?.Utils || {};

    const getStaticMapUrl = ({ lat, lng, zoom = 14, width = 900, height = 520 }) => {
        const clampedW = Math.min(Math.max(width, 300), 1280);
        const clampedH = Math.min(Math.max(height, 200), 1280);
        const overlay = `pin-s+9d2449(${lng},${lat})`;
        const token = getConstants().MAPBOX_TOKEN;

        if (!token) return '';

        return (
            `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/` +
            `${overlay}/${lng},${lat},${zoom}/${clampedW}x${clampedH}` +
            `?access_token=${token}&logo=false&attribution=false`
        );
    };

    const preloadImage = (src) =>
        new Promise((resolve) => {
            if (!src) return resolve(false);
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = src;
        });


    /* ------------------------------------------------ */
    /* COMPONENTES DE APOYO */
    /* ------------------------------------------------ */

    const QrCodeImg = ({ value, size = 74 }) => {
        const holderRef = useRef(null);
        const [src, setSrc] = useState(null);

        useEffect(() => {
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

            setTimeout(() => {
                const canvas = holderRef.current?.querySelector('canvas');
                if (canvas) setSrc(canvas.toDataURL('image/png'));
            }, 50);
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

    const PdfFicha = window.React.forwardRef(({ analysis, mapImage }, ref) => {
        if (!analysis) return null;

        // Safe Access within Render
        const { COLORS, REGULATORY_NOTES } = getConstants();
        const { getZoningColor } = getUtils();

        const fecha = analysis.timestamp || new Date().toLocaleString();
        // Folio includes seconds now (14 chars: YYYYMMDDHHmmss)
        const folio = `F-${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}`;

        const isUrban = analysis.status === 'URBAN_SOIL';
        const isSC = analysis.status === 'CONSERVATION_SOIL';
        const isOutside = analysis.status === 'OUTSIDE_CDMX';
        const outsideContextName = analysis.outsideContext || null;
        const isANP = analysis.isANP || analysis.zoningKey === 'ANP';

        const statusLabel =
            isSC ? 'Suelo de Conservación' :
                isUrban ? 'Suelo Urbano' :
                    isOutside ? 'Fuera de la Ciudad de México' :
                        'Información no disponible';

        const direccion =
            analysis.address ||
            analysis.placeName ||
            analysis.label ||
            'Sin dirección disponible (consulta por coordenadas).';

        const coordText = `${analysis.coordinate.lat.toFixed(5)}, ${analysis.coordinate.lng.toFixed(5)}`;
        const visorUrl = `${window.location.origin}${window.location.pathname}?lat=${analysis.coordinate.lat}&lng=${analysis.coordinate.lng}&open=1`;
        const visorUrlShort = `${window.location.origin}${window.location.pathname}`;

        const detalleProhibidas = analysis.prohibitedActivities || [];
        const detallePermitidas = analysis.allowedActivities || [];

        // Colors
        let soilBadgeBg = '#e5e7eb';
        let soilBadgeColor = '#374151';

        if (isSC) {
            soilBadgeBg = '#3B7D23';
            soilBadgeColor = '#ffffff';
        } else if (isUrban) {
            soilBadgeBg = '#3b82f6';
            soilBadgeColor = '#ffffff';
        }

        const soilBg = soilBadgeBg;
        const soilFg = soilBadgeColor;

        // Zoning Logic
        let zoningColor = '#6b7280';
        if (isANP) {
            zoningColor = COLORS?.anp || '#9d2148';
        } else if (analysis.zoningKey === 'NODATA') {
            zoningColor = '#9ca3af';
        } else if (analysis.zoningKey && typeof getZoningColor === 'function') {
            zoningColor = getZoningColor(analysis.zoningKey);
        }

        const zoningDisplay = isANP ? 'ÁREA NATURAL PROTEGIDA' :
            analysis.zoningKey === 'NODATA' ? 'Información no disponible' :
                (analysis.zoningName || 'Sin información');

        let bandColor = '#e5e7eb';
        if (isANP) bandColor = '#e9d5ff';
        else if (isSC) bandColor = '#3B7D23';
        else if (isUrban) bandColor = '#3b82f6';


        const T = {
            font: 'Roboto, Arial, sans-serif',
            mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            base: 10,       // Reduced slightly for density
            small: 8.5,
            micro: 7.5,
            h1: 15,         // Larger Header
            h2: 12,
            lead: 10,
            lh: 1.2
        };

        const S = {
            pageW: 794,
            pagePad: 30,    // Increased margins
            gap1: 5,
            gap2: 12,
            gap3: 20,
            radius: 4,
            hair: '1px solid #d1d5db' // Slightly darker hair
        };

        // OFFICIAL PALETTE (Based on InstitutionalHeader)
        const C = {
            ink: '#333333',     // Dark Gray (Gris Oscuro)
            sub: '#666666',     // Medium Gray
            guinda: '#9D2449',  // Guinda Oficial
            dorado: '#D4C19C',  // Dorado Oficial
            gris: '#B38E5D',    // (Variant, using Dorado/Gris blend usually, adhering to header usage)
            hair: '#d1d5db',
            panel: '#f8f9fa',
            sc: '#3B7D23',
            su: '#2563EB',      // Brighter Blue for digital
            red: '#B91C1C',
            green: '#15803D'
        };

        const styleH2 = {
            fontSize: `${T.h2}px`,
            fontWeight: 700,
            color: C.guinda,
            borderBottom: `2px solid ${C.dorado}`,
            paddingBottom: '4px',
            marginBottom: `${S.gap2}px`,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
        };

        const styleLabel = {
            fontSize: `${T.small}px`,
            color: C.sub,
            fontWeight: 600,
            textTransform: 'uppercase',
            marginBottom: '2px'
        };

        const styleValue = {
            fontSize: `${T.base}px`,
            color: C.ink,
            fontWeight: 400
        };

        const Box = ({ title, children, style }) => (
            <div style={{ ...style }}>
                <div style={styleLabel}>{title}</div>
                <div style={styleValue}>{children}</div>
            </div>
        );

        // Table Styles
        const tblC = {
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: `${T.small}px`
        };
        const thC = {
            textAlign: 'left',
            padding: '6px 8px',
            borderBottom: `2px solid ${C.dorado}`,
            color: C.guinda,
            fontWeight: 700,
            verticalAlign: 'bottom'
        };
        const tdC = (i) => ({
            padding: '6px 8px',
            borderBottom: `1px solid ${C.hair}`,
            backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb',
            color: C.ink,
            verticalAlign: 'top'
        });

        return (
            <div
                ref={ref}
                style={{
                    width: `${S.pageW}px`,
                    minHeight: '1080px', // A4 Height Context
                    padding: `40px 50px`, // Extended margins
                    fontFamily: T.font,
                    fontSize: `${T.base}px`,
                    lineHeight: T.lh,
                    color: C.ink,
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between', // Footer push
                    boxSizing: 'border-box'
                }}
            >
                <div>
                    {/* --- HEADER --- */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '35px', borderBottom: `2px solid ${C.dorado}`, paddingBottom: '15px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <img src="./assets/logo-sedema.png" alt="SEDEMA" style={{ height: '65px', objectFit: 'contain', display: 'block', marginBottom: '10px' }} />
                            <div style={{ fontSize: '11px', color: C.sub, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Secretaría del Medio Ambiente</div>
                            <div style={{ fontSize: '10px', color: C.sub }}>Dirección General del Sistema de Áreas Naturales Protegidas</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '18px', fontWeight: 900, color: C.guinda, textTransform: 'uppercase', lineHeight: 1 }}>
                                Ficha Informativa
                            </div>
                            <div style={{ fontSize: '12px', color: C.sub, marginTop: '4px', fontStyle: 'italic', marginBottom: '8px' }}>
                                Consulta Ciudadana de Zonificación
                            </div>
                            <div style={{ fontSize: '10px', color: C.ink, lineHeight: 1.4 }}>
                                <div style={{ marginBottom: '2px' }}><strong>Folio:</strong> <span style={{ fontFamily: T.mono }}>{folio}</span></div>
                                <div><strong>Fecha:</strong> {fecha}</div>
                            </div>
                        </div>
                    </div>

                    {/* --- SECTION 1: UBICACIÓN --- */}
                    <div style={{ marginBottom: '40px' }}>
                        <div style={styleH2}>Ubicación del Predio</div>
                        <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                            <div style={{ flex: '1' }}>
                                <div style={{ marginBottom: '15px' }}>
                                    <Box title="Dirección Aproximada / Lugar">{direccion}</Box>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '20px' }}>
                                    {!isOutside && (
                                        <Box title="Alcaldía">{analysis.alcaldia || 'Ciudad de México'}</Box>
                                    )}
                                    <Box title="Coordenadas Geográficas">
                                        <span style={{ fontFamily: T.mono, fontSize: '11px', background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                                            {coordText}
                                        </span>
                                    </Box>
                                </div>
                            </div>
                            {/* --- MAP --- */}
                            <div style={{ flex: '0 0 320px' }}>
                                <div style={{
                                    border: `1px solid ${C.hair}`,
                                    height: '200px',
                                    backgroundColor: '#f3f4f6',
                                    borderRadius: '6px',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                }}>
                                    {mapImage ? (
                                        <img src={mapImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Mapa" />
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: C.sub, fontSize: '11px', flexDirection: 'column', gap: '5px' }}>
                                            <div className="animate-pulse bg-gray-200 w-full h-full"></div>
                                        </div>
                                    )}
                                </div>
                                <div style={{ marginTop: '8px', fontSize: '9px', color: C.sub, textAlign: 'center', fontStyle: 'italic' }}>
                                    * Ubicación referencial
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- SECTION 2: NORMATIVIDAD --- */}
                    <div style={{ marginBottom: `${S.gap3}px` }}>
                        <div style={styleH2}>Normatividad Aplicable</div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                            {/* COL 1: SUELO */}
                            <div style={{ background: C.panel, padding: '16px', borderRadius: '6px', border: `1px solid ${C.hair}` }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: C.sub, textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>Clasificación de Suelo</div>
                                <div style={{ fontSize: '15px', fontWeight: 800, color: isSC ? C.sc : isUrban ? C.su : C.red, lineHeight: 1.3 }}>
                                    {statusLabel}
                                </div>
                                {isSC && (
                                    <div style={{ fontSize: '10px', color: C.green, marginTop: '6px', fontStyle: 'italic' }}>
                                        Regulado por el PGOEDF 2000
                                    </div>
                                )}
                            </div>

                            {/* COL 2: ZONIFICACION */}
                            {(!isUrban || analysis.zoningKey) && !isOutside && (
                                <div style={{ background: C.panel, padding: '12px', borderRadius: '4px', border: `1px solid ${C.hair}` }}>
                                    <div style={{ fontSize: '10px', fontWeight: 700, color: C.sub, textTransform: 'uppercase', marginBottom: '8px' }}>Zonificación Específica</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '12px', height: '12px', background: zoningColor, border: '1px solid #999' }}></div>
                                        <div style={{ fontSize: '13px', fontWeight: 800, color: C.ink }}>
                                            {analysis.zoningKey || '—'}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '11px', color: C.ink, marginTop: '4px', fontWeight: 500 }}>
                                        {analysis.zoningName || ''}
                                    </div>
                                </div>
                            )}
                        </div>



                        {/* ANP INTERNA */}
                        {analysis.hasInternalAnpZoning && analysis.anpInternalFeature && (
                            <div style={{ marginTop: '10px', padding: '10px', border: `1px solid ${C.guinda}`, background: '#FFF5F7', borderRadius: '4px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 800, color: C.guinda, textTransform: 'uppercase' }}>Dentro de ANP: {analysis.anpNombre}</div>
                                <div style={{ fontSize: '10px', color: C.ink, marginTop: '2px' }}>
                                    <strong>Categoría:</strong> {analysis.anpCategoria}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- SECTION 3: ACTIVIDADES (Solo SC) --- */}
                    {isSC && !isANP && !analysis.isPDU && !analysis.noActivitiesCatalog && (
                        <div>
                            <div style={styleH2}>Catálogo de Actividades (Suelo de Conservación)</div>

                            <div style={{ marginBottom: '15px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: C.green, marginBottom: '6px', textTransform: 'uppercase' }}>Permitidas</div>
                                {detallePermitidas.length === 0 ? (
                                    <div style={{ fontSize: '10px', fontStyle: 'italic', color: C.sub }}>Sin actividades permitidas específicas listadas.</div>
                                ) : (
                                    <table style={tblC}>
                                        <thead>
                                            <tr>
                                                <th style={{ ...thC, color: C.green, borderBottomColor: C.green }}>Actividad</th>
                                                <th style={{ ...thC, color: C.green, borderBottomColor: C.green }}>Detalle</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detallePermitidas.map((a, i) => (
                                                <tr key={i}>
                                                    <td style={tdC(i)} width="40%"><strong>{a.general}</strong></td>
                                                    <td style={tdC(i)}>{a.specific}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: C.red, marginBottom: '6px', textTransform: 'uppercase' }}>Prohibidas</div>
                                {detalleProhibidas.length === 0 ? (
                                    <div style={{ fontSize: '10px', fontStyle: 'italic', color: C.sub }}>Sin actividades prohibidas específicas listadas.</div>
                                ) : (
                                    <table style={tblC}>
                                        <thead>
                                            <tr>
                                                <th style={{ ...thC, color: C.red, borderBottomColor: C.red }}>Actividad</th>
                                                <th style={{ ...thC, color: C.red, borderBottomColor: C.red }}>Detalle</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detalleProhibidas.map((a, i) => (
                                                <tr key={i}>
                                                    <td style={tdC(i)} width="40%"><strong>{a.general}</strong></td>
                                                    <td style={tdC(i)}>{a.specific}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- FOOTER --- */}
                    <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: `1px solid ${C.dorado}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                            <div style={{ flex: '1' }}>
                                <div style={{ fontSize: '9px', color: C.sub, textAlign: 'justify', lineHeight: 1.4, marginBottom: '5px' }}>
                                    <strong>Aviso Importante:</strong> Este documento es de carácter informativo y orientativo. No constituye un dictamen legal ni sustituye a los Certificados de Zonificación de Uso del Suelo o Trámites oficiales ante la SEDEMA o SEDUVI. La información presentada se basa en las capas geográficas vigentes en el Visor Ciudadano.
                                </div>
                                <div style={{ fontSize: '9px', color: C.sub }}>
                                    Para trámites oficiales, acuda a la Ventanilla Única de la SEDEMA.
                                </div>
                            </div>
                            <div style={{ width: '120px', textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                                <div style={{ fontSize: '9px', fontWeight: 700, color: C.ink }}>
                                    Escanear para validar &rarr;
                                </div>
                                <QrCodeImg value={visorUrl} size={60} />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        );
    });

    const PdfExportController = ({ analysis, onExportReady, dataCache, visibleMapLayers, activeBaseLayer, visibleZoningCats, currentZoom = 14 }) => {
        // Safe Lazy Access
        const { ZONING_ORDER, LAYER_STYLES, ZONING_CAT_INFO } = getConstants();
        const { getBaseLayerUrl, getZoningColor } = getUtils();

        const [mapImage, setMapImage] = useState(null);
        const pdfRef = useRef(null);
        const exportArmedRef = useRef(false);

        // --- A. DIAGNOSTICS & HELPERS ---

        const waitForMapReady = (map) => {
            return new Promise((resolve) => {
                let tilesLoaded = false;

                // 1. Wait for tiles
                map.on('load', () => { tilesLoaded = true; });

                // Fallback check if already loaded
                if (map._loaded) tilesLoaded = true;

                // 2. Wait function
                const check = () => {
                    // Force size update
                    map.invalidateSize(true);

                    if (tilesLoaded) {
                        // Wait extra 800ms for heavy overlays/canvas rendering
                        setTimeout(() => resolve(true), 800);
                    } else {
                        setTimeout(check, 200);
                    }
                };

                // Safety timeout 4s
                setTimeout(() => resolve(true), 4000);
                check();
            });
        };

        const waitForImgLoaded = (container, selector) => {
            return new Promise((resolve) => {
                const img = container.querySelector(selector);
                if (!img) return resolve(true); // No map img present
                if (img.complete && img.naturalHeight !== 0) return resolve(true);

                img.onload = () => resolve(true);
                img.onerror = () => resolve(true); // Proceed anyway
                setTimeout(() => resolve(true), 1500); // Safety
            });
        };

        const buildExportMapImage = ({ lat, lng, zoom, analysisStatus, isANP }) => {
            return new Promise(async (resolve) => {
                try {
                    const L = window.L;
                    const leafletImageFn = window.leafletImage || window.leafletImage?.default;

                    console.log('--- EXPORT MAP DIAGNOSTICS ---');
                    console.log('Leaflet available:', !!L);
                    console.log('leafletImage available:', typeof leafletImageFn === 'function');
                    console.log('Items in Cache:', Object.keys(dataCache || {}));
                    console.log('Visible Layers:', visibleMapLayers);
                    console.log('Active Base:', activeBaseLayer);

                    if (!L || typeof leafletImageFn !== 'function') {
                        console.error('Missing dependencies for map export');
                        return resolve(null);
                    }

                    const el = document.getElementById('export-map');
                    if (!el) return resolve(null);

                    el.innerHTML = '';

                    // Setup Map
                    const m = L.map(el, {
                        zoomControl: false,
                        attributionControl: false,
                        preferCanvas: true,
                        fadeAnimation: false,
                        zoomAnimation: false,
                        markerZoomAnimation: false
                    }).setView([lat, lng], zoom);

                    // Base Layer
                    const baseLayerUrl = (typeof getBaseLayerUrl === 'function')
                        ? getBaseLayerUrl(activeBaseLayer || 'SATELLITE')
                        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

                    const base = L.tileLayer(baseLayerUrl, {
                        crossOrigin: 'anonymous',
                        maxZoom: 19
                    }).addTo(m);

                    // Panes Setup (Matching Visor)
                    const createPane = (name, zIndex) => {
                        if (!m.getPane(name)) m.createPane(name);
                        m.getPane(name).style.zIndex = zIndex;
                        return name;
                    };

                    const contextPane = createPane('contextPane', 400);
                    const overlayPane = createPane('overlayPane', 450);
                    const markerPane = createPane('markerPane', 600);

                    // Helper GeoJSON
                    const addGeoJson = (fc, style, pane) => {
                        try {
                            if (!fc?.features?.length) return;
                            L.geoJSON(fc, { pane, style, interactive: false }).addTo(m);
                        } catch (err) {
                            console.warn('Error adding layer', err);
                        }
                    };

                    // --- ADD VISIBLE LAYERS (WYSIWYG) ---

                    // 1. Context (Alcaldias/Limits)
                    if (visibleMapLayers?.alcaldias && dataCache?.alcaldias) {
                        addGeoJson(dataCache.alcaldias, {
                            color: '#ffffff', weight: 3, dashArray: '8,4', opacity: 0.9, fillOpacity: 0
                        }, contextPane);
                    }

                    // 2. SC (Conservation Soil)
                    if (visibleMapLayers?.sc && dataCache?.sc) {
                        addGeoJson(dataCache.sc, {
                            color: LAYER_STYLES?.sc?.color || 'green',
                            weight: 1.8, opacity: 0.9,
                            fillColor: LAYER_STYLES?.sc?.fill, fillOpacity: 0.18
                        }, overlayPane);
                    }

                    // 3. ANP (Protected Areas) - PREVIOUSLY MISSING
                    if (visibleMapLayers?.anp && dataCache?.anp) {
                        addGeoJson(dataCache.anp, {
                            color: LAYER_STYLES?.anp?.color || '#9333ea',
                            weight: 2, opacity: 1,
                            fillColor: LAYER_STYLES?.anp?.fill || '#9333ea', fillOpacity: 0.2
                        }, overlayPane);
                    }

                    // 4. Zoning
                    if (visibleMapLayers?.zoning && dataCache?.zoning?.features?.length) {
                        const byKey = {};
                        (ZONING_ORDER || []).forEach(k => (byKey[k] = []));

                        // Sort features
                        dataCache.zoning.features.forEach(f => {
                            let k = (f.properties?.CLAVE || '').toString().trim().toUpperCase();
                            if (k === 'PDU' || k === 'PROGRAMAS' || k === 'ZONA URBANA') {
                                const desc = (f.properties?.PGOEDF || '').toLowerCase();
                                if (desc.includes('equipamiento')) k = 'PDU_ER';
                                else if (desc.includes('parcial')) k = 'PDU_PP';
                                else if (desc.includes('poblad') || desc.includes('rural') || desc.includes('habitacional')) k = 'PDU_PR';
                                else if (desc.includes('urbana') || desc.includes('urbano') || desc.includes('barrio')) k = 'PDU_ZU';
                            }
                            if (byKey[k]) byKey[k].push(f);
                        });

                        // Add by Order
                        (ZONING_ORDER || []).forEach((k) => {
                            const isOn = (visibleZoningCats?.[k] !== false);
                            if (!isOn) return;
                            const feats = byKey[k];
                            if (!feats?.length) return;
                            const color = ZONING_CAT_INFO?.[k]?.color || '#9ca3af';

                            addGeoJson({ type: 'FeatureCollection', features: feats }, {
                                color, weight: 1.5, opacity: 0.9,
                                fillColor: color, fillOpacity: 0.2,
                                interactive: false
                            }, overlayPane);
                        });
                    }

                    // 5. Pin/Marker
                    let label = '';
                    let bgColor = '#9ca3af';

                    if (analysisStatus === 'OUTSIDE_CDMX') {
                        label = 'X'; bgColor = '#b91c1c';
                    } else if (analysisStatus === 'CONSERVATION_SOIL') {
                        label = 'SC'; bgColor = LAYER_STYLES?.sc?.color || '#3B7D23';
                    } else if (isANP) {
                        label = 'ANP'; bgColor = '#9333ea';
                    } else if (analysisStatus === 'URBAN_SOIL') {
                        label = 'SU'; bgColor = '#3b82f6';
                    }

                    const iconHtml = `
                      <div style="
                        width:32px;height:32px;background:${bgColor};color:#fff;
                        border:3px solid #fff;border-radius:50%;
                        display:flex;align-items:center;justify-content:center;
                        font-weight:bold;font-size:10px;
                        box-shadow:0 2px 8px rgba(0,0,0,0.25);
                      ">
                        ${label}
                      </div>
                      `;

                    L.marker([lat, lng], {
                        icon: L.divIcon({ html: iconHtml, className: '', iconSize: [32, 32], iconAnchor: [16, 16] }),
                        pane: markerPane
                    }).addTo(m);


                    // --- CAPTURE ---
                    await waitForMapReady(m);

                    leafletImageFn(m, (err, canvas) => {
                        // Cleanup
                        try { m.remove(); } catch { }

                        if (err || !canvas) {
                            console.error('LeafletImage failed:', err);
                            return resolve(null);
                        }

                        const dataUrl = canvas.toDataURL('image/png');
                        // Basic validation (white/empty check could go here)
                        if (dataUrl.length < 1000) {
                            console.warn('LeafletImage returned suspiciously small image');
                        }
                        resolve(dataUrl);
                    });

                } catch (e) {
                    console.error('Critical Error in buildExportMapImage', e);
                    resolve(null);
                }
            });
        };

        const handleExportPDF = React.useCallback(async () => {
            if (!exportArmedRef.current) return;
            exportArmedRef.current = false;

            if (!analysis || !pdfRef.current) return;

            if (!window.jspdf?.jsPDF || typeof window.html2canvas !== 'function') {
                alert('Error: Librerías PDF/Canvas no cargadas.');
                return;
            }
            const { jsPDF } = window.jspdf;

            try {
                // 1. Determine Strategy
                // If ANY overlay is visible (SC, Zoning, ANP, Alcaldias), we MUST use client-render (leaflet-image)
                const hasActiveLayers = visibleMapLayers?.sc ||
                    (visibleMapLayers?.zoning && dataCache?.zoning) ||
                    visibleMapLayers?.anp ||
                    visibleMapLayers?.alcaldias;

                let img = null;
                let staticUrl = null;

                if (!hasActiveLayers) {
                    // Try Static only if strictly NO overlays
                    staticUrl = getStaticMapUrl({
                        lat: analysis.coordinate.lat,
                        lng: analysis.coordinate.lng,
                        zoom: currentZoom
                    });
                    const staticOk = await preloadImage(staticUrl);
                    if (staticOk) img = staticUrl;
                }

                if (!img) {
                    // Fallback or Active Layers -> Leaflet Image
                    img = await buildExportMapImage({
                        lat: analysis.coordinate.lat,
                        lng: analysis.coordinate.lng,
                        zoom: currentZoom,
                        analysisStatus: analysis.status,
                        isANP: analysis.isANP
                    });
                }

                // If both fail, img is null -> PDF will show placeholder
                setMapImage(img);

                // 2. Wait for Image in DOM
                await new Promise(r => setTimeout(r, 50)); // Render cycle
                await waitForImgLoaded(pdfRef.current, 'img[alt="Mapa"]');

                // 3. Verify DOM before capture
                const element = pdfRef.current;

                // 4. Generate PDF
                const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
                const scale = isMobile ? 1.8 : 2.2;

                const canvas = await html2canvas(element, {
                    scale,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    onclone: (doc) => {
                        // Ensure cloned images have cors
                        const maps = doc.querySelectorAll('img[alt="Mapa"]');
                        maps.forEach(m => m.crossOrigin = 'anonymous');
                    }
                });

                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();

                const imgProps = pdf.getImageProperties(imgData);
                const usableW = pdfWidth;
                const imgHeight = (imgProps.height * usableW) / imgProps.width;

                let heightLeft = imgHeight;
                let position = 0;

                if (heightLeft <= pdfHeight) {
                    pdf.addImage(imgData, 'PNG', 0, 0, usableW, imgHeight);
                } else {
                    while (heightLeft > 0) {
                        pdf.addImage(imgData, 'PNG', 0, position, usableW, imgHeight);
                        heightLeft -= pdfHeight;
                        position -= pdfHeight;
                        if (heightLeft > 0) pdf.addPage();
                    }
                }

                const cleanAlcaldia = (analysis.alcaldia || 'CDMX').replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
                pdf.save(`FICHA_${cleanAlcaldia}.pdf`);

            } catch (e) {
                console.error("PDF Fail", e);
                alert("Error al generar PDF.");
                setMapImage(null);
            }
        }, [analysis, dataCache, visibleMapLayers, activeBaseLayer, visibleZoningCats]);

        const requestExportPDF = React.useCallback((e) => {
            if (!e || !e.isTrusted) return;
            exportArmedRef.current = true;
            handleExportPDF();
        }, [handleExportPDF]);

        useEffect(() => {
            if (!onExportReady) return;
            onExportReady(() => requestExportPDF);
            return () => onExportReady(null);
        }, [onExportReady, requestExportPDF]);

        if (!analysis) return null;

        return (
            <>
                {/* Oculto: Contenedor para leaflet-image */}
                <div id="export-map" style={{ width: '900px', height: '520px', position: 'absolute', top: '-9999px', left: '-9999px', zIndex: -1 }}></div>

                {/* Oculto: DOM para html2canvas */}
                <div style={{ position: 'absolute', top: -9999, left: -9999, width: '794px', zIndex: -1 }}>
                    <div style={{ background: '#ffffff' }}>
                        <PdfFicha ref={pdfRef} analysis={analysis} mapImage={mapImage} />
                    </div>
                </div>
            </>
        );
    };

    window.App.Components.PdfExportController = PdfExportController;
})();
