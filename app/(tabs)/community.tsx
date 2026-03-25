import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import BoardLogo from '../../components/BoardLogo';
import LMSWebView from '../../components/LMSWebView';
import { BRAND, AUTH_URLS, COMMUNITY_SECTIONS, SUPPORT_EMAIL } from '../../constants/skilljar';
import { logout } from '../../services/auth';

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

export default function CommunityTab() {
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  async function handleLogout() {
    await logout();
    router.replace('/(tabs)');
  }

  if (activeUrl) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND.dark1 }}>
        <StatusBar barStyle="light-content" />
        <View style={styles.webviewHeader}>
          <TouchableOpacity onPress={() => setActiveUrl(null)} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
            <Text style={styles.backLabel}>Community</Text>
          </TouchableOpacity>
        </View>
        <LMSWebView url={activeUrl} onLogout={handleLogout} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <BoardLogo width={52} iconOnly />
          <View style={styles.headerTextCol}>
            <Text style={styles.title}>Board Community</Text>
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

        {/* EXPLORE divider */}
        <View style={styles.exploreDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.exploreLabel}>EXPLORE</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* 2-column card grid */}
        <View style={styles.grid}>
          {COMMUNITY_SECTIONS.map((section, index) => {
            const isLastOdd =
              COMMUNITY_SECTIONS.length % 2 !== 0 &&
              index === COMMUNITY_SECTIONS.length - 1;
            return (
              <TouchableOpacity
                key={section.id}
                style={[styles.gridCard, isLastOdd && styles.gridCardWide]}
                activeOpacity={0.8}
                onPress={() => setActiveUrl(section.url)}
              >
                <Text style={styles.gridEmoji}>{section.emoji}</Text>
                <Text style={styles.gridTitle}>{section.title}</Text>
                <Text style={styles.gridDesc}>{section.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

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
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 32,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 36,
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
  // Auth cards
  cards: {
    gap: 14,
    marginBottom: 32,
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
  // Explore divider
  exploreDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e4ea',
  },
  exploreLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: BRAND.mid2,
  },
  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: '47.5%',
    backgroundColor: BRAND.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e4ea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  gridCardWide: {
    width: '100%',
  },
  gridEmoji: {
    fontSize: 28,
    marginBottom: 10,
  },
  gridTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND.dark1,
    marginBottom: 4,
  },
  gridDesc: {
    fontSize: 12,
    color: BRAND.mid2,
    lineHeight: 17,
  },
  // WebView back header
  webviewHeader: {
    backgroundColor: BRAND.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 26,
    color: BRAND.white,
    fontWeight: '300',
    lineHeight: 28,
    marginRight: 4,
  },
  backLabel: {
    fontSize: 16,
    color: BRAND.white,
    fontWeight: '600',
  },
});
