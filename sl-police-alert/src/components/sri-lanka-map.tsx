/* eslint-disable react-hooks/immutability -- Reanimated shared values are intentionally mutable; this component opts out of the React Compiler via 'use no memo' */
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Pressable,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';

import { SRI_LANKA_DISTRICTS } from '@/data/sri-lanka-districts';
import type { DistrictPrediction, RiskLevel } from '@/types';

const VIEW_WIDTH = 100;
const PADDING = 3;
const MAX_SCALE = 8;
const BORDER = '#003366';

export const RISK_COLORS: Record<RiskLevel, string> = {
  High: '#003366',
  Medium: '#60A5FA',
  Low: '#FFFFFF',
};

const RISK_LABELS: { level: RiskLevel; label: string }[] = [
  { level: 'High', label: 'High' },
  { level: 'Medium', label: 'Medium' },
  { level: 'Low', label: 'Low' },
];

type Size = { width: number; height: number };
type Point = [number, number];

function buildMap() {
  const points = SRI_LANKA_DISTRICTS.flatMap(district =>
    district.rings.flat()
  );

  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const [lon, lat] of points) {
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  const lonScale = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));
  const rawWidth = (maxLon - minLon) * lonScale;
  const rawHeight = maxLat - minLat;
  const scale = (VIEW_WIDTH - PADDING * 2) / rawWidth;
  const viewHeight = rawHeight * scale + PADDING * 2;

  const project = (lon: number, lat: number): Point => [
    PADDING + (lon - minLon) * lonScale * scale,
    PADDING + (maxLat - lat) * scale,
  ];

  const unproject = (x: number, y: number): Point => [
    minLon + (x - PADDING) / (lonScale * scale),
    maxLat - (y - PADDING) / scale,
  ];

  const districts = SRI_LANKA_DISTRICTS.map(district => {
    const path = district.rings
      .map(ring => {
        const projected = ring.map(([lon, lat]) => project(lon, lat));
        return `M${projected
          .map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`)
          .join('L')}Z`;
      })
      .join('');
    return {
      name: district.name,
      path,
      label: project(district.label[0], district.label[1]),
      rings: district.rings,
    };
  });

  const districtAt = (lon: number, lat: number): string | null => {
    for (const district of districts) {
      for (const ring of district.rings) {
        let inside = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
          const xi = ring[i][0];
          const yi = ring[i][1];
          const xj = ring[j][0];
          const yj = ring[j][1];
          const hit =
            yi > lat !== yj > lat &&
            lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
          if (hit) inside = !inside;
        }
        if (inside) return district.name;
      }
    }
    return null;
  };

  return {
    viewWidth: VIEW_WIDTH,
    viewHeight,
    districts,
    project,
    unproject,
    districtAt,
  };
}

const MAP = buildMap();
const BASE_WIDTH = MAP.viewWidth;
const BASE_HEIGHT = MAP.viewHeight;

function fitScale(width: number, height: number) {
  'worklet';
  return Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);
}

function clampScale(value: number) {
  'worklet';
  return Math.min(Math.max(value, 1), MAX_SCALE);
}

function clampOffset(offset: number, scaledSize: number, container: number) {
  'worklet';
  if (scaledSize <= container) return 0;
  const max = (scaledSize - container) / 2;
  return Math.min(Math.max(offset, -max), max);
}

type Props = {
  predictions: DistrictPrediction[];
  userCoords?: { latitude: number; longitude: number } | null;
  locating?: boolean;
  onRequestLocation?: () => void;
};

export function SriLankaMap({
  predictions,
  userCoords,
  locating = false,
  onRequestLocation,
}: Props) {
  'use no memo';
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const [selected, setSelected] = useState<DistrictPrediction | null>(null);

  const riskOf = useMemo(() => {
    const lookup = new Map<string, DistrictPrediction>();
    for (const prediction of predictions) {
      lookup.set(prediction.name, prediction);
    }
    return lookup;
  }, [predictions]);

  const sizeSV = useSharedValue<Size>({ width: 0, height: 0 });
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const localX = useSharedValue(0);
  const localY = useSharedValue(0);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
    sizeSV.value = { width, height };
  };

  const userPoint = useMemo(() => {
    if (!userCoords) return null;
    return {
      point: MAP.project(userCoords.longitude, userCoords.latitude),
      district: MAP.districtAt(userCoords.longitude, userCoords.latitude),
    };
  }, [userCoords]);

  const lastCentered = useRef<string | null>(null);
  useEffect(() => {
    if (!userPoint || !userCoords) return;
    const key = `${userCoords.latitude},${userCoords.longitude}`;
    if (key === lastCentered.current) return;
    const { width: cw, height: ch } = size;
    if (!cw || !ch) return;
    lastCentered.current = key;
    const baseScale = fitScale(cw, ch);
    const mapW = BASE_WIDTH * baseScale;
    const mapH = BASE_HEIGHT * baseScale;
    const target = 3.5;
    const lx = userPoint.point[0] * baseScale;
    const ly = userPoint.point[1] * baseScale;
    scale.value = withTiming(target);
    translateX.value = withTiming(
      clampOffset(-(lx - mapW / 2) * target, mapW * target, cw)
    );
    translateY.value = withTiming(
      clampOffset(-(ly - mapH / 2) * target, mapH * target, ch)
    );
  }, [userPoint, userCoords, size, scale, translateX, translateY]);

  const pinch = Gesture.Pinch()
    .onStart(event => {
      const { width: cw } = sizeSV.value;
      savedScale.value = scale.value;
      focalX.value = event.focalX;
      focalY.value = event.focalY;
      localX.value = (event.focalX - cw / 2 - translateX.value) / scale.value;
      localY.value = (event.focalY - sizeSV.value.height / 2 - translateY.value) / scale.value;
    })
    .onUpdate(event => {
      const { width: cw, height: ch } = sizeSV.value;
      if (!cw || !ch) return;
      const baseScale = fitScale(cw, ch);
      const next = clampScale(savedScale.value * event.scale);
      scale.value = next;
      translateX.value = clampOffset(
        focalX.value - cw / 2 - next * localX.value,
        BASE_WIDTH * baseScale * next,
        cw
      );
      translateY.value = clampOffset(
        focalY.value - ch / 2 - next * localY.value,
        BASE_HEIGHT * baseScale * next,
        ch
      );
    });

  const pan = Gesture.Pan()
    .onStart(() => {
      savedTx.value = translateX.value;
      savedTy.value = translateY.value;
    })
    .onUpdate(event => {
      const { width: cw, height: ch } = sizeSV.value;
      if (!cw || !ch) return;
      const baseScale = fitScale(cw, ch);
      translateX.value = clampOffset(
        savedTx.value + event.translationX,
        BASE_WIDTH * baseScale * scale.value,
        cw
      );
      translateY.value = clampOffset(
        savedTy.value + event.translationY,
        BASE_HEIGHT * baseScale * scale.value,
        ch
      );
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd(event => {
      const { width: cw, height: ch } = sizeSV.value;
      if (!cw || !ch) return;
      const baseScale = fitScale(cw, ch);
      const target = clampScale(scale.value > 1.5 ? 1 : 2.5);
      const px = (event.x - cw / 2 - translateX.value) / scale.value;
      const py = (event.y - ch / 2 - translateY.value) / scale.value;
      scale.value = withTiming(target);
      translateX.value = withTiming(
        clampOffset(
          event.x - cw / 2 - target * px,
          BASE_WIDTH * baseScale * target,
          cw
        )
      );
      translateY.value = withTiming(
        clampOffset(
          event.y - ch / 2 - target * py,
          BASE_HEIGHT * baseScale * target,
          ch
        )
      );
    });

  const selectAt = (x: number, y: number) => {
    const [lon, lat] = MAP.unproject(x, y);
    const name = MAP.districtAt(lon, lat);
    setSelected(previous =>
      name && previous?.name !== name ? riskOf.get(name) ?? null : null
    );
  };

  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .maxDuration(250)
    .onEnd(event => {
      const { width: cw, height: ch } = sizeSV.value;
      if (!cw || !ch) return;
      const baseScale = fitScale(cw, ch);
      const mapW = BASE_WIDTH * baseScale;
      const mapH = BASE_HEIGHT * baseScale;
      const px = (event.x - cw / 2 - translateX.value) / scale.value;
      const py = (event.y - ch / 2 - translateY.value) / scale.value;
      runOnJS(selectAt)((px + mapW / 2) / baseScale, (py + mapH / 2) / baseScale);
    });

  const gesture = Gesture.Simultaneous(
    pinch,
    pan,
    Gesture.Exclusive(doubleTap, singleTap)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const zoomBy = (factor: number) => {
    const { width: cw, height: ch } = sizeSV.value;
    if (!cw || !ch) return;
    const baseScale = fitScale(cw, ch);
    const next = clampScale(scale.value * factor);
    const ratio = next / scale.value;
    scale.value = withTiming(next);
    translateX.value = withTiming(
      clampOffset(translateX.value * ratio, BASE_WIDTH * baseScale * next, cw)
    );
    translateY.value = withTiming(
      clampOffset(translateY.value * ratio, BASE_HEIGHT * baseScale * next, ch)
    );
  };

  const reset = () => {
    scale.value = withTiming(1);
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
  };

  const baseScale =
    size.width && size.height ? fitScale(size.width, size.height) : 0;
  const mapW = BASE_WIDTH * baseScale;
  const mapH = BASE_HEIGHT * baseScale;
  const iconSize = 18;

  return (
    <View className="flex-1 bg-white overflow-hidden" onLayout={onLayout}>
      {mapW > 0 && mapH > 0 && (
        <GestureDetector gesture={gesture}>
          <View className="flex-1 items-center justify-center">
            <Animated.View style={[{ width: mapW, height: mapH }, animatedStyle]}>
              <Svg
                width={mapW}
                height={mapH}
                viewBox={`0 0 ${BASE_WIDTH} ${BASE_HEIGHT}`}
                preserveAspectRatio="none"
              >
                <Rect
                  x={0}
                  y={0}
                  width={BASE_WIDTH}
                  height={BASE_HEIGHT}
                  fill="#FFFFFF"
                />

                {MAP.districts.map(district => {
                  const prediction = riskOf.get(district.name);
                  const risk = prediction?.risk ?? 'Low';
                  const isSelected = selected?.name === district.name;
                  return (
                    <Path
                      key={`shape-${district.name}`}
                      d={district.path}
                      fill={RISK_COLORS[risk]}
                      stroke={isSelected ? '#F59E0B' : BORDER}
                      strokeWidth={isSelected ? 1.2 : 0.35}
                      fillRule="evenodd"
                    />
                  );
                })}

                {MAP.districts.map(district => {
                  const prediction = riskOf.get(district.name);
                  const risk = prediction?.risk ?? 'Low';
                  return (
                    <SvgText
                      key={`label-${district.name}`}
                      x={district.label[0]}
                      y={district.label[1]}
                      fill={risk === 'High' ? '#FFFFFF' : BORDER}
                      fontSize={3.4}
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {district.name}
                    </SvgText>
                  );
                })}

                {userPoint && (
                  <>
                    <Circle
                      cx={userPoint.point[0]}
                      cy={userPoint.point[1]}
                      r={2.4}
                      fill="#1D4ED8"
                      stroke="#FFFFFF"
                      strokeWidth={0.7}
                    />
                    <Circle
                      cx={userPoint.point[0]}
                      cy={userPoint.point[1]}
                      r={4.6}
                      fill="none"
                      stroke="#1D4ED8"
                      strokeWidth={0.45}
                    />
                  </>
                )}
              </Svg>
            </Animated.View>
          </View>
        </GestureDetector>
      )}

      <View className="absolute right-3 bottom-24">
        <Pressable
          onPress={() => zoomBy(1.5)}
          className="h-10 w-10 rounded-xl bg-white border border-slate-200 items-center justify-center mb-2"
          accessibilityRole="button"
          accessibilityLabel="Zoom in"
        >
          <Ionicons name="add" size={iconSize} color={BORDER} />
        </Pressable>
        <Pressable
          onPress={() => zoomBy(1 / 1.5)}
          className="h-10 w-10 rounded-xl bg-white border border-slate-200 items-center justify-center mb-2"
          accessibilityRole="button"
          accessibilityLabel="Zoom out"
        >
          <Ionicons name="remove" size={iconSize} color={BORDER} />
        </Pressable>
        <Pressable
          onPress={reset}
          className="h-10 w-10 rounded-xl bg-white border border-slate-200 items-center justify-center mb-2"
          accessibilityRole="button"
          accessibilityLabel="Reset map"
        >
          <Ionicons name="scan-outline" size={iconSize} color={BORDER} />
        </Pressable>
        <Pressable
          onPress={onRequestLocation}
          disabled={locating}
          className="h-10 w-10 rounded-xl bg-white border border-slate-200 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="My location"
        >
          {locating ? (
            <ActivityIndicator size="small" color={BORDER} />
          ) : (
            <Ionicons name="locate" size={iconSize} color={BORDER} />
          )}
        </Pressable>
      </View>

      <View
        pointerEvents="none"
        className="absolute left-3 bottom-24 bg-white/95 rounded-xl border border-slate-200 px-2.5 py-2"
      >
        {RISK_LABELS.map(({ level, label }) => (
          <View key={level} className="flex-row items-center mb-1 last:mb-0">
            <View
              style={{
                backgroundColor: RISK_COLORS[level],
                borderColor: BORDER,
              }}
              className="h-3 w-3 rounded-sm border mr-1.5"
            />
            <Text className="text-slate-700 text-[10px] font-semibold">
              {label}
            </Text>
          </View>
        ))}
      </View>

      {(selected || userPoint?.district) && (
        <View
          pointerEvents="none"
          className="absolute left-3 bottom-48 right-24 bg-white/95 rounded-xl border border-slate-200 px-3 py-2"
        >
          {selected ? (
            <>
              <Text className="text-slate-900 text-xs font-bold">
                {selected.name}
              </Text>
              <Text className="text-slate-500 text-[10px]">
                {selected.risk} risk · {selected.count} accidents (7d)
              </Text>
            </>
          ) : (
            <Text className="text-police-navy text-[11px] font-semibold">
              You are in {userPoint?.district}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
