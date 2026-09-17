import { useCallback, useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';

const policeLogo = require('@/assets/images/police.png');

type LoadingScreenProps = {
  minimumDuration?: number;
  onFinish: () => void;
};

export function LoadingScreen({
  minimumDuration = 1600,
  onFinish,
}: LoadingScreenProps) {
  const opacity = useRef(new Animated.Value(1)).current;

  const handleFinish = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => onFinish());
  }, [opacity, onFinish]);

  useEffect(() => {
    const timer = setTimeout(handleFinish, minimumDuration);
    return () => clearTimeout(timer);
  }, [handleFinish, minimumDuration]);

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { opacity }]}
      className="z-50 items-center justify-center bg-police-primary"
    >
      <View className="h-44 w-44 items-center justify-center rounded-full bg-white">
        <Image
          source={policeLogo}
          className="h-36 w-36"
          resizeMode="contain"
        />
      </View>
      <Text className="mt-8 text-2xl font-bold tracking-wide text-white">
        SL Police Alert
      </Text>
      <Text className="mt-2 text-sm text-blue-200">Sri Lanka Police</Text>
    </Animated.View>
  );
}