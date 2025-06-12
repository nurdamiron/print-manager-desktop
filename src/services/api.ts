import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Simple store replacement for browser environment
class SimpleStore {
  private data: { [key: string]: any } = {};

  get(key: string): any {
    return this.data[key];
  }

  set(key: string, value: any): void {
    this.data[key] = value;
    // Save to localStorage if available
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`electron-store-${key}`, JSON.stringify(value));
    }
  }

  delete(key: string): void {
    delete this.data[key];
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`electron-store-${key}`);
    }
  }

  constructor() {
    // Load from localStorage if available
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('electron-store-')) {
          const realKey = key.replace('electron-store-', '');
          try {
            this.data[realKey] = JSON.parse(localStorage.getItem(key) || '');
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  }
}

const store = new SimpleStore();


export interface Printer {
  id: number;
  name: string;
  model: string;
  location: string;
  status: string;
  is_online: boolean;
  capabilities: {
    color: boolean;
    duplex: boolean;
    paper_sizes: string[];
    max_resolution: string;
  };
  price_per_page: number;
  price_color: number;
}

export interface PrintJob {
  id: number;
  job_id: string;
  status: string;
  file_url: string;
  file_path?: string; // Optional local file path
  filename: string;
  pages: number;
  copies: number;
  color_mode: string;
  paper_size: string;
  duplex: boolean;
  priority: string;
  created_at: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  printer: {
    id: number;
    name: string;
  };
}

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = (typeof process !== 'undefined' && process.env?.API_URL) || 'http://localhost:8080/api/v1';
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async checkAuth(): Promise<boolean> {
    return true; // Always authenticated - no auth required
  }

  // Printer Management
  async createPrinter(printer: Omit<Printer, 'id' | 'is_online'>): Promise<Printer> {
    const response = await this.api.post('/printers', printer);
    return response.data;
  }

  async updatePrinter(id: number, printer: Partial<Printer>): Promise<Printer> {
    const response = await this.api.put(`/printers/${id}`, printer);
    return response.data;
  }

  async updatePrinterStatus(id: number, status: string, queueLength: number = 0, isOnline: boolean = true): Promise<void> {
    await this.api.put(`/printers/${id}/status`, {
      status,
      queue_length: queueLength,
      is_online: isOnline,
    });
  }

  async deletePrinter(id: number): Promise<void> {
    await this.api.delete(`/printers/${id}`);
  }

  // Job Management - skip agent jobs since no auth
  async getAgentJobs(status?: string): Promise<PrintJob[]> {
    return []; // Return empty array - no jobs without auth
  }

  async updateJobStatus(jobId: number, status: 'printing' | 'completed' | 'failed', message?: string): Promise<void> {
    // Skip - no auth
  }

  async downloadFile(fileUrl: string): Promise<ArrayBuffer> {
    const response = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
    });
    return response.data;
  }

  // Telemetry
  async sendTelemetry(eventType: string, eventData: any): Promise<void> {
    try {
      await this.api.post('/telemetry/event', {
        event_type: eventType,
        event_data: eventData,
      });
    } catch (error) {
      console.error('Failed to send telemetry:', error);
    }
  }

  // No auth needed
  logout(): void {
    // No-op
  }

  isAuthenticated(): boolean {
    return true; // Always authenticated
  }
}

export default new ApiService();