import { SearchQuery, StreamingResponse, ChatMessage } from '../types/search';

// Update to match frontend API structure
const API_BASE_URL = 'http://192.168.1.8:8000/v1/chat/completions';
const BASE_URL = 'http://192.168.1.8:8000';

export class ApiService {
  static async searchWithStreaming(
    query: string,
    onData: (data: StreamingResponse) => void,
    onError: (error: string) => void,
    onComplete: () => void,
    options?: { 
      access_filter?: '' | 'open' | 'restricted'; 
      databases?: string[]; 
      max_results?: number; 
      top_k?: number;
      year_min?: number;
      year_max?: number;
    }
  ): Promise<void> {
    try {
      // Use the same payload structure as the frontend
      const payload: any = {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user' as const, content: query.trim() }],
        stream: true,
        stream_events: true,
        max_results: options?.max_results ?? 10,
        top_k: options?.top_k ?? 10,
      };

      if (options?.access_filter) payload.access_filter = options.access_filter;
      if (options?.year_min) payload.year_min = options.year_min;
      if (options?.year_max) payload.year_max = options.year_max;

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
          const json = line.substring(6).trim();
          if (json === '[DONE]') break;
          
          const chunk = JSON.parse(json);
          const delta = chunk?.choices?.[0]?.delta?.content as string | undefined;
          
          if (!delta) continue;
          
          if (delta.startsWith('<event>')) {
            const eventText = delta.replace(/^<event>|<\/event>$/g, '');
            onData({ type: 'status', message: eventText });
          } else {
            onData({ type: 'response_chunk', chunk: delta });
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
      access_filter?: '' | 'open' | 'restricted';
      citation_style?: 'APA' | 'MLA';
      max_results?: number;
      top_k?: number;
      databases?: string[];
      year_min?: number;
      year_max?: number;
    }
  ): Promise<void> {
    const payload: any = {
      model: 'gpt-3.5-turbo',
      messages,
      stream: true,
      stream_events: true,
      max_results: options?.max_results,
      top_k: options?.top_k,
      access_filter: options?.access_filter || undefined,
      citation_style: options?.citation_style ?? 'APA',
      year_min: options?.year_min,
      year_max: options?.year_max,
    };

    console.log('Sending payload:', JSON.stringify(payload, null, 2));

    const res = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log('Received response:', text.substring(0, 500) + '...');
    const lines = text.split('\n');
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (json === '[DONE]') break;
      try {
        const chunk = JSON.parse(json);
        const delta = chunk?.choices?.[0]?.delta?.content as string | undefined;
        console.log('Parsed chunk:', { delta, hasContent: !!delta });
        if (!delta) continue;
        if (delta.startsWith('<event>')) {
          console.log('Found event:', delta);
          const eventText = delta.replace(/^<event>|<\/event>$/g, '');
          const trimmed = eventText.trim();
          console.log('Event content:', trimmed);
          
          if (trimmed.startsWith('documents:')) {
            try {
              const docsJson = trimmed.replace(/^documents:\s*/i, '');
              const documents = JSON.parse(docsJson);
              console.log('Parsed documents:', documents);
              onEvent?.(`documents:${docsJson}`);
            } catch (e) {
              console.warn('Failed to parse documents payload:', trimmed, e);
            }
          } else {
            onEvent?.(trimmed);
          }
        } else {
          onChunk(delta);
        }
      } catch (e) {
        console.error('Error parsing chunk:', e, json);
      }
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      // Use the correct health check endpoint
      const response = await fetch(`${BASE_URL}/api/v1/query/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Additional endpoints to match frontend functionality
  static async analyzeSearchResults(query: string, results: any[]): Promise<any> {
    try {
      const response = await fetch(`${BASE_URL}/api/v1/search/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          results
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Analysis failed:', error);
      throw error;
    }
  }

  static async getDatabaseStatus(): Promise<any[]> {
    try {
      const response = await fetch(`${BASE_URL}/api/v1/search/databases/status`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch database status: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch database status:', error);
      throw error;
    }
  }

  // Authentication methods (client-side like frontend)
  static async authenticateUser(email: string, password: string): Promise<any> {
    // This would typically call a backend auth endpoint
    // For now, we'll implement client-side auth like the frontend
    try {
      // In a real implementation, this would be an API call
      // For now, return a mock user object
      return {
        firstName: 'User',
        lastName: 'Name',
        email,
        isAuthenticated: true
      };
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  }

  static async registerUser(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<boolean> {
    // This would typically call a backend registration endpoint
    // For now, we'll implement client-side registration like the frontend
    try {
      // In a real implementation, this would be an API call
      // For now, return success
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }
} 