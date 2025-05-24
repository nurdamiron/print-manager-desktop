import { BrowserWindow } from 'electron';

declare global {
  var mainWindow: BrowserWindow | null;
  
  namespace NodeJS {
    interface Global {
      mainWindow: BrowserWindow | null;
    }
  }
}