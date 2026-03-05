import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
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

  if (!ready) return null;

  return (
    <>
      <StatusBar style="light" backgroundColor={BRAND.primary} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="guest-login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
