import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabKey =
  | 'dashboard'
  | 'messages'
  | 'account'
  | 'contacts'
  | 'penalties';

const TABS: {
  key: TabKey;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  activeIcon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'home-outline', activeIcon: 'home' },
  {
    key: 'contacts',
    label: 'Contacts',
    icon: 'people-outline',
    activeIcon: 'people',
  },
  {
    key: 'penalties',
    label: 'Penalties',
    icon: 'card-outline',
    activeIcon: 'card',
  },{
    key: 'messages',
    label: 'Messages',
    icon: 'chatbubbles-outline',
    activeIcon: 'chatbubbles',
  },{
    key: 'account',
    label: 'Account',
    icon: 'person-outline',
    activeIcon: 'person',
  }
];

export function TabBar({ active }: { active: TabKey }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-row bg-white border-t border-slate-200"
      style={{ paddingBottom: insets.bottom }}
    >
      {TABS.map(tab => {
        const isActive = active === tab.key;
        const color = isActive ? '#003366' : '#94A3B8';
        return (
          <Pressable
            key={tab.key}
            onPress={() => router.replace(`/${tab.key}`)}
            className="flex-1 items-center justify-center py-1.5"
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Ionicons
              name={isActive ? tab.activeIcon : tab.icon}
              size={20}
              color={color}
            />
            <Text
              className="font-semibold mt-0.5 text-center"
              numberOfLines={1}
              style={{ color, fontSize: 9 }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}