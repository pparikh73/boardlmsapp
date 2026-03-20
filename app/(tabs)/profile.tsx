import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Alert,
  useColorScheme,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { getSession, logout, type Session } from '../../services/auth';
import { BRAND, SUPPORT_EMAIL } from '../../constants/skilljar';
import LoginButton from '../../components/LoginButton';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'it', label: 'Italiano' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'ja', label: '日本語' },
] as const;

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [session, setSession] = useState<Session | null>(null);
  const [selectedLang, setSelectedLang] = useState('en');
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    getSession().then(setSession);
  }, []);

  function handleLogoutPress() {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of Board Academy?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            await logout();
            router.replace('/login');
          },
        },
      ],
    );
  }

  const methodLabel: Record<string, string> = {
    customerPartner: 'Customer / Partner',
    employee: 'Employee',
    guest: 'Guest Account',
  };

  const bg = isDark ? '#0d1117' : '#f5f5f5';
  const cardBg = isDark ? '#161b22' : '#ffffff';
  const border = isDark ? '#30363d' : '#e0e0e0';
  const text = isDark ? '#e6edf3' : BRAND.textPrimary;
  const subtext = isDark ? '#8b949e' : BRAND.textSecondary;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Account card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={[styles.avatar, { backgroundColor: BRAND.primary }]}>
            <Text style={styles.avatarText}>
              {session?.email ? session.email[0].toUpperCase() : '?'}
            </Text>
          </View>

          {session?.displayName && (
            <Text style={[styles.displayName, { color: text }]}>{session.displayName}</Text>
          )}
          {session?.email && (
            <Text style={[styles.email, { color: subtext }]}>{session.email}</Text>
          )}

          <View style={[styles.badge, { backgroundColor: isDark ? '#1f2937' : '#e8f4fd' }]}>
            <Text style={[styles.badgeText, { color: BRAND.primary }]}>
              {session ? methodLabel[session.method] ?? session.method : '—'}
            </Text>
          </View>
        </View>

        {/* Language section */}
        <Text style={[styles.sectionHeader, { color: subtext }]}>LANGUAGE</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
          {LANGUAGES.map((lang, index) => (
            <Pressable
              key={lang.code}
              style={[
                styles.langRow,
                index < LANGUAGES.length - 1 && { borderBottomWidth: 1, borderBottomColor: border },
              ]}
              onPress={() => setSelectedLang(lang.code)}
            >
              <Text style={[styles.langLabel, { color: text }]}>{lang.label}</Text>
              {selectedLang === lang.code && (
                <Text style={{ color: BRAND.primary, fontWeight: '700' }}>✓</Text>
              )}
            </Pressable>
          ))}
        </View>

        {/* Support */}
        <Text style={[styles.sectionHeader, { color: subtext }]}>SUPPORT</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={styles.langRow}>
            <Text style={[styles.langLabel, { color: text }]}>Email</Text>
            <Text style={[styles.supportEmail, { color: BRAND.primary }]}>{SUPPORT_EMAIL}</Text>
          </View>
        </View>

        {/* Logout */}
        <View style={styles.logoutSection}>
          <LoginButton
            label="Log Out"
            onPress={handleLogoutPress}
            loading={loggingOut}
            variant="outline"
          />
        </View>

        <Text style={[styles.version, { color: subtext }]}>Board Academy v2.116621.3</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '700',
  },
  displayName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    width: '100%',
  },
  langLabel: {
    fontSize: 15,
  },
  supportEmail: {
    fontSize: 14,
    fontWeight: '500',
  },
  logoutSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
  },
});
