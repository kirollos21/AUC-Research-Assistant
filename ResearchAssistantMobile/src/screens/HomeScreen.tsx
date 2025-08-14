import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Linking,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  TextInput,
  Button,
  Chip,
  ActivityIndicator,
  Text,
  Divider,
  useTheme,
} from 'react-native-paper';
import Markdown from 'react-native-markdown-display';
import { ApiService } from '../services/api';
import { Document, CitationStyle, StreamingResponse, ChatMessage } from '../types/search';
import { useAppTheme } from '../utils/themeContext';
import CitationPreview from '../components/CitationPreview';
import ConversationalChat from '../components/ConversationalChat';

const MAX_DOCS = 10;

export default function HomeScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [citationStyle, setCitationStyle] = useState<CitationStyle>('APA');
  const [activeTab, setActiveTab] = useState<'response' | 'documents' | 'conversation'>('response');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'system', content: 'You are an academic assistant' },
  ]);
  const [accessFilter, setAccessFilter] = useState<'' | 'open' | 'restricted'>('');
  const [yearMin, setYearMin] = useState<string>('');
  const [yearMax, setYearMax] = useState<string>('');

  // Year filter functionality - allows users to filter search results by publication year range
  // Similar to the frontend implementation, supports year_min and year_max parameters
  // Helper function to validate year input
  const validateYear = (year: string): string => {
    if (!year) return '';
    const numYear = parseInt(year);
    if (isNaN(numYear)) return '';
    if (numYear < 1800 || numYear > 2100) return '';
    return year;
  };

  const handleYearMinChange = (text: string) => {
    const validated = validateYear(text);
    setYearMin(validated);
  };

  const handleYearMaxChange = (text: string) => {
    const validated = validateYear(text);
    setYearMax(validated);
  };

  const colorScheme = useColorScheme();
  const { isDarkMode, themeMode, setThemeMode } = useAppTheme();
  const theme = useTheme();

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError('');
    setResponse('');
    setDocuments([]);
    setStatus('');

    try {
      await ApiService.searchWithStreaming(
        query,
        (data: StreamingResponse) => {
          switch (data.type) {
            case 'status':
              setStatus(data.message || '');
              break;

            case 'documents':
              if (data.documents) {
                setDocuments((prev) => [...prev, ...data.documents!]);
              }
              break;

            case 'response_chunk':
              if (data.chunk) {
                setResponse((prev) => prev + data.chunk);
              }
              break;

            case 'complete':
              setStatus('');
              break;

            case 'error':
              setStatus('');
              setError(data.message || 'An error occurred');
              break;
          }
        },
        (errorMessage: string) => {
          setError(errorMessage);
        },
        () => {
          setIsLoading(false);
        },
        {
          access_filter: accessFilter || undefined,
          year_min: yearMin ? parseInt(yearMin) : undefined,
          year_max: yearMax ? parseInt(yearMax) : undefined,
        }
      );
    } catch (err) {
      console.error(err);
      setError('An error occurred with the connection.');
      setIsLoading(false);
    }
  };

  const handleSendChat = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setActiveTab('response');
    setIsLoading(true);
    setError('');
    setResponse('');
    setDocuments([]);

    // Add the user's initial query to chat messages if it's not already there
    if (!chatMessages.some(msg => msg.role === 'user' && msg.content === trimmed)) {
      setChatMessages(prev => [...prev, { role: 'user', content: trimmed }]);
    }

    const nextMessages = [...chatMessages, { role: 'user' as const, content: trimmed }];
    setChatMessages(nextMessages);
    setQuery('');

    let accumulated = '';
    try {
      await ApiService.chatCompletionsStream(
        nextMessages,
        (chunk) => {
          accumulated += chunk;
          setResponse(accumulated);
        },
        (eventText) => {
          // handle events: status and documents
          if (!eventText) return;
          console.log('Received event:', eventText);
          const trimmedEvent = eventText.trim();
          if (trimmedEvent.startsWith('documents:')) {
            try {
              const json = trimmedEvent.replace(/^documents:\s*/i, '');
              console.log('Parsing documents JSON:', json);
              const docs: any[] = JSON.parse(json);
              console.log('Parsed documents:', docs);
              const mapped: Document[] = docs.map((d) => ({
                content: d.content ?? '',
                score: Number(d.score ?? 0),
                title: d.title ?? 'Unknown Title',
                authors: d.authors ?? 'Unknown Authors',
                year: d.year ?? 'Unknown',
                month: d.month ?? 'Unknown',
                source: d.source ?? 'Unknown',
                url: d.url ?? '',
                abstract: d.abstract ?? '',
                access: d.access ?? 'restricted',
              }));
              console.log('Mapped documents:', mapped);
              setDocuments(mapped);
            } catch (error) {
              console.error('Error parsing documents:', error);
            }
          } else {
            setStatus(trimmedEvent.replace(/<[^>]+>/g, ''));
          }
        },
        {
          access_filter: accessFilter || undefined,
          year_min: yearMin ? parseInt(yearMin) : undefined,
          year_max: yearMax ? parseInt(yearMax) : undefined,
        }
      );

      setChatMessages((prev) => [...prev, { role: 'assistant', content: accumulated }]);
    } catch (e) {
      setError('An error occurred with the connection.');
    } finally {
      setIsLoading(false);
      setStatus('');
    }
  };

  const handleFollowUpQuestion = async (message: string) => {
    setIsLoading(true);
    setError('');

    const nextMessages = [...chatMessages, { role: 'user' as const, content: message }];
    setChatMessages(nextMessages);
    
    // Ensure we're on the conversation tab
    setActiveTab('conversation');

    let accumulated = '';
    try {
      await ApiService.chatCompletionsStream(
        nextMessages,
        (chunk) => {
          accumulated += chunk;
        },
        (eventText) => {
          // handle events: status and documents
          if (!eventText) return;
          const trimmedEvent = eventText.trim();
          if (trimmedEvent.startsWith('documents:')) {
            try {
              const json = trimmedEvent.replace(/^documents:\s*/i, '');
              const docs: any[] = JSON.parse(json);
              const mapped: Document[] = docs.map((d) => ({
                content: d.content ?? '',
                score: Number(d.score ?? 0),
                title: d.title ?? 'Unknown Title',
                authors: d.authors ?? 'Unknown Authors',
                year: d.year ?? 'Unknown',
                month: d.month ?? 'Unknown',
                source: d.source ?? 'Unknown',
                url: d.url ?? '',
                abstract: d.abstract ?? '',
                access: d.access ?? 'restricted',
              }));
              setDocuments(mapped);
            } catch (_) {}
          }
        },
        {
          access_filter: accessFilter || undefined,
          year_min: yearMin ? parseInt(yearMin) : undefined,
          year_max: yearMax ? parseInt(yearMax) : undefined,
        }
      );

      setChatMessages((prev) => [...prev, { role: 'assistant', content: accumulated }]);
    } catch (e) {
      setError('An error occurred with the connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearConversation = () => {
    setChatMessages([{ role: 'system', content: 'You are an academic assistant' }]);
    setResponse('');
    setDocuments([]);
  };

  const handleOpenUrl = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open the link');
    });
  };

  const themeStyles = isDarkMode ? {
    backgroundColor: '#0f172a',
    cardBackground: '#1e293b',
    textColor: '#f8fafc',
    secondaryTextColor: '#cbd5e1',
    borderColor: '#334155',
  } : {
    backgroundColor: '#f8fafc',
    cardBackground: '#ffffff',
    textColor: '#0f172a',
    secondaryTextColor: '#64748b',
    borderColor: '#e2e8f0',
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header Card */}
      <Card style={[styles.headerCard, { backgroundColor: themeStyles.cardBackground }]}>
        <Card.Content style={styles.headerContent}>
          <Title style={[styles.title, { color: themeStyles.textColor }]}>
            Academic Research Assistant
          </Title>
          <Paragraph style={[styles.subtitle, { color: themeStyles.secondaryTextColor }]}>
            Your AI-powered research partner
          </Paragraph>
        </Card.Content>
      </Card>

      {/* Search Card */}
      <Card style={[styles.searchCard, { backgroundColor: themeStyles.cardBackground }]}>
        <Card.Content>
          <View style={styles.searchContainer}>
            <TextInput
              mode="outlined"
              value={query}
              onChangeText={setQuery}
              placeholder="Enter your research query..."
              style={styles.searchInput}
              onSubmitEditing={handleSendChat}
              multiline={false}
            />
            <Button
              mode="contained"
              onPress={handleSendChat}
              loading={isLoading}
              disabled={isLoading}
              style={styles.searchButton}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </View>

          {/* Filters */}
          <View style={{ marginTop: 12 }}>
            <Text style={{ marginBottom: 8, color: themeStyles.secondaryTextColor }}>Access filter</Text>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Chip
                selected={accessFilter === ''}
                onPress={() => setAccessFilter('')}
              >
                All
              </Chip>
              <Chip
                selected={accessFilter === 'open'}
                onPress={() => setAccessFilter('open')}
              >
                Open
              </Chip>
              <Chip
                selected={accessFilter === 'restricted'}
                onPress={() => setAccessFilter('restricted')}
              >
                Restricted
              </Chip>
              <Button
                mode="outlined"
                onPress={() => setAccessFilter('')}
                compact
                style={{ minWidth: 60 }}
              >
                Reset
              </Button>
            </View>
          </View>

          {/* Year Filter */}
          <View style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ color: themeStyles.secondaryTextColor }}>Year range</Text>
              {(yearMin || yearMax) && (
                <Chip
                  mode="outlined"
                  textStyle={{ fontSize: 12 }}
                  style={{ backgroundColor: '#dbeafe' }}
                >
                  {yearMin && yearMax ? `${yearMin}-${yearMax}` : yearMin ? `From ${yearMin}` : `To ${yearMax}`}
                </Chip>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TextInput
                mode="outlined"
                value={yearMin}
                onChangeText={handleYearMinChange}
                placeholder="Min year"
                keyboardType="numeric"
                style={{ flex: 1, minWidth: 100 }}
                dense
              />
              <Text style={{ color: themeStyles.secondaryTextColor }}>to</Text>
              <TextInput
                mode="outlined"
                value={yearMax}
                onChangeText={handleYearMaxChange}
                placeholder="Max year"
                keyboardType="numeric"
                style={{ flex: 1, minWidth: 100 }}
                dense
              />
              <Button
                mode="outlined"
                onPress={() => {
                  setYearMin('');
                  setYearMax('');
                }}
                compact
                style={{ minWidth: 60 }}
              >
                Clear
              </Button>
            </View>
          </View>

          {/* Theme Mode */}
          <View style={{ marginTop: 12 }}>
            <Text style={{ marginBottom: 8, color: themeStyles.secondaryTextColor }}>Appearance</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Chip selected={themeMode === 'system'} onPress={() => setThemeMode('system')}>System</Chip>
              <Chip selected={themeMode === 'light'} onPress={() => setThemeMode('light')}>Light</Chip>
              <Chip selected={themeMode === 'dark'} onPress={() => setThemeMode('dark')}>Dark</Chip>
            </View>
          </View>

          {error && (
            <Card style={[styles.errorCard, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
              <Card.Content>
                <Text style={{ color: '#dc2626' }}>{error}</Text>
              </Card.Content>
            </Card>
          )}

          {status && (
            <Card style={[styles.statusCard, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
              <Card.Content>
                <View style={styles.statusContainer}>
                  <ActivityIndicator size="small" color="#3b82f6" />
                  <Text style={{ color: '#1d4ed8', marginLeft: 8 }}>{status}</Text>
                </View>
              </Card.Content>
            </Card>
          )}
        </Card.Content>
      </Card>

      {(response || documents.length > 0) && (
        <View style={styles.resultsContainer}>
          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <Button
              mode={activeTab === 'response' ? 'contained' : 'outlined'}
              onPress={() => setActiveTab('response')}
              style={styles.tabButton}
            >
              🤖 AI Response
            </Button>
            <Button
              mode={activeTab === 'documents' ? 'contained' : 'outlined'}
              onPress={() => setActiveTab('documents')}
              style={styles.tabButton}
            >
              📄 Documents ({Math.min(documents.length, MAX_DOCS)})
            </Button>
            <Button
              mode={activeTab === 'conversation' ? 'contained' : 'outlined'}
              onPress={() => setActiveTab('conversation')}
              style={styles.tabButton}
            >
              💬 Conversation {chatMessages.filter(msg => msg.role !== 'system').length > 0 && `(${chatMessages.filter(msg => msg.role !== 'system').length})`}
            </Button>
          </View>

          {/* Citation Style Selector */}
          <View style={styles.citationContainer}>
            <Text style={[styles.citationLabel, { color: themeStyles.secondaryTextColor }]}>
              Citation style:
            </Text>
            <View style={styles.citationButtons}>
              <Chip
                selected={citationStyle === 'APA'}
                onPress={() => setCitationStyle('APA')}
                style={styles.citationChip}
              >
                APA
              </Chip>
              <Chip
                selected={citationStyle === 'MLA'}
                onPress={() => setCitationStyle('MLA')}
                style={styles.citationChip}
              >
                MLA
              </Chip>
            </View>
          </View>

          {/* Tab Content */}
          {activeTab === 'response' && (
            <Card style={[styles.responseCard, { backgroundColor: themeStyles.cardBackground }]}>
              <Card.Content>
                <View style={styles.responseHeader}>
                  <Title style={[styles.responseTitle, { color: themeStyles.textColor }]}>
                    🤖 AI Analysis
                  </Title>
                  {chatMessages.filter(msg => msg.role !== 'system').length > 2 && (
                    <Chip
                      mode="outlined"
                      textStyle={{ fontSize: 12 }}
                      style={{ backgroundColor: '#dbeafe' }}
                    >
                      {chatMessages.filter(msg => msg.role !== 'system').length} messages
                    </Chip>
                  )}
                </View>
                {response ? (
                  <View style={styles.markdownContainer}>
                    <Markdown
                      style={{
                        body: { color: themeStyles.secondaryTextColor },
                        heading1: { color: themeStyles.textColor },
                        heading2: { color: themeStyles.textColor },
                        heading3: { color: themeStyles.textColor },
                        link: { color: '#3b82f6' },
                      }}
                    >
                      {response}
                    </Markdown>
                  </View>
                ) : (
                  <Text style={[styles.noContent, { color: themeStyles.secondaryTextColor }]}>
                    No response yet...
                  </Text>
                )}
                {isLoading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#3b82f6" />
                    <Text style={{ color: '#3b82f6', marginLeft: 8 }}>
                      Generating response...
                    </Text>
                  </View>
                )}
                
                {response && !isLoading && (
                  <View style={styles.responseActions}>
                    <Button
                      mode="outlined"
                      onPress={() => setActiveTab('conversation')}
                      icon="chat"
                      style={{ marginTop: 16 }}
                    >
                      Continue Conversation
                    </Button>
                  </View>
                )}
              </Card.Content>
            </Card>
          )}

          {activeTab === 'documents' && (
            <View style={styles.documentsContainer}>
              {chatMessages.filter(msg => msg.role !== 'system').length > 2 && (
                <Card style={[styles.conversationContextCard, { backgroundColor: themeStyles.cardBackground }]}>
                  <Card.Content>
                    <Text style={[styles.conversationContextText, { color: themeStyles.secondaryTextColor }]}>
                      💬 This search is part of an ongoing conversation with {chatMessages.filter(msg => msg.role !== 'system').length} messages
                    </Text>
                    <Button
                      mode="outlined"
                      onPress={() => setActiveTab('conversation')}
                      compact
                      style={{ marginTop: 8 }}
                    >
                      View Conversation
                    </Button>
                  </Card.Content>
                </Card>
              )}
              {documents.length > 0 ? (
                documents.slice(0, MAX_DOCS).map((doc, index) => (
                  <Card
                    key={index}
                    style={[styles.documentCard, { backgroundColor: themeStyles.cardBackground }]}
                  >
                    <Card.Content>
                      <View style={styles.documentHeader}>
                        <Title
                          style={[styles.documentTitle, { color: themeStyles.textColor }]}
                          numberOfLines={3}
                        >
                          {doc.title}
                        </Title>
                        <View style={styles.documentActions}>
                          <Chip style={styles.scoreChip}>
                            Score: {doc.score.toFixed(2)}
                          </Chip>
                          <Button
                            mode="outlined"
                            onPress={() => handleOpenUrl(doc.url)}
                            icon="open-in-new"
                            compact
                          >
                            Open
                          </Button>
                        </View>
                      </View>

                      <View style={styles.documentMeta}>
                        <Text style={[styles.documentMetaText, { color: themeStyles.secondaryTextColor }]}>
                          <Text style={{ fontWeight: 'bold' }}>Authors:</Text> {doc.authors}
                        </Text>
                        <Text style={[styles.documentMetaText, { color: themeStyles.secondaryTextColor }]}>
                          <Text style={{ fontWeight: 'bold' }}>Year:</Text> {doc.year}
                        </Text>
                        <Chip style={styles.sourceChip}>{doc.source}</Chip>
                      </View>

                      <Divider style={styles.divider} />

                      <Paragraph style={[styles.documentAbstract, { color: themeStyles.secondaryTextColor }]}>
                        {doc.abstract}
                      </Paragraph>

                      <CitationPreview
                        style={citationStyle}
                        authors={doc.authors}
                        title={doc.title}
                        year={doc.year}
                        source={doc.source}
                        url={doc.url}
                        isDarkMode={isDarkMode}
                      />
                    </Card.Content>
                  </Card>
                ))
              ) : (
                <Card style={[styles.noDocumentsCard, { backgroundColor: themeStyles.cardBackground }]}>
                  <Card.Content>
                    <Text style={[styles.noContent, { color: themeStyles.secondaryTextColor }]}>
                      No documents found yet...
                    </Text>
                  </Card.Content>
                </Card>
              )}
            </View>
          )}

          {activeTab === 'conversation' && (
            <View style={styles.conversationContainer}>
              <ConversationalChat
                messages={chatMessages.filter(msg => msg.role !== 'system')}
                onSendMessage={handleFollowUpQuestion}
                onClearConversation={handleClearConversation}
                isLoading={isLoading}
                isDarkMode={isDarkMode}
                suggestedQuestions={
                  response && documents.length > 0 
                    ? [
                        "Can you explain this in simpler terms?",
                        "What are the key findings?",
                        "How recent is this research?",
                        "Are there any limitations?",
                        "What are the practical applications?",
                        "Can you find more recent papers on this topic?",
                        "What are the main methodologies used?",
                        "Are there conflicting studies?"
                      ]
                    : [
                        "What are the latest developments in machine learning?",
                        "Find papers on climate change adaptation",
                        "Show me research about renewable energy",
                        "What studies exist on quantum computing?",
                        "Find recent papers on healthcare AI",
                        "What research is there on blockchain technology?"
                      ]
                }
              />
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  headerCard: {
    marginBottom: 16,
    elevation: 4,
  },
  headerContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  searchCard: {
    marginBottom: 16,
    elevation: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
  },
  searchButton: {
    minWidth: 120,
  },
  errorCard: {
    marginTop: 16,
    borderWidth: 1,
  },
  statusCard: {
    marginTop: 16,
    borderWidth: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultsContainer: {
    gap: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  tabButton: {
    flex: 1,
    minWidth: 100,
  },
  citationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  citationLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  citationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  citationChip: {
    marginRight: 8,
  },
  responseCard: {
    elevation: 4,
  },
  responseTitle: {
    marginBottom: 16,
  },
  markdownContainer: {
    marginTop: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  noContent: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  documentsContainer: {
    gap: 16,
  },
  documentCard: {
    elevation: 4,
  },
  documentHeader: {
    marginBottom: 12,
  },
  documentTitle: {
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 8,
  },
  documentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreChip: {
    backgroundColor: '#dbeafe',
  },
  documentMeta: {
    marginBottom: 12,
  },
  documentMetaText: {
    fontSize: 14,
    marginBottom: 4,
  },
  sourceChip: {
    backgroundColor: '#d1fae5',
    marginTop: 4,
  },
  divider: {
    marginVertical: 12,
  },
  documentAbstract: {
    fontSize: 14,
    lineHeight: 20,
  },
  noDocumentsCard: {
    elevation: 4,
  },
  conversationContainer: {
    flex: 1,
  },
  responseActions: {
    marginTop: 16,
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  conversationContextCard: {
    marginBottom: 16,
    elevation: 2,
  },
  conversationContextText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
}); 