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
 */
const theme = createTheme({
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