import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useConnectionDashboard } from '../../../src/hooks/useConnectionDashboard';
import { useGateCountdown }       from '../../../src/hooks/useGateCountdown';
import { useCrowdReports }        from '../../../src/hooks/useCrowdReports';
import { useTerminalTransit }     from '../../../src/hooks/useTerminalTransit';
import { useVoiceAssistant }      from '../../../src/hooks/useVoiceAssistant';
import { GateCountdownTimer }     from '../../../src/components/navigation/GateCountdownTimer';
import { ConnectionBrief }        from '../../../src/components/navigation/ConnectionBrief';
import { CrowdSignalBanner }      from '../../../src/components/crowdsource/CrowdSignalBanner';
import { ReportSheet }            from '../../../src/components/crowdsource/ReportSheet';
import { TransitAgentAdvice }     from '../../../src/components/transit';
import { VoiceAssistantButton }   from '../../../src/components/voice';
import { RISK_COLORS }            from '../../../src/types/models/flight';
import { getTotalCrowdDelayMinutes, getCongestionMultiplier } from '../../../src/services/navigation/crowdDelayEngine';
import type { CreateCrowdReportInput } from '../../../src/types/models/crowdReport';
import type { VoiceCommand }          from '../../../src/types/models/voice';

function formatMin(min: number) {
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { inbound = '', outbound = '', date = '' } =
    useLocalSearchParams<{ inbound: string; outbound: string; date: string }>();

  const [reportSheetOpen,      setReportSheetOpen]      = useState(false);
  const [reportPreset,         setReportPreset]          = useState<
    CreateCrowdReportInput['type'] | undefined
  >(undefined);

  // ── Voice command handler ─────────────────────────────────
  // Maps intent → app action (navigation, modals, etc.)
  const handleVoiceCommand = useCallback((cmd: VoiceCommand) => {
    switch (cmd.intent) {
      case 'NAVIGATE_TO_GATE':
      case 'FIND_GATE':
        // Navigate to route screen; the gate entity is available via cmd.entities.gate
        // For now we navigate to the route screen so the user can see the map.
        router.push({
          pathname: '/(tabs)/navigate/route',
          params: { inbound, outbound, date },
        });
        break;

      case 'REPORT_SECURITY':
        setReportPreset('security_slow');
        setReportSheetOpen(true);
        break;
      case 'REPORT_CROWD':
        setReportPreset('crowded');
        setReportSheetOpen(true);
        break;
      case 'REPORT_ELEVATOR':
        setReportPreset('elevator_broken');
        setReportSheetOpen(true);
        break;
      case 'REPORT_CLEAR':
        setReportPreset('clear_path');
        setReportSheetOpen(true);
        break;

      case 'FIND_RESTROOM':
      case 'FIND_FOOD':
      case 'FIND_LOUNGE':
        // Navigate to the Maps tab — future versions will highlight POIs
        router.push('/(tabs)/maps');
        break;

      case 'CANCEL':
        voice.reset();
        break;

      default:
        break; // UNKNOWN — TTS already said "didn't understand"
    }
  }, [inbound, outbound, date, router]);

  // Locale code → BCP-47 recogniser locale
  const recogniserLocale =
    i18n.language === 'he' ? 'he-IL' :
    i18n.language === 'es' ? 'es-ES' : 'en-US';

  const voice = useVoiceAssistant({
    locale:     recogniserLocale,
    ttsEnabled: true,
    onCommand:  handleVoiceCommand,
  });

  const dash      = useConnectionDashboard(inbound, outbound, date);
  const countdown = useGateCountdown(dash.gateCloseTime ?? null);

  // Airport code from either flight (prefer outbound for departure airport)
  const airportCode = dash.outboundFlight?.origin.iataCode
    ?? dash.inboundFlight?.destination.iataCode
    ?? 'JFK';

  const crowd = useCrowdReports(airportCode);

  // ── Terminal Transit Agent ────────────────────────────────
  // Fires whenever the two flights are at different terminals.
  // Passenger status defaults to int'l→int'l for JFK demo; production
  // would derive this from the flights' origin/destination countries.
  const arrivalTerminal   = dash.inboundFlight?.arrivalTerminal   ?? undefined;
  const departureTerminal = dash.outboundFlight?.departureTerminal ?? undefined;
  const transit = useTerminalTransit(
    airportCode,
    arrivalTerminal,
    departureTerminal,
    'international_to_international',
    { connectionWindowMinutes: dash.connectionTimeMinutes ?? undefined },
  );

  // ── Derived ──────────────────────────────────────────────
  const riskColor        = dash.riskLevel ? RISK_COLORS[dash.riskLevel].text : '#94a3b8';
  const totalCrowdDelay  = getTotalCrowdDelayMinutes(crowd.delays);
  const crowdCongestion  = getCongestionMultiplier(crowd.signals);

  // Adjusted buffer subtracts crowd delay from the original buffer
  const adjustedBuffer   = Math.round(dash.bufferMinutes - totalCrowdDelay);
  const hasCrowdImpact   = totalCrowdDelay > 0;

  // ── Render ────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Connection Dashboard</Text>
        {dash.status === 'ready' && (
          <TouchableOpacity style={styles.refreshBtn} onPress={dash.refresh}>
            <Ionicons name="refresh-outline" size={20} color="#64748b" />
          </TouchableOpacity>
        )}
        {dash.status !== 'ready' && <View style={styles.refreshBtn} />}
      </View>

      {/* ── Loading ── */}
      {dash.status === 'loading' && (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Fetching flight data…</Text>
        </View>
      )}

      {/* ── Error ── */}
      {dash.status === 'error' && (
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={52} color="#f87171" />
          <Text style={styles.errorTitle}>Couldn't load flights</Text>
          <Text style={styles.errorDesc}>{dash.error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={dash.refresh}>
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>← Back to search</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Ready ── */}
      {dash.status === 'ready' &&
        dash.inboundFlight &&
        dash.outboundFlight &&
        dash.riskLevel && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Gate countdown ring */}
            <View style={styles.section}>
              {countdown ? (
                <GateCountdownTimer countdown={countdown} />
              ) : (
                <View style={styles.noCountdown}>
                  <Ionicons name="timer-outline" size={28} color="#475569" />
                  <Text style={styles.noCountdownText}>Gate close time unavailable</Text>
                </View>
              )}
            </View>

            {/* ── Crowd signal banner ── */}
            <CrowdSignalBanner
              delays={crowd.delays}
              totalDelayMinutes={totalCrowdDelay}
              isLoading={crowd.isLoading}
              onReportPress={() => setReportSheetOpen(true)}
            />

            {/* Crowd-adjusted buffer callout */}
            {hasCrowdImpact && dash.status === 'ready' && (
              <View style={[
                styles.crowdImpactCard,
                adjustedBuffer < 5 && styles.crowdImpactCardDanger,
              ]}>
                <Ionicons name="people" size={16} color="#fb923c" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.crowdImpactTitle}>
                    Crowd conditions eating into your buffer
                  </Text>
                  <Text style={styles.crowdImpactDetail}>
                    +{Math.round(totalCrowdDelay)} min crowd delay →{' '}
                    <Text style={{ fontWeight: '800', color: adjustedBuffer < 5 ? '#f87171' : '#fbbf24' }}>
                      {adjustedBuffer} min
                    </Text>{' '}
                    adjusted buffer
                    {crowdCongestion > 1.2
                      ? ` · ×${crowdCongestion.toFixed(1)} congestion`
                      : ''}
                  </Text>
                </View>
              </View>
            )}

            {/* Connection brief card */}
            <ConnectionBrief
              inboundFlight={dash.inboundFlight}
              outboundFlight={dash.outboundFlight}
              connectionTimeMinutes={dash.connectionTimeMinutes}
              walkingTimeMinutes={dash.walkingTimeMinutes}
              bufferMinutes={dash.bufferMinutes}
              riskLevel={dash.riskLevel}
            />

            {/* ── Terminal Transit Agent widget ── */}
            {transit.result && transit.needsTransit && (
              <TransitAgentAdvice
                result={transit.result}
                connectionWindowMinutes={dash.connectionTimeMinutes ?? undefined}
                defaultCollapsed={!transit.result.blockers.some((b) => b.level === 'critical')}
              />
            )}

            {/* Route summary */}
            {dash.route && (
              <View style={styles.routeSummaryCard}>
                <Text style={styles.sectionLabel}>Route Overview</Text>
                <View style={styles.routeMeta}>
                  <MetaStat
                    icon="walk-outline"
                    value={formatMin(dash.route.totalTimeMinutes)}
                    label="Walking time"
                    color="#60a5fa"
                  />
                  <MetaStat
                    icon="map-outline"
                    value={`${dash.route.totalDistanceMeters}m`}
                    label="Distance"
                    color="#94a3b8"
                  />
                  <MetaStat
                    icon="layers-outline"
                    value={`${dash.route.steps.length}`}
                    label="Steps"
                    color="#a78bfa"
                  />
                  {dash.route.requiresElevator && (
                    <MetaStat
                      icon="arrow-up-circle-outline"
                      value="Yes"
                      label="Elevator"
                      color="#fbbf24"
                    />
                  )}
                </View>

                {/* Step preview list */}
                <View style={styles.stepsPreview}>
                  {dash.route.steps.slice(0, 3).map((step, i) => (
                    <View key={step.id} style={styles.previewRow}>
                      <View style={[styles.previewDot, { backgroundColor: riskColor }]} />
                      <Text style={styles.previewText} numberOfLines={1}>
                        {step.instruction}
                      </Text>
                      {step.adjustedSeconds ? (
                        <Text style={styles.previewTime}>
                          {Math.ceil(step.adjustedSeconds / 60)}m
                        </Text>
                      ) : null}
                    </View>
                  ))}
                  {dash.route.steps.length > 3 && (
                    <Text style={styles.previewMore}>
                      +{dash.route.steps.length - 3} more steps
                    </Text>
                  )}
                </View>

                {/* Start navigation CTA */}
                <TouchableOpacity
                  style={[styles.startBtn, { backgroundColor: riskColor + 'dd' }]}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/navigate/route',
                      params: { inbound, outbound, date },
                    })
                  }
                  activeOpacity={0.85}
                >
                  <Ionicons name="navigate" size={20} color="#fff" />
                  <Text style={styles.startBtnText}>Start Navigation</Text>
                  <Ionicons name="chevron-forward" size={18} color="#ffffffaa" />
                </TouchableOpacity>
              </View>
            )}

            {/* ── Report sheet (opens from FAB crowd buttons or voice command) ── */}
            <ReportSheet
              visible={reportSheetOpen}
              airportCode={airportCode}
              initialType={reportPreset}
              onSubmit={async (input: CreateCrowdReportInput) => { await crowd.submit(input); }}
              onClose={() => { setReportSheetOpen(false); setReportPreset(undefined); }}
            />

            {/* Risk tip */}
            {dash.riskLevel === 'at_risk' || dash.riskLevel === 'impossible' ? (
              <View style={styles.urgentTip}>
                <Ionicons name="warning" size={16} color="#f87171" />
                <Text style={styles.urgentText}>
                  {dash.riskLevel === 'impossible'
                    ? 'This connection may be impossible. Contact your airline immediately.'
                    : 'Head to your gate as soon as you land. Do not stop at baggage.'}
                </Text>
              </View>
            ) : null}

            {/* Tight tip */}
            {dash.riskLevel === 'tight' && (
              <View style={[styles.urgentTip, styles.tightTip]}>
                <Ionicons name="time-outline" size={16} color="#fb923c" />
                <Text style={[styles.urgentText, { color: '#fb923c' }]}>
                  Tight connection — move swiftly and skip duty-free browsing.
                </Text>
              </View>
            )}
          </ScrollView>
        )}

      {/* ── Voice Assistant FAB ── */}
      {/* Shown at all times so users can speak even during loading */}
      <VoiceAssistantButton
        voiceState={voice.voiceState}
        partialText={voice.partialText}
        lastCommand={voice.lastCommand}
        errorMessage={voice.errorMessage}
        onToggle={voice.toggle}
        onDismiss={voice.reset}
        bottomOffset={8}
      />
    </SafeAreaView>
  );
}

function MetaStat({ icon, value, label, color }: {
  icon: any; value: string; label: string; color: string;
}) {
  return (
    <View style={metaStyles.col}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[metaStyles.value, { color }]}>{value}</Text>
      <Text style={metaStyles.label}>{label}</Text>
    </View>
  );
}

const metaStyles = StyleSheet.create({
  col:   { alignItems: 'center', flex: 1, gap: 3 },
  value: { fontSize: 15, fontWeight: '800' },
  label: { fontSize: 10, color: '#475569', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
});

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#0f172a' },
  scroll:  { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 48 },

  topBar:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  backBtn:    { width: 38, height: 38, borderRadius: 12, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  topTitle:   { flex: 1, fontSize: 16, fontWeight: '700', color: '#f8fafc', textAlign: 'center' },
  refreshBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },

  centerState:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  loadingText:  { fontSize: 15, color: '#64748b', fontWeight: '500' },
  errorTitle:   { fontSize: 20, fontWeight: '800', color: '#f8fafc' },
  errorDesc:    { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },
  retryBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#3b82f6', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  retryText:    { color: '#fff', fontSize: 15, fontWeight: '700' },
  backLink:     { marginTop: 4 },
  backLinkText: { color: '#64748b', fontSize: 13, fontWeight: '600' },

  section:     { alignItems: 'center' },
  noCountdown: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  noCountdownText: { fontSize: 13, color: '#475569', fontWeight: '500' },

  routeSummaryCard: { backgroundColor: '#1e293b', borderRadius: 20, padding: 18, gap: 16 },
  sectionLabel:     { fontSize: 12, fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 },
  routeMeta:        { flexDirection: 'row', alignItems: 'center' },

  stepsPreview: { gap: 8 },
  previewRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  previewDot:   { width: 6, height: 6, borderRadius: 3 },
  previewText:  { flex: 1, fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  previewTime:  { fontSize: 12, color: '#475569', fontWeight: '600' },
  previewMore:  { fontSize: 12, color: '#475569', fontStyle: 'italic', marginTop: 2, marginLeft: 16 },

  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 14, paddingVertical: 16,
    marginTop: 4,
  },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: '800', flex: 1, textAlign: 'center' },

  urgentTip: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#1c0f0f', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#7f1d1d',
  },
  tightTip:    { backgroundColor: '#1c1208', borderColor: '#7c2d12' },
  urgentText:  { flex: 1, fontSize: 13, color: '#f87171', lineHeight: 19, fontWeight: '500' },

  crowdImpactCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#1c1208', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#7c2d12',
  },
  crowdImpactCardDanger: { backgroundColor: '#1c0f0f', borderColor: '#7f1d1d' },
  crowdImpactTitle:  { fontSize: 13, fontWeight: '700', color: '#fb923c', marginBottom: 3 },
  crowdImpactDetail: { fontSize: 12, color: '#94a3b8', lineHeight: 18 },
});
