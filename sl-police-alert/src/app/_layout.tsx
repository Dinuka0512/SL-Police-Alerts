import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { LoadingScreen } from '@/components/loading-screen';

import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="messages" />
        <Stack.Screen name="message/[id]" />
        <Stack.Screen name="accidents" />
        <Stack.Screen name="penalties" />
        <Stack.Screen name="account" />
      </Stack>
      {isLoading && <LoadingScreen onFinish={() => setIsLoading(false)} />}
    </GestureHandlerRootView>
  );
}