# Board Connect — App Store Submission Requirements

This document lists every field, asset, and document needed to publish the Board Connect
app on the Apple App Store. Items marked ✅ are ready to go. Items marked ❓ still need
Board's confirmation or input.

---

## 1. App Identity

| Field | Value | Status |
|---|---|---|
| App Name | Board Connect | ✅ Ready |
| Subtitle (max 30 chars) | Learn. Connect. Grow. | ✅ Ready (22 chars) |
| Bundle ID | com.base69a73ce716a9ce7953fb465f.app | ✅ Done |
| Primary Language | English (U.S.) | ✅ Done |
| Primary Category | Education | ✅ Recommended |
| Secondary Category | Business | ✅ Recommended |
| SKU | BOARD-CONNECT-IOS-001 | ❓ Confirm or replace with internal code |

---

## 2. App Store Listing Copy

### Description (max 4,000 characters)

```
Board Connect — Learn. Connect. Grow.

Board Connect is the official mobile app for Board International, bringing together
everything you need to get the most out of Board — learning, community, and growth —
all in one place.

LEARN
Access the full Board Academy course catalogue on the go. Whether you're onboarding
fast or deepening your expertise, interactive eLearning modules are available anytime,
on demand. Stream training videos inline, track your progress through structured
learning paths, and work toward Board certifications across finance, supply chain,
retail, and more.

CONNECT
Jump into the Board Community without leaving the app. Ask questions, share tips, and
learn from practitioners and experts around the world. The community tab gives you
instant access to discussions, answers, and peer knowledge.

GROW
Combine learning and community to build real-world Board expertise. Structured courses,
scenario-based business cases, and a global peer network help you get more value from
your Board investment — faster.

BUILT FOR BOARD USERS
Board Connect is designed exclusively for customers, partners, and employees of Board
International. Sign in with your existing Board account, your company's SSO, or as a
guest to get started.

SECURE AND SEAMLESS LOGIN
• Customer & Partner login via your Board account
• Employee login via Boardway (company SSO)
• Guest access for invited learners

Board Connect is powered by Board International — the platform trusted by leading
enterprises worldwide for integrated business planning.
```

> ❓ **Board marketing to review and approve before submission**

---

### Promotional Text (max 170 characters)
*Can be updated at any time without a new app review.*

```
Your Board training, community, and growth — all in one app. Learn. Connect. Grow.
```
*(83 characters)*

> ❓ **Board to confirm or replace**

---

### Keywords (max 100 characters, comma-separated)
*Do not repeat words already in the app name.*

```
training,LMS,e-learning,courses,certification,community,planning,CPM,IBP,academy
```
*(81 characters)*

> ❓ **Board to confirm or add preferred terms**

---

### Support URL
```
https://www.board.com/en/support
```

> ❓ **Board to confirm this URL resolves to a support page, or provide the correct one**

---

### Marketing URL (optional)
```
https://www.board.com/en/board-academy
```

> ✅ This page exists and describes Board Academy / Board Connect

---

## 3. Privacy Policy

Apple requires a publicly accessible privacy policy URL — both in the App Store listing
and accessible from within the app (already linked in the Settings tab).

**Proposed URL:**
```
https://www.board.com/privacy-policy
```

Board's existing policy covers:
- Personal data collected: name, surname, email, job title, address
- Processing purposes: service delivery, marketing, legal compliance
- User rights: access, correction, erasure, data portability
- Contact: privacy@board.com
- Data controller: Board International SA, Via Maestri Comacini 4, Chiasso, Switzerland 6830

> ❓ **Board legal to confirm this URL is acceptable for the App Store listing**

---

## 4. App Privacy Labels ("Nutrition Labels")

Board Connect is a WebView wrapper — it does not have its own analytics SDK, crash
reporter, or ad network. All data collection happens on Board/Skilljar's servers.

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

**Suggested App Store privacy label selection:**
- **Data Linked to You:** Email Address, User ID, Name
- **Data Used to Track You:** None

> ❓ **Board legal/privacy team to review and sign off before submission**

---

## 5. Age Rating

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
| Unrestricted web access | **Yes** |

**Resulting rating: 17+**

The 17+ rating is automatically applied to any app that uses a WebView. This is standard
practice and does not affect discoverability or ability to download for enterprise or
education users. LinkedIn, Salesforce, and most enterprise apps carry the same rating.

> ❓ **Board to confirm they accept the 17+ rating**

---

## 6. App Icon

| Requirement | Value | Status |
|---|---|---|
| Size | 1024 × 1024 px | ✅ Done (Icon-1024.png) |
| Format | PNG, no transparency | ✅ Done |
| Rounded corners | Applied automatically by Apple | ✅ Done |

---

## 7. Screenshots

**Minimum requirement: 1 set for iPhone 6.9" OR 6.5".** All other sizes scale automatically.

### Required: iPhone 6.9" (iPhone 16 Pro Max, 15 Pro Max)
- Portrait: **1290 × 2796 px**
- Format: PNG or JPEG, no alpha
- Quantity: 1–10 images

### Fallback: iPhone 6.5" (iPhone 14 Plus, 13 Pro Max)
- Portrait: **1284 × 2778 px**
- Only needed if you cannot provide 6.9"

### Optional: iPad 13"
- Portrait: **2064 × 2752 px**
- Only needed if you want the app listed as iPad-compatible

**Suggested screens to capture (in this order):**

1. **Login screen** — the 3 sign-in card options (Customer/Partner, Employee, Guest)
2. **Academy home** — course catalogue after login
3. **Course detail page** — showing the curriculum/lesson list
4. **Lesson view** — in-lesson with video playing inline
5. **Community tab** — the community homepage

> ❓ **Board or Piyush to take screenshots directly on device**

---

## 8. App Preview Video (Optional)

- Duration: 15–30 seconds
- Resolution: 1290 × 2796 (match 6.9" screenshot size)
- Format: .mov, .m4v, or .mp4
- Suggested flow: Login → Academy course catalogue → open a lesson → video plays inline → switch to Community tab

> ❓ **Optional — Board to decide**

---

## 9. Demo Account for Apple Reviewers

Apple reviewers must be able to log in and test the app.

| Field | Value |
|---|---|
| Login method | Customer / Partner Login |
| Username / Email | ❓ Board to provide |
| Password | ❓ Board to provide |
| Review notes | "Tap 'Customer / Partner Login' and enter the credentials above. You will land on the Board Academy course catalogue." |

**Requirements for this account:**
- Must be a real, working Skilljar account with access to at least one published course
- Must not expire during the review period
- Recommend creating a dedicated account: e.g. `apple-review@board.com`

> ❓ **Board to create and provide credentials**

---

## 10. What Happens After Submission

1. Board confirms/approves all items above
2. Piyush enters everything into App Store Connect and selects the current build
3. Submit for review — Apple reviews in **1–3 business days** (first submission)
4. If approved → app goes live on the App Store
5. If rejected → Apple gives specific reasons; most first-submission rejections are minor and fixable same day

---

## Summary Checklist

| Item | Proposed Value | Owner | Status |
|---|---|---|---|
| App Name | Board Connect | — | ✅ Ready |
| Subtitle | Learn. Connect. Grow. | — | ✅ Ready |
| Description | See Section 2 above | Board | ❓ Approve |
| Promotional Text | See Section 2 above | Board | ❓ Approve |
| Keywords | See Section 2 above | Board | ❓ Approve |
| Support URL | board.com/en/support | Board | ❓ Confirm |
| Marketing URL | board.com/en/board-academy | — | ✅ Ready |
| Privacy Policy URL | board.com/privacy-policy | Board Legal | ❓ Confirm |
| Privacy Labels | Name, Email, User ID linked to user | Board Legal | ❓ Sign off |
| Age Rating | 17+ (standard for WebView apps) | Board | ❓ Confirm |
| App Icon 1024×1024 | Icon-1024.png | — | ✅ Done |
| Screenshots (6.9" iPhone) | 5 suggested screens — see Section 7 | Board / Piyush | ❓ Capture |
| Demo Account | apple-review@board.com (suggested) | Board | ❓ Create |
| App Preview Video | Optional | Board | ❓ Optional |
| Build to submit | Current TestFlight build | — | ✅ Ready |
