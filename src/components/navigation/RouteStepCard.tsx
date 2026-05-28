import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { EnrichedStep } from '../../services/navigation/connectionEngine';

const DIRECTION_ICONS: Record<string, string> = {
  straight:    'arrow-up',
  left:        'arrow-back',
  right:       'arrow-forward',
  elevator:    'arrow-up-circle-outline',
  escalator:   'trending-up-outline',
  stairs:      'git-branch-outline',
  security:    'shield-checkmark-outline',
  customs:     'flag-outline',
  train:       'train-outline',
  shuttle:     'bus-outline',
  destination: 'flag',
};

const TYPE_COLOR: Record<string, string> = {
  walk:        '#60a5fa',
  elevator:    '#a78bfa',
  escalator:   '#34d399',
  stairs:      '#fbbf24',
  security:    '#f87171',
  customs:     '#fb923c',
  train:       '#38bdf8',
  shuttle:     '#22d3ee',
};

interface Props {
  step:        EnrichedStep;
  stepNumber:  number;
  totalSteps:  number;
  isCurrent?:  boolean;
  isCompleted?: boolean;
  onPress?:    () => void;
}

export function RouteStepCard({
  step,
  stepNumber,
  totalSteps,
  isCurrent   = false,
  isCompleted = false,
  onPress,
}: Props) {
  const iconName    = (DIRECTION_ICONS[step.direction] ?? 'arrow-up') as any;
  const accentColor = isCompleted
    ? '#22c55e'
    : isCurrent
    ? (TYPE_COLOR[step.type] ?? '#60a5fa')
    : '#475569';

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={[
        styles.card,
        isCurrent   && styles.cardCurrent,
        isCompleted && styles.cardCompleted,
      ]}
    >
      {/* Step number + icon column */}
      <View style={styles.leftCol}>
        <View style={[styles.iconCircle, { backgroundColor: isCompleted ? '#14532d' : isCurrent ? '#1e3a5f' : '#0f172a', borderColor: accentColor }]}>
          {isCompleted ? (
            <Ionicons name="checkmark" size={18} color="#22c55e" />
          ) : (
            <Ionicons name={iconName} size={18} color={accentColor} />
          )}
        </View>
        {/* Connector line (not on last step) */}
        {stepNumber < totalSteps && (
          <View style={[styles.connector, { backgroundColor: isCompleted ? '#22c55e' : '#1e293b' }]} />
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={[styles.typePill, { backgroundColor: isCompleted ? '#14532d' : isCurrent ? '#1e3a5f' : '#0f172a' }]}>
            <Text style={[styles.typeText, { color: accentColor }]}>
              {step.type.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.stepCounter}>{stepNumber}/{totalSteps}</Text>
        </View>

        {/* Instruction */}
        <Text style={[styles.instruction, isCurrent && styles.instructionCurrent]}>
          {step.instruction}
        </Text>

        {/* Landmark */}
        {step.landmark ? (
          <View style={styles.landmarkRow}>
            <Ionicons name="location-outline" size={12} color="#64748b" />
            <Text style={styles.landmark}>Look for: {step.landmark}</Text>
          </View>
        ) : null}

        {/* Meta row: distance + time */}
        <View style={styles.metaRow}>
          {step.distanceMeters ? (
            <View style={styles.metaChip}>
              <Ionicons name="footsteps-outline" size={11} color="#64748b" />
              <Text style={styles.metaText}>{step.distanceMeters}m</Text>
            </View>
          ) : null}
          {step.adjustedSeconds ? (
            <View style={styles.metaChip}>
              <Ionicons name="timer-outline" size={11} color="#64748b" />
              <Text style={styles.metaText}>{Math.ceil(step.adjustedSeconds / 60)} min</Text>
            </View>
          ) : null}
          {step.requiresWheelchairAccess && (
            <View style={[styles.metaChip, styles.accessChip]}>
              <Ionicons name="accessibility-outline" size={11} color="#a78bfa" />
              <Text style={[styles.metaText, { color: '#a78bfa' }]}>Accessible</Text>
            </View>
          )}
        </View>

        {/* Current step CTA */}
        {isCurrent && !isCompleted && (
          <View style={styles.ctaRow}>
            <Ionicons name="navigate-circle" size={13} color="#60a5fa" />
            <Text style={styles.ctaText}>You are here — follow the signs</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardCurrent: {
    borderColor: '#3b82f6',
    backgroundColor: '#172033',
  },
  cardCompleted: {
    opacity: 0.65,
  },

  leftCol:    { alignItems: 'center', width: 40 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  connector:  { flex: 1, width: 2, marginTop: 4, borderRadius: 1 },

  content:    { flex: 1, gap: 5 },
  headerRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typePill:   { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  typeText:   { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  stepCounter:{ fontSize: 11, color: '#475569', fontWeight: '600' },

  instruction:        { fontSize: 15, fontWeight: '600', color: '#94a3b8', lineHeight: 21 },
  instructionCurrent: { color: '#f8fafc', fontWeight: '700' },

  landmarkRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  landmark:    { fontSize: 12, color: '#64748b', fontStyle: 'italic' },

  metaRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  metaChip:  { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#0f172a', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  accessChip:{ backgroundColor: '#1e1a2e' },
  metaText:  { fontSize: 11, color: '#64748b', fontWeight: '500' },

  ctaRow:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  ctaText:   { fontSize: 12, color: '#60a5fa', fontWeight: '600' },
});
