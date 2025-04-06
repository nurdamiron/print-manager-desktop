"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
/**
 * Компонент Dashboard - главная страница приложения
 * Отображает обзорную информацию и быстрые ссылки на основные функции
 */
const Dashboard = () => {
    const navigate = (0, react_router_dom_1.useNavigate)();
    // Состояние для хранения списка принтеров
    const [printers, setPrinters] = (0, react_1.useState)([]);
    // Состояние для индикации загрузки данных
    const [loading, setLoading] = (0, react_1.useState)(true);
    // Состояние для отслеживания ошибок загрузки
    const [error, setError] = (0, react_1.useState)(null);
    // Загружаем данные о принтерах при монтировании компонента
    (0, react_1.useEffect)(() => {
        /**
         * Функция для загрузки списка принтеров из локального хранилища
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
        loadPrinters();
    }, []);
    // Расчет статистики по принтерам
    const onlinePrinters = printers.filter(printer => printer.isOnline === true).length;
    const totalPrinters = printers.length;
    return ((0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h4", gutterBottom: true, children: "\u041F\u0430\u043D\u0435\u043B\u044C \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F" }), (0, jsx_runtime_1.jsx)(material_1.Grid, { container: true, spacing: 3, sx: { mb: 4 }, children: (0, jsx_runtime_1.jsx)(material_1.Grid, { item: true, xs: 12, md: 4, children: (0, jsx_runtime_1.jsxs)(material_1.Paper, { elevation: 1, sx: { p: 2 }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", color: "primary", gutterBottom: true, children: "\u041F\u0440\u0438\u043D\u0442\u0435\u0440\u044B" }), loading ? ((0, jsx_runtime_1.jsx)(material_1.Box, { sx: { display: 'flex', justifyContent: 'center', p: 2 }, children: (0, jsx_runtime_1.jsx)(material_1.CircularProgress, { size: 24 }) })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "h4", children: [onlinePrinters, " / ", totalPrinters] }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body2", color: "text.secondary", children: "\u043F\u0440\u0438\u043D\u0442\u0435\u0440\u043E\u0432 \u0432 \u0441\u0435\u0442\u0438" })] }))] }) }) }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h5", gutterBottom: true, children: "\u0411\u044B\u0441\u0442\u0440\u044B\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F" }), (0, jsx_runtime_1.jsxs)(material_1.Grid, { container: true, spacing: 3, children: [(0, jsx_runtime_1.jsx)(material_1.Grid, { item: true, xs: 12, sm: 6, md: 4, children: (0, jsx_runtime_1.jsx)(material_1.Card, { variant: "outlined", children: (0, jsx_runtime_1.jsx)(material_1.CardContent, { children: (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }, children: [(0, jsx_runtime_1.jsx)(icons_material_1.Print, { sx: { fontSize: 48, color: 'primary.main', mb: 2 } }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", gutterBottom: true, children: "\u041F\u0435\u0447\u0430\u0442\u044C \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body2", color: "text.secondary", align: "center", sx: { mb: 2 }, children: "\u041E\u0442\u043F\u0440\u0430\u0432\u044C\u0442\u0435 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442 \u043D\u0430 \u043F\u0435\u0447\u0430\u0442\u044C" }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "contained", color: "primary", onClick: () => navigate('/print'), disabled: totalPrinters === 0, children: "\u041D\u0430\u0447\u0430\u0442\u044C \u043F\u0435\u0447\u0430\u0442\u044C" })] }) }) }) }), (0, jsx_runtime_1.jsx)(material_1.Grid, { item: true, xs: 12, sm: 6, md: 4, children: (0, jsx_runtime_1.jsx)(material_1.Card, { variant: "outlined", children: (0, jsx_runtime_1.jsx)(material_1.CardContent, { children: (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }, children: [(0, jsx_runtime_1.jsx)(icons_material_1.Settings, { sx: { fontSize: 48, color: 'primary.main', mb: 2 } }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", gutterBottom: true, children: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430 \u043F\u0440\u0438\u043D\u0442\u0435\u0440\u043E\u0432" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body2", color: "text.secondary", align: "center", sx: { mb: 2 }, children: "\u0414\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u0442\u0435 \u043F\u0440\u0438\u043D\u0442\u0435\u0440\u044B" }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "contained", color: "primary", onClick: () => navigate('/printers'), children: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438" })] }) }) }) })] }), error && ((0, jsx_runtime_1.jsx)(material_1.Typography, { color: "error", sx: { mt: 2 }, children: error }))] }));
};
exports.default = Dashboard;
//# sourceMappingURL=Dashboard.js.map