"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
const PrinterCard_1 = __importDefault(require("../components/PrinterCard"));
/**
 * Компонент PrinterSettings - страница настройки принтеров
 * Отображает список принтеров и позволяет управлять ими
 */
const PrinterSettings = () => {
    const navigate = (0, react_router_dom_1.useNavigate)();
    // Состояние для хранения списка принтеров
    const [printers, setPrinters] = (0, react_1.useState)([]);
    // Состояние для индикации загрузки данных
    const [loading, setLoading] = (0, react_1.useState)(true);
    // Состояние для отслеживания ошибок загрузки
    const [error, setError] = (0, react_1.useState)(null);
    // Состояние для уведомлений
    const [snackbar, setSnackbar] = (0, react_1.useState)({
        open: false,
        message: '',
        severity: 'info',
    });
    /**
     * Загружает список принтеров из локального хранилища
     */
    const loadPrinters = async () => {
        try {
            setLoading(true);
            setError(null);
            // Используем API из preload для получения списка принтеров
            const printerList = await window.electronAPI.getPrinters();
            setPrinters(printerList);
        }
        catch (err) {
            console.error('Ошибка загрузки принтеров:', err);
            setError('Не удалось загрузить список принтеров');
        }
        finally {
            setLoading(false);
        }
    };
    // Загружаем данные о принтерах при монтировании компонента
    (0, react_1.useEffect)(() => {
        loadPrinters();
    }, []);
    /**
     * Обработчик проверки соединения с принтером
     * @param printer Принтер для проверки
     */
    const handleCheckPrinter = async (printer) => {
        try {
            // Проверяем соединение через API Electron
            const result = await window.electronAPI.checkPrinterConnection(printer.ipAddress, printer.port);
            // Обновляем статус принтера в списке
            const updatedPrinters = printers.map(p => {
                if (p.id === printer.id) {
                    return {
                        ...p,
                        isOnline: result.status === 'online',
                        lastChecked: new Date().toISOString(),
                    };
                }
                return p;
            });
            setPrinters(updatedPrinters);
            // Сохраняем обновленный список принтеров
            for (const p of updatedPrinters) {
                await window.electronAPI.savePrinter(p);
            }
            // Показываем уведомление о результате проверки
            setSnackbar({
                open: true,
                message: result.status === 'online'
                    ? `Принтер "${printer.name}" в сети`
                    : `Принтер "${printer.name}" не отвечает`,
                severity: result.status === 'online' ? 'success' : 'warning',
            });
        }
        catch (err) {
            console.error('Ошибка при проверке принтера:', err);
            setSnackbar({
                open: true,
                message: `Ошибка при проверке принтера "${printer.name}"`,
                severity: 'error',
            });
        }
    };
    /**
     * Обработчик удаления принтера
     * @param id Идентификатор принтера для удаления
     */
    const handleDeletePrinter = async (id) => {
        try {
            // Используем API из preload для удаления принтера
            await window.electronAPI.deletePrinter(id);
            // Обновляем список принтеров
            setPrinters(printers.filter(p => p.id !== id));
            // Показываем уведомление об успешном удалении
            setSnackbar({
                open: true,
                message: 'Принтер успешно удален',
                severity: 'success',
            });
        }
        catch (err) {
            console.error('Ошибка при удалении принтера:', err);
            setSnackbar({
                open: true,
                message: 'Ошибка при удалении принтера',
                severity: 'error',
            });
        }
    };
    /**
     * Обработчик выбора принтера для печати
     * @param printer Выбранный принтер
     */
    const handleSelectPrinter = (printer) => {
        // Переходим на страницу печати и передаем идентификатор принтера
        navigate(`/print?printer=${printer.id}`);
    };
    /**
     * Обработчик закрытия уведомления
     */
    const handleCloseSnackbar = () => {
        setSnackbar({
            ...snackbar,
            open: false,
        });
    };
    /**
     * Обновляет статус всех принтеров
     */
    const handleRefreshAll = async () => {
        setSnackbar({
            open: true,
            message: 'Обновление статуса всех принтеров...',
            severity: 'info',
        });
        // Проверяем каждый принтер
        for (const printer of printers) {
            await handleCheckPrinter(printer);
        }
        setSnackbar({
            open: true,
            message: 'Обновление завершено',
            severity: 'success',
        });
    };
    return ((0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h4", children: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043F\u0440\u0438\u043D\u0442\u0435\u0440\u043E\u0432" }), (0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Button, { variant: "outlined", startIcon: (0, jsx_runtime_1.jsx)(icons_material_1.Refresh, {}), onClick: handleRefreshAll, disabled: loading || printers.length === 0, sx: { mr: 1 }, children: "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u0432\u0441\u0435" }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "contained", startIcon: (0, jsx_runtime_1.jsx)(icons_material_1.Add, {}), onClick: () => navigate('/printers/new'), children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u0440\u0438\u043D\u0442\u0435\u0440" })] })] }), (0, jsx_runtime_1.jsx)(material_1.Divider, { sx: { mb: 3 } }), loading ? ((0, jsx_runtime_1.jsx)(material_1.Box, { sx: { display: 'flex', justifyContent: 'center', py: 4 }, children: (0, jsx_runtime_1.jsx)(material_1.CircularProgress, {}) })) : (
            // Список принтеров или сообщение об их отсутствии
            (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: printers.length === 0 ? ((0, jsx_runtime_1.jsx)(material_1.Alert, { severity: "info", sx: { mb: 2 }, children: "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u043D\u044B\u0445 \u043F\u0440\u0438\u043D\u0442\u0435\u0440\u043E\u0432. \u041D\u0430\u0436\u043C\u0438\u0442\u0435 \"\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u0440\u0438\u043D\u0442\u0435\u0440\", \u0447\u0442\u043E\u0431\u044B \u043D\u0430\u0447\u0430\u0442\u044C." })) : (printers.map(printer => ((0, jsx_runtime_1.jsx)(PrinterCard_1.default, { printer: printer, onDelete: handleDeletePrinter, onCheck: handleCheckPrinter, onSelect: handleSelectPrinter }, printer.id)))) })), error && ((0, jsx_runtime_1.jsx)(material_1.Alert, { severity: "error", sx: { mt: 2 }, children: error })), (0, jsx_runtime_1.jsx)(material_1.Snackbar, { open: snackbar.open, autoHideDuration: 6000, onClose: handleCloseSnackbar, children: (0, jsx_runtime_1.jsx)(material_1.Alert, { onClose: handleCloseSnackbar, severity: snackbar.severity, sx: { width: '100%' }, children: snackbar.message }) })] }));
};
exports.default = PrinterSettings;
//# sourceMappingURL=PrinterSettings.js.map