const { useState, useEffect } = window.React;

/**
 * Safe Lazy Access Helpers
 */
const getIcons = () => window.App?.Components?.Icons || new Proxy({}, { get: () => () => null });
const getToggleSwitch = () => window.App?.Components?.ToggleSwitch || (() => null);
const getConstants = () => window.App?.Constants || {};

const Legend = ({
    visibleMapLayers,
    setVisibleMapLayers,
    visibleZoningCats,
    setVisibleZoningCats,
    selectedAnpId,
    isOpen,
    setIsOpen
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

    const toggleZoningCat = (catId) => {
        setVisibleZoningCats(prev => ({
            ...prev,
            [catId]: !prev[catId]
        }));
    };

    const handleToggleLayer = (layerKey) => {
        // Prevent toggling locked layers if UI somehow exposes them
        if (layerKey === 'edomex' || layerKey === 'morelos') return;

        setVisibleMapLayers(prev => ({
            ...prev,
            [layerKey]: !prev[layerKey]
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="absolute bottom-24 right-4 z-[1000] w-64 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-200 flex flex-col max-h-[50vh] transition-all animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-white/50 rounded-t-lg">
                <div className="flex items-center gap-2">
                    {Icons.Map ? <Icons.Map className="h-4 w-4 text-[#9d2148]" /> : <span>M</span>}
                    <span className="font-bold text-gray-800 text-xs uppercase tracking-wide">Capas y Zonificación</span>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                    title="Ocultar leyenda"
                >
                    {Icons.ChevronDown ? <Icons.ChevronDown className="h-4 w-4 text-gray-500" /> : <span>-</span>}
                </button>
            </div>

            {/* Content with Scroll */}
            <div className="overflow-y-auto p-3 space-y-4 custom-scrollbar">

                {/* ESTRUCTURA URBANA (Capas Base) */}
                <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Estructura</h4>

                    {/* SC Toggle */}
                    <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-2">
                            <span
                                className="w-3 h-3 rounded-full border border-gray-300 shadow-sm"
                                style={{ backgroundColor: styles.sc?.color }}
                            />
                            <span className="text-[11px] font-medium text-gray-700 group-hover:text-gray-900">
                                Suelo de Conservación
                            </span>
                        </div>
                        <ToggleSwitch
                            checked={!!visibleMapLayers.sc}
                            onChange={() => handleToggleLayer('sc')}
                            size="sm"
                        />
                    </div>

                    {/* ANP Toggle */}
                    <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-2">
                            <span
                                className="w-3 h-3 rounded-full border border-gray-300 shadow-sm"
                                style={{ backgroundColor: styles.anp?.color }}
                            />
                            <span className="text-[11px] font-medium text-gray-700 group-hover:text-gray-900">
                                Áreas Naturales Protegidas
                            </span>
                        </div>
                        <ToggleSwitch
                            checked={!!visibleMapLayers.anp}
                            onChange={() => handleToggleLayer('anp')}
                            size="sm"
                        />
                    </div>
                </div>

                {/* ZONIFICACIÓN */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Zonificación CDMX</h4>
                        <ToggleSwitch
                            checked={!!visibleMapLayers.zoning}
                            onChange={() => handleToggleLayer('zoning')}
                            size="sm"
                        />
                    </div>

                    {/* Lista de Categorías de Zonificación */}
                    {visibleMapLayers.zoning && ZONING_ORDER && ZONING_CAT_INFO && (
                        <div className="pl-1 space-y-1.5 border-l-2 border-gray-100 ml-1">
                            {ZONING_ORDER.map(catKey => {
                                const info = ZONING_CAT_INFO[catKey];
                                if (!info) return null;
                                const isVisible = visibleZoningCats[catKey] !== false;

                                return (
                                    <div
                                        key={catKey}
                                        className={`flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-50 transition-colors ${!isVisible ? 'opacity-50 grayscale' : ''}`}
                                        onClick={() => toggleZoningCat(catKey)}
                                    >
                                        <div
                                            className="w-2.5 h-2.5 rounded-sm shadow-sm flex-shrink-0"
                                            style={{ backgroundColor: info.color }}
                                        />
                                        <div className="flex flex-col leading-none">
                                            <span className="text-[10px] font-semibold text-gray-700">{info.label}</span>
                                            <span className="text-[9px] text-gray-500">{info.desc}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ANP SELECTED ZONING (Dynamic Info) */}
                {selectedAnpId && (
                    <div className="pt-2 border-t border-gray-100 mt-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {Icons.Info ? <Icons.Info className="h-3 w-3 text-blue-500" /> : <span>i</span>}
                                <span className="text-[10px] font-semibold text-blue-700">Zonificación Interna ANP</span>
                            </div>
                            <ToggleSwitch
                                checked={!!visibleMapLayers.selectedAnpZoning}
                                onChange={() => handleToggleLayer('selectedAnpZoning')}
                                size="sm"
                            />
                        </div>
                    </div>
                )}


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
        </div>
    );
};

window.App.Components.Legend = Legend;
