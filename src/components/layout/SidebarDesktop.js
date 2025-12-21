const Icons = window.App.Components.Icons;
const SearchLogicDesktop = window.App.Components.SearchLogicDesktop;
const SkeletonAnalysis = window.App.Components.SkeletonAnalysis;
const ResultsContent = window.App.Components.ResultsContent;

const SidebarDesktop = ({
    analysis,
    onLocationSelect,
    onReset,
    isOpen,
    onToggle,
    onExportPDF,
    desktopSearchSetRef,
    isLoading,
    onOpenHelp // ✅ Prop para abrir ayuda
}) => (
    <div className="hidden md:flex h-full z-[1020]">
        <div
            id="sidebar-desktop"
            className={`
        flex flex-col h-full overflow-y-auto custom-scrollbar
        transition-all duration-300 ease-out
        ${isOpen
                    ? 'w-[360px] bg-white border-r border-gray-200 shadow-xl'
                    : 'w-0 bg-transparent border-0 shadow-none'}
      `}
        >
            {isOpen && (
                <>
                    <div className="p-4 bg-white border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#9d2148] text-white flex items-center justify-center">
                                <Icons.MapIcon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-[18px] font-semibold text-gray-900 leading-tight">
                                    Consulta Ciudadana
                                </h2>
                                <div className="text-[12px] text-gray-600 mt-0.5">
                                    Dirección o coordenadas
                                </div>
                            </div>

                            {/* ✅ Botón de Ayuda Restaurado */}
                            <button
                                onClick={onOpenHelp}
                                className="p-2 text-gray-400 hover:text-[#9d2148] hover:bg-red-50 rounded-full transition-colors"
                                title="Ayuda y Soporte"
                                aria-label="Ayuda y Soporte"
                            >
                                <span className="font-bold text-xl">?</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-4 space-y-4">
                        <SearchLogicDesktop
                            onLocationSelect={onLocationSelect}
                            onReset={onReset}
                            setInputRef={desktopSearchSetRef}
                            initialValue={analysis ? `${analysis.coordinate.lat.toFixed(6)}, ${analysis.coordinate.lng.toFixed(6)}` : ''}
                        />

                        {!analysis && !isLoading && (
                            <div className="flex flex-col items-center justify-center text-center py-20 px-6 animate-in fade-in zoom-in duration-500">
                                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100 relative group cursor-default">
                                    <div className="absolute inset-0 rounded-full border border-[#9d2148]/10 scale-110 group-hover:scale-125 transition-transform duration-700"></div>
                                    <Icons.MapPinned className="h-10 w-10 text-[#9d2148] drop-shadow-sm" />
                                    <div className="absolute bottom-6 right-6 w-3 h-3 bg-[#b28e5c] rounded-full border border-white"></div>
                                </div>

                                <h3 className="text-[16px] font-bold text-gray-800 mb-2">
                                    Bienvenido al Visor Ciudadano
                                </h3>
                                <p className="text-[13px] text-gray-500 leading-relaxed max-w-[260px] mx-auto">
                                    Explora la zonificación y normatividad ambiental de la CDMX.
                                    <br className="mb-2" />
                                    <span className="text-[#9d2148] font-medium">Selecciona un punto en el mapa</span> o busca una dirección para comenzar.
                                </p>
                            </div>
                        )}

                        {/* ✅ Show Skeleton when loading */}
                        {isLoading && <SkeletonAnalysis />}

                        {analysis && !isLoading && <ResultsContent analysis={analysis} onExportPDF={onExportPDF} />}
                    </div>
                </>
            )}
        </div>

        <button
            onClick={onToggle}
            className="
        absolute top-24 transform -translate-x-1/2 z-[1030]
        w-8 h-16 bg-[#9d2148] text-white shadow-lg rounded-r-full
        flex items-center justify-center cursor-pointer
        hover:bg-[#7d1d3a] active:scale-95 transition-all duration-200
      "
            style={{ left: isOpen ? 360 : 0 }}
            title={isOpen ? 'Ocultar panel' : 'Mostrar panel'}
            aria-label={isOpen ? 'Ocultar panel' : 'Mostrar panel'}
        >
            <span className="text-base font-extrabold">{isOpen ? '«' : '»'}</span>
        </button>
    </div>
);

window.App.Components.SidebarDesktop = SidebarDesktop;
