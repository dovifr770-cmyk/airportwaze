import { useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CrowdDelay } from '../../services/navigation/crowdDelayEngine';
import { CROWD_TYPE_DISPLAY, severityColor } from '../../services/navigation/crowdDelayEngine';

interface Props {
  delays:            CrowdDelay[];
  totalDelayMinutes: number;
  isLoading?:        boolean;
  onCardPress?:      (delay: CrowdDelay) => void;
  onReportPress?:    () => void;
}

/**
 * Horizontal scrollable strip shown on the navigation dashboard.
 * Displays each crowd alert as a card. When delays exist it also
 * shows the total adjusted delay on the connection.
 */
export function CrowdSignalBanner({
  delays,
  totalDelayMinutes,
  isLoading,
  onCardPress,
  onReportPress,
}: Props) {
  const visibleDelays = delays.slice(0, 10);

  // No alerts and not loading — show a compact "all clear" strip
  if (!isLoading && visibleDelays.length === 0) {
    return (
      <View style={styles.allClear}>
        <Ionicons name="checkmark-circle" size={14} color="#4ade80" />
        <Text style={styles.allClearText}>No crowd alerts — terminal looks clear</Text>
        {onReportPress && (
          <TouchableOpacity onPress={onReportPress} style={styles.reportLink}>
            <Text style={styles.reportLinkText}>Report</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="people" size={14} color="#f87171" />
          <Text style={styles.headerTitle}>Live crowd alerts</Text>
          {totalDelayMinutes > 0 && (
            <View style={styles.totalDelayBadge}>
              <Text style={styles.totalDelayText}>+{Math.round(totalDelayMinutes)} min added</Text>
            </View>
          )}
        </View>
        {onReportPress && (
          <TouchableOpacity onPress={onReportPress} style={styles.reportBtn}>
            <Ionicons name="megaphone-outline" size={13} color="#a78bfa" />
            <Text style={styles.reportBtnText}>Report</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {isLoading
          ? [0, 1, 2].map((i) => <SkeletonCard key={i} />)
          : visibleDelays.map((d, i) => (
              <AlertCard key={i} delay={d} onPress={onCardPress} />
            ))
        }
      </ScrollView>
    </View>
  );
}

// ── Individual alert card ─────────────────────────────────

function AlertCard({ delay, onPress }: { delay: CrowdDelay; onPress?: (d: CrowdDelay) => void }) {
  const color   = delay.isPositive ? '#4ade80' : severityColor(delay.avgSeverity);
  const display = CROWD_TYPE_DISPLAY[delay.dominantType];

  return (
    <TouchableOpacity
      style={[styles.card, { borderTopColor: color }]}
      onPress={() => onPress?.(delay)}
      activeOpacity={0.8}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardEmoji}>{display.emoji}</Text>
        {delay.hasVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={10} color="#4ade80" />
          </View>
        )}
      </View>
      <Text style={[styles.cardType, { color }]} numberOfLines={1}>{display.shortLabel}</Text>
      <Text style={styles.cardLocation} numberOfLines={1}>{delay.locationLabel}</Text>

      {/* Impact */}
      {delay.delayMinutes > 0 ? (
        <View style={[styles.impactPill, { backgroundColor: color + '22' }]}>
          <Ionicons name="time-outline" size={10} color={color} />
          <Text style={[styles.impactText, { color }]}>+{delay.delayMinutes} min</Text>
        </View>
      ) : (
        <View style={[styles.impactPill, { backgroundColor: '#14532d' }]}>
          <Text style={[styles.impactText, { color: '#4ade80' }]}>No delay</Text>
        </View>
      )}

      {/* Report count */}
      <Text style={styles.reportCount}>
        {delay.reportCount} {delay.reportCount === 1 ? 'report' : 'reports'}
      </Text>
    </TouchableOpacity>
  );
}

// ── Skeleton loading card ─────────────────────────────────

function SkeletonCard() {
  const anim = useRef(new Animated.Value(0.4)).current;
  Animated.loop(
    Animated.sequence([
      Animated.timing(anim, { toValue: 0.8, duration: 700, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
    ]),
  ).start();

  return (
    <Animated.View style={[styles.card, styles.skeleton, { opacity: anim }]}>
      <View style={styles.skeletonCircle} />
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, { width: 60 }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper:    { gap: 10 },
  headerRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 0 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle:{ fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4 },
  totalDelayBadge: { backgroundColor: '#7f1d1d', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  totalDelayText:  { fontSize: 10, fontWeight: '700', color: '#f87171' },
  reportBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reportBtnText: { fontSize: 12, color: '#a78bfa', fontWeight: '600' },

  scroll: { gap: 10, paddingBottom: 4 },

  card: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 12,
    width: 140,
    gap: 4,
    borderTopWidth: 3,
  },
  cardTop:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cardEmoji:    { fontSize: 24 },
  verifiedBadge:{ backgroundColor: '#14532d', borderRadius: 4, padding: 2 },
  cardType:     { fontSize: 12, fontWeight: '700', lineHeight: 16 },
  cardLocation: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  impactPill:   { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 2 },
  impactText:   { fontSize: 10, fontWeight: '700' },
  reportCount:  { fontSize: 10, color: '#334155', marginTop: 2 },

  skeleton:       { backgroundColor: '#1e293b', borderTopColor: '#334155' },
  skeletonCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#334155' },
  skeletonLine:   { height: 10, borderRadius: 4, backgroundColor: '#334155', width: 90, marginTop: 6 },

  allClear:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0d2214', borderRadius: 12, padding: 10 },
  allClearText:  { flex: 1, fontSize: 12, color: '#4ade80', fontWeight: '500' },
  reportLink:    { paddingHorizontal: 8, paddingVertical: 4 },
  reportLinkText:{ fontSize: 12, color: '#a78bfa', fontWeight: '600' },
});
