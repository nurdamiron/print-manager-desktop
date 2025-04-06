import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as net from 'net';
import Store from 'electron-store';
import * as usb from 'usb';

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


// Добавьте обработчик для получения USB-принтеров
ipcMain.handle('get-usb-printers', async () => {
    try {
      const devices = usb.getDeviceList();
      // Фильтруем только принтеры (обычно класс 7)
      return devices
        .filter(device => 
          device.deviceDescriptor.bDeviceClass === 7 || 
          // Часто принтеры определяются по интерфейсам
          device.configDescriptor?.interfaces.some(iface => 
            iface.some(setting => setting.bInterfaceClass === 7)
          )
        )
        .map(device => ({
          id: `${device.deviceDescriptor.idVendor}:${device.deviceDescriptor.idProduct}`,
          name: `USB Printer (${device.deviceDescriptor.idVendor.toString(16)}:${device.deviceDescriptor.idProduct.toString(16)})`,
          isUsb: true
        }));
    } catch (error) {
      console.error('Error getting USB printers:', error);
      return [];
    }
  });
  
  // Обработчик для печати на USB-принтер
  ipcMain.handle('print-to-usb', async (_, { printerId, filePath, copies = 1 }) => {
    try {
      const [vendorId, productId] = printerId.split(':').map(id => parseInt(id, 16));
      const device = usb.findByIds(vendorId, productId);
      
      if (!device) {
        throw new Error('USB printer not found');
      }
      
      // Чтение файла
      const fileData = fs.readFileSync(filePath);
      
      // Повторяем для количества копий
      for (let i = 0; i < copies; i++) {
        await sendDataToUsbPrinter(device, fileData);
      }
      
      return { success: true, message: 'Документ успешно отправлен на печать' };
    } catch (error) {
      console.error('Error printing to USB:', error);
      return { success: false, message: `Ошибка печати: ${error.message}` };
    }
  });
  
  // Функция отправки данных на USB-принтер
  async function sendDataToUsbPrinter(device, data) {
    return new Promise((resolve, reject) => {
      try {
        device.open();
        
        // Находим нужный интерфейс
        const iface = device.interfaces.find(iface => 
          iface.descriptor.bInterfaceClass === 7
        ) || device.interfaces[0];
        
        iface.claim();
        
        // Находим OUT endpoint для отправки данных
        const outEndpoint = iface.endpoints.find(ep => 
          (ep.descriptor.bEndpointAddress & usb.LIBUSB_ENDPOINT_OUT) !== 0
        );
        
        if (!outEndpoint) {
          iface.release(() => device.close());
          reject(new Error('Printer output endpoint not found'));
          return;
        }
        
        // Отправляем данные
        outEndpoint.transfer(data, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve(true);
          }
          
          // Освобождаем интерфейс и закрываем устройство
          iface.release(() => device.close());
        });
      } catch (error) {
        try { device.close(); } catch (e) { /* Игнорируем ошибки при закрытии */ }
        reject(error);
      }
    });
  }

  
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