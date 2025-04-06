// src/shared/types/usbPrinters.ts

export interface UsbPrinter {
    id: string;
    name: string;
    isUsb: true;
  }
  
  export interface UsbPrintResult {
    success: boolean;
    message: string;
  }