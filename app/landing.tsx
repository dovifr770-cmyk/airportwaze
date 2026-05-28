// ─── AirportWaze Landing Page ──────────────────────────────────────────────────
// Stunning marketing page — dark premium look with hero image, features & CTA.

import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, ImageBackground, Dimensions, Platform, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Shadows } from '../src/theme';

const { width: W } = Dimensions.get('window');
const isWide = W >= 768;

// ── Helpers ───────────────────────────────────────────────────────────────────

const grad = (colors: string[], deg = 135) =>
  Platform.OS === 'web'
    ? { backgroundImage: `linear-gradient(${deg}deg, ${colors.join(', ')})` }
    : { backgroundColor: colors[0] };

// ── Sub-components ─────────────────────────────────────────────────────────────

function NavBar() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[nav.bar, { paddingTop: insets.top + 8 }]}>
      <View style={nav.logo}>
        <View style={nav.logoIcon}>
          <Ionicons name="navigate" size={16} color="#fff" />
        </View>
        <Text style={nav.logoText}>AirportWaze</Text>
      </View>

      {isWide && (
        <View style={nav.links}>
          {['Features', 'How it works', 'Airports'].map((l) => (
            <Text key={l} style={nav.link}>{l}</Text>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={nav.cta}
        onPress={() => router.push('/(tabs)/navigate/index')}
        activeOpacity={0.85}
      >
        <Text style={nav.ctaText}>Open App</Text>
        <Ionicons name="arrow-forward" size={14} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const nav = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingBottom: 16,
    ...(Platform.OS === 'web'
      ? { backdropFilter: 'blur(20px)', backgroundColor: 'rgba(8,12,28,0.7)' }
      : { backgroundColor: '#080C1C' }),
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99,
  },
  logo:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoIcon: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    ...grad(['#FF6B00', '#FF3D00']),
  },
  logoText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  links:    { flexDirection: 'row', gap: 28 },
  link:     { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '500' },
  cta: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: Radii.full,
    ...grad(['#FF6B00', '#E05500']),
  },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

// ─────────────────────────────────────────────────────────────────────────────

function FloatingAppCard({ label, value, sub, icon, color }: {
  label: string; value: string; sub: string; icon: any; color: string;
}) {
  return (
    <View style={fac.card}>
      <View style={[fac.iconWrap, { backgroundColor: color + '25' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={fac.label}>{label}</Text>
        <Text style={fac.value}>{value}</Text>
        <Text style={fac.sub}>{sub}</Text>
      </View>
    </View>
  );
}

const fac = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 10,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(10px)' } : {}),
  },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label:    { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  value:    { fontSize: 16, fontWeight: '800', color: '#fff', marginTop: 1 },
  sub:      { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 1 },
});

// ─────────────────────────────────────────────────────────────────────────────

const LANDING_HERO_BG = 'https://images.unsplash.com/photo-1587019158091-1a103c5dd17f?w=1600&q=85';

function HeroSection() {
  const insets = useSafeAreaInsets();
  return (
    <ImageBackground
      source={{ uri: LANDING_HERO_BG }}
      style={[hero.wrap, { paddingTop: insets.top + 80 }]}
      resizeMode="cover"
    >
      {/* Dark overlay over the airport photo */}
      <View style={hero.bgOverlay} />
      {/* Glow blobs */}
      <View style={hero.glow1} />
      <View style={hero.glow2} />

      <View style={[hero.inner, isWide && hero.innerWide]}>

        {/* Left — text */}
        <View style={[hero.textCol, isWide && { flex: 1, paddingRight: 48 }]}>
          <View style={hero.badge}>
            <View style={hero.badgeDot} />
            <Text style={hero.badgeText}>AI-powered navigation</Text>
          </View>

          <Text style={hero.h1}>
            Never miss{'\n'}
            <Text style={hero.h1Accent}>your flight</Text>{'\n'}
            again.
          </Text>

          <Text style={hero.sub}>
            Real-time gate navigation, crowd alerts, and smart
            connection planning — all in your pocket.
          </Text>

          <View style={hero.actions}>
            <TouchableOpacity
              style={hero.primaryBtn}
              onPress={() => router.push('/(tabs)/navigate/index')}
              activeOpacity={0.85}
            >
              <Ionicons name="navigate" size={18} color="#fff" />
              <Text style={hero.primaryBtnText}>Find My Gate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={hero.secondaryBtn}
              onPress={() => router.push('/(tabs)/maps/index')}
              activeOpacity={0.85}
            >
              <Ionicons name="map-outline" size={16} color="#fff" />
              <Text style={hero.secondaryBtnText}>Airport Map</Text>
            </TouchableOpacity>
          </View>

          {/* Trust indicators */}
          <View style={hero.trust}>
            {['50K+ travelers', '200+ airports', '4.8 ★'].map((t, i) => (
              <View key={i} style={hero.trustItem}>
                <Text style={hero.trustText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Right — image + floating cards */}
        {(isWide || W > 480) && (
          <View style={[hero.imgCol, isWide && { flex: 1 }]}>
            <View style={hero.imgFrame}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1540339832862-474599807836?w=700&q=90' }}
                style={hero.img}
                resizeMode="cover"
              />
              {/* Dark overlay */}
              <View style={hero.imgOverlay} />

              {/* Floating cards */}
              <View style={hero.floatingCards}>
                <FloatingAppCard
                  label="Your Gate"
                  value="Terminal 5 · B26"
                  sub="JetBlue B6456 · boards in 42 min"
                  icon="airplane"
                  color="#FF6B00"
                />
                <FloatingAppCard
                  label="Route"
                  value="27 min to gate"
                  sub="AirTrain → T5 security → walk"
                  icon="navigate"
                  color="#00E5FF"
                />
                <FloatingAppCard
                  label="Security"
                  value="~8 min wait"
                  sub="T5 PreCheck lane is clear ✓"
                  icon="shield-checkmark"
                  color="#00C853"
                />
              </View>
            </View>
          </View>
        )}
      </View>
    </ImageBackground>
  );
}

const HERO_BG   = '#080C1C';
const GLOW_1    = 'rgba(255, 107, 0, 0.18)';
const GLOW_2    = 'rgba(30, 100, 255, 0.14)';

const hero = StyleSheet.create({
  wrap: {
    minHeight: 700,
    paddingHorizontal: 24, paddingBottom: 60,
    overflow: 'hidden',
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6,9,22,0.82)',
  },
  glow1: {
    position: 'absolute', width: 500, height: 500,
    borderRadius: 250, left: -100, top: 80,
    backgroundColor: GLOW_1,
    ...(Platform.OS === 'web' ? { filter: 'blur(120px)' } : {}),
  },
  glow2: {
    position: 'absolute', width: 400, height: 400,
    borderRadius: 200, right: -80, top: 200,
    backgroundColor: GLOW_2,
    ...(Platform.OS === 'web' ? { filter: 'blur(100px)' } : {}),
  },
  inner:     { flexDirection: 'column', alignItems: 'center' },
  innerWide: { flexDirection: 'row', alignItems: 'center', maxWidth: 1100, alignSelf: 'center', width: '100%' },
  textCol:   { paddingBottom: 40, alignItems: isWide ? 'flex-start' : 'center' },

  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'rgba(255,107,0,0.15)', borderRadius: Radii.full,
    paddingHorizontal: 14, paddingVertical: 6, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: 'rgba(255,107,0,0.3)',
    marginBottom: 24,
  },
  badgeDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FF6B00' },
  badgeText: { color: '#FF8C38', fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },

  h1: {
    fontSize: isWide ? 64 : 44, fontWeight: '900', color: '#fff',
    lineHeight: isWide ? 72 : 50, letterSpacing: -1.5,
    textAlign: isWide ? 'left' : 'center', marginBottom: 20,
  },
  h1Accent: { color: '#FF6B00' },

  sub: {
    fontSize: 17, color: 'rgba(255,255,255,0.6)', lineHeight: 27,
    maxWidth: 420, textAlign: isWide ? 'left' : 'center', marginBottom: 36,
  },

  actions: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginBottom: 36,
    justifyContent: isWide ? 'flex-start' : 'center' },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 26, paddingVertical: 15, borderRadius: Radii.full,
    ...grad(['#FF6B00', '#E05000']),
    ...Shadows.colored('#FF6B00'),
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 22, paddingVertical: 15, borderRadius: Radii.full,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  secondaryBtnText: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600' },

  trust: {
    flexDirection: 'row', gap: 8, flexWrap: 'wrap',
    justifyContent: isWide ? 'flex-start' : 'center',
  },
  trustItem: {
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: Radii.full,
    paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  trustText: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '600' },

  imgCol:    { width: '100%', maxWidth: 460 },
  imgFrame:  { borderRadius: 24, overflow: 'hidden', position: 'relative' },
  img:       { width: '100%', height: isWide ? 520 : 320 },
  imgOverlay:{
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,12,28,0.45)',
  },
  floatingCards: {
    position: 'absolute', bottom: 20, left: 16, right: 16,
  },
});

// ─────────────────────────────────────────────────────────────────────────────

function StatsBar() {
  const stats = [
    { value: '50K+', label: 'Travelers monthly' },
    { value: '200+', label: 'Airports mapped' },
    { value: '4.8 ★', label: 'App rating' },
    { value: '<30s', label: 'To find your gate' },
  ];
  return (
    <View style={sb.wrap}>
      {stats.map((s, i) => (
        <View key={i} style={sb.item}>
          <Text style={sb.value}>{s.value}</Text>
          <Text style={sb.label}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

const sb = StyleSheet.create({
  wrap: {
    flexDirection: 'row', flexWrap: 'wrap',
    backgroundColor: '#0F1428',
    paddingVertical: 32, paddingHorizontal: 24,
    justifyContent: 'space-around',
    borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  item:  { alignItems: 'center', padding: 12 },
  value: { fontSize: 32, fontWeight: '900', color: '#FF6B00', letterSpacing: -1 },
  label: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontWeight: '500' },
});

// ─────────────────────────────────────────────────────────────────────────────

function FeaturesSection() {
  const features = [
    {
      icon: 'navigate-circle',
      color: '#FF6B00',
      title: 'Smart Gate Navigation',
      desc: 'Enter your flight number and get step-by-step directions to your gate — including AirTrain, security, and walking time.',
    },
    {
      icon: 'git-branch',
      color: '#00C853',
      title: 'Connection Planner',
      desc: 'Flying AA100 then B6456? We calculate the exact route between terminals and alert you if you need to hurry.',
    },
    {
      icon: 'people',
      color: '#1A73E8',
      title: 'Crowd Intelligence',
      desc: 'Real-time security wait times, lounge availability, and crowd density — sourced from thousands of travelers.',
    },
    {
      icon: 'chatbubbles',
      color: '#7C3AED',
      title: 'Passenger Tips',
      desc: 'Curated tips from frequent flyers: best food spots, lounges, shortcuts — organized by terminal and airline.',
    },
    {
      icon: 'map',
      color: '#00ACC1',
      title: 'Indoor Airport Maps',
      desc: 'Detailed terminal floor plans for 200+ airports — with gates, lounges, restaurants, and restrooms marked.',
    },
    {
      icon: 'notifications',
      color: '#F59E0B',
      title: 'Smart Alerts',
      desc: 'Get notified when your gate changes, boarding begins, or when your connection is at risk.',
    },
  ];

  return (
    <View style={fs.wrap}>
      <View style={fs.header}>
        <View style={fs.pill}>
          <Text style={fs.pillText}>Features</Text>
        </View>
        <Text style={fs.h2}>Everything you need at the airport</Text>
        <Text style={fs.sub}>One app replaces the airline app, the airport website, and the frantic Google search.</Text>
      </View>

      <View style={fs.grid}>
        {features.map((f, i) => (
          <View key={i} style={fs.card}>
            <View style={[fs.iconBox, { backgroundColor: f.color + '18' }]}>
              <Ionicons name={f.icon as any} size={26} color={f.color} />
            </View>
            <Text style={fs.cardTitle}>{f.title}</Text>
            <Text style={fs.cardDesc}>{f.desc}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const fs = StyleSheet.create({
  wrap:     { backgroundColor: '#0A0E20', paddingVertical: 80, paddingHorizontal: 24 },
  header:   { alignItems: 'center', marginBottom: 56, maxWidth: 600, alignSelf: 'center' },
  pill:     {
    backgroundColor: 'rgba(255,107,0,0.15)', borderRadius: Radii.full,
    paddingHorizontal: 16, paddingVertical: 6, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,107,0,0.3)',
  },
  pillText: { color: '#FF8C38', fontWeight: '700', fontSize: 13 },
  h2:       { fontSize: isWide ? 44 : 32, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: -0.8, marginBottom: 14 },
  sub:      { fontSize: 16, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 25 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 16,
    maxWidth: 1100, alignSelf: 'center', justifyContent: 'center',
  },
  card: {
    backgroundColor: '#0E1629', borderRadius: 20,
    padding: 24, width: isWide ? 310 : '100%',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  iconBox:   { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#fff', marginBottom: 8 },
  cardDesc:  { fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 21 },
});

// ─────────────────────────────────────────────────────────────────────────────

function HowItWorksSection() {
  const steps = [
    { n: '01', icon: 'keypad', color: '#FF6B00', title: 'Enter your flight', desc: 'Type your flight number (e.g. AA100). For connections, enter both flights.' },
    { n: '02', icon: 'search', color: '#1A73E8', title: 'AI finds your terminal', desc: 'We look up your airline, match it to the correct terminal and gate area.' },
    { n: '03', icon: 'navigate', color: '#00C853', title: 'Navigate step by step', desc: 'Follow the route: AirTrain, security, walking path — all timed for you.' },
    { n: '04', icon: 'airplane', color: '#7C3AED', title: 'Board with confidence', desc: 'Arrive on time, stress-free. Get alerts if anything changes.' },
  ];

  return (
    <View style={hw.wrap}>
      <View style={hw.header}>
        <Text style={hw.h2}>How it works</Text>
        <Text style={hw.sub}>From flight number to boarding gate in 30 seconds.</Text>
      </View>

      <View style={hw.steps}>
        {steps.map((s, i) => (
          <View key={i} style={hw.step}>
            <View style={hw.stepLeft}>
              <View style={[hw.stepNum, { borderColor: s.color + '40' }]}>
                <Text style={[hw.stepNumText, { color: s.color }]}>{s.n}</Text>
              </View>
              {i < steps.length - 1 && <View style={hw.connector} />}
            </View>
            <View style={hw.stepContent}>
              <View style={[hw.stepIcon, { backgroundColor: s.color + '18' }]}>
                <Ionicons name={s.icon as any} size={20} color={s.color} />
              </View>
              <Text style={hw.stepTitle}>{s.title}</Text>
              <Text style={hw.stepDesc}>{s.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const hw = StyleSheet.create({
  wrap:    { backgroundColor: '#070B18', paddingVertical: 80, paddingHorizontal: 24 },
  header:  { alignItems: 'center', marginBottom: 56 },
  h2:      { fontSize: isWide ? 42 : 30, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: -0.8, marginBottom: 12 },
  sub:     { fontSize: 16, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },

  steps:       { maxWidth: 600, alignSelf: 'center', width: '100%' },
  step:        { flexDirection: 'row', gap: 20, marginBottom: 8 },
  stepLeft:    { alignItems: 'center', width: 52 },
  stepNum: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0E1629',
  },
  stepNumText: { fontSize: 13, fontWeight: '800' },
  connector:   { flex: 1, width: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 6, minHeight: 40 },
  stepContent: { flex: 1, paddingBottom: 36 },
  stepIcon:    { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  stepTitle:   { fontSize: 17, fontWeight: '800', color: '#fff', marginBottom: 6 },
  stepDesc:    { fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 21 },
});

// ─────────────────────────────────────────────────────────────────────────────

function CTASection() {
  return (
    <View style={cta.wrap}>
      <View style={cta.glow} />
      <Ionicons name="navigate" size={40} color="rgba(255,107,0,0.5)" style={{ marginBottom: 20 }} />
      <Text style={cta.h2}>Start navigating smarter.</Text>
      <Text style={cta.sub}>Join 50,000+ travelers who never miss a flight.</Text>
      <View style={cta.actions}>
        <TouchableOpacity
          style={cta.btn}
          onPress={() => router.push('/(tabs)/navigate/index')}
          activeOpacity={0.85}
        >
          <Ionicons name="navigate" size={18} color="#fff" />
          <Text style={cta.btnText}>Find My Gate — Free</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={cta.secondBtn}
          onPress={() => router.push('/(tabs)/maps/index')}
          activeOpacity={0.85}
        >
          <Text style={cta.secondBtnText}>Explore Airport Maps</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const cta = StyleSheet.create({
  wrap: {
    backgroundColor: '#080C1C',
    paddingVertical: 80, paddingHorizontal: 24,
    alignItems: 'center', overflow: 'hidden',
  },
  glow: {
    position: 'absolute', width: 400, height: 400, borderRadius: 200,
    top: '50%', left: '50%',
    backgroundColor: 'rgba(255,107,0,0.12)',
    ...(Platform.OS === 'web' ? { filter: 'blur(80px)', transform: [{ translateX: -200 }, { translateY: -200 }] } : {}),
  },
  h2:  { fontSize: isWide ? 48 : 34, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: -1, marginBottom: 14 },
  sub: { fontSize: 17, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginBottom: 40 },
  actions: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 28, paddingVertical: 16, borderRadius: Radii.full,
    ...grad(['#FF6B00', '#E05000']),
    ...Shadows.colored('#FF6B00'),
  },
  btnText:     { color: '#fff', fontSize: 16, fontWeight: '800' },
  secondBtn:   { paddingHorizontal: 24, paddingVertical: 16, borderRadius: Radii.full, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' },
  secondBtnText: { color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: '600' },
});

// ─────────────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <View style={foot.wrap}>
      <View style={foot.top}>
        <View style={foot.brand}>
          <View style={foot.brandIcon}>
            <Ionicons name="navigate" size={14} color="#fff" />
          </View>
          <Text style={foot.brandName}>AirportWaze</Text>
        </View>
        <Text style={foot.tagline}>Your AI airport co-pilot ✈️</Text>
      </View>
      <View style={foot.divider} />
      <View style={foot.bottom}>
        <Text style={foot.copy}>© 2026 AirportWaze. All rights reserved.</Text>
        <View style={foot.links}>
          {['Privacy', 'Terms', 'Support'].map((l) => (
            <Text key={l} style={foot.link}>{l}</Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const foot = StyleSheet.create({
  wrap:      { backgroundColor: '#050810', paddingVertical: 40, paddingHorizontal: 24 },
  top:       { alignItems: 'center', marginBottom: 24 },
  brand:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  brandIcon: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    ...grad(['#FF6B00', '#E05000']),
  },
  brandName: { color: '#fff', fontSize: 16, fontWeight: '800' },
  tagline:   { color: 'rgba(255,255,255,0.35)', fontSize: 13 },
  divider:   { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 24 },
  bottom:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  copy:      { color: 'rgba(255,255,255,0.3)', fontSize: 12 },
  links:     { flexDirection: 'row', gap: 20 },
  link:      { color: 'rgba(255,255,255,0.45)', fontSize: 12 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <View style={{ flex: 1, backgroundColor: '#080C1C' }}>
      <StatusBar barStyle="light-content" backgroundColor="#080C1C" />
      <NavBar />
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <HeroSection />
        <StatsBar />
        <FeaturesSection />
        <HowItWorksSection />
        <CTASection />
        <Footer />
      </ScrollView>
    </View>
  );
}
