import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScreenHeader } from '@/components/screen-header';
import { TabBar } from '@/components/tab-bar';
import { penaltyService } from '@/services';
import { useAuth } from '@/store/auth';
import type { Penalty } from '@/types';

type PenaltyForm = {
  code: string;
  violation: string;
  fee: string;
  vehicle: string;
  nic: string;
  location: string;
  date: string;
};

const EMPTY_FORM: PenaltyForm = {
  code: '',
  violation: '',
  fee: '',
  vehicle: '',
  nic: '',
  location: '',
  date: '',
};

const inputClassName =
  'rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 text-base mb-3';

export default function PenaltiesScreen() {
  const router = useRouter();
  const { token, user } = useAuth();

  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PenaltyForm>(EMPTY_FORM);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await penaltyService.findAll();
        if (!cancelled) setPenalties(data);
      } catch (err) {
        if (err instanceof Error && err.message === 'Invalid or expired token') {
          router.replace('/login');
          return;
        }
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load penalties'
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  const setField = (field: keyof PenaltyForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async () => {
    if (!form.violation.trim() || !form.fee.trim() || isSubmitting) {
      return;
    }

    const fee = /^LKR/.test(form.fee.trim())
      ? form.fee.trim()
      : `LKR ${form.fee.trim()}`;

    setIsSubmitting(true);
    try {
      const created = await penaltyService.create({
        code: form.code.trim() || 'GENERAL',
        violation: form.violation.trim(),
        fee,
        vehicle: form.vehicle.trim(),
        nic: form.nic.trim(),
        location: form.location.trim(),
        date: form.date.trim() || new Date().toISOString().slice(0, 10),
        status: 'Not paid',
        issuedBy: user?.name ?? '',
      });
      setPenalties(prev => [created, ...prev]);
      closeForm();
    } catch (err) {
      Alert.alert(
        'Could not save penalty',
        err instanceof Error ? err.message : 'Something went wrong.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-100">
      <ScreenHeader title="Penalty Fees" subtitle="Online traffic penalty issuance" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4">
          <Text className="text-slate-900 text-base font-bold mb-2">
            Issued Penalties ({penalties.length})
          </Text>

          {isLoading && <ActivityIndicator className="py-8" color="#1D4ED8" />}
          {!isLoading && error && (
            <Text className="text-red-600 text-sm text-center py-8">{error}</Text>
          )}
          {!isLoading && !error && penalties.length === 0 && (
            <Text className="text-slate-400 text-sm text-center py-8">
              No penalties yet.
            </Text>
          )}

          <View className="bg-white rounded-2xl overflow-hidden">
            {penalties.map((penalty, index) => (
              <View
                key={penalty.id}
                className={`px-4 py-3.5 ${
                  index > 0 ? 'border-t border-slate-100' : ''
                }`}
              >
                <View className="flex-row items-center">
                  <View className="h-10 w-10 rounded-full bg-red-50 items-center justify-center">
                    <Ionicons name="receipt" size={18} color="#DC2626" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-slate-800 text-sm font-bold">
                      {penalty.violation}
                    </Text>
                    <Text className="text-slate-400 text-xs">
                      {penalty.code} • {penalty.date}
                      {penalty.status ? ` • ${penalty.status}` : ''}
                    </Text>
                  </View>
                  <Text className="text-red-600 text-sm font-bold">
                    {penalty.fee}
                  </Text>
                </View>
                {(penalty.vehicle || penalty.nic || penalty.location) && (
                  <Text className="text-slate-500 text-xs mt-1.5">
                    {[penalty.vehicle, penalty.nic, penalty.location]
                      .filter(Boolean)
                      .join(' • ')}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {!showForm && (
        <View className="bg-white border-t border-slate-200 px-4 py-3">
          <Pressable
            onPress={() => setShowForm(true)}
            className="bg-police-primary rounded-xl py-4 items-center flex-row justify-center gap-2 shadow-sm"
            accessibilityRole="button"
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text className="text-white font-bold text-base">Add Penalty</Text>
          </Pressable>
        </View>
      )}

      <TabBar active="penalties" />

      {showForm && (
        <KeyboardAvoidingView
          behavior="padding"
          className="absolute inset-0 z-50"
        >
          <Pressable
            onPress={closeForm}
            className="absolute inset-0 bg-black/50"
            accessibilityRole="button"
            accessibilityLabel="Close penalty form"
          />
          <View className="flex-1 justify-end" pointerEvents="box-none">
            <View className="bg-white rounded-t-3xl h-[90%]">
              <View className="items-center pt-3 pb-1">
                <View className="h-1.5 w-10 rounded-full bg-slate-300" />
              </View>
              <View className="flex-row items-center justify-between px-6 pt-2 pb-3">
                <Text className="text-slate-900 text-lg font-bold">
                  Add New Penalty
                </Text>
                <Pressable
                  onPress={closeForm}
                  className="h-9 w-9 rounded-full bg-slate-100 items-center justify-center"
                  accessibilityRole="button"
                  accessibilityLabel="Close penalty form"
                >
                  <Ionicons name="close" size={20} color="#0F172A" />
                </Pressable>
              </View>

              <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-slate-700 text-sm font-semibold mb-1.5">
                      Offence Code
                    </Text>
                    <TextInput
                      value={form.code}
                      onChangeText={text => setField('code', text)}
                      placeholder="A-101"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="characters"
                      className={inputClassName}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-700 text-sm font-semibold mb-1.5">
                      Fee (LKR)
                    </Text>
                    <TextInput
                      value={form.fee}
                      onChangeText={text => setField('fee', text)}
                      placeholder="30,000"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      className={inputClassName}
                    />
                  </View>
                </View>

                <Text className="text-slate-700 text-sm font-semibold mb-1.5">
                  Violation
                </Text>
                <TextInput
                  value={form.violation}
                  onChangeText={text => setField('violation', text)}
                  placeholder="Describe the traffic violation"
                  placeholderTextColor="#94A3B8"
                  className={inputClassName}
                />

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-slate-700 text-sm font-semibold mb-1.5">
                      Vehicle No.
                    </Text>
                    <TextInput
                      value={form.vehicle}
                      onChangeText={text => setField('vehicle', text)}
                      placeholder="CAB-1234"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="characters"
                      className={inputClassName}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-700 text-sm font-semibold mb-1.5">
                      NIC No.
                    </Text>
                    <TextInput
                      value={form.nic}
                      onChangeText={text => setField('nic', text)}
                      placeholder="901234567V"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="characters"
                      className={inputClassName}
                    />
                  </View>
                </View>

                <Text className="text-slate-700 text-sm font-semibold mb-1.5">
                  Location
                </Text>
                <TextInput
                  value={form.location}
                  onChangeText={text => setField('location', text)}
                  placeholder="Where did the violation occur?"
                  placeholderTextColor="#94A3B8"
                  className={inputClassName}
                />

                <Text className="text-slate-700 text-sm font-semibold mb-1.5">
                  Date
                </Text>
                <TextInput
                  value={form.date}
                  onChangeText={text => setField('date', text)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94A3B8"
                  className={inputClassName}
                />

                <Pressable
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  className={`rounded-xl py-4 items-center mt-1 shadow-sm ${
                    isSubmitting ? 'bg-police-primary opacity-70' : 'bg-police-primary'
                  }`}
                  accessibilityRole="button"
                >
                  <Text className="text-white font-bold text-base">
                    {isSubmitting ? 'Submitting…' : 'Submit Penalty'}
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}