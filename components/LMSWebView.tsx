import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, ActivityIndicator, StyleSheet, TouchableOpacity, Text, Linking, Platform } from 'react-native';
import { WebView, WebViewNavigation, WebViewRequest } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { BRAND, WEBVIEW_USER_AGENT, isAllowedWebViewUrl } from '../constants/skilljar';

interface LMSWebViewProps {
  url: string;
  onLogout?: () => void;
  isFocused?: boolean;
  showNavBar?: boolean;
}

export interface LMSWebViewHandle {
  goHome: () => void;
}

// 2.116621.53 — both injected scripts live at MODULE scope.
//
// They used to be template literals inside the component body, so every render
// rebuilt roughly 48 KB of string and handed it to the diff. onLoadEnd fires two
// setState calls per navigation, so Back and Home paid that cost on every tap.
// Nothing about the scripts is per-instance or per-render: the only interpolation
// is Platform.OS, which is constant for the life of the process, so resolving it
// once at module load is exactly equivalent.
const ACADEMY_INJECT_BEFORE = `
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
                // COALESCED in 2.116621.45. This ran ONCE PER MUTATION RECORD and
                // called querySelectorAll('video') on every added node. Both .38 and
                // .43 grepped only injectedJavaScript, so this observer — the only one
                // in the BEFORE-content script, and the only one that observes
                // the document itself rather than document.body — was never audited.
                // Skilljar's search autocomplete inserts and removes result nodes on
                // every keystroke, so this fired continuously while typing.
                //
                // Coalescing loses the mutation records, so scan the document once per
                // frame instead of per added node. That is strictly cheaper: one
                // querySelectorAll per frame replaces one per inserted node.
                //
                // 2.116621.47 — also STAND DOWN WHILE A TEXT FIELD HAS FOCUS. .45 added
                // that guard to bcSchedule (the header tasks) but not here, so this loop
                // still ran a full-document querySelectorAll every frame for as long as
                // search autocomplete kept mutating the DOM — once per keystroke, in
                // every frame of the page. An autocomplete dropdown never inserts a
                // <video>, so there is nothing to miss; anything that does appear is
                // caught on the next mutation after blur.
                //
                // Its own copy of the check rather than the one in injectedJavaScript:
                // this is a separate script with a separate scope and cannot see it.
                function bcEditingBefore() {
                  try {
                    var a = document.activeElement;
                    if (!a) return false;
                    var tag = a.tagName;
                    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
                           a.isContentEditable === true;
                  } catch (e) { return false; }
                }
                var bcVidRaf = false;
                function bcScheduleMarkInline() {
                  if (bcVidRaf) return;
                  bcVidRaf = true;
                  var run = function () {
                    bcVidRaf = false;
                    if (bcEditingBefore()) return;
                    try { document.querySelectorAll('video').forEach(markInline); } catch (e) {}
                  };
                  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
                  else setTimeout(run, 16);
                }
                new MutationObserver(bcScheduleMarkInline).observe(document, { childList: true, subtree: true });
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
          `;

const ACADEMY_INJECT_MAIN = `
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
                // "Get Started" dropdown on touch. Skilljar reveals .dd-menu on
                // :hover, which a touch device never produces — the tap instead
                // follows the trigger's href straight to learning-paths, so the menu
                // is unreachable on mobile. Mirror the hover state with a class the
                // handler below toggles.
                //
                // 2.116621.49 — RESTORED to the 2.116621.41 rule, which is the last
                // state confirmed working on device (menu opened on first tap, closed
                // on an outside tap).
                //
                // THERE IS DELIBERATELY NO CLOSED-STATE RULE. That is the whole fix.
                // .41 only ever forced the menu OPEN; the site's own CSS did all the
                // hiding. .43 added a closed-state rule, .46 made it
                // display: none !important, .47 and .48 made it
                // opacity/visibility/pointer-events — and from .46 on the Get Started
                // control was completely unresponsive on device.
                //
                // Why a closed-state rule on .dd-menu kills the TRIGGER: visibility
                // and pointer-events both INHERIT to descendants. If Skilljar's
                // .dd-menu is a wrapper that contains the trigger rather than a sibling
                // of it, hiding .dd-menu hides and disables the trigger with it. That
                // fits every observation: three different hiding properties, three
                // identical dead-button reports, and a handler that is byte-identical
                // to the version that worked.
                //
                // So do not add a closed-state rule here again. The known cost is that
                // a second tap may not close the menu (Android's sticky :hover keeps
                // the site's own hover rule matching) — that is the .41 behaviour, it
                // is a far smaller problem than an unusable control, and it must not be
                // "fixed" by hiding .dd-menu from a stylesheet. An inline style on the
                // menu element is NOT a safe alternative either: it inherits exactly
                // the same way.
                var ddStyle = document.createElement('style');
                ddStyle.textContent =
                  '.has-dd.touch-open .dd-menu {' +
                  '  opacity: 1 !important;' +
                  '  visibility: visible !important;' +
                  '  transform: translateY(0) !important;' +
                  '  pointer-events: auto !important;' +
                  '}';
                document.head.appendChild(ddStyle);

                // Delegated on document so it survives the site re-rendering its nav,
                // and in the CAPTURE phase so the href is prevented before Skilljar's
                // own handler sees the event.
                //
                // 2.116621.41: touchend is now the ONLY thing that toggles. .40 toggled
                // on touchend AND on click, with a 600ms guard meant to swallow the
                // click that follows a tap; on Android that guard did not hold, so a
                // second tap removed touch-open on touchend and the click put it
                // straight back — the menu looked like it would not close. touchend is
                // sufficient on mobile, so click no longer participates in the toggle
                // at all and there is no timing window left to get wrong.
                function bcDdCloseAll(except) {
                  var open = document.querySelectorAll('.has-dd.touch-open');
                  for (var i = 0; i < open.length; i++) {
                    if (open[i] !== except) open[i].classList.remove('touch-open');
                  }
                }

                function bcHandleDdTouch(e) {
                  var t = e.target;
                  if (!t || typeof t.closest !== 'function') return;

                  var dd = t.closest('.has-dd');
                  if (!dd) {
                    // Tap outside any dropdown closes whatever is open.
                    bcDdCloseAll(null);
                    return;
                  }

                  // A tap INSIDE the revealed menu is a real link. Return before both
                  // the preventDefault and the toggle, so menu links stay clickable and
                  // the menu does not close under the finger mid-tap.
                  //
                  // touch-open is deliberately NOT cleared here. Doing so on touchend
                  // hides the menu before the activating click is dispatched, and if
                  // Blink re-hit-tests at click time it can find nothing — which would
                  // kill the very link the user tapped. The clear lives in
                  // bcHandleDdClick instead; see the note there.
                  if (t.closest('.dd-menu')) return;

                  // 2.116621.48 — THIS IS THE FIX FOR THE DEAD BUTTON.
                  //
                  // The trigger was never dead to touch. It was NEUTERED: this handler
                  // is registered on document in the CAPTURE phase, so it runs before
                  // the event reaches the target, and it called preventDefault() plus
                  // stopPropagation() UNCONDITIONALLY on any trigger whose href contains
                  // learning-paths. That destroys the control's only native behaviour —
                  // navigating — and substitutes ours, which produces a visible result
                  // only if a menu element actually exists inside this .has-dd and our
                  // CSS matches it. When it does not, the tap does nothing whatsoever,
                  // which is exactly the "completely unresponsive" report. It also
                  // explains why this broke in EVERY build that touched the dropdown
                  // CSS: each one kept this unconditional suppression while its own CSS
                  // variant failed to reveal the menu for a different reason.
                  //
                  // So: find the menu FIRST, and if there is nothing to open, return
                  // before touching the event at all. The worst case is now that the
                  // button behaves exactly as it would if this script had never run.
                  // It can no longer be made less functional than untouched.
                  var menu = dd.querySelector('.dd-menu');
                  if (!menu) return;

                  // Only now, with a menu we can actually show, suppress the trigger's
                  // navigation: opening the menu is the whole point of the tap.
                  var a = t.closest('a');
                  if (a && (a.getAttribute('href') || '').indexOf('learning-paths') !== -1) {
                    e.preventDefault();
                    e.stopPropagation();
                  }

                  // Explicit open/close rather than classList.toggle, so the state after
                  // a tap never depends on what the site may have done to the class in
                  // between — a stray toggle can otherwise leave open and shut inverted.
                  if (dd.classList.contains('touch-open')) {
                    dd.classList.remove('touch-open');
                  } else {
                    bcDdCloseAll(dd);
                    dd.classList.add('touch-open');
                  }
                }

                // Click NEVER toggles. It exists only to suppress the trigger's
                // navigation in case the browser still dispatches a click after the
                // touchend above (preventDefault there normally cancels it, but not
                // dependably across Android WebView versions).
                function bcHandleDdClick(e) {
                  var t = e.target;
                  if (!t || typeof t.closest !== 'function') return;
                  // Menu links must stay clickable — check this before anything else.
                  //
                  // 2.116621.54 — clear touch-open on the way out, and do it HERE rather
                  // than in the touchend handler.
                  //
                  // Why it must be cleared at all: Skilljar's Search opens an IN-PAGE
                  // overlay, not a new document. No navigation means none of the clears
                  // fire — not the pushState/replaceState hooks, not popstate, not
                  // pagehide, not the .50 navigation clear — so the class stayed set and
                  // the menu rendered over the overlay until the user navigated away for
                  // real. That is the permanent overlay that was reported.
                  //
                  // Why here and not on touchend: touchend fires BEFORE the activating
                  // click, so hiding the menu there can leave Blink re-hit-testing at
                  // click time and finding nothing — killing the link that was tapped,
                  // Search included. By the time a click is dispatched its target is
                  // already resolved, so hiding the menu now cannot retarget it.
                  if (t.closest('.dd-menu')) {
                    var hasDd = t.closest('.has-dd');
                    if (hasDd) hasDd.classList.remove('touch-open');
                    return;
                  }
                  var ddc = t.closest('.has-dd');
                  if (!ddc) return;
                  // Same rule as the touch handler: if there is no menu to open, this
                  // click is the control's real behaviour and must not be swallowed.
                  if (!ddc.querySelector('.dd-menu')) return;
                  var a = t.closest('a');
                  if (a && (a.getAttribute('href') || '').indexOf('learning-paths') !== -1) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }

                document.addEventListener('touchend', bcHandleDdTouch, true);
                document.addEventListener('click', bcHandleDdClick, true);

                // 2.116621.46 — clear any open dropdown across SPA navigation.
                //
                // Skilljar routes some navigation through history.pushState rather than
                // a document load, so the .has-dd element survives and keeps its
                // touch-open class. Tapping Search from an open Get Started menu left
                // the menu rendered over the next page. Nothing cleared it: the only
                // reset paths were a tap outside and a full page load.
                //
                // pushState/replaceState are wrapped rather than polled, so the clear
                // happens in the same task as the navigation. popstate covers Back, and
                // pagehide covers a real document unload.
                function bcClearDropdowns() { bcDdCloseAll(null); }
                try {
                  var bcPushState = history.pushState;
                  var bcReplaceState = history.replaceState;
                  history.pushState = function () {
                    var r = bcPushState.apply(this, arguments);
                    bcClearDropdowns();
                    return r;
                  };
                  history.replaceState = function () {
                    var r = bcReplaceState.apply(this, arguments);
                    bcClearDropdowns();
                    return r;
                  };
                } catch (e) {}
                window.addEventListener('popstate', bcClearDropdowns);
                window.addEventListener('pagehide', bcClearDropdowns);
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
                // COALESCED in 2.116621.43. This observer watches document.body with
                // childList, subtree AND attributes, and fixVideosEverywhere does a
                // full-document querySelectorAll('iframe') plus a cross-origin
                // contentDocument probe per iframe — each of which throws and is
                // caught, which is expensive in a hot loop. It ran ONCE PER MUTATION,
                // uncoalesced: the .38 work routed padForFixedHeader and
                // fixHeaderOverlap through bcSchedule but missed this one, and the
                // attributes filter makes it fire more often than either of those.
                // Search autocomplete mutates attributes on every keystroke, so this
                // is a third contributor to the Android freeze independent of the
                // blocking navigation callback.
                //
                // 2.116621.47 — this is the EXPENSIVE one, and .45 left it ungated.
                // fixVideosEverywhere() does a full-document querySelectorAll('iframe')
                // and probes f.contentDocument on each — a cross-origin probe THROWS a
                // SecurityError that is then caught, and throwing per iframe per frame
                // is costly. It ran every frame for as long as the DOM kept mutating,
                // which during search autocomplete means every keystroke. Same reasoning
                // as above: typing into a search box inserts no videos or iframes.
                var bcVidRafPending = false;
                function bcVideoFixEditing() {
                  try {
                    var a = document.activeElement;
                    if (!a) return false;
                    var tag = a.tagName;
                    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
                           a.isContentEditable === true;
                  } catch (e) { return false; }
                }
                function bcScheduleVideoFix() {
                  if (bcVidRafPending) return;
                  bcVidRafPending = true;
                  var run = function () {
                    bcVidRafPending = false;
                    if (bcVideoFixEditing()) return;
                    try { fixVideosEverywhere(); } catch (e) {}
                  };
                  // Its own guard rather than bcSchedule: that one lives in a later
                  // try block, so its state vars are still undefined at this point.
                  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
                  else setTimeout(run, 16);
                }
                var plObserver = new MutationObserver(bcScheduleVideoFix);
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
                  // Through the frame guard, not a direct call: this poller ran an
                  // uncoalesced full-document pass every 300ms for the first ~6s,
                  // which is precisely when a user first reaches the search field.
                  bcScheduleVideoFix();
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
                // Shared frame scheduler. A burst of DOM mutations (search autocomplete
                // inserts/removes result nodes on EVERY keystroke) used to run each
                // observer callback once per mutation; both walk the DOM, so that was
                // the second half of the Android search freeze. One rAF guard covers
                // every registered task, so a burst costs at most one pass per frame.
                var bcTasks = [];
                var bcRafPending = false;
                var bcDeferred = false;

                // 2.116621.45. While a text field has focus, DO NOT run the header
                // passes at all.
                //
                // This is the cut that severs the search freeze. Typing is the single
                // worst case for these tasks: Skilljar's autocomplete mutates the DOM
                // on every keystroke (firing the observers), the Android soft keyboard
                // resizes the viewport (firing the resize listener), and scrolling the
                // focused input into view fires the scroll listener — so all three
                // inputs to bcSchedule peak simultaneously, once per keystroke.
                //
                // Nothing is lost by skipping: the header's geometry cannot
                // meaningfully change while the user is typing into a field, which is
                // the only thing these tasks respond to. Any change that did happen is
                // picked up on blur via the focusout listener below.
                function bcIsEditing() {
                  try {
                    var a = document.activeElement;
                    if (!a) return false;
                    var tag = a.tagName;
                    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
                           a.isContentEditable === true;
                  } catch (e) { return false; }
                }

                function bcSchedule() {
                  if (bcRafPending) return;
                  bcRafPending = true;
                  var run = function () {
                    bcRafPending = false;
                    if (bcIsEditing()) { bcDeferred = true; return; }
                    for (var t = 0; t < bcTasks.length; t++) {
                      try { bcTasks[t](); } catch (e) {}
                    }
                  };
                  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
                  else setTimeout(run, 16);
                }

                // Catch up once the field is released, so a layout change that did
                // occur during typing is not left unapplied.
                document.addEventListener('focusout', function () {
                  if (bcDeferred) { bcDeferred = false; bcSchedule(); }
                }, true);

                var bcKnownHeader = null;
                var bcNoHeaderUntil = 0;
                function findFixedHeader() {
                  // A MISS is cached too, for 2s. Without this, a page with no
                  // qualifying fixed header re-walked every element calling
                  // getComputedStyle on each — forced synchronous layout — on every
                  // single DOM mutation. Detection of a header that appears later is
                  // delayed by at most one interval, which the pollers below cover.
                  if (Date.now() < bcNoHeaderUntil) return null;
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
                  bcNoHeaderUntil = Date.now() + 2000;
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
                bcTasks.push(padForFixedHeader);
                padForFixedHeader();
                window.addEventListener('scroll', bcSchedule, { passive: true });
                new MutationObserver(bcSchedule).observe(document.body, { childList: true, subtree: true });
                var bcPollCount = 0;
                var bcPollTimer = setInterval(function() {
                  bcSchedule();
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
                  // 2.116621.45 — rewritten. This function was the Android search
                  // freeze. Three defects, all visible in the previous version:
                  //
                  // (a) LAYOUT THRASH. It interleaved style WRITES with geometry READS:
                  //     getComputedStyle(header), then three style.setProperty calls,
                  //     then getComputedStyle(kids[i]) in a loop, then img style writes,
                  //     then getBoundingClientRect() in a loop. Every read after a write
                  //     forces the engine to run layout synchronously before it can
                  //     answer — so one pass forced layout several times over.
                  // (b) UNCONDITIONAL WRITES. It re-applied identical values on every
                  //     invocation, re-dirtying layout each time even when nothing had
                  //     changed. Combined with the mutation observer this ran once per
                  //     animation frame for as long as the DOM kept mutating.
                  // (c) UNCACHED FALLBACK. findFixedHeader() caches hits and misses, but
                  //     the fallback below — which is the path actually taken if
                  //     Skilljar's navbar is statically positioned — re-ran
                  //     querySelectorAll plus a getBoundingClientRect per candidate on
                  //     every single pass.
                  //
                  // Search autocomplete mutates the DOM on every keystroke, so all of
                  // this ran per keystroke on the WebView's main thread. Chrome on the
                  // same device runs none of it, which is exactly the reported
                  // difference.
                  //
                  // Now: the fallback is cached, the whole pass is skipped unless the
                  // header element or its width actually changed, and reads are done
                  // BEFORE writes so no read can force a layout mid-pass.
                  var bcFallbackHeader = null;
                  var bcStyledHeader = null;
                  var bcStyledWidth = -1;

                  function fixHeaderOverlap() {
                    var header = findFixedHeader();
                    if (!header) {
                      // Fallback. findFixedHeader() only matches a position:fixed or
                      // :sticky bar — if Skilljar's navbar is statically positioned it
                      // returns null and this entire pass never ran, which would explain
                      // the logo staying small through .34, .36 and .37 despite three
                      // different sizing attempts. Look for a semantic header near the
                      // top that actually contains an image. Scoped to three tag names
                      // rather than '*', so it stays cheap enough for the mutation path.
                      //
                      // CACHED as of .45 — re-querying the document and measuring every
                      // candidate on each pass was defect (c) above.
                      if (bcFallbackHeader && document.body.contains(bcFallbackHeader)) {
                        header = bcFallbackHeader;
                      } else {
                        var bcCand = document.querySelectorAll('header, [role="banner"], nav');
                        for (var q = 0; q < bcCand.length; q++) {
                          var qr = bcCand[q].getBoundingClientRect();
                          if (qr.top <= 120 && qr.height > 0 && qr.height < 200 &&
                              bcCand[q].getElementsByTagName('img').length > 0) {
                            header = bcCand[q];
                            bcFallbackHeader = header;
                            break;
                          }
                        }
                      }
                    }
                    if (!header) return;

                    // The only geometry read on the hot path. If neither the header
                    // element nor its width has changed, every value below would be
                    // written identical to what is already there — so there is nothing
                    // to do, and the pass costs one rect read instead of a full thrash.
                    var headerWidth = Math.round(header.getBoundingClientRect().width);
                    if (header === bcStyledHeader && headerWidth === bcStyledWidth) return;

                    // ---- PHASE 1: READ EVERYTHING FIRST -------------------------
                    // No style is written until every measurement is taken, so none of
                    // these reads can force a synchronous layout.
                    var kids = header.children;
                    var needFlex = window.getComputedStyle(header).display.indexOf('flex') === -1;
                    var kidAbsolute = [];
                    var kidRightAnchored = [];
                    // Read once, in PHASE 1. The right-anchor test needs geometry, and
                    // doing it in the write loop below would be a read AFTER a write —
                    // forced synchronous layout, the exact defect .45 removed.
                    var bcViewportW = window.innerWidth;
                    for (var i = 0; i < kids.length; i++) {
                      kidAbsolute[i] = window.getComputedStyle(kids[i]).position === 'absolute';
                      kidRightAnchored[i] = false;
                      if (kidAbsolute[i]) {
                        var kr = kids[i].getBoundingClientRect();
                        kidRightAnchored[i] = (bcViewportW - kr.right) < 50;
                      }
                    }
                    var bcImgs = header.getElementsByTagName('img');
                    // The logo is the widest image; used below to decide which direct
                    // child of the header is the logo's host rather than the controls.
                    // Measured here, before any write. min-height is applied uniformly
                    // to every image afterwards, so it cannot change which one is
                    // widest — the ordering read now is still correct after the writes.
                    var logo = null, bcWidest = 0;
                    for (var c2 = 0; c2 < bcImgs.length; c2++) {
                      var cw = bcImgs[c2].getBoundingClientRect().width;
                      if (cw > bcWidest) { bcWidest = cw; logo = bcImgs[c2]; }
                    }
                    // Find which direct child of the header contains the logo; every
                    // other direct child is the right-hand controls.
                    var logoHost = logo;
                    while (logoHost && logoHost.parentElement !== header) {
                      logoHost = logoHost.parentElement;
                    }

                    // ---- PHASE 2: WRITE EVERYTHING ------------------------------
                    // The row has to be a nowrap flex line for shrink factors to mean
                    // anything at all.
                    if (needFlex) header.style.setProperty('display', 'flex', 'important');
                    header.style.setProperty('align-items', 'center', 'important');
                    header.style.setProperty('flex-wrap', 'nowrap', 'important');

                    // An absolutely-positioned child is out of flow, so no flex rule
                    // can keep it clear of the logo — that is what .34 called the
                    // overlap. Restricted to DIRECT children: a dropdown panel deeper
                    // in the tree is legitimately absolute and must stay that way.
                    //
                    // 2.116621.52 — NEVER un-anchor a RIGHT-PINNED control.
                    //
                    // This write is the leading suspect for two device reports: the
                    // language selector / hamburger rendering in the middle of the bar
                    // instead of the top right, and the Search page looking scrambled.
                    // A top-right control is positioned absolute against the right edge;
                    // forcing it to static drops it into the flex row this function just
                    // created at the line above, and normal flow puts it wherever the
                    // content happens to land — the middle. Both symptoms appear only in
                    // this app and never in a browser, which fits, because a browser does
                    // not run this script and this function is not platform-gated.
                    //
                    // Strong inference, NOT proven: the confirming test is this build.
                    // If the hamburger returns to the top right, it was this line.
                    //
                    // Skipping a right-anchored child costs .34 nothing. An element
                    // pinned to the right edge cannot collide with a left-hand logo in
                    // the first place — the collision .34 reported is the LOGO growing
                    // under it, and that is contained by max-width: 55% and the shrink
                    // factors further down, not by this write.
                    for (var j = 0; j < kids.length; j++) {
                      // Also still skips any direct child that hosts a dropdown: forcing
                      // one into flow gives it real layout space over the nav where it
                      // can swallow touches.
                      // 2.116621.53 — querySelector searches DESCENDANTS ONLY and
                      // never the element it is called on, so a direct child that IS
                      // the .dd-menu returned null here and fell through to the write.
                      // An absolutely-positioned menu panel forced to static drops into
                      // the flex row created above and takes real layout space — the
                      // permanent overlay on the Search page. matches() covers the
                      // element itself; querySelector still covers a container of one.
                      if (kidAbsolute[j] && !kidRightAnchored[j] &&
                          !(kids[j].matches && kids[j].matches('.dd-menu')) &&
                          !kids[j].querySelector('.dd-menu')) {
                        kids[j].style.setProperty('position', 'static', 'important');
                      }
                    }

                    // Logo: height-driven so it scales instead of being clipped, and
                    // allowed to shrink to at most 55% of the bar.
                    // Every <img> in the fixed header, sized directly in JS. The
                    // 2.116621.36 attempt did this through a stylesheet keyed on
                    // .site-logo / .navbar-brand / .sj-navbar__logo / .sj-header__logo
                    // and none of those matched Skilljar's actual markup, so the rule
                    // was inert. Driving it off findFixedHeader() instead means no
                    // class name has to be guessed.
                    //
                    // setProperty(..., 'important') rather than a plain style.minHeight
                    // assignment: a plain inline declaration still loses to the site's
                    // own !important rules, which is a likely reason the logo was
                    // constrained in the first place.
                    for (var n = 0; n < bcImgs.length; n++) {
                      bcImgs[n].style.setProperty('min-height', '40px', 'important');
                      bcImgs[n].style.setProperty('width', 'auto', 'important');
                      bcImgs[n].style.setProperty('object-fit', 'contain', 'important');
                    }
                    if (logo) {
                      logo.style.setProperty('max-height', '48px', 'important');
                      logo.style.setProperty('max-width', '55%', 'important');
                      logo.style.setProperty('flex-shrink', '1', 'important');
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

                    bcStyledHeader = header;
                    bcStyledWidth = headerWidth;
                  }

                  bcTasks.push(fixHeaderOverlap);
                  fixHeaderOverlap();
                  // Re-apply: the site re-renders its header after hydration, and a
                  // rotation changes which widths collide.
                  window.addEventListener('resize', bcSchedule, { passive: true });
                  // NO second MutationObserver here. An identical registration
                  // (document.body, childList+subtree, bcSchedule) already exists
                  // beside padForFixedHeader above, and fixHeaderOverlap is in the same
                  // bcTasks list it drives — so this was a duplicate that made the
                  // engine dispatch two observer callbacks per mutation batch to do one
                  // pass of work. Removed in 2.116621.45.
                  var bcHdrCount = 0;
                  var bcHdrTimer = setInterval(function() {
                    bcSchedule();
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
          `;

const LMSWebView = forwardRef<LMSWebViewHandle, LMSWebViewProps>(
  ({ url, onLogout, isFocused = true, showNavBar = false }, ref) => {
    const webViewRef = useRef<WebView>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    // 2.116621.47 — the full-screen white overlay is shown for the FIRST load only.
    //
    // The reported white page is this overlay (styles.loadingOverlay is opaque white
    // and absoluteFill) covering the old page between onLoadStart and onLoadEnd.
    // Note it was never an SPA problem: Android fires onPageStarted for real
    // navigations only, so a history.pushState route change does not raise
    // onLoadStart and never showed the overlay in the first place — "suppress it for
    // SPA navigations" would have changed nothing. Tapping Search is a real document
    // load, which is why it flashed white.
    //
    // Subsequent loads now leave the previous page on screen until the new one
    // paints, which is what a browser does. The first load still needs the overlay:
    // there is no previous page, and the alternative is a blank WebView.
    const hasLoadedOnceRef = useRef(false);

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

    // Last URL bounced, so the multiple onNavigationStateChange events a single
    // navigation produces (loading true, then false) are only acted on once.
    const lastBouncedRef = useRef<string | null>(null);

    // 2.116621.50 — last URL we have cleared dropdowns for. Distinct from
    // lastBouncedRef, which only tracks OFF-DOMAIN urls and is reset to null on every
    // allowed one, so it cannot double as a previous-URL tracker.
    const lastUrlRef = useRef<string | null>(null);

    function handleNavigationChange(nav: WebViewNavigation) {
      if (nav.url.includes('/auth/logout') || (nav.url.includes('/auth/domain') && nav.url.includes('/login'))) {
        onLogout?.();
      }

      // 2.116621.48 — the dropdown-clearing injectJavaScript that .46 put here is
      // GONE, and that is the Back-button latency fix.
      //
      // It ran unconditionally on EVERY navigation state change, before any early
      // return. This callback fires more than once per navigation (see lastBouncedRef
      // above: loading true, then false), and each injectJavaScript is a bridge call
      // that becomes an evaluateJavascript on the Android UI thread — so every
      // navigation, Back included, carried two or more extra round trips for work
      // that was already done.
      //
      // It was also redundant. The injected hooks cover every navigation form there
      // is: pushState and replaceState are wrapped, popstate covers Back, pagehide
      // covers unload — and a real document load re-injects the scripts from scratch,
      // so touch-open cannot survive one anyway. Nothing is lost by deleting this.

      // 2.116621.50 — clear any stale open dropdown ONCE per completed navigation.
      //
      // This is deliberately not the .46 version. That one fired on EVERY state change
      // including loading === true, which is two or more evaluateJavascript round trips
      // per navigation on the Android UI thread and is what made Back feel slow. This
      // fires on the loading === false edge only, and only when the URL actually
      // changed, so it costs at most ONE bridge call per navigation and none at all
      // when a navigation re-reports the same URL.
      //
      // Placed above the Android early-return below: the dropdown is a touch
      // affordance on both platforms, so this must not sit inside that block.
      //
      // Scope note for whoever reads this next: on a genuine full document load the
      // scripts are re-injected into a fresh DOM that never had touch-open, so this
      // call is a no-op there. It earns its place on the paths where the document is
      // reused — a pushState route that the in-page hooks somehow miss, or a
      // same-document navigation — and as a cheap backstop that cannot regress the
      // Back-button latency the way the unconditional version did.
      if (nav.loading === false && nav.url !== lastUrlRef.current) {
        lastUrlRef.current = nav.url;
        webViewRef.current?.injectJavaScript(
          "document.querySelectorAll('.has-dd.touch-open').forEach(function(el){el.classList.remove('touch-open');}); true;"
        );
      }

      // ANDROID allowlist enforcement lives here, not in onShouldStartLoadWithRequest.
      // That callback BLOCKS the Android WebView thread for up to 250ms per navigation
      // (RNCWebViewClient.shouldOverrideUrlLoading waits on a lock) and carries no
      // isTopFrame, so it cannot tell a sub-frame load from a real navigation — which
      // is what made typing in Skilljar's search field hang the app. This callback is
      // non-blocking and only reports committed TOP-LEVEL navigation, so the same
      // guarantee is enforced without stalling the thread.
      //
      // The age-rating guarantee is preserved, not weakened: an off-domain page is
      // still never browsable in-app. It is stopped and handed to the system browser
      // on the first state change, which is the same outcome, one frame later.
      if (Platform.OS !== 'android') return;
      if (!nav.url || !/^https?:/i.test(nav.url)) return;
      if (isAllowedWebViewUrl(nav.url)) {
        lastBouncedRef.current = null;
        return;
      }
      if (lastBouncedRef.current === nav.url) return;
      lastBouncedRef.current = nav.url;
      webViewRef.current?.stopLoading();
      Linking.openURL(nav.url).catch(() => {});
      // Return to allowed content rather than leaving a blank stopped page: go back
      // if there is history, otherwise reload the tab's own URL.
      if (nav.canGoBack) {
        webViewRef.current?.goBack();
      } else {
        webViewRef.current?.injectJavaScript(`window.location.href = '${url}'; true;`);
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
      // In-page schemes must load in the WebView and must NEVER reach Linking.
      // On Android every Linking.openURL fires an Intent resolution, and in-page
      // widgets (search autocomplete especially) navigate to about:blank / blob:
      // routinely — one per keystroke was a large part of the search freeze.
      if (/^(about|blob|data|javascript|file):/i.test(url)) return true;
      // Genuine external schemes (mailto:, tel:) still hand off to the OS. Kept on
      // both platforms: these are rare and deliberate, not per-keystroke traffic.
      if (!/^https?:/i.test(url)) {
        Linking.openURL(url).catch(() => {});
        return false;
      }
      // ANDROID: stop here. This callback blocks the WebView thread, so it does the
      // cheapest possible thing for http(s) and defers the allowlist to
      // handleNavigationChange above, which is non-blocking and top-frame only.
      if (Platform.OS === 'android') return true;
      // iOS: enforce inline. decidePolicyForNavigationAction is async and the event
      // carries a real isTopFrame, so neither problem applies here.
      // Restrict to Board/Skilljar domains so Apple rates the app 4+ (not 17+)
      if (isAllowedWebViewUrl(url)) return true;
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
          onLoadStart={() => {
            if (!hasLoadedOnceRef.current) setLoading(true);
          }}
          onLoadEnd={() => {
            hasLoadedOnceRef.current = true;
            // 2.116621.53 — guarded. Unconditional setState on a value that is already
            // false still schedules a render pass; two of them fired on every
            // navigation, Back included.
            if (loading) setLoading(false);
            if (refreshing) setRefreshing(false);
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
          injectedJavaScriptBeforeContentLoaded={ACADEMY_INJECT_BEFORE}
          injectedJavaScript={ACADEMY_INJECT_MAIN}
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
    // 2.116621.51 — backdrop for the Academy WebView, behind anything the page has
    // not painted yet. react-native-webview has NO backgroundColor prop (verified
    // against the installed WebViewTypes.d.ts — passing one fails typecheck); it reads
    // style.backgroundColor and forwards it to the native setter, which assigns
    // _webView.scrollView.backgroundColor. Same mechanism community.tsx already uses
    // via COMMUNITY_BACKGROUND.
    //
    // #ffffff is derived from repo evidence, not measured: academy.board.com could not
    // be reached from this environment, but the injected rule above sets
    // .scorm-lesson-content and every iframe to #ffffff explicitly "for a less jarring
    // transition", which only makes sense if the surrounding page is white, and
    // Skilljar's stock theme is light.
    //
    // READ THIS BEFORE EXPECTING IT TO FIX ANYTHING: the native backdrop ALREADY
    // defaults to white on both platforms, so this is a no-op for the white flash. It
    // is here to make the intent explicit and to survive a future default change, not
    // because it changes current behaviour. If the flash needs to stop being white, the
    // value has to differ from the page background — which trades a white flash for a
    // coloured one.
    backgroundColor: BRAND.white,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
