import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { logout } from '../../services/auth';
import { BRAND, SUPPORT_EMAIL } from '../../constants/skilljar';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0';

export default function SettingsScreen() {
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
      'To delete your account, please contact our support team. This action is permanent and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Contact Support',
          onPress: () =>
            Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Account%20Deletion%20Request`),
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── ACCOUNT ────────────────────────────────── */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleSignOut} activeOpacity={0.7}>
            <Text style={styles.rowLabel}>Sign Out</Text>
            <Ionicons name="log-out-outline" size={20} color={BRAND.mid1} />
          </TouchableOpacity>
        </View>

        {/* ── LEGAL ──────────────────────────────────── */}
        <Text style={styles.sectionLabel}>LEGAL</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => Linking.openURL('https://www.board.com/privacy-policy')}
          >
            <Text style={styles.rowLabel}>Privacy Policy</Text>
            <Ionicons name="open-outline" size={18} color={BRAND.mid1} />
          </TouchableOpacity>

          <View style={styles.cardDivider} />

          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => Linking.openURL('https://www.board.com/legal-notice')}
          >
            <Text style={styles.rowLabel}>Terms of Service</Text>
            <Ionicons name="open-outline" size={18} color={BRAND.mid1} />
          </TouchableOpacity>

          <View style={styles.cardDivider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>App Version</Text>
            <Text style={styles.rowValue}>{APP_VERSION}</Text>
          </View>
        </View>

        {/* ── DELETE ACCOUNT ─────────────────────────── */}
        <TouchableOpacity
          style={styles.deleteRow}
          activeOpacity={0.7}
          onPress={handleDeleteAccount}
        >
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
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
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: BRAND.mid2,
    marginBottom: 8,
    marginLeft: 4,
  },
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
  rowValue: {
    fontSize: 15,
    color: BRAND.mid2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f0f1f4',
  },
  deleteRow: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  deleteText: {
    fontSize: 15,
    color: '#c0392b',
  },
});
