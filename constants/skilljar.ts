import { Platform } from 'react-native';

// Skilljar domain and auth configuration for Board Academy
export const SKILLJAR_DOMAIN = '34t7lq90dtcj7';
export const SKILLJAR_BASE_URL = 'https://accounts.skilljar.com';
export const SKILLJAR_CONTENT_URL = 'https://academy.board.com';
export const COMMUNITY_BASE_URL = 'https://community.board.com';
// Backdrop for the Community WebView. WKWebView's default backdrop is white, which
// shows through anywhere the page itself doesn't paint. Keep this in sync with the
// Community site's own page background.
export const COMMUNITY_BACKGROUND = '#1a2444';

// TEMPORARY. Renders an on-screen diagnostic overlay on the Community tab to
// identify the source of the horizontal white space. MUST be false for any
// public App Store release — testers would otherwise see a debug overlay.
// Delete this flag and constants/communityDiagnostic.ts once the bug is found.
export const COMMUNITY_DIAGNOSTICS = false;
// Community uses Azure AD B2C — separate from Academy's Skilljar SSO
export const COMMUNITY_AUTH_URL = 'https://community.board.com/entry/signin?target=https%3A%2F%2Fcommunity.board.com%2F';
// Community employee login uses Azure AD SAML (Boardway/corporate SSO)
export const COMMUNITY_EMPLOYEE_AUTH_URL = 'https://community.board.com/entry/saml/AzureADSAML?Target=https%3A%2F%2Fboard.vanillacommunities.com%2F';

// Auth endpoints
export const AUTH_URLS = {
  customerPartner: `${SKILLJAR_CONTENT_URL}/auth/login/3u81yknqkpzep?next=%2Fauth%2Fendpoint%2Flogin%2Fresult%3Fnext%3D%252F%26d%3D${SKILLJAR_DOMAIN}`,
  employee: `${SKILLJAR_CONTENT_URL}/auth/login/3lxgvwj219h3a?next=%2Fauth%2Fendpoint%2Flogin%2Fresult%3Fnext%3D%252F%26d%3D${SKILLJAR_DOMAIN}`,
  guest: `${SKILLJAR_CONTENT_URL}/auth/login/ddawo1d1yhfb?next=%2Fauth%2Fendpoint%2Flogin%2Fresult%3Fnext%3D%252F%26d%3D${SKILLJAR_DOMAIN}`,
  signUp: `${SKILLJAR_BASE_URL}/auth/domain/${SKILLJAR_DOMAIN}/register`,
  logout: `${SKILLJAR_BASE_URL}/auth/logout`,
} as const;

// Tab content URLs (post-login)
export const TAB_URLS = {
  home: `${SKILLJAR_CONTENT_URL}`,
  myLearning: `${SKILLJAR_CONTENT_URL}/dashboard`,
} as const;

// Community section cards shown on the Community tab
export const COMMUNITY_SECTIONS = [
  {
    id: 'forums',
    title: 'Forums',
    description: 'Browse discussions & get answers',
    emoji: '💬',
    url: `${COMMUNITY_BASE_URL}/categories/forums`,
  },
  {
    id: 'resources',
    title: 'Resources',
    description: 'Docs, guides & downloadable assets',
    emoji: '📚',
    url: `${COMMUNITY_BASE_URL}/categories`,
  },
  {
    id: 'training',
    title: 'Training',
    description: 'Courses and learning paths',
    emoji: '🎓',
    url: `${COMMUNITY_BASE_URL}/categories/academy-forum`,
  },
  {
    id: 'idea-exchange',
    title: 'Idea Exchange',
    description: 'Submit and vote on product ideas',
    emoji: '💡',
    url: `${COMMUNITY_BASE_URL}/categories/idea-exchange`,
  },
  {
    id: 'partner-hub',
    title: 'Partner Hub',
    description: 'Resources for Board partners',
    emoji: '🤝',
    url: `${COMMUNITY_BASE_URL}/categories/partner-hub`,
  },
  {
    id: 'blog',
    title: 'Blog',
    description: 'News, insights & announcements',
    emoji: '📰',
    url: 'https://www.board.com/blog',
  },
  {
    id: 'support',
    title: 'Support',
    description: 'Get help from the Board team',
    emoji: '🛟',
    url: `${COMMUNITY_BASE_URL}/categories/support`,
  },
] as const;

export const SUPPORT_EMAIL = 'academy@board.com';

// Shared across all in-app WebViews (Academy + Community) so both platforms
// send a user agent matching their actual rendering engine.
export const WEBVIEW_USER_AGENT = Platform.select({
  ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
});

// Domains allowed to load in-app; anything else opens in the system browser.
// Keeps "Unrestricted web access" truthfully answered "No" for Apple's 4+ age rating.
export const ALLOWED_WEBVIEW_DOMAINS = ['.board.com', '.skilljar.com', '.skilljar.app', '.vanillacommunities.com'];

// Board Visual Identity Guidelines v3.0 — May 2024
// Primary color (standalone use always permitted)
// Gradient colors must only be used as part of approved gradient pairs — never standalone
export const BRAND = {
  // Primary — Board Blue (standalone use permitted)
  primary: '#253e7d',
  // Neutrals (standalone use permitted)
  dark1: '#252c43',
  dark2: '#39445d',
  mid1: '#5c6584',
  mid2: '#80879e',
  light1: '#bfc3ce',
  white: '#ffffff',
  // Corporate gradient stops — DO NOT use standalone
  // Approved gradient: violet → primary → cyan → lightGreen
  gradientColors: ['#8739e4', '#253e7d', '#32bef0', '#46eeaa'] as const,
  // Convenience gradient pairs (approved)
  gradientPurpleBlue: ['#8739e4', '#253e7d'] as const,
  gradientBlueCyan: ['#253e7d', '#32bef0'] as const,
  gradientCyanGreen: ['#32bef0', '#46eeaa'] as const,
} as const;

// Secure store key for persisting session
export const SESSION_STORE_KEY = 'board_academy_session';
