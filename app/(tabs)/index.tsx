import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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

  // Not authenticated → show Academy landing with login cards.
  //
  // Rebuilt in 2.116621.44. There is deliberately NO ScrollView here: .35–.43
  // each trimmed dp off a scrolling layout and the cards still ended up needing
  // a scroll, so the structure is now one flex column that is exactly the height
  // of the area the tab navigator gives it. Content cannot be "below the fold"
  // because there is no fold — the only element that absorbs or releases space
  // is the spacer, and the cards are pinned at flexShrink: 0.
  //
  // edges omits 'bottom': this screen sits inside the tab navigator, whose
  // tabBarStyle already reserves 56 + insets.bottom with a matching paddingBottom.
  // Leaving edges unset made SafeAreaView apply the bottom inset a second time,
  // costing up to 48dp of content height on gesture-nav Android for nothing.
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Top section — logo + subtitle. Sized as a fraction of the container,
            never in dp, and the first content to give up space under pressure. */}
        <View style={styles.top}>
          <Image
            source={require('../../assets/Board Academy logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.subtitle}>Choose how you'd like to sign in</Text>
        </View>

        {/* The only element that takes up slack. Grows on a tall screen to push
            the cards down; collapses to zero on a short one before any real
            content has to shrink. This replaces justifyContent: 'center', which
            split overflow across both ends and made the top unreachable. */}
        <View style={styles.spacer} />

        {/* Auth cards — flexShrink: 0, so these three are always fully on screen. */}
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BRAND.white,
  },

  // Replaces the ScrollView entirely. flex: 1 inside a flex: 1 SafeAreaView means
  // this box IS the usable screen area — which also makes its height *definite*,
  // and that is what lets the percentage flexBasis on `top` resolve. (A percentage
  // height against an auto-height parent resolves to auto in Yoga and would have
  // silently fallen back to the image's intrinsic size.)
  container: {
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Top section: takes only what it needs, and needs only a share of the screen.
  // flexGrow: 0 so it never claims slack (that is the spacer's job), flexShrink: 1
  // so it is the first thing to give way, flexBasis as a percentage so the same
  // style works on a 480dp and a 900dp device with no dp constant to re-tune.
  top: {
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: '22%',
    alignItems: 'center',
  },
  logo: {
    // No height, no aspectRatio, no maxHeight — flex: 1 gives it whatever `top`
    // has left after the subtitle, and resizeMode="contain" letterboxes the asset
    // (1162x686) inside that box at any size without distortion or overflow.
    // This is the whole point of the rebuild: the logo can no longer be "too tall"
    // because its height is a consequence of the layout, not an input to it.
    flex: 1,
    width: '100%',
    maxWidth: 240,
    alignSelf: 'center',
    marginBottom: 8,
  },
  subtitle: {
    // Android adds top+bottom font padding to every Text by default, which is
    // invisible in a dp model but real on device. No-op on iOS.
    includeFontPadding: false,
    flexShrink: 0,
    fontSize: 13,
    color: BRAND.mid2,
    lineHeight: 18,
    textAlign: 'center',
  },

  // The single slack absorber. flexBasis: 0 so it contributes no intrinsic height;
  // it exists only to hold the gap between the header and the cards open when
  // there is room, and to vanish first when there is not.
  spacer: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },

  // flexShrink: 0 is the guarantee in the brief: whatever else gives way, all
  // three cards keep their full height and stay on screen.
  cards: {
    flexShrink: 0,
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
    includeFontPadding: false,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  cardSub: {
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
    flexShrink: 0,
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    includeFontPadding: false,
    fontSize: 14,
    color: BRAND.mid2,
  },
});
