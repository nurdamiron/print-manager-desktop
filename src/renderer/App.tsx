import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

// Импорт основных компонентов приложения
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PrinterSettings from './pages/PrinterSettings';
import NewPrinter from './pages/NewPrinter';
import PrintPage from './pages/PrintPage';

/**
 * Создаем тему оформления для Material UI
 * Тема определяет основные цвета, отступы и другие визуальные аспекты приложения
 * 
 * Обновлено: Более современная цветовая схема и улучшенные визуальные элементы
 */
const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea', // Современный градиентный синий
      light: '#8b9aed',
      dark: '#4c63d2',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#764ba2', // Элегантный фиолетовый
      light: '#9575cd',
      dark: '#512da8',
      contrastText: '#ffffff',
    },
    success: {
      main: '#00d4aa', // Мятный зеленый
      light: '#4ade80',
      dark: '#059669',
    },
    error: {
      main: '#ff6b6b', // Мягкий красный
      light: '#fca5a5',
      dark: '#dc2626',
    },
    warning: {
      main: '#f093fb', // Розовый градиент
      light: '#fbbf24',
      dark: '#d97706',
    },
    background: {
      default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Градиентный фон
      paper: '#ffffff',
    },
    text: {
      primary: '#1a202c',
      secondary: '#718096',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      letterSpacing: '-0.03em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.3,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.3,
      letterSpacing: '-0.02em',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.875rem',
    },
  },
  shape: {
    borderRadius: 16, // Более закругленные углы для современного вида
  },
  // Исправляем ошибку с массивом теней
  // Material UI ожидает массив из 25 элементов, заполняем все значения
  shadows: [
    'none',
    '0px 2px 4px rgba(0, 0, 0, 0.05)', // 1
    '0px 3px 6px rgba(0, 0, 0, 0.08)', // 2
    '0px 4px 8px rgba(0, 0, 0, 0.1)',  // 3
    '0px 6px 10px rgba(0, 0, 0, 0.12)', // 4
    '0px 8px 12px rgba(0, 0, 0, 0.14)', // 5
    '0px 9px 14px rgba(0, 0, 0, 0.16)', // 6
    '0px 10px 16px rgba(0, 0, 0, 0.18)', // 7
    '0px 11px 18px rgba(0, 0, 0, 0.2)', // 8
    '0px 12px 20px rgba(0, 0, 0, 0.22)', // 9
    '0px 13px 22px rgba(0, 0, 0, 0.24)', // 10
    '0px 14px 24px rgba(0, 0, 0, 0.26)', // 11
    '0px 15px 26px rgba(0, 0, 0, 0.28)', // 12
    '0px 16px 28px rgba(0, 0, 0, 0.3)', // 13
    '0px 17px 30px rgba(0, 0, 0, 0.32)', // 14
    '0px 18px 32px rgba(0, 0, 0, 0.34)', // 15
    '0px 19px 34px rgba(0, 0, 0, 0.36)', // 16
    '0px 20px 36px rgba(0, 0, 0, 0.38)', // 17
    '0px 21px 38px rgba(0, 0, 0, 0.4)', // 18
    '0px 22px 40px rgba(0, 0, 0, 0.42)', // 19
    '0px 23px 42px rgba(0, 0, 0, 0.44)', // 20
    '0px 24px 44px rgba(0, 0, 0, 0.46)', // 21
    '0px 25px 46px rgba(0, 0, 0, 0.48)', // 22
    '0px 26px 48px rgba(0, 0, 0, 0.5)', // 23
    '0px 27px 50px rgba(0, 0, 0, 0.52)', // 24
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 24px',
          fontSize: '0.875rem',
          fontWeight: 600,
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
        },
        contained: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0px 4px 15px rgba(102, 126, 234, 0.4)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
            boxShadow: '0px 6px 20px rgba(102, 126, 234, 0.6)',
            transform: 'translateY(-2px)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
            background: 'rgba(102, 126, 234, 0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(20px)',
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0px 20px 40px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(20px)',
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        rounded: {
          borderRadius: 20,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 1)',
            },
            '&.Mui-focused': {
              backgroundColor: 'rgba(255, 255, 255, 1)',
              boxShadow: '0px 0px 0px 3px rgba(102, 126, 234, 0.1)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontWeight: 500,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

/**
 * Главный компонент приложения App
 * Отвечает за основные настройки темы и маршрутизацию
 */
const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline нормализует стили CSS */}
      <CssBaseline />
      
      {/* Определяем базовую структуру приложения через шаблон Layout */}
      <Layout>
        {/* Настраиваем маршрутизацию между разными страницами приложения */}
        <Routes>
          {/* Главная страница - дашборд с общей информацией */}
          <Route path="/" element={<Dashboard />} />
          
          {/* Страница настроек принтеров */}
          <Route path="/printers" element={<PrinterSettings />} />
          
          {/* Страница добавления нового принтера */}
          <Route path="/printers/new" element={<NewPrinter />} />
          
          {/* Страница печати документов */}
          <Route path="/print" element={<PrintPage />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
};

export default App;