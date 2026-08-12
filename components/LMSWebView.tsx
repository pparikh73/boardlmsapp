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
      // Only restrict top-level (user-initiated) navigation. This callback also fires for
      // iframe sub-resource loads (e.g. Synthesia's video player embed) — blocking those
      // sent them out to the system browser instead of playing inline, since the video
      // vendor's domain isn't in the allowlist. Apple's "unrestricted web access" concern
      // is about the user browsing to arbitrary sites, not first-party embedded content.
      if ((request as any).isTopFrame === false) return true;
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
          // false — needed for the SCORM lesson video's async player to call .play()
          // after a tap. Confirmed via diagnostic that the "black screen on load" this
          // previously caused is the SCORM player's own loading state (rendering black
          // before it inserts its <video> element) — content behavior, not something
          // this setting controls.
          mediaPlaybackRequiresUserAction={false}
          setSupportMultipleWindows={false}
          allowsBackForwardNavigationGestures
          userAgent={WEBVIEW_USER_AGENT}
          onContentProcessDidTerminate={() => webViewRef.current?.reload()}
          onRenderProcessGone={() => webViewRef.current?.reload()}
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

              // mediaPlaybackRequiresUserAction is false so lesson video players can call
              // .play() asynchronously after a tap — block any .play() call before the
              // user's first touch so this doesn't reintroduce autoplay on page load.
              try {
                var originalPlay = HTMLMediaElement.prototype.play;
                var userInteracted = false;
                document.addEventListener('touchstart', function() {
                  userInteracted = true;
                }, { once: true, capture: true });
                HTMLMediaElement.prototype.play = function() {
                  if (!userInteracted) {
                    return Promise.resolve();
                  }
                  return originalPlay.apply(this, arguments);
                };
              } catch (e) {}
            })();
            true;
          `}
          injectedJavaScript={`
            (function() {
              // Every independent fix below is wrapped in its own try/catch so one
              // throwing (e.g. an unexpected DOM shape on a given page) can't silently
              // abort the rest of the script.
              try {
                var style = document.createElement('style');
                var rules = ['.sj-powered-by { display: none !important; }'];
                // overflow-x:hidden on body can collapse flex/grid children to min-content
                // width on some Android WebView versions; iOS needs it to stop pan-bounce.
                if (${Platform.OS === 'ios'}) {
                  rules.push('body { overflow-x: hidden !important; }');
                }
                style.innerHTML = rules.join('');
                document.head.appendChild(style);
              } catch (e) {}

              try {
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
              } catch (e) {}

              try {
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
              } catch (e) {}

              try {
                window.open = function(url, target, features) {
                  if (url) { window.location.href = url; }
                  return null;
                };
              } catch (e) {}

              try {
                // Find the site's pinned top bar by actual computed position, not tag name —
                // some sites style a <div> as the header instead of using a semantic <header>
                // tag, which silently breaks tag-based selectors like 'header, nav'.
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

                function runFixes() {
                  try { unstickHeader(); } catch (e) {}
                }
                runFixes();
                // Scroll listener catches the site re-applying fixed positioning via inline
                // style on scroll (a childList mutation observer alone wouldn't see that).
                window.addEventListener('scroll', runFixes, { passive: true });
                new MutationObserver(runFixes).observe(document.body, { childList: true, subtree: true });
                // The site can re-apply fixed positioning via a style/class change with no
                // DOM node insertion/removal, which neither observer above would catch, and
                // exactly when it does this varies between loads (network/font/image timing)
                // — poll fast for the first ~10s, then keep polling slowly for a full minute
                // so a late re-fix still gets caught instead of racing a fixed-length window.
                var bcPollCount = 0;
                var bcPollTimer = setInterval(function() {
                  runFixes();
                  bcPollCount++;
                  if (bcPollCount > 33) clearInterval(bcPollTimer);
                }, 300);
                var bcSlowPollCount = 0;
                var bcSlowPollTimer = setInterval(function() {
                  runFixes();
                  bcSlowPollCount++;
                  if (bcSlowPollCount > 25) clearInterval(bcSlowPollTimer);
                }, 2000);
              } catch (e) {}

              try {
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
              } catch (e) {}

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
