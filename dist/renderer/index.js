"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const client_1 = __importDefault(require("react-dom/client"));
const react_router_dom_1 = require("react-router-dom");
const App_1 = __importDefault(require("./App"));
// Получаем корневой элемент DOM
const rootElement = document.getElementById('root');
// Проверяем, существует ли элемент
if (!rootElement) {
    throw new Error('Корневой элемент #root не найден в DOM');
}
// Создаем корень React
const root = client_1.default.createRoot(rootElement);
// Рендерим приложение
root.render((0, jsx_runtime_1.jsx)(react_1.default.StrictMode, { children: (0, jsx_runtime_1.jsx)(react_router_dom_1.HashRouter, { children: (0, jsx_runtime_1.jsx)(App_1.default, {}) }) }));
//# sourceMappingURL=index.js.map