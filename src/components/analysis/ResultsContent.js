const { useState } = window.React;

const { getIcons, getConstants, getZoningColor, getSectorStyle } = window.App?.Utils || {};

/* Helper de Zonificación Display */
const getZoningDisplay = (analysis) => {
    if (analysis.zoningKey === 'ANP') return 'ÁREA NATURAL PROTEGIDA';
    if (analysis.zoningKey === 'NODATA') return 'Información no disponible';

    const store = getConstants().ZONING_CAT_INFO || {};
    const catInfo = store[analysis.zoningKey];
    if (catInfo && catInfo.label) return catInfo.label;

    return analysis.zoningName || 'Sin información';
};

/* Helper Texto Contraste (YIQ) */
const getContrastYIQ = (hexcolor) => {
    if (!hexcolor) return 'black';
    hexcolor = hexcolor.replace("#", "");
    if (hexcolor.length === 3) hexcolor = hexcolor.split('').map(c => c + c).join('');
    var r = parseInt(hexcolor.substr(0, 2), 16);
    var g = parseInt(hexcolor.substr(2, 2), 16);
    var b = parseInt(hexcolor.substr(4, 2), 16);
    var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
};

/* ------------------------------------------------ */
/* SUB-COMPONENTES */
/* ------------------------------------------------ */

const InlineAlert = ({ tone, children }) => {
    const Icons = getIcons();

    // Configuración de tonos
    const variants = {
        anp: {
            bg: 'bg-purple-50',
            border: 'border-purple-400',
            text: 'text-purple-900',
            icon: Icons.Leaf // Opcional, podría ser genérico
        },
        nodata: {
            bg: 'bg-yellow-50',
            border: 'border-yellow-400',
            text: 'text-yellow-800',
            icon: Icons.AlertTriangle
        },
        urban: {
            bg: 'bg-blue-50',
            border: 'border-blue-400',
            text: 'text-blue-900',
            icon: Icons.Info
        },
        error: {
            bg: 'bg-red-50',
            border: 'border-red-400',
            text: 'text-red-900',
            icon: Icons.XCircle
        }
    };

    const variant = variants[tone] || variants.nodata;
    const Icon = variant.icon || (() => null);

    return (
        <div className={`p-3 text-xs border-l-4 rounded-r mb-3 flex items-start gap-2 animate-in fade-in ${variant.bg} ${variant.border} ${variant.text}`}>
            <Icon className="h-4 w-4 shrink-0 mt-0.5 opacity-80" />
            <div className="leading-snug">{children}</div>
        </div>
    );
};

const NormativeInstrumentCard = ({ analysis }) => {
    const Icons = getIcons();
    const { status, zoningKey } = analysis;
    const isSC = status === 'CONSERVATION_SOIL';
    const isUrban = status === 'URBAN_SOIL';
    const hasSpecificPDU = zoningKey && zoningKey.startsWith('PDU_');

    if (!isSC && !isUrban) return null;

    if (isSC) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3 shadow-sm animate-slide-up">
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-1">
                    Instrumento Rector
                </div>
                <div className="text-sm font-bold text-gray-800 mb-1">
                    Ordenamiento Ecológico del Distrito Federal (PGOEDF)
                </div>
                <p className="text-[11px] text-gray-600 leading-snug mb-2">
                    Regula los usos del suelo en el Suelo de Conservación para preservar su valor ambiental.
                </p>
                <a
                    href="https://paot.org.mx/centro/programas/pgoedf.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                >
                    {Icons.ExternalLink && <Icons.ExternalLink className="h-3 w-3" />}
                    Consulta el documento oficial (PDF)
                </a>
            </div>
        );
    }

    if (isUrban) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3 shadow-sm animate-slide-up">
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-1">
                    Instrumento Rector
                </div>
                <div className="text-sm font-bold text-gray-800 mb-1">
                    {hasSpecificPDU ? 'Programa Parcial de Desarrollo Urbano' : 'Programa Delegacional de Desarrollo Urbano'}
                </div>
                <p className="text-[11px] text-gray-600 leading-snug mb-2">
                    Instrumento de planeación urbana que establece los usos, reservas y destinos del suelo.
                </p>

                <div className="grid grid-cols-1 gap-1.5 mt-2">
                    <a
                        href="https://metropolis.cdmx.gob.mx/programas-delegacionales-de-desarrollo-urbano"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                    >
                        {Icons.ExternalLink && <Icons.ExternalLink className="h-3 w-3" />}
                        Ver Programas Delegacionales
                    </a>

                    <a
                        href="https://metropolis.cdmx.gob.mx/programas-parciales-de-desarrollo-urbano"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                    >
                        {Icons.ExternalLink && <Icons.ExternalLink className="h-3 w-3" />}
                        Ver Programas Parciales (Zonas Especiales)
                    </a>
                </div>
            </div>
        );
    }

    return null;
};

const ZoningResultCard = ({ analysis, zoningDisplay }) => {
    const { status, zoningKey } = analysis;
    const isSC = status === 'CONSERVATION_SOIL';

    if (!isSC || !zoningKey || zoningKey === 'NODATA' || zoningKey === 'ANP') return null;

    let zoningColor = '#9ca3af';
    if (analysis.zoningKey && getZoningColor) {
        zoningColor = getZoningColor(analysis.zoningKey);
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3 shadow-sm animate-slide-up">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-1">
                Zonificación PGOEDF
            </div>
            <div className="flex items-start gap-2">
                <div
                    className="w-3 h-3 rounded-full mt-1 shrink-0 border border-black/10 shadow-sm"
                    style={{ backgroundColor: zoningColor }}
                />
                <div className="text-base font-bold text-gray-800 leading-snug break-words">
                    {zoningDisplay}
                </div>
            </div>
        </div>
    );
};

const AnpGeneralCard = ({ analysis }) => {
    if (!analysis || !analysis.isANP) return null;
    const Icons = getIcons();
    const { anpNombre, anpCategoria, anpTipoDecreto, anpFechaDecreto, anpSupDecretada } = analysis;

    return (
        <div className="bg-purple-50 rounded-lg p-3 mb-3 animate-slide-up border border-purple-100">
            <div className="flex items-center gap-2 text-purple-800 font-bold text-xs uppercase mb-2 border-b border-purple-200 pb-1">
                {Icons.Leaf && <Icons.Leaf className="h-3 w-3" />}
                <span>Régimen ANP</span>
            </div>

            <div className="space-y-3 text-xs text-gray-700">
                <div className="grid grid-cols-1 gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wide">Nombre Oficial</span>
                    <span className="font-semibold text-gray-900 leading-tight">{anpNombre || 'No disponible'}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <span className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5 tracking-wide">Categoría</span>
                        <span className="font-medium text-gray-900">{anpCategoria || 'N/D'}</span>
                    </div>
                    <div>
                        <span className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5 tracking-wide">Decreto</span>
                        <span className="font-medium text-gray-900">{anpTipoDecreto || 'N/D'}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <span className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5 tracking-wide">Fecha</span>
                        <span className="font-medium text-gray-900">{anpFechaDecreto || 'N/D'}</span>
                    </div>
                    <div>
                        <span className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5 tracking-wide">Superficie</span>
                        <span className="font-medium text-gray-900">{anpSupDecretada ? `${anpSupDecretada} ha` : 'N/D'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AnpInternalCard = ({ analysis }) => {
    if (!analysis.hasInternalAnpZoning || !analysis.anpInternalFeature) return null;
    const Icons = getIcons();
    const data = analysis.anpInternalFeature.properties || {};
    const zonificacion = data.ZONIFICACION || data.CATEGORIA_PROTECCION || analysis.anpCategoria || 'N/A';

    return (
        <div className="bg-purple-50 rounded-lg p-3 mb-3 animate-slide-up border border-purple-100">
            <div className="flex items-center gap-2 text-purple-800 font-bold text-xs uppercase mb-2 border-b border-purple-200 pb-1">
                {Icons.Verified && <Icons.Verified className="h-3 w-3" />}
                <span>Zonificación Interna ANP</span>
            </div>

            <div className="space-y-1 text-xs text-gray-700">
                <span className="text-[10px] uppercase font-bold text-gray-500 block tracking-wide">Zonificación Programa de Manejo</span>
                <span className="font-bold text-base text-gray-900 block leading-tight">{zonificacion || 'N/A'}</span>
            </div>
        </div>
    );
};

const LocationSummary = ({ analysis }) => {
    const Icons = getIcons();
    const COLORS = getConstants().COLORS || {};

    const { status } = analysis;
    const isSC = status === 'CONSERVATION_SOIL';
    const isUrban = status === 'URBAN_SOIL';

    let zoningColor = '#9ca3af';
    if (analysis.zoningKey === 'ANP') {
        zoningColor = COLORS.anp || '#9333ea';
    } else if (analysis.zoningKey === 'NODATA') {
        zoningColor = '#9ca3af';
    } else if (analysis.zoningKey && getZoningColor) {
        zoningColor = getZoningColor(analysis.zoningKey);
    }

    // Use full descriptive name instead of Key (Acronym)
    const zoningBadgeLabel = analysis.zoningKey && analysis.zoningKey !== 'NODATA' && analysis.zoningKey !== 'ANP'
        ? getZoningDisplay(analysis)
        : null;

    if (status === 'OUTSIDE_CDMX') return null; // Handled by InlineAlert in main content

    return (
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4 shadow-none animate-slide-up">
            <div className="flex flex-wrap items-center gap-2 mb-2">
                {/* Badge Suelo Base (Filled, no shadow) */}
                <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase leading-none"
                    style={{
                        backgroundColor: isSC ? COLORS.sc : isUrban ? COLORS.su : '#6b7280',
                        color: '#ffffff'
                    }}
                >
                    {isSC ? 'Suelo de Conservación' : 'Suelo Urbano'}
                </span>

                {/* Badge Zonificación SHORT (Filled) */}
                {zoningBadgeLabel && (
                    <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase leading-none"
                        style={{
                            backgroundColor: zoningColor,
                            color: getContrastYIQ(zoningColor)
                        }}
                    >
                        {zoningBadgeLabel}
                    </span>
                )}

                {/* Badge ANP (Filled) */}
                {analysis.isANP && (
                    <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase leading-none bg-[#9333ea] text-white"
                    >
                        ANP
                    </span>
                )}
            </div>

            <div>
                <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-0.5">Alcaldía</div>
                <div className="text-lg font-bold text-gray-900 leading-tight">
                    {analysis.alcaldia || 'Ciudad de México'}
                </div>
            </div>
        </div>
    );
};


const GroupedActivities = ({ title, activities, icon, headerClass, bgClass, accentColor }) => {
    if (!activities || activities.length === 0) return null;

    const Icons = getIcons();

    // 1. Grouping
    const groups = {};
    activities.forEach(a => {
        if (!groups[a.sector]) groups[a.sector] = {};
        if (!groups[a.sector][a.general]) groups[a.sector][a.general] = new Set();
        // Deduplicate specifics using Set
        groups[a.sector][a.general].add(a.specific);
    });

    // 2. Sorting Steps
    const sortedSectors = Object.keys(groups).sort((a, b) => a.localeCompare(b));

    return (
        <details open className={`group rounded-lg border border-gray-200 overflow-hidden mb-3 ${bgClass}`}>
            <summary className={`flex items-center justify-between px-3 py-2.5 cursor-pointer ${headerClass} hover:opacity-90 transition-opacity`}>
                <div className="flex items-center gap-2 font-bold text-xs">
                    {icon}
                    <span>
                        {title}{' '}
                        <span className="text-[10px] font-normal opacity-80">
                            ({activities.length})
                        </span>
                    </span>
                </div>
                {Icons.ChevronDown && <Icons.ChevronDown className="h-4 w-4 group-open:rotate-180 transition-transform" />}
            </summary>

            {/* Mobile Scroll Limit: max-h-[45vh] on mobile only. MD: no limit */}
            <div className="px-3 py-2 bg-white border-t border-gray-100 space-y-3 overflow-y-auto custom-scrollbar max-h-[45vh] md:max-h-none">
                {sortedSectors.map((sector, i) => {
                    const generalsMap = groups[sector];
                    const sortedGenerals = Object.keys(generalsMap).sort((a, b) => a.localeCompare(b));
                    const st = getSectorStyle ? getSectorStyle(sector) : { border: '#ccc', text: '#333' };

                    return (
                        <div key={i} className="mb-2 rounded overflow-hidden border border-gray-100">
                            <div
                                className="px-3 py-1.5 font-bold text-[10px] uppercase tracking-wide border-l-4 bg-gray-50"
                                style={{
                                    borderLeftColor: st.border,
                                    color: '#374151'
                                }}
                            >
                                {sector}
                            </div>

                            <div className="bg-white">
                                {sortedGenerals.map((gen, j) => {
                                    const specificSet = generalsMap[gen];
                                    const specificList = Array.from(specificSet).sort((a, b) => a.localeCompare(b));

                                    return (
                                        <details key={j} className="group/inner border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                            <summary className="px-3 py-2 text-[11px] font-medium text-gray-700 cursor-pointer flex justify-between select-none items-start gap-2">
                                                <div className="flex items-start gap-2">
                                                    <span
                                                        className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                                                        style={{ backgroundColor: accentColor || st.border }}
                                                    />
                                                    <span className="leading-snug">{gen}</span>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                                                    <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 rounded-full">
                                                        {specificList.length}
                                                    </span>
                                                    {Icons.ChevronDown && <Icons.ChevronDown className="h-3 w-3 text-gray-400 group-open/inner:rotate-180 transition-transform" />}
                                                </div>
                                            </summary>

                                            <ul className="bg-gray-50/30 px-4 py-2 space-y-1.5">
                                                {specificList.map((spec, k) => (
                                                    <li
                                                        key={k}
                                                        className="text-[11px] text-gray-600 pl-3 relative border-l-2 border-gray-200 leading-snug"
                                                    >
                                                        {spec}
                                                    </li>
                                                ))}
                                            </ul>
                                        </details>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </details>
    );
};

const LegalDisclaimer = () => (
    <div className="mt-6 mb-2 p-0 text-[10px] text-gray-400 text-center uppercase tracking-wide opacity-70">
        Información de carácter orientativo. No sustituye documentos oficiales.
    </div>
);



const CitizenSummaryCard = ({ analysis }) => {
    if (!analysis) return null;

    const { status, zoningKey, isANP, alcaldia } = analysis;
    const Icons = getIcons();

    // --- REGLAS DE INTERPRETACION (Determinista) ---
    const getExplanation = () => {
        if (status === 'OUTSIDE_CDMX') {
            return `Estás consultando una ubicación fuera de la Ciudad de México. Aquí no aplican las regulaciones de la SEDEMA CDMX. Te sugerimos contactar a las autoridades locales de ${analysis.outsideContext || 'la entidad vecina'}.`;
        }

        if (status === 'URBAN_SOIL') {
            if (isANP) {
                return `Aunque es zona urbana, este punto está dentro de una Área Natural Protegida. Esto significa que la prioridad es el medio ambiente y aplican reglas especiales de conservación por encima de las normas urbanas comunes.`;
            }
            return `Te encuentras en Suelo Urbano. Aquí predominan las actividades residenciales, comerciales y de servicios. Las reglas de construcción dependen de la SEDUVI y del Plan de Desarrollo Urbano de ${alcaldia || 'la alcaldía'}.`;
        }

        if (status === 'CONSERVATION_SOIL') {
            // ANP CASE
            if (isANP) {
                return `¡Estás en una zona muy importante! Este punto es parte de una Área Natural Protegida (ANP). Su objetivo principal es preservar la biodiversidad. Aquí las construcciones están muy restringidas y se sigue un Plan de Manejo específico.`;
            }

            // ZONING CASES (PGOEDF)
            switch (zoningKey) {
                case 'RE':
                    return `Estás en una zona de **Rescate Ecológico**. Estas áreas han sido afectadas por actividades humanas pero buscamos restaurarlas. La prioridad es reforestar y evitar que la mancha urbana crezca más.`;
                case 'FC':
                case 'FCE':
                case 'FP':
                case 'FPE':
                    return `Estás en una zona **Forestal**. Es el pulmón de la ciudad. Aquí la prioridad absoluta es mantener el bosque sano. Prácticamente no se permite construir viviendas ni comercios para proteger el agua y el aire de todos.`;
                case 'PR':
                case 'PRA':
                    return `Estás en una zona de **Producción Rural**. Aquí se fomenta la agricultura y la agroindustria tradicional. Se permiten actividades del campo, pero no fraccionamientos residenciales urbanos.`;
                case 'AE':
                case 'AEE':
                case 'AF':
                case 'AFE':
                    return `Estás en una zona **Agroecológica**. Se busca un equilibrio entre la agricultura tradicional y el cuidado de la naturaleza. Puedes cultivar la tierra, siempre y cuando uses técnicas amigables con el medio ambiente.`;
                case 'PDU_ER':
                    return `Estás en una zona de **Equipamiento Rural**. Aquí se permiten instalaciones necesarias para la comunidad rural, como escuelas, centros de salud o deportivos, siempre bajo reglas estrictas.`;
                case 'PDU_PR':
                    return `Estás en un **Poblado Rural**. Es una comunidad histórica dentro del suelo de conservación. Tienen reglas especiales que permiten vivienda y comercio local, pero siempre limitando el crecimiento hacia el bosque.`;
                default:
                    return `Te encuentras en **Suelo de Conservación**. Es la reserva ecológica de la ciudad (bosques, humedales, zonas agrícolas). Aquí no aplican las normas urbanas comunes y el objetivo es evitar la urbanización para proteger los servicios ambientales.`;
            }
        }
        return null;
    };

    const text = getExplanation();
    if (!text) return null;

    return (
        <div className="relative mb-4 rounded-xl p-4 bg-gradient-to-br from-blue-50 to-white border border-blue-100 shadow-sm animate-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-start gap-3 relative z-10">
                <div className="shrink-0 mt-0.5 p-1.5 bg-blue-100 rounded-lg text-blue-600">
                    {Icons.Info ? <Icons.Info className="h-4 w-4" /> : <span>i</span>}
                </div>
                <div>
                    <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                        Resumen Normativo
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        <span dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-900">$1</strong>') }} />
                    </p>
                </div>
            </div>
        </div>
    );
};

const ActionButtons = ({ analysis, onExportPDF, isExporting, exportProgress }) => {
    const Icons = getIcons();
    // MOBILE FIX: Hidden on mobile (default), visible as grid on md screens
    const btnClass = "flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-lg text-gray-700 transition-all active:scale-[0.98] hover:border-gray-300 hover:bg-gray-50";

    return (
        <div className="hidden md:grid grid-cols-2 gap-3 w-full mt-2">
            {/* Google Maps */}
            {analysis?.coordinate && (
                <a
                    href={`https://www.google.com/maps/search/?api=1&query=${analysis.coordinate.lat},${analysis.coordinate.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className={btnClass}
                    title="Ver en Google Maps"
                >
                    {Icons.MapIcon && <Icons.MapIcon className="h-5 w-5 mb-1.5 text-blue-600" />}
                    <span className="text-[11px] font-bold">Google Maps</span>
                </a>
            )}

            {/* Exportar PDF */}
            <button
                type="button"
                onClick={(e) => !isExporting && onExportPDF?.(e)}
                disabled={isExporting}
                className={`${btnClass} ${isExporting ? 'opacity-75 cursor-not-allowed bg-gray-50' : ''}`}
                title="Generar Ficha PDF"
            >
                {isExporting ? (
                    <>
                        {Icons.Loader2 ? <Icons.Loader2 className="h-5 w-5 mb-1.5 text-[#9d2449] animate-spin" /> : <span className="h-5 w-5 mb-1.5 block rounded-full border-2 border-t-[#9d2449] animate-spin" />}
                        <span className="text-[11px] font-bold text-[#9d2449]">Generando... {exportProgress ? `${exportProgress}%` : ''}</span>
                    </>
                ) : (
                    <>
                        {Icons.Pdf && <Icons.Pdf className="h-5 w-5 mb-1.5 text-[#9d2449]" />}
                        <span className="text-[11px] font-bold">Descargar Ficha</span>
                    </>
                )}
            </button>
        </div>
    );
};

const ResultsContent = ({ analysis, onExportPDF, isExporting, exportProgress }) => {
    if (!analysis) return null;

    const [activeTab, setActiveTab] = useState('prohibidas');
    const [showDetails, setShowDetails] = useState(true);
    const [showNotes, setShowNotes] = useState(false);

    // Globals access for Main Component
    const Icons = getIcons();
    const COLORS = getConstants().COLORS || {};
    const Constants = getConstants();

    const zoningDisplay = getZoningDisplay(analysis);
    const { status, zoningKey, isANP } = analysis;

    return (
        <div className="space-y-3 animate-in pb-4">

            {/* 1. Location and basic context */}
            <LocationSummary analysis={analysis} />

            {/* 1.B Citizen Summary (Rule Based) */}
            <CitizenSummaryCard analysis={analysis} />



            {/* 2. Unified Critical Alerts */}
            {status === 'OUTSIDE_CDMX' && (
                <InlineAlert tone="error">
                    Este punto se encuentra <strong>fuera de la Ciudad de México</strong> ({analysis.outsideContext || 'otro estado'}).
                </InlineAlert>
            )}

            {(status === 'NO_DATA' || zoningKey === 'NODATA') && status !== 'URBAN_SOIL' && status !== 'OUTSIDE_CDMX' && (
                <InlineAlert tone="nodata">
                    <strong>Sin Información:</strong> No se encontraron datos de zonificación para esta ubicación.
                </InlineAlert>
            )}

            {(isANP || zoningKey === 'ANP') && (
                <InlineAlert tone="anp">
                    <strong>Área Natural Protegida:</strong> Este punto se encuentra dentro de un ANP y se rige por su Programa de Manejo.
                </InlineAlert>
            )}

            {/* 3. Instrumento Rector */}
            <NormativeInstrumentCard analysis={analysis} />

            {/* 4. Zonificación PGOEDF (Solo SC) */}
            <ZoningResultCard analysis={analysis} zoningDisplay={zoningDisplay} />

            {/* 5. ANP Details (Si aplica) */}
            <AnpGeneralCard analysis={analysis} />
            <AnpInternalCard analysis={analysis} />

            {/* 6. Catálogo de Actividades (Solo SC, no PDU) */}
            {analysis.status === 'CONSERVATION_SOIL' &&
                !analysis.isPDU &&
                !analysis.noActivitiesCatalog && (
                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-2 px-1">
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                                Catálogo de Actividades
                            </div>
                        </div>

                        {showDetails && (
                            <div className="animate-in slide-in-from-top-2 duration-300">
                                <div className="flex gap-4 border-b border-gray-200 mb-3">
                                    <button
                                        onClick={() => setActiveTab('prohibidas')}
                                        className={`flex-1 pb-2 text-[10px] font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'prohibidas'
                                            ? 'border-red-500 text-red-700'
                                            : 'border-transparent text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        Prohibidas ({analysis.prohibitedActivities?.length || 0})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('permitidas')}
                                        className={`flex-1 pb-2 text-[10px] font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'permitidas'
                                            ? 'border-green-500 text-green-700'
                                            : 'border-transparent text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        Permitidas ({analysis.allowedActivities?.length || 0})
                                    </button>
                                </div>

                                {activeTab === 'prohibidas' && (
                                    <GroupedActivities
                                        title="ACTIVIDADES PROHIBIDAS"
                                        activities={analysis.prohibitedActivities}
                                        icon={Icons.XCircle ? <Icons.XCircle className="h-4 w-4" /> : null}
                                        headerClass="text-red-900 bg-red-50"
                                        bgClass="bg-white"
                                        accentColor={COLORS.error}
                                    />
                                )}

                                {activeTab === 'permitidas' && (
                                    <GroupedActivities
                                        title="ACTIVIDADES PERMITIDAS"
                                        activities={analysis.allowedActivities}
                                        icon={Icons.CheckCircle ? <Icons.CheckCircle className="h-4 w-4" /> : null}
                                        headerClass="text-green-900 bg-green-50"
                                        bgClass="bg-white"
                                        accentColor={COLORS.success}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                )}

            {/* 7. Notas Normativas (Solo si hay zonificación PGOEDF válida) */}
            {status === 'CONSERVATION_SOIL' && zoningKey && zoningKey !== 'NODATA' && zoningKey !== 'ANP' && (
                <div className="mt-3 border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
                    <button
                        onClick={() => setShowNotes(!showNotes)}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-100 transition-colors text-left"
                    >
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide flex items-center gap-2">
                            {Icons.Info ? <Icons.Info className="h-3 w-3 text-gray-400" /> : <span>i</span>}
                            Notas Normativas Importantes
                        </span>
                        {showNotes ?
                            (Icons.ChevronUp ? <Icons.ChevronUp className="h-4 w-4 text-gray-400" /> : <span>-</span>) :
                            (Icons.ChevronDown ? <Icons.ChevronDown className="h-4 w-4 text-gray-400" /> : <span>+</span>)}
                    </button>

                    {showNotes && (
                        <div className="p-4 bg-white border-t border-gray-200">
                            <ul className="space-y-3">
                                {[
                                    "Adicionalmente a lo dispuesto en la tabla de usos del suelo, para cualquier obra o actividad que se pretenda desarrollar se deberán contemplar los criterios y lineamientos señalados en el programa de Ordenamiento Ecológico, así como cumplir con los permisos y autorizaciones en materia ambiental del Distrito Federal.",
                                    "Los usos del suelo no identificados en esta tabla deberán cumplir con los permisos y autorizaciones en materia urbana y ambiental aplicables en Suelo de Conservación.",
                                    "En las Areas Naturales Protegidas ANP regirá la zonificación especificada en su respectivo Programa de Manejo.",
                                    "La zonificación denominada PDU corresponde a las áreas normadas por los Programas Delegacionales o Parciales de Desarrollo Urbano vigentes.",
                                    "Las disposiciones de la presente regulación no prejuzgan sobre la propiedad de la tierra.",
                                    "El Suelo de Conservación definido por las barrancas estará regulado por la zonificación Forestal de Conservación FC, conforme a los límites establecidos por la Norma de Ordenación N° 21, señalada en los Programas de Desarrollo Urbano.",
                                    "* Se instrumentará un programa de reconversión de esta actividad por la producción de composta. Para ello, se elaborará un padrón de los productores y diseñar y ejecutar un programa de capacitación y proponer paquetes tecnológicos para transferencia y el desarrollo de estudios de mercado para la sustitución progresiva del producto y la reducción de la extracción directa."
                                ].map((note, idx) => (
                                    <li key={idx} className="flex gap-2 text-[11px] text-gray-600 leading-relaxed text-justify border-l-2 border-gray-200 pl-2">
                                        <span className="text-[#9d2449] font-bold">•</span>
                                        <span>{note}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* 8. Action Buttons (Mobile & Desktop) */}
            <ActionButtons analysis={analysis} onExportPDF={onExportPDF} isExporting={isExporting} />

            {/* 9. Disclaimer */}
            <LegalDisclaimer />
        </div>
    );
};

window.App.Components.ResultsContent = ResultsContent;
