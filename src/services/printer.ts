import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

export interface LocalPrinter {
  name: string;
  driver: string;
  isDefault: boolean;
  status: string;
}

export interface PrintOptions {
  copies?: number;
  color?: boolean;
  duplex?: boolean;
  paperSize?: string;
  priority?: boolean;
}

class PrinterService {
  async getPrinters(): Promise<LocalPrinter[]> {
    const platform = os.platform();

    switch (platform) {
      case 'win32':
        return this.getWindowsPrinters();
      case 'darwin':
        return this.getMacPrinters();
      case 'linux':
        return this.getLinuxPrinters();
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  private async getWindowsPrinters(): Promise<LocalPrinter[]> {
    try {
      const { stdout } = await execAsync('wmic printer get Name,DriverName,Default /format:csv');
      const lines = stdout.trim().split('\n').slice(2); // Skip headers
      
      return lines.map(line => {
        const [, isDefault, driver, name] = line.split(',');
        return {
          name: name.trim(),
          driver: driver.trim(),
          isDefault: isDefault.trim().toLowerCase() === 'true',
          status: 'ready',
        };
      });
    } catch (error) {
      console.error('Failed to get Windows printers:', error);
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
    // Use print command on Windows
    let command = `print /D:"${printerName}" "${filePath}"`;

    try {
      await execAsync(command);
    } catch (error) {
      // Fallback to using Adobe Reader if available
      try {
        const adobeCommand = `"C:\\Program Files (x86)\\Adobe\\Acrobat Reader DC\\Reader\\AcroRd32.exe" /t "${filePath}" "${printerName}"`;
        await execAsync(adobeCommand);
      } catch {
        throw new Error(`Failed to print: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      }
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
}

export default new PrinterService();