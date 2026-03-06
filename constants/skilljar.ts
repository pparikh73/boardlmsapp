// Skilljar domain and auth configuration for Board Academy
export const SKILLJAR_DOMAIN = '34t7lq90dtcj7';
export const SKILLJAR_BASE_URL = 'https://accounts.skilljar.com';
export const SKILLJAR_CONTENT_URL = 'https://academy.board.com';

// Auth endpoints
export const AUTH_URLS = {
  // OAuth SSO — Customer / Partner login (direct to academy.board.com to avoid AVEYA IdP selection)
  customerPartner: `${SKILLJAR_CONTENT_URL}/auth/login/3u81yknqkpzep?next=%2Fauth%2Fendpoint%2Flogin%2Fresult%3Fnext%3D%252F%26d%3D${SKILLJAR_DOMAIN}`,
  // SAML SSO — Employee login
  employee: `${SKILLJAR_BASE_URL}/auth/login/3lxgvwj219h3a`,
  // Native — Guest email/password login
  guest: `${SKILLJAR_BASE_URL}/auth/login/ddawo1d1yhfb`,
  // Guest sign-up
  signUp: `${SKILLJAR_BASE_URL}/auth/domain/${SKILLJAR_DOMAIN}/register`,
  // Logout
  logout: `${SKILLJAR_BASE_URL}/auth/logout`,
} as const;

// Tab content URLs (post-login)
export const TAB_URLS = {
  home: `${SKILLJAR_CONTENT_URL}`,
  myLearning: `${SKILLJAR_CONTENT_URL}/dashboard`,
} as const;

export const SUPPORT_EMAIL = 'academy@board.com';

export const BRAND = {
  primary: '#1694d1',
  primaryDark: '#0f6fa3',
  white: '#ffffff',
  backgroundLight: '#f5f5f5',
  textPrimary: '#1a1a1a',
  textSecondary: '#666666',
} as const;

// Secure store key for persisting session
export const SESSION_STORE_KEY = 'board_academy_session';
