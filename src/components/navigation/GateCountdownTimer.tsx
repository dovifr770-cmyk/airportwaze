import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { GateCountdown } from '../../services/navigation/connectionEngine';

const SIZE          = 220;
const STROKE_WIDTH  = 14;
const RADIUS        = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER        = SIZE / 2;

interface Props {
  countdown: GateCountdown;
}

export function GateCountdownTimer({ countdown }: Props) {
  const { displayMinutes, displaySeconds, config, progressFraction, isClosed } = countdown;

  // ── Pulse animation (runs when hurry/run urgency) ────────
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (config.pulse && !isClosed) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.04, duration: 500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(pulseAnim, { toValue: 1.00, duration: 500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ]),
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation(() => pulseAnim.setValue(1));
      glowAnim.stopAnimation(()  => glowAnim.setValue(0));
    }
  }, [config.pulse, isClosed]);

  // ── SVG ring ─────────────────────────────────────────────
  // strokeDashoffset depletes the ring as time runs out.
  // 0 = full ring, CIRCUMFERENCE = empty ring
  const strokeOffset = CIRCUMFERENCE * (1 - (isClosed ? 0 : progressFraction));

  const glowOpacity = glowAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0.15, 0.45],
  });

  return (
    <View style={styles.wrapper}>
      {/* Glow halo behind ring (only when pulsing) */}
      {config.pulse && (
        <Animated.View
          style={[
            styles.glow,
            { borderColor: config.color, opacity: glowOpacity },
          ]}
        />
      )}

      <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
        {/* SVG countdown ring */}
        <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
          {/* Track ring */}
          <Circle
            cx={CENTER} cy={CENTER} r={RADIUS}
            fill="none"
            stroke="#1e293b"
            strokeWidth={STROKE_WIDTH}
          />
          {/* Progress ring */}
          <Circle
            cx={CENTER} cy={CENTER} r={RADIUS}
            fill="none"
            stroke={isClosed ? '#475569' : config.color}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            // Rotate so depletion starts at top (12 o'clock)
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
          />
        </Svg>

        {/* Inner content */}
        <View style={styles.inner}>
          {isClosed ? (
            <>
              <Text style={[styles.closedIcon]}>🚫</Text>
              <Text style={[styles.closedLabel, { color: config.color }]}>GATE{'\n'}CLOSED</Text>
            </>
          ) : (
            <>
              <Text style={styles.label}>Gate closes in</Text>
              <View style={styles.timeRow}>
                <Text style={[styles.digits, { color: config.color }]}>{displayMinutes}</Text>
                <Text style={[styles.colon,  { color: config.color }]}>:</Text>
                <Text style={[styles.digits, { color: config.color }]}>{displaySeconds}</Text>
              </View>
              <Text style={styles.unitRow}>
                <Text style={styles.unit}>min</Text>
                <Text style={styles.unitSep}>  </Text>
                <Text style={styles.unit}>sec</Text>
              </Text>
            </>
          )}
        </View>
      </Animated.View>

      {/* Status chip */}
      <View style={[styles.chip, { backgroundColor: config.bgColor }]}>
        <Text style={[styles.chipText, { color: config.color }]}>
          {config.label}
        </Text>
      </View>

      {/* Coaching message */}
      <Text style={[styles.message, { color: config.color }]}>
        {config.message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:     { alignItems: 'center', paddingVertical: 8 },
  glow: {
    position: 'absolute',
    width: SIZE + 24, height: SIZE + 24,
    borderRadius: (SIZE + 24) / 2,
    borderWidth: 12,
    top: -12, left: -12,
  },
  container:   { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  inner:       { alignItems: 'center' },
  label:       { fontSize: 12, color: '#64748b', fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  timeRow:     { flexDirection: 'row', alignItems: 'center' },
  digits:      { fontSize: 54, fontWeight: '800', letterSpacing: -2, fontVariant: ['tabular-nums'] },
  colon:       { fontSize: 44, fontWeight: '800', marginHorizontal: 2, marginBottom: 4 },
  unitRow:     { flexDirection: 'row', marginTop: 2 },
  unit:        { fontSize: 11, color: '#475569', fontWeight: '600', letterSpacing: 1, width: 48, textAlign: 'center' },
  unitSep:     { width: 12 },
  closedIcon:  { fontSize: 36, marginBottom: 8 },
  closedLabel: { fontSize: 18, fontWeight: '800', textAlign: 'center', letterSpacing: 1 },
  chip:        { marginTop: 16, paddingHorizontal: 20, paddingVertical: 6, borderRadius: 20 },
  chipText:    { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  message:     { fontSize: 13, fontWeight: '500', marginTop: 8, opacity: 0.85 },
});
