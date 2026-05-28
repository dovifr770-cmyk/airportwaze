// ─── AirportWaze Dashboard — Light Design v4 ─────────────────────────────────
// Clean white/light palette — airy, legible, premium feeling.
// Colorful accents on white surfaces, card shadows for depth.

import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  StatusBar, Platform, Dimensions, ImageBackground, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore }       from '../../src/stores/authStore';
import { useFlightStore }     from '../../src/stores/flightStore';
import { useNavigationStore } from '../../src/stores/navigationStore';
import type { FlightStatus } from '../../src/types/flight';
import { AIRPORT_IMAGES }    from '../../src/data/airportImages';

const { width: W } = Dimensions.get('window');

// ── Light palette — clean, airy, premium ──────────────────────────────────────
const C = {
  // Backgrounds
  bg:        '#F8FAFC',   // near-white
  bgAlt:     '#EFF6FF',   // light blue tint for sections
  surface:   '#FFFFFF',   // white cards
  surfaceHi: '#F1F5F9',   // subtle hover
  glass:     'rgba(255,255,255,0.92)',

  // Borders — very subtle on white
  border:    'rgba(15,23,42,0.07)',
  borderHi:  'rgba(15,23,42,0.14)',

  // Accents (kept vibrant for contrast on white)
  orange:    '#F97316',
  orangeGlow:'rgba(249,115,22,0.12)',
  orangeDim: 'rgba(249,115,22,0.10)',
  blue:      '#3B82F6',
  blueDim:   'rgba(59,130,246,0.10)',
  teal:      '#0891B2',
  green:     '#16A34A',
  red:       '#DC2626',
  yellow:    '#D97706',
  purple:    '#9333EA',

  // Text — dark on light
  text:      '#0F172A',   // near-black
  textSub:   '#475569',   // medium gray
  textMuted: '#94A3B8',   // light gray
};

// ── Airport imagery (Unsplash — free commercial use) ──────────────────────────
const HERO = 'https://images.unsplash.com/photo-1587019158091-1a103c5dd17f?w=1400&q=90';
const IMGS = {
  flight:  'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=500&q=85',
  map:     'https://images.unsplash.com/photo-1499346030926-9a72daac6c63?w=500&q=85',
  parking: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=500&q=85',
  crowd:   'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&q=85',
  lounge:  'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&q=85',
};

// ── Status colours ────────────────────────────────────────────────────────────
const STATUS: Record<FlightStatus, { label: string; color: string; icon: string }> = {
  scheduled:   { label: 'On Time',     color: C.green,  icon: 'checkmark-circle' },
  boarding:    { label: 'Boarding',    color: C.orange,  icon: 'walk' },
  gate_closed: { label: 'Gate Closed', color: '#EA580C', icon: 'lock-closed' },
  departed:    { label: 'Departed',    color: C.blue,    icon: 'airplane' },
  delayed:     { label: 'Delayed',     color: C.yellow,  icon: 'time' },
  cancelled:   { label: 'Cancelled',   color: C.red,     icon: 'close-circle' },
  diverted:    { label: 'Diverted',    color: '#F97316', icon: 'arrow-undo' },
  landed:      { label: 'Landed',      color: C.teal,    icon: 'flag' },
};

function greeting() {
  const h = new Date().getHours();
  if (h < 6)  return { text: 'Good night' };
  if (h < 12) return { text: 'Good morning' };
  if (h < 17) return { text: 'Good afternoon' };
  return       { text: 'Good evening' };
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const user             = useAuthStore((s) => s.user);
  const trackedFlights   = useFlightStore((s) => s.trackedFlights);
  const activeConnection = useFlightStore((s) => s.activeConnection);
  const isNavigating     = useNavigationStore((s) => s.isNavigating);
  const activeRoute      = useNavigationStore((s) => s.activeRoute);

  const firstName = user?.fullName?.split(' ')[0] ?? 'Traveler';
  const { text } = greeting();

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
        <ImageBackground source={{ uri: HERO }} style={s.hero} resizeMode="cover">
          {/* Layered gradient overlay — top stays dark, fades to bg color at bottom */}
          <View style={s.heroOverlay} />
          {/* Subtle orange glow bottom-left */}
          <View style={s.heroGlow} />

          <SafeAreaView edges={['top']} style={s.heroInner}>

            {/* Top row */}
            <View style={s.heroTop}>
              <View>
                <Text style={s.greetText}>{text}</Text>
                <Text style={s.heroName}>{firstName}</Text>
              </View>
              <TouchableOpacity style={s.avatar} onPress={() => router.push('/(tabs)/profile/index')} activeOpacity={0.85}>
                <Text style={s.avatarLetter}>{firstName.charAt(0).toUpperCase()}</Text>
              </TouchableOpacity>
            </View>

            {/* ── Find My Gate CTA ── */}
            {!isNavigating && (
              <TouchableOpacity style={s.gateBar} onPress={() => router.push('/(tabs)/navigate/index')} activeOpacity={0.9}>
                <View style={s.gateIcon}>
                  <Ionicons name="navigate" size={20} color={C.orange} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.gateTitle}>Find My Gate</Text>
                  <Text style={s.gateSub}>Enter flight number for step-by-step directions</Text>
                </View>
                <View style={s.gateBtn}>
                  <Ionicons name="arrow-forward" size={15} color="#fff" />
                </View>
              </TouchableOpacity>
            )}

            {/* ── Active navigation banner ── */}
            {isNavigating && activeRoute && (
              <TouchableOpacity style={s.navBanner} onPress={() => router.push('/(tabs)/navigate/index')} activeOpacity={0.9}>
                <View style={s.navPulse} />
                <View style={{ flex: 1 }}>
                  <Text style={s.navTitle}>Navigation Active</Text>
                  <Text style={s.navSub}>→ {activeRoute.to.name} · {activeRoute.estimatedWalkingTime} min walk</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
              </TouchableOpacity>
            )}
          </SafeAreaView>
        </ImageBackground>

        {/* ══ BODY ══════════════════════════════════════════════════════════════ */}
        <View style={s.body}>

          {/* Tight connection alert */}
          {activeConnection?.isAtRisk && (
            <View style={s.alert}>
              <View style={s.alertIcon}><Ionicons name="warning" size={16} color={C.red} /></View>
              <Text style={s.alertText}>Tight connection — only {activeConnection.connectionTimeMinutes} min between flights!</Text>
            </View>
          )}

          {/* ── Live stats strip ── */}
          <View style={s.statsRow}>
            <StatChip icon="shield-checkmark-outline" color={C.green}  label="Security" value="~8 min" />
            <StatChip icon="wifi-outline"             color={C.blue}   label="Wi-Fi"    value="Free" />
            <StatChip icon="storefront-outline"       color={C.orange} label="Shops"    value="Open" />
            <StatChip icon="airplane-outline"         color={C.teal}   label="Gates"    value="Live" />
          </View>

          {/* ── Quick Actions ── */}
          <SectionHeader title="Quick Actions" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.actionRow}>
            <ActionCard img={IMGS.flight}  icon="airplane"       label="My Flight"   accent={C.orange} onPress={() => router.push('/(tabs)/navigate/index')} />
            <ActionCard img={IMGS.map}     icon="map"            label="Airport Map" accent={C.blue}   onPress={() => router.push('/(tabs)/maps/index')} />
            <ActionCard img={IMGS.parking} icon="car"            label="Parking"     accent={C.purple} onPress={() => router.push('/(tabs)/parking/index')} />
            <ActionCard img={IMGS.crowd}   icon="people"         label="Crowd Info"  accent={C.teal}   onPress={() => router.push('/(tabs)/maps/index')} />
            <ActionCard img={IMGS.lounge}  icon="cafe"           label="Lounges"     accent={C.green}  onPress={() => router.push('/(tabs)/maps/index')} />
          </ScrollView>

          {/* ── Top Airports with images ── */}
          <SectionHeader title="Top Airports" action="Navigate →" onAction={() => router.push('/(tabs)/navigate/index')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 2, paddingBottom: 4 }}>
            {[
              { code: 'DXB', city: 'Dubai',      desc: 'World\'s busiest international' },
              { code: 'SIN', city: 'Singapore',  desc: 'World\'s best airport' },
              { code: 'LHR', city: 'London',     desc: 'Europe\'s busiest hub' },
              { code: 'CDG', city: 'Paris',      desc: 'Air France & SkyTeam hub' },
              { code: 'JFK', city: 'New York',   desc: 'Major transatlantic gateway' },
              { code: 'NRT', city: 'Tokyo',      desc: 'Japanese hospitality & sushi' },
              { code: 'IST', city: 'Istanbul',   desc: 'World\'s largest single terminal' },
            ].map(({ code, city, desc }) => {
              const img = AIRPORT_IMAGES[code];
              return img ? (
                <AirportCard
                  key={code}
                  code={code}
                  city={city}
                  desc={desc}
                  color={img.color}
                  onPress={() => router.push('/(tabs)/navigate/index')}
                />
              ) : null;
            })}
          </ScrollView>

          {/* ── Tracked flights ── */}
          {trackedFlights.length > 0 && (
            <>
              <SectionHeader title="Your Flights" action="See all" onAction={() => {}} />
              {trackedFlights.slice(0, 3).map((flight) => {
                const f        = flight as any;
                const rawT     = f.terminal ?? f.departureTerminal ?? f.arrivalTerminal ?? '—';
                const terminal = typeof rawT === 'string' && rawT.startsWith('T') ? rawT : `T${rawT}`;
                const gate     = f.gate ?? f.departureGateCode ?? f.arrivalGateCode ?? '—';
                const delay    = f.delayMinutes ?? f.departureDelayMinutes ?? 0;
                const meta     = STATUS[flight.status] ?? STATUS.scheduled;
                return (
                  <FlightCard
                    key={flight.id}
                    flightNumber={flight.flightNumber}
                    status={meta}
                    origin={(f.origin?.code ?? 'JFK')}
                    dest={(f.destination?.code ?? '???')}
                    terminal={terminal}
                    gate={gate}
                    delay={delay}
                  />
                );
              })}
            </>
          )}

          {/* ── Smart Tip ── */}
          <SmartTip
            icon="navigate-circle"
            color={C.orange}
            text="Tap Navigate for live gate directions with crowd wait times and connection planning."
            onPress={() => router.push('/(tabs)/navigate/index')}
            linkText="Navigate →"
          />

        </View>
      </ScrollView>
    </View>
  );
}

// ── Stat Chip ─────────────────────────────────────────────────────────────────
function StatChip({ icon, color, label, value }: { icon: any; color: string; label: string; value: string }) {
  return (
    <View style={sc.chip}>
      <View style={[sc.iconRing, { borderColor: color + '44' }]}>
        <Ionicons name={icon} size={15} color={color} />
      </View>
      <Text style={sc.label}>{label}</Text>
      <Text style={[sc.value, { color }]}>{value}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  chip: {
    flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4,
    backgroundColor: C.surface, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
  },
  iconRing: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: C.surfaceHi,
  },
  label: { fontSize: 10, color: C.textSub, marginTop: 5, fontWeight: '700', letterSpacing: 0.3 },
  value: { fontSize: 12, fontWeight: '800', marginTop: 2 },
});

// ── Airport Card ─────────────────────────────────────────────────────────────
function AirportCard({ code, city, desc, color, onPress }: {
  code: string; city: string; desc: string; color: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={apc.card} onPress={onPress} activeOpacity={0.85}>
      <View style={[apc.topBar, { backgroundColor: color }]} />
      <View style={apc.inner}>
        <View style={[apc.iconBadge, { backgroundColor: color + '14' }]}>
          <Ionicons name="airplane" size={18} color={color} />
        </View>
        <Text style={[apc.code, { color }]}>{code}</Text>
        <Text style={apc.city} numberOfLines={1}>{city}</Text>
        <Text style={apc.desc} numberOfLines={2}>{desc}</Text>
        <View style={[apc.navBtn, { backgroundColor: color + '14' }]}>
          <Ionicons name="navigate-outline" size={10} color={color} />
          <Text style={[apc.navText, { color }]}>Navigate</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
const apc = StyleSheet.create({
  card: {
    width: 128, backgroundColor: C.surface, borderRadius: 18,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginVertical: 2,
    ...(Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(0,0,0,0.07)' } as any : { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 }),
  },
  topBar:   { height: 4, width: '100%' },
  inner:    { padding: 14, gap: 4 },
  iconBadge:{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  code:     { fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },
  city:     { fontSize: 12, fontWeight: '700', color: C.text },
  desc:     { fontSize: 10, color: C.textSub, lineHeight: 14, marginTop: 2 },
  navBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4, marginTop: 8, alignSelf: 'flex-start' },
  navText:  { fontSize: 10, fontWeight: '800' },
});

// ── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={sh.row}>
      <View style={sh.left}>
        <View style={sh.dot} />
        <Text style={sh.title}>{title}</Text>
      </View>
      {action && <TouchableOpacity onPress={onAction}><Text style={sh.action}>{action}</Text></TouchableOpacity>}
    </View>
  );
}
const sh = StyleSheet.create({
  row:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  left:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot:    { width: 4, height: 18, borderRadius: 2, backgroundColor: C.orange },
  title:  { fontSize: 17, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  action: { fontSize: 13, color: C.orange, fontWeight: '700' },
});

// ── Action Card ────────────────────────────────────────────────────────────────
function ActionCard({ img, icon, label, accent, onPress }: {
  img: string; icon: any; label: string; accent: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={ac.card} onPress={onPress} activeOpacity={0.87}>
      <ImageBackground source={{ uri: img }} style={ac.bg} resizeMode="cover" imageStyle={ac.bgImg}>
        {/* Gradient overlay from transparent to dark */}
        <View style={ac.overlay} />
        {/* Accent glow line at top */}
        <View style={[ac.topAccent, { backgroundColor: accent }]} />
        {/* Icon badge */}
        <View style={[ac.iconBadge, { backgroundColor: accent }]}>
          <Ionicons name={icon} size={17} color="#fff" />
        </View>
        {/* Label + arrow */}
        <View style={ac.bottom}>
          <Text style={ac.label}>{label}</Text>
          <View style={[ac.arrowCircle, { backgroundColor: accent + '33' }]}>
            <Ionicons name="arrow-forward" size={12} color={accent} />
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}
const ac = StyleSheet.create({
  card: {
    width: 152, height: 182,
    borderRadius: 22, marginRight: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: C.borderHi,
  },
  bg:      { flex: 1 },
  bgImg:   { borderRadius: 22 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,10,25,0.44)',
  },
  topAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  iconBadge: {
    margin: 16, width: 42, height: 42, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  bottom: {
    position: 'absolute', bottom: 14, left: 14, right: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  label:      { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: -0.2, flex: 1 },
  arrowCircle:{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});

// ── Flight Card ────────────────────────────────────────────────────────────────
function FlightCard({ flightNumber, status, origin, dest, terminal, gate, delay }: {
  flightNumber: string; status: { label: string; color: string; icon: string };
  origin: string; dest: string; terminal: string; gate: string; delay: number;
}) {
  return (
    <View style={[ff.card, { borderLeftColor: status.color }]}>
      {/* Status bar at top */}
      <View style={[ff.topBar, { backgroundColor: status.color + '18', borderBottomColor: status.color + '22' }]}>
        <Ionicons name={status.icon as any} size={12} color={status.color} />
        <Text style={[ff.topBarText, { color: status.color }]}>{status.label}</Text>
        <Text style={ff.flightNum}>{flightNumber}</Text>
      </View>

      <View style={ff.body}>
        {/* Route row */}
        <View style={ff.route}>
          <View>
            <Text style={ff.iata}>{origin}</Text>
            <Text style={ff.iataLabel}>Departure</Text>
          </View>
          <View style={ff.routeMid}>
            <View style={ff.routeLine} />
            <View style={ff.planeWrap}>
              <Ionicons name="airplane" size={14} color={C.blue} />
            </View>
            <View style={ff.routeLine} />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={ff.iata}>{dest}</Text>
            <Text style={ff.iataLabel}>Arrival</Text>
          </View>
        </View>

        {/* Info pills */}
        <View style={ff.pills}>
          <InfoPill icon="business-outline"  text={terminal} />
          <InfoPill icon="location-outline"  text={`Gate ${gate}`} />
          {delay > 0 && <InfoPill icon="time-outline" text={`+${delay} min`} warn />}
        </View>
      </View>
    </View>
  );
}

function InfoPill({ icon, text, warn }: { icon: any; text: string; warn?: boolean }) {
  return (
    <View style={[pp.pill, warn && pp.warn]}>
      <Ionicons name={icon} size={10} color={warn ? C.yellow : C.textMuted} />
      <Text style={[pp.text, warn && { color: C.yellow }]}>{text}</Text>
    </View>
  );
}
const pp = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.surface, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: C.border,
  },
  warn: { backgroundColor: 'rgba(234,179,8,0.1)', borderColor: 'rgba(234,179,8,0.3)' },
  text: { fontSize: 11, fontWeight: '700', color: C.textSub },
});

const ff = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: 20, marginBottom: 12,
    borderWidth: 1, borderColor: C.border,
    borderLeftWidth: 3, overflow: 'hidden',
    ...(Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } as any : { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 }),
  },
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderBottomWidth: 1,
  },
  topBarText: { fontSize: 12, fontWeight: '700', flex: 1 },
  flightNum:  { fontSize: 12, fontWeight: '900', color: C.text },
  body:       { padding: 16 },
  route:      { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  iata:       { fontSize: 32, fontWeight: '900', color: C.text, letterSpacing: -1 },
  iataLabel:  { fontSize: 10, color: C.textMuted, marginTop: 2 },
  routeMid:   { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  routeLine:  { flex: 1, height: 1.5, backgroundColor: C.border },
  planeWrap:  {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.blueDim, borderWidth: 1, borderColor: C.blue + '33',
    alignItems: 'center', justifyContent: 'center', marginHorizontal: 8,
  },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});

// ── Smart Tip ──────────────────────────────────────────────────────────────────
function SmartTip({ icon, color, text, onPress, linkText }: {
  icon: any; color: string; text: string; onPress: () => void; linkText: string;
}) {
  return (
    <View style={[tip.card, { borderColor: color + '28' }]}>
      <View style={[tip.iconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={tip.text}>{text}</Text>
        <TouchableOpacity onPress={onPress}>
          <Text style={[tip.link, { color }]}>{linkText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const tip = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: C.surface, borderRadius: 18, padding: 16, marginTop: 8,
    borderWidth: 1,
  },
  iconWrap: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  text:     { fontSize: 13, color: C.textSub, lineHeight: 19, marginBottom: 6 },
  link:     { fontSize: 13, fontWeight: '800' },
});

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll:        { flex: 1 },
  scrollContent: { paddingBottom: 48 },

  // ── Hero
  hero: { height: 340, width: '100%' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,10,25,0.42)',
  },
  heroInner: { flex: 1, paddingHorizontal: 22, paddingBottom: 20, justifyContent: 'space-between' },
  heroTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greetText: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600', letterSpacing: 0.3 },
  heroName:  { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -0.8, marginTop: 2 },

  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: C.orange,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
    marginTop: 2,
  },
  avatarLetter: { color: '#fff', fontSize: 19, fontWeight: '900' },

  // Gate bar
  gateBar: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 20, padding: 16,
    borderWidth: 1.5, borderColor: 'rgba(249,115,22,0.30)',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(16px)', boxShadow: '0 2px 16px rgba(0,0,0,0.12)' } as any : {}),
  },
  gateIcon: {
    width: 48, height: 48, borderRadius: 15,
    backgroundColor: C.orangeDim, borderWidth: 1, borderColor: C.orange + '40',
    alignItems: 'center', justifyContent: 'center',
  },
  gateTitle: { color: C.text, fontSize: 16, fontWeight: '800' },
  gateSub:   { color: C.textSub, fontSize: 12, marginTop: 2 },
  gateBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.orange,
    alignItems: 'center', justifyContent: 'center',
  },

  // Nav banner
  navBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(59,130,246,0.18)',
    borderRadius: 18, padding: 14,
    borderWidth: 1, borderColor: C.blue + '44',
  },
  navPulse: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: C.blue,
    ...(Platform.OS === 'web' ? { boxShadow: `0 0 8px ${C.blue}` } as any : {}),
  },
  navTitle: { color: '#fff', fontWeight: '800', fontSize: 14 },
  navSub:   { color: C.textSub, fontSize: 12, marginTop: 1 },

  // Body
  body:      { paddingHorizontal: 18, paddingTop: 22 },
  statsRow:  { flexDirection: 'row', gap: 8, marginBottom: 28 },
  actionRow: { paddingBottom: 4, marginBottom: 28 },

  // Alert
  alert: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 16, padding: 14, marginBottom: 18,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  alertIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  alertText: { flex: 1, color: C.red, fontSize: 13, fontWeight: '600' },
});
