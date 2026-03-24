// Skilljar domain and auth configuration for Board Academy
export const SKILLJAR_DOMAIN = '34t7lq90dtcj7';
export const SKILLJAR_BASE_URL = 'https://accounts.skilljar.com';
export const SKILLJAR_CONTENT_URL = 'https://academy.board.com';
export const COMMUNITY_BASE_URL = 'https://community.board.com';

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
    url: `${COMMUNITY_BASE_URL}/hc/en-us/community/topics`,
  },
  {
    id: 'resources',
    title: 'Resources',
    description: 'Docs, guides & downloadable assets',
    emoji: '📚',
    url: `${COMMUNITY_BASE_URL}/hc/en-us/categories`,
  },
  {
    id: 'training',
    title: 'Training',
    description: 'Courses and learning paths',
    emoji: '🎓',
    url: SKILLJAR_CONTENT_URL,
  },
  {
    id: 'idea-exchange',
    title: 'Idea Exchange',
    description: 'Submit and vote on product ideas',
    emoji: '💡',
    url: `${COMMUNITY_BASE_URL}/hc/en-us/community/topics`,
  },
  {
    id: 'partner-hub',
    title: 'Partner Hub',
    description: 'Resources for Board partners',
    emoji: '🤝',
    url: 'https://www.board.com/partners',
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
    url: `${COMMUNITY_BASE_URL}/hc/en-us/requests/new`,
  },
] as const;

export const SUPPORT_EMAIL = 'academy@board.com';

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
