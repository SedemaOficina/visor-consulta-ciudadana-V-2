const { useState, useEffect, useRef } = window.React;
// Safe Lazy Access implementation
// Safe Lazy Access implementation
const Icons = window.App?.Components?.Icons || new Proxy({}, { get: () => () => null });

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

    // ✅ Sync con estado padre
    useEffect(() => {
        setQuery(initialValue || '');
    }, [initialValue]);

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
                            Buscar por dirección
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowInfo(!showInfo)}
                            className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors"
                        >
                            <Icons.Info className="h-3 w-3" />
                            <span>Ayuda</span>
                        </button>
                    </div>

                    {showInfo && (
                        <div className="mb-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 animate-in fade-in slide-in-from-top-1">
                            <div className="font-bold mb-1">Formatos permitidos:</div>
                            <ul className="list-disc list-inside space-y-0.5 text-[11px] opacity-90">
                                <li><strong>Dirección:</strong> "Calle 5 de Mayo, Centro"</li>
                                <li><strong>Coordenadas:</strong> "19.4326, -99.1332"</li>
                                <li><strong>Colonias:</strong> "Polanco, Miguel Hidalgo"</li>
                            </ul>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <div className="relative w-full">
                            <input
                                type="text"
                                ref={localInputRef}
                                placeholder="Ej: Calle 5 de Mayo, Centro..."
                                className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#9d2148] focus:border-transparent transition-all"
                                value={query}
                                onChange={handleChange}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSubmit(e);
                                        // Close suggestions on Enter
                                        setSuggestions([]);
                                    }
                                }}
                                onFocus={() => {
                                    // Show history if query is empty
                                    if (!query.trim()) {
                                        const history = JSON.parse(localStorage.getItem('search_history') || '[]');
                                        if (history.length) setSuggestions(history.map(x => ({ ...x, _isHistory: true })));
                                    }
                                }}
                            />
                            <Icons.Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />

                            {isSearching && (
                                <div className="absolute right-3 top-3">
                                    <div className="h-5 w-5 border-2 border-gray-200 border-t-[#9d2148] rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="h-11 px-4 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-200 hover:border-gray-300 font-bold text-xs uppercase tracking-wide transition-colors"
                            title="Buscar"
                        >
                            Buscar
                        </button>
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
                        title="Usar mi ubicación actual"
                    >
                        <Icons.Navigation className="h-4 w-4" />
                        Mi ubicación
                    </button>

                    {/* ✅ LIMPIAR (explícito) */}
                    <button
                        type="button"
                        onClick={() => {
                            setQuery('');
                            setSuggestions([]);
                            onReset();
                        }}
                        className="
      h-11 px-4 bg-white border border-gray-300 rounded-lg
      text-gray-700 text-[13px] font-semibold
      flex items-center gap-2
      shadow-sm hover:bg-gray-50
    "
                        title="Limpiar búsqueda y ver toda la CDMX"
                    >
                        <Icons.RotateCcw className="h-4 w-4" />
                        Limpiar
                    </button>
                </div>

            </div>
        </div>
    );
};

window.App.Components.SearchLogicDesktop = SearchLogicDesktop;
