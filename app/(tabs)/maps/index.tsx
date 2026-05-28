import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Animated, Easing, StatusBar, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Shadows } from '../../../src/theme';
import { SUPPORTED_AIRPORTS } from '../../../src/config/airports';
import { useCrowdReports }    from '../../../src/hooks/useCrowdReports';
import { getTotalCrowdDelayMinutes } from '../../../src/services/navigation/crowdDelayEngine';
import {
  ReportSheet,
  CrowdAlertRow,
} from '../../../src/components/crowdsource';
import { AIRPORT_REGISTRY } from '../../../src/data/airportTerminals';
import type { CreateCrowdReportInput } from '../../../src/types/models/crowdReport';
import type { CrowdDelay } from '../../../src/services/navigation/crowdDelayEngine';

type Tab = 'map' | 'terminals' | 'amenities' | 'alerts';

// Mock nearby passengers (random positions, would be realtime via Supabase in prod)
interface Passenger {
  id: string;
  x: number; // 0–1 relative
  y: number;
  terminal: string;
  color: string;
}

const PASSENGER_COLORS = ['#FF6B00', '#1A73E8', '#00C853', '#7C3AED', '#F59E0B', '#EC4899'];

function generatePassengers(airportCode: string, count = 8): Passenger[] {
  const seed = airportCode.charCodeAt(0) + airportCode.charCodeAt(1);
  return Array.from({ length: count }, (_, i) => {
    const base = (seed * (i + 7) * 31337) % 997;
    const terminalKeys = Object.keys(AIRPORT_REGISTRY[airportCode]?.airlineTerminals ?? {});
    return {
      id:       `p${i}`,
      x:        0.1 + ((base * (i + 1)) % 80) / 100,
      y:        0.15 + ((base * (i + 3)) % 65) / 100,
      terminal: terminalKeys[i % Math.max(terminalKeys.length, 1)] ?? 'T1',
      color:    PASSENGER_COLORS[i % PASSENGER_COLORS.length],
    };
  });
}

// Terminal layout for the schematic map (pixel values, map is ~300px wide × 250px tall)
interface TerminalRect {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

const JFK_TERMINAL_RECTS: TerminalRect[] = [
  { label: 'T1', x: 14,  y: 44,  w: 54, h: 66,  color: '#1A73E8' },
  { label: 'T4', x: 84,  y: 33,  w: 66, h: 77,  color: '#FF6B00' },
  { label: 'T5', x: 164, y: 44,  w: 54, h: 62,  color: '#00ACC1' },
  { label: 'T7', x: 14,  y: 132, w: 54, h: 62,  color: '#7C3AED' },
  { label: 'T8', x: 84,  y: 136, w: 66, h: 62,  color: '#00C853' },
];

const AMENITIES = [
  { icon: '🍽️', label: 'Restaurants',    count: 24, color: Colors.primary },
  { icon: '☕',  label: 'Cafes',          count: 12, color: '#795548' },
  { icon: '🛍️', label: 'Shops',          count: 18, color: '#EC4899' },
  { icon: '🛋️', label: 'Lounges',        count: 6,  color: '#7C3AED' },
  { icon: '💊',  label: 'Pharmacy',       count: 3,  color: '#00C853' },
  { icon: '🏧',  label: 'ATMs',           count: 8,  color: Colors.blue },
  { icon: '🚿',  label: 'Shower Rooms',   count: 4,  color: Colors.teal },
  { icon: '📶',  label: 'WiFi Zones',     count: 15, color: '#10B981' },
];

export default function MapsScreen() {
  const [selectedAirport, setSelectedAirport] = useState('JFK');
  const [activeTab,       setActiveTab]       = useState<Tab>('map');
  const [query,           setQuery]           = useState('');
  const [reportOpen,      setReportOpen]      = useState(false);
  const [pinLocation,     setPinLocation]     = useState('');
  const [userLocation,    setUserLocation]    = useState<{ x: number; y: number } | null>(null);
  const [locationGranted, setLocationGranted] = useState(false);

  // Pulsing animation for user location dot
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.6, duration: 900, easing: Easing.ease, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 1,   duration: 900, easing: Easing.ease, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  // Request location — defensive for web where expo-location may behave differently
  useEffect(() => {
    if (Platform.OS === 'web') {
      // On web use the browser Geolocation API
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => {
            setLocationGranted(true);
            setUserLocation({ x: 0.45, y: 0.42 }); // schematic position
          },
          () => { /* denied — show static map */ }
        );
      }
      return;
    }
    // Native: use expo-location dynamically to avoid web import issues
    (async () => {
      try {
        const Location = await import('expo-location');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          setLocationGranted(true);
          setUserLocation({ x: 0.45, y: 0.42 });
        }
      } catch {
        // Location not available
      }
    })();
  }, []);

  const crowd    = useCrowdReports(selectedAirport);
  const airport  = SUPPORTED_AIRPORTS.find((a) => a.code === selectedAirport);
  const filtered = SUPPORTED_AIRPORTS.filter(
    (a) =>
      a.code.toLowerCase().includes(query.toLowerCase()) ||
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.city.toLowerCase().includes(query.toLowerCase())
  );
  const totalDelay  = getTotalCrowdDelayMinutes(crowd.delays);
  const passengers  = generatePassengers(selectedAirport);
  const terminalData = AIRPORT_REGISTRY[selectedAirport];

  const handlePinPress = (delay: CrowdDelay) => {
    setPinLocation(delay.locationLabel);
    setReportOpen(true);
  };

  const tabLabel = (tab: Tab) => {
    if (tab === 'map')       return 'Map';
    if (tab === 'terminals') return 'Terminals';
    if (tab === 'amenities') return 'Amenities';
    return crowd.delays.length > 0 ? `Alerts (${crowd.delays.length})` : 'Alerts';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Airport Map</Text>
          <Text style={styles.subtitle}>{airport?.name ?? selectedAirport}</Text>
        </View>
        <TouchableOpacity style={styles.locationBtn}>
          <Ionicons
            name={locationGranted ? 'locate' : 'locate-outline'}
            size={20}
            color={locationGranted ? Colors.blue : Colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search airport..."
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Dropdown */}
      {query.length > 0 && (
        <View style={styles.dropdown}>
          {filtered.slice(0, 5).map((a) => (
            <TouchableOpacity
              key={a.code}
              style={styles.dropdownItem}
              onPress={() => { setSelectedAirport(a.code); setQuery(''); }}
            >
              <Text style={styles.dropdownCode}>{a.code}</Text>
              <Text style={styles.dropdownName}>{a.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Tab bar */}
      <View style={styles.tabs}>
        {(['map', 'terminals', 'amenities', 'alerts'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tabLabel(tab)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Map tab ── */}
      {activeTab === 'map' && (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Schematic terminal map canvas */}
          <View style={styles.mapCanvas}>
            <View style={styles.mapBg} />
            <View style={styles.airTrainSpine} />

            {/* Terminal rectangles */}
            {JFK_TERMINAL_RECTS.map((t) => (
              <View
                key={t.label}
                style={[styles.termRect, { left: t.x, top: t.y, width: t.w, height: t.h,
                  backgroundColor: t.color + '22', borderColor: t.color }]}
              >
                <Text style={[styles.termRectLabel, { color: t.color }]}>{t.label}</Text>
              </View>
            ))}

            {/* Nearby passenger dots */}
            {passengers.map((p) => (
              <View
                key={p.id}
                style={[styles.passengerDot, { left: p.x * 280, top: p.y * 220, backgroundColor: p.color }]}
              />
            ))}

            {/* Crowd alert pins */}
            {crowd.delays.slice(0, 4).map((d, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.crowdPin, { left: 40 + i * 65, top: 110 }]}
                onPress={() => handlePinPress(d)}
              >
                <Ionicons name="warning" size={12} color="#fff" />
              </TouchableOpacity>
            ))}

            {/* User location dot (pulsing blue) */}
            {userLocation && (
              <View style={[styles.userLocationWrap, { left: userLocation.x * 280, top: userLocation.y * 220 }]}>
                <Animated.View style={[styles.userPulse, { transform: [{ scale: pulse }] }]} />
                <View style={styles.userDot}>
                  <View style={styles.userDotInner} />
                </View>
              </View>
            )}
          </View>

          {/* Legend row */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.blue }]} />
              <Text style={styles.legendText}>You</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.legendText}>Passengers ({passengers.length})</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
              <Text style={styles.legendText}>Crowd alerts</Text>
            </View>
          </View>

          {/* Delay strip */}
          {totalDelay > 0 && (
            <View style={styles.delayStrip}>
              <Ionicons name="warning" size={14} color={Colors.warning} />
              <Text style={styles.delayText}>
                ~{Math.round(totalDelay)} min crowd delay at {selectedAirport}
              </Text>
            </View>
          )}

          {/* Report button */}
          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() => { setPinLocation(''); setReportOpen(true); }}
          >
            <Ionicons name="megaphone-outline" size={16} color={Colors.primary} />
            <Text style={styles.reportBtnLabel}>Report crowd issue</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── Terminals tab ── */}
      {activeTab === 'terminals' && (
        <ScrollView contentContainerStyle={styles.listContent}>
          {(terminalData?.terminals ?? ['1', '4', '5', '7', '8']).map((term) => {
            const tInfo = Object.values(terminalData?.airlineTerminals ?? {})
              .find((t) => t.terminal === term);
            return (
              <View key={term} style={styles.listCard}>
                <View style={[styles.listIconWrap, { backgroundColor: Colors.blueBg }]}>
                  <Ionicons name="business-outline" size={20} color={Colors.blue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>Terminal {term}</Text>
                  <Text style={styles.listSub} numberOfLines={1}>
                    {tInfo?.amenities?.[0] ?? 'Gates and services'}
                  </Text>
                </View>
                <View style={styles.walkBadge}>
                  <Ionicons name="walk-outline" size={12} color={Colors.teal} />
                  <Text style={styles.walkText}>{tInfo?.walkMinutesFromSecurity ?? 8} min</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ── Amenities tab ── */}
      {activeTab === 'amenities' && (
        <ScrollView contentContainerStyle={styles.listContent}>
          <View style={styles.amenityGrid}>
            {AMENITIES.map(({ icon, label, count, color }) => (
              <View key={label} style={styles.amenityCard}>
                <View style={[styles.amenityIconWrap, { backgroundColor: color + '18' }]}>
                  <Text style={styles.amenityEmoji}>{icon}</Text>
                </View>
                <Text style={styles.amenityLabel}>{label}</Text>
                <Text style={[styles.amenityCount, { color }]}>{count} locations</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* ── Alerts tab ── */}
      {activeTab === 'alerts' && (
        <ScrollView contentContainerStyle={styles.listContent}>
          <View style={styles.alertsHeader}>
            <View>
              <Text style={styles.alertsTitle}>Live Crowd Alerts</Text>
              <Text style={styles.alertsSub}>{selectedAirport} · updated now</Text>
            </View>
            <TouchableOpacity
              style={styles.reportBtnInline}
              onPress={() => { setPinLocation(''); setReportOpen(true); }}
            >
              <Ionicons name="megaphone-outline" size={14} color={Colors.primary} />
              <Text style={styles.reportBtnText}>Report</Text>
            </TouchableOpacity>
          </View>

          {crowd.isLoading && (
            <View style={styles.allClearCard}>
              <Text style={{ color: Colors.textMuted, fontSize: 14 }}>Loading alerts…</Text>
            </View>
          )}

          {!crowd.isLoading && crowd.delays.length === 0 && (
            <View style={styles.allClearCard}>
              <Text style={styles.allClearEmoji}>✅</Text>
              <Text style={styles.allClearTitle}>All Clear!</Text>
              <Text style={styles.allClearSub}>No crowd issues reported right now at {selectedAirport}</Text>
            </View>
          )}

          {crowd.delays.map((d, i) => (
            <CrowdAlertRow key={i} delay={d} onPress={handlePinPress} />
          ))}

          {crowd.recentReports.length > 0 && (
            <>
              <Text style={styles.recentTitle}>Recent Reports</Text>
              {crowd.recentReports.slice(0, 8).map((r) => (
                <View key={r.id} style={styles.recentRow}>
                  <View style={[styles.recentDot, { backgroundColor: Colors.danger }]} />
                  <Text style={styles.recentLabel} numberOfLines={1}>{r.locationLabel}</Text>
                  <Text style={styles.recentType}>{r.type.replace(/_/g, ' ')}</Text>
                  <Text style={styles.recentTime}>
                    {Math.round((Date.now() - r.createdAt.getTime()) / 60_000)} min ago
                  </Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}

      {/* Report sheet */}
      <ReportSheet
        visible={reportOpen}
        airportCode={selectedAirport}
        initialLocation={pinLocation}
        onSubmit={async (input: CreateCrowdReportInput) => { await crowd.submit(input); }}
        onClose={() => setReportOpen(false)}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
  },
  title:       { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle:    { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  locationBtn: {
    width: 40, height: 40, borderRadius: Radii.sm,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    ...Shadows.sm,
  },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, marginHorizontal: 20,
    borderRadius: Radii.md, paddingHorizontal: 14, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.cardBorder, ...Shadows.sm,
  },
  searchInput: { flex: 1, paddingVertical: 11, color: Colors.text, fontSize: 15 },

  // Dropdown
  dropdown: {
    backgroundColor: Colors.surface, marginHorizontal: 20, borderRadius: Radii.md,
    marginBottom: 8, borderWidth: 1, borderColor: Colors.cardBorder, ...Shadows.md,
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.separator,
  },
  dropdownCode: { color: Colors.blue, fontWeight: '700', fontSize: 15, width: 44 },
  dropdownName: { color: Colors.text, fontSize: 13, flex: 1 },

  // Tabs
  tabs: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 12,
    backgroundColor: Colors.surface, borderRadius: Radii.md,
    padding: 4, ...Shadows.sm,
  },
  tab:         { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: Radii.sm },
  tabActive:   { backgroundColor: Colors.primary },
  tabText:     { color: Colors.textMuted, fontSize: 11, fontWeight: '600' },
  tabTextActive:{ color: '#fff', fontWeight: '700' },

  // ── Map ──
  mapCanvas: {
    height: 250, marginHorizontal: 16, marginTop: 8, borderRadius: Radii.lg, overflow: 'hidden',
    position: 'relative', backgroundColor: Colors.mapBg,
    borderWidth: 1, borderColor: Colors.mapWall,
  },
  mapBg: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.mapBg },

  // AirTrain spine
  airTrainSpine: {
    position: 'absolute', left: 0, right: 0, top: 125,
    height: 3, backgroundColor: '#5C3ADE60',
  },
  airTrainLabel: { position: 'absolute', left: 4, top: 128 },
  airTrainText:  { fontSize: 9, color: '#5C3ADE', fontWeight: '700', letterSpacing: 0.3 },

  // Terminal rects
  termRect: {
    position: 'absolute', borderWidth: 2, borderRadius: Radii.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  termRectLabel: { fontSize: 13, fontWeight: '900' },

  // Passenger dot
  passengerDot: {
    position: 'absolute', width: 10, height: 10, borderRadius: 5,
    marginLeft: -5, marginTop: -5,
    borderWidth: 1.5, borderColor: '#fff',
    ...Shadows.sm,
  },

  // Crowd alert pin
  crowdPin: {
    position: 'absolute', width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.warning, alignItems: 'center', justifyContent: 'center',
    marginLeft: -11, marginTop: -11, ...Shadows.sm,
  },

  // User location
  userLocationWrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center', marginLeft: -16, marginTop: -16 },
  userPulse: {
    position: 'absolute', width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.blue + '30',
  },
  userDot: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.blue, borderWidth: 3, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    ...Shadows.colored(Colors.blue),
  },
  userDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },

  // Legend
  legend: {
    flexDirection: 'row', gap: 12, marginHorizontal: 16, marginTop: 10,
    backgroundColor: Colors.surface, borderRadius: Radii.sm,
    paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start',
    ...Shadows.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:  { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: Colors.textSub, fontWeight: '600' },

  // Delay strip
  delayStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.warningBg, borderRadius: Radii.sm,
    marginHorizontal: 16, marginTop: 8,
    padding: 10, borderWidth: 1, borderColor: Colors.warning + '60',
  },
  delayText: { flex: 1, fontSize: 12, color: Colors.warningDark, fontWeight: '600' },

  // Report button (replaces FAB in scroll layout)
  reportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 10, marginBottom: 16,
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radii.lg,
    paddingVertical: 12, backgroundColor: Colors.primaryBg,
  },
  reportBtnLabel: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
  // Legacy FAB (kept for type compatibility)
  fab: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },

  // Lists
  listContent: { padding: 16, gap: 10, paddingBottom: 40 },

  listCard: {
    backgroundColor: Colors.surface, borderRadius: Radii.md, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: Colors.cardBorder, ...Shadows.sm,
  },
  listIconWrap: { width: 42, height: 42, borderRadius: Radii.sm, alignItems: 'center', justifyContent: 'center' },
  listTitle:    { color: Colors.text, fontWeight: '600', fontSize: 15 },
  listSub:      { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  walkBadge:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  walkText:     { color: Colors.teal, fontSize: 12, fontWeight: '700' },

  // Amenities grid
  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 4 },
  amenityCard: {
    backgroundColor: Colors.surface, borderRadius: Radii.md, padding: 14,
    alignItems: 'center', width: '47%',
    borderWidth: 1, borderColor: Colors.cardBorder, ...Shadows.sm,
  },
  amenityIconWrap: { width: 46, height: 46, borderRadius: Radii.sm, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  amenityEmoji:    { fontSize: 22 },
  amenityLabel:    { color: Colors.text, fontWeight: '600', fontSize: 13 },
  amenityCount:    { fontSize: 12, fontWeight: '700', marginTop: 3 },

  // Alerts tab
  alertsHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  alertsTitle:     { fontSize: 18, fontWeight: '800', color: Colors.text },
  alertsSub:       { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  reportBtnInline: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primaryBg, borderRadius: Radii.full,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  reportBtnText:   { color: Colors.primary, fontSize: 13, fontWeight: '700' },

  allClearCard:  { alignItems: 'center', paddingVertical: 40, gap: 10 },
  allClearEmoji: { fontSize: 40 },
  allClearTitle: { fontSize: 18, fontWeight: '700', color: Colors.success },
  allClearSub:   { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },

  recentTitle: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 8 },
  recentRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.separator },
  recentDot:   { width: 6, height: 6, borderRadius: 3 },
  recentLabel: { flex: 1, fontSize: 13, color: Colors.textSub, fontWeight: '500' },
  recentType:  { fontSize: 11, color: Colors.textMuted, textTransform: 'capitalize' },
  recentTime:  { fontSize: 11, color: Colors.textMuted },
});
