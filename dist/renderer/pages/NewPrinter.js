"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
const uuid_1 = require("uuid");
/**
 * Компонент NewPrinter - страница добавления нового принтера
 * Позволяет ввести данные и протестировать соединение с принтером
 */
const NewPrinter = () => {
    const navigate = (0, react_router_dom_1.useNavigate)();
    // Состояния для полей формы
    const [name, setName] = (0, react_1.useState)('');
    const [ipAddress, setIpAddress] = (0, react_1.useState)('');
    const [port, setPort] = (0, react_1.useState)('9100'); // Порт по умолчанию для RAW
    // Состояния для валидации
    const [errors, setErrors] = (0, react_1.useState)({
        name: '',
        ipAddress: '',
        port: '',
    });
    // Состояния для проверки соединения
    const [connectionStatus, setConnectionStatus] = (0, react_1.useState)('unchecked');
    const [connectionMessage, setConnectionMessage] = (0, react_1.useState)('');
    // Состояние для индикации процесса сохранения
    const [isSaving, setIsSaving] = (0, react_1.useState)(false);
    /**
     * Обработчик проверки соединения с принтером
     */
    const handleCheckConnection = async () => {
        // Сбрасываем состояние ошибок для IP-адреса и порта
        setErrors({
            ...errors,
            ipAddress: '',
            port: '',
        });
        // Проверяем заполнение полей
        if (!ipAddress) {
            setErrors(prev => ({ ...prev, ipAddress: 'IP-адрес не может быть пустым' }));
            return;
        }
        const portNumber = parseInt(port, 10);
        if (isNaN(portNumber) || portNumber <= 0 || portNumber > 65535) {
            setErrors(prev => ({ ...prev, port: 'Порт должен быть числом от 1 до 65535' }));
            return;
        }
        // Устанавливаем статус "проверка соединения"
        setConnectionStatus('checking');
        try {
            // Проверяем соединение через API Electron
            const result = await window.electronAPI.checkPrinterConnection(ipAddress, portNumber);
            // Обновляем статус соединения
            if (result.status === 'online') {
                setConnectionStatus('success');
                setConnectionMessage('Соединение с принтером установлено успешно');
            }
            else {
                setConnectionStatus('error');
                setConnectionMessage(`Не удалось подключиться к принтеру: ${result.message}`);
            }
        }
        catch (err) {
            setConnectionStatus('error');
            setConnectionMessage(`Ошибка при проверке соединения: ${err.message}`);
        }
    };
    /**
     * Обработчик сохранения нового принтера
     */
    const handleSave = async () => {
        // Проверяем заполнение всех полей
        let hasError = false;
        const newErrors = {
            name: '',
            ipAddress: '',
            port: '',
        };
        if (!name) {
            newErrors.name = 'Название принтера не может быть пустым';
            hasError = true;
        }
        if (!ipAddress) {
            newErrors.ipAddress = 'IP-адрес не может быть пустым';
            hasError = true;
        }
        const portNumber = parseInt(port, 10);
        if (isNaN(portNumber) || portNumber <= 0 || portNumber > 65535) {
            newErrors.port = 'Порт должен быть числом от 1 до 65535';
            hasError = true;
        }
        // Если есть ошибки в полях, обновляем состояние и прерываем сохранение
        if (hasError) {
            setErrors(newErrors);
            return;
        }
        // Устанавливаем индикатор сохранения
        setIsSaving(true);
        try {
            // Создаем объект нового принтера
            const newPrinter = {
                id: (0, uuid_1.v4)(),
                name,
                ipAddress,
                port: portNumber,
                isOnline: connectionStatus === 'success',
                lastChecked: connectionStatus !== 'unchecked' ? new Date().toISOString() : undefined,
            };
            // Сохраняем принтер через API Electron
            await window.electronAPI.savePrinter(newPrinter);
            // Переходим на страницу настроек принтеров
            navigate('/printers');
        }
        catch (err) {
            console.error('Ошибка при сохранении принтера:', err);
            // Можно здесь показать уведомление об ошибке
        }
        finally {
            setIsSaving(false);
        }
    };
    return ((0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: 'flex', alignItems: 'center', mb: 2 }, children: [(0, jsx_runtime_1.jsx)(material_1.Button, { startIcon: (0, jsx_runtime_1.jsx)(icons_material_1.ArrowBack, {}), onClick: () => navigate('/printers'), sx: { mr: 2 }, children: "\u041D\u0430\u0437\u0430\u0434" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h4", children: "\u0414\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u0440\u0438\u043D\u0442\u0435\u0440\u0430" })] }), (0, jsx_runtime_1.jsx)(material_1.Divider, { sx: { mb: 3 } }), (0, jsx_runtime_1.jsx)(material_1.Paper, { sx: { p: 3 }, children: (0, jsx_runtime_1.jsxs)(material_1.Grid, { container: true, spacing: 3, children: [(0, jsx_runtime_1.jsx)(material_1.Grid, { item: true, xs: 12, children: (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043F\u0440\u0438\u043D\u0442\u0435\u0440\u0430", fullWidth: true, value: name, onChange: (e) => setName(e.target.value), error: !!errors.name, helperText: errors.name, disabled: isSaving }) }), (0, jsx_runtime_1.jsx)(material_1.Grid, { item: true, xs: 12, sm: 8, children: (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "IP-\u0430\u0434\u0440\u0435\u0441 \u043F\u0440\u0438\u043D\u0442\u0435\u0440\u0430", fullWidth: true, value: ipAddress, onChange: (e) => setIpAddress(e.target.value), error: !!errors.ipAddress, helperText: errors.ipAddress, disabled: isSaving || connectionStatus === 'checking', placeholder: "192.168.0.100" }) }), (0, jsx_runtime_1.jsx)(material_1.Grid, { item: true, xs: 12, sm: 4, children: (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "\u041F\u043E\u0440\u0442", fullWidth: true, value: port, onChange: (e) => setPort(e.target.value), error: !!errors.port, helperText: errors.port || "Обычно 9100 (RAW)", disabled: isSaving || connectionStatus === 'checking', type: "number", InputProps: {
                                    endAdornment: ((0, jsx_runtime_1.jsx)(material_1.InputAdornment, { position: "end", children: "TCP" })),
                                } }) }), (0, jsx_runtime_1.jsx)(material_1.Grid, { item: true, xs: 12, children: (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "outlined", onClick: handleCheckConnection, disabled: isSaving || connectionStatus === 'checking' || !ipAddress, startIcon: connectionStatus === 'checking' ? (0, jsx_runtime_1.jsx)(material_1.CircularProgress, { size: 16 }) : null, children: "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u0435" }) }), connectionStatus !== 'unchecked' && ((0, jsx_runtime_1.jsx)(material_1.Grid, { item: true, xs: 12, children: (0, jsx_runtime_1.jsx)(material_1.Alert, { severity: connectionStatus === 'success' ? 'success' : 'error', icon: connectionStatus === 'success' ? (0, jsx_runtime_1.jsx)(icons_material_1.Check, {}) : (0, jsx_runtime_1.jsx)(icons_material_1.Close, {}), children: connectionMessage }) })), (0, jsx_runtime_1.jsxs)(material_1.Grid, { item: true, xs: 12, sx: { display: 'flex', justifyContent: 'flex-end', mt: 2 }, children: [(0, jsx_runtime_1.jsx)(material_1.Button, { variant: "outlined", onClick: () => navigate('/printers'), disabled: isSaving, sx: { mr: 1 }, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "contained", onClick: handleSave, disabled: isSaving, startIcon: isSaving ? (0, jsx_runtime_1.jsx)(material_1.CircularProgress, { size: 16 }) : null, children: isSaving ? 'Сохранение...' : 'Сохранить принтер' })] })] }) })] }));
};
exports.default = NewPrinter;
//# sourceMappingURL=NewPrinter.js.map