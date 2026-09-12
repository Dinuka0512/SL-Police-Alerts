import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScreenHeader } from '@/components/screen-header';
import { TabBar } from '@/components/tab-bar';
import { addPenalty, usePenalties } from '@/store/penalties';

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
  const penalties = usePenalties();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PenaltyForm>(EMPTY_FORM);

  const setField = (field: keyof PenaltyForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = () => {
    if (!form.violation.trim() || !form.fee.trim()) {
      return;
    }
    addPenalty({
      id: `${Date.now()}`,
      code: form.code.trim() || 'GENERAL',
      violation: form.violation.trim(),
      fee: /^LKR/.test(form.fee.trim()) ? form.fee.trim() : `LKR ${form.fee.trim()}`,
      vehicle: form.vehicle.trim(),
      nic: form.nic.trim(),
      location: form.location.trim(),
      date: form.date.trim() || new Date().toISOString().slice(0, 10),
    });
    closeForm();
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

      <TabBar active="penalties" />

      {showForm && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="absolute inset-0 z-50"
        >
          <Pressable
            onPress={closeForm}
            className="absolute inset-0 bg-black/50"
            accessibilityRole="button"
            accessibilityLabel="Close penalty form"
          />
          <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[88%]">
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
                className="bg-police-primary rounded-xl py-4 items-center mt-1 shadow-sm"
                accessibilityRole="button"
              >
                <Text className="text-white font-bold text-base">
                  Submit Penalty
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}