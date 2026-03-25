import { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { logout } from '../../services/auth';
import { BRAND, SUPPORT_EMAIL } from '../../constants/skilljar';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'it', label: 'Italiano' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'ja', label: '日本語' },
] as const;

type LangCode = (typeof LANGUAGES)[number]['code'];

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [selectedLang, setSelectedLang] = useState<LangCode>('en');
  const [showLangPicker, setShowLangPicker] = useState(false);

  const selectedLangLabel = LANGUAGES.find((l) => l.code === selectedLang)?.label ?? 'English';

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(tabs)');
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
          onPress: () =>
            Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Account%20Deletion%20Request`),
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      {/* Dark navy header — solid, no gradient */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── PREFERENCES ─────────────────────────────── */}
        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <View style={styles.card}>
          {/* Notifications row */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#d1d5db', true: '#34c759' }}
              thumbColor="#ffffff"
              ios_backgroundColor="#d1d5db"
            />
          </View>

          <View style={styles.cardDivider} />

          {/* Language picker */}
          <View style={styles.langSection}>
            <Text style={styles.rowLabel}>Language</Text>
            <TouchableOpacity
              style={styles.langDropdown}
              activeOpacity={0.8}
              onPress={() => setShowLangPicker(!showLangPicker)}
            >
              <Text style={styles.langDropdownText}>{selectedLangLabel}</Text>
              <Ionicons
                name={showLangPicker ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={BRAND.mid1}
              />
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
                      <Ionicons name="checkmark" size={16} color={BRAND.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ── ACCOUNT ──────────────────────────────────── */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleSignOut}>
            <Text style={styles.rowLabel}>Sign Out</Text>
            <Ionicons name="log-out-outline" size={20} color={BRAND.mid1} />
          </TouchableOpacity>
        </View>

        {/* ── DANGER ZONE ─────────────────────────────── */}
        <Text style={[styles.sectionLabel, styles.dangerLabel]}>DANGER ZONE</Text>
        <View style={styles.dangerCard}>
          <Text style={styles.dangerText}>
            Deleting your account is permanent and cannot be undone. All your data will be removed.
          </Text>
          <TouchableOpacity
            style={styles.deleteBtn}
            activeOpacity={0.85}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.deleteBtnText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },

  // Dark solid header — matches reference exactly
  pageHeader: {
    backgroundColor: '#1a2444',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.2,
  },

  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 48,
  },

  // Section labels
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
    marginTop: 12,
  },

  // White preference card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e4ea',
    marginBottom: 24,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: BRAND.dark1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f0f1f4',
    marginHorizontal: 0,
  },

  // Language dropdown
  langSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  langDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: '#fafbfc',
  },
  langDropdownText: {
    fontSize: 16,
    color: BRAND.dark1,
  },
  langOptions: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
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

  // Danger zone card
  dangerCard: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#fcd4d4',
    borderRadius: 14,
    padding: 18,
    marginBottom: 32,
  },
  dangerText: {
    fontSize: 15,
    color: BRAND.mid1,
    lineHeight: 22,
    marginBottom: 18,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d94040',
    borderRadius: 12,
    paddingVertical: 14,
  },
  deleteBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});
