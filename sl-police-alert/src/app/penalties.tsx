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
  email: string;
  location: string;
};

type PenaltyFilter = 'all' | 'paid' | 'notpaid';

const EMPTY_FORM: PenaltyForm = {
  code: '',
  violation: '',
  fee: '',
  vehicle: '',
  nic: '',
  email: '',
  location: '',
};

const inputClassName =
  'rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 text-base mb-3';

const FILTERS: { key: PenaltyFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'paid', label: 'Paid' },
  { key: 'notpaid', label: 'Not Paid' },
];

function StatPill({
  label,
  value,
  valueClass,
  icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: number;
  valueClass: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconBg: string;
  iconColor: string;
}) {
  return (
    <View className="flex-1 bg-white rounded-2xl border border-slate-200 p-3">
      <View
        className={`h-9 w-9 rounded-full items-center justify-center ${iconBg}`}
      >
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <Text className={`text-xl font-extrabold mt-2 ${valueClass}`}>
        {value}
      </Text>
      <Text className="text-[11px] text-slate-500 font-semibold">{label}</Text>
    </View>
  );
}

export default function PenaltiesScreen() {
  const router = useRouter();
  const { token, user } = useAuth();

  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PenaltyForm>(EMPTY_FORM);
  const [filter, setFilter] = useState<PenaltyFilter>('all');

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

  const paidCount = penalties.filter(
    penalty => penalty.status === 'Paid',
  ).length;
  const notPaidCount = penalties.length - paidCount;
  const filtered = penalties.filter(penalty =>
    filter === 'all'
      ? true
      : filter === 'paid'
        ? penalty.status === 'Paid'
        : penalty.status === 'Not paid',
  );

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
        email: form.email.trim(),
        location: form.location.trim(),
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
          <View className="flex-row gap-3 mb-4">
            <StatPill
              label="Total Penalties"
              value={penalties.length}
              valueClass="text-slate-900"
              icon="receipt-outline"
              iconBg="bg-police-navy"
              iconColor="#FFFFFF"
            />
            <StatPill
              label="Paid"
              value={paidCount}
              valueClass="text-emerald-600"
              icon="checkmark-circle-outline"
              iconBg="bg-emerald-100"
              iconColor="#059669"
            />
            <StatPill
              label="Not Paid"
              value={notPaidCount}
              valueClass="text-red-600"
              icon="close-circle-outline"
              iconBg="bg-red-100"
              iconColor="#DC2626"
            />
          </View>

          <View className="flex-row bg-slate-200 p-1 rounded-xl mb-4">
            {FILTERS.map(item => {
              const isActive = filter === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => setFilter(item.key)}
                  className={`flex-1 rounded-lg py-2 items-center ${
                    isActive ? 'bg-white shadow-sm' : ''
                  }`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text
                    className={`text-sm ${
                      isActive
                        ? 'text-police-navy font-bold'
                        : 'text-slate-500 font-semibold'
                    }`}
                  >
                    {item.label} (
                    {item.key === 'all'
                      ? penalties.length
                      : item.key === 'paid'
                        ? paidCount
                        : notPaidCount}
                    )
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text className="text-slate-900 text-base font-bold mb-2">
            Issued Penalties ({filtered.length})
          </Text>

          {isLoading && <ActivityIndicator className="py-8" color="#1D4ED8" />}
          {!isLoading && error && (
            <Text className="text-red-600 text-sm text-center py-8">{error}</Text>
          )}
          {!isLoading && !error && filtered.length === 0 && (
            <Text className="text-slate-400 text-sm text-center py-8">
              {penalties.length === 0
                ? 'No penalties yet.'
                : filter === 'paid'
                  ? 'No paid penalties yet.'
                  : 'No unpaid penalties yet.'}
            </Text>
          )}

          <View className="bg-white rounded-2xl overflow-hidden">
            {filtered.map((penalty, index) => {
              const isPaid = penalty.status === 'Paid';
              const statusColor = isPaid ? '#059669' : '#DC2626';
              return (
                <View
                  key={penalty.id}
                  className={`px-4 py-3.5 ${
                    index > 0 ? 'border-t border-slate-100' : ''
                  }`}
                >
                  <View className="flex-row items-center">
                    <View
                      className={`h-10 w-10 rounded-full items-center justify-center ${
                        isPaid ? 'bg-emerald-50' : 'bg-red-50'
                      }`}
                    >
                      <Ionicons
                        name={isPaid ? 'checkmark-circle' : 'receipt'}
                        size={18}
                        color={statusColor}
                      />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-slate-800 text-sm font-bold">
                        {penalty.violation}
                      </Text>
                      <Text className="text-slate-400 text-xs">
                        {penalty.code} • {penalty.date}
                      </Text>
                    </View>
                    <View className="items-end ml-2">
                      <Text
                        className={`text-sm font-bold ${
                          isPaid ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {penalty.fee}
                      </Text>
                      <View
                        className={`rounded-full px-2 py-0.5 mt-1 ${
                          isPaid ? 'bg-emerald-100' : 'bg-red-100'
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-bold ${
                            isPaid ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          {penalty.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {(penalty.vehicle || penalty.nic || penalty.email || penalty.location) && (
                    <Text className="text-slate-500 text-xs mt-1.5">
                      {[penalty.vehicle, penalty.nic, penalty.email, penalty.location]
                        .filter(Boolean)
                        .join(' • ')}
                    </Text>
                  )}
                </View>
              );
            })}
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
                  Email
                </Text>
                <TextInput
                  value={form.email}
                  onChangeText={text => setField('email', text)}
                  placeholder="driver@example.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
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