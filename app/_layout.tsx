import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import Head from 'expo-router/head';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getSession } from '../services/auth';
import { BRAND } from '../constants/skilljar';

// Keep splash visible while checking auth state
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      await getSession(); // warm the session cache
      await SplashScreen.hideAsync();
      setReady(true);
      router.replace('/(tabs)'); // tabs always show; each tab handles its own auth state
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
