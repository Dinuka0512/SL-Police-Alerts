import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService } from '@/services';
import { setAuth } from '@/store/auth';

const PAGE = require('@/assets/images/police.png');

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await authService.login(email.trim().toLowerCase(), password);
      setAuth(data.token, data.refreshToken, data.user);
      router.replace('/dashboard');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to sign in. Try again.';
      Alert.alert('Sign in failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-police-navy">
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView behavior="padding" className="flex-1">
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-1 px-6 justify-center pb-10">
              <View className="items-center mb-10">
                <View className="h-24 w-24 rounded-full bg-white items-center justify-center shadow-lg">
                  <Image
                    source={PAGE}
                    className="h-20 w-20"
                    resizeMode="contain"
                  />
                </View>
                <Text className="mt-5 text-white text-2xl font-bold tracking-wide">
                  SL Police Alert
                </Text>
                <Text className="mt-1 text-blue-200 text-sm">
                  Sri Lanka Police • Secure Sign In
                </Text>
              </View>

              <View className="bg-white rounded-3xl p-6 shadow-xl">
                <Text className="text-slate-900 text-xl font-bold mb-1">
                  Welcome back
                </Text>
                <Text className="text-slate-500 text-sm mb-6">
                  Sign in to view alerts and report incidents.
                </Text>

                <Text className="text-slate-700 text-sm font-semibold mb-1.5">
                  Email
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 text-base"
                />

                <View className="mt-4">
                  <Text className="text-slate-700 text-sm font-semibold mb-1.5">
                    Password
                  </Text>
                  <View className="flex-row items-center rounded-xl border border-slate-200 bg-slate-50">
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      className="flex-1 px-4 py-3 text-slate-900 text-base"
                    />
                    <Pressable
                      onPress={() => setShowPassword(prev => !prev)}
                      className="pr-4"
                      accessibilityRole="button"
                      accessibilityLabel={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      <Text className="text-police-primary font-semibold text-sm">
                        {showPassword ? 'Hide' : 'Show'}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <View className="items-end mt-2">
                  <Pressable
                    onPress={() => router.push('/forgot-password')}
                    accessibilityRole="button"
                  >
                    <Text className="text-police-primary font-semibold text-sm">
                      Forgot password?
                    </Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  className={`rounded-xl py-4 items-center mt-2 shadow-sm ${
                    isSubmitting ? 'bg-police-blue opacity-70' : 'bg-police-primary'
                  }`}
                  accessibilityRole="button"
                  accessibilityLabel="Sign in"
                >
                  <Text className="text-white font-bold text-base">
                    {isSubmitting ? 'Signing in…' : 'Sign In'}
                  </Text>
                </Pressable>

                <Text className="mt-4 text-center text-xs text-slate-400">
                  By signing in you agree to the Terms & Privacy Policy.
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}