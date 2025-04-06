/**
 * Общие типы для API Electron, которые используются и в main, и в renderer процессах
 */

/**
 * Тип для результата проверки соединения с принтером
 */
export interface PrinterConnectionResult {
    status: 'online' | 'offline';
    message: string;
  }
  
  /**
   * Тип для результата отправки файла на принтер
   */
  export interface PrinterSendResult {
    success: boolean;
    message: string;
  }
  
  /**
   * Тип для результата операций с принтерами (сохранение, удаление и т.д.)
   */
  export interface PrinterOperationResult {
    success: boolean;
  }
  
  /**
   * Интерфейс для API Electron, доступного из renderer через preload
   */
  export interface ElectronAPI {
    /**
     * Проверяет соединение с принтером
     * @param printerIP IP-адрес принтера
     * @param printerPort Порт принтера
     */
    checkPrinterConnection: (printerIP: string, printerPort: number) => Promise<PrinterConnectionResult>;
    
    /**
     * Отправляет файл на принтер
     * @param filePath Путь к файлу для печати
     * @param printerIP IP-адрес принтера
     * @param printerPort Порт принтера
     */
    sendToPrinter: (filePath: string, printerIP: string, printerPort: number) => Promise<PrinterSendResult>;
    
    /**
     * Открывает диалог выбора файла
     */
    selectFile: () => Promise<string | null>;
    
    /**
     * Сохраняет информацию о принтере
     * @param printer Объект с данными принтера
     */
    savePrinter: (printer: any) => Promise<PrinterOperationResult>;
    
    /**
     * Получает список сохраненных принтеров
     */
    getPrinters: () => Promise<any[]>;
    
    /**
     * Удаляет принтер
     * @param printerId Идентификатор принтера для удаления
     */
    deletePrinter: (printerId: string) => Promise<PrinterOperationResult>;
  }