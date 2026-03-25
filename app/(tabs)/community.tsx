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
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import LMSWebView from '../../components/LMSWebView';
import BoardLogo from '../../components/BoardLogo';
import { BRAND, COMMUNITY_SECTIONS, SUPPORT_EMAIL } from '../../constants/skilljar';
import { logout } from '../../services/auth';

export default function CommunityScreen() {
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  if (activeUrl) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND.dark1 }}>
        <StatusBar barStyle="light-content" />
        {/* Back header */}
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
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={BRAND.gradientPurpleBlue}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <View style={styles.headerRow}>
            <View style={styles.logo}>
              <BoardLogo width={90} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Board Community</Text>
              <Text style={styles.headerSubtitle}>Connect, learn & collaborate</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Section label */}
        <Text style={styles.sectionLabel}>EXPLORE</Text>

        {/* 2-column card grid */}
        <View style={styles.grid}>
          {COMMUNITY_SECTIONS.map((section, index) => {
            const isLastOdd =
              COMMUNITY_SECTIONS.length % 2 !== 0 &&
              index === COMMUNITY_SECTIONS.length - 1;

            return (
              <TouchableOpacity
                key={section.id}
                style={[styles.card, isLastOdd && styles.cardWide]}
                activeOpacity={0.8}
                onPress={() => setActiveUrl(section.url)}
              >
                <Text style={styles.cardEmoji}>{section.emoji}</Text>
                <Text style={styles.cardTitle}>{section.title}</Text>
                <Text style={styles.cardDesc}>{section.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>Need help? {SUPPORT_EMAIL}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_GAP = 12;
const CARD_PADDING = 16;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },
  // Header
  header: {
    paddingHorizontal: CARD_PADDING,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    marginRight: 14,
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: BRAND.white,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 3,
  },
  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: BRAND.mid2,
    marginTop: 20,
    marginBottom: 10,
    marginHorizontal: CARD_PADDING,
  },
  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: CARD_PADDING,
    gap: CARD_GAP,
  },
  card: {
    width: `${(100 - CARD_GAP) / 2}%` as any,
    backgroundColor: BRAND.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e8eaef',
    shadowColor: BRAND.dark1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardWide: {
    width: '100%',
  },
  cardEmoji: {
    fontSize: 30,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND.dark1,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: BRAND.mid2,
    lineHeight: 17,
  },
  // Footer
  footer: {
    textAlign: 'center',
    color: BRAND.mid2,
    fontSize: 13,
    marginTop: 24,
    marginBottom: 32,
  },
  // WebView back header
  webviewHeader: {
    backgroundColor: BRAND.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
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
