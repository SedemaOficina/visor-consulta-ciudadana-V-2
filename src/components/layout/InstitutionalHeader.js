window.App = window.App || {};
window.App.Components = window.App.Components || {};

window.App.Components.InstitutionalHeader = () => (
    <header className="hidden md:block fixed top-0 left-0 right-0 z-[1100] bg-[#9d2449] border-b border-[#8a1c3b] shadow-sm">
        <div className="h-[50px] flex items-center justify-between px-4">

            {/* Left Section: Branding */}
            <div className="flex items-center gap-3">
                {/* Logo Container */}
                <div className="bg-white/95 rounded px-2 py-0.5 shadow-sm backdrop-blur-sm">
                    <img
                        src="./assets/logo-sedema.png"
                        alt="Gobierno de la Ciudad de México - SEDEMA"
                        className="h-8 w-auto object-contain"
                        loading="eager"
                    />
                </div>

                {/* Separator */}
                <div className="h-6 w-px bg-white/20 mx-2"></div>

                {/* Titles */}
                <div className="flex flex-col justify-center">
                    {/* Desktop Title */}
                    <h1 className="text-sm font-bold text-white/95 leading-none tracking-tight">
                        Visor de Consulta Ciudadana
                    </h1>

                    {/* Subtitle */}
                    <span className="text-[10px] text-white/80 font-medium tracking-wide">
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
