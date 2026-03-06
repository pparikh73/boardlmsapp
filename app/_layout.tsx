import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import Head from 'expo-router/head';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { getSession } from '../services/auth';
import { BRAND } from '../constants/skilljar';

// Keep splash visible while checking auth state
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      const session = await getSession();
      await SplashScreen.hideAsync();
      setReady(true);
      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
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
    <>
      <Head>
        <meta name="application-name" content="Board Academy" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Board Academy" />
        <meta name="theme-color" content={BRAND.primary} />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <StatusBar style="light" backgroundColor={BRAND.primary} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="guest-login" />
        <Stack.Screen name="sso-webview" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
