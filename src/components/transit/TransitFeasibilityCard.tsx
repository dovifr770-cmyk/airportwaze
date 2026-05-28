// ══════════════════════════════════════════════════════════════
// TransitFeasibilityCard.tsx
// Real-time inter-terminal transfer feasibility card.
//
// States
//   safe     → green  "On Track"        clean breakdown + itinerary
//   warning  → amber  "Tight Transfer"  hurry message + breakdown
//   critical → red    "High Risk"       pulsing alert + full detail
// ══════════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import type {
  TransitFeasibilityResult,
  ItineraryStep,
  TransitFeasibilityStatus,
} from '../../types/models/terminalTransit';

// ── Status colour themes ──────────────────────────────────────

interface StatusTheme {
  bg:       string;
  border:   string;
  badge:    string;
  text:     string;
  dimText:  string;
  icon:     'checkmark-circle' | 'warning' | 'alert-circle';
}

const STATUS_THEME: Record<TransitFeasibilityStatus, StatusTheme> = {
  safe: {
    bg:      '#061a10',
    border:  '#166534',
    badge:   '#14532d',
    text:    '#4ade80',
    dimText: '#86efac',
    icon:    'checkmark-circle',
  },
  warning: {
    bg:      '#1c0f02',
    border:  '#92400e',
    badge:   '#451a03',
    text:    '#fbbf24',
    dimText: '#fcd34d',
    icon:    'warning',
  },
  critical: {
    bg:      '#1a0505',
    border:  '#991b1b',
    badge:   '#450a0a',
    text:    '#f87171',
    dimText: '#fca5a5',
    icon:    'alert-circle',
  },
};

// ── Breakdown row ─────────────────────────────────────────────

interface BreakdownRowProps {
  label:      string;
  value:      number;
  highlight?: string;
  bold?:      boolean;
  t:          ReturnType<typeof useTranslation>['t'];
}

function BreakdownRow({ label, value, highlight, bold, t }: BreakdownRowProps) {
  return (
    <View style={styles.bRow}>
      <Text
        style={[
          styles.bLabel,
          bold      ? styles.bLabelBold        : undefined,
          highlight ? { color: highlight }     : undefined,
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.bValue,
          bold      ? styles.bValueBold        : undefined,
          highlight ? { color: highlight }     : undefined,
        ]}
      >
        {t('transitAgent.durationMin', { min: value })}
      </Text>
    </View>
  );
}

// ── Itinerary row ─────────────────────────────────────────────

function ItineraryRow({ step, t }: { step: ItineraryStep; t: ReturnType<typeof useTranslation>['t'] }) {
  const penaltyColor =
    step.penaltyLevel === 'critical' ? '#f87171'
    : step.penaltyLevel === 'warning'  ? '#fbbf24'
    : undefined;

  return (
    <View style={[styles.itRow, step.isPenalty && styles.itRowPenalty]}>
      <Text style={styles.itIcon}>{step.icon}</Text>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.itLabel,
            penaltyColor ? { color: penaltyColor } : undefined,
          ]}
        >
          {step.label}
        </Text>
        {!!step.description && (
          <Text style={styles.itDesc} numberOfLines={2}>{step.description}</Text>
        )}
      </View>
      <Text
        style={[
          styles.itDuration,
          penaltyColor ? { color: penaltyColor } : undefined,
        ]}
      >
        {t('transitAgent.durationMin', { min: step.durationMin })}
      </Text>
    </View>
  );
}

// ── Main exported card ────────────────────────────────────────

interface TransitFeasibilityCardProps {
  result: TransitFeasibilityResult;
}

export function TransitFeasibilityCard({ result }: TransitFeasibilityCardProps) {
  const { t } = useTranslation();
  const theme  = STATUS_THEME[result.feasibilityStatus];
  const isCrit = result.feasibilityStatus === 'critical';
  const isWarn = result.feasibilityStatus === 'warning';

  // Pulsing scale for critical icon
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isCrit) {
      pulseAnim.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 500, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isCrit, pulseAnim]);

  // i18n key helpers
  const statusKey: string =
    result.feasibilityStatus === 'safe'     ? 'statusSafe'
    : result.feasibilityStatus === 'warning'  ? 'statusWarning'
    :                                           'statusCritical';

  const detailKey: string =
    result.feasibilityStatus === 'safe'     ? 'statusSafeDetail'
    : result.feasibilityStatus === 'warning'  ? 'statusWarningDetail'
    :                                           'statusCriticalDetail';

  return (
    <View style={[styles.card, { backgroundColor: theme.bg, borderColor: theme.border }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.cardTitle}>{t('transitAgent.cardTitle')}</Text>
          <Text style={[styles.terminalRoute, { color: theme.text }]}>
            {t('transitAgent.terminalRoute', {
              from: result.fromTerminal,
              to:   result.toTerminal,
            })}
          </Text>
          <Text style={styles.airportSuffix}>
            {t('transitAgent.airportSuffix', { code: result.airportCode })}
          </Text>
        </View>

        {/* Status badge */}
        <View style={[styles.badge, { backgroundColor: theme.badge, borderColor: theme.border }]}>
          <Animated.View style={isCrit ? { transform: [{ scale: pulseAnim }] } : undefined}>
            <Ionicons name={theme.icon} size={14} color={theme.text} />
          </Animated.View>
          <Text style={[styles.badgeText, { color: theme.text }]}>
            {t(`transitAgent.${statusKey}`)}
          </Text>
        </View>
      </View>

      {/* ── Status detail text ── */}
      <Text style={[styles.statusDetail, { color: theme.dimText }]}>
        {t(`transitAgent.${detailKey}`)}
      </Text>

      {/* ── Critical alert block ── */}
      {isCrit && (
        <View style={[styles.criticalBlock, { borderColor: theme.border }]}>
          <View style={styles.criticalIconRow}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Ionicons name="alert-circle" size={20} color="#f87171" />
            </Animated.View>
            <Text style={styles.criticalHeadline}>
              {t('transitAgent.criticalHeadline')}
            </Text>
          </View>
          <Text style={styles.criticalBody}>
            {t('transitAgent.criticalBody', {
              time:   result.totalEstimatedTimeMin,
              window: result.connectionWindowMin,
            })}
          </Text>
        </View>
      )}

      {/* ── Warning nudge ── */}
      {isWarn && (
        <View style={styles.warnNudge}>
          <Ionicons name="walk-outline" size={15} color="#fbbf24" />
          <Text style={styles.warnNudgeText}>
            {t('transitAgent.statusWarningDetail')}
          </Text>
        </View>
      )}

      {/* ── Time breakdown ── */}
      <View style={[styles.section, { borderTopColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {t('transitAgent.breakdownTitle')}
        </Text>

        <BreakdownRow
          label={t('transitAgent.baseTransit')}
          value={result.baseDurationMin}
          t={t}
        />

        {result.immigrationPenaltyMin > 0 && (
          <BreakdownRow
            label={t('transitAgent.immigrationPenalty')}
            value={result.immigrationPenaltyMin}
            highlight="#fbbf24"
            t={t}
          />
        )}
        {result.landsidePenaltyMin > 0 && (
          <BreakdownRow
            label={t('transitAgent.landsidePenalty')}
            value={result.landsidePenaltyMin}
            highlight="#fbbf24"
            t={t}
          />
        )}
        {result.crowdDelayMin > 0 && (
          <BreakdownRow
            label={t('transitAgent.crowdDelay')}
            value={result.crowdDelayMin}
            highlight="#f97316"
            t={t}
          />
        )}

        {/* Thin separator */}
        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <BreakdownRow
          label={t('transitAgent.totalTime')}
          value={result.totalEstimatedTimeMin}
          bold
          t={t}
        />

        {/* Buffer row — coloured by sign */}
        <View style={styles.bufferRow}>
          <Text style={styles.bufferLabel}>{t('transitAgent.bufferLeft')}</Text>
          {result.bufferTimeLeft >= 0 ? (
            <Text style={[styles.bufferValue, { color: theme.text }]}>
              {t('transitAgent.durationMin', { min: result.bufferTimeLeft })}
            </Text>
          ) : (
            <Text style={[styles.bufferValue, { color: '#f87171' }]}>
              {t('transitAgent.overBudget', { min: Math.abs(result.bufferTimeLeft) })}
            </Text>
          )}
        </View>
      </View>

      {/* ── Step-by-step itinerary ── */}
      {result.itinerary.length > 0 && (
        <View style={[styles.section, { borderTopColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t('transitAgent.itineraryTitle')}
          </Text>
          {result.itinerary.map((step) => (
            <ItineraryRow key={step.stepNumber} step={step} t={t} />
          ))}
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth:  1,
    overflow:     'hidden',
    marginBottom: 4,
  },

  // Header
  header: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    padding:        14,
    paddingBottom:  8,
    gap:            10,
  },
  headerLeft: { flex: 1 },
  cardTitle:  { fontSize: 11, fontWeight: '700', color: '#475569', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 },
  terminalRoute: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  airportSuffix: { fontSize: 11, color: '#475569', marginTop: 2 },

  badge: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            5,
    borderRadius:   20,
    borderWidth:    1,
    paddingHorizontal: 10,
    paddingVertical:    5,
    alignSelf:      'flex-start',
    marginTop:      2,
  },
  badgeText: { fontSize: 12, fontWeight: '700' },

  // Status detail
  statusDetail: {
    fontSize:     13,
    lineHeight:   18,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },

  // Critical block
  criticalBlock: {
    marginHorizontal: 14,
    marginBottom:     12,
    padding:          12,
    borderRadius:     10,
    backgroundColor:  '#2d0707',
    borderWidth:      1,
  },
  criticalIconRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    marginBottom:  6,
  },
  criticalHeadline: {
    fontSize:   14,
    fontWeight: '800',
    color:      '#f87171',
    flex:       1,
  },
  criticalBody: {
    fontSize:   12,
    lineHeight: 18,
    color:      '#fca5a5',
  },

  // Warning nudge
  warnNudge: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             6,
    marginHorizontal: 14,
    marginBottom:    12,
    padding:         10,
    borderRadius:    10,
    backgroundColor: '#1c1000',
  },
  warnNudgeText: {
    fontSize:   12,
    color:      '#fcd34d',
    flex:       1,
    lineHeight: 17,
  },

  // Section
  section: {
    padding:        14,
    paddingTop:     12,
    borderTopWidth: 1,
    gap:            6,
  },
  sectionTitle: {
    fontSize:        11,
    fontWeight:      '700',
    letterSpacing:   0.5,
    textTransform:   'uppercase',
    marginBottom:    4,
  },

  // Breakdown rows
  bRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  bLabel:      { fontSize: 13, color: '#94a3b8' },
  bLabelBold:  { fontWeight: '700', color: '#cbd5e1' },
  bValue:      { fontSize: 13, color: '#94a3b8' },
  bValueBold:  { fontWeight: '700', color: '#cbd5e1' },

  divider: { height: 1, marginVertical: 6 },

  // Buffer row
  bufferRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginTop:      2,
  },
  bufferLabel: { fontSize: 13, color: '#94a3b8' },
  bufferValue: { fontSize: 14, fontWeight: '800' },

  // Itinerary rows
  itRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  itRowPenalty: { backgroundColor: '#ffffff08', borderRadius: 8, paddingHorizontal: 8, marginHorizontal: -4 },
  itIcon:       { fontSize: 18, width: 26, textAlign: 'center' },
  itLabel:      { fontSize: 13, fontWeight: '600', color: '#cbd5e1' },
  itDesc:       { fontSize: 11, color: '#64748b', lineHeight: 15, marginTop: 1 },
  itDuration:   { fontSize: 12, fontWeight: '700', color: '#94a3b8', minWidth: 44, textAlign: 'right' },
});
