/**
 * Web platform replacement for LMSWebView.
 * Metro/Expo automatically selects this file over LMSWebView.tsx when
 * bundling for web, so the native react-native-webview import is never touched.
 */
import { View, StyleSheet } from 'react-native';

interface LMSWebViewProps {
  url: string;
  onLogout?: () => void;
}

export default function LMSWebView({ url }: LMSWebViewProps) {
  // onLogout is accepted but unused on web — logout is handled
  // exclusively by the Profile tab's "Log Out" button.
  return (
    <View style={styles.container}>
      <iframe
        src={url}
        style={styles.iframe as React.CSSProperties}
        allow="autoplay; fullscreen"
        referrerPolicy="no-referrer-when-downgrade"
        sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
        title="Board Academy"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iframe: {
    flex: 1,
    width: '100%',
    height: '100%',
    border: 'none',
  },
});
