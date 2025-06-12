import { contextBridge, ipcRenderer } from 'electron';
import { ElectronAPI } from '../shared/types/electronAPI';

/**
 * Этот файл служит мостом между основным процессом Electron и рендерером (веб-страницей)
 * Он предоставляет безопасный способ вызова API Electron из рендерера через contextBridge
 */

// Определяем API, которое будет доступно в рендерере
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Проверяет соединение с принтером
   * @param printerIP IP-адрес принтера
   * @param printerPort Порт принтера (обычно 9100 для RAW)
   */
  checkPrinterConnection: (printerIP: string, printerPort: number) => {
    return ipcRenderer.invoke('check-printer-connection', printerIP, printerPort);
  },
  
  /**
   * Отправляет файл на принтер через RAW-протокол
   * @param filePath Путь к файлу для печати
   * @param printerIP IP-адрес принтера
   * @param printerPort Порт принтера (обычно 9100 для RAW)
   */
  sendToPrinter: (filePath: string, printerIP: string, printerPort: number) => {
    return ipcRenderer.invoke('send-to-printer', filePath, printerIP, printerPort);
  },
  
  /**
   * Открывает диалог выбора файла для печати
   */
  selectFile: () => {
    return ipcRenderer.invoke('select-file');
  },
  
  /**
   * Сохраняет настройки принтера в локальное хранилище
   * @param printer Объект с информацией о принтере
   */
  savePrinter: (printer: any) => {
    return ipcRenderer.invoke('save-printer', printer);
  },
  
  /**
   * Получает список сохраненных принтеров из локального хранилища
   */
  getPrinters: () => {
    return ipcRenderer.invoke('get-printers');
  },

  getUsbPrinters: () => {
    return ipcRenderer.invoke('get-usb-printers');
  },
  
  printToUsb: (printerId, filePath, copies) => {
    return ipcRenderer.invoke('print-to-usb', { printerId, filePath, copies });
  },
  
  /**
   * Удаляет принтер из локального хранилища
   * @param printerId Идентификатор принтера для удаления
   */
  deletePrinter: (printerId: string) => {
    return ipcRenderer.invoke('delete-printer', printerId);
  }
} as ElectronAPI);

// Расширяем интерфейс Window (для TypeScript)
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}