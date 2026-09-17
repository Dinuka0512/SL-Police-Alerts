import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/screen-header';
import { TabBar } from '@/components/tab-bar';

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

const STATION_CONTACTS: Contact[] = [
  { id: 'c1', name: 'Colombo Hospital PS', role: 'CIC Officer', phone: '011 242 1332' },
  { id: 'c2', name: 'Kadawatha PD', role: 'OIC', phone: '011 291 0123' },
  { id: 'c3', name: 'Mount Lavinia PS', role: 'OIC', phone: '011 271 6446' },
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
            {STATION_CONTACTS.map((contact, index) => (
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