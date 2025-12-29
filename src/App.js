/* ------------------------------------------------ */
/* 1. CONFIGURACIÓN E IMPORTACIONES */
/* ------------------------------------------------ */
const React = window.React;
const { useState, useEffect, useRef } = React;
const ReactDOM = window.ReactDOM;

const AppGlobals = window.App || {};
const Constants = AppGlobals.Constants || {};
const Utils = AppGlobals.Utils || {};
const Components = AppGlobals.Components || {};
const Analysis = AppGlobals.Analysis || {};

const PdfExportController = window.App?.Components?.PdfExportController || (() => null);
const OnboardingTour = window.App?.Components?.OnboardingTour || (() => null);
const InstitutionalHeader = window.App?.Components?.InstitutionalHeader || (() => null);
// --- SAFE COMPONENTS & ICONS ---
// Ensure we handle partial loads gracefully (e.g. Icons object exists but keys are missing)
const safeComponent = (comp) => comp || (() => null);

const SidebarDesktop = safeComponent(window.App?.Components?.SidebarDesktop);
const MobileSearchBar = safeComponent(window.App?.Components?.MobileSearchBar);
const MapViewer = safeComponent(window.App?.Components?.MapViewer);
const Legend = safeComponent(window.App?.Components?.Legend);
const ResultsContent = safeComponent(window.App?.Components?.ResultsContent);
const HelpModal = safeComponent(window.App?.Components?.HelpModal);

// Safe Icon Proxy: Traps any access to undefined icons and returns a Null Component
const RealIcons = window.App?.Components?.Icons || {};
const Icons = new Proxy(RealIcons, {
  get: (target, prop) => target[prop] || (() => null)
});
// import { getReverseGeocoding } from './utils/geocodingService'; // REMOVED

// --- CONFIGURATION ---
const MAPBOX_ACCESS_TOKEN = "pk.eyJ1Ijoiam9yZ2VsaWJlcjI4IiwiYSI6ImNtajA0eHR2eTA0b2gzZnB0NnU2a2xwY2oifQ.2BDJUISBBvrm1wM8RwXusg";

/* ------------------------------------------------ */
/* 5. COMPONENTES UI COMPARTIDOS */
/* ------------------------------------------------ */

/* ------------------------------------------------ */
/* NEW COMPONENT: TOAST NOTIFICATIONS */
/* ------------------------------------------------ */

/* ------------------------------------------------ */
/* NEW COMPONENT: TOAST NOTIFICATIONS */
/* ------------------------------------------------ */
const ToastContext = React.createContext(null);

const useToast = () => React.useContext(ToastContext);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = React.useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  }, []);

  const removeToast = React.useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, toasts }}>
      {children}
    </ToastContext.Provider>
  );
};

const ToastContainer = () => {
  const { toasts } = useToast();
  return (
    <div className="absolute md:bottom-24 bottom-auto top-32 md:top-auto left-1/2 transform -translate-x-1/2 z-[5000] flex flex-col gap-2 pointer-events-none w-max max-w-[90%]">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`
              pointer-events-auto px-4 py-3 rounded-lg shadow-lg text-sm font-semibold text-white animate-slide-up flex items-center gap-2
              ${t.type === 'error' ? 'bg-red-600' : t.type === 'success' ? 'bg-green-600' : 'bg-gray-800'}
            `}
        >
          {t.type === 'error' && <Icons.AlertCircle className="h-4 w-4" />}
          {t.type === 'success' && <Icons.CheckCircle className="h-4 w-4" />}
          {t.message}
        </div>
      ))}
    </div>
  );
};



/* ------------------------------------------------ */
/* ------------------------------------------------ */

// --- SHARED TOOLTIP COMPONENT ---
const Tooltip = ({ content, children, placement = 'left' }) => {
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
    <span ref={triggerRef} className="inline-block">
      {children}
    </span>
  );
};

/* 7.3 Bottom Sheet Móvil */
/* ------------------------------------------------ */
const BottomSheetMobile = ({ analysis, onLocationSelect, onReset, onClose, onStateChange, onExportPDF, isExporting, exportProgress }) => {
  const [sheetState, setSheetState] = useState('collapsed'); // 'collapsed' | 'mid' | 'full'
  const sheetRef = useRef(null);
  const startY = useRef(0);

  useEffect(() => {
    if (onStateChange) onStateChange(sheetState);
  }, [sheetState, onStateChange]);

  useEffect(() => {
    if (analysis) setSheetState('mid');
    else setSheetState('collapsed');
  }, [analysis]);

  const goUp = () => setSheetState(prev => (prev === 'collapsed' ? 'mid' : prev === 'mid' ? 'full' : 'full'));
  const goDown = () => setSheetState(prev => (prev === 'full' ? 'mid' : prev === 'mid' ? 'collapsed' : 'collapsed'));
  const toggleFromTap = () => setSheetState(prev => (prev === 'mid' ? 'full' : 'mid'));

  const handleTouchStart = (e) => {
    if (e.target.closest('.sheet-header')) startY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const endY = e.changedTouches[0].clientY;
    const diff = startY.current - endY;
    if (Math.abs(diff) < 60) return;
    if (diff > 0) goUp();
    else goDown();
  };

  const getHeight = () => {
    if (sheetState === 'collapsed') return '18svh';
    if (sheetState === 'mid') return '45svh';
    return '85svh';
  };

  const isANP = analysis?.isANP;

  const statusLabel =
    !analysis
      ? 'Busca una dirección o toca el mapa para iniciar la consulta.'
      : analysis?.status === 'OUTSIDE_CDMX'
        ? 'El punto se encuentra fuera de la Ciudad de México.'
        : isANP
          ? 'Área Natural Protegida — consulte el Programa de Manejo correspondiente.'
          : analysis?.status === 'NO_DATA'
            ? 'No encontramos información específica para esta zona. Podría ser calle o zona federal.'
            : 'Aquí tienes la información normativa del punto.';

  return (
    <div
      ref={sheetRef}
      className="
        md:hidden
        fixed bottom-0 left-0 w-full
        glass-panel
        rounded-t-[24px] border-b-0
        shadow-[0_-5px_30px_rgba(0,0,0,0.15)]
        z-[1050]
        flex flex-col
        transition-all duration-300 ease-out
      "
      style={{ height: getHeight() }}
    >
      <div
        className="sheet-header flex-shrink-0 pt-1 pb-2 px-4 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={analysis ? toggleFromTap : undefined}
      >
        <div className="w-10 h-1.5 bg-gray-300 rounded-full mx-auto mb-2" />

        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {analysis ? (
              <h3 className="font-bold text-sm text-[#9d2148] uppercase tracking-wide">
                RESULTADO DE CONSULTA
              </h3>
            ) : (
              <div className="flex flex-col items-center justify-center pt-3 pb-1 w-full relative overflow-hidden">
                {/* Decorative Top Accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#9d2148] via-[#bc955c] to-[#9d2148]"></div>

                <div className="flex items-center gap-2 mb-1 mt-1">
                  <div className="w-2 h-2 rounded-full bg-[#9d2148]"></div>
                  <span className="text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase">SEDEMA</span>
                  <div className="w-2 h-2 rounded-full bg-[#9d2148]"></div>
                </div>

                <h3 className="font-extrabold text-[#9d2148] text-xl mb-1 uppercase tracking-tight leading-none">
                  Visor de Consulta
                </h3>

                <p className="text-sm text-gray-500 text-center px-6 leading-tight font-medium max-w-xs mx-auto">
                  {statusLabel}
                </p>
              </div>
            )}
          </div>

          {analysis && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1.5 rounded-full bg-[#9d2148] shadow-sm active:scale-95 transition"
              aria-label="Cerrar resultados"
              title="Cerrar ficha"
            >
              <Icons.X className="h-4 w-4 text-white" />
            </button>
          )}
        </div>
      </div>

      {(sheetState === 'mid' || sheetState === 'full') && (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-gray-50/50 mobile-upscale">
          <ResultsContent analysis={analysis} onExportPDF={onExportPDF} isExporting={isExporting} />
        </div>
      )}

      {analysis && (
        <div className="flex-shrink-0 p-3 bg-white border-t border-gray-200 safe-area-bottom flex gap-3 overflow-x-auto">

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${analysis.coordinate.lat},${analysis.coordinate.lng}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-[#9d2148] text-white py-2.5 px-4 rounded-full text-xs font-bold shadow-sm hover:bg-[#7d1d3a] transition-colors"
            title="Ver ubicación en Google Maps"
          >
            <Icons.MapIcon className="h-4 w-4" /> Google Maps
          </a>

          <button
            onClick={async () => {
              const url = `${window.location.origin}${window.location.pathname}?lat=${analysis.coordinate.lat}&lng=${analysis.coordinate.lng}&open=1`;
              if (navigator.share) {
                try {
                  await navigator.share({
                    title: 'Consulta Ciudadana SEDEMA',
                    text: `Ubicación: ${analysis.alcaldia}`,
                    url
                  });
                } catch { }
              } else {
                navigator.clipboard.writeText(url);
              }
            }}
            className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 py-2.5 px-4 rounded-full text-xs font-bold shadow-sm hover:bg-gray-50"
            title="Compartir ubicación"
          >
            <Icons.Share className="h-4 w-4" /> Compartir
          </button>

          <button
            type="button"
            onClick={(e) => {
              if (isExporting) return;
              if (onExportPDF) onExportPDF(e);
              else alert('No se pudo generar el PDF. Intenta recargar la página.');
            }}
            disabled={isExporting}
            className={`flex-1 min-w-[110px] flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 py-2.5 px-4 rounded-full text-xs font-bold shadow-sm hover:bg-gray-50 ${isExporting ? 'opacity-75 cursor-not-allowed' : ''}`}
            title="Descargar ficha técnica en PDF"
          >
            {isExporting ? (
              <>
                {Icons.Loader2 ? <Icons.Loader2 className="h-4 w-4 animate-spin text-[#9d2148]" /> : <span className="h-4 w-4 rounded-full border-2 border-t-[#9d2148] animate-spin" />}
                Generando... {exportProgress ? `${exportProgress}%` : ''}
              </>
            ) : (
              <>
                <Icons.Pdf className="h-4 w-4" /> Exportar PDF
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};




/* ------------------------------------------------ */
/* 9. APLICACIÓN PRINCIPAL */
/* ------------------------------------------------ */

const VisorApp = () => {
  // --- STATE HOOK INTEGRATION (REFACTORED) ---
  const useVisorState = window.App?.Hooks?.useVisorState;
  if (!useVisorState) {
    console.error("CRITICAL: useVisorState Hook missing!");
    return <div className="p-10 text-red-600 font-bold">Error Crítico: Falta hook de estado. Recarga la página.</div>;
  }

  const { state, actions } = useVisorState();

  // Local UI State for FAB Menu
  const [isFabOpen, setIsFabOpen] = useState(false);

  // Destructure State
  const {
    analyzing, extraDataLoaded, systemError, isHelpOpen, analysis, location,
    currentZoom, isLegendOpen, isSidebarOpen, activeBaseLayer, globalOpacity,
    approximateAddress, mobileSheetState, isExporting, exportProgress,
    visibleMapLayers, visibleZoningCats, loading, dataCache, constants, error, toasts
  } = state;

  // Destructure Actions
  const {
    updateState, handleLocationSelect: handleLocationSelectAction, handleReset: handleResetAction, toggleLayer, toggleZoningCat, addToast,
    setExportHandler, getExportHandler
  } = actions;

  // Refs
  const invalidateMapRef = useRef(null);
  const resetMapViewRef = useRef(null);
  const zoomInRef = useRef(null);
  const zoomOutRef = useRef(null);
  const desktopSearchInputRef = useRef(null);
  const mobileSearchInputRef = useRef(null);

  // --- DERIVED HELPERS ---
  const MAPBOX_ACCESS_TOKEN = constants?.MAPBOX_TOKEN;
  const { getReverseGeocoding } = window.App?.Utils || {};

  // Wrapper for Location Select to inject Refs and Dependencies
  const onLocationSelect = (coord) => {
    handleLocationSelectAction(
      coord,
      mobileSearchInputRef,
      desktopSearchInputRef,
      getReverseGeocoding,
      MAPBOX_ACCESS_TOKEN
    );
  };

  // Wrapper for Reset to inject Refs
  const handleReset = () => {
    handleResetAction(resetMapViewRef);
  };

  // Wrapper for Export to use local state
  const handleExportClick = React.useCallback(async (e) => {
    const exportFn = getExportHandler();
    if (typeof exportFn === 'function') {
      if (isExporting) return; // Prevent double click

      updateState({ isExporting: true });

      try {
        await exportFn(e);
        addToast('Documento PDF generado exitosamente', 'success');
      } catch (err) {
        console.error("Export Error", err);
        addToast('Error al generar PDF', 'error');
      } finally {
        updateState({ isExporting: false, exportProgress: 0 });
      }
    } else {
      alert('Aún no se puede exportar. Intenta recargar la página.');
    }
  }, [getExportHandler, isExporting, addToast, updateState]);


  const handleUserLocation = () => {
    navigator.geolocation.getCurrentPosition(
      p => {
        const coord = { lat: p.coords.latitude, lng: p.coords.longitude };
        onLocationSelect(coord);

        const text = `${coord.lat.toFixed(6)}, ${coord.lng.toFixed(6)}`;
        desktopSearchInputRef.current?.(text);
        mobileSearchInputRef.current?.(text);
      },
      () => addToast("No se pudo obtener tu ubicación. Revisa permisos.", 'error')
    );
  };

  const toggleZoningGroup = React.useCallback(() => {
    toggleLayer('zoning');
  }, [toggleLayer]);

  // --- MISSING HELPERS FIX ---
  const setVisibleZoningCats = (val) => updateState({ visibleZoningCats: typeof val === 'function' ? val(visibleZoningCats) : val });
  const setActiveBaseLayer = (val) => updateState({ activeBaseLayer: val });
  const setMobileSheetState = (val) => updateState({ mobileSheetState: val });




  // Initialization Effect: Parse URL Params
  useEffect(() => {
    if (loading) return;

    // Simulate deprecated values for component compat
    if (!extraDataLoaded) updateState({ extraDataLoaded: true });

    if (error) {
      updateState({ systemError: `Error cargando datos: ${error}` });
      return;
    }

    const initUrlParams = async () => {
      const params = new URLSearchParams(window.location.search);
      const lat = parseFloat(params.get("lat"));
      const lng = parseFloat(params.get("lng"));
      const hasCoords = !isNaN(lat) && !isNaN(lng);

      // if (!hasCoords) setIsHelpOpen(true); // Disable auto-open to favor OnboardingTour
      if (hasCoords) onLocationSelect({ lat, lng });
    };

    initUrlParams();
  }, [loading, error, extraDataLoaded, updateState, onLocationSelect]); // Run once when loading finishes


  if (systemError) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 text-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md border-l-4 border-red-600">
          <Icons.AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Error de Inicialización</h1>
          <p className="text-sm text-gray-600 mb-6">{systemError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
          >
            Recargar Página
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-[#9d2148] flex-col gap-3">
        <Icons.Loader2 className="animate-spin h-10 w-10" />
        <span className="text-sm font-medium animate-pulse">Cargando visor...</span>
      </div>
    );
  }



  return (
    <div className={`flex flex-col w-full h-full overflow-hidden ${loading || analyzing ? 'cursor-wait' : ''}`} style={{ background: 'var(--bg-soft-gradient)' }}>

      <InstitutionalHeader />

      <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden">

        <div className="md:hidden absolute top-4 left-0 right-0 z-[2000] px-4 pointer-events-none flex justify-center">
          <div className="w-full max-w-lg pointer-events-auto">
            <MobileSearchBar
              onLocationSelect={onLocationSelect}
              onReset={handleReset}
              setInputRef={mobileSearchInputRef}
              initialValue={analysis ? `${analysis.coordinate.lat.toFixed(6)}, ${analysis.coordinate.lng.toFixed(6)}` : ''}
            />
          </div>
        </div>

        <SidebarDesktop
          analysis={analysis}
          approximateAddress={approximateAddress}
          onLocationSelect={onLocationSelect}
          onReset={handleReset}
          isOpen={isSidebarOpen}
          onToggle={() => updateState({ isSidebarOpen: !isSidebarOpen })}
          onExportPDF={handleExportClick}
          desktopSearchSetRef={desktopSearchInputRef}
          isLoading={analyzing}


          isExporting={isExporting}
          exportProgress={exportProgress}
          onOpenHelp={() => updateState({ isHelpOpen: true })}
        />

        <div className="relative flex-1 h-full w-full">
          <MapViewer
            location={location}
            onLocationSelect={onLocationSelect}
            analysisStatus={analysis?.status}
            isANP={analysis?.isANP}
            visibleMapLayers={visibleMapLayers}
            setVisibleMapLayers={(newVal) => updateState({ visibleMapLayers: typeof newVal === 'function' ? newVal(visibleMapLayers) : newVal })}
            visibleZoningCats={visibleZoningCats}
            setVisibleZoningCats={(newVal) => updateState({ visibleZoningCats: typeof newVal === 'function' ? newVal(visibleZoningCats) : newVal })}
            extraDataLoaded={extraDataLoaded}
            activeBaseLayer={activeBaseLayer}
            setActiveBaseLayer={(val) => updateState({ activeBaseLayer: val })}
            globalOpacity={globalOpacity}
            setGlobalOpacity={(val) => updateState({ globalOpacity: val })}

            invalidateMapRef={invalidateMapRef}
            resetMapViewRef={resetMapViewRef}
            zoomInRef={zoomInRef}
            zoomOutRef={zoomOutRef}
            selectedAnpId={analysis?.anpId}
            dataCache={dataCache}
            onZoomChange={(z) => updateState({ currentZoom: z })}
          />

          <ToastContainer />

          {loading && (
            <div className="absolute inset-0 z-[2000] bg-white/60 backdrop-blur-sm flex items-center justify-center animate-fade-in">
              <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-gray-200 border-l-[#9d2148] rounded-full animate-spin mb-3"></div>
                <span className="text-gray-800 font-bold text-sm">Cargando mapa base...</span>
              </div>
            </div>
          )}

          <Legend
            visibleMapLayers={visibleMapLayers}
            toggleLayer={toggleLayer}
            isOpen={isLegendOpen}
            setIsOpen={(val) => updateState({ isLegendOpen: val })}
            visibleZoningCats={visibleZoningCats}
            toggleZoningGroup={toggleZoningGroup}
            setVisibleZoningCats={setVisibleZoningCats}
            activeBaseLayer={activeBaseLayer}
            setActiveBaseLayer={setActiveBaseLayer}
            selectedAnpId={analysis?.anpId}
            anpName={analysis?.anpNombre}
            anpGeneralVisible={visibleMapLayers.anp}
          />


          {/* CONTROLS STACK */}
          <div className="absolute top-24 md:top-24 right-4 flex flex-col items-end gap-2 pointer-events-auto z-[1100]">

            {/* 1. Help (Always visible, Top priority) */}
            <Tooltip content="Ayuda y Tutorial">
              <button
                type="button"
                onClick={() => updateState({ isHelpOpen: true })}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-[#9d2148] hover:scale-105 active:scale-95 transition"
              >
                <span className="font-bold text-xl">?</span>
              </button>
            </Tooltip>

            {/* 2. Zoom Controls (Always visible) */}
            <div className="flex flex-col bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 select-none">
              <Tooltip content="Acercar">
                <button
                  onClick={() => zoomInRef.current?.()}
                  className="w-8 h-8 flex items-center justify-center text-[#9d2148] hover:bg-gray-50 active:bg-gray-100 transition cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </Tooltip>
              <div className="h-[1px] bg-gray-200 w-full" />
              <Tooltip content="Alejar">
                <button
                  onClick={() => zoomOutRef.current?.()}
                  className="w-8 h-8 flex items-center justify-center text-[#9d2148] hover:bg-gray-50 active:bg-gray-100 transition cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </Tooltip>
            </div>

            {/* Gap */}
            <div className="h-4"></div>

            {/* 3. OPTIONS FAB (Groups Layers, Location, Reset, Opacity) */}
            <div className="relative flex flex-col items-end gap-3">

              {/* Expanded Menu Items */}
              <div className={`flex flex-col items-end gap-3 transition-all duration-300 origin-bottom ${isFabOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-8 pointer-events-none absolute bottom-2 right-0'}`}>

                {/* Opacity Slider */}
                <div className="flex items-center gap-2 bg-white rounded-full shadow-md border border-gray-200 px-3 h-10 animate-fade-in-up">
                  <span className="text-[10px] font-bold text-gray-500 w-8 text-right pr-1">Opacidad</span>
                  <input
                    type="range"
                    min="0.1"
                    max="0.5"
                    step="0.05"
                    value={globalOpacity || 0.25}
                    onChange={(e) => updateState({ globalOpacity: parseFloat(e.target.value) })}
                    className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#9d2449]"
                  />
                </div>

                {/* Reset View */}
                <Tooltip content="Restablecer vista" placement="left">
                  <button
                    onClick={() => { resetMapViewRef.current?.(); setIsFabOpen(false); }}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-[#9d2148] hover:bg-gray-50"
                  >
                    <Icons.RotateCcw className="h-5 w-5" />
                  </button>
                </Tooltip>

                {/* My Location */}
                <Tooltip content="Mi Ubicación" placement="left">
                  <button
                    onClick={() => { handleUserLocation(); setIsFabOpen(false); }}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-[#9d2148] hover:bg-gray-50"
                  >
                    <Icons.Navigation className="h-5 w-5" />
                  </button>
                </Tooltip>

                {/* Layers Button */}
                <Tooltip content="Capas y Simbología" placement="left">
                  <button
                    onClick={() => { updateState({ isLegendOpen: !isLegendOpen }); setIsFabOpen(false); }}
                    className={`w-10 h-10 flex items-center justify-center rounded-full shadow-md border border-gray-200 hover:scale-105 transition ${isLegendOpen ? 'bg-[#9d2148] text-white' : 'bg-white text-[#9d2148]'}`}
                  >
                    <Icons.Layers className="h-5 w-5" />
                  </button>
                </Tooltip>

              </div>

              {/* FAB Trigger */}
              <Tooltip content={isFabOpen ? "Cerrar menú" : "Más opciones"} placement="left">
                <button
                  onClick={() => setIsFabOpen(!isFabOpen)}
                  className={`w-12 h-12 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 z-10 ${isFabOpen ? 'bg-gray-700 rotate-90 text-white' : 'bg-[#9d2148] text-white hover:bg-[#8a1c3b] hover:scale-105'}`}
                >
                  {isFabOpen ? <Icons.X className="h-6 w-6" /> : <Icons.Menu className="h-6 w-6" />}
                </button>
              </Tooltip>

            </div>

          </div>
        </div>

        <BottomSheetMobile
          analysis={analysis}
          onLocationSelect={onLocationSelect}
          onReset={handleReset}
          onStateChange={setMobileSheetState}
          onClose={handleReset}
          onExportPDF={handleExportClick}


          isExporting={isExporting}
          exportProgress={exportProgress}
        />

        <HelpModal
          isOpen={isHelpOpen}
          onClose={() => updateState({ isHelpOpen: false })}
        />

        {/* --- CONTROLLER: PDF EXPORT --- */}
        <PdfExportController
          analysis={analysis}
          onExportReady={setExportHandler}
          onProgress={(val) => updateState({ exportProgress: val })}
          dataCache={dataCache}
          visibleMapLayers={visibleMapLayers}
          activeBaseLayer={activeBaseLayer}
          visibleZoningCats={visibleZoningCats}
          currentZoom={currentZoom}
          approximateAddress={approximateAddress}
        />

        {/* --- CONTROLLER: ONBOARDING TOUR --- */}
        <OnboardingTour />
      </div>
    </div>
  );
};



// Error Boundary para capturar crashes de React
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught Error in Component:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 text-red-900 h-screen flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold mb-4">Algo salió mal.</h1>
          <p className="mb-4">Se ha producido un error inesperado en la aplicación.</p>
          <pre className="bg-red-100 p-4 rounded text-xs overflow-auto max-w-2xl border border-red-200">
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800"
          >
            Recargar Página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- HELPER FUNCTIONS ---
const getReverseGeocoding = async (lat, lng, apiKey) => {
  if (!apiKey) return null;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=address,poi,neighborhood,locality,place&language=es&access_token=${apiKey}`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return data.features?.[0]?.place_name || null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <ToastProvider>
      <VisorApp />
    </ToastProvider>
  </ErrorBoundary>
);


