import axios, { AxiosInstance } from 'axios';
import Store from 'electron-store';

const store = new Store();

export interface AgentCredentials {
  email: string;
  password: string;
  token?: string;
}

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
  private agentToken: string | null = null;

  constructor() {
    this.baseURL = process.env.API_URL || 'http://localhost:8080/api/v1';
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load saved token
    const savedToken = store.get('agentToken') as string;
    if (savedToken) {
      this.agentToken = savedToken;
      this.api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        if (this.agentToken) {
          config.headers.Authorization = `Bearer ${this.agentToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          this.agentToken = null;
          store.delete('agentToken');
          store.delete('agentCredentials');
        }
        return Promise.reject(error);
      }
    );
  }

  // Agent Authentication
  async agentLogin(email: string, password: string): Promise<{ token: string; agent: any }> {
    try {
      const response = await this.api.post('/auth/agent/login', {
        email,
        password,
      });

      const { access_token, agent } = response.data;
      this.agentToken = access_token;
      this.api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Save credentials
      store.set('agentToken', access_token);
      store.set('agentCredentials', { email, password });

      return { token: access_token, agent };
    } catch (error) {
      console.error('Agent login failed:', error);
      throw error;
    }
  }

  async checkAuth(): Promise<boolean> {
    if (!this.agentToken) {
      const credentials = store.get('agentCredentials') as AgentCredentials;
      if (credentials?.email && credentials?.password) {
        try {
          await this.agentLogin(credentials.email, credentials.password);
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
    return true;
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

  // Job Management
  async getAgentJobs(status?: string): Promise<PrintJob[]> {
    const params = status ? { status } : {};
    const response = await this.api.get('/agent/jobs', { params });
    return response.data.jobs;
  }

  async updateJobStatus(jobId: number, status: 'printing' | 'completed' | 'failed', message?: string): Promise<void> {
    await this.api.put(`/agent/jobs/${jobId}/status`, {
      status,
      message,
    });
  }

  async downloadFile(fileUrl: string): Promise<ArrayBuffer> {
    const response = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
      headers: {
        Authorization: `Bearer ${this.agentToken}`,
      },
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

  // Logout
  logout(): void {
    this.agentToken = null;
    store.delete('agentToken');
    store.delete('agentCredentials');
    delete this.api.defaults.headers.common['Authorization'];
  }

  isAuthenticated(): boolean {
    return !!this.agentToken;
  }
}

export default new ApiService();