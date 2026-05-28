import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useParkingStore } from '../../../src/stores/parkingStore';
import type { ParkingLot } from '../../../src/types/airport';

const MOCK_LOTS: ParkingLot[] = [
  {
    id: '1', name: 'Economy Lot A', code: 'ECO-A', type: 'economy',
    distanceToTerminalMeters: 800, walkingTimeMinutes: 12,
    ratePerDay: 18, ratePerHour: 4,
    totalSpaces: 2000, availableSpaces: 340,
    coordinates: { lat: 40.641, lng: -73.779 },
    features: ['24h_shuttle', 'security_cameras'],
  },
  {
    id: '2', name: 'Express Covered', code: 'EXP-C', type: 'covered',
    distanceToTerminalMeters: 150, walkingTimeMinutes: 2,
    ratePerDay: 48, ratePerHour: 12,
    totalSpaces: 500, availableSpaces: 42,
    coordinates: { lat: 40.642, lng: -73.778 },
    features: ['covered', 'ev_charging', 'security_cameras'],
  },
  {
    id: '3', name: 'Standard Lot B', code: 'STD-B', type: 'standard',
    distanceToTerminalMeters: 450, walkingTimeMinutes: 6,
    ratePerDay: 28, ratePerHour: 7,
    totalSpaces: 1200, availableSpaces: 0,
    coordinates: { lat: 40.640, lng: -73.780 },
    features: ['security_cameras', 'disabled_spaces'],
  },
];

const TYPE_LABELS: Record<string, string> = {
  economy: 'Economy', standard: 'Standard',
  express: 'Express', valet: 'Valet', covered: 'Covered',
};

const FEATURE_ICONS: Record<string, string> = {
  ev_charging: '⚡', covered: '🏛', '24h_shuttle': '🚌',
  disabled_spaces: '♿', security_cameras: '📹', car_wash: '🚿',
};

export default function ParkingScreen() {
  const { selectedLotId, selectLot } = useParkingStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Parking Finder</Text>
        <Text style={styles.subtitle}>Real-time availability · Price comparison</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {MOCK_LOTS.map((lot) => (
          <ParkingCard
            key={lot.id}
            lot={lot}
            isSelected={selectedLotId === lot.id}
            onPress={() => selectLot(selectedLotId === lot.id ? null : lot.id)}
          />
        ))}

        <View style={styles.tip}>
          <Ionicons name="information-circle-outline" size={16} color="#60a5fa" />
          <Text style={styles.tipText}>
            Availability updates every 5 minutes via real-time data feeds.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ParkingCard({
  lot, isSelected, onPress,
}: {
  lot: ParkingLot;
  isSelected: boolean;
  onPress: () => void;
}) {
  const full        = (lot.availableSpaces ?? 0) === 0;
  const pct         = lot.availableSpaces != null
    ? Math.round((lot.availableSpaces / lot.totalSpaces) * 100)
    : null;
  const statusColor = full ? '#f87171' : pct != null && pct < 20 ? '#fb923c' : '#4ade80';

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Top row */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.lotName}>{lot.name}</Text>
          <View style={styles.typeRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{TYPE_LABELS[lot.type]}</Text>
            </View>
            <Text style={styles.distance}>
              {lot.walkingTimeMinutes} min walk · {lot.distanceToTerminalMeters}m
            </Text>
          </View>
        </View>
        <View style={styles.priceBox}>
          <Text style={styles.priceDay}>${lot.ratePerDay}/day</Text>
          <Text style={styles.priceHour}>${lot.ratePerHour}/hr</Text>
        </View>
      </View>

      {/* Availability bar */}
      <View style={styles.availRow}>
        <Text style={[styles.availText, { color: statusColor }]}>
          {full ? 'FULL' : lot.availableSpaces != null ? `${lot.availableSpaces} spaces` : 'Checking...'}
        </Text>
        {pct != null && !full && (
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: statusColor }]} />
          </View>
        )}
      </View>

      {/* Features */}
      <View style={styles.features}>
        {lot.features.map((f) => (
          <View key={f} style={styles.featureChip}>
            <Text style={styles.featureIcon}>{FEATURE_ICONS[f] ?? '•'}</Text>
            <Text style={styles.featureLabel}>{f.replace('_', ' ')}</Text>
          </View>
        ))}
      </View>

      {isSelected && (
        <TouchableOpacity style={styles.reserveBtn} activeOpacity={0.8}>
          <Text style={styles.reserveText}>Reserve Spot</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0f172a' },
  header:       { padding: 20, paddingBottom: 12 },
  title:        { fontSize: 26, fontWeight: '800', color: '#f8fafc' },
  subtitle:     { fontSize: 13, color: '#64748b', marginTop: 2 },
  scroll:       { padding: 16, paddingTop: 8, paddingBottom: 40 },
  card:         {
    backgroundColor: '#1e293b', borderRadius: 20, padding: 18,
    marginBottom: 14, borderWidth: 1, borderColor: '#334155',
  },
  cardSelected: { borderColor: '#3b82f6', borderWidth: 2 },
  cardHeader:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  lotName:      { color: '#f8fafc', fontWeight: '700', fontSize: 16, marginBottom: 6 },
  typeRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeBadge:    { backgroundColor: '#1e3a5f', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeText:     { color: '#60a5fa', fontSize: 11, fontWeight: '700' },
  distance:     { color: '#475569', fontSize: 12 },
  priceBox:     { alignItems: 'flex-end' },
  priceDay:     { color: '#f8fafc', fontWeight: '800', fontSize: 16 },
  priceHour:    { color: '#64748b', fontSize: 12, marginTop: 2 },
  availRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  availText:    { fontSize: 13, fontWeight: '700', width: 90 },
  barBg:        { flex: 1, height: 6, backgroundColor: '#334155', borderRadius: 3, overflow: 'hidden' },
  barFill:      { height: '100%', borderRadius: 3 },
  features:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  featureChip:  {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#0f172a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  featureIcon:  { fontSize: 12 },
  featureLabel: { color: '#64748b', fontSize: 11, textTransform: 'capitalize' },
  reserveBtn:   {
    marginTop: 14, backgroundColor: '#3b82f6',
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  reserveText:  { color: '#fff', fontWeight: '700', fontSize: 15 },
  tip:          {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginTop: 4,
  },
  tipText:      { color: '#475569', fontSize: 12, flex: 1 },
});
