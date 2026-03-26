import { useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, SafeAreaView, Pressable, Text } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { router, useLocalSearchParams } from 'expo-router';
import { BRAND, SKILLJAR_CONTENT_URL, COMMUNITY_BASE_URL } from '../constants/skilljar';
import { saveSessionByMethod } from '../services/auth';

export default function SSOWebViewScreen() {
  const { url, method } = useLocalSearchParams<{ url: string; method: string }>();
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  async function handleNavigationChange(nav: WebViewNavigation) {
    if (authed) return;

    // Community auth (Azure AD B2C) — complete when back on community.board.com
    // and no longer in the /entry/ auth flow or on the B2C login domain
    if (method === 'community') {
      if (
        nav.url.startsWith(COMMUNITY_BASE_URL) &&
        !nav.url.includes('/entry/')
      ) {
        setAuthed(true);
        router.replace('/(tabs)/community');
      }
      return;
    }

    // Academy auth (Skilljar SSO) — complete when on academy.board.com outside /auth/
    if (
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
        setSupportMultipleWindows={false}
        injectedJavaScript={`
          (function() {
            var _orig = window.open;
            window.open = function(url, target, features) {
              if (url) { window.location.href = url; }
              return null;
            };
          })();
          true;
        `}
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
