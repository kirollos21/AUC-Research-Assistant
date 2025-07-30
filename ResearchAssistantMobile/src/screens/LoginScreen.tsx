import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Card, Title, TextInput, Button, Text } from 'react-native-paper';
import { useColorScheme } from 'react-native';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const themeStyles = isDarkMode ? {
    backgroundColor: '#0f172a',
    cardBackground: '#1e293b',
    textColor: '#f8fafc',
    secondaryTextColor: '#cbd5e1',
  } : {
    backgroundColor: '#f8fafc',
    cardBackground: '#ffffff',
    textColor: '#0f172a',
    secondaryTextColor: '#64748b',
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    // Simulate login - in a real app, you'd call your auth API
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Success', 'Login successful!', [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]);
    }, 1000);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]}>
      <Card style={[styles.card, { backgroundColor: themeStyles.cardBackground }]}>
        <Card.Content style={styles.content}>
          <Title style={[styles.title, { color: themeStyles.textColor }]}>
            Welcome Back
          </Title>
          <Text style={[styles.subtitle, { color: themeStyles.secondaryTextColor }]}>
            Sign in to your account
          </Text>

          <TextInput
            mode="outlined"
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <TextInput
            mode="outlined"
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
          >
            Sign In
          </Button>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: themeStyles.secondaryTextColor }]}>
              Don't have an account?{' '}
            </Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Signup')}
              style={styles.linkButton}
            >
              Sign Up
            </Button>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    elevation: 8,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  linkButton: {
    marginLeft: -8,
  },
}); 