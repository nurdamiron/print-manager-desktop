import { ElectronAPI } from '../../shared/types/electronAPI';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

// Важно: добавьте пустой export для корректной работы модуля
export {};