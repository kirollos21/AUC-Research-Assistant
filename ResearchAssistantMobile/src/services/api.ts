import { SearchQuery, StreamingResponse, ChatMessage } from '../types/search';

const API_BASE_URL = 'http://192.168.1.8:8000/api/v1/query/stream';

export class ApiService {
  static async searchWithStreaming(
    query: string,
    onData: (data: StreamingResponse) => void,
    onError: (error: string) => void,
    onComplete: () => void,
    options?: { access_filter?: 'open' | 'restricted'; databases?: string[]; max_results?: number; top_k?: number }
  ): Promise<void> {
    try {
      const payload: SearchQuery = {
        query: query.trim(),
        max_results: options?.max_results ?? 10,
        top_k: options?.top_k ?? 10,
        databases: options?.databases,
        access_filter: options?.access_filter,
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

  static async chatCompletionsStream(
    messages: ChatMessage[],
    onChunk: (textChunk: string) => void,
    onEvent?: (eventText: string) => void,
    options?: {
      access_filter?: 'open' | 'restricted';
      citation_style?: 'APA' | 'MLA';
      max_results?: number;
      top_k?: number;
      databases?: string[];
    }
  ): Promise<void> {
    const url = 'http://192.168.1.8:8000/api/v1/chat/completions';
    const payload = {
      model: 'gpt-3.5-turbo',
      messages,
      stream: true,
      stream_events: true,
      max_results: options?.max_results,
      top_k: options?.top_k,
      databases: options?.databases,
      access_filter: options?.access_filter,
      citation_style: options?.citation_style ?? 'APA',
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    const lines = text.split('\n');
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (json === '[DONE]') break;
      try {
        const chunk = JSON.parse(json);
        const delta = chunk?.choices?.[0]?.delta?.content as string | undefined;
        if (!delta) continue;
        if (delta.startsWith('<event>')) {
          const eventText = delta.replace(/^<event>|<\/event>$/g, '');
          onEvent?.(eventText);
        } else {
          onChunk(delta);
        }
      } catch (e) {
        // ignore malformed lines
      }
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