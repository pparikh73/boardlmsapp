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

`app.json`'s `version` field (currently `2.116621.52`) is used as both iOS's
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

Version `2.116621.34` fixes the Academy header overlap TJ reported on narrow Android
screens — the Board Academy logo colliding with the language selector. **That header is
Skilljar's own web markup, not a React Native component**; there is no logo-plus-language
header anywhere in this repo, so the fix is injected CSS in `LMSWebView.tsx`, not a style
change. It reuses the existing `findFixedHeader()` rather than Skilljar's class names,
makes the bar a nowrap flex row, returns absolutely-positioned **direct** children to flow
(a deeper dropdown panel must stay absolute to open), and gives the logo
`height: 22px; width: auto; max-width: 55%; flex-shrink: 1` with the right-hand controls at
`flex-shrink: 0`. **Untested.**

Version `2.116621.35` fixes excessive scrolling on the Academy landing screen, reported on
the installed Android APK. `2.116621.34` could not have addressed it — that was injected CSS
for Skilljar's web header *inside* the WebView, a different surface from this native screen.
Measured against the current styles, the content came to **564dp against roughly 556dp of
usable height** on a 640dp-tall device (screen minus status bar and the 60dp tab bar), so it
overflowed at default font scale and `justifyContent: 'center'` then pushed the login cards
below the fold. The fix reclaims **94dp of fixed chrome**: the logo is now height-driven at
72dp using the asset's own 1162/686 ratio (the old 260x110 box reserved 110dp of height and
37dp of width each side that `resizeMode="contain"` never filled), header `marginBottom`
44→24, scroll `paddingTop` 40→20, footer `marginTop` 40→24. Content drops to 470dp, which
clears the fold on a 640dp screen up to fontScale 1.5. The redundant `minHeight: '100%'`
added in `.33` is removed. **Untested on device.**

Version `2.116621.36` carries three fixes. **Auth screen logo**: `width: '80%'` capped at
`maxWidth: 260` with `maxHeight: 120`, so it renders ~203x120 instead of 122x72. Note this
adds 48dp back to the landing screen and the content now fits a 640dp screen only up to
about fontScale 1.2 — the `.35` headroom is spent, so trim elsewhere before adding more.
**Skilljar navbar logo**: a stylesheet rule for `.site-logo img`, `.navbar-brand img`,
`.sj-navbar__logo img`, `.sj-header__logo img` at `min-height: 36px; max-height: 48px`.
The `.34` JS header pass was changed to match, because it previously set an inline
`height: 22px !important` and **an inline `!important` outranks a stylesheet `!important`**
— it would have made the new rule inert on the element it targets.
**Navigation flash**: `animation: 'none'` in `.33` fixed only the Stack. Three separate
causes were found: the Tabs navigator animates by default in
`@react-navigation/bottom-tabs` 7.x and was never covered; `router.replace('/(tabs)')` ran
from an effect after mount, so the Stack rendered a default route then immediately
transitioned (replaced by `unstable_settings = { initialRouteName: '(tabs)' }`); and the
"text panel popping open" was `index.tsx` rendering the landing cards while the async
`getSession()` read was in flight after an SSO login, fixed by a synchronous session cache
in `services/auth.ts` that the screen seeds its state from. **Untested on device.**

Version `2.116621.37` re-fixes all three of `.36`'s items after device testing. **Logo**:
`maxHeight` 120→80, `width` '80%'→'70%', `maxWidth` 260→240, giving ~136x80 and putting the
content at 478dp, inside the fold up to fontScale 1.5. **Skilljar navbar logo**: the four
class selectors never matched, so the stylesheet rule is deleted and every `<img>` inside
`findFixedHeader()` is now sized in JS — no class name is guessed. `setProperty(...,
'important')` rather than plain assignment, since a plain inline declaration still loses to
the site's own `!important` rules. **Navigation flash**: the `.36` cache fix was
incomplete — it seeded `useState` from the cache, but `index.tsx` is a persistent tab that
never unmounts, so that initialiser ran once and the state stayed stale. The cache is now
read synchronously on **every focus**, and the async reconcile only commits a materially
different value (`getSession()` JSON.parses a fresh object each call, so it used to
re-render on every focus for nothing).

Version `2.116621.38` fixes the Android-only search freeze on `academy.board.com` (typing in
the search field made the app unresponsive; iOS was fine) plus a domain-allowlist bypass.
Two independent causes, both Android-specific:

1. **`onShouldStartLoadWithRequest` blocks the Android WebView thread.**
   `RNCWebViewClient.shouldOverrideUrlLoading` waits on a lock for up to
   `SHOULD_OVERRIDE_URL_LOADING_TIMEOUT = 250` ms per navigation; iOS's
   `decidePolicyForNavigationAction` is async and never blocks. Worse, Android's
   `createWebViewEvent()` does **not** include `isTopFrame` (the `WebResourceRequest`
   overload discards `request.isForMainFrame()`), so the `isTopFrame === false` early
   return **only ever works on iOS** — every sub-frame navigation fell through to the
   allowlist, and anything not on it hit `Linking.openURL`, firing an Android Intent
   resolution per keystroke. Fixed by allowing in-page schemes
   (`about:`/`blob:`/`data:`/`javascript:`/`file:`) to load in the WebView and never
   passing them to `Linking`.
2. **Two unthrottled full-DOM scans per mutation.** `padForFixedHeader` and
   `fixHeaderOverlap` both ran on a `MutationObserver`, and `findFixedHeader()` cached only
   a *hit* — a page with no qualifying fixed header re-walked every element calling
   `getComputedStyle` on each, on every mutation, and search autocomplete mutates the DOM
   on every keystroke. Misses are now cached for 2s, and every observer/scroll/resize
   callback is coalesced through one `requestAnimationFrame` guard, so a burst costs at
   most one pass per frame. Applied to `community.tsx` as well — same pattern, same risk.

**Allowlist bypass**: `ALLOWED_WEBVIEW_DOMAINS.some(d => url.includes(d))` was a substring
test that accepted `https://evil.example/?ref=.board.com` and
`https://notreally.board.com.attacker.net/` while rejecting the legitimate bare
`https://board.com/`. Replaced by `isAllowedWebViewUrl()` in `constants/skilljar.ts`, which
parses the hostname (stripping userinfo, so `https://academy.board.com@evil.example/` is
correctly blocked) and matches by equality or dot-suffix. The domain constants lost their
leading dots as part of this. **Untested on device.**

Version `2.116621.39` carries three fixes. **Landing screen**: logo `maxHeight` 80→60,
scroll `paddingTop` 20→10, header `marginBottom` 24→12. The logo renders ~102x60 and the
content comes to 436dp against roughly 556dp usable, clearing the fold up to fontScale 1.7.
**Search freeze (structural)**: the `.38` mitigations were not enough, so allowlist
enforcement now moves off the blocking callback on Android. `onShouldStartLoadWithRequest`
returns `true` immediately for any http(s) URL on Android after scheme handling, and
`onNavigationStateChange` — non-blocking, top-level only — stops an off-domain page,
hands it to the system browser and returns to allowed content. iOS keeps the inline check,
where `decidePolicyForNavigationAction` is async and `isTopFrame` is real. **The age-rating
guarantee is preserved**: an off-domain page is still never browsable in-app, it is bounced
one frame later rather than refused up front. `community.tsx` gained an
`onNavigationStateChange` for the same purpose; it previously had none.
**Academy navbar logo**: `min-height` 36→40px on every `<img>` in the header, plus a
fallback for when `findFixedHeader()` returns null — it only matches `position: fixed` or
`sticky`, so if Skilljar's navbar is statically positioned that whole pass never ran, which
would explain the logo staying small through `.34`, `.36` and `.37`. The fallback looks for
a `header`, `[role="banner"]` or `nav` near the top that actually contains an image.

Version `2.116621.40` makes Skilljar's "Get Started" dropdown usable on touch. The site
reveals `.dd-menu` on `:hover`, which a touch device never produces, so a tap followed the
trigger's `href` straight to learning-paths and the menu was unreachable. Injected into
`LMSWebView.tsx`: a `.has-dd.touch-open .dd-menu` rule mirroring the hover state, plus a
delegated `touchend`/`click` handler in the **capture** phase that toggles `touch-open` and
calls `preventDefault()` on a trigger whose href contains `learning-paths`. Delegated on
`document` so it survives the nav re-rendering; capture phase so the href is prevented
before Skilljar's own handler runs. Taps inside an open `.dd-menu` are left alone (they are
real links), and a tap outside closes any open dropdown. `!important` was added beyond the
requested rule, since the site's own visibility declarations may carry it. **Untested.**

Version `2.116621.41` fixes the dropdown not collapsing on a second tap on Android. `.40`
toggled on **both** `touchend` and `click`, with a 600ms guard meant to swallow the click
that follows a tap; that guard did not hold on Android WebView, so the second tap removed
`touch-open` on `touchend` and the click put it straight back. `touchend` is now the only
event that toggles, so there is no timing window left to get wrong. `click` is still bound
but only suppresses the trigger's navigation, never the class. The toggle is also explicit
(`contains` → `add`/`remove`) rather than `classList.toggle`, so state after a tap does not
depend on what the site may have done to the class in between, and opening one dropdown
closes any other. Taps inside `.dd-menu` return before both the `preventDefault` and the
toggle, so menu links stay clickable.

Version `2.116621.42` fixes the landing screen properly. `.35`–`.39` kept trimming dp and
the cards still needed scrolling, because the dp model was wrong in two Android-specific
ways that trimming could not reach:

1. **The bottom inset was counted twice.** `app/(tabs)/_layout.tsx` already reserves
   `56 + insets.bottom` for the tab bar, and the landing `SafeAreaView` had no `edges`
   prop, so it applied the bottom inset *again* for content that already sits above the
   tab bar — up to 48dp on gesture-nav Android. Fixed with
   `edges={['top', 'left', 'right']}`.
2. **`includeFontPadding` defaults to true on Android**, adding top and bottom padding to
   every `Text`. Roughly 63dp across this screen's 8 Text nodes, invisible in a dp model
   built from nominal line metrics — which is exactly why iOS matched the numbers and
   Android did not. Set to `false` on `subtitle`, `cardTitle`, `cardSub` and `footerText`.

`justifyContent: 'center'` is also **removed**. While content fits it is harmless, but once
it exceeds the scroll view, centring splits the overflow across both ends, pushing the
first card toward the middle and making the top unreachable — that is the "below the fold"
report, the overflow being *distributed* rather than the content being much too tall. Top
aligned means every card is reachable at any font scale. `paddingTop` 10→16 so the logo
does not sit against the status bar. Content now fits to fontScale 1.5 even with a 48dp
bottom inset, and beyond that it scrolls from the top with nothing cut off.

Note `app/(tabs)/index.tsx`'s **authenticated** branch still uses a `SafeAreaView` with no
`edges` prop around the WebView, so it double-counts the bottom inset in the same way —
left alone deliberately to keep this change to the reported screen.

Version `2.116621.43` is an **instrumented** build — `ACADEMY_DIAGNOSTICS = true` in
`constants/skilljar.ts`. **Do not ship it publicly**; set the flag false to compile the
logging out. It covers three reports.

**Landing screen.** All of `.42` verified present in the file: `edges={['top','left','right']}`,
`justifyContent` gone, `includeFontPadding: false` on all four text styles. So five builds
of dp arithmetic have now said this fits while the device disagreed — stop modelling and
measure. `onLayout` on the logo, header, cards and footer plus `onContentSizeChange` and the
ScrollView's own `onLayout` now log real heights as `[BC LAYOUT]`. Content height vs viewport
height is the only number that settles it. **No layout values were changed this build** —
changing them again before reading the measurements is what the last five builds did.

**Get Started dropdown.** Root cause is very likely **sticky `:hover`**: on Android the
`:hover` state remains on the last-tapped element until you touch elsewhere, so tap 1 opened
the menu via both `touch-open` *and* the site's own `.has-dd:hover` rule, and tap 2 removed
our class while `:hover` kept the menu visible. That is exactly why "tap outside closes"
worked and "tap again" did not — tapping outside moves the sticky hover away. The injected
CSS now neutralises `.has-dd:hover .dd-menu` inside `@media (hover: none), (pointer: coarse)`
*before* re-asserting `.has-dd.touch-open .dd-menu`; both are `(0,3,0)` so source order
decides. `[BC DD]` logs the touch target, whether `.has-dd`/`.dd-menu` matched, whether the
class was added or removed, and the menu's **computed** visibility afterwards — if the class
is removed but it still computes visible, the cause is CSS and not the handler.

**Search freeze.** Fix 2 is confirmed correctly applied (`components/LMSWebView.tsx:107`
returns `true` for Android before any domain work; enforcement is at line 59 in
`handleNavigationChange`). A **third** cause was found instead: `plObserver` called
`fixVideosEverywhere` **directly on every mutation**, uncoalesced. It observes `document.body`
with `childList`, `subtree` **and `attributes`**, and the callback does a full-document
`querySelectorAll('iframe')` plus a cross-origin `contentDocument` probe per iframe — each
throwing and being caught. The `.38` work coalesced `padForFixedHeader` and
`fixHeaderOverlap` but missed this one, and the attribute filter makes it fire more often
than either. It now goes through its own `requestAnimationFrame` guard. `[BC NAV]` also logs
every invocation of the blocking callback with its URL, so the next test says whether that
path is still hot during a search.

Version `2.116621.44` **rebuilds the landing screen layout from scratch** rather than
patching it again. `.35`–`.43` each trimmed dp off a `ScrollView`-based layout and the three
login cards still needed scrolling on Android, so the structure — not the numbers — was the
problem. The `ScrollView` is **gone**. The screen is now a single flex column:

- `container` — `flex: 1`, `flexDirection: 'column'`. Because it is `flex: 1` inside a
  `flex: 1` `SafeAreaView`, its height is **definite**, which is what lets the percentage
  `flexBasis` below resolve. (A percentage height against an auto-height parent resolves to
  auto in Yoga; the image would have silently fallen back to its intrinsic 1162x686.)
- `top` — `flexGrow: 0`, `flexShrink: 1`, `flexBasis: '22%'`. Claims no slack, gives way
  first, and is expressed as a share of the screen so the same style holds on a 480dp and a
  900dp device with no dp constant to re-tune.
- `logo` — `flex: 1`, `width: '100%'`, `maxWidth: 240`, `resizeMode="contain"`. **No height,
  no `aspectRatio`, no `maxHeight`.** Its height is now a *consequence* of the layout rather
  than an input to it, so "the logo is too tall" is no longer a reachable state.
- `spacer` — `flexGrow: 1`, `flexShrink: 1`, `flexBasis: 0`. The only slack absorber,
  replacing `justifyContent: 'center'`. It holds the gap open when there is room and
  collapses to zero before any real content shrinks.
- `cards` and `footer` — `flexShrink: 0`. This is the guarantee: whatever else gives way,
  all three login options keep their full height and stay on screen.

Collapse order under pressure is therefore spacer → `top`/logo → nothing else. The
non-shrinkable content (three cards ≈259dp + footer ≈41dp + 40dp container padding ≈340dp)
fits the ≈556dp usable height of a 640dp device with room to spare, and still fits at
fontScale 2.0 (≈440dp).

**The trade-off to know about**: with no `ScrollView` there is no fallback. If content ever
did exceed the container it would clip rather than scroll. `flexShrink: 0` on the cards
means that can never happen *to the cards* — the logo absorbs it — but on a very short
screen (≈480dp tall) at a very large font scale the footer could be squeezed. If that is
ever reported, shrink `top`'s `flexBasis` rather than reintroducing a scroll view.

Instrumentation from `.43` is **kept** (`ACADEMY_DIAGNOSTICS` still `true`, so this build is
also not for public release). The one number that settles the rebuild: `[BC LAYOUT] cards`
`y + h` must stay inside `[BC LAYOUT] container h`.

Version `2.116621.45` fixes the Android search freeze. The decisive new fact from the
tester: **search works in Chrome on the same device** (iQOO Z9s, Android 15). Chrome and
Android WebView are both V8 + Blink, so anything Skilljar's own code does, it does in both.
The difference is our injected JavaScript — Chrome does not run it.

**Fix 2 from `.39` is confirmed correctly applied** and is not the problem:
`onShouldStartLoadWithRequest` returns `true` for Android before any domain work, and
`onNavigationStateChange` carries the enforcement. Neither is hot during typing —
autocomplete uses XHR, which does not reach `shouldOverrideUrlLoading` at all.

**Root cause: `fixHeaderOverlap` is a forced-synchronous-layout thrash that ran once per
animation frame for as long as the DOM kept mutating.** Three defects compounded:

1. **Layout thrash.** It interleaved style *writes* with geometry *reads*:
   `getComputedStyle(header)` → three `setProperty` calls → `getComputedStyle(kids[i])` in a
   loop → image `setProperty` calls → `getBoundingClientRect()` in a loop → more writes.
   Every read after a write forces the engine to run layout synchronously before it can
   answer, so a single pass forced layout several times over.
2. **Unconditional writes.** It re-applied identical values on every invocation, re-dirtying
   layout each time even when nothing had changed.
3. **Uncached fallback.** `findFixedHeader()` caches hits *and* misses, but the `.39`
   fallback (`querySelectorAll('header, [role="banner"], nav')` plus a
   `getBoundingClientRect` per candidate) is the path actually taken when Skilljar's navbar
   is statically positioned — and it was never cached, so it re-queried the document every
   pass.

All three inputs to `bcSchedule` peak simultaneously on every keystroke: autocomplete
mutates the DOM (observers), the Android soft keyboard resizes the viewport (`resize`), and
the focused input scrolls into view (`scroll`).

The fixes, each one traceable to something provably wrong in the file rather than guessed:

- **The header passes are skipped entirely while a text field has focus** (`bcIsEditing()`
  in the frame guard, with a `focusout` catch-up). This is the cut that severs the
  keystroke→thrash chain. Nothing is lost: header geometry cannot meaningfully change while
  the user is typing into a field, which is all these tasks respond to.
- **`fixHeaderOverlap` rewritten** — the fallback header is cached, the whole pass returns
  early unless the header element or its width actually changed (one rect read instead of a
  full thrash), and all reads happen in a phase *before* all writes.
- **The `MutationObserver` in `injectedJavaScriptBeforeContentLoaded` is now coalesced.** It
  was uncoalesced, observed `document` (not `document.body`) with `childList`+`subtree`, and
  called `querySelectorAll('video')` per added node. **Both `.38` and `.43` grepped only
  `injectedJavaScript`, so the only observer in the other script was never audited** — and
  that script runs in every frame.
- **A duplicate `MutationObserver` was removed.** An identical registration
  (`document.body`, `childList`+`subtree`, `bcSchedule`) existed twice, making the engine
  dispatch two callbacks per mutation batch for one pass of work.
- **All three `setInterval` pollers now go through the frame guards.** They called
  `fixVideosEverywhere` / `padForFixedHeader` / `fixHeaderOverlap` *directly*, bypassing the
  coalescing for the first ~6.3 s after load — exactly the window in which a user reaches
  the search field.

**Ruled out, with reasons, so they are not re-investigated:** no `keydown`/`keypress`/
`input`/`focus` listener exists anywhere in the injected JS, and the two capture-phase
handlers (`touchend`/`click`) call `.closest()` and return early for any target outside
`.has-dd` — **they never touch the search field's events**. `javaScriptEnabled`,
`domStorageEnabled` and `cacheEnabled` are unset and default to `true`, matching Chrome.
`mixedContentMode` is unset (`'never'`) and `androidLayerType` is unset (`'none'`) — neither
would freeze, and blocked mixed content would fail silently. `setSupportMultipleWindows={false}`
routes `target="_blank"` through the blocking callback, but not per keystroke.

**One confound worth knowing for the Chrome comparison**: `WEBVIEW_USER_AGENT` spoofs
`Chrome/125.0.0.0` on a Pixel 8, so Skilljar is not told it is a WebView. That makes the two
environments *more* alike, not less — it argues against "Skilljar serves us different code"
— but the UA strings are not identical, so the comparison is close rather than exact.

`ACADEMY_DIAGNOSTICS` is still `true`, so this build is **not for public release**. Note the
`[BC NAV]` log sits *inside* the Android blocking callback, before its lock is released — so
turn the flag off before judging the freeze fix on timing.

Version `2.116621.46` is the **Android V1 release candidate** — the first build in this
sequence that carries no diagnostics and is intended to ship.

**Landing screen: verified, not changed.** The `.44` rebuild is structurally correct and the
shrink behaviour is provable rather than estimated. Flex shrink is distributed weighted by
`flexShrink × flexBasis`, so the spacer's weight is `1 × 0 = 0` — it cannot absorb shrink, it
only gives back the height it grew into. All real shrink therefore lands on `top`
(`1 × 22%`), and `cards`/`footer` at `flexShrink: 0` are excluded by arithmetic, not by
having enough room. No fixed heights, no `justifyContent`. **Nothing was trimmed this build**
— there was no provable defect to fix.

**Get Started dropdown: stopped competing with the hover rule.** `.40`–`.45` all tried to
*win* against Skilljar's `:hover`, most recently by neutralising `.has-dd:hover .dd-menu`
inside `@media (hover: none), (pointer: coarse)`. That media query is the weak link: if the
WebView reports `hover: hover` — a stylus, a connected mouse, or simply a WebView that
misreports — the neutraliser never matches and sticky `:hover` holds the menu open. That is
exactly the "closes on outside tap, not on second tap" report, because tapping outside moves
the sticky hover away.

The rule is now `.has-dd:not(.touch-open) .dd-menu { display: none !important; }`,
unconditional — no media query to misreport, and `display: none` cannot be overridden by any
`opacity`/`visibility`/`transform` declaration in the site's hover rule at any specificity.
The menu is visible **if and only if** `.touch-open` is present, so removing the class always
closes it. `display` is deliberately **not** set in the open rule: with `:not(.touch-open)`
no longer matching, the site's own `display` applies, so a `.dd-menu` that is a flex or grid
container keeps its internal layout.

**Dropdown across SPA navigation.** There was **no** `history` hook anywhere in the injected
JS — confirmed by grep, not assumed. Skilljar routes some navigation through `pushState`, so
the `.has-dd` element survived with its `touch-open` class and the menu rendered over the
next page; the only reset paths were a tap outside and a full document load.
`history.pushState` and `replaceState` are now wrapped (so the clear runs in the same task as
the navigation, rather than polled), with `popstate` for Back and `pagehide` for a real
unload. `handleNavigationChange` also injects the same clear as a native-side fallback,
placed **above** the `Platform.OS !== 'android'` early return — the dropdown is a touch
affordance on both platforms and must not be inside that block.

**Diagnostics removed, not just switched off.** `ACADEMY_DIAGNOSTICS = false`, and every
consumer is deleted: the `[BC LAYOUT]` `onLayout` logging and the `logLayout` helper in
`app/(tabs)/index.tsx`, the `[BC DD]` `bcLog`/`bcDesc` definitions and call sites, the
`[BC NAV]` log inside the Android blocking callback, and the `onMessage` bridge that carried
them (nothing else in `LMSWebView.tsx` posts, so the prop is gone entirely). A repo-wide grep
for `ACADEMY_DIAGNOSTICS`, `[BC `, `bcLog` and `logLayout` returns no hits in app code.
`COMMUNITY_DIAGNOSTICS` is `false` and `community.tsx` interpolates
`${COMMUNITY_DIAGNOSTICS ? COMMUNITY_DIAGNOSTIC_JS : ''}`, so the overlay compiles to an
empty string and its `onMessage` handler early-returns — **no debug UI reaches a user on
either tab.**

Note `constants/communityDiagnostic.ts` still exists and is still imported, so its ~5 KB
string is bundled although never injected. Harmless, and kept deliberately: it is the tool
to reach for if the Community white space regresses.

`ACADEMY_DIAGNOSTICS` is now read by nothing, so flipping it back to `true` does nothing on
its own — re-instrumenting means re-adding call sites.

**Still untested on device at time of writing**: the landing screen rebuild (`.44`), the
dropdown close rule, and the SPA-navigation clear. The search-freeze fix from `.45` is also
unconfirmed on device.

Version `2.116621.47` fixes three things found testing `.46` on device.

**1. Get Started went completely unresponsive — `display: none` reverted.** `.46`'s closed
rule was `.has-dd:not(.touch-open) .dd-menu { display: none !important; }` and the control
died. That declaration is gone; the menu is hidden with `opacity` + `visibility` +
`pointer-events` only.

Be careful with the reason recorded here, because a wrong one will cost a future build.
The reported mechanism — "`display: none` on a child blocks hit-testing on the parent" — is
**not** how Blink works: a `display: none` subtree is removed from the box tree entirely and
cannot intercept or absorb events for an ancestor. **The true mechanism is unproven.** What
is certain is that the CSS was the *only* thing `.46` changed for this control, the handler
is unchanged and correct, and the symptom appeared with it. A plausible unverified
explanation is that Skilljar's own script measures the menu on init (a positioning library
reading `offsetHeight`, say) and bails when every measurement is zero, taking the trigger's
interactivity with it. Do not treat that as established.

**The revert does not reintroduce the sticky-`:hover` bug**, and the reason is the selector
pair rather than the property. `:not(.touch-open)` and `.touch-open` are **mutually
exclusive** — exactly one matches at any moment, so they never compete. Both are `(0,3,0)`,
the same specificity as the site's `.has-dd:hover .dd-menu`, and this stylesheet is appended
to `<head>` after the site's, so source order decides and ours wins regardless of hover
state. `visibility: hidden !important` on the closed rule therefore beats the hover rule
whether or not `:hover` is stuck. The `@media (hover: none), (pointer: coarse)` block from
`.43`/`.45` stays deleted — it was the weak link, since a WebView reporting `hover: hover`
made the whole neutraliser inert.

The touch handler was re-verified line by line and is correct: `touchend` only, explicit
`contains` → `add`/`remove`, outside tap closes all, taps inside `.dd-menu` return before
both the `preventDefault` and the toggle.

**2. Search freeze — two rAF loops were never gated.** `.45` added `bcIsEditing()` to
`bcSchedule`, which covers the header tasks, and that guard is confirmed still in place. But
there are **three** rAF loops, not one, and the other two were left ungated:

- `bcScheduleMarkInline` (in `injectedJavaScriptBeforeContentLoaded`, so it runs in **every
  frame**) — a full-document `querySelectorAll('video')` per frame.
- `bcScheduleVideoFix` — the expensive one. `fixVideosEverywhere()` does a full-document
  `querySelectorAll('iframe')` and probes `f.contentDocument` on each; a cross-origin probe
  **throws a SecurityError that is then caught**, and throwing per iframe per frame is
  costly.

Both ran once per animation frame for as long as the DOM kept mutating — which during search
autocomplete is every keystroke. Both now stand down while a text field has focus. Nothing
is missed: typing into a search box inserts no videos or iframes, and anything that does
appear is caught on the next mutation after blur. `bcScheduleMarkInline` carries its own copy
of the check because it lives in a separate script with a separate scope.

**3. White page on Get Started → Search.** The history hooks from `.46` are confirmed present
(`pushState`, `replaceState`, `popstate`, `pagehide`). The white page is the
`loadingOverlay` — opaque white, `absoluteFill` — covering the old page between `onLoadStart`
and `onLoadEnd`.

**It was never an SPA problem.** Android fires `onPageStarted` for real navigations only, so
a `history.pushState` route change never raised `onLoadStart` and never showed the overlay;
"suppress it for SPA navigations" would have changed nothing. Tapping Search is a real
document load, which is why it flashed white. The overlay is now shown for the **first load
only** (`hasLoadedOnceRef`), so later navigations leave the previous page on screen until
the new one paints — what a browser does. The first load keeps it, since there is no
previous page and the alternative is a blank WebView.

Also note a real document load re-injects the scripts from scratch, so `touch-open` cannot
survive one; the `.46` history hooks only matter for genuine `pushState` routes.

Version `2.116621.48` — `.47` confirmed the login screen, search freeze and Community white
space fixed. Three items remained. **This build carries a probe: `ACADEMY_DIAGNOSTICS` is
`true` again.** Set it false before the release build; that one line compiles the probe out.

**1. Get Started "completely unresponsive" — the trigger was NEUTERED, not dead.**

The CSS was never the cause, which is why `.40`–`.47` kept failing: every one of them changed
the CSS and left the real defect untouched. Ruling the CSS out first, `pointer-events: none`
appears exactly once, in a rule whose **subject is `.dd-menu`** — `.has-dd` is only an
ancestor in the selector, and no rule anywhere sets `pointer-events`, `display` or
`visibility` on `.has-dd`, `header`, `nav` or `body`.

The defect is in the handler. `bcHandleDdTouch` is registered on `document` in the **capture
phase**, so it runs before the event reaches the target, and it called `preventDefault()` +
`stopPropagation()` **unconditionally** on any trigger whose href contains `learning-paths`.
That destroys the control's only native behaviour — navigating — and substitutes ours, which
produces a visible result *only if* a menu element exists inside that `.has-dd` and our CSS
matches it. When it does not, the tap does nothing at all. **A button that neither navigates
nor opens anything is indistinguishable from a dead button**, and that is the report.

It also explains the pattern exactly: this broke in every build that touched the dropdown
CSS because every one of those builds kept the unconditional suppression while its own CSS
variant failed to reveal the menu for its own separate reason.

The fix is to look for the menu **first** and return before touching the event if there is
nothing to open. The worst case is now that the control behaves exactly as if this script had
never run. **It can no longer be made less functional than untouched** — which is the
property that should have been there from `.40`. Applied to the click handler too, so a
click is never swallowed when we cannot replace it.

One precautionary change alongside it: `fixHeaderOverlap` forced `position: static` on every
absolutely-positioned **direct child** of the header, and it now skips any child that
contains a `.dd-menu`. Pushing an absolutely-positioned element back into flow gives it real
layout space where it can cover the nav and swallow touches — and a dropdown host is
precisely the element that is absolute on purpose. **Not a proven cause**; the proven cause
is the `preventDefault` above. It costs nothing and removes a way for this pass to break the
control beside it.

The probe reports, in one message per tap: whether `touchend` fired, the tag and class
tapped, whether `.has-dd` matched, whether a `.dd-menu` exists inside it, and the first
ancestor computing `pointer-events: none`. If it shows `hasDd=YES ddMenu=NO`, the class name
is wrong and the selector needs correcting — the button will still navigate normally in the
meantime.

**2. White page on Get Started → Search — the prescribed fix is already in place.**
`hasLoadedOnceRef` is set on the first `onLoadEnd` and `onLoadStart` only calls
`setLoading(true)` when it is false, so after the first load the overlay never renders again
regardless of what triggers `onLoadStart` — exactly the requested behaviour, shipped in
`.47`. The history hooks are confirmed intact (`pushState`, `replaceState`, `popstate`,
`pagehide`). **No further change was made, because none could be justified**: with the
overlay ruled out, the residual white is the WebView's own blank-document paint during a real
navigation, which is native behaviour and not something the overlay logic controls.

**3. Back button slow — caused by a bridge round trip I added in `.46`.**
`handleNavigationChange` called `injectJavaScript` **unconditionally on every navigation
state change**, before any early return, to clear stale dropdowns. That callback fires more
than once per navigation (the `lastBouncedRef` comment in the same function says so: loading
true, then false), and each `injectJavaScript` becomes an `evaluateJavascript` on the Android
UI thread — so every navigation, Back included, carried two or more extra round trips.

It was also **redundant**: the injected hooks already cover every navigation form —
`pushState`/`replaceState` wrapped, `popstate` for Back, `pagehide` for unload — and a real
document load re-injects the scripts from scratch, so `touch-open` cannot survive one. The
call is deleted. Nothing is lost.

Version `2.116621.49` restores the Get Started dropdown to its last state confirmed working
on device, found by `git diff` rather than by reasoning about it again. Only the dropdown
changed; the search, login, Community, allowlist and Back-button fixes are untouched.
`ACADEMY_DIAGNOSTICS` is back to `false` and the `.48` probe is deleted — the history
answered what it was for.

**The diff that settles it.** `f545add` is `2.116621.41`, the build the tester described as
"dropdown appeared on first tap, closed on an outside tap, only the second tap failed".
Against `.48` the handler is **byte-identical** apart from `.48`'s menu-exists guard. The
**only** substantive difference is the CSS:

- `.41`: one rule, `.has-dd.touch-open .dd-menu { opacity: 1; visibility: visible;
  transform: translateY(0); pointer-events: auto }` — all `!important`. **No closed-state
  rule at all.** Our stylesheet only ever forced the menu OPEN; the site's own CSS did every
  bit of the hiding.
- `.43` added a closed-state rule (inside `@media (hover: none)`), `.46` made it
  `display: none !important`, `.47` and `.48` made it
  `opacity: 0 / visibility: hidden / pointer-events: none !important`. Every build from
  `.46` on was reported as a completely unresponsive control.

**Why a closed-state rule on `.dd-menu` kills the TRIGGER**: `visibility` and
`pointer-events` both **inherit to descendants**. If Skilljar's `.dd-menu` is a wrapper that
*contains* the trigger rather than a sibling of it, hiding `.dd-menu` hides and disables the
trigger along with it. That fits every observation at once — three different hiding
properties, three identical dead-button reports, and a handler identical to the one that
worked. It also supersedes the `.47` note that the `display: none` mechanism was unproven:
the mechanism is inheritance, and it applies to all three properties.

The injected CSS is now **byte-identical to `.41`**, verified by comparing the two
stylesheets with whitespace stripped.

**The known cost, accepted deliberately**: a second tap may not close the menu, because
Android's sticky `:hover` keeps the site's own hover rule matching. That is exactly `.41`
behaviour. It is a far smaller problem than an unusable control, and it **must not** be
fixed by hiding `.dd-menu` from a stylesheet. An inline style on the menu element is not a
safe alternative either — inline declarations inherit the same way.

Two things from `.48` are kept, because both make the app do strictly *less* to the dropdown
than `.41` did and so cannot move it away from the working state: the menu-exists guard
(return before `preventDefault` if there is no `.dd-menu` to open, so the trigger degrades to
navigating rather than to nothing) and `fixHeaderOverlap` skipping any header child that
contains a `.dd-menu` when it forces `position: static`.

Version `2.116621.50` adds a once-per-navigation dropdown clear on the native side, as a
backstop for `touch-open` surviving a navigation to the Search page. Purely additive — one
file, 30 inserted lines, nothing removed.

`handleNavigationChange` now carries:

    if (nav.loading === false && nav.url !== lastUrlRef.current) {
      lastUrlRef.current = nav.url;
      webViewRef.current?.injectJavaScript(
        "document.querySelectorAll('.has-dd.touch-open').forEach(...remove('touch-open')); true;"
      );
    }

with a new `lastUrlRef`. That ref is **not** `lastBouncedRef`: that one tracks only
off-domain URLs and is reset to `null` on every allowed one, so it cannot double as a
previous-URL tracker.

**This is deliberately not the `.46` version, and the difference is the whole point.** `.46`
fired on every state change including `loading === true`, which is two or more
`evaluateJavascript` round trips per navigation on the Android UI thread — that is what made
Back feel slow. This fires on the `loading === false` edge only, and only when the URL
actually changed, so it costs at most **one** bridge call per navigation and none when a
navigation re-reports the same URL. Placed above the Android early-return, since the
dropdown is a touch affordance on both platforms.

**Scope, recorded honestly so the next person does not over-trust it.** The reported
mechanism was that the WebView paints the old DOM snapshot briefly before the new page
renders. If that is what is happening, this cannot be the cure: clearing a class on the new
DOM after it has painted cannot affect a snapshot of the old one, and a genuine full document
load re-injects the scripts into a fresh DOM that never had `touch-open` — so on that path
this call is a **no-op**. It earns its place on the paths where the document is *reused* — a
`pushState` route the in-page hooks somehow miss, or a same-document navigation — and as a
cheap backstop that cannot regress Back-button latency the way the unconditional version did.
If the overlay is still reported after this, the remaining suspect is the paint transition
itself, not the class, and the next thing to look at is `style.backgroundColor` on the
WebView rather than more JavaScript.

Version `2.116621.51` sets `style.backgroundColor` on the Academy WebView to
`BRAND.white`. One line of style plus its comment; nothing else touched.

**The `backgroundColor` prop was NOT added, and must not be.** It does not exist — verified
against the installed `WebViewTypes.d.ts`, which matches the long-standing note in this file.
Passing one fails typecheck, so adding it would have broken the "typecheck identical to
baseline" gate this build was held to. `style.backgroundColor` is the real mechanism: RN
forwards it to the native setter, which assigns `_webView.scrollView.backgroundColor`. Same
route `community.tsx` already uses via `COMMUNITY_BACKGROUND`.

**The value is derived, not measured.** `academy.board.com` is unreachable from the build
environment (the agent proxy returns `CONNECT tunnel failed, 403`), so `#ffffff` comes from
repo evidence: the injected rule sets `.scorm-lesson-content` and every `iframe` to
`#ffffff` explicitly "for a less jarring transition", which only makes sense if the
surrounding page is white, and Skilljar's stock theme is light. If anyone can read the real
computed `background-color` off the live site, confirm it against this.

**Two things this will not do, stated plainly so the next round does not bank on it.**

1. **It is a no-op for the white flash.** The native scroll-view backdrop already defaults to
   white on both platforms — that is exactly why white is what shows through. Setting it to
   white explicitly changes nothing today; it documents the intent and survives a future
   default change. Making the flash non-white requires a value that *differs* from the page
   background, which trades a white flash for a coloured one.
2. **It cannot hide the dropdown overlay.** A backdrop paints *behind* page content. If the
   WebView is showing a stale dropdown, that dropdown is painted content and no backdrop
   colour sits in front of it. So this does not address the reported overlay.

If the overlay survives this build, the remaining honest options are: confirm whether the
Search navigation is genuinely a full document load (if it is, the scripts re-inject into a
fresh DOM and `touch-open` cannot be the cause at all, which would mean the overlay is a
compositor artefact rather than DOM state), or stop hijacking the Get Started control on
Android and let it navigate to learning-paths as the site intends.

Version `2.116621.52` stops `fixHeaderOverlap` un-anchoring right-pinned header controls.
One condition changed plus a Phase-1 measurement; the rest of the function is untouched.

**The suspect.** `fixHeaderOverlap` forced `position: static !important` on **every**
absolutely-positioned direct child of the header, right after forcing the header itself to
`display: flex` + `flex-wrap: nowrap`. A top-right control — the language selector /
hamburger — is positioned absolute against the right edge. Forcing it to `static` drops it
into that freshly-created flex row, and normal flow puts it wherever the content lands: the
middle. Both device reports fit this: the hamburger in the middle of the bar, and the Search
page "scrambled". Both appear only in this app and never in a browser, which is consistent —
a browser does not run this script, and this function is **not platform-gated**.

**This is a strong inference, not a proof.** Nothing here was reproduced on device; the
confirming test is this build. If the hamburger returns to the top right, it was this write.
If it does not, the cause is elsewhere and this change is harmless.

**The fix.** An absolutely-positioned direct child is skipped when it is anchored within
50px of the viewport's right edge, measured in **Phase 1** alongside `kidAbsolute`:

    var bcViewportW = window.innerWidth;
    ...
    if (kidAbsolute[i]) {
      var kr = kids[i].getBoundingClientRect();
      kidRightAnchored[i] = (bcViewportW - kr.right) < 50;
    }

The measurement is deliberately **not** in the write loop. Doing it there would be a geometry
read after a style write — forced synchronous layout, the exact defect `.45` removed and the
one CLAUDE.md forbids.

**Why this costs `.34` nothing.** `.34`'s commit claimed the `position: static` force *was*
"the actual overlap", but that was never confirmed on device — and `.39` later recorded that
`findFixedHeader()` returned null, so the whole pass never ran through `.34`, `.36` and `.37`.
More importantly the claim does not hold up: an element pinned to the right edge cannot
collide with a left-hand logo. The collision TJ reported is the **logo growing under it**, and
that is contained by `max-width: 55%` plus the shrink factors further down — not by this
write. Those are all still in place.

The whole-function no-op was considered and rejected: it would also drop the logo sizing that
`.37` and `.39` built on.

Verified: 8/8 cases on a stubbed decision table — right-pinned language selector and
hamburger are skipped, a mid-bar absolute overlay is still returned to flow, dropdown hosts
stay skipped either way. Both injected scripts pass `node --check`; typecheck identical to
baseline.

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
  ignored (and fails typecheck). Re-verified against the installed `WebViewTypes.d.ts` in
  `.51`, so do not add it "as well as" the style, however the request is phrased.
  Set `style.backgroundColor`; RN forwards it to the native
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
- **`fixHeaderOverlap` must never un-anchor a right-pinned control.** It forces the header to
  a `nowrap` flex row and then forces absolutely-positioned direct children to
  `position: static`. A top-right control is absolute against the right edge, so that write
  drops it into the flex row and normal flow lands it in the MIDDLE of the bar — which is
  how the language selector / hamburger was reported. `.52` skips any absolute child within
  50px of the right edge, measured in Phase 1 (never in the write loop — that would be a read
  after a write). Remember this function runs on EVERY Academy page, is not platform-gated,
  and a browser never runs it — so "correct in a browser, wrong in the app" points here
  first.
- **A "header" bug may not be in this codebase at all.** The Academy and Community screens
  render whole third-party sites, so a reported header, logo or nav defect is usually
  Skilljar's or Vanilla's own markup rather than a React Native component. Grep for the
  element before writing a style fix: `2.116621.34` was requested as RN style props on a
  `rightControls`/language-selector component that exists on no branch. The fix belonged in
  injected CSS. Prefer driving such fixes off a measured element (e.g. `findFixedHeader()`)
  over the site's build-generated class names, which change on deploy.
- **`onShouldStartLoadWithRequest` behaves completely differently on Android.** It is a
  *blocking* call there — `RNCWebViewClient.shouldOverrideUrlLoading` waits on a lock up to
  250 ms per navigation — and the event carries **no `isTopFrame`**, so the
  `isTopFrame === false` guard above is an iOS-only optimisation. Keep this handler cheap
  and never let it reach `Linking.openURL` for in-page schemes: on Android that is an
  Intent resolution, and a widget navigating per keystroke will ANR the app.
- **Android allowlist enforcement lives in `onNavigationStateChange`, not
  `onShouldStartLoadWithRequest`.** The latter blocks the Android WebView thread and cannot
  see `isTopFrame`; the former is non-blocking and fires only for committed top-level
  navigation. iOS keeps the inline check. Both paths bounce off-domain pages to the system
  browser, so the 4+ age-rating answer is unchanged — do not "simplify" this back into one
  shared handler.
- **Anything on a `MutationObserver` must be cheap and coalesced.** These sites mutate the
  DOM on every keystroke. Cache negative lookups as well as positive ones — caching only
  the hit is what made `findFixedHeader()` re-walk the whole document per mutation — and
  route observer, scroll and resize callbacks through a single `requestAnimationFrame`
  guard (`bcSchedule`) rather than calling the work directly.
- **Two Android-only costs are invisible in a dp model.** A `SafeAreaView` inside the tab
  navigator must pass `edges={['top','left','right']}` — `tabBarStyle` already reserves
  `56 + insets.bottom`, so leaving `edges` unset spends that inset twice. And Android's
  `includeFontPadding` defaults to true, adding padding around every `Text`. Together they
  cost ~60-110dp on this app's screens, which is why `.35`-`.39` kept trimming dp against
  numbers that looked fine and a device that disagreed.
- **`justifyContent: 'center'` on a ScrollView `contentContainerStyle` is a trap.** It is
  fine while the content fits, but when it overflows the excess is split across both ends,
  so the top becomes unreachable rather than the bottom simply scrolling. Prefer top
  alignment on any screen whose height depends on the system font scale — or, as the
  landing screen now does, a `flexGrow` spacer, which puts the slack in exactly one place.
- **Percentage heights need a parent with a DEFINITE height.** Yoga resolves a percentage
  against the parent's resolved height, and an auto-height parent resolves it to auto — so
  `flexBasis: '22%'` or `maxHeight: '20%'` silently becomes "whatever the content wants"
  unless every ancestor up to the screen is `flex: 1` or explicitly sized. On the landing
  screen this is why `container` must stay `flex: 1` inside a `flex: 1` `SafeAreaView`.
- **A fixed-size logo is a recurring self-inflicted bug on this app.** `.33`–`.43` set
  `height`, then `aspectRatio` + `maxHeight`, then smaller `maxHeight`, and the screen
  overflowed every time because the logo's size was an *input* to the layout. Give the image
  `flex: 1` + a relative `width` + `resizeMode="contain"` and let its height fall out of the
  space that is actually left. Applies to any full-bleed art in a height-constrained screen.
- **NEVER add a closed-state rule for the Get Started dropdown. Only force it OPEN.** This
  cost four builds (`.46`-`.48`), each reported as a completely unresponsive control. The
  working rule, confirmed on device in `.41` and restored in `.49`, is exactly one selector:
  `.has-dd.touch-open .dd-menu` with `opacity`/`visibility`/`transform`/`pointer-events`
  set to their visible values. The site's own CSS does all the hiding. Adding
  `.has-dd:not(.touch-open) .dd-menu { display: none }` or `{ visibility: hidden;
  pointer-events: none }` kills the TRIGGER, because all three properties **inherit to
  descendants** and Skilljar's `.dd-menu` appears to wrap the trigger rather than sit beside
  it. An inline style on the menu is not a safe workaround — it inherits identically.
  The accepted cost is that a second tap may not close the menu: Android's `:hover` sticks
  to the last-tapped element, so the site's own hover rule keeps matching. Live with it.
  `@media (hover: none), (pointer: coarse)` does not rescue this either (`.43`, `.45`) — a
  WebView reporting `hover: hover` makes the block inert.
- **When a control regresses across builds, `git diff` the last version that worked before
  reasoning about mechanisms.** `.46`-`.48` produced three plausible-sounding theories
  (display/hit-testing, sticky hover, a neutered `preventDefault`) and three failed fixes.
  One `git show <commit>:<file>` against the last good build found the answer in minutes: the
  handler was byte-identical and the CSS had grown a rule that never existed in the working
  version. Ask "what changed" before asking "what could cause this".
- **Skilljar navigates via `history.pushState`, so in-page state survives a "page change".**
  Anything toggled by a class on a long-lived element (an open dropdown) must be cleared by
  wrapping `pushState`/`replaceState` and listening for `popstate`/`pagehide`. A full page
  load is not the only navigation. Those in-page hooks are sufficient on their own — do NOT
  also clear from `onNavigationStateChange`: `.46` did, and since that callback fires more
  than once per navigation and each `injectJavaScript` is an `evaluateJavascript` round trip
  on the Android UI thread, it made the Back button visibly slow. **Never put an
  unconditional `injectJavaScript` on the navigation path.** If you need one there, gate it
  the way `.50` does — `nav.loading === false` **and** the URL actually changed against a
  dedicated ref — so it costs at most one bridge call per navigation. And note what such a
  clear can and cannot do: a real document load re-injects into a fresh DOM that never had
  the class, so it is a no-op there; it only matters when the document is reused.
- **Never `preventDefault()` a control's native behaviour unless you can deliver the
  replacement.** The capture-phase dropdown handler suppressed the Get Started link's
  navigation on every tap, then relied on a class toggle whose visible effect depended on a
  menu element and a CSS match. When either was missing the button neither navigated nor
  opened — a dead control, reported four builds running as "unresponsive" and misdiagnosed as
  CSS every time. Look for what you intend to show FIRST and return untouched if it is not
  there. A hijacked control must degrade to its original behaviour, never to nothing.
- **Every `MutationObserver` callback must be behind a frame guard — check them ALL, in
  BOTH injected scripts.** `.38` coalesced two and missed `plObserver`; `.43` then caught
  that one but still grepped only `injectedJavaScript`, missing the observer in
  `injectedJavaScriptBeforeContentLoaded` — which observes `document` rather than
  `document.body` and runs in *every frame*. Grep the whole file for
  `new MutationObserver(`, not one prop.
- **Never interleave style writes with geometry reads.** `getComputedStyle` and
  `getBoundingClientRect` after a `setProperty` force the engine to run layout
  synchronously before answering. `fixHeaderOverlap` did this in two loops and was the
  Android search freeze. Read everything into locals first, then write. And guard the whole
  pass on something cheap that actually changed (the element and its width), so a
  re-entrant call costs one rect read instead of a full pass.
- **Anything on the mutation path must stand down while a text field has focus — and there
  are THREE rAF loops, not one.** Typing is the worst case for all triggers at once:
  autocomplete mutates the DOM, the Android soft keyboard fires `resize`, and
  scroll-into-view fires `scroll`. `.45` gated only `bcSchedule` and left
  `bcScheduleVideoFix` and `bcScheduleMarkInline` running a full-document query every frame.
  Grep for every `requestAnimationFrame(` in the file, exactly as you would for
  `new MutationObserver(`. `bcScheduleMarkInline` needs its own copy of the check: it is in
  the other script and cannot see `bcIsEditing`.
- **A backtick inside injected JS silently terminates the template literal.** This has now
  bitten twice (`.45`, `.47`) and both times it was a COMMENT quoting a selector or property
  in Markdown-style backticks — the most natural thing to type, and it truncates the script
  at that character with no build error. Never use a backtick inside either injected
  literal, in code or prose. Always extract both scripts and `node --check` them after
  editing: a short extraction length is itself the signal (`.47` came back at 1713 chars
  against an expected ~37000).
- **Every injected-JS fix should be wrapped in its own `try/catch`.** Sites change their
  DOM shape without notice; one throwing selector shouldn't silently abort every other
  fix in the same injection block.
