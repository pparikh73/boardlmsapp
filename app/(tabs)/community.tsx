import { useRef, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COMMUNITY_BASE_URL, BRAND } from '../../constants/skilljar';

export default function CommunityTab() {
  const webViewRef = useRef<WebView>(null);
  const navigation = useNavigation();

  // Tapping the Community tab while already on it reloads to the home page
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress' as any, () => {
      webViewRef.current?.injectJavaScript(
        `window.location.href = '${COMMUNITY_BASE_URL}'; true;`
      );
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      {/* Minimal nav bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => webViewRef.current?.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={22} color={BRAND.white} />
          <Text style={styles.navBtnText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navBtn}
          onPress={() =>
            webViewRef.current?.injectJavaScript(
              `window.location.href = '${COMMUNITY_BASE_URL}'; true;`
            )
          }
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="home-outline" size={20} color={BRAND.white} />
        </TouchableOpacity>
      </View>

      <WebView
        ref={webViewRef}
        source={{ uri: COMMUNITY_BASE_URL }}
        style={{ flex: 1 }}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        allowsBackForwardNavigationGestures
        setSupportMultipleWindows={false}
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        injectedJavaScriptBeforeContentLoaded={`
          (function() {
            var meta = document.querySelector('meta[name="viewport"]');
            if (meta) {
              meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0';
            } else {
              var m = document.createElement('meta');
              m.name = 'viewport';
              m.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0';
              document.head.appendChild(m);
            }
          })();
          true;
        `}
        injectedJavaScript={`
          (function() {
            // Base styles
            var style = document.createElement('style');
            style.textContent = 'html, body { overflow-x: hidden !important; width: 100% !important; max-width: 100vw !important; }';

            // Ensure iframes (Vimeo, Synthesia, etc.) receive the correct Referer header
            var meta = document.querySelector('meta[name="referrer"]');
            if (meta) {
              meta.setAttribute('content', 'origin');
            } else {
              var refMeta = document.createElement('meta');
              refMeta.name = 'referrer';
              refMeta.content = 'origin';
              document.head.appendChild(refMeta);
            }
            document.head.appendChild(style);

            // Find flex containers that overflow the viewport and force them to wrap (2 per row)
            function fixOverflowingFlex() {
              var vw = window.innerWidth || document.documentElement.clientWidth;
              document.querySelectorAll('*').forEach(function(el) {
                if (el.scrollWidth > vw + 10) {
                  var cs = window.getComputedStyle(el);
                  if ((cs.display === 'flex' || cs.display === 'inline-flex') && cs.flexWrap === 'nowrap') {
                    el.style.setProperty('flex-wrap', 'wrap', 'important');
                    Array.from(el.children).forEach(function(child) {
                      child.style.setProperty('flex', '0 0 50%', 'important');
                      child.style.setProperty('max-width', '50%', 'important');
                      child.style.setProperty('box-sizing', 'border-box', 'important');
                    });
                  }
                }
              });
            }

            fixOverflowingFlex();
            var observer = new MutationObserver(fixOverflowingFlex);
            observer.observe(document.body, { childList: true, subtree: true });
            window.open = function(url) { if (url) window.location.href = url; return null; };
          })();
          true;
        `}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#1a2444',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1a2444',
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navBtnText: {
    color: BRAND.white,
    fontSize: 15,
    fontWeight: '500',
  },
});
