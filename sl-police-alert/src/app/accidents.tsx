import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/screen-header';
import { RISK_COLORS, SriLankaMap } from '@/components/sri-lanka-map';
import { TabBar } from '@/components/tab-bar';
import { predictionService } from '@/services';
import { useAuth } from '@/store/auth';
import type { DistrictPrediction, RiskLevel } from '@/types';

const SUMMARY_META: {
  level: RiskLevel;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { level: 'High', icon: 'warning' },
  { level: 'Medium', icon: 'alert' },
  { level: 'Low', icon: 'shield-checkmark' },
];

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AccidentsScreen() {
  const router = useRouter();
  const { token } = useAuth();

  const [predictions, setPredictions] = useState<DistrictPrediction[]>([]);
  const [predictionDate, setPredictionDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  const loadPredictions = useCallback(async () => {
    setLoading(true);
    setPredictionError(null);
    try {
      const result = await predictionService.getForDate(todayString());
      setPredictions(result);
      setPredictionDate(todayString());
    } catch {
      setPredictionError('Unable to load predictions right now. Pull or retry later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPredictions();
  }, [loadPredictions]);

  const summary = useMemo(() => {
    const counts: Record<RiskLevel, number> = { High: 0, Medium: 0, Low: 0 };
    for (const prediction of predictions) counts[prediction.risk] += 1;
    return counts;
  }, [predictions]);

  const totalAccidents = useMemo(
    () => predictions.reduce((sum, item) => sum + item.count, 0),
    [predictions]
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
        subtitle={`District risk · Updated ${predictionDate || '—'}`}
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
              {loading ? '…' : summary[item.level]}
            </Text>
            <Text className="text-slate-500 text-[10px] font-semibold uppercase">
              {item.level} districts
            </Text>
          </View>
        ))}
      </View>

      <View className="px-4 pt-2 pb-2">
        <Text className="text-slate-500 text-[11px]">
          Predicted next 7 days · {totalAccidents} accidents forecast. Pinch to
          zoom, drag to move, tap a district for details.
        </Text>
        {(locationError || predictionError) && (
          <Text className="text-red-600 text-[11px] mt-1">
            {locationError ?? predictionError}
          </Text>
        )}
        {!predictionError && (
          <Text
            onPress={loadPredictions}
            className="text-blue-700 text-[11px] mt-1 font-semibold"
          >
            Tap to refresh
          </Text>
        )}
      </View>

      <View className="flex-1 bg-white">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#003366" />
            <Text className="text-slate-500 text-[11px] mt-2">
              Loading predictions…
            </Text>
          </View>
        ) : (
          <SriLankaMap
            predictions={predictions}
            userCoords={coords}
            locating={locating}
            onRequestLocation={handleLocate}
          />
        )}
      </View>

      <TabBar active="accidents" />
    </View>
  );
}
