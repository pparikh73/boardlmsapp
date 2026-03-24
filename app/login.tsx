import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Linking,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { BRAND, SUPPORT_EMAIL, AUTH_URLS } from '../constants/skilljar';

export default function LoginScreen() {
  function handleSSO(method: 'customerPartner' | 'employee') {
    router.push({ pathname: '/sso-webview', params: { url: AUTH_URLS[method], method } });
  }

  function handleGuestLogin() {
    router.push('/guest-login');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header: logo + title side by side */}
        <View style={styles.header}>
          <Image
            source={require('../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.headerText}>
            <Text style={styles.title}>Board Academy</Text>
            <Text style={styles.subtitle}>Choose how you'd like to sign in</Text>
          </View>
        </View>

        {/* Auth cards */}
        <View style={styles.cards}>
          {/* Customer / Partner Login — primary CTA with corporate gradient */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleSSO('customerPartner')}
          >
            <LinearGradient
              colors={BRAND.gradientPurpleBlue}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardInner}>
                <View>
                  <Text style={styles.cardTitleLight}>Customer / Partner Login</Text>
                  <Text style={styles.cardSubtitleLight}>Sign in with your Board account</Text>
                </View>
                <Text style={styles.chevronLight}>›</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Employee Login */}
          <TouchableOpacity
            style={styles.cardOutline}
            activeOpacity={0.8}
            onPress={() => handleSSO('employee')}
          >
            <View style={styles.cardInner}>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitleDark}>Employee Login</Text>
                <Text style={styles.cardSubtitleDark}>Sign in via SSO / Boardway</Text>
              </View>
              <Text style={styles.chevronDark}>›</Text>
            </View>
          </TouchableOpacity>

          {/* Guest Sign-in */}
          <TouchableOpacity
            style={styles.cardOutline}
            activeOpacity={0.8}
            onPress={handleGuestLogin}
          >
            <View style={styles.cardInner}>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitleDark}>Guest Sign-in</Text>
                <Text style={styles.cardSubtitleDark}>Access as a guest user</Text>
              </View>
              <Text style={styles.chevronDark}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <TouchableOpacity
          style={styles.footer}
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
        >
          <Text style={styles.footerText}>Need help? {SUPPORT_EMAIL}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BRAND.white,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  // Header row
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 32,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: BRAND.dark1,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    color: BRAND.mid2,
    marginTop: 4,
    lineHeight: 20,
  },
  // Auth cards
  cards: {
    gap: 14,
  },
  // Gradient card (primary CTA)
  cardGradient: {
    borderRadius: 16,
    padding: 1,
  },
  // Plain outlined card
  cardOutline: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: BRAND.light1,
    backgroundColor: BRAND.white,
    overflow: 'hidden',
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 15,
    backgroundColor: BRAND.white,
  },
  cardBody: {
    flex: 1,
  },
  cardTitleLight: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.white,
    marginBottom: 3,
  },
  cardSubtitleLight: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
  },
  cardTitleDark: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.primary,
    marginBottom: 3,
  },
  cardSubtitleDark: {
    fontSize: 13,
    color: BRAND.mid2,
  },
  chevronLight: {
    fontSize: 24,
    color: BRAND.white,
    fontWeight: '300',
    marginLeft: 12,
  },
  chevronDark: {
    fontSize: 24,
    color: BRAND.primary,
    fontWeight: '300',
    marginLeft: 12,
  },
  // Footer
  footer: {
    marginTop: 36,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: BRAND.mid2,
  },
});
