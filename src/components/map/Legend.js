// REMOVED unsafe top-level destructuring.
// Constants are now accessed lazily inside the component.

const Icons = window.App.Components.Icons;
const ToggleSwitch = window.App.Components.ToggleSwitch;

const Legend = ({
    visibleMapLayers,
    toggleLayer,
    isOpen,
    setIsOpen,
    visibleZoningCats,
    toggleZoningGroup,
    setVisibleZoningCats,

    activeBaseLayer,
    setActiveBaseLayer,
    selectedAnpId,
    anpName,
    anpGeneralVisible
}) => {
    // Safe Lazy Access
    const { LAYER_STYLES, ZONING_CAT_INFO, ZONING_ORDER } = window.App?.Constants || {};

    // Safety check just in case
    if (!LAYER_STYLES || !ZONING_CAT_INFO || !ZONING_ORDER) return null;
    if (!isOpen) return null; // ✅ Legend logic moved to MapControls

    return (
        <div className="fixed top-20 md:top-24 right-16 z-[2000] w-64 max-h-[60vh] md:max-h-[500px] glass-panel rounded-xl shadow-lg animate-in fade-in slide-in-from-top-2 flex flex-col border border-gray-100/50">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/20 bg-[#9d2148]/90 backdrop-blur-md rounded-t-xl shrink-0">
                <h3 className="font-bold text-white text-xs flex items-center gap-2">
                    <Icons.Layers className="h-3.5 w-3.5 text-white" />
                    Capas y Simbología
                </h3>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors text-white"
                    aria-label="Cerrar panel de capas"
                >
                    <Icons.X className="h-3.5 w-3.5" />
                </button>
            </div>

            {/* Content Scrollable - Compacto */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-white/90 space-y-4">

                {/* 0. Mapa Base */}
                <div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1">Mapa Base</div>
                    <div className="flex bg-gray-100 p-0.5 rounded-lg gap-0.5 border border-gray-100">
                        {[
                            { id: 'STREETS', label: 'Calles' },
                            { id: 'SATELLITE', label: 'Satélite' },
                            { id: 'TOPO', label: 'Topográfico' }
                        ].map(opt => {
                            const isActive = activeBaseLayer === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => setActiveBaseLayer(opt.id)}
                                    className={`
                    flex-1 py-1 px-1 rounded-md text-[9px] font-bold transition-all duration-200
                    ${isActive
                                            ? 'bg-white text-[#9d2148] shadow-sm ring-1 ring-[#9d2148]/10'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                        }
                  `}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 1. Contexto - CON SIMBOLOGÍA */}
                <div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Contexto y Límites</div>
                    <div className="space-y-2">

                        {/* Capa Alcaldías, Edomex y Morelos visibles pero no toggleables a petición */}

                        <label className="flex items-center justify-between group cursor-pointer hover:bg-gray-50/50 p-1 rounded-lg transition-colors">
                            <div className="flex items-center gap-2">
                                <div className="w-3.5 h-3.5 rounded shadow-sm opacity-80" style={{ backgroundColor: LAYER_STYLES.sc.color }} />
                                <span className="text-[11px] text-gray-700 font-medium group-hover:text-gray-900">Suelo de Conservación</span>
                            </div>
                            <ToggleSwitch
                                checked={visibleMapLayers.sc}
                                onChange={() => toggleLayer('sc')}
                                activeColor="#9d2148"
                            />
                        </label>

                        {/* Capas Edomex y Morelos ocultas en leyenda a petición (pero existen en mapa) */}

                        <div className="pt-2 border-t border-gray-100">
                            <label className="flex items-center justify-between group cursor-pointer hover:bg-gray-50/50 p-1 rounded-lg transition-colors">
                                <div className="flex items-center gap-2">
                                    <div className="w-3.5 h-3.5 rounded bg-[#a855f7] border border-white shadow-sm" />
                                    <span className="text-[11px] text-gray-800 font-bold">Áreas Naturales Protegidas</span>
                                </div>
                                <ToggleSwitch
                                    checked={visibleMapLayers.anp}
                                    onChange={() => toggleLayer('anp')}
                                    activeColor="#9d2148"
                                    title={selectedAnpId && anpName ? `ANP: ${anpName}` : "Activar/Desactivar capa ANP"}
                                />
                            </label>
                        </div>

                        <div className={`transition-opacity ${!selectedAnpId ? 'opacity-40 pointer-events-none' : ''}`}>
                            <label className="flex items-center justify-between group cursor-pointer hover:bg-gray-50/50 p-1 rounded-lg transition-colors">
                                <div className="flex items-center gap-2">
                                    <div className="w-3.5 h-3.5 rounded border border-purple-500 bg-purple-100 shadow-sm" />
                                    <span className="text-[11px] text-purple-900 font-bold">Zonificación Interna ANP</span>
                                </div>
                                <ToggleSwitch
                                    checked={visibleMapLayers.selectedAnpZoning}
                                    onChange={() => {
                                        if (!selectedAnpId) return;
                                        if (anpGeneralVisible) {
                                            alert("Desactiva la capa 'Áreas Naturales Protegidas' para ver el detalle interno.");
                                            return;
                                        }
                                        toggleLayer('selectedAnpZoning');
                                    }}
                                    activeColor="#9d2148"
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* 2. Zonificación PGOEDF y PDU */}
                <div>
                    {/* Header PGOEDF */}
                    <div className="flex items-center justify-between mb-3 mt-4">
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                            Zonificación PGOEDF 2000
                        </div>
                        <button onClick={toggleZoningGroup} className="text-[10px] text-[#9d2148] font-bold hover:underline">
                            {visibleMapLayers.zoning ? 'Ocultar todo' : 'Mostrar todo'}
                        </button>
                    </div>

                    <div className={`space-y-2 pl-1 transition-opacity duration-200 ${!visibleMapLayers.zoning ? 'opacity-50 pointer-events-none' : ''}`}>
                        {ZONING_ORDER.filter(cat => !cat.startsWith('PDU_')).map(cat => {
                            const info = ZONING_CAT_INFO[cat];
                            const isChecked = visibleZoningCats[cat] !== false;
                            return (
                                <div key={cat} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <span
                                            className="w-3 h-3 rounded shadow-sm shrink-0"
                                            style={{ backgroundColor: info?.color || '#999' }}
                                        />
                                        <span className="text-[11px] text-gray-600 font-medium leading-tight">
                                            {info?.label || cat}
                                        </span>
                                    </div>
                                    <ToggleSwitch
                                        checked={isChecked}
                                        onChange={() => setVisibleZoningCats(prev => ({ ...prev, [cat]: !isChecked }))}
                                        activeColor="#9d2148"
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {/* Header PDU */}
                    <div className="flex items-center justify-between mb-3 mt-6 pt-4 border-t border-gray-100">
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                            Programas de Desarrollo Urbano
                        </div>
                    </div>

                    <div className={`space-y-2 pl-1 transition-opacity duration-200 ${!visibleMapLayers.zoning ? 'opacity-50 pointer-events-none' : ''}`}>
                        {ZONING_ORDER.filter(cat => cat.startsWith('PDU_')).map(cat => {
                            const info = ZONING_CAT_INFO[cat];
                            const isChecked = visibleZoningCats[cat] !== false;
                            return (
                                <div key={cat} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <span
                                            className="w-3 h-3 rounded shadow-sm shrink-0"
                                            style={{ backgroundColor: info?.color || '#999' }}
                                        />
                                        <span className="text-[11px] text-gray-600 font-medium leading-tight">
                                            {info?.label || cat}
                                        </span>
                                    </div>
                                    <ToggleSwitch
                                        checked={isChecked}
                                        onChange={() => setVisibleZoningCats(prev => ({ ...prev, [cat]: !isChecked }))}
                                        activeColor="#9d2148"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};

window.App.Components.Legend = Legend;
