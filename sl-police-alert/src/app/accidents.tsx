import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { ScreenHeader } from '@/components/screen-header';
import { TabBar } from '@/components/tab-bar';
import { contactService } from '@/services';
import { useAuth } from '@/store/auth';
import type { EmergencyContact } from '@/types';

type Contact = {
  id: string;
  name: string;
  role: string;
  phone: string;
};

const EMERGENCY_HOTLINES: Contact[] = [
  { id: '119', name: 'Police Emergency', role: 'National Hotline', phone: '119' },
  { id: '110', name: 'Fire & Rescue', role: 'National Hotline', phone: '110' },
  { id: '1990', name: 'Police Information', role: 'National Hotline', phone: '1990' },
];

function ContactRow({ contact }: { contact: Contact }) {
  return (
    <View className="flex-row items-center px-4 py-3.5">
      <View className="h-10 w-10 rounded-full bg-police-navy items-center justify-center">
        <Ionicons name="call" size={18} color="#FFFFFF" />
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-slate-800 text-sm font-bold">{contact.name}</Text>
        <Text className="text-slate-400 text-xs">{contact.role}</Text>
      </View>
      <View className="items-end">
        <Text className="text-police-primary text-sm font-semibold">
          {contact.phone}
        </Text>
        <Pressable
          className="mt-1 bg-police-primary rounded-full px-3 py-1"
          accessibilityRole="button"
          accessibilityLabel={`Call ${contact.name}`}
        >
          <Text className="text-white text-xs font-semibold">Call</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ContactsScreen() {
  const router = useRouter();
  const { token } = useAuth();

  const [stationContacts, setStationContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await contactService.findAll();
        if (!cancelled) {
          setStationContacts(
            data.map((contact: EmergencyContact) => ({
              id: contact.id,
              name: contact.name,
              role: contact.title || 'Emergency Contact',
              phone: contact.contact,
            }))
          );
        }
      } catch (err) {
        if (err instanceof Error && err.message === 'Invalid or expired token') {
          router.replace('/login');
          return;
        }
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load contacts'
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

  return (
    <View className="flex-1 bg-slate-100">
      <ScreenHeader title="Contact List" subtitle="Hotlines and station contacts" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4">
          <Text className="text-slate-900 text-base font-bold mb-2">
            Emergency Hotlines
          </Text>
          <View className="bg-white rounded-2xl overflow-hidden">
            {EMERGENCY_HOTLINES.map((contact, index) => (
              <View
                key={contact.id}
                className={index > 0 ? 'border-t border-slate-100' : ''}
              >
                <ContactRow contact={contact} />
              </View>
            ))}
          </View>
        </View>

        <View className="px-4 mt-5">
          <Text className="text-slate-900 text-base font-bold mb-2">
            Station Contacts
          </Text>
          <View className="bg-white rounded-2xl overflow-hidden">
            {isLoading && <ActivityIndicator className="py-8" color="#1D4ED8" />}
            {!isLoading && error && (
              <Text className="text-red-600 text-sm text-center py-8">
                {error}
              </Text>
            )}
            {!isLoading && !error && stationContacts.length === 0 && (
              <Text className="text-slate-400 text-sm text-center py-8">
                No station contacts available.
              </Text>
            )}
            {stationContacts.map((contact, index) => (
              <View
                key={contact.id}
                className={index > 0 ? 'border-t border-slate-100' : ''}
              >
                <ContactRow contact={contact} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <TabBar active="contacts" />
    </View>
  );
}
