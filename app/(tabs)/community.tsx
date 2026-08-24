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
        // The carousel scroll-container clip rule below is the actual fix. Kept
        // because suppressing rubber-band is still the behavior we want, not
        // because it fixes anything.
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
              // ROOT CAUSE of the horizontal white space (confirmed on device via the
              // diagnostic overlay in 2.116621.25): the homepage carousel's scroll
              // container reported scrollWidth=1853 against clientWidth=350, and that
              // overflow reached the document — body.scrollWidth=832 against a 390px
              // viewport. It is a NESTED scroll container, which is why clipping html
              // and body never touched it: overflow on an ancestor cannot contain a
              // descendant that establishes its own scrolling box.
              //
              // Matched on a class substring, not the full emotion hash
              // (css-1deprjs-carousel-scrollContainer) — that hash is regenerated on
              // every site deploy, so pinning it would silently stop matching.
              //
              // Clip the PARENT only, never the scroll container itself. 2.116621.26
              // clipped both and was tested on device: the white space went away but the
              // carousel froze, because clipping a scroll container removes the very
              // scrolling that makes it one — roughly 1500px of carousel content became
              // unreachable. Clipping only the ratioContainer parent contains the bleed
              // while the child keeps its own overflow-x and stays swipeable.
              //
              // So: do NOT add carousel-scrollContainer back to this selector.
              //
              // 2.116621.28: the "Looking for more?" carousel showed only 2 of 4 cards
              // and would not scroll on iOS (Android was fine). Three changes here:
              //
              //  1. max-width:100% dropped from ratioContainer. It was belt-and-braces,
              //     not load-bearing — overflow-x:clip alone contains the bleed. Forcing
              //     the parent to the viewport width is the most likely reason the
              //     carousel had nothing left to scroll: constrain the container and the
              //     track collapses to it, so scrollWidth stops exceeding clientWidth.
              //  2. overflow-x:auto asserted on the scroll container, so it is
              //     unambiguously still a scroller regardless of what the clip on its
              //     parent did to the cascade.
              //  3. -webkit-overflow-scrolling:touch, as requested. Note this property
              //     was REMOVED in iOS 13 — WKWebView ignores it and momentum scrolling
              //     is the default — so it is inert on any device this app supports. It
              //     is kept because it is harmless and explicit, but it is not the fix.
              // 2.116621.30, from the v2 diagnostic: nestedXScrollers=0 — the scroll
              // container had lost its scrolling entirely — while body.scrollWidth was
              // 1049 against a 390px viewport, so BOTH bugs were live at once. The
              // ratioContainer clip was costing the carousel without containing the
              // bleed.
              //
              // So stop clipping the carousel's ancestors and give the scroll container
              // its scrolling back. A working scroll container contains its own overflow
              // by definition; containment of the document now rests on the html/body
              // overflow-x: clip rule above, which is deliberately left in place.
              //
              // CAUTION: this is close to the configuration 2.116621.24 shipped — live
              // scroller, open ancestors, document clipped — and that build did not fix
              // the white space. If body.scrollWidth still exceeds the viewport in the
              // overlay, the document-level clip is not doing its job and the next step
              // is to find out why it is not applying, NOT to re-clip ratioContainer.
              var carouselStyle = document.createElement('style');
              carouselStyle.textContent =
                '[class*="ratioContainer"],' +
                '[class*="mobileMediaContainer"],' +
                '[class*="ListItem-styles-item"] {' +
                '  overflow: visible !important;' +
                '}' +
                '[class*="carousel-scrollContainer"] {' +
                '  overflow-x: auto !important;' +
                '  -webkit-overflow-scrolling: touch !important;' +
                '}';
              document.head.appendChild(carouselStyle);
            } catch (e) {}

            try {
              // Ensure nothing BETWEEN ratioContainer and the document is clipping the
              // carousel, which would cut off cards and swallow the touch target.
              //
              // Deliberately stops before body/html: those carry the document-level
              // overflow-x:clip rule above, and forcing them visible would reopen the
              // original white-space bug. Only the intermediate wrappers are touched.
              // Walks up from the SCROLL CONTAINER, not from ratioContainer, so
              // ratioContainer itself is included — it is now one of the ancestors that
              // must not clip. Catches unnamed wrappers the class selectors above miss.
              function openCarouselAncestors() {
                var containers = document.querySelectorAll('[class*="carousel-scrollContainer"]');
                for (var i = 0; i < containers.length; i++) {
                  var el = containers[i].parentElement;
                  while (el && el !== document.body && el !== document.documentElement) {
                    var cs = window.getComputedStyle(el);
                    if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
                      el.style.setProperty('overflow', 'visible', 'important');
                    }
                    el = el.parentElement;
                  }
                }
              }
              openCarouselAncestors();
              // The carousel mounts late and re-renders, so reapply for a short while.
              var carouselPolls = 0;
              var carouselTimer = setInterval(function () {
                openCarouselAncestors();
                if (++carouselPolls > 20) clearInterval(carouselTimer);
              }, 300);
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
