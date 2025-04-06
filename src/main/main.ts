import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as net from 'net';
import Store from 'electron-store';

// Создание хранилища настроек
const store = new Store();

// Определяем переменную для хранения главного окна
let mainWindow: BrowserWindow | null = null;

/**
 * Создает главное окно приложения
 * Функция инициализирует и настраивает главное окно Electron
 */
function createWindow() {
  // Создаем новый экземпляр окна браузера
  mainWindow = new BrowserWindow({
    width: 1024, // Ширина окна
    height: 768, // Высота окна
    webPreferences: {
      nodeIntegration: false, // Отключаем nodeIntegration по соображениям безопасности
      contextIsolation: true, // Включаем изоляцию контекста для безопасности
      preload: path.join(__dirname, 'preload.js') // Загружаем скрипт preload
    }
  });

  // Загружаем HTML-файл в окно
  // В режиме разработки можно использовать URL локального сервера
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Открываем инструменты разработчика в режиме разработки
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Обработка закрытия окна
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Инициализируем приложение после запуска Electron
 */
app.on('ready', () => {
  createWindow();
});

/**
 * Завершаем работу приложения на всех платформах, кроме macOS
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Восстанавливаем окно на macOS при клике на иконку в доке
 */
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

/**
 * Обработчик IPC для проверки соединения с принтером
 * Пытается установить TCP-соединение с принтером по указанному IP и порту
 */
ipcMain.handle('check-printer-connection', async (_, printerIP: string, printerPort: number) => {
  return new Promise((resolve) => {
    // Создаем TCP-соединение с принтером
    const socket = net.createConnection({
      host: printerIP,
      port: printerPort,
      timeout: 3000 // Таймаут в миллисекундах
    });

    // Если соединение успешно установлено
    socket.on('connect', () => {
      socket.end();
      resolve({ status: 'online', message: 'Соединение успешно установлено' });
    });

    // Если произошла ошибка соединения
    socket.on('error', (err) => {
      resolve({ status: 'offline', message: `Ошибка соединения: ${err.message}` });
    });

    // Если истек таймаут соединения
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ status: 'offline', message: 'Таймаут соединения' });
    });
  });
});

/**
 * Обработчик IPC для отправки файла на принтер
 * Отправляет содержимое файла на принтер через RAW-порт (обычно 9100)
 */
ipcMain.handle('send-to-printer', async (_, filePath: string, printerIP: string, printerPort: number) => {
  return new Promise((resolve, reject) => {
    try {
      // Проверяем существование файла
      if (!fs.existsSync(filePath)) {
        reject(new Error(`Файл не найден: ${filePath}`));
        return;
      }

      // Открываем файл для чтения
      const fileStream = fs.createReadStream(filePath);
      
      // Создаем TCP-соединение с принтером
      const socket = net.createConnection({
        host: printerIP,
        port: printerPort,
        timeout: 10000 // Увеличенный таймаут для больших файлов
      });

      // Обработка ошибок соединения
      socket.on('error', (err) => {
        reject(new Error(`Ошибка соединения с принтером: ${err.message}`));
      });

      // Обработка таймаута
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Таймаут соединения с принтером'));
      });

      // Когда соединение установлено, отправляем содержимое файла
      socket.on('connect', () => {
        // Направляем поток файла в соединение с принтером
        fileStream.pipe(socket);
        
        // Обработка завершения передачи
        fileStream.on('end', () => {
          socket.end(); // Закрываем соединение после отправки
          resolve({ success: true, message: 'Файл успешно отправлен на принтер' });
        });

        // Обработка ошибок чтения файла
        fileStream.on('error', (err) => {
          socket.destroy();
          reject(new Error(`Ошибка чтения файла: ${err.message}`));
        });
      });
    } catch (err: any) {
      reject(new Error(`Ошибка отправки файла: ${err.message}`));
    }
  });
});

/**
 * Обработчик IPC для выбора файла для печати
 * Открывает диалог выбора файла и возвращает путь к выбранному файлу
 */
ipcMain.handle('select-file', async () => {
  if (!mainWindow) {
    throw new Error('Главное окно не инициализировано');
  }

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Документы', extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'] },
      { name: 'Изображения', extensions: ['png', 'jpg', 'jpeg'] },
      { name: 'Все файлы', extensions: ['*'] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

/**
 * Обработчик IPC для сохранения настроек принтера
 * Сохраняет информацию о принтере в локальное хранилище
 */
ipcMain.handle('save-printer', async (_, printer: any) => {
  const printers = store.get('printers', []) as any[];
  
  // Проверяем, существует ли уже принтер с таким ID
  const existingPrinterIndex = printers.findIndex(p => p.id === printer.id);
  
  if (existingPrinterIndex >= 0) {
    // Обновляем существующий принтер
    printers[existingPrinterIndex] = printer;
  } else {
    // Добавляем новый принтер
    printers.push(printer);
  }
  
  // Сохраняем обновленный список принтеров
  store.set('printers', printers);
  
  return { success: true };
});

/**
 * Обработчик IPC для загрузки списка сохраненных принтеров
 * Возвращает список принтеров из локального хранилища
 */
ipcMain.handle('get-printers', async () => {
  return store.get('printers', []);
});

/**
 * Обработчик IPC для удаления принтера
 * Удаляет информацию о принтере из локального хранилища
 */
ipcMain.handle('delete-printer', async (_, printerId: string) => {
  const printers = store.get('printers', []) as any[];
  const updatedPrinters = printers.filter(p => p.id !== printerId);
  
  store.set('printers', updatedPrinters);
  
  return { success: true };
});