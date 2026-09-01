import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router, useNavigation } from 'expo-router';
import LMSWebView, { LMSWebViewHandle } from '../../components/LMSWebView';
import { getSession, getCachedSession, logout, type Session } from '../../services/auth';
import { BRAND, AUTH_URLS, TAB_URLS, SUPPORT_EMAIL } from '../../constants/skilljar';

// Colors for the auth cards — derived from Board brand assets
const CARD_COLORS = {
  customerBg: 'rgba(37, 62, 125, 0.08)',
  customerBorder: 'rgba(37, 62, 125, 0.2)',
  employeeBg: 'rgba(243, 147, 37, 0.1)',
  employeeBorder: 'rgba(243, 147, 37, 0.3)',
  employeeText: '#c8700a',
  guestBg: 'rgba(0, 175, 148, 0.1)',
  guestBorder: 'rgba(0, 175, 148, 0.3)',
  guestText: '#0a8a75',
};

export default function AcademyTab() {
  // Seeded from the synchronous cache, not undefined. getSession() always hits
  // SecureStore asynchronously, so after an SSO login — where sso-webview saves the
  // session and replaces to (tabs) — this screen used to focus holding its stale
  // null, render the landing text panel with the three cards, and only swap to the
  // WebView once the async read resolved. That flash is TJ's "text panel briefly
  // pops open", and it recurred on every focus where the state was stale.
  const [session, setSession] = useState<Session | null | undefined>(getCachedSession);
  const [isFocused, setIsFocused] = useState(true);
  const lmsRef = useRef<LMSWebViewHandle>(null);
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      // Read the cache SYNCHRONOUSLY on every focus, not just at mount. The .36
      // fix seeded useState from the cache, but this screen is a persistent tab
      // that never unmounts, so that initialiser runs once and the state stayed
      // stale. After a guest or SSO login the cache is already correct (saveSession
      // sets it before its await), so this lands the right view in the same frame
      // the screen regains focus — no window where the landing panel can render.
      const cached = getCachedSession();
      if (cached !== undefined) setSession(cached);
      // Reconcile with storage, but only commit a genuinely different value:
      // getSession() JSON.parses a fresh object every call, so assigning it
      // unconditionally re-rendered on every focus for no reason, which is itself
      // a flash contributor during a transition.
      getSession().then((fresh) => {
        setSession((prev) =>
          JSON.stringify(prev ?? null) === JSON.stringify(fresh ?? null) ? prev : fresh,
        );
      });
      return () => setIsFocused(false);
    }, []),
  );

  // Tapping the Academy tab while already on it returns to the home page
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress' as any, () => {
      lmsRef.current?.goHome();
    });
    return unsubscribe;
  }, [navigation]);

  // Still loading
  if (session === undefined) return null;

  async function handleLogout() {
    await logout();
    setSession(null);
  }

  // Authenticated → show Academy WebView with safe area so Skilljar nav clears the status bar
  if (session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1a2444' }}>
        <StatusBar barStyle="light-content" />
        <LMSWebView ref={lmsRef} url={TAB_URLS.home} onLogout={handleLogout} isFocused={isFocused} showNavBar />
      </SafeAreaView>
    );
  }

  // Not authenticated → show Academy landing with login cards
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/Board Academy logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.subtitle}>Choose how you'd like to sign in</Text>
        </View>

        {/* Auth cards */}
        <View style={styles.cards}>
          <TouchableOpacity
            style={[styles.card, {
              backgroundColor: CARD_COLORS.customerBg,
              borderColor: CARD_COLORS.customerBorder,
            }]}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/sso-webview', params: { url: AUTH_URLS.customerPartner, method: 'customerPartner' } })}
          >
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: BRAND.dark1 }]}>Customer / Partner Login</Text>
              <Text style={styles.cardSub}>Sign in with your Board account</Text>
            </View>
            <Text style={[styles.chevron, { color: BRAND.mid2 }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, {
              backgroundColor: CARD_COLORS.employeeBg,
              borderColor: CARD_COLORS.employeeBorder,
            }]}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/sso-webview', params: { url: AUTH_URLS.employee, method: 'employee' } })}
          >
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: CARD_COLORS.employeeText }]}>Employee Login</Text>
              <Text style={styles.cardSub}>Sign in via SSO / Boardway</Text>
            </View>
            <Text style={[styles.chevron, { color: CARD_COLORS.employeeText }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, {
              backgroundColor: CARD_COLORS.guestBg,
              borderColor: CARD_COLORS.guestBorder,
            }]}
            activeOpacity={0.8}
            onPress={() => router.push('/guest-login')}
          >
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: CARD_COLORS.guestText }]}>Guest Sign-in</Text>
              <Text style={styles.cardSub}>Access as a guest user</Text>
            </View>
            <Text style={[styles.chevron, { color: CARD_COLORS.guestText }]}>›</Text>
          </TouchableOpacity>
        </View>

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
    // flexGrow alone gives justifyContent:'center' a full-height box to centre
    // within when the content fits. minHeight:'100%' was added in 2.116621.33
    // for an overlap it did not fix and is redundant with flexGrow here, so it
    // is removed rather than left as a second, differently-resolved height
    // constraint on the same box.
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLogo: {
    // Requested as "replace width:260 / maxHeight:110" — those were the 2.116621.34
    // values; .35 had already moved to height:72 + aspectRatio. Applied to the
    // current style with the same intent: a relative width so it scales with the
    // screen, capped at 260, and a taller ceiling so it does not read small.
    //
    // aspectRatio is the asset's own (1162x686). With width 80% of the content box
    // the derived height still exceeds maxHeight on every phone, so maxHeight binds
    // and Yoga back-solves the width — the logo renders about 135x80.
    width: '70%',
    maxWidth: 240,
    maxHeight: 80,
    aspectRatio: 1162 / 686,
    alignSelf: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: BRAND.mid2,
    lineHeight: 18,
  },
  cards: {
    gap: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  cardSub: {
    fontSize: 13,
    color: BRAND.mid2,
  },
  chevron: {
    fontSize: 26,
    marginLeft: 12,
    fontWeight: '300',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: BRAND.mid2,
  },
});
