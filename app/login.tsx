import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Linking,
  Pressable,
  useColorScheme,
  Platform,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import LoginButton from '../components/LoginButton';
import { BRAND, SUPPORT_EMAIL, AUTH_URLS } from '../constants/skilljar';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  function handleSSO(method: 'customerPartner' | 'employee') {
    router.push({ pathname: '/sso-webview', params: { url: AUTH_URLS[method], method } });
  }

  function handleGuestLogin() {
    router.push('/guest-login');
  }

  function handleSignUp() {
    Linking.openURL('https://academy.board.com');
  }

  function handleSupport() {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  }

  return (
    <SafeAreaView style={[styles.safe, isDark && styles.safeDark]}>
      <View style={styles.container}>
        {/* Header / Branding */}
        <View style={styles.header}>
          <Image
            source={require('../assets/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={[styles.title, isDark && styles.titleDark]}>Board Academy</Text>
          <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
            Your learning journey starts here
          </Text>
        </View>

        {/* Auth Buttons */}
        <View style={styles.buttons}>
          <LoginButton
            label="Customer / Partner Login"
            onPress={() => handleSSO('customerPartner')}
            variant="primary"
          />

          <View style={styles.divider}>
            <View style={[styles.dividerLine, isDark && styles.dividerLineDark]} />
            <Text style={[styles.dividerText, isDark && styles.dividerTextDark]}>or</Text>
            <View style={[styles.dividerLine, isDark && styles.dividerLineDark]} />
          </View>

          <LoginButton
            label="Sign in with Guest Account"
            onPress={handleGuestLogin}
            variant="outline"
          />

          <LoginButton
            label="Employee Login"
            onPress={() => handleSSO('employee')}
            variant="ghost"
            style={styles.employeeButton}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable onPress={handleSignUp}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text style={styles.footerLink}>Sign Up</Text>
            </Text>
          </Pressable>

          <Pressable onPress={handleSupport} style={styles.supportLink}>
            <Text style={[styles.footerText, styles.supportText]}>
              Need help? {SUPPORT_EMAIL}
            </Text>
          </Pressable>
        </View>
      </View>
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
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'android' ? 24 : 0,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
    borderRadius: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: BRAND.primary,
    letterSpacing: -0.5,
  },
  titleDark: {
    color: '#58b8f0',
  },
  subtitle: {
    fontSize: 15,
    color: BRAND.textSecondary,
    marginTop: 8,
  },
  subtitleDark: {
    color: '#8b949e',
  },
  buttons: {
    gap: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerLineDark: {
    backgroundColor: '#30363d',
  },
  dividerText: {
    fontSize: 13,
    color: BRAND.textSecondary,
  },
  dividerTextDark: {
    color: '#8b949e',
  },
  employeeButton: {
    marginTop: 4,
  },
  footer: {
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
  },
  footerText: {
    fontSize: 14,
    color: BRAND.textSecondary,
    textAlign: 'center',
  },
  footerLink: {
    color: BRAND.primary,
    fontWeight: '600',
  },
  supportLink: {
    marginTop: 2,
  },
  supportText: {
    fontSize: 13,
  },
});
