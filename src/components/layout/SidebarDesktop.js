const Icons = window.App?.Components?.Icons || new Proxy({}, { get: () => () => null });
const SearchLogicDesktop = window.App?.Components?.SearchLogicDesktop || (() => null);
const SkeletonAnalysis = window.App?.Components?.SkeletonAnalysis || (() => null);
const ResultsContent = window.App?.Components?.ResultsContent || (() => null);

// --- SHARED TOOLTIP COMPONENT ---
const Tooltip = ({ content, children, placement = 'right' }) => {
    const triggerRef = React.useRef(null);
    const { useEffect } = React;

    useEffect(() => {
        if (triggerRef.current && window.tippy && content) {
            const instance = window.tippy(triggerRef.current, {
                content: content,
                placement: placement,
                animation: 'scale',
                arrow: true,
                theme: 'light-border',
            });
            return () => instance.destroy();
        }
    }, [content, placement]);

    return (
        <span ref={triggerRef} className="">
            {children}
        </span>
    );
};

const SidebarDesktop = ({
    analysis,
    onLocationSelect,
    onReset,
    isOpen,
    onToggle,
    onExportPDF,
    desktopSearchSetRef,
    isLoading,
    isExporting,
    exportProgress,
    onOpenHelp,
    approximateAddress
}) => (
    <div className="hidden md:flex h-full z-[1020] relative">

        <div
            id="sidebar-desktop"
            className={window.clsx(
                "flex flex-col fixed top-[60px] bottom-4 left-0 transition-all duration-300 ease-out glass-panel border-l-0 rounded-r-2xl mr-4 z-[1020]",
                isOpen ? "w-[420px]" : "w-0 border-none opacity-0"
            )}
            style={{ height: 'calc(100vh - 60px - 16px)' }}
        >
            <div
                className={`
                    w-[420px] flex flex-col h-full
                    transition-opacity duration-200 delay-75
                    ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                `}
            >


                {/* Fixed Search Section */}
                <div className="p-3 pb-2 z-20 relative">
                    <SearchLogicDesktop
                        onLocationSelect={onLocationSelect}
                        onReset={onReset}
                        setInputRef={desktopSearchSetRef}
                        initialValue={analysis?.coordinate ? `${analysis.coordinate.lat.toFixed(6)}, ${analysis.coordinate.lng.toFixed(6)}` : ''}
                    />
                </div>

                {/* Contenido Scrollable */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3 space-y-3 relative">

                    {!analysis && !isLoading && (
                        <div className="flex flex-col items-center justify-center text-center py-4 px-4 animate-in fade-in zoom-in duration-500 select-none opacity-80 mt-2">
                            {/* Ilustración Hero Compacta */}
                            <div className="relative mb-2 group">
                                <div className="absolute inset-0 bg-[#9d2148] rounded-full blur-xl opacity-5 group-hover:opacity-10 transition-opacity duration-700"></div>
                                <div className="relative w-10 h-10 bg-gradient-to-tr from-white to-gray-50 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
                                    <Icons.MapIcon className="h-5 w-5 text-[#9d2148] opacity-80" strokeWidth={1.5} />
                                </div>
                            </div>

                            <p className="text-xs text-gray-500 font-medium">
                                Selecciona un punto o busca una dirección.
                            </p>
                        </div>
                    )}

                    {isLoading && <SkeletonAnalysis />}

                    {analysis && !isLoading && (
                        <>
                            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm -mx-3 px-3 py-2 border-b border-gray-100 shadow-sm flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold text-[#9d2449] uppercase tracking-wider flex items-center gap-2">
                                    <Icons.ChartBar className="h-3.5 w-3.5" />
                                    Resultados del Análisis
                                </span>
                            </div>
                            <ResultsContent analysis={analysis} approximateAddress={approximateAddress} onExportPDF={onExportPDF} isExporting={isExporting} exportProgress={exportProgress} />
                        </>
                    )}
                </div>
            </div>
        </div>

        {/* Toggle Button Desacoplado */}
        <Tooltip content={isOpen ? 'Ocultar panel lateral' : 'Mostrar panel lateral'}>
            <button
                onClick={onToggle}
                className={`
                    fixed top-[72px]
                    ${isOpen ? 'left-[420px]' : 'left-0'}
                    z-[1030]
                    w-6 h-12
                    bg-[#9d2148] text-white 
                    shadow-md rounded-r-lg
                    flex items-center justify-center 
                    hover:bg-[#8a1c3b]
                    focus:outline-none focus:ring-2 focus:ring-[#9d2148] focus:ring-offset-2
                    transition-all duration-300 ease-out
                `}
                aria-label={isOpen ? 'Ocultar panel' : 'Mostrar panel'}
            >
                <span className="text-xs font-bold leading-none">{isOpen ? '«' : '»'}</span>
            </button>
        </Tooltip>
    </div>
);

window.App.Components.SidebarDesktop = SidebarDesktop;
