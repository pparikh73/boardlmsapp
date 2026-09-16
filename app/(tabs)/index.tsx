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
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router, useNavigation } from 'expo-router';
import LMSWebView, { LMSWebViewHandle } from '../../components/LMSWebView';
import { getSession, getCachedSession, logout, type Session } from '../../services/auth';
import { BRAND, AUTH_URLS, TAB_URLS, SUPPORT_EMAIL, ACADEMY_DIAGNOSTICS } from '../../constants/skilljar';

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

  // TEMPORARY instrumentation (ACADEMY_DIAGNOSTICS). Five builds of dp arithmetic
  // said this screen fits and the device disagreed every time, so measure instead
  // of modelling: onLayout gives the real rendered height of each block and
  // onContentSizeChange vs the ScrollView's own onLayout height answers the only
  // question that matters — does the content exceed the viewport, and by how much.
  const logLayout = (name: string) => (e: LayoutChangeEvent) => {
    if (!ACADEMY_DIAGNOSTICS) return;
    const { height, y } = e.nativeEvent.layout;
    console.log(`[BC LAYOUT] ${name} h=${Math.round(height)} y=${Math.round(y)}`);
  };

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
  // edges omits 'bottom': this screen sits inside the tab navigator, whose
  // tabBarStyle already reserves 56 + insets.bottom with a matching paddingBottom.
  // Leaving edges unset made SafeAreaView apply the bottom inset a second time,
  // costing up to 48dp of content height on gesture-nav Android for nothing.
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onLayout={logLayout('scrollview-viewport')}
        onContentSizeChange={(w, h) => {
          if (!ACADEMY_DIAGNOSTICS) return;
          console.log(`[BC LAYOUT] content h=${Math.round(h)}`);
        }}
      >
        {/* Header */}
        <View style={styles.header} onLayout={logLayout('header')}>
          <Image
            source={require('../../assets/Board Academy logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
            onLayout={logLayout('logo')}
          />
          <Text style={styles.subtitle}>Choose how you'd like to sign in</Text>
        </View>

        {/* Auth cards */}
        <View style={styles.cards} onLayout={logLayout('cards')}>
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
          onLayout={logLayout('footer')}
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
    // justifyContent:'center' is deliberately GONE. While the content fits it is
    // harmless, but the moment it exceeds the scroll view — a large system font
    // scale is enough — centring splits the overflow across BOTH ends, so the
    // first card is pushed toward the middle and the top becomes unreachable.
    // That is the "cards below the fold" report: not the content being too tall
    // by much, but the overflow being distributed instead of starting at the top.
    // Top-aligned means every card is reachable at any font scale, and once the
    // two Android reclaims below apply there is room to spare anyway.
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLogo: {
    // Requested as "replace width:260 / maxHeight:110" — those were the 2.116621.34
    // values; .35 had already moved to height:72 + aspectRatio. Applied to the
    // current style with the same intent: a relative width so it scales with the
    // screen, capped at 260, and a taller ceiling so it does not read small.
    //
    // aspectRatio is the asset's own (1162x686). With width 80% of the content box
    // the derived height still exceeds maxHeight on every phone, so maxHeight binds
    // and Yoga back-solves the width — the logo renders about 102x60.
    width: '70%',
    maxWidth: 240,
    maxHeight: 60,
    aspectRatio: 1162 / 686,
    alignSelf: 'center',
    marginBottom: 8,
  },
  subtitle: {
    // Android adds top+bottom font padding to every Text by default, which is
    // invisible in a dp model but real on device (~63dp across this screen's
    // 8 Text nodes). No-op on iOS.
    includeFontPadding: false,
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
    // Android adds top+bottom font padding to every Text by default, which is
    // invisible in a dp model but real on device (~63dp across this screen's
    // 8 Text nodes). No-op on iOS.
    includeFontPadding: false,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  cardSub: {
    // Android adds top+bottom font padding to every Text by default, which is
    // invisible in a dp model but real on device (~63dp across this screen's
    // 8 Text nodes). No-op on iOS.
    includeFontPadding: false,
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
    // Android adds top+bottom font padding to every Text by default, which is
    // invisible in a dp model but real on device (~63dp across this screen's
    // 8 Text nodes). No-op on iOS.
    includeFontPadding: false,
    fontSize: 14,
    color: BRAND.mid2,
  },
});
