# Board Academy — App Store Submission Requirements

This document lists every field, asset, and document needed to publish the Board Academy
app on the Apple App Store. Items marked ✅ are ready to go. Items marked ❓ still need
Board's confirmation or input.

---

## 1. App Identity

| Field | Value | Status |
|---|---|---|
| App Name | Board Academy | ❓ Confirm |
| Subtitle (max 30 chars) | Learn. Certify. Grow. | ❓ Confirm |
| Bundle ID | com.base69a73ce716a9ce7953fb465f.app | ✅ Done |
| Primary Language | English (U.S.) | ✅ Done |
| Primary Category | Education | ✅ Recommended |
| Secondary Category | Business | ✅ Recommended |
| SKU | BOARD-ACADEMY-IOS-001 | ❓ Confirm or replace with internal code |

---

## 2. App Store Listing Copy

### Description (max 4,000 characters)

```
Board Academy puts your entire learning experience in your pocket.

Whether you're a Board customer, partner, or employee, Board Academy gives you instant 
access to the courses, certifications, and community you need to onboard fast and 
optimize faster.

LEARN ON YOUR SCHEDULE
Browse the full Board Academy course catalogue and pick up right where you left off — 
on your commute, between meetings, or anywhere else. Interactive eLearning modules are 
available anytime, on demand.

WATCH VIDEO LESSONS INLINE
Stream training videos directly inside the app without being pulled into a separate 
player. Lessons load fast and play smoothly so you can stay focused on the content.

EARN CERTIFICATIONS
Track your progress through structured learning paths and work toward Board 
certifications that demonstrate your expertise across finance, supply chain, retail, 
and more.

JOIN THE COMMUNITY
Connect with fellow Board users in the Board Community tab. Ask questions, share tips, 
and learn from practitioners around the world — all without leaving the app.

BUILT FOR BOARD USERS
Board Academy is designed exclusively for customers, partners, and employees of Board 
International. Sign in with your existing Board account, your company's SSO, or as a 
guest to get started.

SECURE AND SEAMLESS LOGIN
• Customer & Partner login via your Board account
• Employee login via Boardway (company SSO)
• Guest access for invited learners

Board Academy is the official mobile learning companion for Board International — the 
platform trusted by leading enterprises worldwide for integrated business planning.
```

> ❓ **Board marketing to review and approve before submission**

---

### Promotional Text (max 170 characters)
*This text appears above the description and can be updated at any time without a new app review.*

```
Your Board training, certifications, and community — now in your pocket. Learn anywhere, anytime.
```
*(95 characters)*

> ❓ **Board to confirm or replace**

---

### Keywords (max 100 characters, comma-separated)
*Used for App Store search ranking. Do not repeat words already in the app name.*

```
training,LMS,e-learning,courses,certification,planning,community,CPM,IBP,eLearning
```
*(84 characters)*

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

> ✅ This page exists and describes Board Academy

---

## 3. Privacy Policy

Apple requires a publicly accessible privacy policy URL.

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
> In most cases, an existing corporate privacy policy is sufficient.

---

## 4. App Privacy Labels ("Nutrition Labels")

Apple requires you to declare all data your app collects. The Board Academy app is a 
WebView wrapper — it does not have its own analytics SDK, crash reporter, or ad network.
All data collection happens on Board/Skilljar's servers, not in the app itself.

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
| Health & Fitness | No | — | — | Not collected |
| Identifiers (IDFA) | No | — | — | No ad tracking |

**Suggested App Store privacy label selection:**
- **Data Linked to You:** Email Address, User ID, Name
- **Data Not Linked to You:** None
- **Data Used to Track You:** None

> ❓ **Board legal/privacy team to review and sign off before submission**

---

## 5. Age Rating

Apple requires answering a short questionnaire. Answers for this app:

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

The 17+ rating is automatically applied to any app that uses a WebView (because Apple 
cannot verify what web content may appear). This is standard practice and does not 
affect discoverability or ability to download for enterprise/education users. LinkedIn, 
Salesforce, and most enterprise apps carry the same rating.

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
> Enable "Show touches" in Developer settings for a polished look (optional)

---

## 8. App Preview Video (Optional)

- Duration: 15–30 seconds
- Resolution: 1290 × 2796 (match 6.9" screenshot size)
- Format: .mov, .m4v, or .mp4
- Tip: Use iOS screen recording, then trim in iMovie

Suggested flow: Login screen → Academy home → tap a course → lesson plays inline → 
switch to Community tab.

> ❓ **Optional — Board to decide**

---

## 9. Demo Account for Apple Reviewers

Apple reviewers cannot approve an app they cannot use. A working login must be provided.

| Field | Value |
|---|---|
| Login method | Customer / Partner Login |
| Username / Email | ❓ Board to provide |
| Password | ❓ Board to provide |
| Review notes | "Tap 'Customer / Partner Login' and enter the credentials above. You will land on the Board Academy course catalogue." |

**Requirements for this account:**
- Must be a real, working Skilljar account
- Must have access to at least one published course
- Must not expire during the review period (set no expiry)
- Recommend creating a dedicated account: e.g. `apple-review@board.com`

> ❓ **Board to create and provide credentials**

---

## 10. What Happens After Submission

1. Board confirms/approves all items above
2. Piyush enters everything into App Store Connect and selects build 36
3. Submit for review — Apple reviews in **1–3 business days** (first submission)
4. If approved → app goes live on the App Store immediately or on a chosen release date
5. If rejected → Apple gives specific reasons; most first-submission rejections are minor and fixable same day

---

## Summary Checklist

| Item | Proposed Value | Owner | Status |
|---|---|---|---|
| App Name | Board Academy | Board | ❓ Confirm |
| Subtitle | Learn. Certify. Grow. | Board | ❓ Confirm |
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
| Build to submit | Build 36 (current TestFlight build) | — | ✅ Ready |
