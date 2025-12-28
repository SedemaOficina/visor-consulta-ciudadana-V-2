;
(function () {
    const { useState, useEffect } = window.React;
    const { Icons } = window.App.Components; // Ensure Icons are available

    const OnboardingTour = () => {
        const [isVisible, setIsVisible] = useState(false);
        const [step, setStep] = useState(0);

        useEffect(() => {
            // Check if already seen
            const seen = localStorage.getItem('tutorial_seen');
            if (!seen) {
                // Delay slightly to let app load
                const timer = setTimeout(() => setIsVisible(true), 1500);
                return () => clearTimeout(timer);
            }
        }, []);

        const handleDismiss = () => {
            setIsVisible(false);
            localStorage.setItem('tutorial_seen', 'true');
        };

        const handleNext = () => {
            if (step < STEPS.length - 1) {
                setStep(step + 1);
            } else {
                handleDismiss();
            }
        };

        if (!isVisible) return null;

        const STEPS = [
            {
                title: '¡Bienvenido al Visor Ciudadano!',
                text: 'Esta herramienta te permite consultar el Uso de Suelo y Normatividad de cualquier predio en la CDMX de forma fácil y rápida.',
                icon: Icons.MapPin || (() => <span>📍</span>)
            },
            {
                title: 'Paso 1: Busca',
                text: 'Utiliza la barra de búsqueda superior para encontrar una dirección, calle o coordenada específica.',
                icon: Icons.Search || (() => <span>🔍</span>)
            },
            {
                title: 'Paso 2: Explora',
                text: 'O navega por el mapa interactivo. Haz clic sobre cualquier predio para ver su información detallada.',
                icon: Icons.Navigation || (() => <span>👆</span>)
            },
            {
                title: 'Paso 3: Consulta',
                text: 'Obtén un reporte completo de zonificación y descarga la Ficha Informativa en PDF para tus trámites.',
                icon: Icons.FileText || (() => <span>📄</span>)
            }
        ];

        const currentStep = STEPS[step];
        const StepIcon = currentStep.icon;

        return (
            <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center pointer-events-none p-4 sm:p-0">
                {/* Backdrop (Optional, maybe too intrusive? Let's keep it subtle or just the card) */}
                {/* <div className="absolute inset-0 bg-black/20 pointer-events-auto" onClick={handleDismiss} /> */}

                <div className="
                    pointer-events-auto
                    bg-white rounded-2xl shadow-2xl border border-gray-100
                    w-full max-w-sm
                    overflow-hidden
                    animate-in slide-in-from-bottom-5 fade-in duration-300
                    flex flex-col
                ">
                    {/* Header Image/Icon Area */}
                    <div className="bg-gradient-to-br from-[#9d2148] to-[#7d1d3a] p-6 text-white text-center">
                        <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm">
                            <StepIcon className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold">{currentStep.title}</h3>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <p className="text-gray-600 text-sm leading-relaxed text-center mb-6">
                            {currentStep.text}
                        </p>

                        {/* Dots Indicator */}
                        <div className="flex justify-center gap-2 mb-6">
                            {STEPS.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-[#9d2148]' : 'w-1.5 bg-gray-200'}`}
                                />
                            ))}
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleDismiss}
                                className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                Saltar
                            </button>
                            <button
                                onClick={handleNext}
                                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-[#9d2148] hover:bg-[#7d1d3a] rounded-lg shadow-md transition-all active:scale-95"
                            >
                                {step === STEPS.length - 1 ? '¡Entendido!' : 'Siguiente'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    window.App.Components.OnboardingTour = OnboardingTour;
})();
