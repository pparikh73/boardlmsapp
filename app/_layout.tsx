import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getSession } from '../services/auth';
import { BRAND } from '../constants/skilljar';

// Keep splash visible while checking auth state
SplashScreen.preventAutoHideAsync();

// Declare (tabs) as the initial route rather than navigating to it from an effect.
// The previous router.replace('/(tabs)') ran after mount, so the Stack rendered its
// default route first and then immediately transitioned — an extra navigation on
// every cold start, and one of the three sources of the flash TJ reported.
export const unstable_settings = { initialRouteName: '(tabs)' };

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      await getSession(); // warm the session cache before anything renders
      await SplashScreen.hideAsync();
      setReady(true);
    }
    prepare();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <Head>
        <meta name="application-name" content="Board Connect" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Board Connect" />
        <meta name="theme-color" content={BRAND.primary} />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <StatusBar style="light" backgroundColor={BRAND.primary} />
      {/* animation: 'none' on both the shared screenOptions and each screen —
          Android's default screen transition produced a visible flash between
          routes. Set per-screen as well as globally so a screen that supplies its
          own options object cannot silently reinstate the default. */}
      <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
        <Stack.Screen name="login" options={{ animation: 'none' }} />
        <Stack.Screen name="guest-login" options={{ animation: 'none' }} />
        <Stack.Screen name="sso-webview" options={{ animation: 'none' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
