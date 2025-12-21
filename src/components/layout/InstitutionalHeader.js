window.App = window.App || {};
window.App.Components = window.App.Components || {};

window.App.Components.InstitutionalHeader = () => (
    <header className="bg-white shadow-sm z-[1100] relative border-b border-gray-200">
        <div className="h-16 md:h-20 flex items-center justify-between px-4 max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
                {/* Usar imagen real del logo */}
                <img
                    src="./assets/logo-sedema.png"
                    alt="Gobierno de la Ciudad de México - SEDEMA"
                    className="h-12 md:h-14 block object-contain"
                />
                <div className="hidden md:block h-10 w-px bg-gray-300 mx-2"></div>
                <div className="hidden md:flex flex-col justify-center">
                    <h1 className="text-lg md:text-xl font-black text-[#9d2148] leading-tight tracking-tight uppercase">
                        Visor de Consulta Ciudadana
                    </h1>
                    <span className="text-[10px] md:text-xs text-gray-500 font-medium tracking-wide">
                        SECRETARÍA DEL MEDIO AMBIENTE DE LA CIUDAD DE MÉXICO
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                {/* Placeholder para menús futuros */}
            </div>
        </div>
    </header>
);
