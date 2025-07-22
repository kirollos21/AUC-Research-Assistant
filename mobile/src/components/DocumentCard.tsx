import React from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { Card, Title, Paragraph, Chip, IconButton, useTheme } from 'react-native-paper';
import { DocumentResult } from '@/types';
import { generateCitation } from '@/utils/citation';

interface DocumentCardProps {
  document: DocumentResult;
  citationStyle: 'APA' | 'MLA';
  onShare?: (document: DocumentResult) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  citationStyle,
  onShare,
}) => {
  const theme = useTheme();

  const handleOpenLink = () => {
    if (document.url) {
      Linking.openURL(document.url);
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(document);
    }
  };

  const citation = generateCitation(document, citationStyle);

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.header}>
          <Title style={styles.title} numberOfLines={3}>
            {document.title}
          </Title>
          <View style={styles.actions}>
            <IconButton
              icon="open-in-new"
              size={20}
              onPress={handleOpenLink}
              disabled={!document.url}
            />
            {onShare && (
              <IconButton
                icon="share-variant"
                size={20}
                onPress={handleShare}
              />
            )}
          </View>
        </View>

        <View style={styles.metadata}>
          <Chip icon="account" style={styles.chip}>
            {document.authors}
          </Chip>
          <Chip icon="calendar" style={styles.chip}>
            {document.year}
          </Chip>
          <Chip icon="database" style={styles.chip}>
            {document.source}
          </Chip>
          <Chip icon="star" style={styles.chip}>
            {document.score.toFixed(2)}
          </Chip>
        </View>

        <Paragraph style={styles.abstract} numberOfLines={4}>
          {document.abstract}
        </Paragraph>

        <View style={styles.citationContainer}>
          <Paragraph style={styles.citationLabel}>
            {citationStyle} Citation:
          </Paragraph>
          <Paragraph style={styles.citation} numberOfLines={3}>
            {citation}
          </Paragraph>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  chip: {
    marginRight: 4,
    marginBottom: 4,
  },
  abstract: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  citationContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  citationLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#666',
  },
  citation: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
});

export default DocumentCard; 