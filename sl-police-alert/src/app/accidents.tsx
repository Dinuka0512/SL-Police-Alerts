import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { ScreenHeader } from '@/components/screen-header';
import { RISK_COLORS, SriLankaMap } from '@/components/sri-lanka-map';
import { TabBar } from '@/components/tab-bar';
import {
  DISTRICT_PREDICTIONS,
  PREDICTION_PERIOD,
  PREDICTION_UPDATED_AT,
} from '@/data/district-predictions';
import { useAuth } from '@/store/auth';
import type { RiskLevel } from '@/types';

const SUMMARY_META: {
  level: RiskLevel;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { level: 'High', icon: 'warning' },
  { level: 'Medium', icon: 'alert' },
  { level: 'Low', icon: 'shield-checkmark' },
];

export default function AccidentsScreen() {
  const router = useRouter();
  const { token } = useAuth();

  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  const summary = useMemo(() => {
    const counts: Record<RiskLevel, number> = { High: 0, Medium: 0, Low: 0 };
    for (const prediction of DISTRICT_PREDICTIONS) counts[prediction.risk] += 1;
    return counts;
  }, []);

  const totalAccidents = useMemo(
    () => DISTRICT_PREDICTIONS.reduce((sum, item) => sum + item.count, 0),
    []
  );

  const handleLocate = async () => {
    try {
      setLocating(true);
      setLocationError(null);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch {
      setLocationError('Unable to get your current location.');
    } finally {
      setLocating(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader
        title="Accident Predictions"
        subtitle={`District risk · Updated ${PREDICTION_UPDATED_AT}`}
      />

      <View className="px-4 pt-4 flex-row">
        {SUMMARY_META.map(item => (
          <View
            key={item.level}
            className="flex-1 bg-white rounded-2xl border border-slate-200 px-3 py-3 mr-2 last:mr-0 items-center"
          >
            <View
              style={{ backgroundColor: RISK_COLORS[item.level] }}
              className="h-8 w-8 rounded-full items-center justify-center border border-slate-200"
            >
              <Ionicons
                name={item.icon}
                size={16}
                color={item.level === 'High' ? '#FFFFFF' : '#003366'}
              />
            </View>
            <Text className="text-slate-900 text-xl font-bold mt-1.5">
              {summary[item.level]}
            </Text>
            <Text className="text-slate-500 text-[10px] font-semibold uppercase">
              {item.level} districts
            </Text>
          </View>
        ))}
      </View>

      <View className="px-4 pt-2 pb-2">
        <Text className="text-slate-500 text-[11px]">
          {PREDICTION_PERIOD} · {totalAccidents} reported accidents. Pinch to zoom,
          drag to move, tap a district for details.
        </Text>
        {locationError && (
          <Text className="text-red-600 text-[11px] mt-1">{locationError}</Text>
        )}
      </View>

      <View className="flex-1 bg-white">
        <SriLankaMap
          predictions={DISTRICT_PREDICTIONS}
          userCoords={coords}
          locating={locating}
          onRequestLocation={handleLocate}
        />
      </View>

      <TabBar active="accidents" />
    </View>
  );
}
