"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
/**
 * Этот файл служит мостом между основным процессом Electron и рендерером (веб-страницей)
 * Он предоставляет безопасный способ вызова API Electron из рендерера через contextBridge
 */
// Определяем API, которое будет доступно в рендерере
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    /**
     * Проверяет соединение с принтером
     * @param printerIP IP-адрес принтера
     * @param printerPort Порт принтера (обычно 9100 для RAW)
     * @returns Объект с информацией о статусе соединения
     */
    checkPrinterConnection: (printerIP, printerPort) => {
        return electron_1.ipcRenderer.invoke('check-printer-connection', printerIP, printerPort);
    },
    /**
     * Отправляет файл на принтер через RAW-протокол
     * @param filePath Путь к файлу для печати
     * @param printerIP IP-адрес принтера
     * @param printerPort Порт принтера (обычно 9100 для RAW)
     * @returns Объект с результатом операции
     */
    sendToPrinter: (filePath, printerIP, printerPort) => {
        return electron_1.ipcRenderer.invoke('send-to-printer', filePath, printerIP, printerPort);
    },
    /**
     * Открывает диалог выбора файла для печати
     * @returns Путь к выбранному файлу или null, если диалог был отменен
     */
    selectFile: () => {
        return electron_1.ipcRenderer.invoke('select-file');
    },
    /**
     * Сохраняет настройки принтера в локальное хранилище
     * @param printer Объект с информацией о принтере
     * @returns Объект с результатом операции
     */
    savePrinter: (printer) => {
        return electron_1.ipcRenderer.invoke('save-printer', printer);
    },
    /**
     * Получает список сохраненных принтеров из локального хранилища
     * @returns Массив с информацией о принтерах
     */
    getPrinters: () => {
        return electron_1.ipcRenderer.invoke('get-printers');
    },
    /**
     * Удаляет принтер из локального хранилища
     * @param printerId Идентификатор принтера для удаления
     * @returns Объект с результатом операции
     */
    deletePrinter: (printerId) => {
        return electron_1.ipcRenderer.invoke('delete-printer', printerId);
    }
});
//# sourceMappingURL=preload.js.map