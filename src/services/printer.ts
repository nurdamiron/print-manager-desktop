import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export interface LocalPrinter {
  name: string;
  driver: string;
  isDefault: boolean;
  status: string;
  isHP?: boolean;
  hpModel?: string;
  connectionType?: string;
  capabilities?: PrinterCapabilities;
  supportsRaw?: boolean;
  vendorId?: string;
  productId?: string;
}

export interface PrinterCapabilities {
  duplexPrinting: boolean;
  colorPrinting: boolean;
  paperSizes: string[];
  maxCopies: number;
  maxResolution: string;
  supportedFormats: string[];
  pclSupport: boolean;
  postscriptSupport: boolean;
}

export interface UniversalPrinter {
  id: string;
  name: string;
  type: 'system' | 'usb' | 'network';
  isHP: boolean;
  hpModel?: string;
  capabilities: PrinterCapabilities;
  connectionType: string;
  status: string;
  supportsRaw: boolean;
}

export interface PrintOptions {
  copies?: number;
  color?: boolean;
  duplex?: boolean;
  paperSize?: string;
  priority?: boolean;
  quality?: 'draft' | 'normal' | 'best';
  mediaType?: string;
  orientation?: 'portrait' | 'landscape';
}

export interface HPPrintOptions {
  copies: number;
  duplex: boolean;
  duplexMode: string;
  paperSize: string;
  resolution: number;
  mediaType: string;
  orientation: string;
  color: boolean;
  quality: string;
  jobName: string;
}

class UniversalPrinterService {
  private hpDatabase: Map<string, any> = new Map();
  private detectionCache: Map<string, LocalPrinter[]> = new Map();
  private cacheTimeout = 30000; // 30 seconds
  
  constructor() {
    this.initializeHPDatabase();
  }
  
  private initializeHPDatabase() {
    // Initialize HP printer database with capabilities
    const hpModels = [
      { model: 'LaserJet Pro M404', series: 'LaserJet Pro', color: false, duplex: true, pcl: 'PCL6', resolution: '1200x1200' },
      { model: 'LaserJet Pro M405', series: 'LaserJet Pro', color: false, duplex: true, pcl: 'PCL6', resolution: '1200x1200' },
      { model: 'LaserJet Pro M15', series: 'LaserJet Pro', color: false, duplex: false, pcl: 'PCL6', resolution: '600x600' },
      { model: 'LaserJet Pro M28', series: 'LaserJet Pro', color: false, duplex: false, pcl: 'PCL6', resolution: '600x600' },
      { model: 'Color LaserJet Pro M254', series: 'Color LaserJet Pro', color: true, duplex: true, pcl: 'PCL6', resolution: '600x600' },
      { model: 'Color LaserJet Pro M255', series: 'Color LaserJet Pro', color: true, duplex: true, pcl: 'PCL6', resolution: '600x600' },
      { model: 'DeskJet 2630', series: 'DeskJet', color: true, duplex: false, pcl: 'PCL3', resolution: '4800x1200' },
      { model: 'DeskJet 3630', series: 'DeskJet', color: true, duplex: false, pcl: 'PCL3', resolution: '4800x1200' },
      { model: 'OfficeJet Pro 8025', series: 'OfficeJet Pro', color: true, duplex: true, pcl: 'PCL3', resolution: '4800x1200' },
      { model: 'OfficeJet Pro 9015', series: 'OfficeJet Pro', color: true, duplex: true, pcl: 'PCL3', resolution: '4800x1200' },
      { model: 'ENVY 6055', series: 'ENVY', color: true, duplex: true, pcl: 'PCL3', resolution: '4800x1200' },
      { model: 'ENVY Pro 6455', series: 'ENVY Pro', color: true, duplex: true, pcl: 'PCL3', resolution: '4800x1200' },
    ];
    
    hpModels.forEach(model => {
      this.hpDatabase.set(model.model, model);
    });
    
    console.log(`🖨️  HP Database initialized with ${this.hpDatabase.size} models`);
  }
  
  // Get all available printers (system + USB) with unified interface
  async getUniversalPrinters(): Promise<UniversalPrinter[]> {
    console.log('🔍 Detecting universal printers...');
    
    const results: UniversalPrinter[] = [];
    
    try {
      // Get system printers
      const systemPrinters = await this.getPrinters();
      systemPrinters.forEach(printer => {
        results.push({
          id: `system_${printer.name}`,
          name: printer.name,
          type: 'system',
          isHP: printer.isHP || false,
          hpModel: printer.hpModel,
          capabilities: printer.capabilities || this.getDefaultCapabilities(),
          connectionType: printer.connectionType || 'Unknown',
          status: printer.status,
          supportsRaw: printer.supportsRaw || false,
        });
      });
      
      // Get USB printers if available
      try {
        const usbPrinters = await window.electronAPI?.getUsbPrinters?.() || [];
        usbPrinters.forEach((usbPrinter: any) => {
          // Check if this USB printer is already detected as system printer
          const isDuplicate = results.some(p => 
            p.name.toLowerCase().includes(usbPrinter.name.toLowerCase()) ||
            p.name.toLowerCase().includes(usbPrinter.vendorId) ||
            p.name.toLowerCase().includes(usbPrinter.productId)
          );
          
          if (!isDuplicate) {
            const isHP = this.isHPPrinter(usbPrinter.name, '');
            results.push({
              id: `usb_${usbPrinter.id}`,
              name: usbPrinter.name,
              type: 'usb',
              isHP: isHP.isHP,
              hpModel: isHP.model,
              capabilities: this.getUSBPrinterCapabilities(usbPrinter),
              connectionType: 'USB',
              status: 'ready',
              supportsRaw: true,
            });
          }
        });
      } catch (usbError) {
        console.warn('⚠️  USB printer detection failed:', usbError);
      }
      
      console.log(`✅ Found ${results.length} universal printers`);
      return results;
      
    } catch (error) {
      console.error('❌ Universal printer detection failed:', error);
      return [];
    }
  }
  async getPrinters(): Promise<LocalPrinter[]> {
    // Check cache first
    const cacheKey = 'system_printers';
    const cached = this.detectionCache.get(cacheKey);
    if (cached && Date.now() - (cached as any).timestamp < this.cacheTimeout) {
      console.log('📋 Using cached printer list');
      return cached;
    }

    const platform = os.platform();
    
    let printers: LocalPrinter[];
    
    switch (platform) {
      case 'win32':
        printers = await this.getWindowsPrinters();
        break;
      case 'darwin':
        printers = await this.getMacPrinters();
        break;
      case 'linux':
        printers = await this.getLinuxPrinters();
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
    
    // Enhance printers with HP detection and capabilities
    printers = printers.map(printer => this.enhancePrinterInfo(printer));
    
    // Cache the results
    (printers as any).timestamp = Date.now();
    this.detectionCache.set(cacheKey, printers);
    
    return printers;
  }

  private async getWindowsPrinters(): Promise<LocalPrinter[]> {
    try {
      // Use PowerShell with explicit encoding and error handling
      const psCommand = `powershell.exe -Command "& {Get-Printer | Select-Object Name, DriverName, Default | ConvertTo-Json}" 2>nul`;
      const { stdout } = await execAsync(psCommand, { encoding: 'utf8' });
      
      if (!stdout || !stdout.trim()) {
        console.log('No PowerShell output, trying fallback...');
        return this.getWindowsPrintersFallback();
      }
      
      const cleanOutput = stdout.trim();
      const printers = JSON.parse(cleanOutput);
      const printerArray = Array.isArray(printers) ? printers : [printers];
      
      return printerArray
        .filter(printer => printer && printer.Name)
        .map(printer => ({
          name: printer.Name,
          driver: printer.DriverName || 'Generic',
          isDefault: printer.Default === true || printer.Default === 'True',
          status: 'ready',
        }));
    } catch (error) {
      console.error('Failed to get Windows printers with PowerShell:', error);
      return this.getWindowsPrintersFallback();
    }
  }

  private async getWindowsPrintersFallback(): Promise<LocalPrinter[]> {
    try {
      // Simple printer name list as fallback
      const { stdout } = await execAsync('powershell.exe -Command "Get-Printer | ForEach-Object { Write-Output $_.Name }" 2>nul', { encoding: 'utf8' });
      
      if (!stdout || !stdout.trim()) {
        console.log('PowerShell fallback failed, trying wmic...');
        return this.getWindowsPrintersWmic();
      }
      
      const printerNames = stdout.trim().split('\n')
        .map(name => name.trim())
        .filter(name => name && name.length > 0);
      
      return printerNames.map(name => ({
        name: name,
        driver: 'Generic',
        isDefault: false,
        status: 'ready',
      }));
    } catch (fallbackError) {
      console.error('PowerShell fallback also failed:', fallbackError);
      return this.getWindowsPrintersWmic();
    }
  }

  private async getWindowsPrintersWmic(): Promise<LocalPrinter[]> {
    try {
      // Last resort: try wmic (deprecated but might still work)
      const { stdout } = await execAsync('wmic printer get Name /format:list 2>nul', { encoding: 'utf8' });
      
      const printerNames = stdout.split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('Name='))
        .map(line => line.replace('Name=', '').trim())
        .filter(name => name && name.length > 0);
      
      return printerNames.map(name => ({
        name: name,
        driver: 'Generic',
        isDefault: false,
        status: 'ready',
      }));
    } catch (wmicError) {
      console.error('WMIC also failed:', wmicError);
      return [];
    }
  }

  private async getMacPrinters(): Promise<LocalPrinter[]> {
    try {
      const { stdout } = await execAsync('lpstat -p -d');
      const lines = stdout.trim().split('\n');
      const printers: LocalPrinter[] = [];
      const defaultPrinter = lines.find(line => line.startsWith('system default destination:'))?.split(':')[1]?.trim();

      lines.forEach(line => {
        if (line.startsWith('printer')) {
          const match = line.match(/printer\s+(\S+)\s+is\s+(.+)/);
          if (match) {
            const [, name, status] = match;
            printers.push({
              name: name.trim(),
              driver: 'Generic',
              isDefault: name.trim() === defaultPrinter,
              status: status.includes('idle') ? 'ready' : status,
            });
          }
        }
      });

      return printers;
    } catch (error) {
      console.error('Failed to get Mac printers:', error);
      return [];
    }
  }

  private async getLinuxPrinters(): Promise<LocalPrinter[]> {
    try {
      const { stdout } = await execAsync('lpstat -p -d');
      const lines = stdout.trim().split('\n');
      const printers: LocalPrinter[] = [];
      const defaultPrinter = lines.find(line => line.startsWith('system default destination:'))?.split(':')[1]?.trim();

      lines.forEach(line => {
        if (line.startsWith('printer')) {
          const match = line.match(/printer\s+(\S+)\s+is\s+(.+)/);
          if (match) {
            const [, name, status] = match;
            printers.push({
              name: name.trim(),
              driver: 'Generic',
              isDefault: name.trim() === defaultPrinter,
              status: status.includes('idle') ? 'ready' : status,
            });
          }
        }
      });

      return printers;
    } catch (error) {
      console.error('Failed to get Linux printers:', error);
      return [];
    }
  }

  async printFile(printerName: string, filePath: string, options: PrintOptions = {}): Promise<void> {
    const platform = os.platform();

    switch (platform) {
      case 'win32':
        return this.printOnWindows(printerName, filePath, options);
      case 'darwin':
        return this.printOnMac(printerName, filePath, options);
      case 'linux':
        return this.printOnLinux(printerName, filePath, options);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  private async printOnWindows(printerName: string, filePath: string, options: PrintOptions): Promise<void> {
    console.log(`Attempting to print ${filePath} to printer: ${printerName}`);
    
    // First, let's check if the printer is actually ready
    try {
      const statusCommand = `powershell.exe -Command "Get-Printer -Name '${printerName}' | Select-Object PrinterStatus, JobCount"`;
      const { stdout } = await execAsync(statusCommand, { timeout: 10000 });
      console.log(`Printer status: ${stdout}`);
    } catch (error) {
      console.log('Could not check printer status:', error);
    }

    // Method 1: Try PowerShell with specific printer
    try {
      const psCommand = `powershell.exe -Command "Start-Process -FilePath '${filePath}' -Verb PrintTo -ArgumentList '${printerName}' -WindowStyle Hidden"`;
      await execAsync(psCommand, { timeout: 30000 });
      console.log('Printed successfully using PowerShell Start-Process with PrintTo');
      
      // Wait a bit and check print queue
      await new Promise(resolve => setTimeout(resolve, 2000));
      await this.checkPrintQueue(printerName);
      return;
    } catch (error) {
      console.log('PowerShell Start-Process with PrintTo failed:', error);
    }

    // Method 2: Try PowerShell with shell execution (works for PDFs)
    try {
      const psCommand = `powershell.exe -Command "& {$printer = '${printerName}'; $file = '${filePath}'; if (Test-Path $file) { Start-Process -FilePath $file -Verb PrintTo -ArgumentList $printer -Wait -WindowStyle Hidden } }"`;
      await execAsync(psCommand, { timeout: 30000 });
      console.log('Printed successfully using PowerShell shell execution');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      await this.checkPrintQueue(printerName);
      return;
    } catch (error) {
      console.log('PowerShell shell execution failed:', error);
    }

    // Method 3: Try traditional print command
    try {
      const printCommand = `print /D:"${printerName}" "${filePath}"`;
      await execAsync(printCommand, { timeout: 30000 });
      console.log('Printed successfully using print command');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      await this.checkPrintQueue(printerName);
      return;
    } catch (error) {
      console.log('Print command failed:', error);
    }

    // Method 4: Try direct Windows API call for PDF printing
    try {
      const psCommand = `powershell.exe -Command "& {Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class Win32 { [DllImport(\\"winspool.drv\\", CharSet = CharSet.Auto)] public static extern bool SetDefaultPrinter(string printerName); }'; [Win32]::SetDefaultPrinter('${printerName}'); Start-Process -FilePath '${filePath}' -Verb Print -Wait }"`;
      await execAsync(psCommand, { timeout: 30000 });
      console.log('Printed successfully using Windows API call');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      await this.checkPrintQueue(printerName);
      return;
    } catch (error) {
      console.log('Windows API call failed:', error);
    }

    // Method 5: Try PowerShell with different approach
    try {
      const psCommand = `powershell.exe -Command "& {$ErrorActionPreference='Stop'; [System.Reflection.Assembly]::LoadWithPartialName('System.Drawing.Printing'); $doc = New-Object System.Drawing.Printing.PrintDocument; $doc.PrinterSettings.PrinterName = '${printerName}'; $doc.DocumentName = '${filePath}'; $doc.Print(); Write-Host 'Print job sent' }"`;
      await execAsync(psCommand, { timeout: 30000 });
      console.log('Printed successfully using PowerShell PrintDocument');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      await this.checkPrintQueue(printerName);
      return;
    } catch (error) {
      console.log('PowerShell PrintDocument failed:', error);
    }

    throw new Error(`Failed to print using any available method. Please ensure the printer "${printerName}" is properly installed and accessible.`);
  }

  private async checkPrintQueue(printerName: string): Promise<void> {
    try {
      const queueCommand = `powershell.exe -Command "Get-PrintJob -PrinterName '${printerName}' | Select-Object Id, JobStatus, Name, Size, SubmittedTime"`;
      const { stdout } = await execAsync(queueCommand, { timeout: 10000 });
      
      if (stdout.trim()) {
        console.log(`Print queue for ${printerName}:`, stdout);
      } else {
        console.log(`No jobs in print queue for ${printerName} (job may have completed quickly)`);
      }
    } catch (error) {
      console.log('Could not check print queue:', error);
    }
  }

  private async printOnMac(printerName: string, filePath: string, options: PrintOptions): Promise<void> {
    let args: string[] = ['-d', printerName];

    if (options.copies && options.copies > 1) {
      args.push('-n', options.copies.toString());
    }

    if (options.duplex) {
      args.push('-o', 'sides=two-sided-long-edge');
    }

    if (options.paperSize) {
      args.push('-o', `media=${options.paperSize}`);
    }

    if (!options.color) {
      args.push('-o', 'ColorModel=Gray');
    }

    const command = `lp ${args.join(' ')} "${filePath}"`;
    
    try {
      await execAsync(command);
    } catch (error) {
      throw new Error(`Failed to print: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    }
  }

  private async printOnLinux(printerName: string, filePath: string, options: PrintOptions): Promise<void> {
    let args: string[] = ['-d', printerName];

    if (options.copies && options.copies > 1) {
      args.push('-n', options.copies.toString());
    }

    if (options.duplex) {
      args.push('-o', 'sides=two-sided-long-edge');
    }

    if (options.paperSize) {
      args.push('-o', `media=${options.paperSize}`);
    }

    if (!options.color) {
      args.push('-o', 'ColorModel=Gray');
    }

    if (options.priority) {
      args.push('-q', '10'); // High priority
    }

    const command = `lp ${args.join(' ')} "${filePath}"`;
    
    try {
      await execAsync(command);
    } catch (error) {
      throw new Error(`Failed to print: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    }
  }

  async getPrinterStatus(printerName: string): Promise<string> {
    const platform = os.platform();

    try {
      if (platform === 'win32') {
        const { stdout } = await execAsync(`wmic printer where Name="${printerName}" get PrinterStatus,DetectedErrorState /format:csv`);
        // Parse Windows printer status
        return 'ready';
      } else {
        const { stdout } = await execAsync(`lpstat -p "${printerName}"`);
        if (stdout.includes('idle')) return 'ready';
        if (stdout.includes('printing')) return 'busy';
        return 'offline';
      }
    } catch (error) {
      return 'offline';
    }
  }

  async cancelJob(jobId: string): Promise<void> {
    const platform = os.platform();

    try {
      if (platform === 'win32') {
        // Windows doesn't have a direct way to cancel by job ID
        throw new Error('Job cancellation not supported on Windows');
      } else {
        await execAsync(`cancel ${jobId}`);
      }
    } catch (error) {
      throw new Error(`Failed to cancel job: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    }
  }

  // Universal print method that handles all printer types
  async printFileUniversal(printerId: string, filePath: string, options: PrintOptions = {}): Promise<void> {
    console.log(`🖨️  Universal print: ${filePath} to ${printerId}`);
    console.log('📋 Print options:', options);
    
    const [type, id] = printerId.split('_', 2);
    
    try {
      if (type === 'usb') {
        return await this.printToUSB(id, filePath, options);
      } else if (type === 'system') {
        return await this.printFile(id, filePath, options);
      } else {
        // Legacy support - assume it's a printer name
        return await this.printFile(printerId, filePath, options);
      }
    } catch (error) {
      console.error(`❌ Universal print failed for ${printerId}:`, error);
      throw error;
    }
  }

  // USB printing method
  private async printToUSB(usbId: string, filePath: string, options: PrintOptions): Promise<void> {
    console.log(`📡 USB print: ${filePath} to USB device ${usbId}`);
    
    if (!window.electronAPI?.printToUsb) {
      throw new Error('USB printing not available');
    }
    
    const copies = options.copies || 1;
    const result = await window.electronAPI.printToUsb(usbId, filePath, copies);
    
    if (!result.success) {
      throw new Error(`USB print failed: ${result.message}`);
    }
    
    console.log('✅ USB print successful:', result.message);
  }

  // Helper methods
  private shouldSkipPrinter(name: string): boolean {
    const lowerName = name.toLowerCase();
    const skipKeywords = [
      'fax', 'microsoft print to pdf', 'microsoft xps',
      'onenote', 'send to onenote', 'adobe pdf',
    ];
    
    return skipKeywords.some(keyword => lowerName.includes(keyword));
  }
  
  private parsePrinterStatus(status: any): string {
    if (typeof status === 'number') {
      switch (status) {
        case 0:
        case 1:
        case 2:
        case 3:
          return 'ready';
        case 4:
          return 'printing';
        case 5:
          return 'warming_up';
        case 6:
          return 'ready';
        case 7:
          return 'offline';
        default:
          return 'ready';
      }
    }
    return 'ready';
  }
  
  private determineConnectionType(portName: string): string {
    if (!portName) return 'Unknown';
    
    const lowerPort = portName.toLowerCase();
    
    if (lowerPort.includes('usb')) return 'USB';
    if (lowerPort.includes('tcp') || lowerPort.includes('ip')) return 'Network';
    if (lowerPort.includes('lpt')) return 'Parallel';
    if (lowerPort.includes('com')) return 'Serial';
    if (lowerPort.includes('bluetooth') || lowerPort.includes('bt')) return 'Bluetooth';
    if (lowerPort.includes('wifi') || lowerPort.includes('wireless')) return 'WiFi';
    
    return 'Unknown';
  }
  
  private enhancePrinterInfo(printer: LocalPrinter): LocalPrinter {
    const hpInfo = this.isHPPrinter(printer.name, printer.driver);
    
    return {
      ...printer,
      isHP: hpInfo.isHP,
      hpModel: hpInfo.model,
      capabilities: printer.capabilities || this.getDefaultCapabilities(),
      connectionType: printer.connectionType || 'Unknown',
      supportsRaw: printer.supportsRaw || false,
    };
  }
  
  private isHPPrinter(name: string, driver: string): { isHP: boolean; model: string } {
    const searchText = `${name} ${driver}`.toLowerCase();
    const hpIndicators = ['hp ', 'hewlett', 'packard', 'laserjet', 'deskjet', 'officejet', 'envy'];
    
    const isHP = hpIndicators.some(indicator => searchText.includes(indicator));
    
    if (!isHP) {
      return { isHP: false, model: '' };
    }
    
    // Try to match known models
    for (const [model] of this.hpDatabase) {
      if (searchText.includes(model.toLowerCase())) {
        return { isHP: true, model };
      }
    }
    
    return { isHP: true, model: 'HP Generic' };
  }
  
  private getDefaultCapabilities(): PrinterCapabilities {
    return {
      duplexPrinting: false,
      colorPrinting: false,
      paperSizes: ['A4', 'Letter', 'Legal'],
      maxCopies: 999,
      maxResolution: '600x600',
      supportedFormats: ['PDF', 'DOC', 'DOCX', 'TXT', 'JPG', 'PNG'],
      pclSupport: false,
      postscriptSupport: false,
    };
  }
  
  private getUSBPrinterCapabilities(usbPrinter: any): PrinterCapabilities {
    const capabilities = this.getDefaultCapabilities();
    
    // Try to determine capabilities based on USB printer info
    const name = usbPrinter.name?.toLowerCase() || '';
    
    if (name.includes('color') || name.includes('inkjet')) {
      capabilities.colorPrinting = true;
    }
    
    if (name.includes('duplex') || name.includes('pro')) {
      capabilities.duplexPrinting = true;
    }
    
    capabilities.supportedFormats.push('RAW', 'PCL');
    capabilities.pclSupport = true;
    
    return capabilities;
  }
  
  // Clear detection cache
  clearCache(): void {
    this.detectionCache.clear();
    console.log('🗑️  Printer detection cache cleared');
  }
}

export default new UniversalPrinterService();