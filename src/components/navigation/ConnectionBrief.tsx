import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Flight } from '../../types/models/flight';
import type { ConnectionRisk } from '../../types/database';
import { RISK_COLORS, STATUS_LABELS } from '../../types/models/flight';

interface Props {
  inboundFlight:         Flight;
  outboundFlight:        Flight;
  connectionTimeMinutes: number;
  walkingTimeMinutes:    number;
  bufferMinutes:         number;
  riskLevel:             ConnectionRisk;
}

const RISK_LABELS: Record<ConnectionRisk, string> = {
  safe:       'Safe Connection',
  tight:      'Tight Connection',
  at_risk:    'At Risk',
  impossible: 'Too Tight',
};

const RISK_BG: Record<ConnectionRisk, string> = {
  safe:       '#14532d',
  tight:      '#713f12',
  at_risk:    '#7f1d1d',
  impossible: '#450a0a',
};

function pad2(n: number) { return String(n).padStart(2, '0'); }

function formatTime(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function formatMin(min: number) {
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

export function ConnectionBrief({
  inboundFlight,
  outboundFlight,
  connectionTimeMinutes,
  walkingTimeMinutes,
  bufferMinutes,
  riskLevel,
}: Props) {
  const color   = RISK_COLORS[riskLevel].text;
  const label   = RISK_LABELS[riskLevel];
  const bgColor = RISK_BG[riskLevel];

  const arrivalTime   = inboundFlight.estimatedArrival   ?? inboundFlight.scheduledArrival;
  const departureTime = outboundFlight.estimatedDeparture ?? outboundFlight.scheduledDeparture;

  return (
    <View style={styles.card}>
      {/* Risk banner */}
      <View style={[styles.banner, { backgroundColor: bgColor }]}>
        <Ionicons
          name={riskLevel === 'safe' ? 'checkmark-circle' : riskLevel === 'impossible' ? 'close-circle' : 'warning'}
          size={14}
          color={color}
        />
        <Text style={[styles.bannerText, { color }]}>{label}</Text>
      </View>

      {/* Flight row */}
      <View style={styles.flightRow}>
        {/* Inbound */}
        <View style={styles.flightBlock}>
          <View style={styles.flightNumRow}>
            <View style={[styles.dot, { backgroundColor: '#60a5fa' }]} />
            <Text style={styles.flightNum}>{inboundFlight.flightNumber}</Text>
          </View>
          <Text style={styles.airport}>{inboundFlight.origin.iataCode}</Text>
          <Text style={styles.time}>{formatTime(arrivalTime)}</Text>
          <Text style={styles.sublabel}>Arrives</Text>
          {inboundFlight.arrivalGateCode ? (
            <View style={styles.gatePill}>
              <Text style={styles.gateText}>Gate {inboundFlight.arrivalGateCode}</Text>
            </View>
          ) : null}
          <Text style={styles.terminal}>{inboundFlight.arrivalTerminal ?? '—'}</Text>
        </View>

        {/* Middle: arrow + connection stats */}
        <View style={styles.middleCol}>
          <View style={[styles.connLine, { borderColor: color }]}>
            <View style={[styles.connLineFill, { backgroundColor: color, opacity: 0.3 }]} />
          </View>
          <Ionicons name="arrow-forward" size={20} color={color} />
          <View style={[styles.connLine, { borderColor: color }]}>
            <View style={[styles.connLineFill, { backgroundColor: color, opacity: 0.3 }]} />
          </View>
          <View style={styles.statsCol}>
            <StatChip icon="time-outline"  value={formatMin(connectionTimeMinutes)} label="Total"   color="#94a3b8" />
            <StatChip icon="walk-outline"  value={formatMin(walkingTimeMinutes)}    label="Walk"    color="#60a5fa" />
            <StatChip icon="shield-outline" value={formatMin(Math.max(0, bufferMinutes))} label="Buffer"  color={color} />
          </View>
        </View>

        {/* Outbound */}
        <View style={[styles.flightBlock, styles.flightBlockRight]}>
          <View style={styles.flightNumRow}>
            <View style={[styles.dot, { backgroundColor: '#4ade80' }]} />
            <Text style={styles.flightNum}>{outboundFlight.flightNumber}</Text>
          </View>
          <Text style={styles.airport}>{outboundFlight.destination.iataCode}</Text>
          <Text style={styles.time}>{formatTime(departureTime)}</Text>
          <Text style={styles.sublabel}>Departs</Text>
          {outboundFlight.departureGateCode ? (
            <View style={[styles.gatePill, { backgroundColor: '#14532d' }]}>
              <Text style={[styles.gateText, { color: '#4ade80' }]}>Gate {outboundFlight.departureGateCode}</Text>
            </View>
          ) : null}
          <Text style={styles.terminal}>{outboundFlight.departureTerminal ?? '—'}</Text>
        </View>
      </View>

      {/* Status row */}
      {(inboundFlight.status !== 'scheduled' || outboundFlight.status !== 'scheduled') && (
        <View style={styles.statusRow}>
          {inboundFlight.status !== 'scheduled' && (
            <View style={styles.statusChip}>
              <Text style={styles.statusChipText}>
                {inboundFlight.flightNumber}: {STATUS_LABELS[inboundFlight.status]}
              </Text>
            </View>
          )}
          {outboundFlight.status !== 'scheduled' && (
            <View style={styles.statusChip}>
              <Text style={styles.statusChipText}>
                {outboundFlight.flightNumber}: {STATUS_LABELS[outboundFlight.status]}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function StatChip({ icon, value, label, color }: { icon: any; value: string; label: string; color: string }) {
  return (
    <View style={chipStyles.row}>
      <Ionicons name={icon} size={11} color={color} />
      <Text style={[chipStyles.value, { color }]}>{value}</Text>
      <Text style={chipStyles.label}>{label}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 3, marginVertical: 2 },
  value: { fontSize: 11, fontWeight: '700' },
  label: { fontSize: 10, color: '#64748b', fontWeight: '500' },
});

const styles = StyleSheet.create({
  card:    { backgroundColor: '#1e293b', borderRadius: 20, overflow: 'hidden' },
  banner:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8 },
  bannerText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  flightRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, gap: 8 },
  flightBlock:     { flex: 1, gap: 3 },
  flightBlockRight:{ alignItems: 'flex-end' },

  flightNumRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot:           { width: 6, height: 6, borderRadius: 3 },
  flightNum:     { fontSize: 13, fontWeight: '700', color: '#f8fafc' },
  airport:       { fontSize: 22, fontWeight: '800', color: '#f8fafc', letterSpacing: -0.5 },
  time:          { fontSize: 16, fontWeight: '700', color: '#94a3b8' },
  sublabel:      { fontSize: 10, color: '#475569', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  terminal:      { fontSize: 11, color: '#475569', fontWeight: '500', marginTop: 2 },
  gatePill:      { backgroundColor: '#1e3a5f', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 4 },
  gateText:      { fontSize: 11, fontWeight: '700', color: '#60a5fa' },

  middleCol:     { alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  connLine:      { width: 20, height: 0, borderTopWidth: 1, borderStyle: 'dashed' },
  connLineFill:  { height: 1 },
  statsCol:      { alignItems: 'center', marginTop: 4 },

  statusRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, paddingBottom: 12 },
  statusChip:    { backgroundColor: '#0f172a', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusChipText:{ fontSize: 11, color: '#94a3b8', fontWeight: '500' },
});
