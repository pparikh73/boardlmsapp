# Board Academy — App Store Submission Requirements

This document lists every field, asset, and document needed to publish the Board Academy
app on the Apple App Store. Items marked ✅ are already done. Items marked ❓ need input
from Board.

---

## 1. App Identity

| Field | Value | Status |
|---|---|---|
| App Name | Board Academy | ❓ Confirm |
| Subtitle (max 30 chars) | e.g. "Learning for Board Users" | ❓ Provide |
| Bundle ID | com.base69a73ce716a9ce7953fb465f.app | ✅ Done |
| Primary Language | English (U.S.) | ✅ Done |
| Primary Category | Education | ❓ Confirm |
| Secondary Category | Business (optional) | ❓ Confirm |
| SKU | Internal reference code (e.g. BOARD-ACADEMY-IOS) | ❓ Provide |

---

## 2. App Store Listing Copy

### Description (max 4,000 characters)
Full description of the app shown on the App Store page.
Suggested structure:
- What the app is (1–2 sentences)
- Key features (bullet list)
- Who it's for (customers, partners, employees)

> ❓ **Board to provide**

### Promotional Text (max 170 characters)
Appears above the description. Can be updated without a new app review.
Example: *"Access Board training courses, certifications, and the Board community — all from your phone."*

> ❓ **Board to provide or approve**

### Keywords (max 100 characters total, comma-separated)
Used for App Store search ranking. Example:
`Board, LMS, training, e-learning, academy, certification, courses, community`

> ❓ **Board to provide**

### Support URL
A publicly accessible webpage where users can get help.
Example: `https://www.board.com/support` or `https://academy.board.com/support`

> ❓ **Board to provide URL**

### Marketing URL (optional)
A webpage about the app. Example: `https://www.board.com/academy`

> ❓ **Board to provide URL (optional)**

---

## 3. Privacy Policy

Apple requires a publicly accessible privacy policy URL.

**Board already has a privacy policy at:**
👉 https://www.board.com/privacy-policy

The existing policy covers:
- Personal data collected (name, email, job title, address)
- Processing purposes (service delivery, marketing, legal compliance)
- User rights (correction, erasure, portability)
- Contact: privacy@board.com
- Data controller: Board International SA, Via Maestri Comacini 4, Chiasso, Switzerland

**Action needed:** Confirm with Board's legal team whether:
1. The existing URL can be used as-is for the app listing, OR
2. A separate mobile app privacy policy is needed

> ❓ **Board legal to confirm URL** — most likely `https://www.board.com/privacy-policy`

---

## 4. App Privacy Labels ("Nutrition Labels")

Apple requires you to declare what data the app collects. Based on the app's behaviour:

| Data Type | Collected? | Linked to User? | Used for Tracking? |
|---|---|---|---|
| Name | Yes (via login) | Yes | No |
| Email Address | Yes (via login) | Yes | No |
| User ID | Yes (session token) | Yes | No |
| Coarse Location | No | — | — |
| Browsing History | No (WebView only, no logging) | — | — |
| Crash Data | No (no crash SDK installed) | — | — |

> ❓ **Board legal/privacy team to review and sign off on these declarations**

---

## 5. Age Rating

Apple requires answering a questionnaire. Suggested answers for this app:

| Question | Answer |
|---|---|
| Cartoon or fantasy violence | None |
| Realistic violence | None |
| Sexual content | None |
| Nudity | None |
| Profanity or crude humour | None |
| Alcohol, tobacco, drugs | None |
| Gambling | None |
| Horror/fear themes | None |
| Medical/treatment information | None |
| Unrestricted web access | **Yes** (WebView app) |

The "Unrestricted web access" answer will result in a **17+ age rating.**
This is standard for any WebView-based app and will not block enterprise or education users.

> ❓ **Board to confirm they accept 17+ rating**

---

## 6. App Icon

| Requirement | Value | Status |
|---|---|---|
| Size | 1024 × 1024 px | ✅ Done (Icon-1024.png) |
| Format | PNG, no alpha/transparency | ✅ Done |
| No rounded corners | Apple applies them automatically | ✅ Done |

---

## 7. Screenshots

**Only 2 sizes are strictly required.** All other sizes are auto-scaled by Apple.

### Required: iPhone 6.9" (iPhone 16 Pro Max / 15 Pro Max)
- Portrait: **1290 × 2796 px** (or 1260 × 2736 px)
- Minimum 1, maximum 10 per size
- Format: PNG or JPEG

### Required: iPhone 6.5" (iPhone 14 Plus / 13 Pro Max)
- Portrait: **1284 × 2778 px**
- Only needed if 6.9" not provided

### Recommended to also provide:
- iPad 13" Portrait: **2064 × 2752 px** (if you want iPad listed — optional)

**Suggested screenshots to capture (on the actual device):**

1. Academy home / course catalogue (logged in)
2. A course detail page showing video lesson
3. Community tab
4. Login screen (showing the 3 sign-in options)
5. Academy nav bar / in-lesson view

> ❓ **Board to take screenshots on iPhone 16 Pro Max or similar**
> Screenshots must show real content — no placeholder screens

---

## 8. App Preview Video (Optional but Recommended)

- Duration: 15–30 seconds
- Resolution: match screenshot size (1290 × 2796 for 6.9")
- Format: .mov, .m4v, .mp4
- Shows the app in use (screen recording from device)

> ❓ **Optional — Board to decide if they want to provide**

---

## 9. Demo Account for Apple Reviewers

Apple's reviewers must be able to log in and test the app. You need to provide:

| Field | Value |
|---|---|
| Username / Email | A working test account email |
| Password | Password for that account |
| Notes | e.g. "Select Customer/Partner login, use these credentials" |

> ❓ **Board to create a dedicated Apple Review test account**
> Recommend: a real Skilljar account that won't expire and has access to at least one course

---

## 10. What Happens After Submission

1. Board provides all items above → you enter them in App Store Connect
2. Select build 36 (current TestFlight build) as the submission build
3. Submit for review → Apple reviews in **1–3 business days**
4. If approved → app goes live on the App Store
5. If rejected → Apple provides specific reasons; usually fixable quickly

---

## Summary Checklist

| Item | Owner | Status |
|---|---|---|
| App Name + Subtitle | Board | ❓ |
| Description (4,000 chars) | Board | ❓ |
| Promotional Text | Board | ❓ |
| Keywords | Board | ❓ |
| Support URL | Board | ❓ |
| Privacy Policy URL | Board Legal | ❓ (likely board.com/privacy-policy) |
| Privacy Labels sign-off | Board Legal | ❓ |
| Age Rating (17+ OK?) | Board | ❓ |
| App Icon 1024×1024 | Done | ✅ |
| Screenshots (6.9" iPhone) | Board | ❓ |
| Demo Account credentials | Board | ❓ |
| App Preview Video | Board (optional) | ❓ |
