import { SearchQuery, StreamingResponse } from '../types/search';

const API_BASE_URL = 'http://192.168.1.8:8000/api/v1/query/stream';

export class ApiService {
  static async searchWithStreaming(
    query: string,
    onData: (data: StreamingResponse) => void,
    onError: (error: string) => void,
    onComplete: () => void
  ): Promise<void> {
    try {
      const payload: SearchQuery = {
        query: query.trim(),
        max_results: 10,
        top_k: 10,
      };

      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // For React Native, we need to handle streaming differently
      const responseText = await response.text();
      const lines = responseText.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        
        try {
          const data: StreamingResponse = JSON.parse(line.substring(6));
          onData(data);

          if (data.type === 'complete' || data.type === 'error') {
            break;
          }
        } catch (parseError) {
          console.error('Error parsing streaming data:', parseError);
        }
      }
    } catch (error) {
      console.error('API Error:', error);
      onError('An error occurred with the connection.');
    } finally {
      onComplete();
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch('http://192.168.1.8:8000/api/v1/query/health');
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
} 