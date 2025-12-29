(function () {
    // Inicializar namespace de forma segura
    window.App = window.App || {};
    window.App.Utils = window.App.Utils || {};

    const dayjs = window.dayjs;

    /* ------------------------------------------------ */
    /* HELPERS FECHA Y HORA (Day.js) */
    /* ------------------------------------------------ */

    const formatDateTime = (date, format = 'DD/MM/YYYY, HH:mm') => {
        if (!date) return '';
        if (!dayjs) return new Date(date).toLocaleString(); // Fallback if dayjs missing
        return dayjs(date).format(format);
    };

    const formatDate = (date, format = 'DD/MM/YYYY') => {
        if (!date) return '';
        if (!dayjs) return new Date(date).toLocaleDateString();
        return dayjs(date).format(format);
    };

    const formatTime = (date, format = 'HH:mm') => {
        if (!date) return '';
        if (!dayjs) return new Date(date).toLocaleTimeString();
        return dayjs(date).format(format);
    };

    const generateFolio = () => {
        if (!dayjs) {
            return `F-${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}`;
        }
        return `F-${dayjs().format('YYYYMMDDHHmmss')}`;
    };

    // EXPORTACIÓN FINAL A WINDOW USANDO OBJECT.ASSIGN
    Object.assign(window.App.Utils, {
        formatDateTime,
        formatDate,
        formatTime,
        generateFolio
    });

})();
