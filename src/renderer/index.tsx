import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';

// Получаем корневой элемент DOM
const rootElement = document.getElementById('root');

// Проверяем, существует ли элемент
if (!rootElement) {
  throw new Error('Корневой элемент #root не найден в DOM');
}

// Создаем корень React
const root = ReactDOM.createRoot(rootElement);

// Рендерим приложение
root.render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);