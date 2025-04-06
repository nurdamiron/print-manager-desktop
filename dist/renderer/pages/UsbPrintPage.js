"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
// Остальной код компонента...
const UsbPrintPage = () => {
    const [usbPrinters, setUsbPrinters] = (0, react_1.useState)([]);
    const [selectedPrinterId, setSelectedPrinterId] = (0, react_1.useState)('');
    const [selectedFile, setSelectedFile] = (0, react_1.useState)(null);
    const [copies, setCopies] = (0, react_1.useState)(1);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [printing, setPrinting] = (0, react_1.useState)(false);
    const [message, setMessage] = (0, react_1.useState)({
        text: '', type: null
    });
    // Загружаем USB-принтеры при монтировании
    (0, react_1.useEffect)(() => {
        const loadUsbPrinters = async () => {
            try {
                setLoading(true);
                // @ts-ignore - Для решения проблемы типизации
                const printers = await window.electronAPI.getUsbPrinters();
                setUsbPrinters(printers);
                if (printers.length > 0) {
                    setSelectedPrinterId(printers[0].id);
                }
            }
            catch (error) {
                setMessage({
                    text: 'Ошибка при получении списка USB-принтеров',
                    type: 'error'
                });
            }
            finally {
                setLoading(false);
            }
        };
        loadUsbPrinters();
    }, []);
    // Обработчик выбора файла
    const handleFileSelect = async () => {
        try {
            // @ts-ignore
            const filePath = await window.electronAPI.selectFile();
            if (filePath) {
                const fileName = filePath.split(/[\\/]/).pop() || 'file';
                setSelectedFile({
                    path: filePath,
                    name: fileName
                });
            }
        }
        catch (error) {
            setMessage({
                text: 'Ошибка при выборе файла',
                type: 'error'
            });
        }
    };
    // Обработчик печати
    const handlePrint = async () => {
        if (!selectedFile || !selectedPrinterId)
            return;
        try {
            setPrinting(true);
            setMessage({
                text: 'Отправка документа на печать...',
                type: 'info'
            });
            // @ts-ignore
            const result = await window.electronAPI.printToUsb(selectedPrinterId, selectedFile.path, copies);
            setMessage({
                text: result.success
                    ? 'Документ успешно отправлен на печать'
                    : `Ошибка печати: ${result.message}`,
                type: result.success ? 'success' : 'error'
            });
        }
        catch (error) {
            setMessage({
                text: `Ошибка при печати: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
                type: 'error'
            });
        }
        finally {
            setPrinting(false);
        }
    };
    return ((0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h4", gutterBottom: true, children: "\u041F\u0440\u044F\u043C\u0430\u044F \u043F\u0435\u0447\u0430\u0442\u044C \u043D\u0430 USB-\u043F\u0440\u0438\u043D\u0442\u0435\u0440" }), (0, jsx_runtime_1.jsx)(material_1.Paper, { sx: { p: 3, mb: 3 }, children: loading ? ((0, jsx_runtime_1.jsx)(material_1.Box, { sx: { display: 'flex', justifyContent: 'center', p: 3 }, children: (0, jsx_runtime_1.jsx)(material_1.CircularProgress, {}) })) : ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: usbPrinters.length === 0 ? ((0, jsx_runtime_1.jsx)(material_1.Alert, { severity: "warning", children: "USB-\u043F\u0440\u0438\u043D\u0442\u0435\u0440\u044B \u043D\u0435 \u043E\u0431\u043D\u0430\u0440\u0443\u0436\u0435\u043D\u044B. \u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u043F\u0440\u0438\u043D\u0442\u0435\u0440 \u043A USB-\u043F\u043E\u0440\u0442\u0443." })) : ((0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", gutterBottom: true, children: "\u0414\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0435 USB-\u043F\u0440\u0438\u043D\u0442\u0435\u0440\u044B:" }), (0, jsx_runtime_1.jsx)(material_1.Select, { fullWidth: true, value: selectedPrinterId, onChange: (e) => setSelectedPrinterId(e.target.value), sx: { mb: 3 }, children: usbPrinters.map((printer) => ((0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: printer.id, children: printer.name }, printer.id))) }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "outlined", fullWidth: true, onClick: handleFileSelect, sx: { mb: 3 }, children: selectedFile ? `Выбранный файл: ${selectedFile.name}` : 'Выбрать файл для печати' }), (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u043A\u043E\u043F\u0438\u0439", type: "number", value: copies, onChange: (e) => setCopies(Math.max(1, parseInt(e.target.value) || 1)), fullWidth: true, sx: { mb: 3 }, InputProps: { inputProps: { min: 1, max: 100 } } }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "contained", color: "primary", fullWidth: true, startIcon: printing ? (0, jsx_runtime_1.jsx)(material_1.CircularProgress, { size: 20, color: "inherit" }) : (0, jsx_runtime_1.jsx)(icons_material_1.Print, {}), onClick: handlePrint, disabled: printing || !selectedFile || !selectedPrinterId, children: "\u041F\u0435\u0447\u0430\u0442\u044C" })] })) })) }), message.type && ((0, jsx_runtime_1.jsx)(material_1.Alert, { severity: message.type, children: message.text }))] }));
};
exports.default = UsbPrintPage;
//# sourceMappingURL=UsbPrintPage.js.map