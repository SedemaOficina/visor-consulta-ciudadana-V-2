// Safe Lazy Access
const { getIcons, getConstants } = window.App?.Utils || {};

const HelpModal = ({ isOpen, onClose }) => {
    // Safe Lazy Access at Render Time
    const Icons = getIcons ? getIcons() : {};
    const { CONTACT_INFO } = (getConstants ? getConstants() : {}) || {};

    if (!CONTACT_INFO) return null;
    if (!isOpen) return null;

    // Fallback for missing icon
    const XIcon = Icons.X || (() => <span className="text-xl">×</span>);
    const MapPinnedIcon = Icons.MapPinned || (() => <span>📍</span>);

    const { useEffect } = window.React;

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Enter' || e.key === 'Escape') onClose();
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            style={{ pointerEvents: 'auto' }}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#9d2148] flex items-center justify-center text-white shadow-sm">
                            <span className="font-bold text-xl">?</span>
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-800 leading-tight">
                                Verifica si un predio se encuentra en
                            </h2>
                            <p className="text-sm text-[#9d2148] font-semibold">
                                Suelo de Conservación o Área Natural Protegida
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => { console.log('Close clicked'); onClose(); }}
                        className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors cursor-pointer"
                        style={{ pointerEvents: 'auto' }}
                        aria-label="Cerrar"
                    >
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="space-y-6">

                        {/* Sección 1: Cómo Consultar */}
                        <section>
                            <h3 className="flex items-center gap-2 text-base font-bold text-[#9d2148] mb-3 uppercase tracking-wide">
                                <MapPinnedIcon className="h-4 w-4" />
                                ¿Cómo ubicar un predio?
                            </h3>
                            <ul className="space-y-3 pl-1">
                                <li className="flex gap-3 text-sm text-gray-700">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-600 font-bold flex items-center justify-center text-[10px] border border-gray-200">1</span>
                                    <span>
                                        <strong>Búsqueda por dirección:</strong> Escribe la calle y número en el buscador lateral (ej. "Av. Insurgentes Sur 100").
                                    </span>
                                </li>
                                <li className="flex gap-3 text-sm text-gray-700">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-600 font-bold flex items-center justify-center text-[10px] border border-gray-200">2</span>
                                    <span>
                                        <strong>Búsqueda por coordenadas:</strong> Ingresa latitud y longitud (ej. "19.4326, -99.1332").
                                    </span>
                                </li>
                                <li className="flex gap-3 text-sm text-gray-700">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-600 font-bold flex items-center justify-center text-[10px] border border-gray-200">3</span>
                                    <span>
                                        <strong>Navegación manual:</strong> Navega por el mapa y haz clic directamente sobre el predio de interés.
                                    </span>
                                </li>
                                <li className="flex gap-3 text-sm text-gray-700">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-600 font-bold flex items-center justify-center text-[10px] border border-gray-200">4</span>
                                    <span>
                                        <strong>Mi ubicación:</strong> Utiliza el botón de geolocalización para ubicarte automáticamente.
                                    </span>
                                </li>
                            </ul>
                        </section>

                        <hr className="border-gray-100" />

                        {/* Sección 2: Qué puedes hacer */}
                        <section>
                            <h3 className="flex items-center gap-2 text-base font-bold text-[#9d2148] mb-3 uppercase tracking-wide">
                                <Icons.CheckCircle className="h-4 w-4" />
                                Acciones Disponibles
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
                                    <Icons.Pdf className="h-5 w-5 text-[#9d2148] mx-auto mb-2" />
                                    <span className="text-xs font-semibold text-gray-700 block">Descargar Ficha</span>
                                    <span className="text-[10px] text-gray-500 block leading-tight mt-1">Obtén un reporte oficial en PDF</span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
                                    <Icons.MapIcon className="h-5 w-5 text-[#9d2148] mx-auto mb-2" />
                                    <span className="text-xs font-semibold text-gray-700 block">Google Maps</span>
                                    <span className="text-[10px] text-gray-500 block leading-tight mt-1">Ver la ubicación en Google Maps</span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
                                    <Icons.Share className="h-5 w-5 text-[#9d2148] mx-auto mb-2" />
                                    <span className="text-xs font-semibold text-gray-700 block">Compartir</span>
                                    <span className="text-[10px] text-gray-500 block leading-tight mt-1">Comparte el resultado por enlace</span>
                                </div>
                            </div>
                        </section>

                        <hr className="border-gray-100" />

                        {/* Contacto */}
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                            <div>
                                <h4 className="font-bold text-blue-900 text-sm mb-1">¿Necesitas más información?</h4>
                                <p className="text-xs text-blue-700">Comunícate a la Dirección General de Ordenamiento Ecológico.</p>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-blue-900">{CONTACT_INFO.phone}</div>
                                <div className="text-[10px] text-blue-700">{CONTACT_INFO.hours}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 text-center">
                    <button
                        onClick={() => { console.log('Entendido clicked'); onClose(); }}
                        className="bg-[#9d2148] text-white px-8 py-2.5 rounded-full text-sm font-bold shadow-md hover:bg-[#7d1d3a] transition-all active:scale-95 cursor-pointer"
                        style={{ pointerEvents: 'auto' }}
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};

window.App.Components.HelpModal = HelpModal;
