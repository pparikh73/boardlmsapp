import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { getSession, logout, type Session } from '../../services/auth';
import { BRAND, SUPPORT_EMAIL } from '../../constants/skilljar';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'it', label: 'Italiano' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'ja', label: '日本語' },
] as const;

type LangCode = typeof LANGUAGES[number]['code'];

export default function SettingsScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [notifications, setNotifications] = useState(true);
  const [selectedLang, setSelectedLang] = useState<LangCode>('en');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    getSession().then(setSession);
  }, []);

  const methodLabel: Record<string, string> = {
    customerPartner: 'Customer / Partner',
    employee: 'Employee',
    guest: 'Guest Account',
  };

  const initials = session?.email
    ? (session.displayName
        ? session.displayName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : session.email[0].toUpperCase())
    : '?';

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of Board Academy?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await logout();
          router.replace('/login');
        },
      },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'Deleting your account is permanent and cannot be undone. All your data will be removed.\n\nAre you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Account%20Deletion%20Request`),
        },
      ],
    );
  }

  const selectedLangLabel = LANGUAGES.find((l) => l.code === selectedLang)?.label ?? 'English';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={BRAND.gradientPurpleBlue}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.pageHeader}
        >
          <Text style={styles.pageTitle}>Settings</Text>
        </LinearGradient>

        <View style={styles.content}>
          {/* User card */}
          {session && (
            <View style={styles.userCard}>
              <LinearGradient
                colors={BRAND.gradientBlueCyan}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{initials}</Text>
              </LinearGradient>
              <View style={styles.userInfo}>
                {session.displayName && (
                  <Text style={styles.userName}>{session.displayName}</Text>
                )}
                <Text style={styles.userEmail}>{session.email}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {methodLabel[session.method] ?? session.method}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* PREFERENCES */}
          <Text style={styles.sectionLabel}>PREFERENCES</Text>
          <View style={styles.card}>
            {/* Notifications */}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Notifications</Text>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: BRAND.light1, true: BRAND.primary }}
                thumbColor={BRAND.white}
              />
            </View>
            <View style={styles.divider} />
            {/* Language */}
            <View style={styles.langSection}>
              <Text style={styles.rowLabel}>Language</Text>
              <TouchableOpacity
                style={styles.langPicker}
                onPress={() => setShowLangPicker(!showLangPicker)}
              >
                <Text style={styles.langPickerText}>{selectedLangLabel}</Text>
                <Text style={styles.langPickerArrow}>{showLangPicker ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {showLangPicker && (
                <View style={styles.langOptions}>
                  {LANGUAGES.map((lang, i) => (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.langOption,
                        i < LANGUAGES.length - 1 && styles.langOptionBorder,
                      ]}
                      onPress={() => {
                        setSelectedLang(lang.code);
                        setShowLangPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.langOptionText,
                          lang.code === selectedLang && styles.langOptionActive,
                        ]}
                      >
                        {lang.label}
                      </Text>
                      {lang.code === selectedLang && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* ACCOUNT */}
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
            >
              <Text style={styles.rowLabel}>Support</Text>
              <Text style={styles.rowValue}>{SUPPORT_EMAIL}</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.row}
              onPress={() => Linking.openURL('https://www.board.com/privacy-policy')}
            >
              <Text style={styles.rowLabel}>Privacy Policy</Text>
              <Text style={styles.rowChevron}>›</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.row}
              onPress={() => Linking.openURL('https://www.board.com/terms-of-service')}
            >
              <Text style={styles.rowLabel}>Terms of Service</Text>
              <Text style={styles.rowChevron}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Sign Out */}
          <TouchableOpacity
            style={styles.signOutBtn}
            activeOpacity={0.8}
            onPress={handleSignOut}
            disabled={loggingOut}
          >
            <Text style={styles.signOutText}>{loggingOut ? 'Signing out…' : 'Sign Out'}</Text>
          </TouchableOpacity>

          {/* DANGER ZONE */}
          <Text style={[styles.sectionLabel, styles.dangerLabel]}>DANGER ZONE</Text>
          <View style={styles.dangerCard}>
            <Text style={styles.dangerWarning}>
              Deleting your account is permanent and cannot be undone. All your data will be
              removed.
            </Text>
            <TouchableOpacity style={styles.deleteBtn} activeOpacity={0.85} onPress={handleDeleteAccount}>
              <Text style={styles.deleteBtnText}>🗑  Delete Account</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.version}>Board Academy v2.116621.3</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },
  // Page header
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 22,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: BRAND.white,
    letterSpacing: -0.3,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  // User card
  userCard: {
    backgroundColor: BRAND.dark1,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: BRAND.white,
    fontSize: 22,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: BRAND.white,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  userEmail: {
    color: BRAND.light1,
    fontSize: 13,
    marginBottom: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
  },
  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: BRAND.mid2,
    marginBottom: 8,
    marginLeft: 4,
  },
  dangerLabel: {
    color: '#c0392b',
    marginTop: 8,
  },
  // White cards
  card: {
    backgroundColor: BRAND.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e8eaef',
    marginBottom: 20,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: {
    fontSize: 15,
    color: BRAND.dark1,
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 13,
    color: BRAND.primary,
    fontWeight: '500',
  },
  rowChevron: {
    fontSize: 20,
    color: BRAND.mid1,
    fontWeight: '300',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f1f4',
    marginHorizontal: 16,
  },
  // Language picker
  langSection: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 14,
  },
  langPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BRAND.light1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginTop: 10,
    backgroundColor: '#fafbfc',
  },
  langPickerText: {
    fontSize: 15,
    color: BRAND.dark1,
  },
  langPickerArrow: {
    fontSize: 11,
    color: BRAND.mid1,
  },
  langOptions: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: BRAND.light1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: BRAND.white,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  langOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f1f4',
  },
  langOptionText: {
    fontSize: 15,
    color: BRAND.dark2,
  },
  langOptionActive: {
    color: BRAND.primary,
    fontWeight: '700',
  },
  checkmark: {
    color: BRAND.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  // Sign Out button
  signOutBtn: {
    borderWidth: 1.5,
    borderColor: BRAND.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  signOutText: {
    color: BRAND.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  // Danger zone
  dangerCard: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#fcd4d4',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  dangerWarning: {
    fontSize: 14,
    color: BRAND.dark2,
    lineHeight: 20,
    marginBottom: 16,
  },
  deleteBtn: {
    backgroundColor: '#e83943',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: BRAND.white,
    fontWeight: '700',
    fontSize: 15,
  },
  // Version
  version: {
    textAlign: 'center',
    color: BRAND.mid2,
    fontSize: 12,
  },
});
