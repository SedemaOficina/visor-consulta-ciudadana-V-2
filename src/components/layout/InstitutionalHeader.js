window.App = window.App || {};
window.App.Components = window.App.Components || {};

window.App.Components.InstitutionalHeader = () => (
    <header className="hidden md:block fixed top-0 left-0 right-0 z-[1100] bg-[#9d2449] border-b border-[#8a1c3b] shadow-sm">
        <div className="h-[68px] flex items-center justify-between px-4 max-w-7xl mx-auto">

            {/* Left Section: Branding */}
            <div className="flex items-center gap-3">
                {/* Logo Container */}
                <div className="bg-white/95 rounded-lg px-3 py-1 shadow-sm backdrop-blur-sm">
                    <img
                        src="./assets/logo-sedema.png"
                        alt="Gobierno de la Ciudad de México - SEDEMA"
                        className="h-10 w-auto object-contain"
                        loading="eager"
                    />
                </div>

                {/* Separator */}
                <div className="h-8 w-px bg-white/20 mx-3"></div>

                {/* Titles */}
                <div className="flex flex-col justify-center">
                    {/* Desktop Title */}
                    <h1 className="text-lg font-bold text-white leading-none tracking-tight">
                        Visor de Consulta Ciudadana
                    </h1>

                    {/* Subtitle */}
                    <span className="text-[11px] text-white/80 font-medium tracking-wide mt-1">
                        Consulta normativa de Categorías de Protección Ambiental
                    </span>
                </div>
            </div>

            {/* Right Section: Actions Placeholder */}
            <div className="flex items-center justify-end gap-3 min-w-[40px]">
                {/* Future buttons */}
            </div>
        </div>
    </header>
);
