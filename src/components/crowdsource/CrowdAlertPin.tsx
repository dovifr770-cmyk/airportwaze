import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import type { CrowdDelay } from '../../services/navigation/crowdDelayEngine';
import { CROWD_TYPE_DISPLAY, severityColor } from '../../services/navigation/crowdDelayEngine';

interface Props {
  delay:    CrowdDelay;
  onPress?: (delay: CrowdDelay) => void;
  /** Scale the whole pin — useful for map overlays at different zoom levels */
  scale?:   number;
}

/**
 * A pulsing alert pin for the map overlay.
 * High-severity pins pulse; positive/clear reports show a static green dot.
 */
export function CrowdAlertPin({ delay, onPress, scale = 1 }: Props) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shouldPulse = !delay.isPositive && delay.avgSeverity >= 3;

  useEffect(() => {
    if (shouldPulse) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.20, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(pulseAnim, { toValue: 1.00, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation(() => pulseAnim.setValue(1));
    }
  }, [shouldPulse]);

  const color   = delay.isPositive ? '#4ade80' : severityColor(delay.avgSeverity);
  const display = CROWD_TYPE_DISPLAY[delay.dominantType];

  return (
    <TouchableOpacity
      onPress={() => onPress?.(delay)}
      activeOpacity={0.8}
      style={[styles.wrapper, { transform: [{ scale }] }]}
    >
      {/* Pulse ring */}
      {shouldPulse && (
        <Animated.View
          style={[
            styles.pulseRing,
            { borderColor: color, transform: [{ scale: pulseAnim }] },
          ]}
        />
      )}

      {/* Pin badge */}
      <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
        <Text style={styles.emoji}>{display.emoji}</Text>
      </View>

      {/* Delay label */}
      {delay.delayMinutes > 0 && (
        <View style={[styles.delayPill, { backgroundColor: color }]}>
          <Text style={styles.delayText}>+{delay.delayMinutes}m</Text>
        </View>
      )}

      {/* Tail */}
      <View style={[styles.tail, { borderTopColor: color + '22' }]} />
    </TouchableOpacity>
  );
}

/** Compact list version — no pulse, no tail, full row layout */
export function CrowdAlertRow({ delay, onPress }: { delay: CrowdDelay; onPress?: (d: CrowdDelay) => void }) {
  const color   = delay.isPositive ? '#4ade80' : severityColor(delay.avgSeverity);
  const display = CROWD_TYPE_DISPLAY[delay.dominantType];

  return (
    <TouchableOpacity
      style={[styles.row, { borderLeftColor: color }]}
      onPress={() => onPress?.(delay)}
      activeOpacity={0.75}
    >
      <Text style={styles.rowEmoji}>{display.emoji}</Text>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel} numberOfLines={1}>{delay.locationLabel}</Text>
        <Text style={[styles.rowType, { color }]}>{display.shortLabel}</Text>
      </View>
      <View style={styles.rowRight}>
        {delay.delayMinutes > 0 && (
          <View style={[styles.delayBadge, { backgroundColor: color + '22' }]}>
            <Text style={[styles.delayBadgeText, { color }]}>+{delay.delayMinutes} min</Text>
          </View>
        )}
        <Text style={styles.rowCount}>{delay.reportCount} {delay.reportCount === 1 ? 'report' : 'reports'}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper:    { alignItems: 'center', width: 56 },
  pulseRing:  { position: 'absolute', width: 52, height: 52, borderRadius: 26, borderWidth: 2, top: -2 },
  badge: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  emoji:      { fontSize: 22 },
  delayPill: {
    position: 'absolute', top: -8, right: -8,
    borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1,
  },
  delayText:  { fontSize: 10, fontWeight: '800', color: '#fff' },
  tail: {
    width: 0, height: 0,
    borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    marginTop: -1,
  },

  // Row variant
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1e293b', borderRadius: 14, padding: 12,
    borderLeftWidth: 3,
  },
  rowEmoji: { fontSize: 22, width: 28 },
  rowText:  { flex: 1 },
  rowLabel: { fontSize: 13, fontWeight: '700', color: '#f8fafc' },
  rowType:  { fontSize: 11, fontWeight: '600', marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 3 },
  delayBadge:     { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  delayBadgeText: { fontSize: 11, fontWeight: '700' },
  rowCount:       { fontSize: 10, color: '#475569' },
});
