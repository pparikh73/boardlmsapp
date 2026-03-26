import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import BoardLogo from '../../components/BoardLogo';
import LMSWebView from '../../components/LMSWebView';
import { getSession, logout, type Session } from '../../services/auth';
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
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isFocused, setIsFocused] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      getSession().then(setSession);
      return () => setIsFocused(false);
    }, []),
  );

  // Still loading
  if (session === undefined) return null;

  async function handleLogout() {
    await logout();
    setSession(null);
  }

  // Authenticated → show Academy WebView
  if (session) {
    return <LMSWebView url={TAB_URLS.home} onLogout={handleLogout} isFocused={isFocused} />;
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
          <BoardLogo width={52} iconOnly />
          <View style={styles.headerTextCol}>
            <Text style={styles.title}>Board Academy</Text>
            <Text style={styles.subtitle}>Choose how you'd like to sign in</Text>
          </View>
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
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 44,
    gap: 16,
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    fontSize: 26,
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
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: BRAND.mid2,
  },
});
