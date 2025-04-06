
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Print as PrintIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

/**
 * Тип props для компонента Layout
 */
interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Компонент Layout - основной шаблон приложения
 * Включает боковую панель навигации и верхнюю панель
 * @param children Дочерние компоненты, которые будут отображены в области контента
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Используем хуки для навигации и получения текущего пути
  const navigate = useNavigate();
  const location = useLocation();
  
  // Состояние для управления открытием/закрытием боковой панели
  const [drawerOpen, setDrawerOpen] = useState(false);
  
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
  const handleNavigation = (path: string) => {
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
    { text: 'Панель управления', icon: <DashboardIcon />, path: '/' },
    { text: 'Печать документа', icon: <PrintIcon />, path: '/print' },
    { text: 'Настройки принтеров', icon: <SettingsIcon />, path: '/printers' },
  ];

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Верхняя панель приложения */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          {/* Кнопка открытия/закрытия боковой панели */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Заголовок текущей страницы */}
          <Typography variant="h6" noWrap component="div">
            {getPageTitle()}
          </Typography>
        </Toolbar>
      </AppBar>
      
      {/* Боковая панель навигации */}
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={toggleDrawer}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar /> {/* Отступ для выравнивания с AppBar */}
        <Divider />
        
        {/* Список пунктов меню */}
        <List>
          {menuItems.map((item) => (
            <ListItem 
              button 
              key={item.text}
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Drawer>
      
      {/* Основное содержимое */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          height: '100%',
          overflow: 'auto'
        }}
      >
        <Toolbar /> {/* Отступ для выравнивания с AppBar */}
        {children}
      </Box>
    </Box>
  );
};

export default Layout;