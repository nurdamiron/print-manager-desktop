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

try {
    root.render(
      <React.StrictMode>
        <HashRouter>
          <App />
        </HashRouter>
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Ошибка при рендеринге:', error);
    // Отобразите ошибку на экране
    document.body.innerHTML = `<div style="color: red; padding: 20px;">
      <h2>Произошла ошибка:</h2>
      <pre>${error?.toString()}</pre>
    </div>`;
  }
  
// Рендерим приложение
root.render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);