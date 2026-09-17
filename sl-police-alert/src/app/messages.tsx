import { ScrollView, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/screen-header';
import { TabBar } from '@/components/tab-bar';

type Message = {
  id: string;
  title: string;
  body: string;
  station: string;
  time: string;
};

const MESSAGES: Message[] = [
  {
    id: '1',
    title: 'Emergency Response Drill',
    body: 'All units to report to the Colombo HQ parade ground for the quarterly emergency response drill.',
    station: 'Colombo HQ',
    time: '30 min ago',
  },
  {
    id: '2',
    title: 'Traffic Police Reassignment',
    body: 'Officers on Galle Road are reassigned to the Bambaplaina junction for crowd control duties today.',
    station: 'Colombo South',
    time: '2 hrs ago',
  },
  {
    id: '3',
    title: 'Missing Person Bulletin',
    body: 'Please circulate the missing person bulletin for a 34-year-old man last seen in Kaduwela.',
    station: 'Kaduwela PS',
    time: '5 hrs ago',
  },
];

export default function MessagesScreen() {
  return (
    <View className="flex-1 bg-slate-100">
      <ScreenHeader
        title="Distributed Messages"
        subtitle="Official broadcasts from police divisions"
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4">
          {MESSAGES.map(message => (
            <View
              key={message.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 mb-3"
            >
              <Text className="text-slate-900 font-bold text-base mb-1">
                {message.title}
              </Text>
              <Text className="text-slate-500 text-sm leading-5">
                {message.body}
              </Text>
              <View className="flex-row items-center justify-between mt-3">
                <Text className="text-police-primary text-xs font-semibold">
                  {message.station}
                </Text>
                <Text className="text-slate-400 text-[11px]">{message.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <TabBar active="messages" />
    </View>
  );
}