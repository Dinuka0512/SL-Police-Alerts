import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { LoadingScreen } from '@/components/loading-screen';

import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="messages" />
        <Stack.Screen name="message/[id]" />
        <Stack.Screen name="contacts" />
        <Stack.Screen name="penalties" />
        <Stack.Screen name="account" />
      </Stack>
      {isLoading && <LoadingScreen onFinish={() => setIsLoading(false)} />}
    </>
  );
}