import { useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { BRAND, AUTH_URLS } from '../constants/skilljar';

interface LMSWebViewProps {
  url: string;
  onLogout?: () => void;
}

export default function LMSWebView({ url, onLogout }: LMSWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  function handleNavigationChange(nav: WebViewNavigation) {
    // Detect if Skilljar redirected to the logout endpoint
    if (nav.url.includes('/auth/logout') || nav.url.includes('/auth/domain') && nav.url.includes('/login')) {
      onLogout?.();
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    webViewRef.current?.reload();
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => {
          setLoading(false);
          setRefreshing(false);
        }}
        onNavigationStateChange={handleNavigationChange}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        // Hide the browser scrollbar on Android for a cleaner look
        overScrollMode="never"
        // Allow inline video playback (for course videos)
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        // Inject CSS to hide Skilljar's "Powered by Skilljar" footer
        injectedJavaScript={`
          (function() {
            var style = document.createElement('style');
            style.innerHTML = '.sj-powered-by { display: none !important; }';
            document.head.appendChild(style);
          })();
          true;
        `}
      />
      {loading && !refreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={BRAND.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
