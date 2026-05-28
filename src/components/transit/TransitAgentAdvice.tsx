// ══════════════════════════════════════════════════════════
// TransitAgentAdvice — Smart Inter-Terminal Transit Widget
// ══════════════════════════════════════════════════════════
// Renders the terminal transit agent's result as a collapsible
// card with three route-strategy tabs (Fastest / Least Walking /
// Airside Only) and colour-coded risk indicators.
// ══════════════════════════════════════════════════════════

import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  RISK_COLOR,
  TRANSPORT_ICON,
  TRANSPORT_LABEL,
  RISK_RANK,
  type TransitAgentResult,
  type TransitOptimisation,
  type TransitRiskLevel,
  type TransitRoute,
  type TransitStep,
  type TransitWarning,
} from '../../types/models/terminalTransit';

// ── Sub-components ────────────────────────────────────────

function RiskBadge({ level, label }: { level: TransitRiskLevel; label?: string }) {
  const { bg, text, border } = RISK_COLOR[level];
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (level !== 'critical') return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulse, { toValue: 1,    duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [level]);

  const icon: Record<TransitRiskLevel, string> = {
    none:     'checkmark-circle',
    low:      'checkmark-circle',
    medium:   'warning',
    high:     'alert-circle',
    critical: 'close-circle',
  };

  return (
    <Animated.View
      style={[
        styles.riskBadge,
        { backgroundColor: bg, borderColor: border, transform: [{ scale: pulse }] },
      ]}
    >
      <Ionicons name={icon[level] as any} size={12} color={text} />
      <Text style={[styles.riskBadgeText, { color: text }]}>
        {label ?? level.toUpperCase()}
      </Text>
    </Animated.View>
  );
}

function WarningBanner({ warning }: { warning: TransitWarning }) {
  const { bg, text, border } = RISK_COLOR[warning.level];
  const iconMap: Record<TransitRiskLevel, string> = {
    none: 'information-circle', low: 'information-circle',
    medium: 'warning', high: 'alert-circle', critical: 'close-circle',
  };
  return (
    <View style={[styles.warningBanner, { backgroundColor: bg, borderLeftColor: border }]}>
      <Ionicons name={iconMap[warning.level] as any} size={18} color={text} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.warningTitle, { color: text }]}>{warning.title}</Text>
        <Text style={styles.warningDetail}>{warning.detail}</Text>
      </View>
    </View>
  );
}

function StepCard({ step, isLast }: { step: TransitStep; isLast: boolean }) {
  const topWarning  = step.warnings.sort((a, b) => RISK_RANK[b.level] - RISK_RANK[a.level])[0];
  const stepRisk    = topWarning?.level ?? 'none';
  const accentColor = RISK_COLOR[stepRisk].text;

  return (
    <View style={styles.stepRow}>
      {/* Connector line */}
      <View style={styles.stepLeft}>
        <View style={[styles.stepDot, { borderColor: accentColor, backgroundColor: RISK_COLOR[stepRisk].bg }]}>
          <Text style={styles.stepDotText}>{step.stepNumber}</Text>
        </View>
        {!isLast && <View style={[styles.stepLine, { backgroundColor: accentColor + '44' }]} />}
      </View>

      {/* Content */}
      <View style={styles.stepContent}>
        {/* Transport mode header */}
        <View style={styles.stepHeader}>
          <Text style={styles.stepEmoji}>{TRANSPORT_ICON[step.transportMode]}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.stepLabel}>{step.label}</Text>
            <Text style={styles.stepInstruction}>{step.instruction}</Text>
          </View>
        </View>

        {/* Meta chips */}
        <View style={styles.stepMeta}>
          <View style={styles.metaChip}>
            <Ionicons name="time-outline" size={11} color="#64748b" />
            <Text style={styles.metaText}>{step.durationMinutes} min</Text>
          </View>
          {step.frequencyMinutes !== null && (
            <View style={styles.metaChip}>
              <Ionicons name="repeat-outline" size={11} color="#64748b" />
              <Text style={styles.metaText}>every {step.frequencyMinutes} min</Text>
            </View>
          )}
          <View style={styles.metaChip}>
            <Ionicons name={step.routeType === 'airside' ? 'shield-checkmark-outline' : 'exit-outline'} size={11} color={step.routeType === 'airside' ? '#4ade80' : '#f97316'} />
            <Text style={[styles.metaText, { color: step.routeType === 'airside' ? '#4ade80' : '#f97316' }]}>
              {step.routeType === 'airside' ? 'Airside' : step.routeType === 'landside' ? 'Landside' : 'Mixed'}
            </Text>
          </View>
        </View>

        {/* Per-step warnings */}
        {step.warnings.slice(0, 2).map((w) => (
          <WarningBanner key={w.code} warning={w} />
        ))}

        {step.notes && (
          <Text style={styles.stepNotes}>💡 {step.notes}</Text>
        )}
      </View>
    </View>
  );
}

function RoutePanel({ route, connectionWindowMinutes }: { route: TransitRoute; connectionWindowMinutes?: number }) {
  const timeColor = RISK_COLOR[route.overallRisk].text;

  return (
    <View>
      {/* Summary strip */}
      <View style={styles.routeSummary}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: timeColor }]}>{route.totalMinutes} min</Text>
          <Text style={styles.summaryLabel}>Total time</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#94a3b8' }]}>
            {route.totalWalkingMetres >= 1000
              ? `${(route.totalWalkingMetres / 1000).toFixed(1)} km`
              : `${route.totalWalkingMetres} m`}
          </Text>
          <Text style={styles.summaryLabel}>Walking</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons
              name={route.isAirsideOnly ? 'shield-checkmark' : 'exit'}
              size={14}
              color={route.isAirsideOnly ? '#4ade80' : '#f97316'}
            />
            <Text style={[styles.summaryValue, { color: route.isAirsideOnly ? '#4ade80' : '#f97316' }]}>
              {route.isAirsideOnly ? 'Airside' : 'Landside'}
            </Text>
          </View>
          <Text style={styles.summaryLabel}>Route type</Text>
        </View>
        {connectionWindowMinutes && (
          <>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[
                styles.summaryValue,
                { color: route.totalMinutes / connectionWindowMinutes >= 0.8 ? '#f87171' : '#4ade80' },
              ]}>
                {Math.max(0, connectionWindowMinutes - route.totalMinutes)} min
              </Text>
              <Text style={styles.summaryLabel}>Buffer left</Text>
            </View>
          </>
        )}
      </View>

      {/* Route-level warnings */}
      {route.warnings.filter((w) => RISK_RANK[w.level] >= RISK_RANK['high']).map((w) => (
        <WarningBanner key={w.code} warning={w} />
      ))}

      {/* Steps */}
      {route.steps.length === 0 ? (
        <View style={styles.noRoute}>
          <Ionicons name="close-circle-outline" size={32} color="#475569" />
          <Text style={styles.noRouteText}>No route available for this strategy.</Text>
        </View>
      ) : (
        <View style={styles.stepsContainer}>
          {route.steps.map((step, i) => (
            <StepCard key={step.stepNumber} step={step} isLast={i === route.steps.length - 1} />
          ))}
          {/* Final destination */}
          <View style={styles.destRow}>
            <View style={[styles.destDot, { borderColor: timeColor }]}>
              <Ionicons name="flag" size={12} color={timeColor} />
            </View>
            <Text style={[styles.destText, { color: timeColor }]}>
              Arrived at Terminal {route.steps[route.steps.length - 1]?.toTerminal}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Main component ────────────────────────────────────────

interface Props {
  result: TransitAgentResult;
  connectionWindowMinutes?: number;
  /** Whether to start collapsed */
  defaultCollapsed?: boolean;
}

const TAB_ORDER: TransitOptimisation[] = ['fastest', 'airside_only', 'least_walking'];
const TAB_LABEL: Record<TransitOptimisation, string> = {
  fastest:       '⚡ Fastest',
  airside_only:  '🛡 Airside',
  least_walking: '🚶 Low Walk',
};

export function TransitAgentAdvice({ result, connectionWindowMinutes, defaultCollapsed = false }: Props) {
  const [collapsed, setCollapsed]       = useState(defaultCollapsed);
  const [activeTab, setActiveTab]       = useState<TransitOptimisation>('fastest');
  const expandAnim                      = useRef(new Animated.Value(defaultCollapsed ? 0 : 1)).current;

  const toggleCollapse = () => {
    const toValue = collapsed ? 1 : 0;
    Animated.timing(expandAnim, {
      toValue, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
    setCollapsed((c) => !c);
  };

  // ── Edge cases ─────────────────────────────────────────
  if (result.sameTerminal) {
    return (
      <View style={[styles.card, styles.cardSameTerminal]}>
        <View style={styles.cardHeaderRow}>
          <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
          <Text style={styles.sameTerminalText}>
            Arrival & departure are in the same terminal — no transit needed.
          </Text>
        </View>
      </View>
    );
  }

  if (result.noDataAvailable) {
    return (
      <View style={[styles.card, { borderColor: RISK_COLOR['medium'].border }]}>
        <View style={styles.cardHeaderRow}>
          <Ionicons name="help-circle-outline" size={20} color="#fbbf24" />
          <Text style={styles.noDataText}>
            No terminal routing data for {result.query.airportCode}.{'\n'}Allow extra connection time.
          </Text>
        </View>
      </View>
    );
  }

  const overallRisk = result.recommendedRoute?.overallRisk ?? (result.isFeasible ? 'medium' : 'critical');
  const { bg, text: textColor, border } = RISK_COLOR[overallRisk];

  const activeRoute = result.routes.find((r) => r.id === activeTab) ?? result.routes[0];

  return (
    <View style={[styles.card, { borderColor: border }]}>
      {/* ── Card header ── */}
      <TouchableOpacity
        style={[styles.cardHeader, { backgroundColor: bg }]}
        onPress={toggleCollapse}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeaderLeft}>
          <View style={styles.routeRoute}>
            <Text style={styles.terminalLabel}>T {result.query.fromTerminal}</Text>
            <Ionicons name="arrow-forward" size={14} color="#64748b" />
            <Text style={styles.terminalLabel}>T {result.query.toTerminal}</Text>
          </View>
          <Text style={styles.airportLabel}>{result.query.airportCode} · Inter-Terminal Transit</Text>
        </View>

        <View style={styles.cardHeaderRight}>
          {result.recommendedRoute && (
            <Text style={[styles.timeLabel, { color: textColor }]}>
              ~{result.recommendedRoute.totalMinutes} min
            </Text>
          )}
          <RiskBadge level={overallRisk} />
          <Ionicons
            name={collapsed ? 'chevron-down' : 'chevron-up'}
            size={16}
            color="#475569"
          />
        </View>
      </TouchableOpacity>

      {/* ── Blockers (always visible) ── */}
      {result.blockers.length > 0 && (
        <View style={styles.blockersWrap}>
          {result.blockers.map((b) => (
            <WarningBanner key={b.code} warning={b} />
          ))}
        </View>
      )}

      {/* ── Expandable body ── */}
      {!collapsed && (
        <View style={styles.body}>
          {/* Strategy tabs */}
          <View style={styles.tabBar}>
            {TAB_ORDER.map((tab) => {
              const route  = result.routes.find((r) => r.id === tab);
              const isAvail = route && route.steps.length > 0;
              const isActive = activeTab === tab;
              const tabRisk  = route?.overallRisk ?? 'none';
              return (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tab,
                    isActive && { backgroundColor: RISK_COLOR[tabRisk].bg, borderColor: RISK_COLOR[tabRisk].border },
                    !isAvail && styles.tabDisabled,
                  ]}
                  onPress={() => isAvail && setActiveTab(tab)}
                  disabled={!isAvail}
                  activeOpacity={0.75}
                >
                  <Text style={[
                    styles.tabText,
                    isActive && { color: RISK_COLOR[tabRisk].text },
                    !isAvail && styles.tabTextDisabled,
                  ]}>
                    {TAB_LABEL[tab]}
                  </Text>
                  {isAvail && (
                    <RiskBadge level={tabRisk} label={`${route!.totalMinutes}m`} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Active route */}
          {activeRoute ? (
            <RoutePanel
              route={activeRoute}
              connectionWindowMinutes={connectionWindowMinutes}
            />
          ) : (
            <View style={styles.noRoute}>
              <Text style={styles.noRouteText}>No route for this strategy.</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1.5,
    backgroundColor: '#0f172a',
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardSameTerminal: {
    borderColor: RISK_COLOR['none'].border,
    backgroundColor: RISK_COLOR['none'].bg,
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  sameTerminalText: {
    color: '#4ade80', fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 18,
  },
  noDataText: {
    color: '#fbbf24', fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 18,
  },

  // Header
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, paddingHorizontal: 16,
  },
  cardHeaderLeft:  { flex: 1, gap: 2 },
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeRoute:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  terminalLabel:   { fontSize: 15, fontWeight: '800', color: '#f8fafc' },
  airportLabel:    { fontSize: 11, color: '#64748b', fontWeight: '500' },
  timeLabel:       { fontSize: 14, fontWeight: '800' },

  riskBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6, borderWidth: 1,
  },
  riskBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },

  blockersWrap: { paddingHorizontal: 14, paddingBottom: 6, gap: 6 },

  // Warning
  warningBanner: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    padding: 12, borderRadius: 10, borderLeftWidth: 3,
    marginBottom: 6,
  },
  warningTitle:  { fontSize: 12, fontWeight: '700', color: '#f8fafc', marginBottom: 2 },
  warningDetail: { fontSize: 11, color: '#94a3b8', lineHeight: 15 },

  // Body
  body: { padding: 14, paddingTop: 8, gap: 12 },

  // Tabs
  tabBar: { flexDirection: 'row', gap: 6 },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 8, paddingHorizontal: 6,
    borderRadius: 10, borderWidth: 1.5, borderColor: '#334155',
    backgroundColor: '#1e293b',
  },
  tabDisabled:     { opacity: 0.35 },
  tabText:         { fontSize: 11, fontWeight: '700', color: '#64748b' },
  tabTextDisabled: { color: '#334155' },

  // Summary strip
  routeSummary: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1e293b', borderRadius: 12, padding: 12,
    marginBottom: 8,
  },
  summaryItem:   { flex: 1, alignItems: 'center', gap: 2 },
  summaryValue:  { fontSize: 14, fontWeight: '800' },
  summaryLabel:  { fontSize: 9, color: '#475569', fontWeight: '600', textTransform: 'uppercase' },
  summaryDivider:{ width: 1, height: 28, backgroundColor: '#334155' },

  // Steps
  stepsContainer: { gap: 0 },
  stepRow:        { flexDirection: 'row', gap: 12 },
  stepLeft:       { alignItems: 'center', width: 28 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  stepDotText: { fontSize: 11, fontWeight: '800', color: '#f8fafc' },
  stepLine:    { flex: 1, width: 2, marginTop: 4, marginBottom: 0 },

  stepContent: { flex: 1, paddingBottom: 16 },
  stepHeader:  { flexDirection: 'row', gap: 10, marginBottom: 6 },
  stepEmoji:   { fontSize: 22, lineHeight: 28 },
  stepLabel:   { fontSize: 13, fontWeight: '700', color: '#f8fafc', marginBottom: 2 },
  stepInstruction:{ fontSize: 12, color: '#94a3b8', lineHeight: 17 },

  stepMeta:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  metaChip:    { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#1e293b', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  metaText:    { fontSize: 10, color: '#64748b', fontWeight: '600' },
  stepNotes:   { fontSize: 11, color: '#475569', fontStyle: 'italic', marginTop: 4, lineHeight: 15 },

  destRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4 },
  destDot:     { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  destText:    { fontSize: 13, fontWeight: '700' },

  noRoute:     { alignItems: 'center', paddingVertical: 24, gap: 8 },
  noRouteText: { fontSize: 13, color: '#475569', textAlign: 'center' },
});
