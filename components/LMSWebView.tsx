import { useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView, WebViewNavigation, WebViewRequest } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import { BRAND, AUTH_URLS } from '../constants/skilljar';

interface LMSWebViewProps {
  url: string;
  onLogout?: () => void;
}

export default function LMSWebView({ url, onLogout }: LMSWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Allow-list of URL prefixes that should stay inside the WebView.
  // Anything outside this list opens in SFSafariViewController (in-app browser).
  const IN_APP_PREFIXES = [
    'https://academy.board.com',
    'https://accounts.skilljar.com',
    'https://community.board.com',
    'https://www.board.com',
    'https://board.com',
  ];

  function isInAppUrl(url: string): boolean {
    return IN_APP_PREFIXES.some((prefix) => url.startsWith(prefix));
  }

  function handleNavigationChange(nav: WebViewNavigation) {
    // Detect if Skilljar redirected to the logout endpoint
    if (nav.url.includes('/auth/logout') || (nav.url.includes('/auth/domain') && nav.url.includes('/login'))) {
      onLogout?.();
    }
  }

  function handleShouldStartLoadWithRequest(request: WebViewRequest): boolean {
    const { url } = request;
    // Let normal in-app URLs through
    if (isInAppUrl(url)) return true;
    // Non-http(s) links (tel:, mailto:, etc.) — let the OS handle them
    if (!url.startsWith('http')) return false;
    // Truly external URL → open in SFSafariViewController, stay in app
    WebBrowser.openBrowserAsync(url, { dismissButtonStyle: 'close' });
    return false;
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
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        overScrollMode="never"
        directionalLockEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={true}
        // KEY FIX: prevents window.open() / target="_blank" from launching Safari.
        // WKWebView will navigate the current view instead of opening a new window.
        setSupportMultipleWindows={false}
        // Prevent horizontal scroll; hide Skilljar "Powered by" footer;
        // override window.open to stay in-app as a belt-and-suspenders measure.
        injectedJavaScript={`
          (function() {
            var style = document.createElement('style');
            style.innerHTML = [
              '.sj-powered-by { display: none !important; }',
              'html, body { max-width: 100% !important; overflow-x: hidden !important; }'
            ].join('');
            document.head.appendChild(style);

            // Redirect window.open() calls to same-window navigation so they
            // stay inside the WebView rather than launching Mobile Safari.
            var _originalOpen = window.open;
            window.open = function(url, target, features) {
              if (url) { window.location.href = url; }
              return null;
            };
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
