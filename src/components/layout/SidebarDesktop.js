const Icons = window.App?.Components?.Icons || new Proxy({}, { get: () => () => null });
const SearchLogicDesktop = window.App?.Components?.SearchLogicDesktop || (() => null);
const SkeletonAnalysis = window.App?.Components?.SkeletonAnalysis || (() => null);
const ResultsContent = window.App?.Components?.ResultsContent || (() => null);

const SidebarDesktop = ({
    analysis,
    onLocationSelect,
    onReset,
    isOpen,
    onToggle,
    onExportPDF,
    desktopSearchSetRef,
    isLoading,
    onOpenHelp
}) => (
    <div className="hidden md:flex h-full z-[1020] relative">
        <div
            id="sidebar-desktop"
            className={`
                flex flex-col h-full 
                transition-all duration-300 ease-out
                bg-white border-r border-gray-200 shadow-lg
                ${isOpen ? 'w-[360px]' : 'w-0 border-none'}
            `}
        >
            <div
                className={`
                    w-[360px] flex flex-col h-full
                    transition-opacity duration-200 delay-75
                    ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                `}
            >
                {/* Header Institucional */}
                <div className="flex-shrink-0 p-4 bg-gray-50 border-b border-gray-200 border-t-4 border-t-[#9d2148]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#9d2148] text-white flex items-center justify-center shadow-sm">
                            <Icons.MapIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-[18px] font-semibold text-gray-900 leading-tight tracking-tight">
                                Consulta Ciudadana
                            </h2>
                            <div className="text-[12px] text-gray-500 mt-0.5 font-medium">
                                Dirección o coordenadas
                            </div>
                        </div>

                        <button
                            onClick={onOpenHelp}
                            className="
                                p-2 text-gray-500 hover:text-[#9d2148] hover:bg-[#9d2148]/10 
                                rounded-full transition-colors 
                                focus-visible:ring-2 focus-visible:ring-[#9d2148] outline-none
                            "
                            title="Ayuda y Soporte"
                            aria-label="Ayuda y Soporte"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Contenido Scrollable */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                    <SearchLogicDesktop
                        onLocationSelect={onLocationSelect}
                        onReset={onReset}
                        setInputRef={desktopSearchSetRef}
                        initialValue={analysis?.coordinate ? `${analysis.coordinate.lat.toFixed(6)}, ${analysis.coordinate.lng.toFixed(6)}` : ''}
                    />

                    {!analysis && !isLoading && (
                        <div className="flex flex-col items-center justify-center text-center py-20 px-6 animate-in fade-in zoom-in duration-500 select-none">
                            {/* Ilustración Hero */}
                            <div className="relative mb-6 group">
                                <div className="absolute inset-0 bg-[#9d2148] rounded-full blur-2xl opacity-5 group-hover:opacity-10 transition-opacity duration-700"></div>
                                <div className="relative w-24 h-24 bg-gradient-to-tr from-white to-gray-50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex items-center justify-center transform group-hover:-translate-y-1 transition-transform duration-500">
                                    <Icons.MapIcon className="h-10 w-10 text-[#9d2148] opacity-80" strokeWidth={1.5} />

                                    {/* Badge Flotante */}
                                    <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-sm border border-gray-50 text-[#BC955C]">
                                        <Icons.Navigation className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-base font-bold text-gray-800 mb-2">
                                Bienvenido al Visor Ciudadano
                            </h3>
                            <p className="text-sm text-gray-500 leading-relaxed max-w-[260px] mx-auto">
                                Para comenzar, selecciona un predio en el mapa o busca una dirección específica.
                            </p>

                            {/* Decorative dots */}
                            <div className="flex gap-2 justify-center mt-6 opacity-30">
                                <div className="w-1 h-1 rounded-full bg-[#9d2148]"></div>
                                <div className="w-1 h-1 rounded-full bg-[#9d2148]"></div>
                                <div className="w-1 h-1 rounded-full bg-[#9d2148]"></div>
                            </div>
                        </div>
                    )}

                    {isLoading && <SkeletonAnalysis />}

                    {analysis && !isLoading && <ResultsContent analysis={analysis} onExportPDF={onExportPDF} />}
                </div>
            </div>
        </div>

        {/* Toggle Button Desacoplado */}
        <button
            onClick={onToggle}
            className="
                absolute top-24 left-full
                transform -translate-x-0 z-[1030]
                w-8 h-12 
                bg-[#9d2148] text-white 
                shadow-md rounded-r-lg
                flex items-center justify-center 
                hover:bg-[#7d1d3a] 
                active:scale-95 
                focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#9d2148] outline-none
                transition-all duration-200
            "
            title={isOpen ? 'Ocultar panel' : 'Mostrar panel'}
            aria-label={isOpen ? 'Ocultar panel' : 'Mostrar panel'}
        >
            <span className="text-sm font-bold">{isOpen ? '«' : '»'}</span>
        </button>
    </div>
);

window.App.Components.SidebarDesktop = SidebarDesktop;
