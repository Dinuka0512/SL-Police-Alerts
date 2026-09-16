import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PAGE = require('@/assets/images/police.png');

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [policeId, setPoliceId] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (policeId.trim().length < 3) {
      return;
    }
    // TODO: Replace with a real reset request to the backend once it exists.
    setSent(true);
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
                  Reset Password
                </Text>
                <Text className="mt-1 text-blue-200 text-sm">SL Police Alert</Text>
              </View>

              <View className="bg-white rounded-3xl p-6 shadow-xl">
                <Text className="text-slate-900 text-xl font-bold mb-1">
                  Forgot your password?
                </Text>
                <Text className="text-slate-500 text-sm mb-6">
                  {sent
                    ? 'A reset link has been sent via SMS / email for your Police ID.'
                    : 'Enter your Police ID and we will send you a reset link.'}
                </Text>

                {!sent && (
                  <>
                    <Text className="text-slate-700 text-sm font-semibold mb-1.5">
                      Police ID
                    </Text>
                    <TextInput
                      value={policeId}
                      onChangeText={setPoliceId}
                      placeholder="Enter your Police ID"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="characters"
                      autoCorrect={false}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 text-base"
                    />

                    <Pressable
                      onPress={handleSubmit}
                      className="rounded-xl py-4 items-center mt-6 bg-police-primary shadow-sm"
                      accessibilityRole="button"
                      accessibilityLabel="Send reset link"
                    >
                      <Text className="text-white font-bold text-base">
                        Send Reset Link
                      </Text>
                    </Pressable>
                  </>
                )}

                {sent && (
                  <Pressable
                    onPress={() => router.replace('/login')}
                    className="rounded-xl py-4 items-center mt-6 bg-police-primary shadow-sm"
                    accessibilityRole="button"
                    accessibilityLabel="Back to sign in"
                  >
                    <Text className="text-white font-bold text-base">
                      Back to Sign In
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}