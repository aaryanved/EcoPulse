import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

const { width } = Dimensions.get('window');

export function SplashLoader() {
  const outerScale = useSharedValue(0);
  const innerScale = useSharedValue(0);
  const leafScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const pulseOpacity = useSharedValue(0.4);

  useEffect(() => {
    // Sequence: outer ring → inner circle → leaf icon → title → subtitle
    outerScale.value = withSpring(1, { damping: 10, stiffness: 80 });

    setTimeout(() => {
      innerScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    }, 150);

    setTimeout(() => {
      leafScale.value = withSpring(1, { damping: 8, stiffness: 120 });
    }, 300);

    setTimeout(() => {
      titleOpacity.value = withTiming(1, { duration: 400 });
    }, 500);

    setTimeout(() => {
      subtitleOpacity.value = withTiming(1, { duration: 400 });
    }, 700);

    // Idle pulse after entrance
    setTimeout(() => {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }, 900);
  }, []);

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: outerScale.value }],
  }));

  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: innerScale.value }],
  }));

  const leafStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: leafScale.value },
      {
        rotate: `${interpolate(leafScale.value, [0, 1], [-30, 0], Extrapolation.CLAMP)}deg`,
      },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [
      {
        translateY: interpolate(titleOpacity.value, [0, 1], [10, 0], Extrapolation.CLAMP),
      },
    ],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [
      {
        translateY: interpolate(subtitleOpacity.value, [0, 1], [8, 0], Extrapolation.CLAMP),
      },
    ],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Ambient glow rings */}
      <Animated.View style={[styles.glowRingOuter, pulseStyle]} />
      <Animated.View style={[styles.glowRingMid, pulseStyle]} />

      {/* Logo */}
      <Animated.View style={[styles.outerRing, outerStyle]}>
        <Animated.View style={[styles.innerCircle, innerStyle]}>
          <Animated.View style={leafStyle}>
            <MaterialCommunityIcons name="leaf" size={48} color={Colors.emerald[400]} />
          </Animated.View>
        </Animated.View>
      </Animated.View>

      {/* App name */}
      <Animated.Text style={[styles.title, titleStyle]}>EcoPulse</Animated.Text>
      <Animated.Text style={[styles.subtitle, subtitleStyle]}>
        Your Carbon Intelligence
      </Animated.Text>

      {/* Loading dots */}
      <Animated.View style={[styles.dotsRow, subtitleStyle]}>
        {[0, 1, 2].map(i => (
          <LoadingDot key={i} delay={i * 200} />
        ))}
      </Animated.View>
    </View>
  );
}

function LoadingDot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    setTimeout(() => {
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.3, { duration: 500 })
        ),
        -1,
        false
      );
    }, delay + 900);
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  glowRingOuter: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: `${Colors.emerald[500]}06`,
    borderWidth: 1,
    borderColor: `${Colors.emerald[500]}20`,
  },
  glowRingMid: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: `${Colors.emerald[500]}08`,
    borderWidth: 1,
    borderColor: `${Colors.emerald[500]}30`,
  },
  outerRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: `${Colors.emerald[500]}50`,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.emerald[900]}40`,
  },
  innerCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: `${Colors.emerald[500]}20`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${Colors.emerald[500]}40`,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: -8,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.emerald[500],
  },
});
