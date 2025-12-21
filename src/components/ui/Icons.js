window.App = window.App || {};
window.App.Components = window.App.Components || {};

/* BASE SVG COMPONENT */
const IconBase = ({ children, className, ...props }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
    >
        {children}
    </svg>
);

window.App.Components.Icons = {
    Search: (p) => (
        <IconBase {...p}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </IconBase>
    ),
    MapPin: (p) => (
        <IconBase {...p}>
            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
        </IconBase>
    ),
    MapPinned: (p) => (
        <IconBase {...p}>
            <path d="M12 17v5" />
            <path d="M8 21h8" />
            <path d="M17 9a5 5 0 1 0-10 0c0 4 5 8 5 8s5-4 5-8z" />
            <circle cx="12" cy="9" r="1.5" />
        </IconBase>
    ),
    Navigation: (p) => (
        <IconBase {...p}>
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
        </IconBase>
    ),
    Layers: (p) => (
        <IconBase {...p}>
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
        </IconBase>
    ),
    CheckCircle: (p) => (
        <IconBase {...p}>
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </IconBase>
    ),
    AlertCircle: (p) => (
        <IconBase {...p}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </IconBase>
    ),
    XCircle: (p) => (
        <IconBase {...p}>
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
        </IconBase>
    ),
    ChevronDown: (p) => (
        <IconBase {...p}>
            <polyline points="6 9 12 15 18 9" />
        </IconBase>
    ),
    RotateCcw: (p) => (
        <IconBase {...p}>
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
        </IconBase>
    ),
    MapIcon: (p) => (
        <IconBase {...p}>
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
        </IconBase>
    ),

    Copy: (p) => (
        <IconBase {...p}>
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </IconBase>
    ),
    Share: (p) => (
        <IconBase {...p}>
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </IconBase>
    ),
    Loader2: (p) => (
        <IconBase {...p} className={`${p.className || ''} spinner`}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </IconBase>
    ),
    X: (p) => (
        <IconBase {...p}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </IconBase>
    ),
    Pdf: (p) => (
        <IconBase {...p}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="12" x2="15" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
            <line x1="9" y1="18" x2="13" y2="18" />
        </IconBase>
    ),
    Menu: (p) => (
        <IconBase {...p}>
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="18" x2="20" y2="18" />
        </IconBase>
    ),
    Verified: (p) => (
        <IconBase {...p}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </IconBase>
    ),
    Clock: (p) => (
        <IconBase {...p}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </IconBase>
    )
};
