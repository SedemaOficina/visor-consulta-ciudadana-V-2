const { useState, useEffect, useRef } = window.React;

/**
 * Safe Lazy Access Helpers
 */
const getConstants = () => window.App?.Constants || {};
const getUtils = () => window.App?.Utils || {};
const getIcons = () => window.App?.Components?.Icons || new Proxy({}, { get: () => () => null });

const MapViewer = ({
    location,
    onLocationSelect,
    analysisStatus,
    isANP,
    visibleMapLayers,
    setVisibleMapLayers,
    visibleZoningCats,
    setVisibleZoningCats,
    extraDataLoaded,
    activeBaseLayer,
    setActiveBaseLayer,
    invalidateMapRef,
    resetMapViewRef,
    selectedAnpId,
    dataCache,
    onZoomChange,
    globalOpacity = 0.7,
    setGlobalOpacity
}) => {
    // Access Constants lazily
    const Constants = getConstants();
    const Utils = getUtils();
    const Icons = getIcons();

    const {
        LAYER_STYLES,
        ZONING_ORDER,
        ZONING_CAT_INFO,
        INITIAL_CENTER = [19.32, -99.15],
        INITIAL_ZOOM = 11,
        FOCUS_ZOOM = 16
    } = Constants;

    const {
        getBaseLayerUrl = () => '',
        getZoningStyle = () => ({ color: '#ccc' })
    } = Utils;

    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const layersRef = useRef({});          // sc, alcaldias, edomex, morelos, base
    const zoningLayersRef = useRef({});    // {ANP: layer, FC: layer, ... }
    const selectedAnpLayerRef = useRef(null);
    const markerRef = useRef(null);
    const [tilesLoading, setTilesLoading] = useState(true);

    // ✅ Helper para sanitizar tooltip
    const escapeHtml = (text) => {
        if (!text) return '';
        return text
            .toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    // ✅ Helper para tooltips coloreados
    const bindColoredTooltip = (layerInstance, label, color, prefix = '') => {
        const safeLabel = escapeHtml(label);
        const html = `
        <div style="
            background: ${color};
            color: #fff;
            padding: 5px 10px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 11px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            text-transform: uppercase;
            letter-spacing: 0.025em;
            border: 1px solid rgba(255,255,255,0.2);
            white-space: nowrap;
        ">
            ${prefix ? `<span style="opacity:0.8; margin-right:4px;">${prefix}</span>` : ''}
            ${safeLabel}
        </div>
        `;
        layerInstance.bindTooltip(html, {
            sticky: true,
            className: 'colored-tooltip-container',
            direction: 'top',
            offset: [0, -10]
        });
    };

    // 1) INIT MAP
    useEffect(() => {
        if (!mapRef.current || mapInstance.current || !window.L) return;

        // Expanded bounds to allow visualization of 'Outside' points (Central Mexico approx)
        // or just generous enough to not lock the view too tight
        const bounds = window.L.latLngBounds([14.0, -106.0], [24.0, -93.0]);

        const map = window.L.map(mapRef.current, {
            zoomControl: false,
            attributionControl: false,
            minZoom: 9,
            maxZoom: 18,
            preferCanvas: true,
            maxBounds: bounds,
            maxBoundsViscosity: 0.5 // Less rigid bounce back
        }).setView(INITIAL_CENTER, INITIAL_ZOOM);

        window.L.control.attribution({ position: 'topleft', prefix: false }).addTo(map);
        mapInstance.current = map;

        // Track Zoom Logic
        map.on('zoomend', () => {
            if (onZoomChange) onZoomChange(map.getZoom());
        });

        // ✅ calcular bounds de CDMX una sola vez (si existe geojson)
        let cdmxBounds = null;
        try {
            if (dataCache?.cdmx?.features?.length) {
                const tmp = window.L.geoJSON(dataCache.cdmx);
                cdmxBounds = tmp.getBounds();
            }
        } catch { }

        // ✅ Exponer "reset view" a App
        if (resetMapViewRef) {
            resetMapViewRef.current = () => {
                try {
                    const m = mapInstance.current;
                    if (!m) return;

                    if (cdmxBounds && cdmxBounds.isValid()) {
                        m.fitBounds(cdmxBounds, { padding: [20, 20] });
                    } else {
                        m.setView(INITIAL_CENTER, INITIAL_ZOOM);
                    }
                } catch { }
            };
        }

        // Bind Zoom Refs
        if (zoomInRef) zoomInRef.current = () => map.zoomIn();
        if (zoomOutRef) zoomOutRef.current = () => map.zoomOut();

        // ✅ Exponer invalidateSize a App
        // Bind Zoom Refs
        if (zoomInRef) zoomInRef.current = () => mapInstance.current?.zoomIn();
        if (zoomOutRef) zoomOutRef.current = () => mapInstance.current?.zoomOut();

        if (invalidateMapRef) {
            invalidateMapRef.current = () => {
                try { mapInstance.current?.invalidateSize(); } catch { }
            };
        }

        // PANES CONFIGURATION
        // Order (Stacking Context):
        // 1. Base Tile (z=300)
        // 2. Context Layers (Edomex, Morelos, Alcaldías) (z=350)
        // 3. SC Overlay (z=375)
        // 4. Overlays (Zoning, ANP) (z=400)

        map.createPane('paneBase');
        map.getPane('paneBase').style.zIndex = 300;

        map.createPane('paneContext');
        map.getPane('paneContext').style.zIndex = 350;

        map.createPane('paneSCOverlay');
        map.getPane('paneSCOverlay').style.zIndex = 375;

        map.createPane('paneOverlay');
        map.getPane('paneOverlay').style.zIndex = 400;

        // BASE TILE
        const base = window.L.tileLayer(getBaseLayerUrl(activeBaseLayer || 'SATELLITE'), {
            pane: 'paneBase',
            maxZoom: 19,
            tileSize: 256,
            zoomOffset: 0,
            crossOrigin: 'anonymous'
        });

        base.on('loading', () => setTilesLoading(true));
        base.on('load', () => setTilesLoading(false));
        base.addTo(map);
        layersRef.current.base = base;

        // CORE layers (SC, Alcaldías)
        const sc = dataCache?.sc;
        const alcaldias = dataCache?.alcaldias;
        const styles = LAYER_STYLES || {}; // Safe fallback

        const addCoreLayer = (name, data, style, tooltipField, pane, interactive = true) => {
            if (!data?.features?.length) return;

            const layer = window.L.geoJSON(data, {
                pane,
                style,
                interactive,
                onEachFeature: (feature, layerInstance) => {
                    // Hover effects
                    if (interactive && !window.L.Browser.mobile) {
                        layerInstance.on('mouseover', () => {
                            layerInstance.setStyle({ weight: 3, fillOpacity: 0.3 });
                            layerInstance.bringToFront();
                        });
                        layerInstance.on('mouseout', () => {
                            layerInstance.setStyle(style); // Restore Original Style
                        });
                    }

                    // Tooltip Logic
                    if (name === 'sc') {
                        bindColoredTooltip(layerInstance, "Suelo de Conservación", styles.sc?.color || '#3B7D23');
                    } else if (tooltipField && feature.properties?.[tooltipField]) {
                        layerInstance.bindTooltip(escapeHtml(feature.properties[tooltipField]), {
                            sticky: true,
                            className: 'custom-tooltip'
                        });
                    }
                }
            });

            layersRef.current[name] = layer;
            map.addLayer(layer);
        };

        addCoreLayer(
            'sc',
            sc,
            {
                color: styles.sc?.color || '#3B7D23',
                weight: 1.5,
                opacity: 1,
                fillColor: styles.sc?.fill || '#3B7D23',
                fillOpacity: 0.2,
                interactive: true
            },
            null,
            'paneSCOverlay',
            true
        );

        addCoreLayer(
            'alcaldias',
            alcaldias,
            {
                color: activeBaseLayer === 'SATELLITE' ? '#FFFFFF' : '#374151', // White on dark, dark gray on light
                weight: 2,
                opacity: 0.9,
                fillOpacity: 0
            },
            null,
            'paneContext',
            false // Non-interactive to avoid blocking clicks to layers below if any
        );

        map.on('click', e => onLocationSelect(e.latlng));

        setTimeout(() => {
            try { map.invalidateSize(); } catch { }
        }, 200);

        return () => {
            try { map.remove(); } catch { }
            mapInstance.current = null;
            if (resetMapViewRef) resetMapViewRef.current = null;
            layersRef.current = {};
            zoningLayersRef.current = {};
            markerRef.current = null;
            if (invalidateMapRef) invalidateMapRef.current = null;
        };
    }, []);

    // 2) EXTRA layers + zoning layers
    useEffect(() => {
        if (!mapInstance.current || !extraDataLoaded || !window.L || !dataCache) return;

        const { edomex, morelos, zoning, anp } = dataCache;
        const styles = LAYER_STYLES || {};

        const addLayer = (name, data, style, tooltipField, pane, interactive = true) => {
            if (!data?.features?.length) return;

            const layer = window.L.geoJSON(data, {
                pane,
                style,
                interactive,
                onEachFeature: (feature, layerInstance) => {
                    if (interactive && !window.L.Browser.mobile) {
                        layerInstance.on('mouseover', () => layerInstance.setStyle({ weight: 3, fillOpacity: 0.3 }));
                        layerInstance.on('mouseout', () => layerInstance.setStyle(style));
                    }

                    if (name === 'anp' && feature.properties?.NOMBRE) {
                        bindColoredTooltip(layerInstance, feature.properties.NOMBRE, styles.anp?.color || '#a855f7', "ANP:");
                    } else if (tooltipField && feature.properties?.[tooltipField]) {
                        layerInstance.bindTooltip(escapeHtml(feature.properties[tooltipField]), {
                            sticky: true,
                            className: 'custom-tooltip'
                        });
                    }
                }
            });

            layersRef.current[name] = layer;
            mapInstance.current.addLayer(layer);
        };

        // Layers External Context (Edomex/Morelos) -> paneContext
        if (!layersRef.current.edomex) {
            addLayer('edomex', edomex, {
                color: styles.edomex?.color || '#64748b',
                weight: 1.5,
                dashArray: '4,4',
                opacity: 0.9,
                fillOpacity: 0.1
            }, 'NOMGEO', 'paneContext', true);
        }

        if (!layersRef.current.morelos) {
            addLayer('morelos', morelos, {
                color: styles.morelos?.color || '#64748b',
                weight: 1.5,
                dashArray: '4,4',
                opacity: 0.9,
                fillOpacity: 0.1
            }, 'NOMGEO', 'paneContext', true);
        }

        // ANP overlay -> paneOverlay
        if (!layersRef.current.anp) {
            addLayer('anp', anp, {
                color: styles.anp?.color || '#a855f7',
                weight: 1.5,
                opacity: 0.9,
                fillColor: styles.anp?.fill || '#a855f7',
                fillOpacity: 0.2
            }, 'NOMBRE', 'paneOverlay', true);
        }

        // Build zoning layers
        if (zoning?.features?.length && Object.keys(zoningLayersRef.current).length === 0) {
            const byKey = {};
            (ZONING_ORDER || []).forEach(k => (byKey[k] = []));

            zoning.features.forEach(f => {
                let k = (f.properties?.CLAVE || '').toString().trim().toUpperCase();

                if (k === 'PDU' || k === 'PROGRAMAS' || k === 'ZONA URBANA') {
                    const desc = (f.properties?.PGOEDF || '').toLowerCase();
                    if (desc.includes('equipamiento')) k = 'PDU_ER';
                    else if (desc.includes('parcial')) k = 'PDU_PP';
                    else if (desc.includes('poblad') || desc.includes('rural') || desc.includes('habitacional')) k = 'PDU_PR';
                    else if (desc.includes('urbana') || desc.includes('urbano') || desc.includes('barrio')) k = 'PDU_ZU';
                }

                if (byKey[k]) byKey[k].push(f);
            });

            (ZONING_ORDER || []).forEach(k => {
                const feats = byKey[k];
                if (!feats?.length) return;

                const fc = { type: 'FeatureCollection', features: feats };
                const catInfo = (ZONING_CAT_INFO || {})[k];
                const fixedColor = catInfo ? catInfo.color : '#9ca3af';

                const layer = window.L.geoJSON(fc, {
                    pane: 'paneOverlay',
                    style: {
                        color: fixedColor,
                        weight: 1.5,
                        opacity: 0.9,
                        fillColor: fixedColor,
                        fillOpacity: 0.2,
                        interactive: true
                    },
                    interactive: true,
                    onEachFeature: (feature, layerInstance) => {
                        if (!window.L.Browser.mobile) {
                            layerInstance.on('mouseover', () => {
                                layerInstance.setStyle({ weight: 3, fillOpacity: 0.4 });
                            });
                            layerInstance.on('mouseout', () => {
                                layerInstance.setStyle({ weight: 1.5, fillOpacity: 0.2 });
                            });
                        }

                        const label = feature.properties?.PGOEDF;
                        if (label) {
                            bindColoredTooltip(layerInstance, label, fixedColor);
                        }
                    }
                });

                zoningLayersRef.current[k] = layer;

                const shouldShow = !!visibleMapLayers.zoning && (visibleZoningCats[k] !== false);
                if (shouldShow) mapInstance.current.addLayer(layer);
            });
        }
    }, [extraDataLoaded, dataCache]);

    // ANP INTERNAL DYNAMIC LAYER
    useEffect(() => {
        if (!mapInstance.current || !dataCache?.anpInternal) return;

        if (selectedAnpLayerRef.current) {
            mapInstance.current.removeLayer(selectedAnpLayerRef.current);
            selectedAnpLayerRef.current = null;
        }

        if (!selectedAnpId || !visibleMapLayers.selectedAnpZoning) return;

        const sel = (selectedAnpId ?? '').toString().trim();
        const candidates = dataCache.anpInternal.features.filter(f => {
            const id = (f.properties?.ANP_ID ?? '').toString().trim();
            return id && id === sel;
        });

        if (candidates.length) {
            const layer = window.L.geoJSON({ type: 'FeatureCollection', features: candidates }, {
                pane: 'paneOverlay',
                style: (feature) => ({ ...getZoningStyle(feature), fillOpacity: globalOpacity }),
                interactive: true,
                onEachFeature: (feature, layerInstance) => {
                    const label = feature.properties?.ZONIFICACION || 'Zonificación ANP';
                    const style = getZoningStyle(feature);
                    bindColoredTooltip(layerInstance, label, style.color);
                }
            });
            selectedAnpLayerRef.current = layer;
            mapInstance.current.addLayer(layer);
        }

    }, [selectedAnpId, visibleMapLayers.selectedAnpZoning, extraDataLoaded, dataCache, globalOpacity]);

    // BASE CHANGE
    useEffect(() => {
        if (!mapInstance.current || !layersRef.current.base) return;
        setTilesLoading(true);
        layersRef.current.base.setUrl(getBaseLayerUrl(activeBaseLayer));

        // Update Alcaldias Color
        if (layersRef.current.alcaldias) {
            const newColor = activeBaseLayer === 'SATELLITE' ? '#FFFFFF' : '#374151';
            layersRef.current.alcaldias.setStyle({ color: newColor });
        }
    }, [activeBaseLayer]);

    // VISIBILITY TOGGLE (Core + Extra)
    useEffect(() => {
        if (!mapInstance.current) return;

        ['sc', 'anp', 'alcaldias', 'edomex', 'morelos'].forEach(k => {
            const layer = layersRef.current[k];
            if (!layer) return;

            // Enforce logic: Edomex/Morelos always visible if present? Or toggled?
            // "Si Edomex/Morelos están 'locked', el usuario no debe poder apagarlos mediante toggleLayer."
            // Assuming currently they are driven by visibleMapLayers state from parent.
            if (visibleMapLayers[k] && !mapInstance.current.hasLayer(layer)) mapInstance.current.addLayer(layer);
            if (!visibleMapLayers[k] && mapInstance.current.hasLayer(layer)) mapInstance.current.removeLayer(layer);

            // Global Opacity Update (skip alcaldias fill if intended to be transparent, or just apply)
            // Ideally only apply fillOpacity to polygons
            if (layer && visibleMapLayers[k] && layer.setStyle) {
                if (k === 'alcaldias' || k === 'edomex' || k === 'morelos') {
                    // Keep these mostly transparent or fixed
                } else {
                    layer.setStyle({ fillOpacity: globalOpacity });
                }
            }
        });

        if (Object.keys(zoningLayersRef.current).length) {
            (ZONING_ORDER || []).forEach(k => {
                const zLayer = zoningLayersRef.current[k];
                if (!zLayer) return;

                const shouldShow = !!visibleMapLayers.zoning && (visibleZoningCats[k] !== false);
                const has = mapInstance.current.hasLayer(zLayer);

                if (shouldShow && !has) mapInstance.current.addLayer(zLayer);
                if (!shouldShow && has) mapInstance.current.removeLayer(zLayer);

                // Update Opacity Dynamically
                if (shouldShow && zLayer) {
                    zLayer.setStyle({ fillOpacity: globalOpacity });
                }
            });
        }
    }, [visibleMapLayers, visibleZoningCats, extraDataLoaded, globalOpacity]);

    // MARKER LOGIC
    useEffect(() => {
        if (!mapInstance.current || !location || !window.L) return;

        if (markerRef.current) markerRef.current.remove();

        const styles = LAYER_STYLES || {};

        // PRIORITIZATION LOGIC:
        // 1. OUTSIDE CDMX -> 'X' (Red)
        // 2. SC -> 'SC' (Green) - Prevails over ANP
        // 3. ANP -> 'ANP' (Purple)
        // 4. SU -> 'SU' (Blue)

        let label = '';
        let bgColor = '#9ca3af';

        if (analysisStatus === 'OUTSIDE_CDMX') {
            label = 'X';
            bgColor = '#b91c1c';
        } else if (analysisStatus === 'CONSERVATION_SOIL') {
            label = 'SC';
            bgColor = styles.sc?.color || '#3B7D23';
        } else if (isANP) {
            label = 'ANP';
            bgColor = '#9333ea'; // Purple for ANP
        } else if (analysisStatus === 'URBAN_SOIL') {
            label = 'SU';
            bgColor = '#3b82f6';
        }

        // Sanitizar label solo por si acaso
        const safeLabel = escapeHtml(label);

        const iconHtml = `
          <div class="marker-pop" style="
            width:32px;height:32px;background:${bgColor};color:#fff;
            border:3px solid #fff;border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            font-weight:bold;font-size:10px;
            box-shadow:0 2px 8px rgba(0,0,0,0.25);
          ">
            ${safeLabel}
          </div>
          `;

        const icon = window.L.divIcon({
            html: iconHtml,
            className: '',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });

        markerRef.current = window.L.marker([location.lat, location.lng], { icon }).addTo(mapInstance.current);

        const currentZoom = mapInstance.current.getZoom();
        const targetZoom = Math.max(currentZoom, FOCUS_ZOOM);
        mapInstance.current.flyTo([location.lat, location.lng], targetZoom, { duration: 0.8 });
    }, [location, analysisStatus, isANP]);

    return (
        <div className="relative h-full w-full">
            <div id="main-map" ref={mapRef} className="h-full w-full bg-gray-200" />

            {tilesLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-[1200] bg-black/10 pointer-events-none">
                    <div className="flex flex-col items-center gap-2 bg-white/90 px-4 py-3 rounded-lg shadow">
                        {Icons.Loader2 ? <Icons.Loader2 className="h-5 w-5 animate-spin text-[#9d2148]" /> : <span>Cargando...</span>}
                        <span className="text-[11px] text-gray-700 font-medium">Cargando información geográfica...</span>
                    </div>
                </div>
            )}

            {/* Custom Zoom Control - Light Theme Consolidado */}
            <div className="absolute bottom-6 right-4 flex flex-col z-[1000] bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 select-none">
                <button
                    onClick={() => mapInstance.current?.zoomIn()}
                    className="w-8 h-8 flex items-center justify-center text-[#9d2148] hover:bg-gray-50 active:bg-gray-100 transition cursor-pointer"
                    title="Acercar"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
                <div className="h-[1px] bg-gray-200 w-full" />
                <button
                    onClick={() => mapInstance.current?.zoomOut()}
                    className="w-8 h-8 flex items-center justify-center text-[#9d2148] hover:bg-gray-50 active:bg-gray-100 transition cursor-pointer"
                    title="Alejar"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
            </div>

            {/* Vertical Opacity Slider Control */}
            <div className="hidden md:flex absolute top-24 right-4 z-[900] bg-white rounded-md shadow-md border border-gray-200 p-2 flex-col items-center gap-2 w-8 h-32 opacity-90 hover:opacity-100 transition-opacity" title="Control de Opacidad">
                <div className="text-[10px] text-gray-400 font-bold mb-1 opacity-50 select-none">👁️</div>
                <div className="h-full flex items-center justify-center">
                    <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={globalOpacity || 0.7}
                        onChange={(e) => setGlobalOpacity && setGlobalOpacity(parseFloat(e.target.value))}
                        className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#9d2449]"
                        style={{
                            transform: 'rotate(-90deg)',
                            transformOrigin: 'center'
                        }}
                    />
                </div>
                <div className="text-[9px] font-mono text-gray-500 mt-1 select-none">{Math.round((globalOpacity || 0.7) * 100)}%</div>
            </div>

            <style>{`
                 /* Slider Thumb Customization */
                 input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 12px;
                    width: 12px;
                    border-radius: 50%;
                    background: #9d2449;
                    cursor: pointer;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                 }
            `}</style>

        </div>
    );
};

window.App.Components.MapViewer = MapViewer;
