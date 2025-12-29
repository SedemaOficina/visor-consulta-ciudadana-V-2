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

// --- TOOLTIP COMPONENT (TIPPY.JS WRAPPER) ---
const Tooltip = ({ content, children, placement = 'top' }) => {
    const triggerRef = window.React.useRef(null);
    const { useEffect } = window.React;

    useEffect(() => {
        if (triggerRef.current && window.tippy && content) {
            const instance = window.tippy(triggerRef.current, {
                content: content,
                placement: placement,
                animation: 'scale',
                arrow: true,
                theme: 'light-border',
            });

            return () => {
                instance.destroy();
            };
        }
    }, [content, placement]);

    return (
        <span ref={triggerRef} className="cursor-help inline-flex items-center">
            {children}
        </span>
    );
};

const NormativeInstrumentCard = ({ analysis }) => {
    const Icons = getIcons();
    const { status, zoningKey } = analysis;
    const isSC = status === 'CONSERVATION_SOIL';
    const isUrban = status === 'URBAN_SOIL';
    const hasSpecificPDU = zoningKey && zoningKey.startsWith('PDU_');

    if (!isSC && !isUrban) return null;

    // --- REFACTOR: Reduced visual weight (Support/Reference style) ---
    const Container = ({ children }) => (
        <div className="bg-gray-50/50 rounded-lg p-3 mb-4 border border-gray-100/50">
            <div className="flex items-start gap-3 opacity-80 hover:opacity-100 transition-opacity">
                <div className="shrink-0 mt-0.5 text-gray-400">
                    {Icons.BookOpen ? <Icons.BookOpen className="h-4 w-4" /> : <span>📖</span>}
                </div>
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </div>
    );

    if (isSC) {
        return (
            <Container>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                    Fuente Normativa
                </div>
                <div className="text-xs font-semibold text-gray-700 mb-1">
                    PGOEDF (Ordenamiento Ecológico)
                </div>
                <Tooltip content="Consultar documento oficial en nueva pestaña">
                    <a
                        href="https://paot.org.mx/centro/programas/pgoedf.pdf"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-700 hover:underline"
                    >
                        Ver documento oficial
                        {Icons.ExternalLink && <Icons.ExternalLink className="h-2.5 w-2.5" />}
                    </a>
                </Tooltip>
            </Container>
        );
    }

    if (isUrban) {
        return (
            <Container>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                    Fuente Normativa
                </div>
                <div className="text-xs font-semibold text-gray-700 mb-1">
                    {hasSpecificPDU ? 'Programa Parcial (PPDU)' : 'Programa Delegacional (PDDU)'}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <Tooltip content="Ir a sitio de SEDUVI - Delegacionales">
                        <a
                            href="https://metropolis.cdmx.gob.mx/programas-delegacionales-de-desarrollo-urbano"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-700 hover:underline"
                        >
                            Programas Delegacionales
                            {Icons.ExternalLink && <Icons.ExternalLink className="h-2.5 w-2.5" />}
                        </a>
                    </Tooltip>
                    <Tooltip content="Ir a sitio de SEDUVI - Parciales">
                        <a
                            href="https://metropolis.cdmx.gob.mx/programas-parciales-de-desarrollo-urbano"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-700 hover:underline"
                        >
                            Programas Parciales
                            {Icons.ExternalLink && <Icons.ExternalLink className="h-2.5 w-2.5" />}
                        </a>
                    </Tooltip>
                </div>
            </Container>
        );
    }

    return null;
};

const ZoningResultCard = ({ analysis, zoningDisplay }) => {
    const { status, zoningKey } = analysis;
    const isSC = status === 'CONSERVATION_SOIL';

    if (!isSC || !zoningKey || zoningKey === 'NODATA' || zoningKey === 'ANP' || status === 'OUTSIDE_CDMX') return null;

    let zoningColor = '#9ca3af';
    if (analysis.zoningKey && getZoningColor) {
        zoningColor = getZoningColor(analysis.zoningKey);
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3 shadow-sm animate-slide-up">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-1 flex items-center gap-1">
                Zonificación PGOEDF
                <Tooltip content="Zonificación impuesta por el Programa General de Ordenamiento Ecológico del DF">
                    <span className="text-gray-300 hover:text-gray-500 transition-colors">ⓘ</span>
                </Tooltip>
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

const LocationSummary = ({ analysis, approximateAddress }) => {
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

    const zoningBadgeLabel = analysis.zoningKey && analysis.zoningKey !== 'NODATA' && analysis.zoningKey !== 'ANP'
        ? getZoningDisplay(analysis)
        : null;

    if (status === 'OUTSIDE_CDMX') return null;

    return (
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4 shadow-none animate-slide-up">

            {approximateAddress && (
                <div className="mb-3 pb-3 border-b border-gray-100">
                    <div className="flex items-start gap-2">
                        {Icons.MapIcon && <div className="mt-0.5 text-[#9d2449]"><Icons.MapIcon className="h-3.5 w-3.5" /></div>}
                        <div>
                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                                Dirección Aproximada (Orientativa)
                            </div>
                            <div className="text-xs font-semibold text-gray-800 leading-snug">
                                {approximateAddress}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-2 mb-2">
                {/* Badge Suelo Base */}
                {status !== 'OUTSIDE_CDMX' && (
                    <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase leading-none"
                        style={{
                            backgroundColor: isSC ? COLORS.sc : isUrban ? COLORS.su : '#6b7280',
                            color: '#ffffff'
                        }}
                    >
                        {isSC ? 'Suelo de Conservación' : 'Suelo Urbano'}
                    </span>
                )}

                {/* Badge Zonificación */}
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

                {/* Badge ANP */}
                {analysis.isANP && (
                    <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase leading-none bg-[#9333ea] text-white"
                    >
                        ANP
                    </span>
                )}
            </div>

            {
                status !== 'OUTSIDE_CDMX' && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-0.5">Alcaldía</div>
                        <div className="text-lg font-bold text-gray-900 leading-tight">
                            {analysis.alcaldia || 'Ciudad de México'}
                        </div>
                    </div>
                )
            }
        </div >
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
                                className="px-3 py-1.5 font-bold text-[10px] uppercase tracking-wide bg-gray-50 border-b border-gray-100 text-gray-500"
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
            const estado = analysis.outsideContext;
            if (estado) {
                return `La ubicación consultada se localiza en el **${estado}**. La presente herramienta corresponde a normatividad de la **Ciudad de México**, por lo que **no aplica** en este territorio. La determinación normativa corresponde a las **autoridades competentes del ${estado}**.`;
            } else {
                return `La ubicación consultada se localiza **fuera de la Ciudad de México**. La normatividad consultada en este visor **no es aplicable** en este territorio. La determinación normativa corresponde a las **autoridades estatales o municipales competentes**.`;
            }
        }

        if (status === 'URBAN_SOIL') {
            if (isANP) {
                return `Aunque el punto se ubica en **Suelo Urbano**, se localiza dentro de un **Área Natural Protegida (ANP)**. En estos casos, la regulación específica de usos y destinos del suelo se determina por el **Programa de Manejo** correspondiente, conforme al PGOEDF.`;
            }
            return `El punto se ubica en **Suelo Urbano**. La regulación aplicable en materia de usos del suelo se determina mediante los **Programas de Desarrollo Urbano** (Delegacionales o Parciales) y la autoridad competente en la demarcación correspondiente (**${alcaldia || 'la alcaldía'}**).`;
        }

        if (status === 'CONSERVATION_SOIL') {
            // ANP CASE
            if (isANP) {
                return `El punto se ubica en **Suelo de Conservación** y dentro de un **Área Natural Protegida (ANP)**. Conforme al PGOEDF, la regulación específica de usos y destinos del suelo se define por el **Programa de Manejo** correspondiente.`;
            }

            // ZONING CASES (PGOEDF)
            switch (zoningKey) {
                case 'RE':
                    return `Zona orientada a la **restauración ecológica** de áreas con afectación. En el marco del PGOEDF, la gestión ambiental se enfoca en **recuperar la cobertura y funcionalidad** del territorio, priorizando acciones compatibles con la conservación de bienes y servicios ambientales.`;
                case 'FC':
                case 'FCE':
                case 'FP':
                case 'FPE':
                    return `Zona con **altos valores ambientales** asociados a vegetación natural y funciones clave como **recarga del acuífero** y **conservación de biodiversidad**. El PGOEDF establece que su uso debe ser **planificado y regulado** para evitar deterioro, frenar el cambio de cobertura natural y asegurar la permanencia de los ecosistemas.`;
                case 'PR':
                case 'PRA':
                    return `Zona con aptitud para **actividades productivas rurales**. El PGOEDF orienta estas actividades para que sean **compatibles con la conservación de recursos naturales** y para minimizar conflictos ambientales, promoviendo el aprovechamiento sustentable en función de la capacidad del territorio.`;
                case 'AE':
                case 'AEE':
                case 'AF':
                case 'AFE':
                    return `Zona con **alto potencial para actividades agrícolas y pecuarias**. El PGOEDF señala que deben evitarse prácticas que alteren la **capacidad física y productiva del suelo**, aplicar **técnicas de conservación de suelo y agua**, y promover el uso de **composta y abonos orgánicos**, reduciendo al máximo productos químicos.`;
                case 'PDU_ER':
                    return `Zona identificada por Programas de Desarrollo Urbano (PDU) para **equipamientos** en territorio rural. Conforme al PGOEDF, estos polígonos se regulan por los **Programas Delegacionales o Parciales** aplicables y deben considerarse en congruencia con la gestión del Suelo de Conservación.`;
                case 'PDU_PR':
                    return `Zona identificada como **Poblado Rural** dentro de los Programas de Desarrollo Urbano (PDU). Conforme al PGOEDF, estos polígonos se regulan por los **Programas Delegacionales o Parciales** aplicables, al tratarse de asentamientos y áreas normadas por planeación urbana vigente.`;
                default:
                    return `El punto se ubica en **Suelo de Conservación**. El PGOEDF define una zonificación para delinear un patrón de usos del suelo que **maximice servicios ambientales** (incluida la **recarga del acuífero**) y la capacidad productiva, y que **minimice conflictos ambientales**, asignando actividades conforme a la capacidad del territorio para sostenerlas y frenar el cambio de cobertura natural.`;
            }
        }
        return null;
    };

    const text = getExplanation();
    if (!text) return null;

    const isOutside = status === 'OUTSIDE_CDMX';

    // Styles Configuration
    const baseClasses = isOutside
        ? "relative mb-4 rounded-xl p-4 bg-red-50 to-white border border-red-100 shadow-sm animate-in slide-in-from-bottom-2 duration-500"
        : "relative mb-4 rounded-xl p-4 bg-gradient-to-br from-blue-50 to-white border border-blue-100 shadow-sm animate-in slide-in-from-bottom-2 duration-500";

    const iconContainerClasses = isOutside
        ? "shrink-0 mt-0.5 p-1.5 bg-red-100 rounded-lg text-red-600"
        : "shrink-0 mt-0.5 p-1.5 bg-blue-100 rounded-lg text-blue-600";

    const titleClasses = isOutside
        ? "hidden"
        : "text-[10px] font-bold text-blue-500 uppercase tracking-wide mb-1 flex items-center gap-1";

    const textClasses = isOutside
        ? "text-xs text-red-800 leading-relaxed font-medium"
        : "text-xs text-slate-700 leading-relaxed font-medium";

    return (
        <div className={baseClasses}>
            <div className="flex items-start gap-3 relative z-10">
                <div className={iconContainerClasses}>
                    {isOutside && Icons.AlertTriangle ? <Icons.AlertTriangle className="h-4 w-4" /> : (Icons.Info ? <Icons.Info className="h-4 w-4" /> : <span>i</span>)}
                </div>
                <div>

                    <p className={textClasses}>
                        <span dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>') }} />
                    </p>
                </div>
            </div>
        </div>
    );
};

const MobileActionButtons = ({ analysis, onExportPDF, isExporting, exportProgress }) => {
    // Only visible on mobile/tablet. Hidden on MD+.
    // Keeps functionality intact as requested.
    const Icons = getIcons();
    return (
        <div className="hidden">
            {analysis?.coordinate && (
                <Tooltip content="Abrir ubicación en Google Maps">
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${analysis.coordinate.lat},${analysis.coordinate.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-center gap-2 p-3 bg-white border border-gray-200 rounded-lg text-gray-700 font-bold text-xs shadow-sm active:bg-gray-50"
                    >
                        {Icons.MapIcon && <Icons.MapIcon className="h-4 w-4" />}
                        Ver en Google Maps
                    </a>
                </Tooltip>
            )}
            <Tooltip content="Guardar reporte oficial en PDF">
                <button
                    type="button"
                    onClick={(e) => !isExporting && onExportPDF?.(e)}
                    disabled={isExporting}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-[#9d2449] text-white rounded-lg font-bold text-xs shadow-sm active:bg-[#801d3a] disabled:opacity-75"
                >
                    {isExporting ? (
                        <>
                            {Icons.Loader2 ? <Icons.Loader2 className="h-4 w-4 animate-spin" /> : <span>...</span>}
                            <span>Generando... {exportProgress ? `${exportProgress}%` : ''}</span>
                        </>
                    ) : (
                        <>
                            {Icons.Pdf && <Icons.Pdf className="h-4 w-4" />}
                            <span>Descargar Ficha PDF</span>
                        </>
                    )}
                </button>
            </Tooltip>
        </div>
    );
};

const PrimaryActionHeader = ({ analysis, approximateAddress, onExportPDF, isExporting, exportProgress }) => {
    // Visible on Desktop only, static at top.
    const Icons = getIcons();
    if (!analysis?.coordinate) return null;

    return (
        <div className="hidden md:flex gap-3 mb-4">
            <a
                href={`https://www.google.com/maps/search/?api=1&query=${analysis.coordinate.lat},${analysis.coordinate.lng}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 font-bold text-xs shadow-sm hover:bg-gray-50 transition-colors"
            >
                {Icons.MapIcon && <Icons.MapIcon className="h-4 w-4 text-blue-500" />}
                <Tooltip content="Abrir ubicación exacta en Google Maps">
                    <span>Google Maps</span>
                </Tooltip>
            </a>

            <button
                type="button"
                onClick={(e) => !isExporting && onExportPDF?.(e)}
                disabled={isExporting}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-bold text-xs text-white shadow-sm transition-all active:scale-95
                    ${isExporting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#9d2449] hover:bg-[#8a1f40]'}`}
            >
                {isExporting ? (
                    <div className="flex items-center gap-2">
                        {Icons.Loader2 && <Icons.Loader2 className="h-4 w-4 animate-spin" />}
                        <span>{exportProgress ? `${exportProgress}%` : 'Generando...'}</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        {Icons.Pdf && <Icons.Pdf className="h-4 w-4" />}
                        <Tooltip content="Generar ficha PDF con información oficial preliminar">
                            <span>Descargar Ficha</span>
                        </Tooltip>
                    </div>
                )}
            </button>
        </div>
    );
};

// --- NEW OVERLAY PROGRESS ---
const ExportProgressOverlay = ({ isExporting, progress }) => {
    if (!isExporting) return null;
    const Icons = getIcons();

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-4 max-w-xs w-full mx-4 animate-in zoom-in-95 duration-200">
                <div className="relative">
                    <div className="w-12 h-12 border-4 border-gray-100 rounded-full"></div>
                    <div className="absolute inset-0 w-12 h-12 border-4 border-[#9d2449] border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#9d2449]">
                        {progress || 0}%
                    </div>
                </div>
                <div className="text-center">
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Generando PDF</h3>
                    <p className="text-xs text-gray-500">Por favor espere un momento...</p>
                </div>
            </div>
        </div>
    );
};


// --- NEW CATALOG CONTROLLER ---
const ActivityCatalogController = ({ analysis, Icons, COLORS }) => {
    const [activeTab, setActiveTab] = useState('prohibidas');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSectors, setSelectedSectors] = useState(new Set());
    const [showCatalog, setShowCatalog] = useState(true);

    // 1. Data Source
    const sourceList = activeTab === 'prohibidas' ? (analysis.prohibitedActivities || []) : (analysis.allowedActivities || []);

    // 2. Extract Sectors (from current list)
    const allSectors = Array.from(new Set(sourceList.map(item => item.sector))).sort();

    // 3. Filter
    // 3. Filter with Fuse.js
    const { useMemo } = window.React;

    // Fuse Instance
    const fuse = useMemo(() => {
        if (!window.Fuse) return null;
        return new window.Fuse(sourceList, {
            keys: ['sector', 'general', 'specific'],
            threshold: 0.3,
            ignoreLocation: true
        });
    }, [sourceList]);

    const filteredList = useMemo(() => {
        let results = sourceList;

        // A) Search Filter
        if (searchTerm.trim() && fuse) {
            results = fuse.search(searchTerm).map(r => r.item);
        } else if (searchTerm.trim()) {
            // Fallback simple filter if Fuse fails
            const lower = searchTerm.toLowerCase();
            results = sourceList.filter(item =>
                item.general.toLowerCase().includes(lower) ||
                item.specific.toLowerCase().includes(lower) ||
                item.sector.toLowerCase().includes(lower)
            );
        }

        // B) Sector Filter
        if (selectedSectors.size > 0) {
            results = results.filter(item => selectedSectors.has(item.sector));
        }

        return results;
    }, [sourceList, searchTerm, selectedSectors, fuse]);

    // Handlers
    const toggleSector = (sec) => {
        const next = new Set(selectedSectors);
        if (next.has(sec)) next.delete(sec);
        else next.add(sec);
        setSelectedSectors(next);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedSectors(new Set());
    };

    return (
        <div className="mt-8 mb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gray-100 rounded-md text-gray-500">
                        {Icons.List ? <Icons.List className="h-4 w-4" /> : <span>=</span>}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                            Catálogo de Actividades
                            <Tooltip content="Alcance: Estas actividades aplican específicamente a la zonificación PGOEDF del predio consultado.">
                                <span className="ml-1 text-gray-400 hover:text-gray-600 text-xs cursor-help">ⓘ</span>
                            </Tooltip>
                        </h3>
                        <p className="text-[10px] text-gray-400">Consulta los usos permitidos y prohibidos</p>
                    </div>
                </div>
            </div>

            {/* Controls Container */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 mb-4">

                {/* Search & Tabs Row */}
                {/* Search & Tabs Row - Refactored for Wrapper */}
                <div className="flex flex-col gap-3 mb-4">
                    {/* Search Input */}
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {Icons.Search ? <Icons.Search className="h-4 w-4" /> : <span>🔍</span>}
                        </div>
                        <input
                            type="text"
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                            placeholder="Buscar actividad (ej. vivienda, comercio, abarrotes)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <Tooltip content="Limpiar búsqueda">
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </Tooltip>
                        )}
                    </div>

                    {/* Accessible Tabs (Headless UI Pattern) */}
                    <div className="flex p-1 bg-gray-100 rounded-lg shrink-0" role="tablist" aria-label="Filtro de actividades">
                        <button
                            role="tab"
                            aria-selected={activeTab === 'prohibidas'}
                            aria-controls="panel-prohibidas"
                            id="tab-prohibidas"
                            onClick={() => setActiveTab('prohibidas')}
                            className={`flex-1 px-4 py-2 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-[#9d2449] ${activeTab === 'prohibidas'
                                ? 'bg-white text-red-700 shadow-sm ring-1 ring-black/5'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Prohibidas ({analysis.prohibitedActivities?.length || 0})
                        </button>
                        <button
                            role="tab"
                            aria-selected={activeTab === 'permitidas'}
                            aria-controls="panel-permitidas"
                            id="tab-permitidas"
                            onClick={() => setActiveTab('permitidas')}
                            className={`flex-1 px-4 py-2 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-[#9d2449] ${activeTab === 'permitidas'
                                ? 'bg-white text-green-700 shadow-sm ring-1 ring-black/5'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Permitidas ({analysis.allowedActivities?.length || 0})
                        </button>
                    </div>
                </div>

                {/* Sector Chips & Mobile Index */}
                {allSectors.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Filtrar por Sector</span>
                            {(selectedSectors.size > 0) && (
                                <button onClick={clearFilters} className="text-[10px] text-blue-500 hover:text-blue-700 font-medium hover:underline">
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto custom-scrollbar">
                            {allSectors.map(sec => {
                                const isSelected = selectedSectors.has(sec);
                                return (
                                    <button
                                        key={sec}
                                        onClick={() => toggleSector(sec)}
                                        className={`px-2 py-0.5 rounded-md text-[9px] font-bold border transition-all active:scale-95 text-left ${isSelected
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {sec}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Results List (Tab Panel) */}
            <div
                role="tabpanel"
                id={`panel-${activeTab}`}
                aria-labelledby={`tab-${activeTab}`}
                className="animate-in fade-in slide-in-from-bottom-2 focus:outline-none"
                tabIndex={0}
            >
                <div className="text-[10px] text-gray-400 font-medium mb-2 text-right">
                    Mostrando {filteredList.length} de {sourceList.length} resultados
                </div>

                {filteredList.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <div className="text-2xl mb-2 opacity-20">🔍</div>
                        <div className="text-sm font-semibold text-gray-500">No se encontraron actividades</div>
                        <div className="text-xs text-gray-400">Intenta ajustar tu búsqueda o los filtros de sector</div>
                        <button onClick={clearFilters} className="mt-4 px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-lg text-xs font-bold text-gray-600 hover:text-blue-600">
                            Ver todo
                        </button>
                    </div>
                ) : (
                    <GroupedActivities
                        title={activeTab === 'prohibidas' ? "Listado de Prohibiciones" : "Listado de Usos Permitidos"}
                        activities={filteredList}
                        icon={activeTab === 'prohibidas'
                            ? (Icons.XCircle ? <Icons.XCircle className="h-4 w-4" /> : null)
                            : (Icons.CheckCircle ? <Icons.CheckCircle className="h-4 w-4" /> : null)
                        }
                        headerClass={activeTab === 'prohibidas' ? "text-red-800" : "text-green-800"}
                        bgClass="bg-white shadow-sm hover:shadow-md transition-shadow"
                        accentColor={activeTab === 'prohibidas' ? COLORS.error : COLORS.success}
                    />
                )}
            </div>
        </div>
    );
};

const ResultsContent = ({ analysis, approximateAddress, onExportPDF, isExporting, exportProgress }) => {
    const [showNotes, setShowNotes] = useState(false);
    const [activeSection, setActiveSection] = useState('Resumen');

    // Safety check for Library
    const InView = window.ReactIntersectionObserver?.InView || (({ children }) => children);
    // Safety check for StickyBox (assuming named export or default - usually default for CDN)
    const StickyBox = window.ReactStickyBox?.default || window.ReactStickyBox || (({ children }) => children);

    const Icons = getIcons();
    const COLORS = getConstants().COLORS || {};

    if (!analysis) return null;

    const { status, zoningKey, isANP, zoningName, polygonData } = analysis;
    const zoningDisplay = getZoningDisplay(analysis);
    const isUrban = status === 'URBAN_SOIL';

    return (
        <div className="space-y-3 animate-in pb-4">




            {/* 1. Location and basic context */}
            <InView as="div" onChange={(inView) => inView && setActiveSection('Resumen Contextual')} threshold={0.5}>
                <LocationSummary analysis={analysis} approximateAddress={approximateAddress} />
            </InView>

            {/* 1.A Primary Actions (Desktop Static) */}
            <div className="hidden md:block z-20">
                <StickyBox offsetTop={45} offsetBottom={20}>
                    <PrimaryActionHeader analysis={analysis} approximateAddress={approximateAddress} onExportPDF={onExportPDF} isExporting={isExporting} exportProgress={exportProgress} />
                </StickyBox>
            </div>



            {/* NEW: Full Screen Overlay for PDF Generation */}
            <ExportProgressOverlay isExporting={isExporting} progress={exportProgress} />

            {/* 1.B Citizen Summary (Rule Based) */}

            {/* 1.B Citizen Summary (Rule Based) */}
            <CitizenSummaryCard analysis={analysis} />



            {/* 2. Unified Critical Alerts */}


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

            {/* 3. Instrumento Rector (Moved to bottom/support, but per request "Reubicarlo visualmente dentro de un bloque de soporte", 
               usually support is near the end, but logic flow suggests it is associated with zoning. 
               The prompt says "Reducir peso visual... evitar que compita".
               I will keep it here but the new component style handles the "Support" look.
            */}
            <NormativeInstrumentCard analysis={analysis} />

            {/* 4. Zonificación PGOEDF (Solo SC) */}
            <ZoningResultCard analysis={analysis} zoningDisplay={zoningDisplay} />

            {/* 5. ANP Details (Si aplica) */}
            <AnpGeneralCard analysis={analysis} />
            <AnpInternalCard analysis={analysis} />

            {/* 6. Catálogo de Actividades (Solo SC, no PDU) - REFACTORED */}
            {analysis.status === 'CONSERVATION_SOIL' &&
                !analysis.isPDU &&
                !analysis.noActivitiesCatalog && (
                    <InView as="div" onChange={(inView) => inView && setActiveSection('Catálogo de Actividades')} threshold={0.2} rootMargin="-20% 0px -50% 0px">
                        <ActivityCatalogController analysis={analysis} Icons={Icons} COLORS={COLORS} />
                    </InView>
                )}

            {/* 7. Notas Normativas, Instrumentos, Disclaimers (Soporte) */}
            <InView as="div" onChange={(inView) => inView && setActiveSection('Soporte Normativo')} threshold={0.3}>
                {/* 7. NOTAS moved here logic wise for grouping */}
                {status === 'CONSERVATION_SOIL' && zoningKey && zoningKey !== 'NODATA' && zoningKey !== 'ANP' && (
                    <div className="mt-4 mb-4 border border-gray-100 rounded-lg overflow-hidden">
                        <Tooltip content="Ver detalles y excepciones normativas">
                            <button
                                type="button"
                                aria-expanded={showNotes}
                                aria-controls="notes-panel"
                                onClick={() => setShowNotes(!showNotes)}
                                className="w-full flex items-center gap-2 p-3 bg-white hover:bg-gray-50 transition-colors text-left group focus:outline-none focus:bg-gray-50"
                            >
                                <div className="p-1 bg-gray-100 rounded text-gray-500 group-hover:text-gray-700 transition-colors">
                                    {showNotes ? (Icons.ChevronUp ? <Icons.ChevronUp className="h-3 w-3" /> : <span>-</span>) : (Icons.ChevronDown ? <Icons.ChevronDown className="h-3 w-3" /> : <span>+</span>)}
                                </div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide group-hover:text-gray-700">
                                    Notas Normativas y Criterios
                                </span>
                            </button>
                        </Tooltip>

                        <div
                            id="notes-panel"
                            hidden={!showNotes}
                            className={`bg-gray-50/50 border-t border-gray-100 ${showNotes ? 'block animate-in slide-in-from-top-1 fade-in' : 'hidden'}`}
                        >
                            <div className="p-3 pl-4 prose prose-sm max-w-none">
                                <ul className="space-y-2">
                                    {[
                                        "Adicionalmente a lo dispuesto en la tabla de usos del suelo, para cualquier obra o actividad que se pretenda desarrollar se deberán contemplar los criterios y lineamientos señalados en el programa de Ordenamiento Ecológico, así como cumplir con los permisos y autorizaciones en materia ambiental del Distrito Federal.",
                                        "Los usos del suelo no identificados en esta tabla deberán cumplir con los permisos y autorizaciones en materia urbana y ambiental aplicables en Suelo de Conservación.",
                                        "En las Areas Naturales Protegidas ANP regirá la zonificación especificada en su respectivo Programa de Manejo.",
                                        "La zonificación denominada PDU corresponde a las áreas normadas por los Programas Delegacionales o Parciales de Desarrollo Urbano vigentes.",
                                        "Las disposiciones de la presente regulación no prejuzgan sobre la propiedad de la tierra.",
                                        "El Suelo de Conservación definido por las barrancas estará regulado por la zonificación Forestal de Conservación FC, conforme a los límites establecidos por la Norma de Ordenación N° 21, señalada en los Programas de Desarrollo Urbano.",
                                        "* Se instrumentará un programa de reconversión de esta actividad por la producción de composta. Para ello, se elaborará un padrón de los productores y diseñar y ejecutar un programa de capacitación y proponer paquetes tecnológicos para transferencia y el desarrollo de estudios de mercado para la sustitución progresiva del producto y la reducción de la extracción directa."
                                    ].map((note, idx) => (
                                        <li key={idx} className="text-[10px] text-gray-500 leading-relaxed text-justify relative pl-3">
                                            <span className="absolute left-0 top-1.5 w-1 h-1 rounded-full bg-gray-300"></span>
                                            {note}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* 8. Action Buttons (Refactored) */}
                <MobileActionButtons analysis={analysis} onExportPDF={onExportPDF} isExporting={isExporting} exportProgress={exportProgress} />

                {/* 9. Disclaimer */}
                <LegalDisclaimer />
            </InView>
        </div>
    );
};

window.App.Components.ResultsContent = ResultsContent;
