import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Linking,
  useColorScheme,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import LoginButton from '../components/LoginButton';
import { loginWithGuest } from '../services/auth';
import { BRAND, SKILLJAR_BASE_URL, SKILLJAR_DOMAIN } from '../constants/skilljar';

export default function GuestLoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    const result = await loginWithGuest(email.trim(), password);
    setLoading(false);
    if (result.success) {
      router.replace('/(tabs)');
    } else {
      setError(result.error ?? 'Sign in failed.');
    }
  }

  function handleForgotPassword() {
    Linking.openURL(`${SKILLJAR_BASE_URL}/auth/domain/${SKILLJAR_DOMAIN}/forgot-password`);
  }

  const inputBg = isDark ? '#161b22' : '#f5f5f5';
  const inputBorder = isDark ? '#30363d' : '#e0e0e0';
  const textColor = isDark ? '#e6edf3' : BRAND.textPrimary;

  return (
    <SafeAreaView style={[styles.safe, isDark && styles.safeDark]}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back button */}
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backText, { color: BRAND.primary }]}>← Back</Text>
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, isDark && styles.titleDark]}>Guest Sign In</Text>
            <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
              Sign in with your Board Academy guest account
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={[styles.label, isDark && styles.labelDark]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={isDark ? '#484f58' : '#aaa'}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              textContentType="emailAddress"
              autoComplete="email"
            />

            <Text style={[styles.label, isDark && styles.labelDark, styles.passwordLabel]}>Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={isDark ? '#484f58' : '#aaa'}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
              textContentType="password"
              autoComplete="password"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <LoginButton
              label="Sign In"
              onPress={handleSignIn}
              loading={loading}
              variant="primary"
              style={styles.signInButton}
            />

            <Pressable onPress={handleForgotPassword} style={styles.forgotLink}>
              <Text style={[styles.forgotText, { color: BRAND.primary }]}>Forgot password?</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  safeDark: {
    backgroundColor: '#0d1117',
  },
  kav: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  backButton: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    paddingTop: 32,
    paddingBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: BRAND.textPrimary,
  },
  titleDark: {
    color: '#e6edf3',
  },
  subtitle: {
    fontSize: 14,
    color: BRAND.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  subtitleDark: {
    color: '#8b949e',
  },
  form: {
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.textPrimary,
    marginBottom: 6,
  },
  labelDark: {
    color: '#c9d1d9',
  },
  passwordLabel: {
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 4,
  },
  errorText: {
    color: '#cf222e',
    fontSize: 13,
    marginTop: 8,
    marginBottom: 4,
  },
  signInButton: {
    marginTop: 20,
  },
  forgotLink: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
