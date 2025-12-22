const { useState, useEffect, useRef } = window.React;
const {
    LAYER_STYLES,
    ZONING_ORDER,
    INITIAL_CENTER,
    INITIAL_ZOOM,
    FOCUS_ZOOM
} = window.App.Constants;
const {
    getBaseLayerUrl,
    getZoningStyle
} = window.App.Utils;
const Icons = window.App.Components.Icons;

const MapViewer = ({
    location,
    onLocationSelect,
    analysisStatus,
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
    dataCache // ✅ Recibido como prop
}) => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const layersRef = useRef({});          // sc, alcaldias, edomex, morelos, base
    const zoningLayersRef = useRef({});    // {ANP: layer, FC: layer, ... }
    const selectedAnpLayerRef = useRef(null); // ✅ Ref para la capa dinámica
    const markerRef = useRef(null);
    const [tilesLoading, setTilesLoading] = useState(true);

    // 1) INIT MAP
    useEffect(() => {
        if (!mapRef.current || mapInstance.current || !window.L) return;

        const bounds = window.L.latLngBounds([18.7, -99.6], [19.9, -98.7]);

        const map = window.L.map(mapRef.current, {
            zoomControl: false,
            attributionControl: false,
            minZoom: 9,
            maxZoom: 18,
            preferCanvas: true,
            maxBounds: bounds,
            maxBoundsViscosity: 0.9
        }).setView(INITIAL_CENTER, INITIAL_ZOOM);

        window.L.control.attribution({ position: 'topleft', prefix: false }).addTo(map);
        mapInstance.current = map;

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

        // ✅ Exponer invalidateSize a App (sin window)
        if (invalidateMapRef) {
            invalidateMapRef.current = () => {
                try { mapInstance.current?.invalidateSize(); } catch { }
            };
        }

        // PANES
        map.createPane('paneBase');
        map.getPane('paneBase').style.zIndex = 300;

        map.createPane('paneContext');
        map.getPane('paneContext').style.zIndex = 350;

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

        // CORE layers desde cache
        // Validar dataCache para evitar crash si es null
        const sc = dataCache?.sc;
        const alcaldias = dataCache?.alcaldias;

        const addCoreLayer = (name, data, style, tooltipField, pane, interactive = true) => {
            if (!data?.features?.length) return;

            const layer = window.L.geoJSON(data, {
                pane,
                style,
                interactive,
                onEachFeature: (feature, layerInstance) => {
                    // Hover effects
                    if (interactive) {
                        layerInstance.on('mouseover', () => {
                            layerInstance.setStyle({ weight: 3, fillOpacity: 0.3 });
                            layerInstance.bringToFront();
                        });
                        layerInstance.on('mouseout', () => {
                            layerInstance.setStyle(style); // Reset to original style
                        });
                    }

                    // Tooltip Logic
                    if (name === 'sc') {
                        layerInstance.bindTooltip("Suelo de Conservación", {
                            sticky: true,
                            className: 'custom-tooltip'
                        });
                    } else if (tooltipField && feature.properties?.[tooltipField]) {
                        layerInstance.bindTooltip(feature.properties[tooltipField], {
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
                color: LAYER_STYLES.sc.color,
                weight: 1.5,
                opacity: 1,
                fillColor: LAYER_STYLES.sc.fill,
                fillOpacity: 0.2,
                interactive: true
            },
            null,
            'paneBase',
            true // Make Interactive
        );

        addCoreLayer(
            'alcaldias',
            alcaldias,
            {
                color: LAYER_STYLES.alcaldias.color,
                weight: 2, // Hierarchy: Thicker than zones, thinner than 3
                dashArray: '8,4',
                opacity: 0.9,
                fillOpacity: 0
            },
            null,
            'paneContext'
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

            // ✅ limpiar ref al desmontar
            if (invalidateMapRef) invalidateMapRef.current = null;
        };
    }, []);

    // 2) EXTRA layers + zoning layers (una sola vez)
    useEffect(() => {
        if (!mapInstance.current || !extraDataLoaded || !window.L || !dataCache) return;

        const { edomex, morelos, zoning, anp } = dataCache;

        const addLayer = (name, data, style, tooltipField, pane, interactive = true) => {
            if (!data?.features?.length) return;

            const layer = window.L.geoJSON(data, {
                pane,
                style,
                interactive,
                onEachFeature: (feature, layerInstance) => {
                    if (interactive) {
                        layerInstance.on('mouseover', () => layerInstance.setStyle({ weight: 3 }));
                        layerInstance.on('mouseout', () => layerInstance.setStyle({ weight: 1.5 }));
                    }

                    if (tooltipField && feature.properties?.[tooltipField]) {
                        layerInstance.bindTooltip(feature.properties[tooltipField], {
                            sticky: true,
                            className: 'custom-tooltip'
                        });
                    }
                }
            });

            layersRef.current[name] = layer;
            mapInstance.current.addLayer(layer);
        };

        if (!layersRef.current.edomex) {
            addLayer(
                'edomex',
                edomex,
                {
                    color: LAYER_STYLES.edomex.color,
                    weight: 1.5, // Standardized
                    dashArray: '4,4',
                    opacity: 0.9,
                    fillOpacity: 0.1
                },
                'NOMGEO',
                'paneBase',
                false
            );
        }

        if (!layersRef.current.morelos) {
            addLayer(
                'morelos',
                morelos,
                {
                    color: LAYER_STYLES.morelos.color,
                    weight: 1.5, // Standardized
                    dashArray: '4,4',
                    opacity: 0.9,
                    fillOpacity: 0.1
                },
                'NOMGEO',
                'paneBase',
                false
            );
        }
        // ✅ ANP overlay (independiente de PGOEDF)
        if (!layersRef.current.anp) {
            addLayer(
                'anp',
                anp,
                {
                    color: LAYER_STYLES.anp.color,
                    weight: 1.5,
                    opacity: 0.9,
                    fillColor: LAYER_STYLES.anp.fill,
                    fillOpacity: 0.2
                },
                'NOMBRE',
                'paneOverlay',
                true
            );
        }


        // Build zoning layers por categoría una sola vez
        if (zoning?.features?.length && Object.keys(zoningLayersRef.current).length === 0) {
            const byKey = {};
            ZONING_ORDER.forEach(k => (byKey[k] = []));

            zoning.features.forEach(f => {
                let k = (f.properties?.CLAVE || '').toString().trim().toUpperCase();

                // Lógica para separar subtipos de PDU que comparten la misma CLAVE
                if (k === 'PDU' || k === 'PROGRAMAS' || k === 'ZONA URBANA') {
                    const desc = (f.properties?.PGOEDF || '').toLowerCase(); // Usar PGOEDF para distinguir

                    if (desc.includes('parcial')) {
                        k = 'PDU_PP'; // Programas Parciales
                    } else if (desc.includes('poblad') || desc.includes('rural') || desc.includes('habitacional')) {
                        k = 'PDU_PR'; // Poblados Rurales
                    } else if (desc.includes('urbana') || desc.includes('urbano') || desc.includes('barrio')) {
                        k = 'PDU_ZU'; // Zona Urbana / Centro de Barrio
                    } else if (desc.includes('equipamiento')) {
                        k = 'PDU_ER'; // Equipamiento Rural
                    }
                }

                if (byKey[k]) byKey[k].push(f);
            });

            ZONING_ORDER.forEach(k => {
                const feats = byKey[k];
                if (!feats?.length) return;

                const fc = { type: 'FeatureCollection', features: feats };
                const layer = window.L.geoJSON(fc, {
                    pane: 'paneOverlay',
                    style: (feature) => getZoningStyle(feature),
                    interactive: true,
                    onEachFeature: (feature, layerInstance) => {
                        layerInstance.on('mouseover', () => layerInstance.setStyle({ weight: 3 })); // Standard hover
                        layerInstance.on('mouseout', () => layerInstance.setStyle({ weight: 1.5 }));

                        const label = feature.properties?.PGOEDF;
                        if (label) layerInstance.bindTooltip(label, { sticky: true, className: 'custom-tooltip' });
                    }
                });

                zoningLayersRef.current[k] = layer;
            });
        }
    }, [extraDataLoaded, dataCache]);

    // ✅ EFFECT: Manejo dinámico de Zonificación de ANP Seleccionada (usando anpInternal)
    useEffect(() => {
        if (!mapInstance.current || !dataCache?.anpInternal) return;

        // 1. Limpiar capa anterior si existe
        if (selectedAnpLayerRef.current) {
            mapInstance.current.removeLayer(selectedAnpLayerRef.current);
            selectedAnpLayerRef.current = null;
        }

        // 2. Si no hay ANP seleccionada o la capa "selectedAnpZoning" está apagada, salir
        if (!selectedAnpId || !visibleMapLayers.selectedAnpZoning) return;

        // 3. Filtrar features del ANP seleccionado dentro de anpInternal
        const candidates = dataCache.anpInternal.features.filter(f => {
            if (f.properties?.ANP_ID === selectedAnpId) return true;
            return false;
        });

        if (candidates.length) {
            const layer = window.L.geoJSON({ type: 'FeatureCollection', features: candidates }, {
                pane: 'paneOverlay',
                style: (feature) => getZoningStyle(feature),
                interactive: true,
                onEachFeature: (feature, layerInstance) => {
                    const label = feature.properties?.ZONIFICACION || 'Zonificación ANP';
                    layerInstance.bindTooltip(label, { sticky: true, className: 'custom-tooltip' });
                }
            });
            selectedAnpLayerRef.current = layer;
            mapInstance.current.addLayer(layer);
        }

    }, [selectedAnpId, visibleMapLayers.selectedAnpZoning, extraDataLoaded, dataCache]);


    // 3) base layer change
    useEffect(() => {
        if (!mapInstance.current || !layersRef.current.base) return;
        setTilesLoading(true);
        layersRef.current.base.setUrl(getBaseLayerUrl(activeBaseLayer));
    }, [activeBaseLayer]);

    // 4) show/hide layers (core + extra + zoning)
    useEffect(() => {
        if (!mapInstance.current) return;

        ['sc', 'anp', 'alcaldias', 'edomex', 'morelos'].forEach(k => {
            const layer = layersRef.current[k];
            if (!layer) return;

            if (visibleMapLayers[k] && !mapInstance.current.hasLayer(layer)) mapInstance.current.addLayer(layer);
            if (!visibleMapLayers[k] && mapInstance.current.hasLayer(layer)) mapInstance.current.removeLayer(layer);
        });

        if (Object.keys(zoningLayersRef.current).length) {
            ZONING_ORDER.forEach(k => {
                const zLayer = zoningLayersRef.current[k];
                if (!zLayer) return;

                const shouldShow = !!visibleMapLayers.zoning && (visibleZoningCats[k] !== false);
                const has = mapInstance.current.hasLayer(zLayer);

                if (shouldShow && !has) mapInstance.current.addLayer(zLayer);
                if (!shouldShow && has) mapInstance.current.removeLayer(zLayer);
            });
        }
    }, [visibleMapLayers, visibleZoningCats, extraDataLoaded]);

    // 5) marker + flyTo
    useEffect(() => {
        if (!mapInstance.current || !location || !window.L) return;

        if (markerRef.current) markerRef.current.remove();

        const label =
            analysisStatus === 'CONSERVATION_SOIL' ? 'SC' :
                analysisStatus === 'URBAN_SOIL' ? 'SU' :
                    analysisStatus === 'OUTSIDE_CDMX' ? 'X' : '';

        const bgColor =
            analysisStatus === 'CONSERVATION_SOIL' ? LAYER_STYLES.sc.color :
                analysisStatus === 'URBAN_SOIL' ? '#3b82f6' :
                    analysisStatus === 'OUTSIDE_CDMX' ? '#b91c1c' : '#9ca3af';

        const iconHtml = `
      <div class="marker-pop" style="
        width:32px;height:32px;background:${bgColor};color:#fff;
        border:3px solid #fff;border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        font-weight:bold;font-size:12px;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
      ">
        ${label}
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
    }, [location, analysisStatus]);

    return (
        <div className="relative h-full w-full">
            <div id="main-map" ref={mapRef} className="h-full w-full bg-gray-200" />

            {tilesLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-[1200] bg-black/10 pointer-events-none">
                    <div className="flex flex-col items-center gap-2 bg-white/90 px-4 py-3 rounded-lg shadow">
                        <Icons.Loader2 className="h-5 w-5 animate-spin text-[#9d2148]" />
                        <span className="text-[11px] text-gray-700 font-medium">Cargando información geográfica...</span>
                    </div>
                </div>
            )}

            {/* Nota inicial desktop (si no hay análisis) */}
            {
                !analysisStatus && (
                    <div className="hidden md:flex absolute top-20 right-20 z-[1100]">
                        <div className="bg-white/95 border border-gray-200 rounded-lg shadow-md px-3 py-2 text-[11px] text-gray-700 max-w-xs">
                            Haz clic en el mapa o busca una dirección para iniciar la consulta de zonificación.
                        </div>
                    </div>
                )
            }
        </div >
    );
};

window.App.Components.MapViewer = MapViewer;
