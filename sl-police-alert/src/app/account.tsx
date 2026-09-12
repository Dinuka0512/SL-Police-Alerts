import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
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

type Profile = {
  name: string;
  rank: string;
  badge: string;
  station: string;
  phone: string;
  email: string;
};

const INITIAL_PROFILE: Profile = {
  name: 'Officer Nimal Perera',
  rank: 'Police Inspector',
  badge: 'SP-4451',
  station: 'Colombo Police HQ',
  phone: '+94 77 123 4567',
  email: 'officer@police.lk',
};

type MenuItem = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
};

const MENU: { section: string; items: MenuItem[] }[] = [
  {
    section: 'Settings',
    items: [
      { icon: 'shield-checkmark-outline', label: 'Security' },
      { icon: 'lock-closed-outline', label: 'Privacy' },
    ],
  },
  {
    section: 'Support',
    items: [
      { icon: 'help-circle-outline', label: 'Help Center' },
      { icon: 'information-circle-outline', label: 'About' },
    ],
  },
];

const inputClassName =
  'rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 text-base mb-3';

export default function AccountScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(INITIAL_PROFILE);
  const [showEdit, setShowEdit] = useState(false);
  const [draft, setDraft] = useState<Profile>(INITIAL_PROFILE);

  const setDraftField = (field: keyof Profile, value: string) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };

  const openEdit = () => {
    setDraft(profile);
    setShowEdit(true);
  };

  const closeEdit = () => setShowEdit(false);

  const handleSave = () => {
    setProfile(draft);
    setShowEdit(false);
  };

  const handleSignOut = () => {
    // TODO: Clear any stored auth/session state before signing out.
    router.replace('/login');
  };

  type DetailRow = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
};

const details: DetailRow[] = [
    { icon: 'card-outline', label: 'Badge Number', value: profile.badge },
    { icon: 'business-outline', label: 'Station', value: profile.station },
    { icon: 'call-outline', label: 'Phone', value: profile.phone },
    { icon: 'mail-outline', label: 'Email', value: profile.email },
  ];

  return (
    <View className="flex-1 bg-slate-100">
      <ScreenHeader title="Account" subtitle="Your profile & settings" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4">
          <View className="bg-white rounded-2xl p-5 shadow-sm">
            <View className="flex-row items-center gap-4">
              <View className="h-16 w-16 rounded-full bg-police-navy items-center justify-center">
                <Image
                  source={require('@/assets/images/police.png')}
                  className="h-12 w-12"
                  resizeMode="contain"
                />
              </View>
              <View className="flex-1">
                <Text className="text-slate-900 text-lg font-bold">
                  {profile.name}
                </Text>
                <Text className="text-slate-500 text-sm">
                  {profile.rank} • {profile.badge}
                </Text>
              </View>
              <Pressable
                onPress={openEdit}
                className="h-8 w-8 rounded-full bg-slate-100 items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Edit profile"
              >
                <Ionicons name="pencil" size={15} color="#64748B" />
              </Pressable>
            </View>
          </View>
        </View>

        <View className="px-4 mt-5">
          <Text className="text-slate-900 text-base font-bold mb-2">
            Officer Details
          </Text>
          <View className="bg-white rounded-2xl overflow-hidden">
            {details.map((row, index) => (
              <View
                key={row.label}
                className={`flex-row items-center px-4 py-3.5 ${
                  index > 0 ? 'border-t border-slate-100' : ''
                }`}
              >
                <Ionicons name={row.icon} size={20} color="#0F172A" />
                <View className="flex-1 ml-3">
                  <Text className="text-xs text-slate-400">{row.label}</Text>
                  <Text className="text-slate-800 text-sm font-semibold">
                    {row.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {MENU.map(group => (
          <View key={group.section} className="px-4 mt-5">
            <Text className="text-slate-900 text-base font-bold mb-2">
              {group.section}
            </Text>
            <View className="bg-white rounded-2xl overflow-hidden">
              {group.items.map((item, index) => (
                <Pressable
                  key={item.label}
                  className={`flex-row items-center px-4 py-3.5 ${
                    index > 0 ? 'border-t border-slate-100' : ''
                  }`}
                  accessibilityRole="button"
                >
                  <Ionicons name={item.icon} size={20} color="#0F172A" />
                  <Text className="flex-1 ml-3 text-slate-800 text-sm font-semibold">
                    {item.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <View className="px-4 pt-6">
          <Pressable
            onPress={handleSignOut}
            className="bg-red-600 rounded-xl py-4 items-center shadow-sm"
            accessibilityRole="button"
          >
            <Text className="text-white font-bold text-base">Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>

      <TabBar active="account" />

      {showEdit && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="absolute inset-0 z-50"
        >
          <Pressable
            onPress={closeEdit}
            className="absolute inset-0 bg-black/50"
            accessibilityRole="button"
            accessibilityLabel="Close edit profile form"
          />
          <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[88%]">
            <View className="items-center pt-3 pb-1">
              <View className="h-1.5 w-10 rounded-full bg-slate-300" />
            </View>
            <View className="flex-row items-center justify-between px-6 pt-2 pb-3">
              <Text className="text-slate-900 text-lg font-bold">Edit Profile</Text>
              <Pressable
                onPress={closeEdit}
                className="h-9 w-9 rounded-full bg-slate-100 items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Close edit profile form"
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
              <Text className="text-slate-700 text-sm font-semibold mb-1.5">
                Full Name
              </Text>
              <TextInput
                value={draft.name}
                onChangeText={text => setDraftField('name', text)}
                placeholder="Officer name"
                placeholderTextColor="#94A3B8"
                className={inputClassName}
              />
              <Text className="text-slate-700 text-sm font-semibold mb-1.5">
                Rank
              </Text>
              <TextInput
                value={draft.rank}
                onChangeText={text => setDraftField('rank', text)}
                placeholder="Police Inspector"
                placeholderTextColor="#94A3B8"
                className={inputClassName}
              />
              <Text className="text-slate-700 text-sm font-semibold mb-1.5">
                Badge Number
              </Text>
              <TextInput
                value={draft.badge}
                onChangeText={text => setDraftField('badge', text)}
                placeholder="SP-4451"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                className={inputClassName}
              />
              <Text className="text-slate-700 text-sm font-semibold mb-1.5">
                Station
              </Text>
              <TextInput
                value={draft.station}
                onChangeText={text => setDraftField('station', text)}
                placeholder="Colombo Police HQ"
                placeholderTextColor="#94A3B8"
                className={inputClassName}
              />
              <Text className="text-slate-700 text-sm font-semibold mb-1.5">
                Phone
              </Text>
              <TextInput
                value={draft.phone}
                onChangeText={text => setDraftField('phone', text)}
                placeholder="+94 77 123 4567"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                className={inputClassName}
              />
              <Text className="text-slate-700 text-sm font-semibold mb-1.5">
                Email
              </Text>
              <TextInput
                value={draft.email}
                onChangeText={text => setDraftField('email', text)}
                placeholder="officer@police.lk"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                className={inputClassName}
              />

              <Pressable
                onPress={handleSave}
                className="bg-police-primary rounded-xl py-4 items-center mt-1 shadow-sm"
                accessibilityRole="button"
              >
                <Text className="text-white font-bold text-base">Save Changes</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}