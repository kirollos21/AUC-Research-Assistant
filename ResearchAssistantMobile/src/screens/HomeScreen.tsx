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
import { Document, CitationStyle, StreamingResponse } from '../types/search';
import CitationPreview from '../components/CitationPreview';

const MAX_DOCS = 10;

export default function HomeScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [citationStyle, setCitationStyle] = useState<CitationStyle>('APA');
  const [activeTab, setActiveTab] = useState<'response' | 'documents'>('response');

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
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
        }
      );
    } catch (err) {
      console.error(err);
      setError('An error occurred with the connection.');
      setIsLoading(false);
    }
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
              onSubmitEditing={handleSearch}
              multiline={false}
            />
            <Button
              mode="contained"
              onPress={handleSearch}
              loading={isLoading}
              disabled={isLoading}
              style={styles.searchButton}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
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
                <Title style={[styles.responseTitle, { color: themeStyles.textColor }]}>
                  🤖 AI Analysis
                </Title>
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
              </Card.Content>
            </Card>
          )}

          {activeTab === 'documents' && (
            <View style={styles.documentsContainer}>
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
    gap: 8,
  },
  tabButton: {
    flex: 1,
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
}); 