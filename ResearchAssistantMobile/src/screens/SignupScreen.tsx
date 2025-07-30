import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Card, Title, TextInput, Button, Text } from 'react-native-paper';
import { useColorScheme } from 'react-native';

export default function SignupScreen({ navigation }: any) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const handleSignup = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    // Simulate signup - in a real app, you'd call your auth API
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Success', 'Account created successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]);
    }, 1000);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]}>
      <Card style={[styles.card, { backgroundColor: themeStyles.cardBackground }]}>
        <Card.Content style={styles.content}>
          <Title style={[styles.title, { color: themeStyles.textColor }]}>
            Create Account
          </Title>
          <Text style={[styles.subtitle, { color: themeStyles.secondaryTextColor }]}>
            Join our research community
          </Text>

          <View style={styles.nameContainer}>
            <TextInput
              mode="outlined"
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
              style={styles.nameInput}
            />
            <TextInput
              mode="outlined"
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              style={styles.nameInput}
            />
          </View>

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

          <TextInput
            mode="outlined"
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleSignup}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
          >
            Create Account
          </Button>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: themeStyles.secondaryTextColor }]}>
              Already have an account?{' '}
            </Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              style={styles.linkButton}
            >
              Sign In
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
  nameContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  nameInput: {
    flex: 1,
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