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

/* ------------------------------------------------ */
/* BUNDLED CONFIGURATION (Audit Phase 1 Fix) */
/* ------------------------------------------------ */
/* ------------------------------------------------ */
/* BUNDLED CONFIGURATION REMOVED - NOW IN useAppData */
/* ------------------------------------------------ */



// Componentes UI (Lazy Access)
const Icons = Components.Icons || new Proxy({}, { get: () => () => null });
const InstitutionalHeader = Components.InstitutionalHeader || (() => null);
const ToggleSwitch = Components.ToggleSwitch || (() => null);
const Legend = Components.Legend || (() => null);
const HelpModal = Components.HelpModal || (() => null);
const MapViewer = Components.MapViewer || (() => null);
const MobileSearchBar = Components.MobileSearchBar || (() => null);
const SkeletonAnalysis = Components.SkeletonAnalysis || (() => null);
const ResultsContent = Components.ResultsContent || (() => null);
const SearchLogicDesktop = Components.SearchLogicDesktop || (() => null);
const SidebarDesktop = Components.SidebarDesktop || (() => null);

// Analysis access moved to component scope


const PdfExportController = Components.PdfExportController || (() => null);

/* ------------------------------------------------ */
/* 3. LÓGICA GEOESPACIAL (GEOJSON & DATOS) */
/* ------------------------------------------------ */




/* ------------------------------------------------ */
/* 4. LÓGICA GEOESPACIAL (GEOJSON & DATOS) */
/* ------------------------------------------------ */

// Data Loading Logic moved to useAppData hook

/* ===== FIN BLOQUE NUEVO (MERGE + loadExtraData) ===== */



/* ------------------------------------------------ */
/* 5. COMPONENTES UI COMPARTIDOS */
/* ------------------------------------------------ */

/* 6.1 Mensajes de estado */



/* ------------------------------------------------ */
/* ------------------------------------------------ */
/* 6.2 Resumen Ejecutivo */
/* ------------------------------------------------ */

/* ------------------------------------------------ */
/* NEW COMPONENT: TOAST NOTIFICATIONS */
/* ------------------------------------------------ */
const ToastContext = React.createContext(null);

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
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[5000] flex flex-col gap-2 pointer-events-none">
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
    </ToastContext.Provider>
  );
};

const useToast = () => React.useContext(ToastContext);

/* ------------------------------------------------ */
/* ------------------------------------------------ */


/* 7.3 Bottom Sheet Móvil */
/* ------------------------------------------------ */
const BottomSheetMobile = ({ analysis, onLocationSelect, onReset, onClose, onStateChange, onExportPDF }) => {
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
            ? 'No se encontró información disponible para esta zona.'
            : 'Detalle normativo del punto de consulta.';

  return (
    <div
      ref={sheetRef}
      className="
        md:hidden
        fixed bottom-0 left-0 w-full
        bg-white
        rounded-t-2xl
        shadow-[0_-5px_20px_rgba(0,0,0,0.2)]
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
              <>
                <h3 className="font-bold text-gray-900 text-sm truncate">Visor de Consulta Ciudadana</h3>
                <p className="text-[18px] text-gray-900 line-clamp-2 mt-0.5">{statusLabel}</p>
              </>
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
          <ResultsContent analysis={analysis} onExportPDF={onExportPDF} />
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
              if (onExportPDF) onExportPDF(e);
              else alert('No se pudo generar el PDF. Intenta recargar la página.');
            }}
            className="flex-1 min-w-[110px] flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 py-2.5 px-4 rounded-full text-xs font-bold shadow-sm hover:bg-gray-50"
            title="Descargar ficha técnica en PDF"
          >
            <Icons.Pdf className="h-4 w-4" /> Exportar PDF
          </button>
        </div>
      )}
    </div>
  );
};




/* ------------------------------------------------ */
/* 9. APLICACIÓN PRINCIPAL */
/* ------------------------------------------------ */

const App = () => {
  // 1. DATA HOOK Integration
  const { useAppData } = window.App?.Hooks || {};
  const { loading, dataCache, constants, error } = useAppData ? useAppData() : { loading: true };

  // Constants Access
  const { ZONING_ORDER } = constants || {};
  const { analyzeLocation } = window.App?.Analysis || {};

  // Local State
  const [analyzing, setAnalyzing] = useState(false);
  const [extraDataLoaded, setExtraDataLoaded] = useState(false); // Deprecated but kept for compatibility
  const [systemError, setSystemError] = useState(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [location, setLocation] = useState(null);

  const { addToast } = useToast();

  // Capas mapa
  const [visibleMapLayers, setVisibleMapLayers] = useState({
    sc: true,
    anp: true,
    zoning: true,
    alcaldias: true,
    edomex: true,
    morelos: true,
    selectedAnpZoning: true
  });

  // Categorías zonificación
  const [visibleZoningCats, setVisibleZoningCats] = useState(() => {
    const d = {};
    (ZONING_ORDER || []).forEach(k => (d[k] = true));
    return d;
  });

  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeBaseLayer, setActiveBaseLayer] = useState('SATELLITE');
  const [mobileSheetState, setMobileSheetState] = useState('collapsed');

  const [exportHandler, setExportHandler] = useState(null);

  const handleExportClick = React.useCallback((e) => {
    if (typeof exportHandler === 'function') {
      exportHandler(e);
    } else {
      alert('Aún no se puede exportar. Intenta recargar la página.');
    }
  }, [exportHandler]);

  const invalidateMapRef = useRef(null);
  const resetMapViewRef = useRef(null);
  const desktopSearchInputRef = useRef(null);
  const mobileSearchInputRef = useRef(null);

  const handleLocationSelect = async (c) => {
    const lat = Number(c?.lat);
    const lng = Number(c?.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    const coord = { lat, lng };
    const text = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    setLocation(coord);

    desktopSearchInputRef.current?.(text);
    mobileSearchInputRef.current?.(text);

    setAnalyzing(true);

    try {
      const res = await analyzeLocation(coord, dataCache);
      setAnalysis(res);

      if (res.status === 'OUTSIDE_CDMX') {
        addToast('El punto está fuera de la CDMX', 'error');
      } else {
        addToast('Análisis completado', 'success');
      }
    } catch (err) {
      addToast('Error al analizar la ubicación', 'error');
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setLocation(null);
    setAnalysis(null);
    setMobileSheetState('collapsed');
    resetMapViewRef.current?.();
  };

  const handleUserLocation = () => {
    navigator.geolocation.getCurrentPosition(
      p => {
        const coord = { lat: p.coords.latitude, lng: p.coords.longitude };
        handleLocationSelect(coord);

        const text = `${coord.lat.toFixed(6)}, ${coord.lng.toFixed(6)}`;
        desktopSearchInputRef.current?.(text);
        mobileSearchInputRef.current?.(text);
      },
      () => addToast("No se pudo obtener tu ubicación. Revisa permisos.", 'error')
    );
  };

  const toggleLayer = React.useCallback((key) => {
    setVisibleMapLayers(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleZoningGroup = React.useCallback(() => {
    setVisibleMapLayers(prev => ({ ...prev, zoning: !prev.zoning }));
  }, []);

  // Initialization Effect
  useEffect(() => {
    if (loading) return; // Wait for hook to finish

    // Simulate deprecated values for component compat
    setExtraDataLoaded(true);

    if (error) {
      setSystemError(`Error cargando datos: ${error}`);
      return;
    }

    const initUrlParams = async () => {
      const params = new URLSearchParams(window.location.search);
      const lat = parseFloat(params.get("lat"));
      const lng = parseFloat(params.get("lng"));
      const hasCoords = !isNaN(lat) && !isNaN(lng);

      if (!hasCoords) setIsHelpOpen(true);
      if (hasCoords) handleLocationSelect({ lat, lng });
    };

    initUrlParams();

  }, [loading, error, handleLocationSelect]);

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
    <div className={`flex flex-col w-full h-full overflow-hidden bg-[#f3f4f6] ${loading || analyzing ? 'cursor-wait' : ''}`}>

      <InstitutionalHeader />

      <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden">

        <div className="md:hidden absolute top-0 left-0 right-0 z-[1045] p-3 pointer-events-none">
          <MobileSearchBar
            onLocationSelect={handleLocationSelect}
            onReset={handleReset}
            setInputRef={mobileSearchInputRef}
            initialValue={analysis ? `${analysis.coordinate.lat.toFixed(6)}, ${analysis.coordinate.lng.toFixed(6)}` : ''}
          />
        </div>

        <SidebarDesktop
          analysis={analysis}
          onLocationSelect={handleLocationSelect}
          onReset={handleReset}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(v => !v)}
          onExportPDF={handleExportClick}
          desktopSearchSetRef={desktopSearchInputRef}
          isLoading={analyzing}
          onOpenHelp={() => setIsHelpOpen(true)}
        />

        <div className="relative flex-1 h-full w-full">
          <MapViewer
            location={location}
            onLocationSelect={handleLocationSelect}
            analysisStatus={analysis?.status}
            visibleMapLayers={visibleMapLayers}
            setVisibleMapLayers={setVisibleMapLayers}
            visibleZoningCats={visibleZoningCats}
            setVisibleZoningCats={setVisibleZoningCats}
            extraDataLoaded={extraDataLoaded}
            activeBaseLayer={activeBaseLayer}
            setActiveBaseLayer={setActiveBaseLayer}
            invalidateMapRef={invalidateMapRef}
            resetMapViewRef={resetMapViewRef}
            selectedAnpId={analysis?.anpId}
            dataCache={dataCache}
          />

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
            setIsOpen={setIsLegendOpen}
            visibleZoningCats={visibleZoningCats}
            toggleZoningGroup={toggleZoningGroup}
            setVisibleZoningCats={setVisibleZoningCats}
            activeBaseLayer={activeBaseLayer}
            setActiveBaseLayer={setActiveBaseLayer}
            selectedAnpId={analysis?.anpId}
            anpName={analysis?.anpNombre}
            anpGeneralVisible={visibleMapLayers.anp}
          />

          {!analysis?.status && (
            <div className="hidden md:flex absolute top-20 right-20 z-[1100]">
              <div className="bg-white/95 border border-gray-200 rounded-lg shadow-md px-3 py-2 text-[11px] text-gray-700 max-w-xs">
                Haz clic en el mapa o busca una dirección para iniciar la consulta de zonificación.
              </div>
            </div>
          )}

          <div className="absolute top-20 md:top-24 right-4 flex flex-col items-end gap-2.5 pointer-events-auto z-[1100]">

            <button
              type="button"
              onClick={() => setIsHelpOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 text-[#9d2148] hover:scale-105 active:scale-95 transition"
              title="Ayuda"
              aria-label="Ayuda"
            >
              <span className="font-bold text-lg">?</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLegendOpen(v => !v)}
              className={`w-10 h-10 flex items-center justify-center rounded-full shadow-lg border border-gray-200 hover:scale-105 active:scale-95 transition ${isLegendOpen ? 'bg-[#9d2148] text-white' : 'bg-white text-[#9d2148]'}`}
              title="Capas y Simbología"
              aria-label="Capas"
            >
              <Icons.Layers className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => resetMapViewRef.current?.()}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 text-[#9d2148] hover:scale-105 active:scale-95 transition"
              title="Restablecer vista"
              aria-label="Restablecer vista"
            >
              <Icons.RotateCcw className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={handleUserLocation}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 text-[#9d2148] hover:scale-105 active:scale-95 transition"
              title="Mi ubicación"
              aria-label="Usar mi ubicación actual"
            >
              <Icons.Navigation className="h-5 w-5" />
            </button>

          </div>
        </div>

        <BottomSheetMobile
          analysis={analysis}
          onLocationSelect={handleLocationSelect}
          onReset={handleReset}
          onStateChange={setMobileSheetState}
          onClose={handleReset}
          onExportPDF={handleExportClick}
        />

        <HelpModal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
        />

        <PdfExportController
          analysis={analysis}
          onExportReady={setExportHandler}
          dataCache={dataCache}
          visibleMapLayers={visibleMapLayers}
          activeBaseLayer={activeBaseLayer}
          visibleZoningCats={visibleZoningCats}
        />
      </div>
    </div>
  );
};


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ToastProvider>
    <App />
  </ToastProvider>
);

