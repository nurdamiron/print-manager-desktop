import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import Store from 'electron-store';
import * as usb from 'usb';
import jobProcessor from '../services/jobProcessor';
import api from '../services/api';
import printerService from '../services/printer';

/**
 * Хранилище настроек приложения
 * Используется для сохранения информации о принтерах и предпочтениях пользователя
 */
const store = new Store();

/**
 * Переменная для хранения главного окна приложения
 */
let mainWindow: BrowserWindow | null = null;

// Делаем mainWindow доступным глобально для других модулей
global.mainWindow = mainWindow;

/**
 * Интерфейс для USB-устройства
 * Определяет структуру USB-устройства для работы с библиотекой usb
 */
interface UsbDevice {
  open: () => void;
  close: () => void;
  interfaces: UsbInterface[] | {
    find: (predicate: (iface: UsbInterface) => boolean) => UsbInterface | undefined;
    [index: number]: UsbInterface;
  };
}

/**
 * Интерфейс для интерфейса USB-устройства
 * Определяет методы и свойства интерфейса USB-устройства
 */
export interface UsbInterface {
  descriptor: {
    bInterfaceClass: number;
  };
  claim: () => void;
  release: (callback: () => void) => void;
  endpoints: UsbEndpoint[];
}

/**
 * Интерфейс для конечной точки USB-устройства
 * Определяет методы и свойства для работы с конечными точками USB-устройств
 */
export interface UsbEndpoint {
  descriptor: {
    bEndpointAddress: number;
  };
  transfer: (data: Buffer, callback: (error?: Error) => void) => void;
}

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
    },
    // Улучшенные визуальные настройки
    show: false, // Не показываем окно до полной загрузки
    titleBarStyle: 'hiddenInset', // Более современный стиль заголовка (для macOS)
    backgroundColor: '#f8f9fa', // Фоновый цвет окна
  });

  // Загружаем HTML-файл в окно
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Показываем окно, когда оно полностью загружено
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    // Обновляем глобальную ссылку
    global.mainWindow = mainWindow;
  });

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
  
  // Инициализируем IPC handlers для job processor
  jobProcessor.setupIpcHandlers();
  
  // Запускаем обработку заданий после аутентификации
  api.checkAuth().then((authenticated) => {
    if (authenticated) {
      jobProcessor.start();
    }
  });
});

/**
 * Завершаем работу приложения на всех платформах, кроме macOS
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    jobProcessor.stop();
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
 * Обработчик для получения USB-принтеров
 * Сканирует подключенные USB-устройства и возвращает список принтеров
 */
ipcMain.handle('get-usb-printers', async () => {
  try {
    // Получаем список всех подключенных USB-устройств
    const devices = usb.getDeviceList();
    
    // Фильтруем только принтеры (обычно класс 7)
    return devices
      .filter(device => 
        device.deviceDescriptor.bDeviceClass === 7 || 
        device.configDescriptor?.interfaces.some(iface => 
          iface.some(setting => setting.bInterfaceClass === 7)
        )
      )
      .map(device => ({
        id: `${device.deviceDescriptor.idVendor}:${device.deviceDescriptor.idProduct}`,
        name: `USB Printer (${device.deviceDescriptor.idVendor.toString(16)}:${device.deviceDescriptor.idProduct.toString(16)})`,
        vendorId: device.deviceDescriptor.idVendor.toString(16),
        productId: device.deviceDescriptor.idProduct.toString(16),
        isUsb: true,
        isConnected: true
      }));
  } catch (error) {
    console.error('Ошибка при получении USB-принтеров:', error);
    return [];
  }
});

/**
 * Обработчик для печати на USB-принтер
 * Отправляет файл на выбранный USB-принтер с указанным количеством копий
 */
ipcMain.handle('print-to-usb', async (_, { printerId, filePath, copies = 1 }) => {
  try {
    // Парсим ID принтера для получения vendorId и productId
    const [vendorId, productId] = printerId.split(':').map((id: string) => parseInt(id, 16));
    
    // Находим устройство по vendorId и productId
    const device = usb.findByIds(vendorId, productId);
    
    if (!device) {
      throw new Error('USB принтер не найден. Проверьте подключение устройства.');
    }
    
    // Читаем содержимое файла
    const fileData = fs.readFileSync(filePath);
    
    // Печатаем указанное количество копий
    for (let i = 0; i < copies; i++) {
      await sendDataToUsbPrinter(device as unknown as UsbDevice, fileData);
    }
    
    return { success: true, message: 'Документ успешно отправлен на печать' };
  } catch (error: unknown) {
    console.error('Ошибка при печати на USB-принтер:', error);
    return { 
      success: false, 
      message: `Ошибка печати: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}` 
    };
  }
});

/**
 * Функция отправки данных на USB-принтер
 * Устанавливает соединение с USB-принтером и отправляет данные на печать
 * 
 * @param device USB-устройство
 * @param data Данные для печати
 * @returns Promise, который разрешается после завершения печати
 */
async function sendDataToUsbPrinter(device: UsbDevice, data: Buffer): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      // Открываем устройство
      device.open();
      
      // Проверяем наличие интерфейсов
      if (!device.interfaces) {
        reject(new Error('Интерфейсы не найдены на устройстве'));
        return;
      }
      
      // Находим интерфейс принтера (класс 7 - принтеры)
      let iface: UsbInterface;
      
      if (Array.isArray(device.interfaces)) {
        // Если интерфейсы представлены массивом
        iface = device.interfaces.find((i: UsbInterface) => 
          i.descriptor.bInterfaceClass === 7
        ) || device.interfaces[0];
      } else {
        // Если интерфейсы представлены объектом с методом find
        iface = device.interfaces.find((i: UsbInterface) => 
          i.descriptor.bInterfaceClass === 7
        ) || device.interfaces[0];
      }
      
      if (!iface) {
        reject(new Error('Интерфейс принтера не найден'));
        return;
      }
      
      // Захватываем интерфейс для взаимодействия
      iface.claim();
      
      // Находим OUT endpoint для отправки данных (бит 7 сброшен для OUT endpoint)
      const outEndpoint = iface.endpoints.find((ep: UsbEndpoint) => 
        (ep.descriptor.bEndpointAddress & 0x80) === 0
      );
      
      if (!outEndpoint) {
        iface.release(() => device.close());
        reject(new Error('Endpoint вывода принтера не найден'));
        return;
      }
      
      // Отправляем данные на принтер
      outEndpoint.transfer(data, (error?: Error) => {
        if (error) {
          reject(error);
        } else {
          resolve(true);
        }
        
        // Освобождаем интерфейс и закрываем устройство
        iface.release(() => device.close());
      });
    } catch (error: unknown) {
      try { device.close(); } catch (e) { /* Игнорируем ошибки при закрытии */ }
      reject(error);
    }
  });
}

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

// Новые IPC handlers для работы с API
ipcMain.handle('api-login', async (_, email: string, password: string) => {
  try {
    const result = await api.agentLogin(email, password);
    jobProcessor.start(); // Запускаем обработку заданий после успешного входа
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
});

ipcMain.handle('api-logout', async () => {
  jobProcessor.stop();
  api.logout();
  return { success: true };
});

ipcMain.handle('api-check-auth', async () => {
  return api.checkAuth();
});

ipcMain.handle('get-local-printers', async () => {
  try {
    const printers = await printerService.getPrinters();
    return printers;
  } catch (error) {
    console.error('Failed to get local printers:', error);
    return [];
  }
});

ipcMain.handle('sync-printer-with-backend', async (_, localPrinter) => {
  try {
    const printer = await api.createPrinter({
      name: localPrinter.name,
      model: localPrinter.driver || 'Generic',
      location: 'Local Desktop',
      capabilities: {
        color: true,
        duplex: false,
        paper_sizes: ['A4', 'Letter'],
        max_resolution: '600x600',
      },
      price_per_page: 10,
      price_color: 20,
      status: 'ready',
    });
    return { success: true, printer };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
});

ipcMain.handle('update-printer-status', async (_, printerId: number, status: string) => {
  try {
    await api.updatePrinterStatus(printerId, status);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
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