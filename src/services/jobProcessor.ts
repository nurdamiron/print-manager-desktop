import { ipcMain } from 'electron';
import api, { PrintJob } from './api';
import printerService from './printer';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export class JobProcessor {
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private currentJob: PrintJob | null = null;

  start(): void {
    if (this.processingInterval) {
      return;
    }

    this.processingInterval = setInterval(() => {
      if (!this.isProcessing) {
        this.processJobs();
      }
    }, 5000); // Check every 5 seconds

    // Process immediately
    this.processJobs();
  }

  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  private async processJobs(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // Get queued jobs from backend
      const jobs = await api.getAgentJobs('queued');
      
      if (jobs.length === 0) {
        return;
      }

      // Process jobs one by one
      for (const job of jobs) {
        this.currentJob = job;
        await this.processJob(job);
      }
    } catch (error) {
      console.error('Failed to process jobs:', error);
    } finally {
      this.isProcessing = false;
      this.currentJob = null;
    }
  }

  private async processJob(job: PrintJob): Promise<void> {
    const tempDir = path.join(os.tmpdir(), 'print-jobs');
    const filePath = path.join(tempDir, `${job.job_id}.pdf`);

    try {
      // Update job status to printing
      await api.updateJobStatus(job.id, 'printing');
      
      // Send telemetry
      await api.sendTelemetry('job_started', {
        job_id: job.job_id,
        printer_id: job.printer.id,
      });

      // Ensure temp directory exists
      await fs.mkdir(tempDir, { recursive: true });

      // Если есть file_path (локальный файл), используем его
      // Иначе скачиваем по file_url
      if (job.file_path) {
        // Копируем локальный файл
        await fs.copyFile(job.file_path, filePath);
      } else if (job.file_url) {
        // Скачиваем файл по URL
        const fileData = await api.downloadFile(job.file_url);
        await fs.writeFile(filePath, Buffer.from(fileData));
      } else {
        throw new Error('No file path or URL provided');
      }

      // Get printer details
      const printers = await printerService.getPrinters();
      const printer = printers.find(p => p.name === job.printer.name);

      if (!printer) {
        throw new Error(`Printer ${job.printer.name} not found`);
      }

      // Print the file
      const printOptions = {
        copies: job.copies,
        color: job.color_mode === 'color',
        duplex: job.duplex,
        paperSize: job.paper_size,
        priority: job.priority === 'high',
      };

      await printerService.printFile(printer.name, filePath, printOptions);

      // Update job status to completed
      await api.updateJobStatus(job.id, 'completed');

      // Send success telemetry
      await api.sendTelemetry('job_completed', {
        job_id: job.job_id,
        printer_id: job.printer.id,
        duration: Date.now() - new Date(job.created_at).getTime(),
      });

      // Notify renderer
      if (global.mainWindow) {
        global.mainWindow.webContents.send('job-completed', {
          jobId: job.job_id,
          status: 'completed',
        });
      }

    } catch (error) {
      console.error(`Failed to process job ${job.job_id}:`, error);
      
      // Update job status to failed
      await api.updateJobStatus(job.id, 'failed', error instanceof Error ? error.message : 'Unknown error occurred');

      // Send error telemetry
      await api.sendTelemetry('job_failed', {
        job_id: job.job_id,
        printer_id: job.printer.id,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });

      // Notify renderer
      if (global.mainWindow) {
        global.mainWindow.webContents.send('job-failed', {
          jobId: job.job_id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    } finally {
      // Clean up temp file
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error('Failed to clean up temp file:', error);
      }
    }
  }

  getCurrentJob(): PrintJob | null {
    return this.currentJob;
  }

  // IPC handlers
  setupIpcHandlers(): void {
    ipcMain.handle('get-current-job', () => {
      return this.currentJob;
    });

    ipcMain.handle('cancel-current-job', async () => {
      if (this.currentJob) {
        await api.updateJobStatus(this.currentJob.id, 'failed', 'Cancelled by agent');
        this.currentJob = null;
        return true;
      }
      return false;
    });
  }
}

export default new JobProcessor();