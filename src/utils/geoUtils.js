window.App = window.App || {};
window.App.Utils = {};

// Dependencias
const Constants = window.App.Constants;

/* ------------------------------------------------ */
/* HELPERS GEOESPACIALES */
/* ------------------------------------------------ */

window.App.Utils.isPointInPolygon = (point, feature) => {
    if (!feature?.geometry?.type || !feature?.geometry?.coordinates) return false;
    const x = point.lng; // GeoJSON: X = longitud
    const y = point.lat; // GeoJSON: Y = latitud

    const { type, coordinates } = feature.geometry;

    const pointInRing = (ring) => {
        let inside = false;

        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const xi = ring[i][0]; // lng
            const yi = ring[i][1]; // lat
            const xj = ring[j][0]; // lng
            const yj = ring[j][1]; // lat

            const intersect =
                yi > y !== yj > y &&
                x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

            if (intersect) inside = !inside;
        }

        return inside;
    };

    if (type === 'Polygon') {
        // 1) Debe estar dentro del anillo exterior
        if (!pointInRing(coordinates[0])) return false;

        // 2) Si cae dentro de un hueco, entonces NO está dentro
        const holes = coordinates.slice(1);
        if (holes.length && holes.some(h => pointInRing(h))) return false;

        return true;
    }

    if (type === 'MultiPolygon') {
        return coordinates.some(poly => {
            if (!pointInRing(poly[0])) return false;
            const holes = poly.slice(1);
            if (holes.length && holes.some(h => pointInRing(h))) return false;
            return true;
        });
    }

    return false;
};

window.App.Utils.findFeature = (p, c) => {
    if (!c?.features) return null;
    // ✅ Reverse loop: prioritize layers on top (last in array)
    for (let i = c.features.length - 1; i >= 0; i--) {
        const f = c.features[i];
        if (window.App.Utils.isPointInPolygon(p, f)) return f;
    }
    return null;
};

window.App.Utils.getZoningColor = (key) => {
    if (!key) return '#ccc';
    const k = key.toString().toUpperCase();
    // Busca parcial (ej: "FCE 2" -> match "FCE")
    const cat = Object.keys(Constants.ZONING_CAT_INFO).find(c => k.startsWith(c));
    return cat ? Constants.ZONING_CAT_INFO[cat].color : '#9ca3af';
};

window.App.Utils.getZoningStyle = (feature) => {
    const k = (feature.properties?.CLAVE || '').toString().trim().toUpperCase();
    const color = window.App.Utils.getZoningColor(k);

    return {
        color: '#ffffff', // Borde blanco fino
        weight: 1.5,      // Standardized
        opacity: 0.8,
        fillColor: color,
        fillOpacity: 0.2  // Unified opacity
    };
};

window.App.Utils.getSectorStyle = (sectorName) => {
    const norm = (sectorName || '').toLowerCase().trim();
    if (norm.includes('agrícola') || norm.includes('agricola') || norm.includes('agro')) {
        return { bg: '#FEF9C3', border: '#FACC15', text: '#854D0E' }; // Amarillo/Dorado
    }
    if (norm.includes('pecuario') || norm.includes('ganad')) {
        return { bg: '#FFEDD5', border: '#FB923C', text: '#9A3412' }; // Naranja
    }
    if (norm.includes('forestal') || norm.includes('bosque')) {
        return { bg: '#DCFCE7', border: '#22C55E', text: '#14532D' }; // Verde
    }
    if (norm.includes('turismo') || norm.includes('eco')) {
        return { bg: '#E0E7FF', border: '#6366F1', text: '#312E81' }; // Indigo
    }
    if (norm.includes('infra') || norm.includes('equip')) {
        return { bg: '#F3F4F6', border: '#9CA3AF', text: '#374151' }; // Gris
    }
    return { bg: '#F3F4F6', border: '#9CA3AF', text: '#374151' }; // Default
};


/* ------------------------------------------------ */
/* HELPERS PARSING & SEARCH (MAPBOX) */
/* ------------------------------------------------ */

window.App.Utils.isStrictNumber = (val) => {
    if (typeof val !== 'string') return false;
    return !isNaN(val) && !isNaN(parseFloat(val));
};

window.App.Utils.parseCoordinateInput = (input) => {
    if (!input) return null;
    const s = input.trim();

    // ------------ 1) Intento Decimal: "19.41, -99.14" ------------
    const tryDecimal = (text) => {
        // Si trae símbolos de DMS o hemisferios, NO intentar decimal
        if (/[°'"NnSsEeWw]/.test(text)) return null;

        // Con coma: "19.41, -99.14"
        if (text.includes(',')) {
            const parts = text.split(',').map(p => p.trim());
            if (parts.length === 2 && window.App.Utils.isStrictNumber(parts[0]) && window.App.Utils.isStrictNumber(parts[1])) {
                const lat = Number(parts[0]);
                const lng = Number(parts[1]);
                if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
            }
        }

        // Con espacio: "19.41 -99.14"
        const spaceParts = text.trim().split(/\s+/);
        if (spaceParts.length === 2 && window.App.Utils.isStrictNumber(spaceParts[0]) && window.App.Utils.isStrictNumber(spaceParts[1])) {
            const lat = Number(spaceParts[0]);
            const lng = Number(spaceParts[1]);
            if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
        }

        return null;
    };

    const decimal = tryDecimal(s);
    if (decimal) return decimal;

    // ------------ 2) Intento DMS tipo Google: 19°25'04.3"N 99°08'37.9"W ------------
    const dmsToDecimal = (deg, min, sec, hemi) => {
        let d = parseFloat(deg) + parseFloat(min) / 60 + parseFloat(sec) / 3600;
        hemi = (hemi || '').toUpperCase();
        if (hemi === 'S' || hemi === 'W') d *= -1;
        return d;
    };

    const latMatch = s.match(/(\d+)[°\s]+(\d+)[\'’\s]+(\d+(?:\.\d+)?)[\"\s]*([NnSs])/);
    const lonMatch = s.match(/(\d+)[°\s]+(\d+)[\'’\s]+(\d+(?:\.\d+)?)[\"\s]*([EeWw])/);

    if (latMatch && lonMatch) {
        const lat = dmsToDecimal(latMatch[1], latMatch[2], latMatch[3], latMatch[4]);
        const lng = dmsToDecimal(lonMatch[1], lonMatch[2], lonMatch[3], lonMatch[4]);
        if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }

    // Si nada coincide
    return null;
};

window.App.Utils.searchMapboxPlaces = async (query) => {
    if (!query) return [];
    const token = Constants.MAPBOX_TOKEN;
    // Bounding box CDMX aprox (no restrictivo, pero ayuda)
    const bbox = '-99.3649,19.0482,-98.9403,19.5927';
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&bbox=${bbox}&country=mx&limit=5&language=es`;

    try {
        const r = await fetch(url);
        if (!r.ok) return [];
        const d = await r.json();
        return d.features.map(f => ({
            id: f.id,
            label: f.text, // Nombre corto
            fullLabel: f.place_name,
            lat: f.center[1],
            lng: f.center[0]
        }));
    } catch (e) {
        console.error('Mapbox error:', e);
        return [];
    }
};
