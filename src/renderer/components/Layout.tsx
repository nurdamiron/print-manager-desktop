
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
    <Box sx={{ 
      display: 'flex', 
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
    }}>
      {/* Верхняя панель приложения */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0px 4px 30px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Toolbar>
          {/* Кнопка открытия/закрытия боковой панели */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleDrawer}
            sx={{ 
              mr: 2,
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.2)',
              }
            }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Заголовок текущей страницы */}
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 600,
              color: 'white',
              textShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
            }}
          >
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
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(255, 255, 255, 0.2)',
          },
        }}
      >
        <Toolbar sx={{ 
          background: 'rgba(102, 126, 234, 0.1)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        }} />
        
        <Box sx={{ p: 2 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
            }}
          >
            Print Manager
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Управление принтерами
          </Typography>
        </Box>
        
        <Divider sx={{ mx: 2, borderColor: 'rgba(102, 126, 234, 0.1)' }} />
        
        {/* Список пунктов меню */}
        <List sx={{ px: 1, pt: 2 }}>
          {menuItems.map((item) => (
            <ListItem 
              key={item.text}
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 2,
                mb: 1,
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                background: location.pathname === item.path 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'transparent',
                color: location.pathname === item.path ? 'white' : 'inherit',
                '&:hover': {
                  background: location.pathname === item.path 
                    ? 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
                    : 'rgba(102, 126, 234, 0.08)',
                  transform: 'translateX(4px)',
                },
              }}
            >
              <ListItemIcon sx={{ 
                color: location.pathname === item.path ? 'white' : 'primary.main',
                minWidth: 40,
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? 600 : 500,
                  fontSize: '0.875rem',
                }}
              />
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
          overflow: 'auto',
          background: 'transparent',
        }}
      >
        <Toolbar /> {/* Отступ для выравнивания с AppBar */}
        <Box sx={{ 
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: 4,
          minHeight: 'calc(100vh - 120px)',
          p: 4,
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;