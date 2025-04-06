"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
/**
 * Вспомогательная функция для получения параметров из строки запроса
 */
const useQuery = () => {
    return new URLSearchParams((0, react_router_dom_1.useLocation)().search);
};
/**
 * Компонент PrintPage - страница печати документов
 * Позволяет выбрать файл и принтер для печати
 */
const PrintPage = () => {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const query = useQuery();
    // Получаем ID принтера из URL-параметров (если есть)
    const printerIdFromUrl = query.get('printer');
    // Состояния для выбора принтера и файла
    const [selectedPrinterId, setSelectedPrinterId] = (0, react_1.useState)(printerIdFromUrl || '');
    const [selectedFile, setSelectedFile] = (0, react_1.useState)(null);
    // Состояния для настроек печати
    const [copies, setCopies] = (0, react_1.useState)(1);
    // Состояние для списка принтеров
    const [printers, setPrinters] = (0, react_1.useState)([]);
    // Состояния для обработки ошибок и загрузки
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    // Состояния для диалогов
    const [printDialogOpen, setPrintDialogOpen] = (0, react_1.useState)(false);
    const [printingStatus, setPrintingStatus] = (0, react_1.useState)({
        isPrinting: false,
        success: null,
        message: '',
    });
    /**
     * Загружает список принтеров при монтировании компонента
     */
    (0, react_1.useEffect)(() => {
        const loadPrinters = async () => {
            try {
                setLoading(true);
                setError(null);
                // Используем API из preload для получения списка принтеров
                const printerList = await window.electronAPI.getPrinters();
                setPrinters(printerList);
                // Если принтер передан в URL, но его нет в списке, сбрасываем выбор
                if (printerIdFromUrl && !printerList.some((p) => p.id === printerIdFromUrl)) {
                    setSelectedPrinterId('');
                }
            }
            catch (err) {
                console.error('Ошибка загрузки принтеров:', err);
                setError('Не удалось загрузить список принтеров');
            }
            finally {
                setLoading(false);
            }
        };
        loadPrinters();
    }, [printerIdFromUrl]);
    /**
     * Обработчик выбора файла для печати
     */
    const handleFileSelect = async () => {
        try {
            const filePath = await window.electronAPI.selectFile();
            if (filePath) {
                // Получаем имя файла из полного пути
                const fileName = filePath.split(/[\\/]/).pop() || 'file';
                setSelectedFile({
                    path: filePath,
                    name: fileName,
                });
            }
        }
        catch (err) {
            console.error('Ошибка при выборе файла:', err);
            setError('Не удалось выбрать файл');
        }
    };
    /**
     * Обработчик очистки выбранного файла
     */
    const handleClearFile = () => {
        setSelectedFile(null);
    };
    /**
     * Обработчик открытия диалога подтверждения печати
     */
    const handleOpenPrintDialog = () => {
        setPrintDialogOpen(true);
    };
    /**
     * Обработчик закрытия диалога подтверждения печати
     */
    const handleClosePrintDialog = () => {
        setPrintDialogOpen(false);
    };
    /**
     * Обработчик отправки файла на печать
     */
    const handlePrint = async () => {
        if (!selectedFile || !selectedPrinterId) {
            return;
        }
        // Находим выбранный принтер
        const printer = printers.find(p => p.id === selectedPrinterId);
        if (!printer) {
            setError('Принтер не найден');
            return;
        }
        // Закрываем диалог подтверждения
        setPrintDialogOpen(false);
        // Устанавливаем статус печати
        setPrintingStatus({
            isPrinting: true,
            success: null,
            message: 'Отправка документа на печать...',
        });
        try {
            // Отправляем файл на принтер через API Electron
            // В реальном приложении здесь можно учесть параметр copies
            const result = await window.electronAPI.sendToPrinter(selectedFile.path, printer.ipAddress, printer.port);
            // Обновляем статус печати
            setPrintingStatus({
                isPrinting: false,
                success: true,
                message: 'Документ успешно отправлен на печать',
            });
            // Сбрасываем выбранный файл после успешной печати
            setSelectedFile(null);
        }
        catch (err) {
            console.error('Ошибка печати:', err);
            // Обновляем статус печати с ошибкой
            setPrintingStatus({
                isPrinting: false,
                success: false,
                message: `Ошибка при печати: ${err.message}`,
            });
        }
    };
    /**
     * Обработчик закрытия уведомления о статусе печати
     */
    const handleCloseStatus = () => {
        setPrintingStatus({
            isPrinting: false,
            success: null,
            message: '',
        });
    };
    /**
     * Получает выбранный принтер из списка
     */
    const getSelectedPrinter = () => {
        return printers.find(p => p.id === selectedPrinterId);
    };
    /**
     * Проверяет, готова ли форма для печати
     */
    const isPrintReady = () => {
        return selectedFile !== null && selectedPrinterId !== '' && copies > 0;
    };
    return ((0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h4", gutterBottom: true, children: "\u041F\u0435\u0447\u0430\u0442\u044C \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430" }), (0, jsx_runtime_1.jsx)(material_1.Divider, { sx: { mb: 3 } }), (0, jsx_runtime_1.jsx)(material_1.Paper, { sx: { p: 3, mb: 3 }, children: (0, jsx_runtime_1.jsxs)(material_1.Grid, { container: true, spacing: 3, children: [(0, jsx_runtime_1.jsx)(material_1.Grid, { item: true, xs: 12, children: (0, jsx_runtime_1.jsxs)(material_1.FormControl, { fullWidth: true, error: !selectedPrinterId && !loading, children: [(0, jsx_runtime_1.jsx)(material_1.InputLabel, { id: "printer-select-label", children: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u0440\u0438\u043D\u0442\u0435\u0440" }), (0, jsx_runtime_1.jsx)(material_1.Select, { labelId: "printer-select-label", value: selectedPrinterId, onChange: (e) => setSelectedPrinterId(e.target.value), label: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u0440\u0438\u043D\u0442\u0435\u0440", disabled: loading || printers.length === 0, children: printers.map((printer) => ((0, jsx_runtime_1.jsxs)(material_1.MenuItem, { value: printer.id, disabled: printer.isOnline === false, children: [printer.name, " ", printer.isOnline === false ? '(Не в сети)' : ''] }, printer.id))) }), !loading && printers.length === 0 && ((0, jsx_runtime_1.jsx)(material_1.FormHelperText, { error: true, children: "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0445 \u043F\u0440\u0438\u043D\u0442\u0435\u0440\u043E\u0432. \u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u0434\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u043F\u0440\u0438\u043D\u0442\u0435\u0440 \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445." }))] }) }), (0, jsx_runtime_1.jsx)(material_1.Grid, { item: true, xs: 12, children: selectedFile ? ((0, jsx_runtime_1.jsx)(material_1.Paper, { variant: "outlined", sx: { p: 2 }, children: (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [(0, jsx_runtime_1.jsx)(material_1.Box, { sx: { display: 'flex', alignItems: 'center' }, children: (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body1", children: selectedFile.name }) }), (0, jsx_runtime_1.jsx)(material_1.IconButton, { onClick: handleClearFile, color: "error", children: (0, jsx_runtime_1.jsx)(icons_material_1.Delete, {}) })] }) })) : ((0, jsx_runtime_1.jsx)(material_1.Button, { variant: "outlined", startIcon: (0, jsx_runtime_1.jsx)(icons_material_1.Upload, {}), onClick: handleFileSelect, fullWidth: true, sx: { py: 1.5 }, disabled: loading, children: "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0444\u0430\u0439\u043B \u0434\u043B\u044F \u043F\u0435\u0447\u0430\u0442\u0438" })) }), selectedFile && ((0, jsx_runtime_1.jsx)(material_1.Grid, { item: true, xs: 12, sm: 6, children: (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u043A\u043E\u043F\u0438\u0439", type: "number", fullWidth: true, value: copies, onChange: (e) => setCopies(Math.max(1, parseInt(e.target.value) || 1)), InputProps: { inputProps: { min: 1, max: 100 } } }) })), (0, jsx_runtime_1.jsx)(material_1.Grid, { item: true, xs: 12, children: (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "contained", color: "primary", startIcon: (0, jsx_runtime_1.jsx)(icons_material_1.Print, {}), onClick: handleOpenPrintDialog, disabled: !isPrintReady() || printingStatus.isPrinting, fullWidth: true, size: "large", sx: { py: 1.5 }, children: "\u041F\u0435\u0447\u0430\u0442\u044C" }) })] }) }), error && ((0, jsx_runtime_1.jsx)(material_1.Alert, { severity: "error", sx: { mt: 2 }, children: error })), printingStatus.message && ((0, jsx_runtime_1.jsx)(material_1.Alert, { severity: printingStatus.isPrinting ? 'info' : (printingStatus.success ? 'success' : 'error'), action: !printingStatus.isPrinting && ((0, jsx_runtime_1.jsx)(material_1.Button, { color: "inherit", size: "small", onClick: handleCloseStatus, children: "\u041E\u041A" })), icon: printingStatus.isPrinting ? (0, jsx_runtime_1.jsx)(material_1.CircularProgress, { size: 20 }) : undefined, sx: { mt: 2 }, children: printingStatus.message })), (0, jsx_runtime_1.jsxs)(material_1.Dialog, { open: printDialogOpen, onClose: handleClosePrintDialog, children: [(0, jsx_runtime_1.jsx)(material_1.DialogTitle, { children: "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435 \u043F\u0435\u0447\u0430\u0442\u0438" }), (0, jsx_runtime_1.jsx)(material_1.DialogContent, { children: (0, jsx_runtime_1.jsxs)(material_1.DialogContentText, { children: ["\u0412\u044B \u0441\u043E\u0431\u0438\u0440\u0430\u0435\u0442\u0435\u0441\u044C \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0444\u0430\u0439\u043B \"", selectedFile?.name, "\" \u043D\u0430 \u043F\u0440\u0438\u043D\u0442\u0435\u0440 \"", getSelectedPrinter()?.name, "\" \u0432 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u0435 ", copies, " \u043A\u043E\u043F\u0438\u0439. \u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C?"] }) }), (0, jsx_runtime_1.jsxs)(material_1.DialogActions, { children: [(0, jsx_runtime_1.jsx)(material_1.Button, { onClick: handleClosePrintDialog, color: "inherit", children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), (0, jsx_runtime_1.jsx)(material_1.Button, { onClick: handlePrint, color: "primary", variant: "contained", startIcon: (0, jsx_runtime_1.jsx)(icons_material_1.Check, {}), children: "\u041F\u0435\u0447\u0430\u0442\u0430\u0442\u044C" })] })] })] }));
};
exports.default = PrintPage;
//# sourceMappingURL=PrintPage.js.map