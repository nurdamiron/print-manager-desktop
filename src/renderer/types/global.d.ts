/**
 * Глобальные типы для TypeScript
 * Описывает интерфейсы, доступные через window
 */

import { ElectronAPI } from '../../shared/types/electronAPI';

// Расширяем интерфейс Window дополнительными глобальными объектами
interface Window {
  // Импортируем интерфейс ElectronAPI из общего типа
  electronAPI: ElectronAPI;
}