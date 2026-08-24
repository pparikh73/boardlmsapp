import { useRef, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, StatusBar, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewRequest } from 'react-native-webview';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  COMMUNITY_BASE_URL,
  COMMUNITY_BACKGROUND,
  COMMUNITY_DIAGNOSTICS,
  BRAND,
  WEBVIEW_USER_AGENT,
  ALLOWED_WEBVIEW_DOMAINS,
} from '../../constants/skilljar';
import { COMMUNITY_DIAGNOSTIC_JS } from '../../constants/communityDiagnostic';

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

  function handleShouldStartLoadWithRequest(request: WebViewRequest): boolean {
    const { url } = request;
    // Only restrict top-level (user-initiated) navigation — see LMSWebView.tsx for why
    // iframe sub-resource loads must be allowed regardless of domain.
    if ((request as any).isTopFrame === false) return true;
    if (!url.startsWith('http')) {
      Linking.openURL(url).catch(() => {});
      return false;
    }
    // Restrict to Board/Community domains so Apple rates the app 4+ (not 17+)
    if (ALLOWED_WEBVIEW_DOMAINS.some((domain) => url.includes(domain))) return true;
    Linking.openURL(url).catch(() => {});
    return false;
  }

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
        // styles.webview carries backgroundColor — react-native-webview has no
        // backgroundColor *prop*, it reads style.backgroundColor and forwards it to
        // the native setter, which sets _webView.scrollView.backgroundColor (see
        // RNCWebViewImpl.m). That scroll view's backdrop is the white that shows
        // through wherever the page itself doesn't paint.
        style={styles.webview}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        overScrollMode="never"
        directionalLockEnabled
        // iOS-only: suppresses rubber-banding past the content edge. Note this was
        // originally added to fix the white area on the homepage and did NOT work —
        // that area was real horizontal overflow, not a bounce artifact, and bounces
        // has no effect on scrolling within genuinely-wider-than-viewport content.
        // The overflow-x:clip rule below is the actual fix. Kept because suppressing
        // rubber-band is still the behavior we want, not because it fixes anything.
        bounces={false}
        allowsBackForwardNavigationGestures
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        setSupportMultipleWindows={false}
        userAgent={WEBVIEW_USER_AGENT}
        // Diagnostic overlay posts its readings here too, so they land in the JS
        // console for anyone attached with a debugger, not only on screen.
        onMessage={(event) => {
          if (!COMMUNITY_DIAGNOSTICS) return;
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data && data.bcDiag) console.log('[BC DIAG]\n' + data.bcDiag);
          } catch {}
        }}
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
          })();
          true;
        `}
        injectedJavaScript={`
          (function() {
            // Every independent fix below is wrapped in its own try/catch so one
            // throwing can't silently abort the rest of the script.
            try {
              // Base styles, plus the horizontal-overflow clamp.
              //
              // overflow-x:HIDDEN is still not usable here: per the CSS overflow spec,
              // setting overflow-x:hidden while overflow-y is visible coerces overflow-y
              // to 'auto', which turns body into a scroll container and changes
              // containing-block/percentage resolution for descendants. That side effect
              // — not the clipping itself — is what collapsed this site's hero/header
              // flex layout into a single column in the earlier attempt.
              //
              // overflow-x:CLIP has no such side effect: it creates no scroll container,
              // so overflow-y stays visible and layout is untouched. It removes the
              // horizontal scrollable area outright, which directionalLockEnabled and
              // bounces={false} cannot do — neither stops legitimate scrolling when the
              // content is genuinely wider than the viewport, which is the case on the
              // homepage. Requires iOS 16+ (WKWebView), hence the feature test.
              var style = document.createElement('style');
              var rules = ['html, body { width: 100% !important; max-width: 100vw !important; }'];
              if (window.CSS && CSS.supports && CSS.supports('overflow-x', 'clip')) {
                rules.push('html, body { overflow-x: clip !important; }');
              }
              style.textContent = rules.join('');
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
              // Find flex containers that overflow the viewport and force them to wrap
              // (2 per row). Only applies to row-direction containers (card grids) —
              // forcing children to 50% width on a column-direction container (e.g. a
              // vertically stacked hero text block) corrupts the layout into a
              // collapsed single-character column.
              function fixOverflowingFlex() {
                var vw = window.innerWidth || document.documentElement.clientWidth;
                document.querySelectorAll('*').forEach(function(el) {
                  if (el.scrollWidth > vw + 10) {
                    var cs = window.getComputedStyle(el);
                    var isRow = cs.flexDirection === 'row' || cs.flexDirection === 'row-reverse' || !cs.flexDirection;
                    if ((cs.display === 'flex' || cs.display === 'inline-flex') && cs.flexWrap === 'nowrap' && isRow) {
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
            } catch (e) {}

            try {
              window.open = function(url) { if (url) window.location.href = url; return null; };
            } catch (e) {}

            try {
              // Find the site's pinned top bar by actual computed position, not tag name.
              var bcKnownHeader = null;
              function findFixedHeader() {
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

              // Instead of fighting the site's own fixed-position header (a race we can
              // never reliably win against its own JS re-applying it), reserve space for
              // it below so content is never hidden behind it.
              var bcLastPad = -1;
              function padForFixedHeader() {
                var header = findFixedHeader();
                if (!header) return;
                var h = Math.ceil(header.getBoundingClientRect().height);
                if (h > 0 && h < 300 && h !== bcLastPad) {
                  document.body.style.setProperty('padding-top', h + 'px', 'important');
                  bcLastPad = h;
                }
              }
              padForFixedHeader();
              window.addEventListener('scroll', padForFixedHeader, { passive: true });
              new MutationObserver(padForFixedHeader).observe(document.body, { childList: true, subtree: true });
              var bcPollCount = 0;
              var bcPollTimer = setInterval(function() {
                padForFixedHeader();
                bcPollCount++;
                if (bcPollCount > 20) clearInterval(bcPollTimer);
              }, 300);
            } catch (e) {}
            ${COMMUNITY_DIAGNOSTICS ? COMMUNITY_DIAGNOSTIC_JS : ''}
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
  webview: {
    flex: 1,
    backgroundColor: COMMUNITY_BACKGROUND,
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
