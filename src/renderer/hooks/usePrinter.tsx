import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Printer } from '../components/PrinterCard';

/**
 * Хук usePrinter - предоставляет функциональность для работы с принтерами
 * Включает методы для загрузки, добавления, обновления и удаления принтеров
 */
export const usePrinter = () => {
  // Состояние для списка принтеров
  const [printerList, setPrinterList] = useState<Printer[]>([]);
  
  // Состояние для индикации загрузки
  const [loading, setLoading] = useState(false);
  
  // Состояние для хранения ошибок
  const [error, setError] = useState<string | null>(null);

  /**
   * Загружает список принтеров из локального хранилища
   */
  const fetchPrinters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Получаем список принтеров через API Electron
      const printers = await window.electronAPI.getPrinters();
      setPrinterList(printers || []);
    } catch (err: any) {
      console.error('Ошибка при получении списка принтеров:', err);
      setError(err.message || 'Ошибка при получении списка принтеров');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Создает новый принтер
   * @param printer Данные нового принтера (без ID)
   */
  const createPrinter = useCallback(async (printer: Omit<Printer, 'id'>) => {
    try {
      setLoading(true);
      setError(null);
      
      // Создаем новый объект принтера с ID
      const newPrinter: Printer = {
        ...printer,
        id: uuidv4(), // Генерируем уникальный ID
      };
      
      // Сохраняем принтер через API Electron
      await window.electronAPI.savePrinter(newPrinter);
      
      // Обновляем локальный список принтеров
      setPrinterList(prev => [...prev, newPrinter]);
      
      return newPrinter;
    } catch (err: any) {
      console.error('Ошибка при создании принтера:', err);
      setError(err.message || 'Ошибка при создании принтера');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Обновляет данные существующего принтера
   * @param printer Обновленные данные принтера
   */
  const updatePrinter = useCallback(async (printer: Printer) => {
    try {
      setLoading(true);
      setError(null);
      
      // Сохраняем обновленный принтер через API Electron
      await window.electronAPI.savePrinter(printer);
      
      // Обновляем локальный список принтеров
      setPrinterList(prev => 
        prev.map(p => p.id === printer.id ? printer : p)
      );
      
      return printer;
    } catch (err: any) {
      console.error('Ошибка при обновлении принтера:', err);
      setError(err.message || 'Ошибка при обновлении принтера');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Проверяет соединение с принтером
   * @param printer Принтер для проверки
   */
  const checkPrinterConnection = useCallback(async (printer: Printer) => {
    try {
      setError(null);
      
      // Проверяем соединение через API Electron
      const result = await window.electronAPI.checkPrinterConnection(
        printer.ipAddress,
        printer.port
      );
      
      // Обновляем данные принтера с результатом проверки
      const updatedPrinter: Printer = {
        ...printer,
        isOnline: result.status === 'online',
        lastChecked: new Date().toISOString(),
      };
      
      // Сохраняем обновленные данные
      await updatePrinter(updatedPrinter);
      
      return result;
    } catch (err: any) {
      console.error('Ошибка при проверке соединения с принтером:', err);
      setError(err.message || 'Ошибка при проверке соединения с принтером');
      throw err;
    }
  }, [updatePrinter]);

  /**
   * Удаляет принтер
   * @param id Идентификатор принтера для удаления
   */
  const deletePrinter = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Удаляем принтер через API Electron
      await window.electronAPI.deletePrinter(id);
      
      // Обновляем локальный список принтеров
      setPrinterList(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      console.error('Ошибка при удалении принтера:', err);
      setError(err.message || 'Ошибка при удалении принтера');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Получает принтер по ID
   * @param id Идентификатор принтера
   */
  const getPrinterById = useCallback((id: string) => {
    return printerList.find(p => p.id === id) || null;
  }, [printerList]);

  return {
    printerList,
    loading,
    error,
    fetchPrinters,
    createPrinter,
    updatePrinter,
    checkPrinterConnection,
    deletePrinter,
    getPrinterById,
  };
};

export type { Printer };