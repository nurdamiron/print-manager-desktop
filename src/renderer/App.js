"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_router_dom_1 = require("react-router-dom");
const styles_1 = require("@mui/material/styles");
const material_1 = require("@mui/material");
// Импорт основных компонентов приложения
const Layout_1 = __importDefault(require("./components/Layout"));
const Dashboard_1 = __importDefault(require("./pages/Dashboard"));
const PrinterSettings_1 = __importDefault(require("./pages/PrinterSettings"));
const NewPrinter_1 = __importDefault(require("./pages/NewPrinter"));
const PrintPage_1 = __importDefault(require("./pages/PrintPage"));
/**
 * Создаем тему оформления для Material UI
 * Тема определяет основные цвета, отступы и другие визуальные аспекты приложения
 */
const theme = (0, styles_1.createTheme)({
    palette: {
        primary: {
            main: '#1976d2', // Основной цвет приложения
        },
        secondary: {
            main: '#dc004e', // Вторичный цвет для акцентов
        },
        background: {
            default: '#f5f5f5', // Цвет фона всего приложения
        },
    },
    typography: {
        fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
        ].join(','),
    },
});
/**
 * Главный компонент приложения App
 * Отвечает за основные настройки темы и маршрутизацию
 */
const App = () => {
    return ((0, jsx_runtime_1.jsxs)(styles_1.ThemeProvider, { theme: theme, children: [(0, jsx_runtime_1.jsx)(material_1.CssBaseline, {}), (0, jsx_runtime_1.jsx)(Layout_1.default, { children: (0, jsx_runtime_1.jsxs)(react_router_dom_1.Routes, { children: [(0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/", element: (0, jsx_runtime_1.jsx)(Dashboard_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/printers", element: (0, jsx_runtime_1.jsx)(PrinterSettings_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/printers/new", element: (0, jsx_runtime_1.jsx)(NewPrinter_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/print", element: (0, jsx_runtime_1.jsx)(PrintPage_1.default, {}) })] }) })] }));
};
exports.default = App;
//# sourceMappingURL=App.js.map