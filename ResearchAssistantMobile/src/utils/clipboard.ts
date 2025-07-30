// Simple clipboard utility for Expo Go compatibility
import { Platform, Alert } from 'react-native';

export const Clipboard = {
  setString: async (text: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        // Use web clipboard API
        await navigator.clipboard.writeText(text);
      } else {
        // For mobile, show a message with the text
        Alert.alert(
          'Citation Copied',
          `Citation copied to clipboard:\n\n${text}`,
          [
            { text: 'OK', style: 'default' }
          ]
        );
      }
    } catch (error) {
      console.warn('Clipboard not available:', error);
      // Fallback: show the text in an alert
      Alert.alert(
        'Citation Text',
        `Here's your citation:\n\n${text}`,
        [
          { text: 'OK', style: 'default' }
        ]
      );
    }
  },

  getString: async (): Promise<string> => {
    try {
      if (Platform.OS === 'web') {
        return await navigator.clipboard.readText();
      } else {
        return '';
      }
    } catch (error) {
      console.warn('Clipboard read not available:', error);
      return '';
    }
  }
}; 