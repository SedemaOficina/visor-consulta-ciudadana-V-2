const { useState } = window.React;

/**
 * Safe Lazy Access Helpers
 */
const getIcons = () => window.App?.Components?.Icons || new Proxy({}, { get: () => () => null });
const getColors = () => window.App?.Constants?.COLORS || {};
const getUtils = () => window.App?.Utils || {};
const getConstants = () => window.App?.Constants || {};

/* Helper de Zonificación Display */
const getZoningDisplay = (analysis) => {
    if (analysis.zoningKey === 'ANP') return 'ÁREA NATURAL PROTEGIDA';
    if (analysis.zoningKey === 'NODATA') return 'Información no disponible';

    const store = getConstants().ZONING_CAT_INFO || {};
    const catInfo = store[analysis.zoningKey];
    if (catInfo && catInfo.label) return catInfo.label;

    return analysis.zoningName || 'Sin información';
};

/* ------------------------------------------------ */
/* SUB-COMPONENTES */
/* ------------------------------------------------ */

const StatusMessage = ({ analysis }) => {
    const { status, isANP, zoningKey } = analysis;

    if (status === 'OUTSIDE_CDMX') return null;

    if (zoningKey === 'ANP' || isANP) {
        return (
            <div className="p-3 bg-purple-50 text-purple-900 text-xs border-l-4 border-purple-400 rounded-r mb-3 animate-in fade-in">
                <strong>Atención:</strong> Este punto se encuentra en un <strong>Área Natural Protegida</strong>. Aplica regulación específica (Programa de Manejo).
            </div>
        );
    }

    if ((status === 'NO_DATA' || zoningKey === 'NODATA') && status !== 'URBAN_SOIL')
        return (
            <div className="p-3 bg-yellow-50 text-yellow-800 text-xs border-l-4 border-yellow-400 rounded-r mb-3">
                <strong>Aviso:</strong> No se encontró información disponible para esta zona.
            </div>
        );

    return null;
};

const GroupedActivities = ({ title, activities, icon, headerClass, bgClass, accentColor }) => {
    if (!activities || activities.length === 0) return null;

    const Icons = getIcons(); // Safe access
    const Utils = getUtils(); // Safe access

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
                        <span className="text-[10px] font-normal opacity-80">
                            ({activities.length})
                        </span>
                    </span>
                </div>
                {Icons.ChevronDown && <Icons.ChevronDown className="h-4 w-4 group-open:rotate-180 transition-transform" />}
            </summary>

            <div className="px-3 py-2 bg-white border-t border-gray-100 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                {Object.entries(groups).map(([sector, generals], i) => {
                    const st = Utils.getSectorStyle ? Utils.getSectorStyle(sector) : { border: '#ccc', text: '#333' };

                    return (
                        <div key={i} className="mb-3 rounded overflow-hidden border border-gray-100">
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
                                {Object.entries(generals).map(([gen, specifics], j) => (
                                    <details key={j} className="group/inner border-b border-gray-50 last:border-0">
                                        <summary className="px-3 py-2 text-[11px] font-medium text-gray-700 cursor-pointer hover:bg-gray-50 flex justify-between select-none">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="w-1.5 h-1.5 rounded-full"
                                                    style={{ backgroundColor: accentColor || st.border }}
                                                />
                                                <span>{gen}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 rounded-full">
                                                    {specifics.length}
                                                </span>
                                                {Icons.ChevronDown && <Icons.ChevronDown className="h-3 w-3 text-gray-400 group-open/inner:rotate-180 transition-transform" />}
                                            </div>
                                        </summary>

                                        <ul className="bg-gray-50/50 px-4 py-2 space-y-1">
                                            {specifics.map((spec, k) => (
                                                <li
                                                    key={k}
                                                    className="text-[10px] text-gray-600 pl-3 relative border-l-2 border-gray-200"
                                                >
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

const LegalDisclaimer = () => (
    <div className="mt-4 p-3 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 text-justify">
        <strong>Aviso Legal:</strong> La información mostrada tiene carácter orientativo y no sustituye la interpretación oficial ni los documentos normativos vigentes.
    </div>
);

const ActionButtonsDesktop = ({ analysis, onExportPDF }) => {
    const COLORS = getColors();
    const Icons = getIcons();
    const btnClass = "flex flex-col items-center justify-center p-2 bg-white border border-gray-200 rounded text-gray-600 transition-all hover:shadow-sm";

    return (
        <div className="hidden md:grid grid-cols-2 gap-2 w-full">
            {/* Google Maps */}
            {analysis?.coordinate && (
                <a
                    href={`https://www.google.com/maps/search/?api=1&query=${analysis.coordinate.lat},${analysis.coordinate.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className={btnClass}
                    style={{ '--hover-color': COLORS.primary }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.primary; e.currentTarget.style.color = COLORS.primary; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#4b5563'; }}
                    title="Ver ubicación en Google Maps"
                >
                    {Icons.MapIcon && <Icons.MapIcon className="h-5 w-5 mb-1" />}
                    <span className="text-[9px] font-bold">Google Maps</span>
                </a>
            )}

            {/* Exportar PDF */}
            <button
                type="button"
                onClick={(e) => onExportPDF?.(e)}
                className={btnClass}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.primary; e.currentTarget.style.color = COLORS.primary; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#4b5563'; }}
                title="Generar ficha en PDF"
                aria-label="Exportar resultados a PDF"
            >
                {Icons.Pdf && <Icons.Pdf className="h-5 w-5 mb-1" />}
                <span className="text-[9px] font-bold">Exportar PDF</span>
            </button>
        </div>
    );
};

const AnpGeneralCard = ({ analysis }) => {
    if (!analysis || !analysis.isANP) return null;
    const Icons = getIcons();
    const { anpNombre, anpCategoria, anpTipoDecreto, anpFechaDecreto, anpSupDecretada } = analysis;

    return (
        <div className="bg-purple-50 rounded-xl p-4 mb-4 animate-slide-up border border-purple-100">
            <div className="flex items-center gap-2 text-purple-800 font-bold text-sm mb-3 border-b border-purple-100 pb-2">
                {Icons.Leaf && <Icons.Leaf className="h-4 w-4" />}
                <span>Datos Generales ANP</span>
            </div>

            <div className="space-y-3 text-xs text-gray-700">
                <div className="grid grid-cols-1 gap-1">
                    <span className="text-[10px] uppercase font-bold text-gray-500">Nombre Oficial</span>
                    <span className="font-medium text-gray-900 text-sm">{anpNombre || 'No disponible'}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">Categoría</span>
                        <span className="font-medium text-gray-900">{anpCategoria || 'N/D'}</span>
                    </div>
                    <div>
                        <span className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">Tipo Decreto</span>
                        <span className="font-medium text-gray-900">{anpTipoDecreto || 'N/D'}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">Fecha Decreto</span>
                        <span className="font-medium text-gray-900">{anpFechaDecreto || 'N/D'}</span>
                    </div>
                    <div>
                        <span className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">Superficie</span>
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
    const nombre = data.NOMBRE || analysis.anpNombre || 'Desconocido';
    const zonificacion = data.ZONIFICACION || data.CATEGORIA_PROTECCION || analysis.anpCategoria || 'N/A';

    return (
        <div className="bg-purple-50 rounded-xl p-4 mb-4 animate-slide-up border border-purple-100">
            <div className="flex items-center gap-2 text-purple-800 font-bold text-sm mb-3 border-b border-purple-100 pb-2">
                {Icons.Verified && <Icons.Verified className="h-4 w-4" />}
                <span>Zonificación del Área Natural Protegida</span>
            </div>

            <div className="space-y-2 text-xs text-gray-700">
                <div className="grid grid-cols-1 gap-1">
                    <span className="text-[10px] uppercase font-bold text-gray-500">Nombre Oficial</span>
                    <span className="font-medium text-gray-900">{nombre || 'Desconocido'}</span>
                </div>
                <div className="grid grid-cols-1 gap-1">
                    <span className="text-[10px] uppercase font-bold text-gray-500">Zonificación Programa de Manejo</span>
                    <div className="font-medium text-gray-900">{zonificacion || 'N/A'}</div>
                </div>
            </div>
        </div>
    );
};

const LocationSummary = ({ analysis, zoningDisplay }) => {
    const Icons = getIcons();
    const COLORS = getColors();
    const Utils = getUtils();

    const { status } = analysis;
    const isOutside = status === 'OUTSIDE_CDMX';
    const isSC = status === 'CONSERVATION_SOIL';
    const isUrban = status === 'URBAN_SOIL';

    let zoningColor = '#9ca3af';
    if (analysis.zoningKey === 'ANP') {
        zoningColor = COLORS.anp || '#9333ea';
    } else if (analysis.zoningKey === 'NODATA') {
        zoningColor = '#9ca3af';
    } else if (analysis.zoningKey && Utils.getZoningColor) {
        zoningColor = Utils.getZoningColor(analysis.zoningKey);
    }

    const showZoningBlock = !isOutside && !isUrban;

    if (isOutside) {
        return (
            <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-4 animate-pulse-subtle">
                <div className="flex items-center gap-2 text-red-700 font-bold text-sm mb-1">
                    {Icons.XCircle && <Icons.XCircle className="h-4 w-4" />}
                    <span>Fuera de CDMX</span>
                </div>
                <p className="text-xs text-red-600 leading-snug">
                    Este punto se encuentra en <strong>{analysis.outsideContext || 'otro estado'}</strong>.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 mb-4 animate-slide-up">
            <div className="flex flex-wrap items-center gap-2 mb-3">
                {/* Badge Suelo */}
                <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-sm leading-none"
                    style={{
                        backgroundColor: isSC ? COLORS.sc : isUrban ? COLORS.su : '#6b7280',
                        color: '#ffffff'
                    }}
                >
                    {isSC ? 'Suelo de Conservación' : 'Suelo Urbano'}
                </span>

                {/* Badge ANP */}
                {analysis.isANP && (
                    <span
                        className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-sm leading-none"
                        style={{
                            backgroundColor: '#9333ea', // Morado Institucional ANP
                            color: '#ffffff'
                        }}
                    >
                        ANP
                    </span>
                )}
            </div>

            <StatusMessage analysis={analysis} />

            <div className="mb-4">
                <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">Alcaldía</div>
                <div className="text-lg font-bold text-gray-800 leading-tight">
                    {analysis.alcaldia || 'Ciudad de México'}
                </div>
            </div>

            {showZoningBlock && (
                <div className="mb-2">
                    <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-1">
                        Zonificación PGOEDF
                    </div>
                    <div className="flex items-start gap-2">
                        <div
                            className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                            style={{ backgroundColor: zoningColor }}
                        />
                        <div className="text-sm font-semibold text-gray-700 leading-snug break-words">
                            {zoningDisplay}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ResultsContent = ({ analysis, onExportPDF }) => {
    if (!analysis) return null;

    const [activeTab, setActiveTab] = useState('prohibidas');
    const [showDetails, setShowDetails] = useState(true);
    const [showNotes, setShowNotes] = useState(false);

    // Globals access for Main Component
    const Icons = getIcons();
    const COLORS = getColors();
    const Constants = getConstants();
    const REGULATORY_NOTES = Constants.REGULATORY_NOTES || [];

    const zoningDisplay = getZoningDisplay(analysis);

    return (
        <div className="space-y-4 animate-in">
            <LocationSummary analysis={analysis} zoningDisplay={zoningDisplay} />
            <AnpGeneralCard analysis={analysis} />
            <AnpInternalCard analysis={analysis} />

            {((analysis.zoningKey && analysis.zoningKey.startsWith('PDU_')) || analysis.status === 'URBAN_SOIL') && (
                <div className="p-3 bg-blue-50 text-blue-800 text-xs border-l-4 border-blue-400 rounded-r mb-3">
                    <strong>Consulta Específica Requerida:</strong>
                    <br />
                    Esta zona se rige por un <strong>Programa de Desarrollo Urbano</strong> específico.
                    <br />
                    Consulte el documento oficial de SEDUVI para detalle de usos.
                </div>
            )}

            {analysis.status === 'CONSERVATION_SOIL' &&
                !analysis.isPDU &&
                !analysis.noActivitiesCatalog && (
                    <>
                        <div className="flex items-center justify-between mt-2 mb-2">
                            <div className="text-[11px] font-semibold text-gray-600">
                                Catálogo de Actividades (PGOEDF)
                            </div>
                            <button
                                onClick={() => setShowDetails(v => !v)}
                                className="text-[10px] text-blue-600 hover:underline font-medium"
                            >
                                {showDetails ? 'Ocultar detalle' : 'Ver detalle'}
                            </button>
                        </div>

                        {showDetails && (
                            <div className="mt-2 animate-in slide-in-from-top-2 duration-300">
                                <div className="border-b border-gray-200 mb-4 flex gap-4">
                                    <button
                                        onClick={() => setActiveTab('prohibidas')}
                                        className={`pb-2 text-[11px] font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'prohibidas'
                                            ? 'border-red-500 text-red-700'
                                            : 'border-transparent text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        Prohibidas ({analysis.prohibitedActivities?.length || 0})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('permitidas')}
                                        className={`pb-2 text-[11px] font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'permitidas'
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

                                <div className="mt-4 border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
                                    <button
                                        onClick={() => setShowNotes(!showNotes)}
                                        className="w-full flex items-center justify-between p-3 hover:bg-gray-100 transition-colors text-left"
                                    >
                                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                            {Icons.Info ? <Icons.Info className="h-4 w-4 text-gray-500" /> : <span>i</span>}
                                            Notas Normativas
                                        </span>
                                        {showNotes ?
                                            (Icons.ChevronUp ? <Icons.ChevronUp className="h-4 w-4 text-gray-400" /> : <span>-</span>) :
                                            (Icons.ChevronDown ? <Icons.ChevronDown className="h-4 w-4 text-gray-400" /> : <span>+</span>)}
                                    </button>

                                    {showNotes && (
                                        <div className="p-4 bg-white border-t border-gray-200">
                                            <ul className="space-y-2 list-disc pl-4 marker:text-gray-400">
                                                {(REGULATORY_NOTES || []).map((note, idx) => (
                                                    <li key={idx} className="text-[10px] text-gray-600 leading-relaxed text-justify">
                                                        {note}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}

            <ActionButtonsDesktop analysis={analysis} onExportPDF={onExportPDF} />
            <LegalDisclaimer />
        </div>
    );
};

window.App.Components.ResultsContent = ResultsContent;
