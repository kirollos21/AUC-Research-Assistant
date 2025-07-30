import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Card, IconButton } from 'react-native-paper';
import { Clipboard } from '../utils/clipboard';
import { CitationStyle } from '../types/search';

interface CitationPreviewProps {
  style: CitationStyle;
  authors: string;
  title: string;
  year: string;
  source: string;
  url: string;
  isDarkMode?: boolean;
}

function formatAuthorsForAPA(authors: string): string {
  return authors
    .split(', ')
    .map((author) => {
      const nameParts = author.trim().split(' ');
      if (nameParts.length === 1) return nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      const initials = nameParts
        .slice(0, -1)
        .map((part) => part.charAt(0) + '.')
        .join(' ');
      return `${lastName}, ${initials}`;
    })
    .join(', ');
}

function formatAuthorsForMLA(authors: string): string {
  const authorList = authors.split(', ');
  if (authorList.length === 0) return '';
  if (authorList.length === 1) return authorList[0];

  const firstAuthor = authorList[0];
  const otherAuthors = authorList.slice(1);
  const parts = firstAuthor.trim().split(' ');
  const formattedFirst =
    parts.length > 1
      ? `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}`
      : firstAuthor;

  return `${formattedFirst}, ${otherAuthors.join(', ')}`;
}

function formatAPA(
  authors: string,
  title: string,
  year: string,
  source: string,
  url: string
) {
  const apaAuthors = formatAuthorsForAPA(authors);
  return `${apaAuthors} (${year}). ${title}. ${source}. ${url}`;
}

function formatMLA(
  authors: string,
  title: string,
  year: string,
  source: string,
  url: string
) {
  const mlaAuthors = formatAuthorsForMLA(authors);
  return `${mlaAuthors}. "${title}." ${source}, ${year}, ${url}.`;
}

export default function CitationPreview({
  style,
  authors,
  title,
  year,
  source,
  url,
  isDarkMode = false,
}: CitationPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const text =
    style === 'APA'
      ? formatAPA(authors, title, year, source, url)
      : formatMLA(authors, title, year, source, url);

  const handleCopy = async () => {
    try {
      await Clipboard.setString(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy citation to clipboard');
    }
  };

  const theme = isDarkMode ? {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
    textColor: '#f9fafb',
    secondaryTextColor: '#d1d5db',
  } : {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    textColor: '#111827',
    secondaryTextColor: '#6b7280',
  };

  return (
    <Card
      style={{
        marginTop: 16,
        backgroundColor: theme.backgroundColor,
        borderColor: theme.borderColor,
        borderWidth: 1,
      }}
    >
      <TouchableOpacity onPress={() => setIsOpen(!isOpen)}>
        <Card.Title
          title={`Citation (${style})`}
          titleStyle={{ color: theme.textColor }}
          right={(props) => (
            <IconButton
              {...props}
              icon={isOpen ? 'chevron-up' : 'chevron-down'}
              iconColor={theme.secondaryTextColor}
            />
          )}
        />
      </TouchableOpacity>

      {isOpen && (
        <Card.Content>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Text
              style={{
                flex: 1,
                fontSize: 14,
                color: theme.secondaryTextColor,
                lineHeight: 20,
              }}
            >
              {text}
            </Text>
            <TouchableOpacity onPress={handleCopy} style={{ marginLeft: 8 }}>
              <IconButton
                icon="content-copy"
                iconColor={copied ? '#10b981' : theme.secondaryTextColor}
                size={20}
              />
            </TouchableOpacity>
          </View>
          {copied && (
            <Text style={{ color: '#10b981', fontSize: 12, marginTop: 4 }}>
              Copied!
            </Text>
          )}
        </Card.Content>
      )}
    </Card>
  );
} 