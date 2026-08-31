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
          // This script (and only this one) runs inside EVERY frame — including
          // cross-origin iframes — because WKWebView injects it natively into each
          // frame's own JS context rather than bridging it in from the parent. That's
          // the only way to reach a cross-origin lesson-video vendor's <video> element
          // at all: normal injectedJavaScript can't touch iframe.contentDocument once
          // the iframe is a different origin, no matter what we try from the parent.
          injectedJavaScriptBeforeContentLoadedForMainFrameOnly={false}
          injectedJavaScriptBeforeContentLoaded={`
            (function() {
              try {
                var meta = document.querySelector('meta[name="viewport"]');
                if (meta) {
                  meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0';
                } else {
                  var m = document.createElement('meta');
                  m.name = 'viewport';
                  m.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0';
                  document.head.appendChild(m);
                }
              } catch (e) {}

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

              // Block native fullscreen video takeover from directly inside this frame's
              // own context — works even when this frame is a cross-origin video vendor
              // we could never reach via iframe.contentDocument from the parent.
              try {
                function markInline(v) {
                  try {
                    v.setAttribute('playsinline', '');
                    v.setAttribute('webkit-playsinline', '');
                  } catch (e) {}
                }
                document.addEventListener('DOMContentLoaded', function() {
                  try { document.querySelectorAll('video').forEach(markInline); } catch (e) {}
                });
                new MutationObserver(function(muts) {
                  muts.forEach(function(m) {
                    if (!m.addedNodes) return;
                    m.addedNodes.forEach(function(n) {
                      if (!n) return;
                      if (n.tagName === 'VIDEO') markInline(n);
                      if (n.querySelectorAll) {
                        try { n.querySelectorAll('video').forEach(markInline); } catch (e) {}
                      }
                    });
                  });
                }).observe(document, { childList: true, subtree: true });
              } catch (e) {}
              try {
                if (window.HTMLVideoElement && window.HTMLVideoElement.prototype.webkitEnterFullscreen) {
                  window.HTMLVideoElement.prototype.webkitEnterFullscreen = function() {};
                }
              } catch (e) {}
              try {
                if (window.HTMLVideoElement && window.HTMLVideoElement.prototype.webkitSetPresentationMode) {
                  var originalSetMode = window.HTMLVideoElement.prototype.webkitSetPresentationMode;
                  window.HTMLVideoElement.prototype.webkitSetPresentationMode = function(mode) {
                    if (mode && mode !== 'inline') return;
                    return originalSetMode.apply(this, arguments);
                  };
                }
              } catch (e) {}
              try {
                if (window.HTMLMediaElement && window.HTMLMediaElement.prototype.requestFullscreen) {
                  window.HTMLMediaElement.prototype.requestFullscreen = function() { return Promise.resolve(); };
                }
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
                // The SCORM lesson player renders a black background while its own
                // loading state runs, before it inserts the actual <video> element —
                // give it a white background instead for a less jarring transition.
                rules.push('.scorm-lesson-content, .scorm-lesson-content iframe, iframe { background-color: #ffffff !important; }');
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
                // Force inline playback and block native fullscreen takeover — applied to
                // both the top-level document AND same-origin iframes (e.g. the SCORM
                // lesson player), since a video inside an iframe was never being reached
                // before, letting iOS grab the whole screen with its native video player
                // the moment that video started playing.
                function fixVideoDoc(doc, win) {
                  try {
                    doc.querySelectorAll('video').forEach(function(v) {
                      v.setAttribute('playsinline', '');
                      v.setAttribute('webkit-playsinline', '');
                      // Reactive catch: some players use webkitSetPresentationMode
                      // directly (a separate API from webkitEnterFullscreen) to enter
                      // fullscreen — this fires the instant presentation mode changes,
                      // regardless of which API triggered it, and reverses it immediately.
                      if (!v._bcPresHooked) {
                        v._bcPresHooked = true;
                        v.addEventListener('webkitpresentationmodechanged', function() {
                          try {
                            if (v.webkitPresentationMode && v.webkitPresentationMode !== 'inline' && v.webkitSetPresentationMode) {
                              v.webkitSetPresentationMode('inline');
                            }
                          } catch (e) {}
                        });
                      }
                    });
                  } catch (e) {}
                  try {
                    if (win && win.HTMLVideoElement && win.HTMLVideoElement.prototype.webkitEnterFullscreen) {
                      win.HTMLVideoElement.prototype.webkitEnterFullscreen = function() {};
                    }
                  } catch (e) {}
                  try {
                    if (win && win.HTMLVideoElement && win.HTMLVideoElement.prototype.webkitSetPresentationMode) {
                      var originalSetMode = win.HTMLVideoElement.prototype.webkitSetPresentationMode;
                      win.HTMLVideoElement.prototype.webkitSetPresentationMode = function(mode) {
                        if (mode && mode !== 'inline') return;
                        return originalSetMode.apply(this, arguments);
                      };
                    }
                  } catch (e) {}
                  try {
                    if (win && win.HTMLMediaElement && win.HTMLMediaElement.prototype.requestFullscreen) {
                      win.HTMLMediaElement.prototype.requestFullscreen = function() { return Promise.resolve(); };
                    }
                  } catch (e) {}
                }
                // The <iframe> tag itself lives in OUR document, so its attributes are
                // always reachable even when its content is cross-origin (e.g. a
                // third-party video vendor's player) and totally opaque to us otherwise.
                // Without an explicit allowfullscreen/allow="fullscreen" permission, the
                // browser's own Permissions Policy blocks that frame's Fullscreen API
                // calls outright — no reach into the iframe's JS required at all.
                function stripIframeFullscreenPermission(f) {
                  try {
                    f.removeAttribute('allowfullscreen');
                    f.removeAttribute('webkitallowfullscreen');
                    f.removeAttribute('mozallowfullscreen');
                    var allow = f.getAttribute('allow');
                    if (allow) {
                      var filtered = allow
                        .split(';')
                        .map(function(p) { return p.trim(); })
                        .filter(function(p) { return p && p.toLowerCase().indexOf('fullscreen') === -1; })
                        .join('; ');
                      f.setAttribute('allow', filtered);
                    }
                  } catch (e) {}
                }
                function fixVideosEverywhere() {
                  fixVideoDoc(document, window);
                  document.querySelectorAll('iframe').forEach(function(f) {
                    stripIframeFullscreenPermission(f);
                    try {
                      if (f.contentDocument && f.contentWindow) {
                        fixVideoDoc(f.contentDocument, f.contentWindow);
                      }
                    } catch (e) {}
                    if (!f._bcLoadHooked) {
                      f._bcLoadHooked = true;
                      f.addEventListener('load', function() {
                        stripIframeFullscreenPermission(f);
                        try {
                          if (f.contentDocument && f.contentWindow) {
                            fixVideoDoc(f.contentDocument, f.contentWindow);
                          }
                        } catch (e) {}
                      });
                    }
                  });
                }
                fixVideosEverywhere();
                var plObserver = new MutationObserver(fixVideosEverywhere);
                plObserver.observe(document.body, {
                  childList: true,
                  subtree: true,
                  // Catch the site re-adding allowfullscreen after we strip it, not just
                  // new iframes being inserted.
                  attributes: true,
                  attributeFilter: ['allowfullscreen', 'allow', 'webkitallowfullscreen', 'mozallowfullscreen'],
                });
                // Iframe content can populate asynchronously after its own load event —
                // poll briefly to catch a video inserted shortly after.
                var bcVideoFixPollCount = 0;
                var bcVideoFixPollTimer = setInterval(function() {
                  fixVideosEverywhere();
                  bcVideoFixPollCount++;
                  if (bcVideoFixPollCount > 20) clearInterval(bcVideoFixPollTimer);
                }, 300);
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
                // it below so content is never hidden behind it — the header can stay
                // pinned exactly as the site intends.
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

                // Narrow-screen header overlap: on Android below roughly 400dp the
                // site's own header lays the Board Academy logo and the language
                // selector (globe + "English") on one row and they collide. This is
                // Skilljar's markup, not ours, so it is fixed here in CSS rather than
                // in any React Native style.
                //
                // Driven off findFixedHeader() rather than Skilljar's class names on
                // purpose: those are build-generated and would silently stop matching
                // on a site deploy, leaving an inert rule and a wasted build round.
                //
                // Own try/catch so a DOM shape change here cannot abort the padding
                // fix above, which is the more important of the two.
                try {
                  function fixHeaderOverlap() {
                    var header = findFixedHeader();
                    if (!header) return;

                    // The row has to be a nowrap flex line for shrink factors to mean
                    // anything at all.
                    if (window.getComputedStyle(header).display.indexOf('flex') === -1) {
                      header.style.setProperty('display', 'flex', 'important');
                    }
                    header.style.setProperty('align-items', 'center', 'important');
                    header.style.setProperty('flex-wrap', 'nowrap', 'important');

                    // An absolutely-positioned child is out of flow, so no flex rule
                    // can keep it clear of the logo — that is the overlap. Restricted
                    // to DIRECT children: a dropdown panel deeper in the tree is
                    // legitimately absolute and must stay that way to open correctly.
                    var kids = header.children;
                    for (var i = 0; i < kids.length; i++) {
                      if (window.getComputedStyle(kids[i]).position === 'absolute') {
                        kids[i].style.setProperty('position', 'static', 'important');
                      }
                    }

                    // Logo: height-driven so it scales instead of being clipped, and
                    // allowed to shrink to at most 55% of the bar.
                    // NOT querySelector('img, svg') — that returns whichever comes
                    // FIRST in document order, which on this header could easily be
                    // the language selector's globe icon rather than the logo, and
                    // we would then shrink the globe to 22px and hand the logo's
                    // flex treatment to the wrong subtree. Take the widest instead:
                    // a wordmark is always wider than an icon.
                    var logo = null, bcWidest = 0;
                    var bcCands = header.querySelectorAll('img, svg');
                    for (var c = 0; c < bcCands.length; c++) {
                      var cw = bcCands[c].getBoundingClientRect().width;
                      if (cw > bcWidest) { bcWidest = cw; logo = bcCands[c]; }
                    }
                    if (logo) {
                      logo.style.setProperty('height', '22px', 'important');
                      logo.style.setProperty('width', 'auto', 'important');
                      logo.style.setProperty('max-width', '55%', 'important');
                      logo.style.setProperty('flex-shrink', '1', 'important');
                      logo.style.setProperty('object-fit', 'contain', 'important');
                    }

                    // Find which direct child of the header contains the logo; every
                    // other direct child is the right-hand controls.
                    var logoHost = logo;
                    while (logoHost && logoHost.parentElement !== header) {
                      logoHost = logoHost.parentElement;
                    }
                    for (var k = 0; k < kids.length; k++) {
                      if (kids[k] === logoHost) {
                        // min-width:0 is required — a flex item's automatic minimum
                        // size is its content size, so without this the logo refuses
                        // to shrink and flex-shrink:1 above does nothing.
                        kids[k].style.setProperty('flex-shrink', '1', 'important');
                        kids[k].style.setProperty('min-width', '0', 'important');
                        kids[k].style.setProperty('max-width', '55%', 'important');
                      } else {
                        kids[k].style.setProperty('flex-shrink', '0', 'important');
                      }
                    }
                  }

                  fixHeaderOverlap();
                  // Re-apply: the site re-renders its header after hydration, and a
                  // rotation changes which widths collide.
                  window.addEventListener('resize', fixHeaderOverlap, { passive: true });
                  new MutationObserver(fixHeaderOverlap).observe(document.body, { childList: true, subtree: true });
                  var bcHdrCount = 0;
                  var bcHdrTimer = setInterval(function() {
                    fixHeaderOverlap();
                    bcHdrCount++;
                    if (bcHdrCount > 20) clearInterval(bcHdrTimer);
                  }, 300);
                } catch (e) {}
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
