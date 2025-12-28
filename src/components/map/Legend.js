const { useState, useEffect } = window.React;

/**
 * Safe Lazy Access Helpers
 */
/**
 * Safe Lazy Access Helpers
 */
const { getComponent, getConstants, getIcons } = window.App?.Utils || {};
const getToggleSwitch = () => getComponent('ToggleSwitch');

const Legend = ({
    visibleMapLayers,
    toggleLayer,      // Changed from setVisibleMapLayers
    visibleZoningCats,
    setVisibleZoningCats,
    selectedAnpId,
    isOpen,
    setIsOpen,
    activeBaseLayer,
    setActiveBaseLayer
}) => {
    // Access safely inside component
    const Icons = getIcons();
    const ToggleSwitch = getToggleSwitch();
    const { ZONING_CAT_INFO, ZONING_ORDER, LAYER_STYLES } = getConstants();

    // Fallback styles if Constants not loaded
    const styles = LAYER_STYLES || {
        sc: { color: '#3B7D23' },
        anp: { color: '#a855f7' },
        edomex: { color: '#64748b' },
        morelos: { color: '#64748b' }
    };

    if (!isOpen) return null;

    const toggleZoningCat = (catId) => {
        setVisibleZoningCats(prev => ({
            ...prev,
            [catId]: !prev[catId]
        }));
    };

    const handleToggleLayer = (layerKey) => {
        // Prevent toggling locked layers if UI somehow exposes them
        if (layerKey === 'edomex' || layerKey === 'morelos') return;

        // console.log('Toggling layer:', layerKey);
        if (toggleLayer) {
            toggleLayer(layerKey);
        }
    };

    // CSS visibility transition classes
    const visibilityClasses = isOpen
        ? 'opacity-100 translate-x-0 pointer-events-auto'
        : 'opacity-0 translate-x-4 pointer-events-none';

    return (
        <div
            className={`absolute top-16 md:top-24 right-4 md:right-20 z-[1110] w-[calc(100%-2rem)] md:w-64 glass-panel rounded-xl flex flex-col transition-all duration-300 ease-in-out ${visibilityClasses}`}
            style={{ maxHeight: 'calc(100% - 6rem)' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-white/50 rounded-t-lg">
                <div className="flex items-center gap-2">
                    {/* Inline fallback SVG if Icons.Map fails */}
                    {Icons.Map ? <Icons.Map className="h-4 w-4 text-[#9d2148]" /> : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9d2148" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                            <line x1="8" y1="2" x2="8" y2="18"></line>
                            <line x1="16" y1="6" x2="16" y2="22"></line>
                        </svg>
                    )}
                    <span className="font-bold text-gray-800 text-xs uppercase tracking-wide">Capas y Zonificación</span>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        // console.log('Close legend clicked');
                        setIsOpen(false);
                    }}
                    className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                    title="Cerrar"
                >
                    {Icons.X ? <Icons.X className="h-4 w-4 text-gray-500" /> : <span>✕</span>}
                </button>
            </div>

            {/* Content with Scroll */}
            <div className="overflow-y-auto p-3 space-y-4 custom-scrollbar">

                {/* MAPA BASE (Compact) */}
                <div className="space-y-1.5">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Mapa Base</h4>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveBaseLayer && setActiveBaseLayer('SATELLITE')}
                            className={`flex-1 py-1 px-2 rounded text-[10px] font-semibold border transition-all ${activeBaseLayer === 'SATELLITE'
                                ? 'bg-[#9d2148] text-white border-[#9d2148]'
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                        >
                            Satélite
                        </button>
                        <button
                            onClick={() => setActiveBaseLayer && setActiveBaseLayer('STREETS')}
                            className={`flex-1 py-1 px-2 rounded text-[10px] font-semibold border transition-all ${activeBaseLayer === 'STREETS'
                                ? 'bg-[#9d2148] text-white border-[#9d2148]'
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                        >
                            Calles Claras
                        </button>
                    </div>
                </div>

                <hr className="border-gray-100" />

                {/* ZONIFICACIÓN PRIMARIA (Solo SC) */}
                <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Zonificación Primaria</h4>

                    {/* SC Toggle */}
                    <div
                        className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                        onClick={() => handleToggleLayer('sc')}
                    >
                        <div className="flex items-center gap-2">
                            <span
                                className="w-3 h-3 rounded-full border border-gray-300 shadow-sm"
                                style={{ backgroundColor: styles.sc?.color }}
                            />
                            <span className="text-[11px] font-medium text-gray-700 group-hover:text-gray-900 select-none">
                                Suelo de Conservación
                            </span>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                            <ToggleSwitch
                                checked={!!visibleMapLayers.sc}
                                onChange={() => handleToggleLayer('sc')}
                                size="sm"
                            />
                        </div>
                    </div>
                </div>

                {/* ZONIFICACIÓN PGOEDF 2000 (Indented) */}
                <div className="space-y-2 pl-4 border-l-2 border-gray-100 ml-1">
                    <div
                        className="flex items-start justify-between mb-1 gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                        onClick={() => handleToggleLayer('zoning')}
                    >
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight select-none">
                            1.1 Zonificación PGOEDF (2000)
                        </h4>
                        <div className="flex-shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
                            <ToggleSwitch
                                checked={!!visibleMapLayers.zoning}
                                onChange={() => handleToggleLayer('zoning')}
                                size="sm"
                            />
                        </div>
                    </div>
                </div>

                {visibleMapLayers.zoning && ZONING_ORDER && ZONING_CAT_INFO && (
                    <div className="pl-1 space-y-1.5">
                        {ZONING_ORDER.map(catKey => {
                            const info = ZONING_CAT_INFO[catKey];
                            if (!info) return null;
                            const isVisible = visibleZoningCats[catKey] !== false;

                            return (
                                <div
                                    key={catKey}
                                    className="flex items-center justify-between p-1 rounded hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => toggleZoningCat(catKey)}
                                >
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-2.5 h-2.5 rounded-sm shadow-sm flex-shrink-0"
                                            style={{ backgroundColor: info.color }}
                                        />
                                        <div className="flex flex-col leading-none">
                                            <span className="text-[10px] font-semibold text-gray-700 select-none">{info.label}</span>
                                            <span className="text-[9px] text-gray-500 select-none">{info.desc}</span>
                                        </div>
                                    </div>
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <ToggleSwitch
                                            checked={isVisible}
                                            onChange={() => toggleZoningCat(catKey)}
                                            size="sm"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ANP SECTION (Separate) */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Áreas Naturales Protegidas</h4>

                {/* ANP General Toggle */}
                <div
                    className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                    onClick={() => handleToggleLayer('anp')}
                >
                    <div className="flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-full border border-gray-300 shadow-sm"
                            style={{ backgroundColor: styles.anp?.color }}
                        />
                        <span className="text-[11px] font-medium text-gray-700 group-hover:text-gray-900 select-none">
                            Polígonos ANP
                        </span>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                        <ToggleSwitch
                            checked={!!visibleMapLayers.anp}
                            onChange={() => handleToggleLayer('anp')}
                            size="sm"
                        />
                    </div>
                </div>

                {/* ANP SELECTED ZONING (Dynamic Info) */}
                {selectedAnpId && (
                    <div className="pl-4 mt-2">
                        <div
                            className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                            onClick={() => handleToggleLayer('selectedAnpZoning')}
                        >
                            <div
                                className="flex items-center gap-2"
                                title="Muestra la zonificación interna (sub-zonas) definida en el Programa de Manejo del ANP."
                            >
                                {Icons.Info ? <Icons.Info className="h-3 w-3 text-blue-500" /> : <span>i</span>}
                                <span className="text-[10px] font-semibold text-blue-700 select-none">Zonificación Interna ANP</span>
                            </div>
                            <div onClick={(e) => e.stopPropagation()}>
                                <ToggleSwitch
                                    checked={!!visibleMapLayers.selectedAnpZoning}
                                    onChange={() => handleToggleLayer('selectedAnpZoning')}
                                    size="sm"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>


            {/* CONTEXTO REGIONAL (Locked/Info only) */}
            <div className="pt-3 border-t border-gray-100 mt-2">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Contexto Regional</h4>
                <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                        <span
                            className="w-2 h-2 rounded-full opacity-50"
                            style={{ backgroundColor: styles.edomex?.color || '#999' }}
                        ></span>
                        <span className="text-[10px] text-gray-500 font-medium">Estado de México</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                        <span
                            className="w-2 h-2 rounded-full opacity-50"
                            style={{ backgroundColor: styles.morelos?.color || '#999' }}
                        ></span>
                        <span className="text-[10px] text-gray-500 font-medium">Morelos</span>
                    </div>
                </div>
            </div>

        </div>
        </div >
    );
};

window.App.Components.Legend = Legend;
