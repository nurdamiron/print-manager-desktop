"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const net = __importStar(require("net"));
const electron_store_1 = __importDefault(require("electron-store"));
const usb = __importStar(require("usb"));
// Создание хранилища настроек
const store = new electron_store_1.default();
// Определяем переменную для хранения главного окна
let mainWindow = null;
/**
 * Создает главное окно приложения
 * Функция инициализирует и настраивает главное окно Electron
 */
function createWindow() {
    // Создаем новый экземпляр окна браузера
    mainWindow = new electron_1.BrowserWindow({
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
electron_1.app.on('ready', () => {
    createWindow();
});
/**
 * Завершаем работу приложения на всех платформах, кроме macOS
 */
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
/**
 * Восстанавливаем окно на macOS при клике на иконку в доке
 */
electron_1.app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
/**
 * Обработчик IPC для проверки соединения с принтером
 * Пытается установить TCP-соединение с принтером по указанному IP и порту
 */
// Добавьте обработчик для получения USB-принтеров
// В main.ts
electron_1.ipcMain.handle('get-usb-printers', async () => {
    try {
        const devices = usb.getDeviceList();
        // Фильтруем только принтеры (обычно класс 7)
        return devices
            .filter(device => device.deviceDescriptor.bDeviceClass === 7 ||
            device.configDescriptor?.interfaces.some(iface => iface.some(setting => setting.bInterfaceClass === 7)))
            .map(device => ({
            id: `${device.deviceDescriptor.idVendor}:${device.deviceDescriptor.idProduct}`,
            name: `USB Printer (${device.deviceDescriptor.idVendor.toString(16)}:${device.deviceDescriptor.idProduct.toString(16)})`,
            isUsb: true
        }));
    }
    catch (error) {
        console.error('Error getting USB printers:', error);
        return [];
    }
});
// Обработчик для печати на USB-принтер
electron_1.ipcMain.handle('print-to-usb', async (_, { printerId, filePath, copies = 1 }) => {
    try {
        const [vendorId, productId] = printerId.split(':').map((id) => parseInt(id, 16));
        const device = usb.findByIds(vendorId, productId);
        if (!device) {
            throw new Error('USB printer not found');
        }
        // Read file data
        const fileData = fs.readFileSync(filePath);
        // Repeat for the number of copies
        for (let i = 0; i < copies; i++) {
            await sendDataToUsbPrinter(device, fileData);
        }
        return { success: true, message: 'Документ успешно отправлен на печать' };
    }
    catch (error) {
        console.error('Error printing to USB:', error);
        return {
            success: false,
            message: `Ошибка печати: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
        };
    }
});
// Функция отправки данных на USB-принтер
async function sendDataToUsbPrinter(device, data) {
    return new Promise((resolve, reject) => {
        try {
            device.open();
            // Handle case where interfaces might not exist
            if (!device.interfaces) {
                reject(new Error('No interfaces found on device'));
                return;
            }
            // Find printer interface (class 7 is printer class)
            let iface;
            if (Array.isArray(device.interfaces)) {
                // If interfaces is an array (from usb library)
                iface = device.interfaces.find((i) => i.descriptor.bInterfaceClass === 7) || device.interfaces[0];
            }
            else {
                // If interfaces is an object with a find method (our expected structure)
                iface = device.interfaces.find((i) => i.descriptor.bInterfaceClass === 7) || device.interfaces[0];
            }
            if (!iface) {
                reject(new Error('Printer interface not found'));
                return;
            }
            iface.claim();
            // Find OUT endpoint for sending data (bit 7 clear means OUT endpoint)
            const outEndpoint = iface.endpoints.find((ep) => (ep.descriptor.bEndpointAddress & 0x80) === 0);
            if (!outEndpoint) {
                iface.release(() => device.close());
                reject(new Error('Printer output endpoint not found'));
                return;
            }
            // Send data to printer
            outEndpoint.transfer(data, (error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(true);
                }
                // Release interface and close device
                iface.release(() => device.close());
            });
        }
        catch (error) {
            try {
                device.close();
            }
            catch (e) { /* Ignore errors on close */ }
            reject(error);
        }
    });
}
electron_1.ipcMain.handle('check-printer-connection', async (_, printerIP, printerPort) => {
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
electron_1.ipcMain.handle('send-to-printer', async (_, filePath, printerIP, printerPort) => {
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
        }
        catch (err) {
            reject(new Error(`Ошибка отправки файла: ${err.message}`));
        }
    });
});
/**
 * Обработчик IPC для выбора файла для печати
 * Открывает диалог выбора файла и возвращает путь к выбранному файлу
 */
electron_1.ipcMain.handle('select-file', async () => {
    if (!mainWindow) {
        throw new Error('Главное окно не инициализировано');
    }
    const result = await electron_1.dialog.showOpenDialog(mainWindow, {
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
electron_1.ipcMain.handle('save-printer', async (_, printer) => {
    const printers = store.get('printers', []);
    // Проверяем, существует ли уже принтер с таким ID
    const existingPrinterIndex = printers.findIndex(p => p.id === printer.id);
    if (existingPrinterIndex >= 0) {
        // Обновляем существующий принтер
        printers[existingPrinterIndex] = printer;
    }
    else {
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
electron_1.ipcMain.handle('get-printers', async () => {
    return store.get('printers', []);
});
/**
 * Обработчик IPC для удаления принтера
 * Удаляет информацию о принтере из локального хранилища
 */
electron_1.ipcMain.handle('delete-printer', async (_, printerId) => {
    const printers = store.get('printers', []);
    const updatedPrinters = printers.filter(p => p.id !== printerId);
    store.set('printers', updatedPrinters);
    return { success: true };
});
//# sourceMappingURL=main.js.map