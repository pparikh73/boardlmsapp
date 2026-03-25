import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Linking,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import BoardLogo from '../components/BoardLogo';
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
        {/* Header: Board logo + title side by side */}
        <View style={styles.header}>
          <BoardLogo width={130} />
          <View style={styles.dividerLine} />
          <View style={styles.headerText}>
            <Text style={styles.title}>Board Academy</Text>
            <Text style={styles.subtitle}>Choose how you'd like to sign in</Text>
          </View>
        </View>

        {/* Auth option cards */}
        <View style={styles.cards}>

          {/* ── Customer / Partner Login — corporate gradient CTA ── */}
          <TouchableOpacity activeOpacity={0.85} onPress={() => handleSSO('customerPartner')}>
            <LinearGradient
              colors={BRAND.gradientPurpleBlue}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientCard}
            >
              <View style={styles.gradientCardInner}>
                <View style={styles.cardBody}>
                  <Text style={styles.gradientCardTitle}>Customer / Partner Login</Text>
                  <Text style={styles.gradientCardSub}>Sign in with your Board account</Text>
                </View>
                <Text style={styles.chevronWhite}>›</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* ── Employee Login ── */}
          <TouchableOpacity
            style={styles.outlineCard}
            activeOpacity={0.8}
            onPress={() => handleSSO('employee')}
          >
            <View style={styles.cardBody}>
              <Text style={styles.outlineCardTitle}>Employee Login</Text>
              <Text style={styles.outlineCardSub}>Sign in via SSO / Boardway</Text>
            </View>
            <Text style={styles.chevronBlue}>›</Text>
          </TouchableOpacity>

          {/* ── Guest Sign-in ── */}
          <TouchableOpacity
            style={styles.outlineCard}
            activeOpacity={0.8}
            onPress={handleGuestLogin}
          >
            <View style={styles.cardBody}>
              <Text style={styles.outlineCardTitle}>Guest Sign-in</Text>
              <Text style={styles.outlineCardSub}>Access as a guest user</Text>
            </View>
            <Text style={styles.chevronBlue}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Support footer */}
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
    paddingTop: 48,
    paddingBottom: 32,
    justifyContent: 'center',
  },

  // ── Header ────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 48,
    gap: 0,
  },
  dividerLine: {
    width: 1,
    height: 48,
    backgroundColor: BRAND.light1,
    marginHorizontal: 20,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: BRAND.dark1,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: BRAND.mid2,
    marginTop: 4,
    lineHeight: 18,
  },

  // ── Cards ─────────────────────────────────────────────────────
  cards: {
    gap: 14,
  },

  // Gradient filled card (Customer / Partner)
  gradientCard: {
    borderRadius: 16,
    // NO padding here — let the inner view handle it
  },
  gradientCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    // NO backgroundColor — shows the gradient through
  },
  gradientCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.white,
    marginBottom: 3,
  },
  gradientCardSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
  },
  chevronWhite: {
    fontSize: 26,
    color: BRAND.white,
    marginLeft: 12,
    fontWeight: '300',
  },

  // Outlined card (Employee / Guest)
  outlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: BRAND.light1,
    backgroundColor: BRAND.white,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  outlineCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.primary,
    marginBottom: 3,
  },
  outlineCardSub: {
    fontSize: 13,
    color: BRAND.mid2,
  },
  chevronBlue: {
    fontSize: 26,
    color: BRAND.primary,
    marginLeft: 12,
    fontWeight: '300',
  },

  // Shared card body
  cardBody: {
    flex: 1,
  },

  // ── Footer ────────────────────────────────────────────────────
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: BRAND.mid2,
  },
});
