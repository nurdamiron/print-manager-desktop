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
  
  // Запускаем обработку заданий без аутентификации
  jobProcessor.start();
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
/**
 * Определяет бренд принтера по vendor ID
 */
function getPrinterBrandByVendorId(vendorId: number): string {
  const vendorMapping: Record<number, string> = {
    0x04b8: 'Epson',
    0x03f0: 'HP',
    0x04a9: 'Canon',
    0x04e8: 'Samsung',
    0x0924: 'Xerox',
    0x0482: 'Kyocera',
    0x067b: 'Prolific/Generic',
    0x1a86: 'QinHeng/Generic',
    0x0a5c: 'Broadcom',
    0x0409: 'NEC',
    0x054c: 'Sony',
    0x0b05: 'ASUS',
    0x1317: 'ADMtek',
    0x0471: 'Philips',
    0x0483: 'STMicroelectronics'
  };
  
  return vendorMapping[vendorId] || 'Unknown';
}

ipcMain.handle('get-usb-printers', async () => {
  try {
    // Получаем список всех подключенных USB-устройств
    const devices = usb.getDeviceList();
    
    console.log('All USB devices found:', devices.length);
    
    // Фильтруем принтеры по нескольким критериям
    const printers = devices.filter(device => {
      // Проверяем класс устройства (7 = принтер)
      if (device.deviceDescriptor.bDeviceClass === 7) {
        return true;
      }
      
      // Проверяем интерфейсы для принтеров
      if (device.configDescriptor?.interfaces) {
        const hasPrinterInterface = device.configDescriptor.interfaces.some(iface => 
          iface.some(setting => setting.bInterfaceClass === 7)
        );
        if (hasPrinterInterface) {
          return true;
        }
      }
      
      // Проверяем известные производители принтеров с расширенным списком
      const knownPrinterVendors = [
        0x04b8, // Epson
        0x03f0, // HP
        0x04a9, // Canon
        0x04e8, // Samsung
        0x0924, // Xerox
        0x0482, // Kyocera
        0x067b, // Prolific (часто используется в принтерах)
        0x1a86, // QinHeng (CH340/CH341 чипы)
        0x0a5c, // Broadcom (некоторые принтеры)
        0x0409, // NEC
        0x054c, // Sony (принтеры)
        0x0b05, // ASUSTek
        0x1317, // ADMtek
        0x0471, // Philips
        0x0483, // STMicroelectronics
        0x1d6b, // Linux Foundation (виртуальные USB хабы)
        0x0b97, // O2 Micro (USB-to-parallel адаптеры)
        0x1a40, // TERMINUS TECHNOLOGY (USB хабы для принтеров)
      ];
      
      return knownPrinterVendors.includes(device.deviceDescriptor.idVendor);
    });
    
    console.log('Filtered printers found:', printers.length);
    
    return printers
      .map(device => {
        const vendorIdHex = device.deviceDescriptor.idVendor.toString(16).padStart(4, '0');
        const productIdHex = device.deviceDescriptor.idProduct.toString(16).padStart(4, '0');
        const brand = getPrinterBrandByVendorId(device.deviceDescriptor.idVendor);
        
        return {
          id: `${vendorIdHex}:${productIdHex}`,
          name: `${brand} USB Printer (${vendorIdHex}:${productIdHex})`,
          vendorId: vendorIdHex,
          productId: productIdHex,
          brand: brand,
          isUsb: true,
          isConnected: true
        };
      });
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
  console.log('Printing to USB printer:', { printerId, filePath, copies });
  
  // Парсим ID принтера для получения vendorId и productId
  const [vendorIdHex, productIdHex] = printerId.split(':');
  const vendorId = parseInt(vendorIdHex, 16);
  const productId = parseInt(productIdHex, 16);
  
  console.log('Parsed IDs:', { vendorId, productId, vendorIdHex, productIdHex });
  
  try {
    
    // Получаем список всех устройств для отладки
    const allDevices = usb.getDeviceList();
    console.log('All USB devices:', allDevices.map(d => ({
      vendor: d.deviceDescriptor.idVendor,
      product: d.deviceDescriptor.idProduct,
      vendorHex: d.deviceDescriptor.idVendor.toString(16).padStart(4, '0'),
      productHex: d.deviceDescriptor.idProduct.toString(16).padStart(4, '0'),
      class: d.deviceDescriptor.bDeviceClass
    })));
    
    // Находим устройство по vendorId и productId
    const device = usb.findByIds(vendorId, productId);
    
    if (!device) {
      throw new Error(`USB принтер не найден (${vendorIdHex}:${productIdHex}). Проверьте подключение устройства.`);
    }
    
    console.log('Found USB device:', device.deviceDescriptor);
    
    // Читаем содержимое файла
    const fileData = fs.readFileSync(filePath);
    
    // Печатаем указанное количество копий
    for (let i = 0; i < copies; i++) {
      await sendDataToUsbPrinter(device as unknown as UsbDevice, fileData);
    }
    
    return { success: true, message: 'Документ успешно отправлен на печать' };
  } catch (error: unknown) {
    console.error('Ошибка при печати на USB-принтер:', error);
    
    // Попробуем альтернативный метод через системные принтеры
    try {
      console.log('Trying fallback to system printer...');
      const systemPrinters = await printerService.getPrinters();
      console.log('Found system printers:', systemPrinters.map(p => ({ name: p.name, driver: p.driver })));
      
      // Enhanced printer mapping with model-specific matching
      const printerBrandMapping: Record<string, { brand: string; keywords: string[]; models?: Record<string, string[]> }> = {
        '03f0': { brand: 'HP', keywords: ['hp', 'laserjet', 'deskjet', 'officejet', 'envy', 'photosmart'] },
        '04b8': { 
          brand: 'Epson', 
          keywords: ['epson', 'expression', 'workforce', 'stylus'],
          models: {
            // Map product IDs to model names for better matching
            '0001': ['l3100', 'l-3100', 'l 3100'],
            '0002': ['l3110', 'l-3110', 'l 3110'],
            '0003': ['l3150', 'l-3150', 'l 3150'],
            '0004': ['l6190', 'l-6190', 'l 6190'],
            '0005': ['l6170', 'l-6170', 'l 6170'],
            // Add more as needed
          }
        },
        '04a9': { brand: 'Canon', keywords: ['canon', 'pixma', 'imageclass', 'selphy'] },
        '04e8': { brand: 'Samsung', keywords: ['samsung', 'scx', 'clx', 'ml'] },
        '0924': { brand: 'Xerox', keywords: ['xerox', 'phaser', 'workcentre'] },
        '0482': { brand: 'Kyocera', keywords: ['kyocera', 'ecosys', 'taskalfa'] },
        '067b': { brand: 'Prolific', keywords: ['prolific', 'generic', 'usb'] },
        '1a86': { brand: 'QinHeng', keywords: ['qinheng', 'ch340', 'ch341', 'generic'] },
        '0a5c': { brand: 'Broadcom', keywords: ['broadcom'] },
        '0409': { brand: 'NEC', keywords: ['nec'] },
        '054c': { brand: 'Sony', keywords: ['sony'] },
        '0b05': { brand: 'ASUS', keywords: ['asus'] },
        '1317': { brand: 'ADMtek', keywords: ['admtek'] },
        '0471': { brand: 'Philips', keywords: ['philips'] },
        '0483': { brand: 'STMicroelectronics', keywords: ['stmicroelectronics', 'stm'] }
      };
      
      const brandInfo = printerBrandMapping[vendorIdHex.toLowerCase()];
      console.log(`Looking for ${brandInfo ? brandInfo.brand : 'Unknown'} printer (vendor: ${vendorIdHex}, product: ${productIdHex})`);
      
      let systemPrinter = null;
      
      // Get detailed printer info for all system printers
      const printersWithDetails = systemPrinters.map(p => {
        const details = printerService.detectPrinterBrandAndModel(p.name, p.driver, vendorIdHex, productIdHex);
        return { ...p, details };
      });
      
      // 1. First try to match by exact product ID in printer name
      if (!systemPrinter) {
        const exactMatch = printersWithDetails.find(p => {
          const pNameLower = p.name.toLowerCase();
          return pNameLower.includes(vendorIdHex.toLowerCase()) ||
                 pNameLower.includes(productIdHex.toLowerCase()) ||
                 (pNameLower.includes('usb') && pNameLower.includes(productIdHex));
        });
        if (exactMatch) {
          systemPrinter = systemPrinters.find(p => p.name === exactMatch.name);
          console.log('Found printer by vendor/product ID match:', systemPrinter?.name);
        }
      }
      
      // 2. Try to match by specific model if we have model mapping
      if (!systemPrinter && brandInfo && brandInfo.models) {
        const modelKeywords = brandInfo.models[productIdHex.toLowerCase()];
        if (modelKeywords) {
          systemPrinter = systemPrinters.find(p => {
            const pNameLower = p.name.toLowerCase();
            const pDriverLower = p.driver.toLowerCase();
            return modelKeywords.some((model: string) => 
              pNameLower.includes(model) || pDriverLower.includes(model)
            ) && !pNameLower.includes('fax');
          });
          if (systemPrinter) {
            console.log(`Found ${brandInfo.brand} printer by model match:`, systemPrinter.name);
          }
        }
      }
      
      // 3. Fallback to brand matching with model detection
      if (!systemPrinter && brandInfo) {
        // Filter printers by brand
        const brandPrinters = printersWithDetails.filter(p => {
          return p.details.brand.toLowerCase() === brandInfo.brand.toLowerCase() &&
                 !p.name.toLowerCase().includes('fax');
        });
        
        console.log(`Found ${brandPrinters.length} ${brandInfo.brand} printers:`, 
          brandPrinters.map(p => ({ name: p.name, model: p.details.model })));
        
        // If we have multiple brand matches, try to find the best match
        if (brandPrinters.length > 1) {
          // First, try to find one with matching product ID in the model
          systemPrinter = brandPrinters.find(p => 
            p.details.model.toLowerCase().includes(productIdHex.toLowerCase())
          );
          
          // If no product ID match, look for model number patterns
          if (!systemPrinter) {
            // For EPSON, try to match L3100 vs L6190 style model numbers
            if (brandInfo.brand === 'Epson') {
              // Extract numeric parts from models and try to find closest match
              const targetModel = brandPrinters.find(p => {
                const modelMatch = p.name.match(/l[\s-]?(\d{4})/i);
                if (modelMatch) {
                  // Prefer lower model numbers (L3100 over L6190)
                  return true;
                }
                return false;
              });
              systemPrinter = targetModel || brandPrinters[0];
            } else {
              systemPrinter = brandPrinters[0];
            }
          }
        } else if (brandPrinters.length === 1) {
          systemPrinter = brandPrinters[0];
        }
        
        if (systemPrinter) {
          systemPrinter = systemPrinters.find(p => p.name === systemPrinter!.name);
          console.log(`Selected ${brandInfo.brand} printer:`, systemPrinter?.name);
        }
      }
      
      // 3. Поиск первого доступного принтера (исключая виртуальные)
      if (!systemPrinter) {
        const virtualPrinters = ['fax', 'pdf', 'xps', 'onenote', 'print to', 'send to'];
        systemPrinter = systemPrinters.find(p => 
          !virtualPrinters.some(virtual => p.name.toLowerCase().includes(virtual))
        );
        if (systemPrinter) {
          console.log('Using first available physical printer:', systemPrinter.name);
        }
      }
      
      if (systemPrinter) {
        console.log(`Attempting to print via system printer: ${systemPrinter.name}`);
        
        try {
          for (let i = 0; i < copies; i++) {
            await printerService.printFile(systemPrinter.name, filePath, {
              copies: 1,
              color: false,
              duplex: false,
              paperSize: 'A4',
              priority: false
            });
          }
          
          console.log(`Successfully printed ${copies} copy(ies) to ${systemPrinter.name}`);
          return { 
            success: true, 
            message: `Документ отправлен на печать через системный принтер: ${systemPrinter.name}` 
          };
        } catch (printError) {
          console.error(`Failed to print to ${systemPrinter.name}:`, printError);
        }
      } else {
        console.log('No suitable system printer found');
        console.log('Available printers:', systemPrinters.map(p => p.name));
      }
    } catch (fallbackError) {
      console.error('Fallback printing failed:', fallbackError);
    }
    
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
      console.log('Opening USB device...');
      // Открываем устройство
      device.open();
      
      // Проверяем наличие интерфейсов
      if (!device.interfaces) {
        console.error('No interfaces found on device');
        reject(new Error('Интерфейсы не найдены на устройстве'));
        return;
      }
      
      const interfaceCount = Array.isArray(device.interfaces) ? device.interfaces.length : Object.keys(device.interfaces || {}).length;
      console.log('Device interfaces:', interfaceCount);
      
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
        console.error('Printer interface not found');
        reject(new Error('Интерфейс принтера не найден'));
        return;
      }
      
      console.log('Found printer interface, claiming...');
      
      // Захватываем интерфейс для взаимодействия
      try {
        iface.claim();
      } catch (claimError: unknown) {
        console.error('Failed to claim interface:', claimError);
        device.close();
        
        // If claiming fails, this is likely a driver or permission issue
        // Try to use the interface without claiming (some printers work this way)
        if (claimError instanceof Error && claimError.message.includes('LIBUSB_ERROR_NOT_SUPPORTED')) {
          throw new Error('USB принтер не поддерживает прямое подключение. Убедитесь, что драйверы установлены правильно и принтер не используется другими приложениями.');
        }
        throw claimError;
      }
      
      // Находим OUT endpoint для отправки данных (бит 7 сброшен для OUT endpoint)
      const outEndpoint = iface.endpoints.find((ep: UsbEndpoint) => 
        (ep.descriptor.bEndpointAddress & 0x80) === 0
      );
      
      if (!outEndpoint) {
        console.error('Output endpoint not found');
        iface.release(() => device.close());
        reject(new Error('Endpoint вывода принтера не найден'));
        return;
      }
      
      console.log('Found output endpoint, sending data...');
      // Отправляем данные на принтер
      outEndpoint.transfer(data, (error?: Error) => {
        if (error) {
          console.error('Transfer error:', error);
          reject(error);
        } else {
          console.log('Data sent successfully');
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

// IPC handlers для работы с API без аутентификации

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