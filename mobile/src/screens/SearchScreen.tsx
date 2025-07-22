import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  Share,
  StatusBar,
} from 'react-native';
import {
  Appbar,
  Card,
  Title,
  Paragraph,
  Chip,
  ActivityIndicator,
  useTheme,
  SegmentedButtons,
} from 'react-native-paper';
import Markdown from 'react-native-markdown-display';
import Toast from 'react-native-toast-message';

import SearchBar from '@/components/SearchBar';
import DocumentCard from '@/components/DocumentCard';
import { DocumentResult, StreamMessage } from '@/types';
import apiService from '@/services/api';

const SearchScreen: React.FC = () => {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState('');
  const [documents, setDocuments] = useState<DocumentResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [citationStyle, setCitationStyle] = useState<'APA' | 'MLA'>('APA');
  const [activeTab, setActiveTab] = useState<'response' | 'documents'>('response');

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError('');
    setResponse('');
    setDocuments([]);
    setStatus('');

    try {
      const request = {
        query: query.trim(),
        max_results: 10,
        top_k: 10,
      };

      await apiService.processQueryStream(request, (message: StreamMessage) => {
        switch (message.type) {
          case 'status':
            setStatus(message.message || '');
            break;

          case 'documents':
            if (message.documents) {
              setDocuments(prev => [...prev, ...message.documents]);
            }
            break;

          case 'response_chunk':
            if (message.chunk) {
              setResponse(prev => prev + message.chunk);
            }
            break;

          case 'complete':
            setStatus('');
            break;

          case 'error':
            setStatus('');
            setError(message.message || 'An error occurred');
            break;
        }
      });
    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred with the connection.');
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const handleShareDocument = useCallback(async (document: DocumentResult) => {
    try {
      const citation = `${document.title}\n\nAuthors: ${document.authors}\nYear: ${document.year}\nSource: ${document.source}\nURL: ${document.url}`;
      
      await Share.share({
        message: citation,
        title: document.title,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to share document',
      });
    }
  }, []);

  const renderDocument = useCallback(({ item }: { item: DocumentResult }) => (
    <DocumentCard
      document={item}
      citationStyle={citationStyle}
      onShare={handleShareDocument}
    />
  ), [citationStyle, handleShareDocument]);

  const renderResponse = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.sectionTitle}>AI Analysis</Title>
        {response ? (
          <Markdown style={markdownStyles}>
            {response}
          </Markdown>
        ) : (
          <Paragraph style={styles.emptyText}>
            No response yet...
          </Paragraph>
        )}
      </Card.Content>
    </Card>
  );

  const renderDocuments = () => (
    <FlatList
      data={documents}
      renderItem={renderDocument}
      keyExtractor={(item, index) => `${item.title}-${index}`}
      contentContainerStyle={styles.documentsList}
      showsVerticalScrollIndicator={false}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.primary} />
      
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.Content title="Research Assistant" subtitle="AI-powered research" />
      </Appbar.Header>

      <SearchBar
        query={query}
        onQueryChange={setQuery}
        onSearch={handleSearch}
        isLoading={isLoading}
      />

      {error && (
        <Card style={[styles.errorCard, { backgroundColor: theme.colors.errorContainer }]}>
          <Card.Content>
            <Paragraph style={{ color: theme.colors.error }}>
              {error}
            </Paragraph>
          </Card.Content>
        </Card>
      )}

      {status && (
        <Card style={styles.statusCard}>
          <Card.Content>
            <View style={styles.statusContainer}>
              <ActivityIndicator size="small" />
              <Paragraph style={styles.statusText}>{status}</Paragraph>
            </View>
          </Card.Content>
        </Card>
      )}

      {(response || documents.length > 0) && (
        <View style={styles.resultsContainer}>
          <View style={styles.tabHeader}>
            <SegmentedButtons
              value={activeTab}
              onValueChange={setActiveTab as (value: string) => void}
              buttons={[
                { value: 'response', label: 'AI Response' },
                { value: 'documents', label: `Documents (${documents.length})` },
              ]}
            />
          </View>

          <View style={styles.citationStyleContainer}>
            <Paragraph style={styles.citationLabel}>Citation style:</Paragraph>
            <SegmentedButtons
              value={citationStyle}
              onValueChange={setCitationStyle as (value: string) => void}
              buttons={[
                { value: 'APA', label: 'APA' },
                { value: 'MLA', label: 'MLA' },
              ]}
              density="small"
            />
          </View>

          <View style={styles.tabContent}>
            {activeTab === 'response' ? renderResponse() : renderDocuments()}
          </View>
        </View>
      )}

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  errorCard: {
    margin: 16,
  },
  statusCard: {
    margin: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 8,
  },
  resultsContainer: {
    flex: 1,
  },
  tabHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  citationStyleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  citationLabel: {
    marginRight: 8,
    fontSize: 14,
  },
  tabContent: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  emptyText: {
    fontStyle: 'italic',
    color: '#666',
  },
  documentsList: {
    paddingBottom: 16,
  },
});

const markdownStyles = {
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  paragraph: {
    marginBottom: 8,
  },
  heading1: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  heading2: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  code_block: {
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  code_inline: {
    backgroundColor: '#f5f5f5',
    padding: 2,
    borderRadius: 2,
    fontFamily: 'monospace',
  },
};

export default SearchScreen; 