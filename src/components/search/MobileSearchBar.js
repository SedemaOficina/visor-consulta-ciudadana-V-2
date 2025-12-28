const { useState, useEffect, useRef } = window.React;
// Safe Lazy Access
// Safe Lazy Access
const { getIcons, searchMapboxPlaces, parseCoordinateInput } = window.App?.Utils || {};
const Icons = getIcons ? getIcons() : new Proxy({}, { get: () => () => null });

const MobileSearchBar = ({ onLocationSelect, onReset, setInputRef, initialValue }) => {

    // Direct usage since they are destructured from Utils above
    const safeSearch = async (q) => (typeof searchMapboxPlaces === 'function' ? await searchMapboxPlaces(q) : []);
    const safeParse = (q) => (typeof parseCoordinateInput === 'function' ? parseCoordinateInput(q) : null);

    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const debounceRef = useRef(null);
    const [flash, setFlash] = useState(false);

    // ✅ Sync con estado padre
    useEffect(() => {
        setQuery(initialValue || '');
    }, [initialValue]);

    // ✅ Setter externo (sin window) - Deprecated but kept for compatibility just in case
    useEffect(() => {
        if (!setInputRef) return;
        setInputRef.current = (text) => {
            setQuery(text || '');
            setSuggestions([]);
        };
        return () => { setInputRef.current = null; };
    }, [setInputRef]);

    const handleChange = (e) => {
        const value = e.target.value;
        setQuery(value);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!value.trim() || value.trim().length < 3) {
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
        if (!query.trim()) return;

        const coord = safeParse(query);
        if (coord) {
            onLocationSelect(coord);
            setSuggestions([]);
            return;
        }

        if (suggestions.length > 0) {
            const s = suggestions[0];
            onLocationSelect({ lat: s.lat, lng: s.lng });
            setQuery(s.label);
            setSuggestions([]);
            return;
        }

        setIsSearching(true);
        const res = await safeSearch(query);
        setIsSearching(false);

        if (res.length > 0) {
            const s = res[0];
            onLocationSelect({ lat: s.lat, lng: s.lng });
            setQuery(s.label);
            setSuggestions([]);
        } else {
            alert('No se encontraron coincidencias en Mapbox.');
        }
    };

    const handleSelectSuggestion = (s) => {
        setQuery(s.label);
        setSuggestions([]);
        onLocationSelect({ lat: s.lat, lng: s.lng });
    };

    const handleClear = () => {
        setQuery('');
        setSuggestions([]);
        onReset();
    };

    return (
        <div className="w-full flex flex-col gap-2 pointer-events-none">
            <div className="pointer-events-auto">
                <form
                    onSubmit={handleSubmit}
                    className={`
    ${flash ? 'ring-2 ring-[#9d2148]/50 shadow-[0_0_0_6px_rgba(157,36,73,0.12)]' : ''}
    bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.18)]
    flex items-center px-2 py-1 border border-transparent
    focus-within:border-gray-300 transition-all duration-200 ease-out
  `}
                >
                    <button type="submit" className="p-2 text-gray-500">
                        <Icons.Search className="h-5 w-5" />
                    </button>

                    <input
                        type="text"
                        className="flex-1 bg-transparent outline-none text-[13px] text-gray-800 placeholder-gray-400 h-10"
                        placeholder="Buscar dirección o coordenadas (Lat/Lng o DMS)"
                        value={query}
                        onChange={handleChange}
                        onFocus={() => {
                            if (!query.trim()) {
                                const history = JSON.parse(localStorage.getItem('search_history') || '[]');
                                if (history.length) setSuggestions(history.map(x => ({ ...x, _isHistory: true })));
                            }
                        }}
                    />

                    {query && (
                        <button
                            type="button"
                            onClick={() => {
                                setQuery('');
                                setSuggestions([]);
                                onReset(); // limpia resultados + re-encuadra mapa
                            }}
                            className="
      px-3 h-10 rounded-full bg-gray-100
      text-gray-700 text-[12px] font-semibold
      flex items-center gap-2
    "
                        >
                            <Icons.RotateCcw className="h-4 w-4" />
                            Limpiar
                        </button>
                    )}

                </form>

                {(suggestions.length > 0 || isSearching) && (
                    <div className="mt-1 bg-white border border-gray-200 rounded-lg shadow-md max-h-64 overflow-y-auto">
                        {isSearching && (
                            <div className="px-3 py-1.5 text-[11px] text-gray-500">Buscando en Mapbox…</div>
                        )}
                        {suggestions[0]?._isHistory && (
                            <div className="px-3 py-1.5 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 flex items-center gap-2">
                                <Icons.Clock className="h-3 w-3" /> Búsquedas recientes
                            </div>
                        )}
                        {suggestions.map(s => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                    if (!s._isHistory) {
                                        const history = JSON.parse(localStorage.getItem('search_history') || '[]');
                                        const newEntry = { label: s.label, lat: s.lat, lng: s.lng, fullLabel: s.fullLabel };
                                        const filtered = history.filter(h => h.label !== s.label).slice(0, 4);
                                        localStorage.setItem('search_history', JSON.stringify([newEntry, ...filtered]));
                                    }
                                    handleSelectSuggestion(s);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 border-t border-gray-50 flex flex-col"
                            >
                                <span className="text-[12px] font-bold text-gray-800 leading-tight">
                                    {s.label}
                                </span>
                                {s.fullLabel && (
                                    <span className="text-[10px] text-gray-500 leading-tight">
                                        {s.fullLabel.startsWith(s.label)
                                            ? s.fullLabel.substring(s.label.length).replace(/^,\s*/, '')
                                            : s.fullLabel}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

window.App.Components.MobileSearchBar = MobileSearchBar;
