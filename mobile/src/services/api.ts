import { QueryRequest, QueryResponse, StreamMessage, DatabaseStatus } from '@/types';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async healthCheck(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/query/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  async processQuery(request: QueryRequest): Promise<QueryResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/query/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Query processing failed:', error);
      throw error;
    }
  }

  async processQueryStream(
    request: QueryRequest,
    onMessage: (message: StreamMessage) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/query/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          
          try {
            const data = JSON.parse(line.substring(6));
            onMessage(data);
          } catch (parseError) {
            console.error('Failed to parse stream message:', parseError);
          }
        }
      }
    } catch (error) {
      console.error('Stream query failed:', error);
      throw error;
    }
  }

  async getDatabaseStatus(): Promise<DatabaseStatus[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search/databases/status`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get database status:', error);
      throw error;
    }
  }

  async searchArxiv(query: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search/search_arxiv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ s: query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('ArXiv search failed:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
export default apiService; 