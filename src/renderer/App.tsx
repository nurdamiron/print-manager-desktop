import React from 'react';
import { Routes, Route } from 'react-router-dom';
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
      main: '#4361ee', // Более яркий и современный синий цвет
      light: '#738eef',
      dark: '#2f42a9',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#3a0ca3', // Фиолетовый для акцентов
      light: '#5b30c9',
      dark: '#2a077a',
      contrastText: '#ffffff',
    },
    success: {
      main: '#4cc9f0', // Яркий голубой для успешных действий
      light: '#7ad7f3',
      dark: '#339ec0',
    },
    error: {
      main: '#f72585', // Яркий розовый для ошибок и предупреждений
      light: '#f957a1',
      dark: '#c71b6b',
    },
    background: {
      default: '#f8f9fa', // Светлый фон для основного содержимого
      paper: '#ffffff',   // Белый фон для карточек и панелей
    },
    text: {
      primary: '#212529', // Тёмно-серый для основного текста
      secondary: '#6c757d', // Серый для второстепенного текста
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
    h4: {
      fontWeight: 600, // Полужирный для заголовков
      letterSpacing: '-0.02em', // Уменьшенный межбуквенный интервал
    },
    h6: {
      fontWeight: 500, // Слегка утолщенный для подзаголовков
    },
    button: {
      textTransform: 'none', // Отключаем преобразование текста кнопок в заглавные
      fontWeight: 500, // Утолщенный шрифт для кнопок
    },
  },
  shape: {
    borderRadius: 8, // Более закругленные углы для элементов
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
          padding: '8px 16px', // Увеличенные отступы для кнопок
          boxShadow: 'none', // Убираем тень для обычных кнопок
        },
        contained: {
          boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.1)', // Мягкая тень для contained кнопок
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)', // Тень при наведении
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 3px 8px rgba(0, 0, 0, 0.08)', // Мягкая тень для карточек
          borderRadius: 12, // Более закругленные углы для карточек
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12, // Согласованность углов с карточками
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
        </Routes>
      </Layout>
    </ThemeProvider>
  );
};

export default App;