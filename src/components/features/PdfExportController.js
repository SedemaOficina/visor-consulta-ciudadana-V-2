(function () {
    const { useState, useEffect, useRef } = window.React;
    const {
        MAPBOX_TOKEN,
        ZONING_ORDER,
        ZONING_CAT_INFO,
        LAYER_STYLES
    } = window.App.Constants;

    const {
        getZoningColor,
        getZoningStyle,
        getBaseLayerUrl
    } = window.App.Utils;

    /* ------------------------------------------------ */
    /* HELPERS INTERNOS */
    /* ------------------------------------------------ */

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

    const PdfFicha = window.React.forwardRef(({ analysis, mapImage }, ref) => {
        if (!analysis) return null;

        const fecha = analysis.timestamp || new Date().toLocaleString();
        const folio = `F-${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 12)}`;

        const isUrban = analysis.status === 'URBAN_SOIL';
        const isSC = analysis.status === 'CONSERVATION_SOIL';
        const isANP = analysis.isANP || analysis.zoningKey === 'ANP';

        const statusLabel =
            isSC ? 'Suelo de Conservación' :
                isUrban ? 'Suelo Urbano' :
                    analysis.status === 'OUTSIDE_CDMX' ? 'Fuera de la Ciudad de México' :
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

        // Logic Unification
        let zoningColor = '#6b7280';
        if (isANP) {
            zoningColor = '#9d2148'; // Use primary or specific ANP color
            if (window.App.Constants.COLORS && window.App.Constants.COLORS.anp) {
                zoningColor = window.App.Constants.COLORS.anp;
            }
        } else if (analysis.zoningKey === 'NODATA') {
            zoningColor = '#9ca3af';
        } else if (analysis.zoningKey) {
            zoningColor = getZoningColor(analysis.zoningKey);
        }

        const zoningDisplay = isANP ? 'ÁREA NATURAL PROTEGIDA' :
            analysis.zoningKey === 'NODATA' ? 'Información no disponible' :
                (analysis.zoningName || 'Sin información');

        let bandColor = '#e5e7eb';
        if (isANP) bandColor = '#e9d5ff';
        else if (isSC) bandColor = '#3B7D23';
        else if (isUrban) bandColor = '#3b82f6';

        return (() => {
            const T = {
                font: 'Roboto, Arial, sans-serif',
                mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                base: 10.8,
                small: 9.2,
                micro: 8,
                h1: 13.5,
                h2: 11.2,
                lead: 10,
                lh: 1.42
            };

            const S = {
                pageW: 794,
                pagePad: 28,
                gap1: 6,
                gap2: 10,
                gap3: 12,
                radius: 6,
                hair: '1px solid #e5e7eb'
            };

            const COLORS = (window.App.Constants && window.App.Constants.COLORS) ? window.App.Constants.COLORS : {};
            const C = {
                ink: COLORS.text || '#111827',
                sub: COLORS.subtext || '#4b5563',
                mute: '#9ca3af',
                hair: '#e5e7eb',
                panel: '#f9fafb',
                guinda: COLORS.primary || '#9d2148',
                sc: COLORS.sc || '#3B7D23',
                su: COLORS.su || '#3b82f6',
                anp: COLORS.anp || '#7e22ce',
                red: COLORS.error || '#b91c1c',
                green: COLORS.success || '#15803d'
            };

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
                                    fontWeight: 800,
                                    letterSpacing: '0.02em',
                                    color: C.guinda,
                                    lineHeight: 1.15,
                                    textTransform: 'uppercase'
                                }}
                            >
                                Visor de Consulta Ciudadana
                            </div>
                            <div style={{ fontSize: `${T.lead}px`, color: C.sub, marginTop: '3px' }}>
                                Consulta normativa de Suelo Urbano y Suelo de Conservación
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
                    <div
                        style={{
                            height: '4px',
                            borderRadius: '999px',
                            backgroundColor: bandColor,
                            marginBottom: `${S.gap2}px`
                        }}
                    />
                    <div style={{ borderTop: `1px solid ${C.hair}`, marginBottom: `${S.gap2}px` }} />
                    <section style={section(S.gap3)}>
                        <h2 style={h2()}>0. Mapa de referencia y simbología</h2>
                        <div style={{ display: 'flex', gap: '12px' }}>
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
                                                <strong>ANP</strong> — {analysis.anpNombre || '—'}
                                            </span>
                                        </>
                                    ) : analysis?.zoningKey ? (
                                        <>
                                            <span style={{ width: '10px', height: '10px', borderRadius: 2, background: zoningColor, border: '1px solid #9ca3af' }} />
                                            <span style={{ fontSize: `${T.small}px` }}>
                                                <strong>{analysis.zoningKey}</strong> — {analysis.zoningName || '—'}
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
                                {!isUrban && (
                                    <tr style={{ background: tbl.zebra(2) }}>
                                        <td style={tbl.tdLabel}>Zonificación PGOEDF</td>
                                        <td style={tbl.td}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', maxWidth: '100%' }}>
                                                <span
                                                    style={{
                                                        ...badge(zoningColor, '#ffffff'),
                                                        fontWeight: 800,
                                                        maxWidth: '350px',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}
                                                    title={zoningDisplay}
                                                >
                                                    {zoningDisplay}
                                                </span>
                                                {analysis.zoningKey && !['ANP', 'NODATA'].includes(analysis.zoningKey) && (
                                                    <span style={badge('#ffffff', C.ink, zoningColor)}>
                                                        {analysis.zoningKey}
                                                    </span>
                                                )}
                                            </span>
                                        </td>
                                    </tr>
                                )}

                                {/* TARJETA SECUNDARIA ANP (Si tiene zonificación interna) */}
                                {analysis.hasInternalAnpZoning && analysis.anpInternalFeature && (
                                    <>
                                        <tr style={{ background: '#fdf4ff' }}>
                                            <td colSpan="2" style={{ ...tbl.td, border: S.hair, fontWeight: 800, color: C.anp, textAlign: 'center' }}>
                                                DETALLE ÁREA NATURAL PROTEGIDA
                                            </td>
                                        </tr>
                                        <tr style={{ background: tbl.zebra(3) }}>
                                            <td style={tbl.tdLabel}>Nombre ANP</td>
                                            <td style={tbl.td}>
                                                <strong>{analysis.anpInternalFeature.properties?.NOMBRE || analysis.anpNombre || '—'}</strong>
                                            </td>
                                        </tr>
                                        <tr style={{ background: tbl.zebra(4) }}>
                                            <td style={tbl.tdLabel}>Categoría</td>
                                            <td style={tbl.td}>{analysis.anpInternalFeature.properties?.CATEGORIA_PROTECCION || analysis.anpCategoria || '—'}</td>
                                        </tr>
                                        <tr style={{ background: tbl.zebra(5) }}>
                                            <td style={tbl.tdLabel}>Tipo Decreto</td>
                                            <td style={tbl.td}>{analysis.anpInternalFeature.properties?.TIPO_DECRETO || analysis.anpTipoDecreto || '—'}</td>
                                        </tr>
                                        <tr style={{ background: tbl.zebra(6) }}>
                                            <td style={tbl.tdLabel}>Superficie</td>
                                            <td style={tbl.td}>{analysis.anpInternalFeature.properties?.SUP_DECRETADA || analysis.anpSupDecretada || '—'}</td>
                                        </tr>
                                        <tr style={{ background: tbl.zebra(7) }}>
                                            <td style={tbl.tdLabel}>Fecha Decreto</td>
                                            <td style={tbl.td}>{analysis.anpInternalFeature.properties?.FECHA_DECRETO ? new Date(analysis.anpInternalFeature.properties.FECHA_DECRETO).toLocaleDateString() : (analysis.anpFechaDecreto ? new Date(analysis.anpFechaDecreto).toLocaleDateString() : '—')}</td>
                                        </tr>
                                    </>
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
                    {isUrban && (
                        <section style={section(S.gap3)}>
                            <h2 style={h2()}>2. Referencia para Suelo Urbano</h2>
                            <p style={{ fontSize: `${T.base}px`, color: C.sub, textAlign: 'justify', margin: 0 }}>
                                La ubicación consultada se encuentra en Suelo Urbano. La regulación específica del uso del suelo corresponde a los Programas de Desarrollo Urbano aplicables, emitidos por la autoridad competente en materia de desarrollo urbano (SEDUVI). Esta ficha es de carácter orientativo y no sustituye los instrumentos oficiales.
                            </p>
                        </section>
                    )}
                    {isSC && !isANP && !analysis.isPDU && !analysis.noActivitiesCatalog && (
                        <>
                            <section style={section(S.gap2)}>
                                <h2 style={h2(C.red)}>3. Actividades prohibidas</h2>

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

                                    </>
                                )}

                            </section>

                            <section style={section(S.gap2)}>
                                <h2 style={h2()}>5. Notas Normativas Generales y Complementarias</h2>
                                <div style={{
                                    border: `1px solid ${C.hair}`,
                                    padding: '10px 12px',
                                    borderRadius: `${S.radius}px`,
                                    backgroundColor: '#fbfbfc'
                                }}>
                                    <ul style={{ margin: 0, paddingLeft: '16px', listStyleType: 'disc' }}>
                                        {(window.App.Constants.PROVISIONS_NOTES || []).map((note, idx) => (
                                            <li key={idx} style={{
                                                fontSize: `${T.base}px`,
                                                marginBottom: '6px',
                                                textAlign: 'justify',
                                                color: C.ink
                                            }}>
                                                {note}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </section>
                        </>
                    )
                    }
                    <section style={{ marginTop: `${S.gap2}px` }}>
                        <h2 style={h2()}>6. Enlaces de referencia</h2>
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
                    </section >
                </div >
            );
        })();
    });

    const PdfExportController = ({ analysis, onExportReady, dataCache, visibleMapLayers, activeBaseLayer, visibleZoningCats }) => {
        const [mapImage, setMapImage] = useState(null);
        const pdfRef = useRef(null);
        const exportArmedRef = useRef(false);

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

                el.innerHTML = '';
                const m = L.map(el, {
                    zoomControl: false,
                    attributionControl: false,
                    preferCanvas: true
                }).setView([lat, lng], zoom);

                // Wait for tile load manually or just increase timeout
                let tileCount = 0;
                m.on('layeradd', () => tileCount++);

                const base = L.tileLayer(getBaseLayerUrl(activeBaseLayer || 'SATELLITE'), {
                    crossOrigin: 'anonymous',
                    maxZoom: 19
                }).addTo(m);

                const addGeoJson = (fc, style, paneZ = 400) => {
                    if (!fc?.features?.length) return null;
                    const paneName = `p${paneZ}`;
                    if (!m.getPane(paneName)) m.createPane(paneName);
                    m.getPane(paneName).style.zIndex = paneZ;
                    return L.geoJSON(fc, { pane: paneName, style, interactive: false }).addTo(m);
                };

                if (visibleMapLayers?.sc) {
                    addGeoJson(dataCache.sc, { color: LAYER_STYLES.sc.color, weight: 1.8, opacity: 0.9, fillColor: LAYER_STYLES.sc.fill, fillOpacity: 0.18 }, 410);
                }
                if (visibleMapLayers?.alcaldias) {
                    addGeoJson(dataCache.alcaldias, { color: '#ffffff', weight: 3, dashArray: '8,4', opacity: 0.9, fillOpacity: 0 }, 420);
                }
                if (visibleMapLayers?.edomex) {
                    addGeoJson(dataCache.edomex, { color: LAYER_STYLES.edomex.color, weight: 1, dashArray: '4,4', opacity: 0.9, fillOpacity: 0.08 }, 405);
                }
                if (visibleMapLayers?.morelos) {
                    addGeoJson(dataCache.morelos, { color: LAYER_STYLES.morelos.color, weight: 1, dashArray: '4,4', opacity: 0.9, fillOpacity: 0.08 }, 405);
                }
                if (visibleMapLayers?.anp) {
                    addGeoJson(dataCache.anp, { color: LAYER_STYLES.anp.color, weight: 2.2, opacity: 0.95, fillColor: LAYER_STYLES.anp.fill, fillOpacity: 0.12 }, 428);
                }
                if (visibleMapLayers?.zoning && dataCache.zoning?.features?.length) {
                    const byKey = {};
                    ZONING_ORDER.forEach(k => (byKey[k] = []));
                    dataCache.zoning.features.forEach(f => {
                        let k = (f.properties?.CLAVE || '').toString().trim().toUpperCase();

                        // Lógica PDU idéntica a MapViewer
                        if (k === 'PDU' || k === 'PROGRAMAS' || k === 'ZONA URBANA') {
                            const desc = (f.properties?.PGOEDF || '').toLowerCase();
                            if (desc.includes('equipamiento')) k = 'PDU_ER';
                            else if (desc.includes('parcial')) k = 'PDU_PP';
                            else if (desc.includes('poblad') || desc.includes('rural') || desc.includes('habitacional')) k = 'PDU_PR';
                            else if (desc.includes('urbana') || desc.includes('urbano') || desc.includes('barrio')) k = 'PDU_ZU';
                        }

                        if (byKey[k]) byKey[k].push(f);
                    });
                    ZONING_ORDER.forEach((k, idx) => {
                        const isOn = (visibleZoningCats?.[k] !== false);
                        if (!isOn) return;
                        const feats = byKey[k];
                        if (!feats?.length) return;

                        const color = ZONING_CAT_INFO[k]?.color || '#9ca3af';
                        addGeoJson({ type: 'FeatureCollection', features: feats }, {
                            color,
                            weight: 1.5,
                            opacity: 0.9, // Reduced slightly for PDF clarity
                            fillColor: color,
                            fillOpacity: 0.2,
                            interactive: false
                        }, 430 + idx);
                    });
                }

                const isSC = (analysisStatus === 'CONSERVATION_SOIL');
                const isSU = (analysisStatus === 'URBAN_SOIL');
                const pinFill = isSC ? LAYER_STYLES.sc.color : isSU ? '#3b82f6' : '#9d2148';

                L.circleMarker([lat, lng], { radius: 8, color: '#ffffff', weight: 3, fillColor: pinFill, fillOpacity: 1 }).addTo(m);

                let settled = false;
                const done = (img) => {
                    if (settled) return;
                    settled = true;
                    try { m.remove(); } catch { }
                    resolve(img || null);
                };

                const timeout = setTimeout(() => {
                    leafletImageFn(m, (err, canvas) => {
                        if (err || !canvas) return done(null);
                        done(canvas.toDataURL('image/png'));
                    });
                }, 3000); // Increased timeout for safety

                base.once('load', () => {
                    // Extra wait after load to ensure rendering
                    setTimeout(() => {
                        clearTimeout(timeout);
                        leafletImageFn(m, (err, canvas) => {
                            if (err || !canvas) return done(null);
                            done(canvas.toDataURL('image/png'));
                        });
                    }, 500);
                });
            });
        };

        const handleExportPDF = React.useCallback(async () => {
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

            if (!dataCache?.sc || !dataCache?.alcaldias || !dataCache?.anp) {
                alert('Aún se están cargando capas del mapa. Intenta de nuevo en unos segundos.');
                return;
            }

            try {
                const img = await buildExportMapImage({
                    lat: analysis.coordinate.lat,
                    lng: analysis.coordinate.lng,
                    zoom: 14,
                    analysisStatus: analysis.status
                });

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
                await new Promise(r => setTimeout(r, 100)); // Render cycle wait
            } catch (e) {
                console.warn('No se pudo generar/cargar mapa exportable:', e);
                try {
                    const url = getStaticMapUrl({ lat: analysis.coordinate.lat, lng: analysis.coordinate.lng, zoom: 14 });
                    const ok = await preloadImage(url);
                    setMapImage(ok ? url : null);
                    await new Promise(r => setTimeout(r, 100));
                } catch {
                    setMapImage(null);
                }
            }

            const element = pdfRef.current;
            const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
            const scale = isMobile ? 1.8 : 2.2; // Increased scale for better quality

            let canvas;
            try {
                canvas = await html2canvas(element, { scale, useCORS: true, backgroundColor: '#ffffff', logging: false });
            } catch (e) {
                console.error('Fallo al renderizar la ficha para PDF:', e);
                alert('No se pudo generar la ficha PDF en este dispositivo/navegador. Intenta desde Chrome/desktop.');
                return;
            }

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const M = 12;
            const FOOTER = 16;
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
                pdf.setFont("helvetica", "bold");
                pdf.text('Visor de Consulta Ciudadana', M, 10);
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(8);
                pdf.setTextColor(107, 114, 128);
                const headRight = `${(analysis?.alcaldia || 'CDMX')} · ${new Date().toISOString().slice(0, 10)} `;
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
                pdf.text(`Página ${pageIndex + 1} de ${totalPages} `, pdfWidth / 2, pdfHeight - 6, { align: 'center' });
            };

            for (let i = 0; i < totalPages; i++) {
                if (i > 0) pdf.addPage();
                drawPage(i);
            }

            const cleanAlcaldia = (analysis.alcaldia || 'CDMX').normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
            const fechaStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const nombreArchivo = `ficha_${cleanAlcaldia}_${fechaStr}.pdf`;
            pdf.save(nombreArchivo);
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
                <div id="export-map" style={{ width: '900px', height: '520px', position: 'absolute', top: '-9999px', left: '-9999px', zIndex: -1 }}></div>
                <div style={{ position: 'absolute', top: -9999, left: -9999, width: '794px', zIndex: -1 }}>
                    {/* Aseguramos que PdfFicha tenga un fondo blanco opaco para captura */}
                    <div style={{ background: '#ffffff' }}>
                        <PdfFicha ref={pdfRef} analysis={analysis} mapImage={mapImage} />
                    </div>
                </div>
            </>
        );
    };

    window.App.Components.PdfExportController = PdfExportController;
})();
