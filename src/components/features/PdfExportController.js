(function () {
    const { useState, useEffect, useRef } = window.React;

    /* ------------------------------------------------ */
    /* HELPERS INTERNOS SAFE ACCESS */
    /* ------------------------------------------------ */
    // Safe Access imported from Utils
    // Safe Access imported from Utils
    // FIX: Define accessors locally instead of destructuring non-existent 'getUtils' from Utils
    const getConstants = () => window.App?.Constants || {};
    const getUtils = () => window.App?.Utils || {};
    const getIcons = () => window.App?.Components?.Icons || new Proxy({}, { get: () => () => null });

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

    const PdfFicha = window.React.forwardRef(({ analysis, mapImage, includeActivities = true }, ref) => {
        if (!analysis) return null;

        // Safe Access within Render
        const { COLORS, REGULATORY_NOTES, ZONING_CAT_INFO } = getConstants();
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


        // Zoning Logic
        let zoningColor = '#6b7280';
        if (isANP) {
            zoningColor = COLORS?.anp || '#9d2148';
        } else if (analysis.zoningKey === 'NODATA') {
            zoningColor = '#9ca3af';
        } else if (analysis.zoningKey && getZoningColor) {
            zoningColor = getZoningColor(analysis.zoningKey);
        }

        // Resolve Friendly Name using Map if available, else fallback to zoningName
        let friendlyName = analysis.zoningName || 'Sin información';
        if (ZONING_CAT_INFO && analysis.zoningKey && ZONING_CAT_INFO[analysis.zoningKey]?.label) {
            friendlyName = ZONING_CAT_INFO[analysis.zoningKey].label;
        }

        const zoningDisplay = isANP ? 'ÁREA NATURAL PROTEGIDA' :
            analysis.zoningKey === 'NODATA' ? 'Información no disponible' :
                friendlyName;




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

        // --- CITIZEN SUMMARY LOGIC ---
        const getExplanation = () => {
            const { status, zoningKey, isANP, alcaldia } = analysis;
            if (status === 'OUTSIDE_CDMX') {
                const estado = analysis.outsideContext || 'otro estado';
                return `La ubicación consultada se localiza en el ${estado}. Las regulaciones de la Ciudad de México no aplican en este territorio. La determinación normativa corresponde a las autoridades locales del ${estado}.`;
            }
            if (status === 'URBAN_SOIL') {
                if (isANP) return `Aunque es zona urbana, este punto está dentro de una Área Natural Protegida. Esto significa que la prioridad es el medio ambiente y aplican reglas especiales de conservación por encima de las normas urbanas comunes.`;
                return `Te encuentras en Suelo Urbano. Aquí predominan las actividades residenciales, comerciales y de servicios. Las reglas de construcción dependen de la SEDUVI y del Plan de Desarrollo Urbano de ${alcaldia || 'la alcaldía'}.`;
            }
            if (status === 'CONSERVATION_SOIL') {
                if (isANP) return `¡Estás en una zona muy importante! Este punto es parte de una Área Natural Protegida (ANP). Su objetivo principal es preservar la biodiversidad. Aquí las construcciones están muy restringidas y se sigue un Plan de Manejo específico.`;
                switch (zoningKey) {
                    case 'RE': return `Estás en una zona de Rescate Ecológico. Estas áreas han sido afectadas por actividades humanas pero buscamos restaurarlas. La prioridad es reforestar y evitar que la mancha urbana crezca más.`;
                    case 'FC': case 'FCE': case 'FP': case 'FPE': return `Estás en una zona Forestal. Es el pulmón de la ciudad. Aquí la prioridad absoluta es mantener el bosque sano. Prácticamente no se permite construir viviendas ni comercios para proteger el agua y el aire de todos.`;
                    case 'PR': case 'PRA': return `Estás en una zona de Producción Rural. Aquí se fomenta la agricultura y la agroindustria tradicional. Se permiten actividades del campo, pero no fraccionamientos residenciales urbanos.`;
                    case 'AE': case 'AEE': case 'AF': case 'AFE': return `Estás en una zona Agroecológica. Se busca un equilibrio entre la agricultura tradicional y el cuidado de la naturaleza. Puedes cultivar la tierra, siempre y cuando uses técnicas amigables con el medio ambiente.`;
                    case 'PDU_ER': return `Estás en una zona de Equipamiento Rural. Aquí se permiten instalaciones necesarias para la comunidad rural, como escuelas, centros de salud o deportivos, siempre bajo reglas estrictas.`;
                    case 'PDU_PR': return `Estás en un Poblado Rural. Es una comunidad histórica dentro del suelo de conservación. Tienen reglas especiales que permiten vivienda y comercio local, pero siempre limitando el crecimiento hacia el bosque.`;
                    default: return `Te encuentras en Suelo de Conservación. Es la reserva ecológica de la ciudad (bosques, humedales, zonas agrícolas). Aquí no aplican las normas urbanas comunes y el objetivo es evitar la urbanización para proteger los servicios ambientales.`;
                }
            }
            return null;
        };
        const summaryText = getExplanation();

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
                    <div id="pdf-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '35px', borderBottom: `2px solid ${C.dorado}`, paddingBottom: '15px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <img src="./assets/logo-sedema.png" alt="SEDEMA" style={{ height: '65px', objectFit: 'contain', display: 'block', marginBottom: '10px' }} />
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
                        <div style={styleH2}>Ubicación del Punto</div>
                        <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                            <div style={{ flex: '1' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                                    <tbody>
                                        {/* Row 1: Entidad & Coordenadas */}
                                        <tr>
                                            <td style={{ verticalAlign: 'top', width: '50%', paddingRight: '15px', paddingBottom: '10px' }}>
                                                <Box title="Entidad Federativa">
                                                    {isOutside ? (outsideContextName || 'Otro Estado') : 'Ciudad de México'}
                                                </Box>
                                            </td>
                                            <td style={{ verticalAlign: 'top', width: '50%', paddingBottom: '10px' }}>
                                                <Box title="Coordenadas Geográficas">
                                                    <span style={{ fontFamily: T.mono, fontSize: '11px', background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                                                        {coordText}
                                                    </span>
                                                </Box>
                                            </td>
                                        </tr>

                                        {/* Row 2: Alcaldia (Conditional) */}
                                        {!isOutside && (
                                            <tr>
                                                <td style={{ verticalAlign: 'top', paddingRight: '15px', paddingBottom: '10px' }}>
                                                    <Box title="Alcaldía">{analysis.alcaldia || 'N/D'}</Box>
                                                </td>
                                                <td style={{ verticalAlign: 'top', paddingBottom: '10px' }}></td>
                                            </tr>
                                        )}

                                        {/* Row 3: Direccion (Full width) */}
                                        <tr>
                                            <td colSpan="2" style={{ verticalAlign: 'top', paddingBottom: '10px' }}>
                                                <Box title="Dirección Aproximada / Lugar">{direccion}</Box>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
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

                        {isOutside ? (
                            <div style={{ background: '#FFF5F5', padding: '20px', borderRadius: '6px', border: `1px solid ${C.red}`, textAlign: 'center' }}>
                                <div style={{ fontSize: '14px', fontWeight: 800, color: C.red, marginBottom: '10px', textTransform: 'uppercase' }}>
                                    Fuera de Jurisdicción de la CDMX
                                </div>
                                <div style={{ fontSize: '11px', color: C.ink, lineHeight: 1.5, maxWidth: '600px', margin: '0 auto' }}>
                                    El punto consultado no se encuentra dentro del territorio de la Ciudad de México.
                                    La Secretaría del Medio Ambiente de la CDMX no tiene atribuciones para determinar la normatividad urbana o ambiental en esta ubicación.
                                    <br /><br />
                                    Le sugerimos consultar a las autoridades estatales o municipales correspondientes de <strong>{outsideContextName || 'la entidad federativa respectiva'}</strong>.
                                </div>
                            </div>
                        ) : (
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

                                {/* COL 2: ZONIFICACION / ANP */}
                                {/* COL 2: ZONIFICACION / ANP (STACKED IF BOTH EXIST) */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                                    {/* 1. ZONIFICATION SPECIFIC (Show if exists and is NOT just the ANP fallback) */}
                                    {analysis.zoningKey && analysis.zoningKey !== 'ANP' && (
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '12px', height: '12px', background: zoningColor, border: '1px solid #999', flexShrink: 0 }}></div>
                                                <div style={{ fontSize: '12px', fontWeight: 800, color: C.ink, lineHeight: 1.2 }}>
                                                    {zoningDisplay}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 2. REGIMEN ANP */}
                                    {isANP && (
                                        <div style={{ background: '#FAF5FF', padding: '12px', borderRadius: '4px', border: `1px solid #7E22CE` }}>
                                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#7E22CE', textTransform: 'uppercase', marginBottom: '8px', borderBottom: `1px solid #E9D5FF`, paddingBottom: '4px' }}>Régimen ANP</div>

                                            <div style={{ marginBottom: '6px' }}>
                                                <div style={{ fontSize: '9px', fontWeight: 700, color: C.sub, textTransform: 'uppercase' }}>Nombre Oficial</div>
                                                <div style={{ fontSize: '11px', fontWeight: 800, color: C.ink }}>{analysis.anpNombre || analysis.zoningName || 'Área Natural Protegida'}</div>
                                            </div>

                                            <div style={{ marginBottom: '6px' }}>
                                                <div style={{ fontSize: '9px', fontWeight: 700, color: C.sub, textTransform: 'uppercase' }}>Categoría</div>
                                                <div style={{ fontSize: '10px', color: C.ink }}>{analysis.anpCategoria || 'No disponible'}</div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginBottom: '8px' }}>
                                                <div>
                                                    <div style={{ fontSize: '8px', fontWeight: 700, color: C.sub, textTransform: 'uppercase' }}>Decreto</div>
                                                    <div style={{ fontSize: '10px', color: C.ink }}>{analysis.anpTipoDecreto || 'N/D'}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '8px', fontWeight: 700, color: C.sub, textTransform: 'uppercase' }}>Fecha</div>
                                                    <div style={{ fontSize: '10px', color: C.ink }}>{analysis.anpFechaDecreto || 'N/D'}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '8px', fontWeight: 700, color: C.sub, textTransform: 'uppercase' }}>Superficie</div>
                                                    <div style={{ fontSize: '10px', color: C.ink }}>{analysis.anpSupDecretada ? `${analysis.anpSupDecretada} ha` : 'N/D'}</div>
                                                </div>
                                            </div>

                                            {/* MANAGEMENT PROGRAM LINK */}
                                            <div style={{ marginTop: '8px', borderTop: '1px solid #E9D5FF', paddingTop: '6px' }}>
                                                <div style={{ fontSize: '8px', fontWeight: 700, color: C.sub, textTransform: 'uppercase' }}>Programa de Manejo</div>
                                                <div style={{ fontSize: '9px', color: '#2563EB', wordBreak: 'break-all' }}>
                                                    {analysis.anpUrl ? analysis.anpUrl : 'Consulte en: sedema.cdmx.gob.mx/programas'}
                                                </div>
                                            </div>

                                            <div style={{ fontSize: '10px', color: '#7E22CE', fontStyle: 'italic', lineHeight: 1.3, fontWeight: 500 }}>
                                                Área Natural Protegida: Este punto se encuentra dentro de un ANP y se rige por su Programa de Manejo.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* --- RESUMEN NORMATIVO (CITIZEN SUMMARY) --- */}
                        {summaryText && !isOutside && (
                            <div style={{
                                marginBottom: '15px',
                                background: isOutside ? 'linear-gradient(to bottom right, #fef2f2, #ffffff)' : 'linear-gradient(to bottom right, #eff6ff, #ffffff)',
                                padding: '16px',
                                borderRadius: '8px',
                                border: isOutside ? '1px solid #fca5a5' : '1px solid #bfdbfe',
                                display: 'flex',
                                gap: '12px'
                            }}>
                                <div style={{
                                    flexShrink: 0,
                                    width: '24px',
                                    height: '24px',
                                    background: isOutside ? '#fee2e2' : '#dbeafe',
                                    borderRadius: '50%',
                                    color: isOutside ? '#b91c1c' : '#2563eb',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontFamily: 'serif',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    lineHeight: 1
                                }}>
                                    {isOutside ? '!' : 'i'}
                                </div>
                                <div>
                                    {!isOutside && (
                                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', marginBottom: '4px' }}>
                                            Resumen Normativo
                                        </div>
                                    )}
                                    <div style={{ fontSize: '12px', color: isOutside ? '#991b1b' : '#1e3a8a', lineHeight: 1.5, fontWeight: 500 }}>
                                        {summaryText}
                                    </div>
                                </div>
                            </div>
                        )}



                        {/* --- INSTRUMENTO RECTOR (Urban Only) --- */}
                        {!isOutside && isUrban && !isANP && !isSC && (
                            <div style={{ marginTop: '15px', background: C.panel, padding: '16px', borderRadius: '6px', border: `1px solid ${C.hair}` }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: C.sub, textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>Instrumento Rector</div>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: C.ink, marginBottom: '6px' }}>
                                    Programa Delegacional de Desarrollo Urbano
                                </div>
                                <div style={{ fontSize: '10px', color: C.ink, marginBottom: '10px', lineHeight: 1.4 }}>
                                    Instrumento de planeación urbana que establece los usos, reservas y destinos del suelo.
                                </div>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div style={{ fontSize: '10px', color: C.su, fontWeight: 700, textDecoration: 'underline' }}>
                                        Ver Programas Delegacionales
                                    </div>
                                    <div style={{ fontSize: '10px', color: C.su, fontWeight: 700, textDecoration: 'underline' }}>
                                        Ver Programas Parciales (Zonas Especiales)
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ANP INTERNA */}
                        {analysis.hasInternalAnpZoning && analysis.anpInternalFeature && (
                            <div style={{ marginTop: '10px', padding: '10px', border: `1px solid #7E22CE`, background: '#FAF5FF', borderRadius: '4px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#7E22CE', textTransform: 'uppercase', marginBottom: '4px' }}>Zonificación Interna ANP</div>
                                <div style={{ fontSize: '9px', color: C.sub, textTransform: 'uppercase' }}>Zonificación Programa de Manejo</div>
                                <div style={{ fontSize: '12px', fontWeight: 800, color: C.heading, marginBottom: '6px' }}>
                                    {analysis.anpInternalFeature.properties?.ZONIFICACION || analysis.anpInternalFeature.properties?.CATEGORIA_PROTECCION || 'Zonificación Específica'}
                                </div>
                                <div style={{ fontSize: '10px', color: '#7E22CE', fontStyle: 'italic', fontWeight: 500 }}>
                                    Área Natural Protegida: Este punto se encuentra dentro de un ANP y se rige por su Programa de Manejo.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- SECTION 3: ACTIVIDADES (Solo SC) --- */}
                    {/* CONDITIONAL RENDER: Only if includeActivities is TRUE */}
                    {includeActivities && isSC && !isANP && !analysis.isPDU && !analysis.noActivitiesCatalog && (
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
            </div >
        );
    });

    const PdfExportController = ({ analysis, onExportReady, onProgress, dataCache, visibleMapLayers, activeBaseLayer, visibleZoningCats, currentZoom = 14 }) => {
        // Safe Lazy Access
        // Safe Lazy Access
        const { getConstants: utilsGetConstants, getBaseLayerUrl, getZoningColor } = window.App?.Utils || {};
        const { ZONING_ORDER, LAYER_STYLES, ZONING_CAT_INFO } = utilsGetConstants ? utilsGetConstants() : {};

        const [mapImage, setMapImage] = useState(null);
        // HYBRID MODE STATE: Controls if tables are shown in DOM for capture
        const [includeActivities, setIncludeActivities] = useState(true);

        const pdfRef = useRef(null);
        const exportArmedRef = useRef(false);
        const exportMapInstance = useRef(null);

        // --- A. DIAGNOSTICS & HELPERS ---

        // Helper for Grouping Table Rows
        const processGroupedData = (items) => {
            if (!items || !items.length) return [];
            // Sort by General Activity to ensure adjacency
            const sorted = [...items].sort((a, b) => (a.general || '').localeCompare(b.general || ''));

            const body = [];
            let lastGen = null;
            let currentGroup = [];

            // Pass 1: Group
            sorted.forEach(item => {
                const gen = item.general || '';
                const spec = item.specific || '';
                if (gen !== lastGen) {
                    if (currentGroup.length > 0) {
                        currentGroup[0].rowSpan = currentGroup.length;
                        body.push(...currentGroup);
                    }
                    currentGroup = [];
                    lastGen = gen;
                    // Start new group
                    currentGroup.push({ content: gen, styles: { valign: 'middle', halign: 'center', fontStyle: 'bold' } });
                    // We need to store the specific alongside. autoTable body format: [ [col1, col2] ]
                    // But if col1 is an object, it works.
                } else {
                    // Same group, push a "null" placeholder or empty string for the first col? 
                    // No, autoTable with rowSpan logic:
                    // The first row has {content: 'A', rowSpan: 2}, 'Spec 1'
                    // The second row has 'Spec 2' (and we skip col 1?? No, we usually pass empty)
                    // Actually simplest is use the `rowSpan` on the first cell object, and just don't output anything for that column in subsequent rows?
                    // Wait, jsPDF-AutoTable expects correct number of cells per row.
                    // We should pass {content: '', styles: {display: 'none'}} maybe?
                    // Or just empty string? Empty string renders an empty cell, borders still drawn.
                    // The standard way is `rowSpan`.
                    currentGroup.push({ content: '', styles: { display: 'none' } }); // Phantom cell 
                }
            });
            // Push last group
            if (currentGroup.length > 0) {
                currentGroup[0].rowSpan = currentGroup.length;
                body.push(...currentGroup);
            }

            // Wait, the above logic constructs a SINGLE flattened array of CELLS? No.
            // body needs to be Array of Arrays.

            // Let's retry Logic:
            const resultRows = [];
            let sameCount = 0;

            for (let i = 0; i < sorted.length; i++) {
                const gen = sorted[i].general || '';
                const spec = sorted[i].specific || '';

                // Look ahead to count identicals
                if (i === 0 || gen !== (sorted[i - 1].general || '')) {
                    // New Group
                    let count = 1;
                    for (let j = i + 1; j < sorted.length; j++) {
                        if ((sorted[j].general || '') === gen) count++;
                        else break;
                    }
                    // Push First Row of Group
                    resultRows.push([
                        { content: gen, rowSpan: count, styles: { valign: 'middle', fontStyle: 'bold' } },
                        spec
                    ]);
                } else {
                    // Subsequent row of same group
                    // Push row with phantom first cell (optional, depending on plugin version, usually just don't include it? 
                    // No, looking at docs, you usually skip the cell in the data array if reusing? 
                    // Actually, commonly you pass `content: ''` but that draws borders. 
                    // Let's try passing just ONE cell for the second column?
                    // No, that shifts it to column 0.
                    // We must pass a cell.
                    // We use the `styles: { display: 'none' }` trick or null?
                    // Let's stick to standard behavior: If rowSpan is used, subsequent rows should NOT contain the cell at that index?
                    // Let's assume standard behavior: YES, DO NOT INCLUDE the spanned cell in subsequent rows.
                    resultRows.push([spec]);
                }
            }
            return resultRows;
        };

        const waitForMapReady = (map) => {
            return new Promise((resolve) => {
                let tilesLoaded = false;
                map.on('load', () => { tilesLoaded = true; });
                if (map._loaded) tilesLoaded = true;
                const check = () => {
                    map.invalidateSize(true);
                    if (tilesLoaded) setTimeout(() => resolve(true), 800);
                    else setTimeout(check, 200);
                };
                setTimeout(() => resolve(true), 4000);
                check();
            });
        };

        const waitForImgLoaded = (container, selector) => {
            return new Promise((resolve) => {
                const img = container.querySelector(selector);
                if (!img) return resolve(true);
                if (img.complete && img.naturalHeight !== 0) return resolve(true);
                img.onload = () => resolve(true);
                img.onerror = () => resolve(true);
                setTimeout(() => resolve(true), 1500);
            });
        };

        const loadLogoData = async () => {
            return new Promise(resolve => {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.onload = () => {
                    const c = document.createElement('canvas');
                    c.width = img.width;
                    c.height = img.height;
                    const ctx = c.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    resolve(c.toDataURL('image/png'));
                };
                img.onerror = () => resolve(null);
                img.src = './assets/logo-sedema.png'; // Local asset
            });
        };

        const buildExportMapImage = ({ lat, lng, zoom, analysisStatus, isANP }) => {
            return new Promise(async (resolve) => {
                try {
                    const L = window.L;
                    const leafletImageFn = window.leafletImage || window.leafletImage?.default;

                    if (window.App?.debug) {
                        console.log('--- EXPORT MAP DIAGNOSTICS ---');
                        console.log('Leaflet available:', !!L);
                        console.log('leafletImage available:', typeof leafletImageFn === 'function');
                    }

                    if (!L || typeof leafletImageFn !== 'function') return resolve(null);

                    const el = document.getElementById('export-map');
                    if (!el) return resolve(null);

                    if (exportMapInstance.current) {
                        try { exportMapInstance.current.remove(); } catch (e) { }
                        exportMapInstance.current = null;
                    }
                    el.innerHTML = '';

                    const m = L.map(el, {
                        zoomControl: false, attributionControl: false, preferCanvas: true,
                        fadeAnimation: false, zoomAnimation: false, markerZoomAnimation: false
                    }).setView([lat, lng], zoom);

                    exportMapInstance.current = m;

                    const baseLayerUrl = (typeof getBaseLayerUrl === 'function')
                        ? getBaseLayerUrl(activeBaseLayer || 'SATELLITE')
                        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

                    const base = L.tileLayer(baseLayerUrl, { crossOrigin: 'anonymous', maxZoom: 19 }).addTo(m);

                    const createPane = (name, zIndex) => {
                        if (!m.getPane(name)) m.createPane(name);
                        m.getPane(name).style.zIndex = zIndex;
                        return name;
                    };

                    const contextPane = createPane('contextPane', 400);
                    const overlayPane = createPane('overlayPane', 450);
                    const markerPane = createPane('markerPane', 600);

                    const addGeoJson = (fc, style, pane) => {
                        try {
                            if (!fc?.features?.length) return;
                            L.geoJSON(fc, { pane, style, interactive: false }).addTo(m);
                        } catch (err) { }
                    };

                    // --- LAYERS ---
                    if (visibleMapLayers?.alcaldias && dataCache?.alcaldias) {
                        addGeoJson(dataCache.alcaldias, { color: '#ffffff', weight: 3, dashArray: '8,4', opacity: 0.9, fillOpacity: 0 }, contextPane);
                    }
                    if (visibleMapLayers?.sc && dataCache?.sc) {
                        addGeoJson(dataCache.sc, { color: LAYER_STYLES?.sc?.color || 'green', weight: 1.8, opacity: 0.9, fillColor: LAYER_STYLES?.sc?.fill, fillOpacity: 0.18 }, overlayPane);
                    }
                    if (visibleMapLayers?.anp && dataCache?.anp) {
                        addGeoJson(dataCache.anp, { color: LAYER_STYLES?.anp?.color || '#9333ea', weight: 2, opacity: 1, fillColor: LAYER_STYLES?.anp?.fill || '#9333ea', fillOpacity: 0.2 }, overlayPane);
                    }
                    if (visibleMapLayers?.zoning && dataCache?.zoning?.features?.length) {
                        const byKey = {};
                        (ZONING_ORDER || []).forEach(k => (byKey[k] = []));
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
                        (ZONING_ORDER || []).forEach((k) => {
                            const isOn = (visibleZoningCats?.[k] !== false);
                            if (!isOn) return;
                            const feats = byKey[k];
                            if (!feats?.length) return;
                            const color = ZONING_CAT_INFO?.[k]?.color || '#9ca3af';
                            addGeoJson({ type: 'FeatureCollection', features: feats }, { color, weight: 1.5, opacity: 0.9, fillColor: color, fillOpacity: 0.2, interactive: false }, overlayPane);
                        });
                    }

                    // --- MARKER (SVG Data URI) ---
                    let bgColor = '#6b7280';
                    if (analysisStatus === 'OUTSIDE_CDMX') bgColor = '#ef4444';
                    else if (analysisStatus === 'CONSERVATION_SOIL') bgColor = LAYER_STYLES?.sc?.color || '#16a34a';
                    else if (isANP) bgColor = '#9333ea';
                    else if (analysisStatus === 'URBAN_SOIL') bgColor = '#3b82f6';

                    const svgString = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24">
                            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                                <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="black" flood-opacity="0.3"/>
                            </filter>
                            <circle cx="12" cy="12" r="8" fill="${bgColor}" stroke="white" stroke-width="2.5" filter="url(#shadow)"/>
                        </svg>
                    `.trim();
                    const iconUrl = 'data:image/svg+xml;base64,' + btoa(svgString);
                    const icon = L.icon({ iconUrl, iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -10] });
                    L.marker([lat, lng], { icon, pane: markerPane, interactive: false }).addTo(m);

                    await waitForMapReady(m);

                    let settled = false;
                    const done = (img) => {
                        if (settled) return; settled = true;
                        if (exportMapInstance.current === m) {
                            try { m.remove(); } catch { }
                            exportMapInstance.current = null;
                        }
                        resolve(img || null);
                    };

                    const capture = () => {
                        try {
                            leafletImageFn(m, (err, canvas) => {
                                if (err || !canvas) return done(null);
                                done(canvas.toDataURL('image/png'));
                            });
                        } catch (err) { done(null); }
                    };

                    const safetyTimeout = setTimeout(() => { capture(); }, 6000);
                    base.on('load', () => { setTimeout(() => { clearTimeout(safetyTimeout); capture(); }, 1200); });
                    setTimeout(() => { if (!settled) capture(); }, 3500);

                } catch (e) { resolve(null); }
            });
        };

        const handleExportPDF = React.useCallback(async () => {
            if (!exportArmedRef.current) return;
            exportArmedRef.current = false;

            // Return a promise to allow caller to await
            return new Promise(async (resolve, reject) => {
                if (onProgress) onProgress(10); // START

                if (!analysis || !pdfRef.current) {
                    reject("No analysis available");
                    if (onProgress) onProgress(0);
                    return;
                }

                if (!window.jspdf?.jsPDF || typeof window.html2canvas !== 'function') {
                    alert('Error: Librería jsPDF/html2canvas no cargada.');
                    reject("Libs missing");
                    return;
                }
                const { jsPDF } = window.jspdf;

                try {
                    // 0. Prepare Constants
                    const folio = `F-${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}`;

                    // 1. Prepare Map Image
                    const hasActiveLayers = visibleMapLayers?.sc || (visibleMapLayers?.zoning && dataCache?.zoning) || visibleMapLayers?.anp || visibleMapLayers?.alcaldias;
                    let img = null;
                    let staticUrl = null;

                    if (!hasActiveLayers) {
                        staticUrl = getStaticMapUrl({ lat: analysis.coordinate.lat, lng: analysis.coordinate.lng, zoom: currentZoom });
                        const staticOk = await preloadImage(staticUrl);
                        if (staticOk) img = staticUrl;
                    }
                    if (!img) {
                        img = await buildExportMapImage({ lat: analysis.coordinate.lat, lng: analysis.coordinate.lng, zoom: currentZoom, analysisStatus: analysis.status, isANP: analysis.isANP });
                    }
                    if (onProgress) onProgress(40); // MAP READY
                    setMapImage(img);

                    // 2. Prepare View Mode (Hide Activities for Cover)
                    // We force exclude activities in DOM so we capture a clean single-page cover
                    setIncludeActivities(false);

                    // Wait for Render
                    await new Promise(r => setTimeout(r, 200));
                    await waitForImgLoaded(pdfRef.current, 'img[alt="Mapa"]');
                    await waitForImgLoaded(pdfRef.current, 'img[alt="QR visor"]');

                    const element = pdfRef.current;
                    const doc = new jsPDF('p', 'mm', 'a4');
                    const pdfW = doc.internal.pageSize.getWidth();
                    const pdfH = doc.internal.pageSize.getHeight();
                    const hasAutoTable = !!doc.autoTable;

                    // --- HYBRID STRATEGY ---
                    if (hasAutoTable) {
                        // STEP A: Capture Cover Page (DOM -> Image)
                        const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
                        const scale = isMobile ? 1.5 : 2.0; // Reduced to prevent freeze

                        const canvas = await window.html2canvas(element, {
                            scale,
                            useCORS: true,
                            backgroundColor: '#ffffff',
                            logging: false,
                            onclone: (clonedDoc) => {
                                const header = clonedDoc.getElementById('pdf-header-row');
                                if (header) header.style.opacity = '0'; // Hide header in capture to start with whitespace
                            }
                        });
                        const coverImgData = canvas.toDataURL('image/jpeg', 0.8); // JPEG is faster/smaller than PNG
                        if (onProgress) onProgress(70); // COVER READY

                        // Yield to UI thread to prevent "Page Unresponsive"
                        await new Promise(r => setTimeout(r, 100));

                        // Pre-load Logo for headers
                        const logoDataUrl = await loadLogoData();
                        const headersDrawn = {};

                        // Helper for Page Header 
                        const addHeader = (pdfDoc, pageNumber) => {
                            if (headersDrawn[pageNumber]) return 15 + 35; // Already drawn

                            const M = 15;
                            let y = M;
                            if (logoDataUrl) {
                                // FIX LOGO ASPECT RATIO
                                const logoProps = pdfDoc.getImageProperties(logoDataUrl);
                                const desiredW = 20;
                                const ratio = logoProps.height / logoProps.width;
                                const desiredH = desiredW * ratio;
                                pdfDoc.addImage(logoDataUrl, 'PNG', M, y, desiredW, desiredH);
                            }
                            pdfDoc.setFontSize(14);
                            pdfDoc.setFont("helvetica", "bold");
                            pdfDoc.setTextColor(157, 36, 73); // Guinda
                            pdfDoc.text("FICHA INFORMATIVA", pdfW - M, y + 8, { align: 'right' });

                            pdfDoc.setFontSize(9);
                            pdfDoc.setFont("helvetica", "italic");
                            pdfDoc.setTextColor(100);
                            pdfDoc.text("Consulta Ciudadana de Zonificación", pdfW - M, y + 12, { align: 'right' });

                            const dateTitle = analysis.timestamp || new Date().toLocaleString();
                            pdfDoc.setFontSize(8);
                            pdfDoc.setFont("helvetica", "normal");
                            pdfDoc.setTextColor(0);
                            pdfDoc.text(`Folio: ${folio}`, pdfW - M, y + 16, { align: 'right' });
                            pdfDoc.text(`Fecha: ${dateTitle}`, pdfW - M, y + 20, { align: 'right' });

                            // Golden Line moved BELOW Page Number area (approx y+28)
                            pdfDoc.setDrawColor(212, 193, 156); // Dorado
                            pdfDoc.setLineWidth(0.5);
                            pdfDoc.line(M, y + 28, pdfW - M, y + 28);

                            headersDrawn[pageNumber] = true;
                            return y + 35; // increased top margin
                        };

                        // Add Cover with FAST compression
                        doc.addImage(coverImgData, 'JPEG', 0, 0, pdfW, pdfH, undefined, 'FAST');

                        // DRAW HEADER ON PAGE 1 (Standardized Vector Header)
                        addHeader(doc, 1);

                        // Wait, we need addHeader for Page 1 too now!
                        // We must define addHeader BEFORE this or move this after definition.
                        // The addHeader helper is defined inside the 'hasActivities' block. 
                        // REFACTOR: definition must range up. 
                        // However, simpler: call addHeader inside the loop for ALL pages later? 
                        // No, autoTable needs it.
                        // We will allow the loop at the end to add page numbers, but addHeader helper is local.
                        // Let's rely on the final Loop to add content? 
                        // No, addHeader has the Logo/Folio. 
                        // We need access to addHeader here. 
                        // Since 'addHeader' is currently defined inside `if (hasActivities)`, we can't use it for Page 1 easily if hasActivities is false.
                        // But wait, the user's report is about consistency.
                        // Assuming hasActivities is true (usually SC). 
                        // If it's Urban, there's no autoTable, so no addHeader definition...
                        // We should move addHeader definition OUT of the `if (hasActivities)` block?
                        // Yes.

                        // STEP B: Append Native Table Pages (if SC)
                        const isSC = analysis.status === 'CONSERVATION_SOIL';
                        const isANP = analysis.isANP || analysis.zoningKey === 'ANP';
                        const hasActivities = isSC && !isANP && !analysis.isPDU && !analysis.noActivitiesCatalog;

                        if (hasActivities) {
                            const M = 15;
                            const gap = 8;
                            const colW = (pdfW - (2 * M) - gap) / 2;

                            doc.addPage();
                            const startPage = doc.internal.getCurrentPageInfo().pageNumber;
                            // Removed addHeader here? No, we need it. 
                            // Actually, table calls addHeader via didDrawPage.
                            // But for Page 1 we must call it manually.
                            let startY = addHeader(doc, startPage);

                            // Data Preparation with Grouping
                            const allowed = processGroupedData(analysis.allowedActivities || []);
                            const prohibited = processGroupedData(analysis.prohibitedActivities || []);

                            // --- TABLE LEFT (Activities Allowed) ---
                            let finalYLeft = startY;
                            let finalPageLeft = startPage;

                            if (allowed.length > 0) {
                                doc.setFontSize(10);
                                doc.setTextColor(21, 128, 61); // Green
                                doc.setFont("helvetica", "bold");

                                doc.text("PERMITIDAS", M, startY);
                                doc.setFontSize(8);
                                doc.setTextColor(100);
                                doc.setFont("helvetica", "normal");
                                doc.text("Esta tabla detalla las actividades permitidas en la zona, conforme a la normatividad vigente.", M, startY + 4, { maxWidth: colW });

                                const tableStartY = startY + 12;

                                doc.autoTable({
                                    startY: tableStartY,
                                    head: [['Actividad', 'Detalle']],
                                    body: allowed,
                                    theme: 'plain', // Custom styling
                                    headStyles: { fillColor: [21, 128, 61], textColor: 255, fontSize: 8, fontStyle: 'bold', halign: 'center', valign: 'middle' },
                                    styles: { fontSize: 5, cellPadding: 1.5, overflow: 'linebreak', halign: 'left', valign: 'middle', lineColor: [230, 230, 230], lineWidth: 0.1 },
                                    alternateRowStyles: { fillColor: [248, 248, 248] }, // Zebra
                                    columnStyles: { 0: { cellWidth: 25, fontStyle: 'bold' }, 1: { cellWidth: 'auto' } },
                                    tableWidth: colW,
                                    margin: { left: M, top: 45 },
                                    didDrawPage: (data) => {
                                        addHeader(doc, data.pageNumber);
                                    }
                                });
                                finalYLeft = doc.lastAutoTable.finalY;
                                finalPageLeft = doc.internal.getCurrentPageInfo().pageNumber;
                            }

                            // --- TABLE RIGHT (Activities Prohibited) ---
                            // Reset cursor to start parallel render
                            doc.setPage(startPage);

                            let finalYRight = startY;
                            let finalPageRight = startPage;

                            if (prohibited.length > 0) {
                                const leftM = M + colW + gap;
                                doc.setFontSize(10);
                                doc.setTextColor(185, 28, 28); // Red
                                doc.setFont("helvetica", "bold");

                                doc.text("PROHIBIDAS", leftM, startY);
                                doc.setFontSize(8);
                                doc.setTextColor(100);
                                doc.setFont("helvetica", "normal");
                                doc.text("Esta tabla detalla las actividades prohibidas.", leftM, startY + 4, { maxWidth: colW });

                                const tableStartY = startY + 12;

                                doc.autoTable({
                                    startY: tableStartY,
                                    head: [['Actividad', 'Detalle']],
                                    body: prohibited,
                                    theme: 'plain',
                                    headStyles: { fillColor: [185, 28, 28], textColor: 255, fontSize: 8, fontStyle: 'bold', halign: 'center', valign: 'middle' },
                                    styles: { fontSize: 5, cellPadding: 1.5, overflow: 'linebreak', halign: 'left', valign: 'middle', lineColor: [230, 230, 230], lineWidth: 0.1 },
                                    alternateRowStyles: { fillColor: [248, 248, 248] }, // Zebra
                                    columnStyles: { 0: { cellWidth: 25, fontStyle: 'bold' }, 1: { cellWidth: 'auto' } },
                                    tableWidth: colW,
                                    margin: { left: leftM, top: 45 },
                                    didDrawPage: (data) => {
                                        addHeader(doc, data.pageNumber);
                                    }
                                });
                                finalYRight = doc.lastAutoTable.finalY;
                                finalPageRight = doc.internal.getCurrentPageInfo().pageNumber;
                            }

                            // Sync Doc to Content End (Max of both)
                            const maxPage = Math.max(finalPageLeft, finalPageRight);
                            doc.setPage(maxPage);
                        }

                        // --- FINAL: ADD PAGE NUMBERS TO ALL PAGES ---
                        const totalPages = doc.internal.getNumberOfPages();

                        for (let i = 1; i <= totalPages; i++) {
                            doc.setPage(i);
                            const isCover = (i === 1);

                            // On Cover (Image), we overlay text at the same position as the header
                            // M = 15. Header ends around y=35.
                            // We need to match the specific layout: Right aligned.

                            // Page Number Position
                            const footerY = 39; // y=15 + 24 = 39. Below Date (35), Above Line (43)

                            // Call Header for Page 1 if not done (only if drawing vector header)
                            // But we need the definition. 
                            // It's cleaner to just accept we moved logic. 
                            // Let's stick to the current plan: 
                            // 1. Move addHeader definition UP.
                            // 2. Call addHeader(doc, 1) if Page 1.

                            doc.setFontSize(8);
                            doc.setTextColor(100);
                            doc.setFont("helvetica", "normal");
                            doc.text(`Página ${i} de ${totalPages}`, pdfW - M, footerY, { align: 'right' });
                        }
                    } else {
                        // Fallback logic
                        doc.text("Vista simplificada", 10, 10);
                    }
                    // --- WATERMARK FUNCTION ---
                    const addWatermark = (pdfDoc, pageNum, total) => {
                        pdfDoc.setPage(pageNum);
                        pdfDoc.saveGraphicsState();
                        pdfDoc.setGState(new pdfDoc.GState({ opacity: 0.1 }));
                        pdfDoc.setFontSize(40);
                        pdfDoc.setTextColor(150, 150, 150);
                        pdfDoc.setFont('helvetica', 'bold');

                        // Rotate 45 degrees around center
                        // Translate to center first
                        const cx = pdfW / 2;
                        const cy = pdfH / 2;

                        // jsPDF rotation is slightly tricky without advance API, 
                        // but we can use text rotation parameter.
                        pdfDoc.text('DOCUMENTO INFORMATIVO', cx, cy, { align: 'center', angle: 45 });
                        pdfDoc.text('SIN VALIDEZ LEGAL', cx, cy + 15, { align: 'center', angle: 45 });

                        pdfDoc.restoreGraphicsState();
                    };

                    // --- GLOBAL FOOTER: PAGINATION & DISLAIMER ---
                    const totalPages = doc.internal.getNumberOfPages();
                    for (let i = 1; i <= totalPages; i++) {
                        doc.setPage(i);

                        // Apply Watermark
                        addWatermark(doc, i, totalPages);

                        // Disclaimer
                        doc.setFontSize(7);
                        doc.setTextColor(150);
                        doc.setFont("helvetica", "italic");
                        doc.text("Este no es un documento oficial. Consulte la Ventanilla Única de la SEDEMA para trámites oficiales.", pdfW / 2, pdfH - 14, { align: 'center' });

                        // Page Number
                        doc.setFontSize(8);
                        doc.setTextColor(150);
                        doc.setFont("helvetica", "normal");
                        const pageText = `Página ${i} de ${totalPages}`;
                        doc.text(pageText, pdfW / 2, pdfH - 10, { align: 'center' });
                    }

                    if (onProgress) onProgress(90); // TABLES DONE

                    // --- FILENAME GENERATION HELPER ---
                    const generateDetailedFilename = () => {
                        const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
                        const folio = `F${timestamp}`;

                        let type = 'ND'; // No detemined
                        const { status, zoningKey, isANP, alcaldia, outsideContext } = analysis;

                        if (status === 'OUTSIDE_CDMX') {
                            type = 'EXTERNO';
                        } else if (status === 'URBAN_SOIL') {
                            type = 'SU';
                            if (isANP) type += '-ANP';
                        } else if (status === 'CONSERVATION_SOIL') {
                            type = 'SC';
                            if (zoningKey) type += `-${zoningKey}`;
                            if (isANP) type += '-ANP';
                        }

                        let location = 'CDMX';
                        if (status === 'OUTSIDE_CDMX') {
                            location = outsideContext || 'EDOMEX';
                        } else {
                            location = alcaldia || 'CDMX';
                        }

                        // Sanitize
                        const cleanType = type.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
                        const cleanLoc = location.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();

                        return `FICHA_${folio}_${cleanType}_${cleanLoc}.pdf`;
                    };

                    const filename = generateDetailedFilename();
                    doc.save(filename);

                    // --- END SAVE ---
                    resolve();
                } catch (error) {
                    console.error("PDF Export failed:", error);
                    reject(error);
                }
            });
        }, [analysis, dataCache, visibleMapLayers, activeBaseLayer, visibleZoningCats, currentZoom]);

        const requestExportPDF = React.useCallback(async (e) => {
            if (!e || !e.isTrusted) return;
            exportArmedRef.current = true;
            return await handleExportPDF(); // Forward promise
        }, [handleExportPDF]);

        useEffect(() => {
            if (!onExportReady) return;
            onExportReady(() => requestExportPDF);
            return () => onExportReady(null);
        }, [onExportReady, requestExportPDF]);

        if (!analysis) return null;

        return (
            <>
                <div id="export-map" style={{ width: '900px', height: '520px', position: 'absolute', top: '-9999px', left: '-9999px', zIndex: -1 }}></div>
                <div style={{ position: 'absolute', top: -9999, left: -9999, width: '794px', zIndex: -1 }}>
                    <div style={{ background: '#ffffff' }}>
                        {/* Include Activities controlled by State */}
                        <PdfFicha ref={pdfRef} analysis={analysis} mapImage={mapImage} includeActivities={includeActivities} />
                    </div>
                </div>
            </>
        );
    };

    window.App.Components.PdfExportController = PdfExportController;
})();
