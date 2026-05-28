import { useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Alert, Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useConnectionDashboard } from '../../../src/hooks/useConnectionDashboard';
import { useRouteNavigation }     from '../../../src/hooks/useRouteNavigation';
import { useGateCountdown }       from '../../../src/hooks/useGateCountdown';
import { useCrowdReports }        from '../../../src/hooks/useCrowdReports';
import { useTransitFeasibility }  from '../../../src/hooks/useTransitFeasibility';
import { RouteStepCard }          from '../../../src/components/navigation/RouteStepCard';
import { ReportSheet }            from '../../../src/components/crowdsource/ReportSheet';
import { TransitFeasibilityCard } from '../../../src/components/transit';
import { RISK_COLORS }            from '../../../src/types/models/flight';
import { getSignalForStep, severityColor, CROWD_TYPE_DISPLAY } from '../../../src/services/navigation/crowdDelayEngine';
import type { CreateCrowdReportInput } from '../../../src/types/models/crowdReport';

export default function RouteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { inbound = '', outbound = '', date = '' } =
    useLocalSearchParams<{ inbound: string; outbound: string; date: string }>();

  const [reportSheetOpen, setReportSheetOpen] = useState(false);

  // Re-use the same hook so data is already cached
  const dash      = useConnectionDashboard(inbound, outbound, date);
  const steps     = dash.route?.steps ?? [];
  const nav       = useRouteNavigation(steps);
  const countdown = useGateCountdown(dash.gateCloseTime ?? null);

  const airportCode = dash.outboundFlight?.origin.iataCode
    ?? dash.inboundFlight?.destination.iataCode
    ?? 'JFK';

  const crowd = useCrowdReports(airportCode);

  // ── Inter-terminal transit feasibility ──────────────────────
  // Fires only when inbound arrives at a different terminal than
  // the outbound departs from (same-terminal → result is null).
  const transit = useTransitFeasibility(
    airportCode,
    dash.inboundFlight?.arrivalTerminal   ?? null,
    dash.outboundFlight?.departureTerminal ?? null,
    dash.connectionTimeMinutes > 0 ? dash.connectionTimeMinutes : null,
    'dom_to_dom',   // conservative default — no immigration overhead
    crowd.delays,
  );

  const riskColor   = dash.riskLevel ? RISK_COLORS[dash.riskLevel].text : '#60a5fa';

  // Find crowd warning relevant to the CURRENT step
  const stepCrowdWarning = nav.currentStep
    ? getSignalForStep(nav.currentStep, crowd.delays)
    : null;
  const progressPct = Math.round(nav.progress * 100);

  // Subtle advance-button pulse while on last step
  const btnScale = useRef(new Animated.Value(1)).current;
  const pulseDone = () => {
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.96, duration: 100, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1,    duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const handleAdvance = () => {
    pulseDone();
    if (nav.isLastStep) {
      Alert.alert(
        t('navigate.routeComplete'),
        t('navigate.routeCompleteMsg', { gate: dash.outboundFlight?.departureGateCode ?? '—' }),
        [{ text: t('common.done'), onPress: () => router.back() }],
      );
      return;
    }
    nav.advance();
  };

  const handleReport = () => {
    const issueOptions = [
      t('navigate.pathBlocked'),
      t('navigate.securityLong'),
      t('navigate.elevatorOut'),
      t('navigate.wrongGate'),
      t('navigate.other'),
    ];
    Alert.alert(
      t('navigate.issueTitle'),
      t('navigate.issueQuestion'),
      [
        ...issueOptions.map((opt) => ({
          text: opt,
          onPress: () => Alert.alert(t('navigate.issueAck'), t('navigate.issueAckMsg')),
        })),
        { text: t('common.cancel'), style: 'cancel' as const },
      ],
    );
  };

  // Countdown chip values
  const chipText  = countdown
    ? countdown.isClosed
      ? t('navigate.gateClosedCountdown')
      : `${countdown.displayMinutes}:${countdown.displaySeconds} left`
    : null;
  const chipColor = countdown?.config.color ?? '#94a3b8';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#94a3b8" />
        </TouchableOpacity>

        <View style={styles.topCenter}>
          <Text style={styles.topTitle}>
            {dash.inboundFlight?.arrivalGateCode ?? '—'}
            {' → '}
            {dash.outboundFlight?.departureGateCode ?? '—'}
          </Text>
          {chipText && (
            <View style={[styles.countdownChip, { borderColor: chipColor }]}>
              <Ionicons name="timer-outline" size={11} color={chipColor} />
              <Text style={[styles.countdownChipText, { color: chipColor }]}>{chipText}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.backBtn} onPress={nav.restart}>
          <Ionicons name="refresh-outline" size={19} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* ── Progress bar ── */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPct}%` as any, backgroundColor: riskColor }]} />
      </View>
      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>{t('navigate.stepOf', { current: nav.currentIndex + 1, total: nav.totalSteps })}</Text>
        <Text style={[styles.progressPct, { color: riskColor }]}>{progressPct}%</Text>
      </View>

      {/* ── Loading / error fallback ── */}
      {dash.status === 'loading' && (
        <View style={styles.center}>
          <Text style={styles.centerText}>{t('navigate.loadingRoute')}</Text>
        </View>
      )}

      {dash.status === 'error' && (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color="#f87171" />
          <Text style={styles.centerText}>{dash.error}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.retryBtn}>
            <Text style={styles.retryText}>{t('navigate.backToSearch')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Main content ── */}
      {dash.status === 'ready' && nav.currentStep && (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Inter-terminal transit card ── */}
            {transit.needsTransit && transit.result && (
              <TransitFeasibilityCard result={transit.result} />
            )}

            {/* ── Crowd warning for current step ── */}
            {stepCrowdWarning && (
              <View style={[
                styles.crowdWarn,
                { borderLeftColor: severityColor(stepCrowdWarning.avgSeverity) },
              ]}>
                <Text style={styles.crowdWarnEmoji}>
                  {CROWD_TYPE_DISPLAY[stepCrowdWarning.dominantType].emoji}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.crowdWarnTitle, { color: severityColor(stepCrowdWarning.avgSeverity) }]}>
                    {t('navigate.crowdAhead', { type: CROWD_TYPE_DISPLAY[stepCrowdWarning.dominantType].shortLabel })}
                  </Text>
                  <Text style={styles.crowdWarnDesc}>
                    {stepCrowdWarning.locationLabel} · +{stepCrowdWarning.delayMinutes} min ·{' '}
                    {t('common.reportsCount', { count: stepCrowdWarning.reportCount })}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.crowdWarnReport}
                  onPress={() => setReportSheetOpen(true)}
                >
                  <Text style={styles.crowdWarnReportText}>{t('navigate.updateReport')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Current step hero */}
            <RouteStepCard
              step={nav.currentStep}
              stepNumber={nav.currentIndex + 1}
              totalSteps={nav.totalSteps}
              isCurrent
            />

            {/* Next step peek */}
            {nav.nextStep && (
              <>
                <Text style={styles.sectionLabel}>{t('navigate.stepOf', { current: nav.currentIndex + 2, total: nav.totalSteps })}</Text>
                <RouteStepCard
                  step={nav.nextStep}
                  stepNumber={nav.currentIndex + 2}
                  totalSteps={nav.totalSteps}
                />
              </>
            )}

            {/* Completed steps */}
            {nav.completedCount > 0 && (
              <>
                <Text style={styles.sectionLabel}>{t('common.done')}</Text>
                {steps
                  .slice(0, nav.currentIndex)
                  .map((step, i) => (
                    <RouteStepCard
                      key={step.id}
                      step={step}
                      stepNumber={i + 1}
                      totalSteps={nav.totalSteps}
                      isCompleted
                      onPress={() => nav.jumpTo(i)}
                    />
                  ))
                }
              </>
            )}
          </ScrollView>

          {/* ── Report sheet ── */}
          <ReportSheet
            visible={reportSheetOpen}
            airportCode={airportCode}
            initialLocation={nav.currentStep?.landmark ?? ''}
            onSubmit={async (input: CreateCrowdReportInput) => { await crowd.submit(input); }}
            onClose={() => setReportSheetOpen(false)}
          />

          {/* ── Bottom action bar ── */}
          <View style={styles.actionBar}>
            {/* Back step */}
            <TouchableOpacity
              style={[styles.secondaryBtn, nav.isFirstStep && styles.btnDisabled]}
              onPress={nav.goBack}
              disabled={nav.isFirstStep}
            >
              <Ionicons name="chevron-back" size={20} color={nav.isFirstStep ? '#334155' : '#94a3b8'} />
              <Text style={[styles.secondaryBtnText, nav.isFirstStep && styles.btnDisabledText]}>{t('common.back')}</Text>
            </TouchableOpacity>

            {/* Mark done / finish */}
            <Animated.View style={[styles.primaryBtnWrap, { transform: [{ scale: btnScale }] }]}>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: riskColor }]}
                onPress={handleAdvance}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={nav.isLastStep ? 'flag-outline' : 'checkmark-circle-outline'}
                  size={20}
                  color="#fff"
                />
                <Text style={styles.primaryBtnText}>
                  {nav.isLastStep ? t('navigate.finishAtGate') : t('navigate.markDone')}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Report issue */}
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleReport}>
              <Ionicons name="flag-outline" size={18} color="#64748b" />
              <Text style={styles.secondaryBtnText}>{t('common.report')}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ── Complete state (index overflows) ── */}
      {dash.status === 'ready' && nav.isComplete && (
        <View style={styles.center}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={styles.doneTitle}>{t('navigate.arrivedTitle')}</Text>
          <Text style={styles.doneSub}>
            {t('navigate.arrivedSub', { gate: dash.outboundFlight?.departureGateCode ?? '—' })}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryText}>{t('navigate.noMoreSteps')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#0f172a' },
  scroll:  { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 24 },

  topBar:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  backBtn:   { width: 38, height: 38, borderRadius: 12, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  topCenter: { flex: 1, alignItems: 'center', gap: 4 },
  topTitle:  { fontSize: 16, fontWeight: '700', color: '#f8fafc' },
  countdownChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
  },
  countdownChipText: { fontSize: 11, fontWeight: '700' },

  progressTrack: { height: 3, backgroundColor: '#1e293b', marginHorizontal: 16, borderRadius: 2 },
  progressFill:  { height: 3, borderRadius: 2 },
  progressRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 4, marginBottom: 8 },
  progressLabel: { fontSize: 11, color: '#475569', fontWeight: '600' },
  progressPct:   { fontSize: 11, fontWeight: '700' },

  sectionLabel: { fontSize: 11, color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },

  actionBar:      { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingBottom: 24, backgroundColor: '#0f172a', borderTopWidth: 1, borderTopColor: '#1e293b' },
  primaryBtnWrap: { flex: 1 },
  primaryBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14 },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  secondaryBtn:   { alignItems: 'center', gap: 3, paddingVertical: 8, paddingHorizontal: 4 },
  secondaryBtnText:{ fontSize: 11, color: '#64748b', fontWeight: '600' },
  btnDisabled:    { opacity: 0.3 },
  btnDisabledText:{ color: '#334155' },

  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  centerText:{ fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22 },
  retryBtn:  { backgroundColor: '#1e293b', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },

  doneEmoji: { fontSize: 64 },
  doneTitle: { fontSize: 28, fontWeight: '800', color: '#f8fafc' },
  doneSub:   { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22 },

  // Crowd step warning
  crowdWarn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#1c1208', borderRadius: 12, padding: 12,
    borderLeftWidth: 4,
  },
  crowdWarnEmoji:       { fontSize: 22 },
  crowdWarnTitle:       { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  crowdWarnDesc:        { fontSize: 11, color: '#64748b' },
  crowdWarnReport:      { backgroundColor: '#334155', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  crowdWarnReportText:  { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
});
