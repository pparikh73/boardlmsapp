import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { AUTH_URLS, SKILLJAR_BASE_URL, SESSION_STORE_KEY } from '../constants/skilljar';

export type AuthMethod = 'customerPartner' | 'employee' | 'guest';

export interface Session {
  method: AuthMethod;
  loggedInAt: string;
  // Additional user info populated after successful auth
  displayName?: string;
  email?: string;
}

/**
 * Open the SSO flow (OAuth or SAML) in an in-app browser session.
 * expo-web-browser openAuthSessionAsync auto-closes the browser once
 * Skilljar redirects back to the app scheme (boardacademy://).
 */
export async function loginWithSSO(method: 'customerPartner' | 'employee'): Promise<boolean> {
  const skilljarUrl = AUTH_URLS[method];

  if (Platform.OS === 'web') {
    window.location.href = skilljarUrl;
    return false; // page navigates away; return value unused
  }

  // Native path
  const redirectUrl = 'boardacademy://auth/callback';
  const result = await WebBrowser.openAuthSessionAsync(skilljarUrl, redirectUrl, {
    showInRecents: false,
    preferEphemeralSession: false,
  });

  if (result.type === 'success') {
    await saveSession({ method, loggedInAt: new Date().toISOString() });
    return true;
  }
  return false;
}

/**
 * Sign in with guest email + password via Skilljar's native auth endpoint.
 * Skilljar uses a form POST; we post to their endpoint and check the response.
 */
export async function loginWithGuest(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const params = new URLSearchParams();
    params.append('email', email);
    params.append('password', password);

    const response = await fetch(AUTH_URLS.guest, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      // Web browsers honour redirect:'manual' and expose the 3xx status directly.
      // React Native's fetch always follows redirects, so we fall back to checking
      // whether the final URL is still a login/auth page (failure) or not (success).
      redirect: Platform.OS === 'web' ? 'manual' : 'follow',
    });

    const isLoginPage = response.url.includes('/auth/login') || response.url.includes('/auth/domain');
    const success = Platform.OS === 'web'
      ? (response.status >= 300 && response.status < 400)
      : !isLoginPage;

    if (success) {
      await saveSession({
        method: 'guest',
        loggedInAt: new Date().toISOString(),
        email,
      });
    }

    return { success, error: success ? undefined : 'Invalid email or password.' };
  } catch {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_STORE_KEY);
}

export async function getSession(): Promise<Session | null> {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_STORE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

async function saveSession(session: Session): Promise<void> {
  await SecureStore.setItemAsync(SESSION_STORE_KEY, JSON.stringify(session));
}

export async function saveSessionByMethod(method: 'customerPartner' | 'employee'): Promise<void> {
  await saveSession({ method, loggedInAt: new Date().toISOString() });
}

export const LOGOUT_URL = `${SKILLJAR_BASE_URL}/auth/logout`;
