import { useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, SafeAreaView, Pressable, Text } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { router, useLocalSearchParams } from 'expo-router';
import { BRAND, SKILLJAR_CONTENT_URL } from '../constants/skilljar';
import { saveSessionByMethod } from '../services/auth';

export default function SSOWebViewScreen() {
  const { url, method } = useLocalSearchParams<{ url: string; method: string }>();
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  async function handleNavigationChange(nav: WebViewNavigation) {
    // Auth is complete when we land on the content domain and no longer on an /auth/ path
    if (
      !authed &&
      nav.url.startsWith(SKILLJAR_CONTENT_URL) &&
      !nav.url.includes('/auth/')
    ) {
      setAuthed(true);
      await saveSessionByMethod(method as 'customerPartner' | 'employee');
      router.replace('/(tabs)');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </View>
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={handleNavigationChange}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        allowsInlineMediaPlayback
      />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={BRAND.primary} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: { paddingVertical: 8 },
  backText: { fontSize: 16, color: BRAND.primary, fontWeight: '500' },
  webview: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
