# Board Connect — App Store Submission Requirements

This document lists every field, asset, and document needed to publish the Board Connect
app on the Apple App Store. Items marked ✅ are ready to go. Items marked ❓ still need
confirmation or input.

---

## 1. App Identity

| Field | Value | Status |
|---|---|---|
| App Name | Board Connect | ✅ Ready |
| Subtitle (max 30 chars) | Learn. Connect. Grow. | ✅ Ready (22 chars) |
| Bundle ID | com.base69a73ce716a9ce7953fb465f.app | ✅ Done |
| Primary Language | English (U.S.) | ✅ Done |
| Primary Category | Education | ✅ Ready |
| Secondary Category | Business | ✅ Ready |
| SKU | BOARD-CONNECT-IOS-001 | ✅ Use this unless Board provides an internal code |

---

## 2. App Store Listing Copy

### Description ✅ APPROVED BY BOARD MARKETING

```
Board Connect — Learn. Connect. Grow.

Board Connect is the official learning and community app for Board. Designed for
customers, partners, employees, and invited learners, it brings together learning,
collaboration, and expertise development in one connected experience. Whether you're
onboarding to Board, building advanced planning skills, preparing for certification,
or engaging with peers, Board Connect helps you learn continuously and stay connected
to the global Board ecosystem.

LEARN
Access Board Academy anytime, anywhere. Discover curated learning paths, interactive
courses, certification programs, and practical resources designed to help you build
expertise in enterprise planning and decision-making.
• Explore on-demand learning experiences
• Follow structured learning paths and certifications
• Watch training videos and interactive lessons
• Track your progress across courses and programs
• Develop practical skills through real-world scenarios

CONNECT
Join a global network of Board users, experts, and practitioners. Exchange ideas, ask
questions, share experiences, and learn from peers solving real business challenges.
• Participate in community discussions
• Connect with experts and fellow practitioners
• Discover best practices and new approaches
• Learn from customer success stories and shared experiences

GROW
Learning doesn't stop when a course ends. Board Connect combines education and community
to support continuous growth, helping you expand your knowledge, strengthen your skills,
and maximize the value of your Board investment.

SECURE ACCESS
Sign in with your Board account, your organization's single sign-on (SSO), or an
approved guest account.

Powered by AI and internal and external signals, Board helps organizations make
confident, aligned decisions in a constantly changing world. Board Connect extends that
experience by providing mobile access to the knowledge, skills, and community that
drive planning excellence.
```

---

### Promotional Text ✅ APPROVED BY BOARD MARKETING

```
Build expertise with OnDemand learning, certifications, and a global community of Board
professionals—all in one connected experience.
```

---

### Keywords ✅ APPROVED BY BOARD MARKETING

```
learning,certification,community,enablement,planning,analytics,finance,supplychain,IBP,CPM
```
*(90 characters)*

---

### Support URL
```
https://www.board.com/en/support
```

> ❓ **Board to confirm this URL resolves to a support page, or provide the correct one**

---

### Marketing URL
```
https://www.board.com/en/board-academy
```
✅ Page confirmed live

---

## 3. Privacy Policy

**Proposed URL:**
```
https://www.board.com/privacy-policy
```

Already linked in the app's Settings tab (satisfies Apple's in-app requirement).

> ❓ **Board legal to confirm this URL is acceptable for the App Store listing**

---

## 4. App Privacy Labels

Board Connect is a WebView wrapper — no analytics SDK, crash reporter, or ad network.
All data collection happens on Board/Skilljar's servers.

| Data Type | Collected? | Linked to User? | Used for Tracking? | Notes |
|---|---|---|---|---|
| Name | Yes | Yes | No | Provided at login via Skilljar/SSO |
| Email Address | Yes | Yes | No | Used as login identifier |
| User ID | Yes | Yes | No | Skilljar session token stored on device |
| Browsing History | No | — | — | WebView content not logged by app |
| Crash Data | No | — | — | No crash SDK installed |
| Location | No | — | — | Not requested or collected |
| Contacts | No | — | — | Not accessed |
| Financial Info | No | — | — | No purchases in app |
| Identifiers (IDFA) | No | — | — | No ad tracking |

**App Store selection:**
- Data Linked to You: Email Address, User ID, Name
- Data Used to Track You: None

> ❓ **Board legal to sign off before submission**

---

## 5. Age Rating

⚠️ **Board has requested 4+ or 12+ instead of 17+.**

The 17+ rating is triggered by answering "Yes" to Apple's "Unrestricted web access"
question. To achieve 4+, the app's WebView must be restricted to known Board/Skilljar
domains so we can truthfully answer "No."

**Proposed fix:** Restrict navigation to any URL matching:
- `*.board.com`
- `*.skilljar.com`
- `*.skilljar.app`
- `*.vanillacommunities.com`

External links would open in Safari instead of in-app. This is cleaner UX anyway and
avoids enumerating specific subdomains like before.

> ❓ **Piyush to implement domain restriction before submission to target 4+ rating**

**Age rating questionnaire answers (once restriction is in place):**

| Question | Answer |
|---|---|
| Cartoon or fantasy violence | None |
| Realistic violence | None |
| Sexual content or nudity | None |
| Profanity or crude humour | None |
| Alcohol, tobacco, or drug use | None |
| Gambling | None |
| Horror or fear themes | None |
| Medical or treatment information | None |
| Unrestricted web access | **No** (after domain restriction applied) |

**Target rating: 4+**

---

## 6. App Icon

| Requirement | Value | Status |
|---|---|---|
| Size | 1024 × 1024 px | ✅ Done (equal padding applied) |
| Format | PNG, no transparency | ✅ Done |
| Rounded corners | Applied automatically by Apple | ✅ Done |

> ❓ **Board graphics team is working on a new icon — replace assets/icon.png and assets/Icon-1024.png when received**

---

## 7. Screenshots

### Required: iPhone 6.9" (iPhone 16 Pro Max, 15 Pro Max)
- Portrait: **1290 × 2796 px**, PNG or JPEG, 1–10 images

### Fallback: iPhone 6.5"
- Portrait: **1284 × 2778 px** (only if 6.9" unavailable)

**Suggested screens (in order):**
1. Login screen — 3 sign-in options
2. Academy home — course catalogue after login
3. Course detail page — curriculum/lesson list
4. Lesson view — video playing inline
5. Community tab — community homepage

> ❓ **Piyush to take screenshots on device**

---

## 8. App Preview Video (Optional)

- 15–30 seconds, 1290 × 2796, .mov/.m4v/.mp4
- Flow: Login → Academy → open lesson → video inline → Community tab

> ❓ Optional

---

## 9. Demo Account for Apple Reviewers

| Field | Value |
|---|---|
| Login method | Customer / Partner Login |
| Username / Email | ❓ Piyush to provide |
| Password | ❓ Piyush to provide |
| Review notes | "Tap 'Customer / Partner Login' and enter the credentials above. You will land on the Board Academy course catalogue." |

> ❓ **Piyush to obtain and provide credentials**

---

## 10. Summary Checklist

| Item | Value | Status |
|---|---|---|
| App Name | Board Connect | ✅ Ready |
| Subtitle | Learn. Connect. Grow. | ✅ Ready |
| Description | Approved by Board marketing | ✅ Ready |
| Promotional Text | Approved by Board marketing | ✅ Ready |
| Keywords | Approved by Board marketing | ✅ Ready |
| Support URL | board.com/en/support | ❓ Board to confirm |
| Marketing URL | board.com/en/board-academy | ✅ Ready |
| Privacy Policy URL | board.com/privacy-policy | ❓ Board legal to confirm |
| Privacy Labels | Name, Email, User ID | ❓ Board legal to sign off |
| Age Rating | 4+ (requires domain restriction) | ❓ Code change needed |
| App Icon | Current padded icon | ❓ New icon from Board graphics pending |
| Screenshots | 5 screens on iPhone 6.9" | ❓ Piyush to capture |
| Demo Account | Working Skilljar login | ❓ Piyush to obtain |
| App Preview Video | Optional | ❓ Optional |
| Build | Current TestFlight build | ✅ Ready (pending above changes) |
