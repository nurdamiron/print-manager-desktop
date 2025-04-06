"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
/**
 * Компонент Layout - основной шаблон приложения
 * Включает боковую панель навигации и верхнюю панель
 * @param children Дочерние компоненты, которые будут отображены в области контента
 */
const Layout = ({ children }) => {
    // Используем хуки для навигации и получения текущего пути
    const navigate = (0, react_router_dom_1.useNavigate)();
    const location = (0, react_router_dom_1.useLocation)();
    // Состояние для управления открытием/закрытием боковой панели
    const [drawerOpen, setDrawerOpen] = (0, react_1.useState)(false);
    // Ширина боковой панели
    const drawerWidth = 240;
    /**
     * Обработчик переключения состояния боковой панели
     */
    const toggleDrawer = () => {
        setDrawerOpen(!drawerOpen);
    };
    /**
     * Обработчик навигации по клику на пункт меню
     * @param path Путь для перехода
     */
    const handleNavigation = (path) => {
        navigate(path);
        setDrawerOpen(false);
    };
    /**
     * Возвращает заголовок страницы на основе текущего пути
     */
    const getPageTitle = () => {
        switch (location.pathname) {
            case '/':
                return 'Панель управления';
            case '/printers':
                return 'Настройки принтеров';
            case '/printers/new':
                return 'Добавление принтера';
            case '/print':
                return 'Печать документа';
            default:
                return 'Менеджер принтеров';
        }
    };
    // Пункты меню для боковой панели
    const menuItems = [
        { text: 'Панель управления', icon: (0, jsx_runtime_1.jsx)(icons_material_1.Dashboard, {}), path: '/' },
        { text: 'Печать документа', icon: (0, jsx_runtime_1.jsx)(icons_material_1.Print, {}), path: '/print' },
        { text: 'Настройки принтеров', icon: (0, jsx_runtime_1.jsx)(icons_material_1.Settings, {}), path: '/printers' },
    ];
    return ((0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: 'flex', height: '100vh' }, children: [(0, jsx_runtime_1.jsx)(material_1.AppBar, { position: "fixed", sx: { zIndex: (theme) => theme.zIndex.drawer + 1 }, children: (0, jsx_runtime_1.jsxs)(material_1.Toolbar, { children: [(0, jsx_runtime_1.jsx)(material_1.IconButton, { color: "inherit", "aria-label": "open drawer", edge: "start", onClick: toggleDrawer, sx: { mr: 2 }, children: (0, jsx_runtime_1.jsx)(icons_material_1.Menu, {}) }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", noWrap: true, component: "div", children: getPageTitle() })] }) }), (0, jsx_runtime_1.jsxs)(material_1.Drawer, { variant: "temporary", open: drawerOpen, onClose: toggleDrawer, sx: {
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                    },
                }, children: [(0, jsx_runtime_1.jsx)(material_1.Toolbar, {}), " ", (0, jsx_runtime_1.jsx)(material_1.Divider, {}), (0, jsx_runtime_1.jsx)(material_1.List, { children: menuItems.map((item) => ((0, jsx_runtime_1.jsxs)(material_1.ListItem, { button: true, onClick: () => handleNavigation(item.path), selected: location.pathname === item.path, children: [(0, jsx_runtime_1.jsx)(material_1.ListItemIcon, { children: item.icon }), (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: item.text })] }, item.text))) })] }), (0, jsx_runtime_1.jsxs)(material_1.Box, { component: "main", sx: {
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    height: '100%',
                    overflow: 'auto'
                }, children: [(0, jsx_runtime_1.jsx)(material_1.Toolbar, {}), " ", children] })] }));
};
exports.default = Layout;
//# sourceMappingURL=Layout.js.map