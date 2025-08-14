import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Card,
  Text,
  TextInput,
  Button,
  Chip,
  ActivityIndicator,
  useTheme,
} from 'react-native-paper';
import { ChatMessage } from '../types/search';

interface ConversationalChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onClearConversation?: () => void;
  isLoading: boolean;
  isDarkMode: boolean;
  suggestedQuestions?: string[];
}

export default function ConversationalChat({
  messages,
  onSendMessage,
  onClearConversation,
  isLoading,
  isDarkMode,
  suggestedQuestions = [
    "Can you explain this in simpler terms?",
    "What are the key findings?",
    "How recent is this research?",
    "Are there any limitations?",
    "What are the practical applications?",
    "Can you find more recent papers on this topic?"
  ]
}: ConversationalChatProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const theme = useTheme();

  const themeStyles = isDarkMode ? {
    backgroundColor: '#0f172a',
    cardBackground: '#1e293b',
    textColor: '#f8fafc',
    secondaryTextColor: '#cbd5e1',
    borderColor: '#334155',
    userBubble: '#3b82f6',
    assistantBubble: '#374151',
  } : {
    backgroundColor: '#f8fafc',
    cardBackground: '#ffffff',
    textColor: '#0f172a',
    secondaryTextColor: '#64748b',
    borderColor: '#e2e8f0',
    userBubble: '#3b82f6',
    assistantBubble: '#f1f5f9',
  };

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = inputMessage.trim();
    if (trimmed && !isLoading) {
      onSendMessage(trimmed);
      setInputMessage('');
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    onSendMessage(question);
  };

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isCloseToBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 20;
    setShowScrollButton(!isCloseToBottom);
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';
    
    return (
      <View
        key={index}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isUser ? themeStyles.userBubble : themeStyles.assistantBubble,
              alignSelf: isUser ? 'flex-end' : 'flex-start',
            }
          ]}
        >
          <Text
            style={[
              styles.messageText,
              {
                color: isUser ? '#ffffff' : themeStyles.textColor,
              }
            ]}
          >
            {message.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      enabled={true}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={false}
        keyboardShouldPersistTaps="handled"
        onScroll={handleScroll}
      >
        {messages.length > 0 && onClearConversation && (
          <View style={styles.conversationHeader}>
            <View style={styles.conversationInfo}>
              <Text style={[styles.conversationTitle, { color: themeStyles.textColor }]}>
                Research Assistant Chat
              </Text>
              <Text style={[styles.conversationSubtitle, { color: themeStyles.secondaryTextColor }]}>
                {messages.length} messages • Ask follow-up questions
              </Text>
            </View>
            <Button
              mode="outlined"
              onPress={onClearConversation}
              compact
              style={styles.clearButton}
            >
              Clear
            </Button>
          </View>
        )}
        
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: themeStyles.textColor }]}>
              Start Your Research Conversation
            </Text>
            <Text style={[styles.emptySubtitle, { color: themeStyles.secondaryTextColor }]}>
              Ask me anything about your research topic and I'll help you find and analyze relevant academic literature.
            </Text>
            
            <View style={styles.suggestedQuestionsContainer}>
              <Text style={[styles.suggestedTitle, { color: themeStyles.secondaryTextColor }]}>
                Try asking about:
              </Text>
              <View style={styles.suggestedGrid}>
                {suggestedQuestions.map((question, index) => (
                  <Chip
                    key={index}
                    mode="outlined"
                    onPress={() => handleSuggestedQuestion(question)}
                    style={styles.suggestedChip}
                    textStyle={[styles.suggestedChipText, { color: themeStyles.textColor }]}
                  >
                    {question}
                  </Chip>
                ))}
              </View>
            </View>
          </View>
        ) : (
          <>
            {messages.length > 6 && (
              <View style={styles.conversationSummary}>
                <Text style={[styles.summaryText, { color: themeStyles.secondaryTextColor }]}>
                  💬 Conversation with {messages.length} messages
                </Text>
                <Button
                  mode="text"
                  onPress={() => setShowAllMessages(!showAllMessages)}
                  compact
                  style={styles.showAllButton}
                >
                  {showAllMessages ? 'Show Recent' : 'Show All'}
                </Button>
              </View>
            )}
            {(showAllMessages ? messages : messages.slice(-6)).map((message, index) => renderMessage(message, showAllMessages ? index : index + Math.max(0, messages.length - 6)))}
          </>
        )}

        {isLoading && (
          <View style={[styles.messageContainer, styles.assistantMessageContainer]}>
            <View
              style={[
                styles.messageBubble,
                {
                  backgroundColor: themeStyles.assistantBubble,
                  alignSelf: 'flex-start',
                }
              ]}
            >
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color={themeStyles.secondaryTextColor} />
                <Text style={[styles.typingText, { color: themeStyles.secondaryTextColor }]}>
                  Research Assistant is thinking...
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {showScrollButton && messages.length > 3 && (
        <Button
          mode="contained"
          onPress={scrollToBottom}
          style={styles.scrollToBottomButton}
          icon="arrow-down"
          compact
        >
          Latest
        </Button>
      )}

      <Card style={[styles.inputContainer, { backgroundColor: themeStyles.cardBackground }]}>
        <Card.Content style={styles.inputContent}>
          <View style={styles.inputRow}>
            <TextInput
              mode="outlined"
              value={inputMessage}
              onChangeText={setInputMessage}
              placeholder="Ask a follow-up question..."
              style={styles.textInput}
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
              disabled={isLoading}
            />
            <Button
              mode="contained"
              onPress={handleSend}
              disabled={!inputMessage.trim() || isLoading}
              style={styles.sendButton}
              loading={isLoading}
            >
              Send
            </Button>
          </View>
          <Text style={[styles.inputHint, { color: themeStyles.secondaryTextColor }]}>
            💡 Tip: Ask specific questions about the research findings, methodology, or request more recent papers
          </Text>
        </Card.Content>
      </Card>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 100, // Add extra padding at bottom for input area
    flexGrow: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  suggestedQuestionsContainer: {
    width: '100%',
  },
  suggestedTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  suggestedGrid: {
    gap: 8,
  },
  suggestedChip: {
    marginBottom: 8,
  },
  suggestedChipText: {
    fontSize: 12,
  },
  messageContainer: {
    marginBottom: 12,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  assistantMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    margin: 16,
    marginTop: 8,
    elevation: 4,
  },
  inputContent: {
    paddingVertical: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
  },
  sendButton: {
    minWidth: 80,
  },
  inputHint: {
    fontSize: 11,
    marginTop: 8,
    fontStyle: 'italic',
  },
  conversationSummary: {
    alignSelf: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  summaryText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  conversationInfo: {
    flex: 1,
    marginRight: 10,
  },
  conversationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  conversationSubtitle: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  clearButton: {
    marginLeft: 10,
  },
  showAllButton: {
    marginTop: 8,
  },
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    zIndex: 10,
  },
}); 