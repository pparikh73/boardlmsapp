import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, ActivityIndicator, StyleSheet, TouchableOpacity, Text, Linking, Platform, Alert } from 'react-native';
import { WebView, WebViewNavigation, WebViewRequest, WebViewMessageEvent } from 'react-native-webview';
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

    function handleMessage(event: WebViewMessageEvent) {
      const data = event.nativeEvent.data;
      if (data.startsWith('LANG_DIAG::')) {
        Alert.alert('Language text diagnostic', data.slice('LANG_DIAG::'.length));
      }
    }

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
          onMessage={handleMessage}
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

              // Find the site's pinned top bar by actual computed position, not tag name —
              // some sites style a <div> as the header instead of using a semantic <header> tag,
              // which silently breaks tag-based selectors like 'header, nav'.
              var bcKnownHeader = null;
              function findStickyHeader() {
                if (bcKnownHeader && document.body.contains(bcKnownHeader)) {
                  var kcs = window.getComputedStyle(bcKnownHeader);
                  if (kcs.position === 'fixed' || kcs.position === 'sticky') return bcKnownHeader;
                }
                var all = document.body.getElementsByTagName('*');
                for (var i = 0; i < all.length; i++) {
                  var el = all[i];
                  var cs = window.getComputedStyle(el);
                  if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
                  var rect = el.getBoundingClientRect();
                  if (rect.top <= 5 && rect.width >= window.innerWidth * 0.7 && rect.height > 0 && rect.height < 200) {
                    bcKnownHeader = el;
                    return el;
                  }
                }
                return null;
              }

              function unstickHeader() {
                var header = findStickyHeader();
                if (!header) return;
                header.style.setProperty('position', 'relative', 'important');
                header.style.setProperty('top', 'auto', 'important');
              }

              // Hide language name text wherever it appears — searched independently of
              // the sticky-header detection so a miss on one doesn't block the other.
              var LANG_RE = /^(English|Français|Deutsch|Español|Italiano|Português|简体中文|日本語|한국어)$/;
              function hideLanguageText() {
                var all = document.body.getElementsByTagName('*');
                for (var i = 0; i < all.length; i++) {
                  var el = all[i];
                  if (el.children.length === 0 && LANG_RE.test((el.textContent || '').trim())) {
                    el.style.setProperty('display', 'none', 'important');
                  }
                }
              }

              function runFixes() {
                unstickHeader();
                hideLanguageText();
              }
              runFixes();
              // Scroll listener catches the site re-applying fixed positioning via inline
              // style on scroll (a childList mutation observer alone wouldn't see that).
              window.addEventListener('scroll', runFixes, { passive: true });
              new MutationObserver(runFixes).observe(document.body, { childList: true, subtree: true });

              // TEMPORARY DIAGNOSTIC — find where "English" actually lives (top doc, shadow
              // DOM, or an iframe) since three blind DOM-search attempts have all failed to
              // find/hide it. Remove once the real location is known.
              setTimeout(function() {
                function findMatches(root, path, results) {
                  var elements = root.querySelectorAll('*');
                  for (var i = 0; i < elements.length; i++) {
                    var el = elements[i];
                    if (el.children.length === 0 && /English/i.test((el.textContent || '').trim())) {
                      results.push(path + ' <' + el.tagName + ' class="' + (el.className || '') + '">: "' + (el.textContent || '').trim().slice(0, 40) + '"');
                    }
                    if (el.shadowRoot) {
                      findMatches(el.shadowRoot, path + ' > shadow(' + el.tagName + ')', results);
                    }
                  }
                }
                var results = [];
                findMatches(document, 'top-doc', results);

                var iframeInfo = [];
                document.querySelectorAll('iframe').forEach(function(f, idx) {
                  var accessible = false;
                  try {
                    var doc = f.contentDocument;
                    accessible = !!doc;
                    if (doc) findMatches(doc, 'iframe[' + idx + ']', results);
                  } catch (e) {
                    accessible = false;
                  }
                  iframeInfo.push('iframe[' + idx + '] src=' + (f.src || '(none)').slice(0, 60) + ' accessible=' + accessible);
                });

                var report = 'Matches (' + results.length + '):\\n' + results.join('\\n') +
                  '\\n\\nIframes (' + iframeInfo.length + '):\\n' + iframeInfo.join('\\n');

                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage('LANG_DIAG::' + report);
                }
              }, 2500);

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
