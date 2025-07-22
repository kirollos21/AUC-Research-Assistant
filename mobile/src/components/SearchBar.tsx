import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, IconButton, useTheme } from 'react-native-paper';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  isLoading?: boolean;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onQueryChange,
  onSearch,
  isLoading = false,
  placeholder = 'Enter your research query...',
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder={placeholder}
          mode="outlined"
          outlineStyle={styles.inputOutline}
          style={styles.input}
          multiline={false}
          onSubmitEditing={onSearch}
          disabled={isLoading}
          right={
            <TextInput.Icon
              icon={isLoading ? 'loading' : 'magnify'}
              onPress={onSearch}
              disabled={isLoading || !query.trim()}
            />
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchContainer: {
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    backgroundColor: 'transparent',
    fontSize: 16,
  },
  inputOutline: {
    borderRadius: 12,
    borderWidth: 0,
  },
});

export default SearchBar; 