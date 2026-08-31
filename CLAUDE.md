# Board Connect — Project Context

This file is the source of truth for anyone (human or Claude) picking up this project.
Keep it current: whenever a fix, release, or decision changes the state described below,
update this file as part of that change, not as a separate cleanup task later.

## What this app is

Board Connect is a React Native / Expo app for iOS and Android that wraps two existing
web properties in native WebViews:
- **Academy tab** — `academy.board.com` (Skilljar LMS: courses, lessons, SCORM video content)
- **Community tab** — `community.board.com` (Vanilla Communities forum)

There is no custom backend. All auth, content, and data live on Board's/Skilljar's/Vanilla's
servers; the app's job is to present those sites in a native shell with app-appropriate
navigation, session handling, and WebView behavior fixes.

## Repo layout

- `components/LMSWebView.tsx` — the Academy WebView. Most of the platform-specific
  complexity lives here (see "Known tricky areas" below).
- `components/LMSWebView.web.tsx` — Expo web-platform fallback (iframe-based), not used
  on iOS/Android.
- `app/(tabs)/community.tsx` — the Community WebView. Similar fix patterns to
  LMSWebView.tsx but a separate implementation (see "One codebase, two platforms" below).
- `app/(tabs)/index.tsx`, `my-learning.tsx`, `profile.tsx`, `_layout.tsx` — tab shell.
- `app/login.tsx`, `guest-login.tsx`, `sso-webview.tsx` — auth flows into Skilljar/SSO.
- `services/auth.ts` — session/auth helpers.
- `constants/skilljar.ts` — shared config: base URLs, `WEBVIEW_USER_AGENT`,
  `ALLOWED_WEBVIEW_DOMAINS` (the domain allowlist that keeps Apple's age rating at 4+),
  brand colors.
- `app.json` — Expo config. `version` is the shared `CFBundleShortVersionString` /
  Android `versionName` for both platforms (see "Versioning" below).
- `eas.json` — EAS Build/Submit profiles (see "Release process" below).
- `APP_STORE_SUBMISSION.md` — original pre-launch App Store listing content (description,
  keywords, privacy labels, age rating rationale). Historical reference — the app is
  already live, so treat this as "what we submitted," not a live checklist.

## One codebase, two platforms, two branches

- `claude/iphone-app-webview-jecqF` — primary iOS development branch.
- `claude/android-launch` — Android development branch.

These are **not** meant to diverge long-term. In practice, iOS-specific fixes get
developed and tested on the iphone branch first (faster TestFlight iteration), then
fast-forward-merged into the android branch once confirmed. Since `community.tsx` and
`LMSWebView.tsx` are shared by both platforms, most fixes benefit both even when only one
platform reported the bug. When starting new work, check whether the two branches have
diverged (`git log origin/claude/android-launch..claude/iphone-app-webview-jecqF`) before
assuming a clean fast-forward is still possible — merge conflicts become possible if
Android-specific commits are ever added independently.

## Versioning

`app.json`'s `version` field (currently `2.116621.33`) is used as both iOS's
`CFBundleShortVersionString` and Android's `versionName`. **Apple rejects any new binary
upload whose version is not strictly higher than the last *approved* App Store version**
— bump this before every new production build, even TestFlight-only ones. Android's
`versionCode` auto-increments via `eas.json`'s `autoIncrement: true` on the `production`
build profile, so it doesn't need manual bumping.

## Release process

### iOS
1. Build: `eas build --platform ios --profile production --non-interactive`
2. Submit to App Store Connect / TestFlight: `eas submit --platform ios --profile production --id <buildId> --non-interactive`
3. Wait ~5–10 min for Apple's processing email, then test via TestFlight
4. To promote to a public release: in App Store Connect, create a new App Store version
   matching the build's version number, attach the build, add release notes, and submit
   for review

### Android
1. If iOS fixes haven't been merged into `claude/android-launch` yet, fast-forward merge
   them first
2. Build: `eas build --platform android --profile production --non-interactive` (produces
   an `.aab` for Play Console; use `--profile preview` instead for a directly-installable
   `.apk` for quick device testing outside Play Console)
3. Download the `.aab`, upload it in Play Console under the relevant testing track (or
   Production once ready), add release notes, and roll out

### Required credentials (never commit these — all covered by `.gitignore`)
- `EXPO_TOKEN` — non-interactive EAS auth. Generate at expo.dev account settings; does
  not persist across fresh containers, needs to be exported each session.
- App Store Connect API key (`.p8` file) — path referenced in `eas.json`
  (`submit.production.ios.ascApiKeyPath`). Also does not persist across fresh containers.
- Google Play service account JSON — path referenced in `eas.json`
  (`submit.production.android.serviceAccountKeyPath`).
- `credentials.json` at the repo root is just a stale local-credentials pointer file
  (paths + empty password) from early setup — harmless, not an active secret.
  `credentialsSource: remote` in `eas.json` means EAS manages the real signing
  credentials server-side.

## Current status (last updated: 2026-08-24)

**iOS**: Live on the App Store already (under an older build, predating the WebView fixes
below). The Community horizontal white-space bug's **root cause is now identified**: the
homepage carousel's scroll container (`scrollWidth=1853` vs `clientWidth=350`) is a nested
scroll container whose overflow reached the document (`body.scrollWidth=832` vs a 390px
viewport). That is why the two earlier attempts failed — `bounces={false}`
(`2.116621.23`) and `overflow-x: clip` on `html`/`body` (`2.116621.24`) both targeted the
document, and overflow on an ancestor cannot contain a descendant that establishes its own
scrolling box. Found via the diagnostic overlay in `2.116621.25`.

Version `2.116621.26` clipped both the carousel container and its `ratioContainer` parent.
Tested on device: the white space was fixed, but the carousel froze. `2.116621.27` clipped
only `ratioContainer`; the white space stayed fixed, but the "Looking for more?" carousel
then showed only 2 of 4 cards and would not scroll on iOS (Android was unaffected).

Version `2.116621.28` dropped `max-width: 100%` from the `ratioContainer` rule, asserted
`overflow-x: auto` on the scroll container, and opened up the intermediate wrappers. Tested
on device: **no change** — still 2 of 4 cards, still unscrollable. So the collapse is not
caused by `max-width`, and `-webkit-overflow-scrolling` (inert since iOS 13) was never
going to help either.

Version `2.116621.29` (diagnostic v2) reported `nestedXScrollers=0` with
`body.scrollWidth=1049` against a 390px viewport — the scroll container had lost its
scrolling entirely **and** the bleed was still there, worse than the original 832. So the
`ratioContainer` clip was costing the carousel without buying containment.

Version `2.116621.30` reverses that: `overflow: visible` on the carousel's ancestors
(`ratioContainer`, `mobileMediaContainer`, `ListItem-styles-item`, plus a JS walk up from
the scroll container for unnamed wrappers) and `overflow-x: auto !important` back on
`carousel-scrollContainer`. A working scroll container contains its own overflow;
containment of the document now rests solely on the `html`/`body` `overflow-x: clip` rule,
which stays. Diagnostics are left **on** so one build reports both outcomes.

Version `2.116621.31` acts on the next diagnostic reading: `display: grid` on
`carousel-scrollContainer` with `sw=1853 cw=350`. It constrains the grid itself —
`grid-auto-flow: column`, `grid-auto-columns: 247px`, `grid-template-columns: none`,
`width: 350px`, `max-width: 100%`, `overflow-x: auto`, `overscroll-behavior-x: contain` —
plus `min-width`/`max-width: 247px` on the direct children. `grid-template-columns: none`
is **load-bearing**: `grid-auto-columns` sizes only implicit tracks, so without it an
explicit template on the site's own rule would make the 247px inert. Diagnostics stay on.

Two caveats for whoever tests this. `width: 350px` is **device-specific** — it is the
measured `clientWidth` on a 390px-viewport iPhone, and on a 375px or 430px device it will
be wrong (`max-width: 100%` keeps it from overflowing, but it will not fill). `width: 100%`
is the portable equivalent and should be preferred once the approach is confirmed. And the
white space is still unresolved independently: `2.116621.30` left containment resting
solely on the `html`/`body` `overflow-x: clip` rule, which has never been shown to work —
check `html.ovx`/`body.ovx` in the overlay. Do **not** re-clip `ratioContainer`;
`2.116621.26`–`.29` proved that breaks the carousel without fixing the bleed.

Version `2.116621.32` is `2.116621.31` with **`COMMUNITY_DIAGNOSTICS = false`** — the
overlay is compiled out (the gated interpolation yields an empty string, and the
`onMessage` handler early-returns), so this build carries no debug UI. Nothing else
changed: the carousel grid constraints from `.31` are still in place and still untested on
device, and the white space remains unresolved — containment still rests solely on the
`html`/`body` `overflow-x: clip` rule, which has never been shown to apply. Re-enabling the
overlay is one line in `constants/skilljar.ts`.

Version `2.116621.33` is the first change in this sequence driven by an **Android** tester
report rather than the Community WebView work, and touches neither `community.tsx` nor the
injected CSS. Two fixes: `animation: 'none'` on the root `Stack` screenOptions and on each
`Stack.Screen`, for a visible flash between routes on Android; and on the Academy landing
header, `headerLogo` swapped from a fixed `height: 110` to `aspectRatio: 260/110` plus
`maxHeight: 110` and `alignSelf: 'center'`, with `minHeight: '100%'` added to the scroll
container, for a logo overlapping the subtitle. **Untested** — to be checked on Appetize
before any build submission. The Community carousel and white-space state is unchanged
from `.32`.

**Android**: Not yet public. App created in Play Console (org: "Equinox Agents", to be
transferred to Board later, same as the Apple Developer account). Internal testing track
is set up with build carrying `versionCode 3` / version `2.116621.23`. Store listing,
content rating, data safety, and other pre-production Play Console requirements have not
been started yet.

## Known tricky areas (read before touching WebView code)

- **Cross-origin iframes are a hard wall.** Academy lesson videos can live inside a
  third-party vendor's cross-origin `<iframe>`. Normal `injectedJavaScript` runs in the
  main frame only and **cannot** reach `iframe.contentDocument`/`contentWindow` across
  origins — same-origin policy, not a bug, no workaround from the parent frame's JS. The
  only way in is `injectedJavaScriptBeforeContentLoadedForMainFrameOnly={false}`, which
  makes WKWebView inject the script natively into every frame's own JS context. This is
  how the native-fullscreen-video-takeover bug was actually fixed (see
  `components/LMSWebView.tsx`) — two earlier attempts that tried to reach in from the
  parent frame did not work.
- **Don't fight a site's own `position: fixed` header with JS.** An earlier approach tried
  to detect and "unstick" the site's fixed header reactively (MutationObserver + polling)
  — this was an unwinnable timing race against the site's own JS re-applying it, and
  produced flaky, inconsistent results across test rounds. The fix that actually worked:
  measure the header's rendered height and set `body { padding-top: <height>px }` to
  reserve space for it, leaving the header itself alone.
- **Use `overflow-x: clip`, not `hidden`, on the Community site.** `overflow-x: hidden`
  does collapse that site's hero/header flex layout into a single-column mess — but the
  cause is a CSS spec side effect, not the clipping. Per spec, `overflow-x: hidden` with
  `overflow-y: visible` coerces the used `overflow-y` to `auto`, silently making `body` a
  scroll container and changing containing-block/percentage resolution for descendants.
  `overflow-x: clip` creates no scroll container, so `overflow-y` stays `visible` and
  layout is untouched. It needs iOS 16+ (WKWebView), so feature-test with
  `CSS.supports('overflow-x','clip')`. `LMSWebView.tsx` (Academy) has a simpler layout and
  safely uses `overflow-x: hidden` on iOS.
- **Neither `directionalLockEnabled` nor `bounces={false}` stops horizontal white space.**
  This cost a full TestFlight round (build 60), so don't repeat it. `bounces={false}` maps
  to `UIScrollView.bounces = NO`, which only suppresses rubber-banding *past the content
  edge*. When `contentSize.width > bounds.width` — true of the Community homepage, whose
  layout is genuinely wider than the viewport — dragging right is ordinary scrolling
  within real content, not overscroll, and bounces has no effect on it.
  `directionalLockEnabled` only prevents diagonal panning; it does not prevent horizontal
  scrolling. Removing the horizontal *scrollable area* (the `overflow-x: clip` rule above)
  is the only thing that fixes this class of bug.
- **`react-native-webview` has no `backgroundColor` prop** — passing one is silently
  ignored (and fails typecheck). Set `style.backgroundColor`; RN forwards it to the native
  setter, which assigns `_webView.scrollView.backgroundColor` and toggles `drawsBackground`
  (`RNCWebViewImpl.m`). That scroll view's backdrop defaults to **white** and is what shows
  through wherever the page doesn't paint — so it's worth setting to the site's own
  background as a second line of defence behind any overflow fix.
- **`mediaPlaybackRequiresUserAction={false}` is required**, not optional — the SCORM
  lesson player calls `.play()` asynchronously after a tap, and if this is `true` that
  call gets blocked. To avoid reintroducing autoplay-on-load as a side effect, a
  touch-gated `HTMLMediaElement.prototype.play` override in
  `injectedJavaScriptBeforeContentLoaded` blocks `.play()` until the user's first touch
  in that frame.
- **`onShouldStartLoadWithRequest`'s `isTopFrame` field must be checked first.** Without
  `if ((request as any).isTopFrame === false) return true;` as the first line, iframe
  sub-resource loads (e.g. a video vendor's embed) get evaluated against
  `ALLOWED_WEBVIEW_DOMAINS` like a real navigation and, if the vendor's domain isn't
  allowlisted, get kicked out to the system browser instead of loading in-app. Only
  actual top-level navigation should be domain-restricted (that's what satisfies Apple's
  4+ age rating "unrestricted web access" question — it's about the user browsing to
  arbitrary sites, not first-party embedded content).
- **The Community white space came from a NESTED scroll container, not the document.**
  Three fixes failed before this was understood, so internalise the rule: overflow set on
  an ancestor cannot contain a descendant that establishes its own scrolling box. The
  culprit was the homepage carousel (`scrollWidth=1853`, `clientWidth=350`), fixed by
  clipping `[class*="carousel-scrollContainer"]` and `[class*="ratioContainer"]` directly.
  Match these by class *substring* — the full names are emotion hashes
  (`css-1deprjs-carousel-scrollContainer`) regenerated on every site deploy, so a pinned
  hash silently stops matching. **Clip the parent only, never the scroll container itself** —
  `2.116621.26` clipped both and the carousel froze on device, since clipping a scroll
  container removes the scrolling that makes it one. Clipping `ratioContainer` alone
  contains the bleed while the child keeps its own `overflow-x`.
- **`-webkit-overflow-scrolling: touch` does nothing on this app's iOS versions.** The
  property was removed in iOS 13; WKWebView ignores it and momentum scrolling is the
  default. It is present on the carousel rule in `community.tsx` because it was explicitly
  requested, but do not treat it as a fix or spend a build round on it.
- **When horizontal overflow survives a document-level fix, measure before fixing again.**
  `constants/communityDiagnostic.ts` (gated by `COMMUNITY_DIAGNOSTICS`) reports viewport vs
  document scrollWidth, whether the clip rule actually applied, the widest elements with
  their `position` values, and any nested horizontal scroll containers. It found this bug
  in one round after two blind attempts each cost a TestFlight cycle.
- **Every injected-JS fix should be wrapped in its own `try/catch`.** Sites change their
  DOM shape without notice; one throwing selector shouldn't silently abort every other
  fix in the same injection block.
