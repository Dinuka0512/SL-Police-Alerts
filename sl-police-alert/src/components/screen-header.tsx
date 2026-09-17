import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle: string;
  right?: ReactNode;
}) {
  return (
    <SafeAreaView edges={['top']} className="bg-police-navy">
      <View className="px-6 pt-4 pb-5 flex-row items-center">
        <View className="flex-1">
          <Text className="text-white text-xl font-bold tracking-wide">{title}</Text>
          <Text className="text-blue-200 text-sm">{subtitle}</Text>
        </View>
        {right}
      </View>
    </SafeAreaView>
  );
}