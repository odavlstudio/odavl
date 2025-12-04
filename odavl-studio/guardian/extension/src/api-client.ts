import axios, { type AxiosInstance } from 'axios';
import * as vscode from 'vscode';

interface TestItem {
  id: string;
  name: string;
  url: string;
  schedule: string;
  enabled: boolean;
  lastRun?: string;
}

interface Alert {
  id: string;
  ruleId: string;
  testId: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  message: string;
  status: 'pending' | 'sent' | 'acknowledged' | 'resolved' | 'failed';
  createdAt: string;
}

interface TrendData {
  trend: Array<{ date: string; score: number; duration: number; issues: number }>;
  topIssues: Array<{ type: string; count: number; trend: string }>;
  performance: {
    lcp: { current: number; average: number; trend: string };
    fcp: { current: number; average: number; trend: string };
    cls: { current: number; average: number; trend: string };
  };
  summary: {
    totalExecutions: number;
    successRate: number;
    avgScore: number;
    trendDirection: string;
  };
}

export class GuardianApiClient {
  private client: AxiosInstance;
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    const config = vscode.workspace.getConfiguration('guardian');
    this.apiUrl = config.get('apiUrl', 'http://localhost:3003');
    this.apiKey = config.get('apiKey', '');

    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async getTests(): Promise<TestItem[]> {
    try {
      const response = await this.client.get('/api/tests');
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch tests:', error);
      return [];
    }
  }

  async getTest(id: string): Promise<TestItem | null> {
    try {
      const response = await this.client.get(`/api/tests/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Failed to fetch test ${id}:`, error);
      return null;
    }
  }

  async createTest(test: Omit<TestItem, 'id' | 'lastRun'>): Promise<TestItem | null> {
    try {
      const response = await this.client.post('/api/tests', test);
      return response.data.data;
    } catch (error) {
      console.error('Failed to create test:', error);
      return null;
    }
  }

  async executeTest(id: string): Promise<any> {
    try {
      const response = await this.client.post(`/api/tests/${id}/execute`);
      return response.data.data;
    } catch (error) {
      console.error(`Failed to execute test ${id}:`, error);
      throw error;
    }
  }

  async deleteTest(id: string): Promise<boolean> {
    try {
      await this.client.delete(`/api/tests/${id}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete test ${id}:`, error);
      return false;
    }
  }

  async getAlerts(filters?: { testId?: string; status?: string; severity?: string; limit?: number }): Promise<Alert[]> {
    try {
      const response = await this.client.get('/api/alerts', { params: filters });
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      return [];
    }
  }

  async acknowledgeAlert(id: string, acknowledgedBy: string): Promise<boolean> {
    try {
      await this.client.post(`/api/alerts/${id}/acknowledge`, { acknowledgedBy });
      return true;
    } catch (error) {
      console.error(`Failed to acknowledge alert ${id}:`, error);
      return false;
    }
  }

  async resolveAlert(id: string): Promise<boolean> {
    try {
      await this.client.post(`/api/alerts/${id}/resolve`);
      return true;
    } catch (error) {
      console.error(`Failed to resolve alert ${id}:`, error);
      return false;
    }
  }

  async getTrends(testId: string, days: number = 30): Promise<TrendData | null> {
    try {
      const response = await this.client.get(`/api/tests/${testId}/trends`, { params: { days } });
      return response.data.data;
    } catch (error) {
      console.error(`Failed to fetch trends for test ${testId}:`, error);
      return null;
    }
  }

  async getExecutions(testId: string, limit: number = 10): Promise<any[]> {
    try {
      const response = await this.client.get(`/api/tests/${testId}/executions`, { params: { limit } });
      return response.data.data || [];
    } catch (error) {
      console.error(`Failed to fetch executions for test ${testId}:`, error);
      return [];
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.success === true;
    } catch (error) {
      return false;
    }
  }
}
