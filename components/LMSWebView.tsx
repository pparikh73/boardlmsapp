import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, ActivityIndicator, StyleSheet, TouchableOpacity, Text, Linking, Platform } from 'react-native';
import { WebView, WebViewNavigation, WebViewRequest } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { BRAND, WEBVIEW_USER_AGENT, ALLOWED_WEBVIEW_DOMAINS } from '../constants/skilljar';

interface LMSWebViewProps {
  url: string;
  onLogout?: () => void;
  isFocused?: boolean;
  showNavBar?: boolean;
}

export interface LMSWebViewHandle {
  goHome: () => void;
}

const LMSWebView = forwardRef<LMSWebViewHandle, LMSWebViewProps>(
  ({ url, onLogout, isFocused = true, showNavBar = false }, ref) => {
    const webViewRef = useRef<WebView>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useImperativeHandle(ref, () => ({
      goHome: () => {
        webViewRef.current?.injectJavaScript(`window.location.href = '${url}'; true;`);
      },
    }));

    // Pause all videos when the tab loses focus to free GPU/decoder memory
    useEffect(() => {
      if (!isFocused) {
        webViewRef.current?.injectJavaScript(
          `document.querySelectorAll('video').forEach(function(v){try{v.pause();}catch(e){}});true;`
        );
      }
    }, [isFocused]);

    function handleNavigationChange(nav: WebViewNavigation) {
      if (nav.url.includes('/auth/logout') || (nav.url.includes('/auth/domain') && nav.url.includes('/login'))) {
        onLogout?.();
      }
    }

    function handleShouldStartLoadWithRequest(request: WebViewRequest): boolean {
      const { url } = request;
      if (!url.startsWith('http')) {
        Linking.openURL(url).catch(() => {});
        return false;
      }
      // Restrict to Board/Skilljar domains so Apple rates the app 4+ (not 17+)
      if (ALLOWED_WEBVIEW_DOMAINS.some((domain) => url.includes(domain))) return true;
      Linking.openURL(url).catch(() => {});
      return false;
    }

    return (
      <View style={styles.container}>
        {showNavBar && (
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
              onPress={() => webViewRef.current?.injectJavaScript(`window.location.href = '${url}'; true;`)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="home-outline" size={20} color={BRAND.white} />
            </TouchableOpacity>
          </View>
        )}
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
          setSupportMultipleWindows={false}
          allowsBackForwardNavigationGestures
          userAgent={WEBVIEW_USER_AGENT}
          onContentProcessDidTerminate={() => webViewRef.current?.reload()}
          onRenderProcessGone={() => webViewRef.current?.reload()}
          injectedJavaScript={`
            (function() {
              var style = document.createElement('style');
              var rules = ['.sj-powered-by { display: none !important; }'];
              // overflow-x:hidden on body can collapse flex/grid children to min-content
              // width on some Android WebView versions; iOS needs it to stop pan-bounce.
              if (${Platform.OS === 'ios'}) {
                rules.push('body { overflow-x: hidden !important; }');
              }
              style.innerHTML = rules.join('');
              document.head.appendChild(style);

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

              // Force inline playback on all videos (prevents iOS full-screen takeover)
              function addPlaysinline() {
                document.querySelectorAll('video').forEach(function(v) {
                  v.setAttribute('playsinline', '');
                  v.setAttribute('webkit-playsinline', '');
                });
              }
              addPlaysinline();
              var plObserver = new MutationObserver(addPlaysinline);
              plObserver.observe(document.body, { childList: true, subtree: true });

              window.open = function(url, target, features) {
                if (url) { window.location.href = url; }
                return null;
              };

              // Make site header scroll with content — runs after site scroll handlers reapply fixed
              function unstickHeaders() {
                document.querySelectorAll('header, nav').forEach(function(el) {
                  var pos = window.getComputedStyle(el).position;
                  if (pos === 'fixed' || pos === 'sticky') {
                    el.style.setProperty('position', 'relative', 'important');
                    el.style.setProperty('top', 'auto', 'important');
                  }
                  // Watch each element's style/class for scroll-handler changes
                  if (!el._bcObserver) {
                    el._bcObserver = true;
                    new MutationObserver(function() {
                      var p = window.getComputedStyle(el).position;
                      if (p === 'fixed' || p === 'sticky') {
                        el.style.setProperty('position', 'relative', 'important');
                        el.style.setProperty('top', 'auto', 'important');
                      }
                    }).observe(el, { attributes: true, attributeFilter: ['style', 'class'] });
                  }
                });
              }
              unstickHeaders();
              window.addEventListener('scroll', unstickHeaders, { passive: true });
              new MutationObserver(unstickHeaders).observe(document.body, { childList: true });

              // Hide language name text in header (keep globe icon)
              function hideLanguageText() {
                document.querySelectorAll('header *').forEach(function(el) {
                  if (el.children.length === 0 && /^(English|Français|Deutsch|Español|Italiano|Português|简体中文|日本語|한국어)$/.test(el.textContent.trim())) {
                    el.style.setProperty('display', 'none', 'important');
                  }
                });
              }
              hideLanguageText();
              new MutationObserver(hideLanguageText).observe(document.body, { childList: true, subtree: true });

              // Only release video memory if the user actually played the video
              var userPlayedVideos = new WeakSet();
              document.addEventListener('play', function(e) {
                if (e.target && e.target.tagName === 'VIDEO') {
                  userPlayedVideos.add(e.target);
                }
              }, true);
              document.addEventListener('ended', function(e) {
                var v = e.target;
                if (v && v.tagName === 'VIDEO' && userPlayedVideos.has(v)) {
                  var poster = v.poster;
                  v.src = '';
                  v.load();
                  if (poster) v.poster = poster;
                  userPlayedVideos.delete(v);
                }
              }, true);
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
);

export default LMSWebView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
