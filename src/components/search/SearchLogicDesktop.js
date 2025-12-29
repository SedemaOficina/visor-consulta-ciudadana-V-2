const { useState, useEffect, useRef } = window.React;
// Safe Lazy Access implementation
// Safe Lazy Access implementation
const Icons = window.App?.Components?.Icons || new Proxy({}, { get: () => () => null });



// --- SHARED TOOLTIP COMPONENT ---
const Tooltip = ({ content, children, placement = 'top' }) => {
    const triggerRef = window.React.useRef(null);
    const { useEffect } = window.React;

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

const SearchLogicDesktop = ({ onLocationSelect, onReset, setInputRef, initialValue }) => {
    // Safe Lazy Access with Wrappers
    const { searchMapboxPlaces, parseCoordinateInput } = window.App.Utils || {};

    const safeSearch = async (q) => (typeof searchMapboxPlaces === 'function' ? await searchMapboxPlaces(q) : []);
    const safeParse = (q) => (typeof parseCoordinateInput === 'function' ? parseCoordinateInput(q) : null);

    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showInfo, setShowInfo] = useState(false); // NEW: Info Tooltip State
    const debounceRef = useRef(null);
    const localInputRef = useRef(null);

    // ✅ Sync con estado padre (Solo al montar o reset explícito)
    useEffect(() => {
        if (initialValue) setQuery(initialValue);
    }, []); // Removed [initialValue] to prevent overwriting user input on re-renders

    // ✅ Setter externo (sin window)
    useEffect(() => {
        if (!setInputRef) return;
        setInputRef.current = (text) => {
            setQuery(text || '');
            setSuggestions([]);
        };
        return () => {
            setInputRef.current = null;
        };
    }, [setInputRef]);

    const handleChange = (e) => {
        const value = e.target.value;
        setQuery(value);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!value.trim() || value.trim().length < 3) {
            setSuggestions([]);
            return;
        }

        // NEW: Suppress suggestions for Coordinates
        if (/^-?\d+(\.\d+)?(\s*,\s*|\s+)-?\d+(\.\d+)?$/.test(value.trim())) {
            setSuggestions([]);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setIsSearching(true);
            const res = await safeSearch(value);
            setSuggestions(res);
            setIsSearching(false);
        }, 300);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const value = query.trim();
        if (!value) return;

        const coord = safeParse(value);
        if (coord) {
            onLocationSelect(coord);
            setSuggestions([]);
            return;
        }

        if (suggestions.length > 0) {
            const s = suggestions[0];

            // Save to history
            const history = JSON.parse(localStorage.getItem('search_history') || '[]');
            const newEntry = { label: s.label, lat: s.lat, lng: s.lng, fullLabel: s.fullLabel };
            const filtered = history.filter(h => h.label !== s.label).slice(0, 4);
            localStorage.setItem('search_history', JSON.stringify([newEntry, ...filtered]));

            onLocationSelect({ lat: s.lat, lng: s.lng });
            setQuery(s.fullLabel || s.label);
            setSuggestions([]);
            return;
        }

        setIsSearching(true);
        const res = await safeSearch(value);
        setIsSearching(false);

        if (res.length > 0) {
            const s = res[0];
            onLocationSelect({ lat: s.lat, lng: s.lng });
            setQuery(s.fullLabel || s.label);
            setSuggestions([]);
        } else {
            alert('No se encontraron coincidencias en Mapbox.');
        }
    };

    const handleSelectSuggestion = (s) => {
        setQuery(s.fullLabel || s.label);
        setSuggestions([]);
        onLocationSelect({ lat: s.lat, lng: s.lng });
    };

    const handleResetAll = () => {
        setQuery('');
        setSuggestions([]);
        onReset();
    };

    return (
        <div className="space-y-2">
            <div className="relative shadow-sm">
                <div className="relative mb-3">
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                            Buscar por dirección o coordenadas
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowInfo(!showInfo)}
                            className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors"
                        >
                            <Icons.Info className="h-3 w-3" />
                            <span>¿Cómo buscar?</span>
                        </button>
                    </div>

                    {showInfo && (
                        <div className="mb-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 animate-in fade-in slide-in-from-top-1">
                            <div className="font-bold mb-2">¿Cómo realizar una búsqueda?</div>
                            <p className="mb-2 opacity-90">Puedes ingresar la ubicación de cualquiera de las siguientes formas:</p>
                            <ul className="space-y-2 text-[11px] opacity-90">
                                <li className="bg-white/50 p-1.5 rounded border border-blue-100/50">
                                    <strong className="block text-blue-900 mb-0.5">Dirección</strong>
                                    <span className="text-blue-700/80">Ejemplo: Calle 5 de Mayo, Centro</span>
                                </li>
                                <li className="bg-white/50 p-1.5 rounded border border-blue-100/50">
                                    <strong className="block text-blue-900 mb-0.5">Coordenadas (latitud, longitud)</strong>
                                    <span className="font-mono text-[10px] text-blue-700/80">Ejemplo: 19.4326, -99.1332</span>
                                </li>
                                <li className="bg-white/50 p-1.5 rounded border border-blue-100/50">
                                    <strong className="block text-blue-900 mb-0.5">Coordenadas DMS (Grados, Minutos, Segundos)</strong>
                                    <span className="font-mono text-[10px] text-blue-700/80">Ejemplo: 19°22'18.8"N 99°04'25.8"W</span>
                                </li>
                                <li className="bg-white/50 p-1.5 rounded border border-blue-100/50">
                                    <strong className="block text-blue-900 mb-0.5">Colonia y alcaldía</strong>
                                    <span className="text-blue-700/80">Ejemplo: Polanco, Miguel Hidalgo</span>
                                </li>
                            </ul>
                        </div>
                    )}
                    <div className="relative group">
                        <div className="relative flex items-center w-full shadow-sm hover:shadow-md transition-shadow bg-white rounded-full border border-gray-200 focus-within:ring-2 focus-within:ring-[#9d2449] focus-within:border-transparent">
                            <input
                                type="text"
                                ref={localInputRef}
                                placeholder="Buscar dirección, coordenadas, alcaldía..."
                                className="w-full h-12 pl-6 pr-24 bg-transparent border-none rounded-full text-sm text-gray-700 placeholder-gray-400 focus:ring-0 focus:outline-none"
                                value={query}
                                onChange={handleChange}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSubmit(e);
                                        setSuggestions([]);
                                    }
                                }}
                                onFocus={() => {
                                    if (!query.trim()) {
                                        const history = JSON.parse(localStorage.getItem('search_history') || '[]');
                                        if (history.length) setSuggestions(history.map(x => ({ ...x, _isHistory: true })));
                                    }
                                }}
                            />

                            {/* Buttons Container (Right) */}
                            <div className="absolute right-2 flex items-center gap-1">
                                {query && (
                                    <Tooltip content="Limpiar búsqueda">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setQuery('');
                                                setSuggestions([]);
                                                localInputRef.current?.focus();
                                            }}
                                            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </button>
                                    </Tooltip>
                                )}

                                <div className="h-6 w-px bg-gray-200 mx-1"></div>

                                <Tooltip content="Buscar">
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={isSearching}
                                        className="p-2 text-[#9d2449] hover:text-[#7d1d3a] rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
                                    >
                                        {isSearching ? (
                                            <div className="h-5 w-5 border-2 border-gray-200 border-t-[#9d2449] rounded-full animate-spin"></div>
                                        ) : (
                                            <Icons.Search className="h-5 w-5" />
                                        )}
                                    </button>
                                </Tooltip>
                            </div>
                        </div>
                    </div>

                    {/* Sugerencias y Recientes */}
                    {suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 z-[3000] overflow-hidden max-h-60 overflow-y-auto">
                            {suggestions[0]._isHistory && (
                                <div className="px-3 py-1.5 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                    Búsquedas recientes
                                </div>
                            )}

                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => {
                                        // Save to history logic
                                        if (!s._isHistory) {
                                            const history = JSON.parse(localStorage.getItem('search_history') || '[]');
                                            const newEntry = { label: s.label, lat: s.lat, lng: s.lng, fullLabel: s.fullLabel };
                                            const filtered = history.filter(h => h.label !== s.label).slice(0, 4); // Keep last 5
                                            localStorage.setItem('search_history', JSON.stringify([newEntry, ...filtered]));
                                        }
                                        handleSelectSuggestion(s);
                                    }}
                                    className="w-full text-left px-3 py-2 text-[12px] hover:bg-gray-50 border-t border-gray-50 flex items-center gap-2"
                                >
                                    {s._isHistory ? <Icons.Clock className="h-3 w-3 text-gray-400" /> : <Icons.MapPin className="h-3 w-3 text-gray-400" />}
                                    <div>
                                        <div className="font-bold text-gray-800">{s.label}</div>
                                        {s.fullLabel && (
                                            <div className="text-[10px] text-gray-500">
                                                {s.fullLabel.startsWith(s.label)
                                                    ? s.fullLabel.substring(s.label.length).replace(/^,\s*/, '')
                                                    : s.fullLabel}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    {/* Mi ubicación */}
                    <Tooltip content="Usar mi ubicación actual">
                        <button
                            onClick={() =>
                                navigator.geolocation.getCurrentPosition(
                                    p => {
                                        const coord = { lat: p.coords.latitude, lng: p.coords.longitude };
                                        onLocationSelect(coord);
                                    },
                                    () => alert("No se pudo obtener tu ubicación.") // We will upgrade this to Toast later via props in App
                                )
                            }
                            className="
          flex-1 h-11 bg-[#9d2148] text-white rounded-lg
          text-[14px] font-semibold flex items-center justify-center gap-2
          shadow-sm hover:bg-[#7d1d3a]
        "
                        >
                            <Icons.Navigation className="h-4 w-4" />
                            Mi ubicación
                        </button>
                    </Tooltip>


                </div>

            </div>
        </div>
    );
};

window.App.Components.SearchLogicDesktop = SearchLogicDesktop;
