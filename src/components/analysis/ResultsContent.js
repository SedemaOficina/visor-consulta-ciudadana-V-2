const { useState } = window.React;
const { ZONING_CAT_INFO, CONTACT_INFO } = window.App.Constants;
const { getZoningColor, getSectorStyle, getAnpZoningColor } = window.App.Utils;
const Icons = window.App.Components.Icons;

/* ------------------------------------------------ */
/* SUB-COMPONENTES DE AYUDA */
/* ------------------------------------------------ */

const StatusMessage = ({ analysis }) => {
    const { status, outsideContext, isANP } = analysis;

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

    return null;
};

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
                            bg: isProhibidas ? '#FEF2F2' : '#F0FDF4',
                            border: accentColor || (isProhibidas ? '#b91c1c' : '#15803d'),
                            text: isProhibidas ? '#7f1d1d' : '#14532d'
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

const LegalDisclaimer = () => (
    <div className="mt-6 p-3 bg-gray-50 border-t border-gray-200 text-[10px] text-gray-500 text-justify">
        <strong>Aviso Legal:</strong> La información mostrada es orientativa y no sustituye la interpretación oficial.
    </div>
);

const ActionButtonsDesktop = ({ analysis, onExportPDF }) => {
    return (
        <div className="hidden md:grid grid-cols-2 gap-2 w-full">
            {/* Google Maps */}
            <a
                href={`https://www.google.com/maps/search/?api=1&query=${analysis.coordinate.lat},${analysis.coordinate.lng}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-2 bg-white border rounded hover:border-[#9d2148] text-gray-600 hover:text-[#9d2148]"
                title="Ver ubicación en Google Maps"
            >
                <Icons.MapIcon className="h-5 w-5 mb-1" />
                <span className="text-[9px] font-bold">Google Maps</span>
            </a>

            {/* Exportar PDF (solo por acción del usuario) */}
            <button
                type="button"
                onClick={(e) => onExportPDF?.(e)}
                className="flex flex-col items-center justify-center p-2 bg-white border rounded hover:border-[#9d2148] text-gray-600 hover:text-[#9d2148] active:scale-95 transition-transform"
                title="Generar ficha en PDF"
                aria-label="Exportar resultados a PDF"
            >
                <Icons.Pdf className="h-5 w-5 mb-1" />
                <span className="text-[9px] font-bold">Exportar PDF</span>
            </button>
        </div>
    );
};

const LocationSummary = ({ analysis, onExportPDF }) => {
    const { status } = analysis;
    const isOutside = status === 'OUTSIDE_CDMX';
    const isSC = status === 'CONSERVATION_SOIL';
    const isUrban = status === 'URBAN_SOIL';
    const isANP = analysis.isANP;

    const zoningColor = analysis.hasInternalAnpZoning
        ? getAnpZoningColor(analysis.zoningName)
        : (analysis.zoningKey ? getZoningColor(analysis.zoningKey) : '#9ca3af');
    const showZoningBlock = !isOutside && !isUrban;

    const [copied, setCopied] = useState(false);
    const copyCoords = () => {
        navigator.clipboard.writeText(`${analysis.coordinate.lat.toFixed(5)}, ${analysis.coordinate.lng.toFixed(5)}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

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
                            {analysis.hasInternalAnpZoning ? 'Zonificación Interna' : 'Zonificación PGOEDF'}
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
                            <Icons.Verified className="h-3 w-3" />
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
/* COMPONENTE PRINCIPAL */
/* ------------------------------------------------ */

const ResultsContent = ({ analysis, onExportPDF }) => {
    if (!analysis) return null;

    const [activeTab, setActiveTab] = useState('prohibidas');
    const [showDetails, setShowDetails] = useState(true);

    return (
        <div className="space-y-4 animate-in bg-white border border-gray-200 rounded-lg px-4 pt-2 pb-3">
            {/* HEADER DECORATIVO (Icono mapa) */}
            <div className="absolute top-0 right-0 p-3 opacity-20 pointer-events-none">
                <Icons.MapIcon className="h-32 w-32" />
            </div>

            {/* RESUMEN + ESTADO */}
            {analysis?.status !== 'OUTSIDE_CDMX' && <StatusMessage analysis={analysis} />}
            <LocationSummary analysis={analysis} onExportPDF={onExportPDF} />


            {analysis.zoningName === 'Cargando detalles...' && (
                <div className="p-2 bg-yellow-50 text-yellow-800 text-[10px] rounded border border-yellow-200">
                    Cargando detalles de zonificación y actividades. La ficha se actualizará automáticamente.
                </div>
            )}

            {analysis.status === 'CONSERVATION_SOIL' &&
                !analysis.isPDU &&
                !analysis.noActivitiesCatalog && (
                    <>
                        <div className="flex items-center justify-between mt-2">
                            <div className="text-[11px] font-semibold text-gray-600">
                                Detalle de actividades según zonificación PGOEDF 2000
                            </div>

                            <button
                                onClick={() => setShowDetails(v => !v)}
                                className="text-[10px] text-[#9d2148] hover:underline"
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

window.App.Components.ResultsContent = ResultsContent;
