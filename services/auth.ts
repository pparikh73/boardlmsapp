import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
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
  const url = AUTH_URLS[method];
  const redirectUrl = 'boardacademy://auth/callback';

  const result = await WebBrowser.openAuthSessionAsync(url, redirectUrl, {
    showInRecents: false,
    preferEphemeralSession: false, // keep cookies so Skilljar WebView works after
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
      redirect: 'manual', // Skilljar redirects on success
    });

    // A redirect (3xx) means successful auth
    const success = response.status >= 300 && response.status < 400;

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

export const LOGOUT_URL = `${SKILLJAR_BASE_URL}/auth/logout`;
