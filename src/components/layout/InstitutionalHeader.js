window.App = window.App || {};
window.App.Components = window.App.Components || {};

window.App.Components.InstitutionalHeader = () => (
    <header className="hidden md:block bg-white shadow-sm z-[1100] relative border-b border-gray-200">
        <div className="h-16 md:h-20 flex items-center justify-between px-4 max-w-7xl mx-auto">

            {/* Left Section: Branding */}
            <div className="flex items-center gap-3">
                <img
                    src="./assets/logo-sedema.png"
                    alt="Gobierno de la Ciudad de México - SEDEMA"
                    className="h-10 md:h-14 w-auto max-w-[140px] md:max-w-[220px] object-contain"
                    loading="eager"
                    decoding="async"
                />

                {/* Separator */}
                <div className="h-8 md:h-10 w-px bg-gray-300 mx-1 md:mx-3"></div>

                {/* Titles */}
                <div className="flex flex-col justify-center">
                    {/* Mobile Title */}
                    <h1 className="md:hidden text-sm font-bold text-[#9d2148] leading-tight">
                        Consulta Ciudadana
                    </h1>

                    {/* Desktop Title */}
                    <h1 className="hidden md:block text-xl font-extrabold text-[#9d2148] leading-tight tracking-tight">
                        Visor de Consulta Ciudadana
                    </h1>

                    {/* Subtitle (Desktop only for space) */}
                    <span className="hidden md:block text-xs text-gray-500 font-medium tracking-wide mt-0.5">
                        Consulta normativa de Categorías de Protección Ambiental
                    </span>
                </div>
            </div>

            {/* Right Section: Actions Placeholder */}
            <div className="flex items-center justify-end gap-3 min-w-[40px]">
                {/* Future buttons (Language, Login, etc.) go here */}
            </div>
        </div>
    </header>
);
