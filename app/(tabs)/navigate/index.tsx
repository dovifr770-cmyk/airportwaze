// ─── Smart Navigate Screen — AI Co-Pilot Edition ─────────────────────────────
// Full smart connection agent integration:
//  • Real step-by-step route from AI agent (deplane → customs → transfer → gate)
//  • Curated lounge/food/coffee recs per airport + terminal + free-time budget
//  • Airport hero images + accent colors
//  • Risk assessment: CRITICAL / TIGHT / COMFORTABLE / RELAXED / PLENTY
//  • Social tips from travelers
//  • i18n-ready structure (en/he/ar/es)

import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, StatusBar, Switch, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// ── Smart Connection Agent ─────────────────────────────────────────────────────
import {
  buildSmartConnectionPlan,
  type SmartRoutePlan,
  type RouteStep,
  type SmartRecommendation,
  type ConnectionRisk,
} from '../../../src/services/smartRoute/connectionAgent';

// ── Single-flight mode (non-connection) ───────────────────────────────────────
import {
  resolveFlight,
  type ResolvedFlight,
} from '../../../src/services/aviation/flightInfo';

// ── Social tips ────────────────────────────────────────────────────────────────
import {
  fetchAirportInsights,
  tipCategoryIcon,
  tipCategoryColor,
  type SocialTip,
} from '../../../src/services/social/airportInsights';

// ── Airport data + images ──────────────────────────────────────────────────────
import { AIRPORT_REGISTRY } from '../../../src/data/airportTerminals';
import { getAirportImages, getAirportColor } from '../../../src/data/airportImages';

// ─── Palette — Light & Clean ───────────────────────────────────────────────────
const C = {
  bg:        '#F8FAFC',
  bgAlt:     '#EFF6FF',
  surface:   '#FFFFFF',
  surfaceHi: '#F1F5F9',
  glass:     'rgba(255,255,255,0.92)',
  border:    'rgba(15,23,42,0.07)',
  borderHi:  'rgba(15,23,42,0.14)',
  orange:    '#F97316',
  orangeDim: 'rgba(249,115,22,0.10)',
  blue:      '#3B82F6',
  blueDim:   'rgba(59,130,246,0.10)',
  green:     '#16A34A',
  greenDim:  'rgba(22,163,74,0.10)',
  yellow:    '#D97706',
  red:       '#DC2626',
  teal:      '#0891B2',
  purple:    '#9333EA',
  text:      '#0F172A',
  textSub:   '#475569',
  textMuted: '#94A3B8',
};

type Screen = 'entry' | 'loading' | 'result';

// ── Risk config ────────────────────────────────────────────────────────────────
const RISK_CFG: Record<ConnectionRisk, { label: string; icon: any; color: string; bg: string }> = {
  CRITICAL:    { label: 'Critical — Run!',       icon: 'flash',            color: C.red,    bg: 'rgba(220,38,38,0.10)' },
  TIGHT:       { label: 'Tight Connection',      icon: 'timer-outline',    color: C.yellow, bg: 'rgba(217,119,6,0.10)' },
  COMFORTABLE: { label: 'Comfortable',           icon: 'checkmark-circle', color: C.green,  bg: 'rgba(22,163,74,0.10)' },
  RELAXED:     { label: 'Relaxed — Grab coffee', icon: 'cafe-outline',     color: C.teal,   bg: 'rgba(8,145,178,0.10)' },
  PLENTY:      { label: 'Plenty — Visit lounge', icon: 'bed-outline',      color: C.purple, bg: 'rgba(147,51,234,0.10)' },
};

// Quick risk estimate (before searching) based on available minutes
function quickRisk(availMin: number, isIntl: boolean): ConnectionRisk {
  const buf = isIntl ? 20 : 0;
  const eff = availMin - 25 - buf; // 25 min = typical walk minimum
  if (eff < 15) return 'CRITICAL';
  if (eff < 35) return 'TIGHT';
  if (eff < 60) return 'COMFORTABLE';
  if (eff < 120) return 'RELAXED';
  return 'PLENTY';
}

// Type icons for recommendations (Ionicons names)
const REC_ICONS: Record<SmartRecommendation['type'], any> = {
  lounge: 'bed-outline',
  coffee: 'cafe-outline',
  food:   'restaurant-outline',
  rest:   'moon-outline',
  shop:   'bag-outline',
  wifi:   'wifi-outline',
};

// Airport grid data (all 14 airports)
const ALL_AIRPORTS = [
  { code: 'JFK', city: 'New York'    },
  { code: 'LAX', city: 'Los Angeles' },
  { code: 'ORD', city: 'Chicago'     },
  { code: 'LHR', city: 'London'      },
  { code: 'DXB', city: 'Dubai'       },
  { code: 'CDG', city: 'Paris'       },
  { code: 'SIN', city: 'Singapore'   },
  { code: 'AMS', city: 'Amsterdam'   },
  { code: 'FRA', city: 'Frankfurt'   },
  { code: 'HKG', city: 'Hong Kong'   },
  { code: 'NRT', city: 'Tokyo'       },
  { code: 'IST', city: 'Istanbul'    },
  { code: 'DFW', city: 'Dallas'      },
  { code: 'ATL', city: 'Atlanta'     },
];

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function NavigateScreen() {
  const [screen,       setScreen]       = useState<Screen>('entry');
  const [isConnection, setIsConnection] = useState(true);
  const [inboundNum,   setInboundNum]   = useState('');
  const [outboundNum,  setOutboundNum]  = useState('');
  const [airport,      setAirport]      = useState('JFK');
  const [airportQuery, setAirportQuery] = useState('');
  const [availMins,    setAvailMins]    = useState('90');
  const [isIntl,       setIsIntl]       = useState(false);

  // Results
  const [plan,   setPlan]   = useState<SmartRoutePlan | null>(null);
  const [single, setSingle] = useState<ResolvedFlight | null>(null);
  const [tips,   setTips]   = useState<SocialTip[]>([]);
  const [error,  setError]  = useState<string | null>(null);

  // Airport registry for the search dropdown
  const knownAirports = Object.values(AIRPORT_REGISTRY);
  const filteredAirports = airportQuery.length >= 1
    ? knownAirports.filter(a =>
        a.code.toLowerCase().includes(airportQuery.toLowerCase()) ||
        a.name.toLowerCase().includes(airportQuery.toLowerCase()) ||
        a.city.toLowerCase().includes(airportQuery.toLowerCase())
      )
    : [];

  // Airport images for selected airport
  const airportImg   = getAirportImages(airport);
  const airportColor = getAirportColor(airport);

  const handleSearch = useCallback(async () => {
    const inNum  = inboundNum.trim().toUpperCase();
    const outNum = outboundNum.trim().toUpperCase();
    if (!inNum) { setError('Enter your arriving flight number'); return; }
    if (isConnection && !outNum) { setError('Enter your departing flight number'); return; }

    setError(null);
    setScreen('loading');

    try {
      const mins = Number(availMins) || 90;

      if (isConnection) {
        // Full AI connection plan
        const [smartPlan, socialTips] = await Promise.all([
          buildSmartConnectionPlan(inNum, outNum, airport, mins, isIntl, 'en'),
          fetchAirportInsights(airport),
        ]);
        setPlan(smartPlan);
        setSingle(null);
        setTips(socialTips.slice(0, 5));
      } else {
        // Single-flight mode
        const [resolved, socialTips] = await Promise.all([
          resolveFlight(inNum, airport),
          fetchAirportInsights(airport),
        ]);
        setSingle(resolved);
        setPlan(null);
        setTips(socialTips.slice(0, 5));
      }
      setScreen('result');
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.');
      setScreen('entry');
    }
  }, [inboundNum, outboundNum, airport, isConnection, availMins, isIntl]);

  const reset = () => {
    setScreen('entry'); setPlan(null); setSingle(null); setTips([]); setError(null);
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // ENTRY SCREEN
  // ──────────────────────────────────────────────────────────────────────────────
  if (screen === 'entry') {
    const risk    = isConnection && availMins ? quickRisk(Number(availMins), isIntl) : null;
    const riskCfg = risk ? RISK_CFG[risk] : null;

    return (
      <SafeAreaView style={s.root}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <ScrollView contentContainerStyle={s.entryScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── Header ── */}
          <View style={s.header}>
            <View style={[s.headerIcon, { backgroundColor: airportColor + '15' }]}>
              <Ionicons name="navigate" size={26} color={airportColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle}>Smart Navigator</Text>
              <Text style={s.headerSub}>AI airport co-pilot</Text>
            </View>
            {/* Active airport badge */}
            <View style={[s.airportBadge, { backgroundColor: airportColor, borderRadius: 12 }]}>
              <Text style={s.airportBadgeText}>{airport}</Text>
            </View>
          </View>

          {/* ── Airport search ── */}
          <Label text="Airport" />
          <View style={s.inputRow}>
            <Ionicons name="location" size={16} color={C.orange} />
            <TextInput
              style={s.inputText}
              value={airportQuery || airport}
              onChangeText={v => setAirportQuery(v)}
              placeholder="Search airport..."
              placeholderTextColor={C.textMuted}
            />
            {airportQuery.length > 0 && (
              <TouchableOpacity onPress={() => setAirportQuery('')}>
                <Ionicons name="close-circle" size={16} color={C.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {filteredAirports.length > 0 && (
            <View style={s.dropdown}>
              {filteredAirports.slice(0, 5).map(a => (
                <TouchableOpacity key={a.code} style={s.dropItem} onPress={() => { setAirport(a.code); setAirportQuery(''); }}>
                  <Text style={s.dropCode}>{a.code}</Text>
                  <View>
                    <Text style={s.dropName}>{a.name}</Text>
                    <Text style={s.dropCity}>{a.city}, {a.country}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Airport grid chips */}
          {airportQuery.length === 0 && (
            <View style={s.airportGrid}>
              {ALL_AIRPORTS.map(a => {
                const col = getAirportColor(a.code);
                const isActive = airport === a.code;
                return (
                  <TouchableOpacity
                    key={a.code}
                    style={[s.airportChip, isActive && { borderColor: col, backgroundColor: col + '18' }]}
                    onPress={() => setAirport(a.code)}
                  >
                    <Ionicons name="airplane-outline" size={14} color={airport === a.code ? airportColor : C.textMuted} />
                    <Text style={[s.airportChipCode, isActive && { color: col }]}>{a.code}</Text>
                    <Text style={s.airportChipCity}>{a.city}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ── Arriving flight ── */}
          <Label text={isConnection ? 'Arriving Flight' : 'Your Flight'} />
          <View style={s.inputRow}>
            <Ionicons name="airplane-outline" size={16} color={C.blue} />
            <TextInput
              style={[s.inputText, s.flightFont]}
              value={inboundNum}
              onChangeText={v => setInboundNum(v.toUpperCase())}
              placeholder="e.g. AA100 · EK205 · B6456"
              placeholderTextColor={C.textMuted}
              autoCapitalize="characters"
              maxLength={8}
            />
          </View>

          {/* ── Connection toggle ── */}
          <View style={s.toggleCard}>
            <View style={s.toggleLeft}>
              <View style={s.toggleDot} />
              <View>
                <Text style={s.toggleLabel}>Connecting Flight</Text>
                <Text style={s.toggleSub}>Get full terminal-to-gate AI routing</Text>
              </View>
            </View>
            <Switch
              value={isConnection}
              onValueChange={setIsConnection}
              trackColor={{ false: C.surface, true: C.orange + '80' }}
              thumbColor={isConnection ? C.orange : C.textMuted}
            />
          </View>

          {isConnection && (
            <>
              <Label text="Departing Flight" />
              <View style={s.inputRow}>
                <Ionicons name="airplane" size={16} color={C.orange} />
                <TextInput
                  style={[s.inputText, s.flightFont]}
                  value={outboundNum}
                  onChangeText={v => setOutboundNum(v.toUpperCase())}
                  placeholder="e.g. DL789 · LH400"
                  placeholderTextColor={C.textMuted}
                  autoCapitalize="characters"
                  maxLength={8}
                />
              </View>

              {/* ── Time & International ── */}
              <View style={s.metaRow}>
                <View style={[s.metaCard, { flex: 1, marginRight: 8 }]}>
                  <Text style={s.metaLabel}>Time Available</Text>
                  <View style={s.metaInputRow}>
                    <TextInput
                      style={s.metaInput}
                      value={availMins}
                      onChangeText={v => setAvailMins(v.replace(/[^0-9]/g, ''))}
                      keyboardType="number-pad"
                      maxLength={3}
                    />
                    <Text style={s.metaUnit}>min</Text>
                  </View>
                </View>
                <View style={[s.metaCard, { flex: 1.2 }]}>
                  <Text style={s.metaLabel}>International Arrival</Text>
                  <View style={s.metaSwitchRow}>
                    <Text style={s.metaSwitchLabel}>{isIntl ? 'Yes — re-clear customs' : 'No — domestic'}</Text>
                    <Switch
                      value={isIntl}
                      onValueChange={setIsIntl}
                      trackColor={{ false: C.surface, true: C.blue + '80' }}
                      thumbColor={isIntl ? C.blue : C.textMuted}
                      style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                    />
                  </View>
                </View>
              </View>

              {/* Risk preview banner */}
              {riskCfg && availMins.length > 0 && (
                <View style={[s.riskBanner, { backgroundColor: riskCfg.bg, borderColor: riskCfg.color + '40' }]}>
                  <View style={s.riskLabelRow}>
                    <Ionicons name={riskCfg.icon} size={15} color={riskCfg.color} />
                    <Text style={[s.riskLabel, { color: riskCfg.color }]}>{riskCfg.label}</Text>
                  </View>
                  <Text style={s.riskSub}>
                    {risk === 'CRITICAL'    ? 'Head straight to your gate — no stops at all.' :
                     risk === 'TIGHT'       ? 'Walk briskly — skip all non-essential stops.' :
                     risk === 'COMFORTABLE' ? 'Enough time if you walk efficiently. Quick coffee OK.' :
                     risk === 'RELAXED'     ? 'Grab a meal on the way — you\'re in good shape!' :
                                              'Plenty of time — enjoy the lounge!'}
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Error */}
          {error && (
            <View style={s.errorRow}>
              <Ionicons name="alert-circle" size={15} color={C.red} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          {/* CTA */}
          <TouchableOpacity style={[s.ctaBtn, { backgroundColor: airportColor }]} onPress={handleSearch} activeOpacity={0.88}>
            <Ionicons name="navigate" size={20} color="#fff" />
            <Text style={s.ctaBtnText}>Find My Gate →</Text>
          </TouchableOpacity>

          {/* Demo shortcuts */}
          <View style={s.demoRow}>
            {[
              { label: 'JFK: AA100→B6456', airport: 'JFK', in: 'AA100', out: 'B6456' },
              { label: 'DXB: EK201→EK415', airport: 'DXB', in: 'EK201', out: 'EK415' },
              { label: 'LHR: BA117→BA435', airport: 'LHR', in: 'BA117', out: 'BA435' },
            ].map(d => (
              <TouchableOpacity key={d.label} style={s.demoChip} onPress={() => {
                setAirport(d.airport); setInboundNum(d.in);
                setOutboundNum(d.out); setIsConnection(true);
              }}>
                <Text style={s.demoChipText}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

        </ScrollView>
      </SafeAreaView>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // LOADING SCREEN
  // ──────────────────────────────────────────────────────────────────────────────
  if (screen === 'loading') {
    const loadAirportImg = getAirportImages(airport);
    const loadColor      = getAirportColor(airport);
    return (
      <SafeAreaView style={[s.root, s.center]}>
        <View style={[s.loadingAirportBadge, { borderColor: loadColor + '40' }]}>
          <Ionicons name="airplane" size={44} color={airportColor} />
        </View>
        <ActivityIndicator size="large" color={loadColor} style={{ marginTop: 16 }} />
        <Text style={s.loadingTitle}>Building your smart route…</Text>
        <Text style={s.loadingSub}>Checking terminals · Calculating times · Finding best stops</Text>
      </SafeAreaView>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // RESULT SCREEN
  // ──────────────────────────────────────────────────────────────────────────────

  // Derive from plan (connection) or single (single-flight)
  const risk        = plan?.connectionRisk ?? 'COMFORTABLE';
  const riskCfg     = RISK_CFG[risk];
  const totalMin    = plan?.totalWalkMinutes ?? single?.walkMinutesToGate ?? 10;
  const outTerminal = plan?.outboundTerminal ?? single?.terminal.terminal ?? '?';
  const freeMin     = plan?.freeMinutes ?? 0;
  const sameTerminal = plan ? plan.inboundTerminal === plan.outboundTerminal : true;

  // Find transfer step to get transfer minutes
  const transferStep = plan?.steps?.find(st => st.type === 'transfer');
  const transferMin  = transferStep?.durationMinutes ?? 0;

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── Top bar ── */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={reset}>
          <Ionicons name="chevron-back" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={s.topBarTitle}>Your Smart Route</Text>
        <View style={[s.riskPill, { backgroundColor: riskCfg.bg }]}>
          <Text style={[s.riskPillText, { color: riskCfg.color }]}>{risk}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.resultScroll} showsVerticalScrollIndicator={false}>

        {/* ── ETA hero card ── */}
        <View style={[s.etaCard, { borderTopColor: riskCfg.color, borderTopWidth: 4 }]}>
          <View style={s.etaRow}>
            {/* Big time */}
            <View style={s.etaMain}>
              <Text style={[s.etaBig, { color: riskCfg.color }]}>{totalMin}</Text>
              <Text style={s.etaUnit}>min to gate</Text>
            </View>
            <View style={s.etaDivider} />
            {/* Terminal */}
            <View style={s.etaInfo}>
              <Text style={s.etaLabel}>Gate Terminal</Text>
              <Text style={[s.etaTerminal, { color: C.text }]}>{outTerminal}</Text>
              {plan && !sameTerminal && transferMin > 0 && (
                <View style={[s.transferPill, { backgroundColor: C.yellow + '15' }]}>
                  <Ionicons name="train-outline" size={11} color={C.yellow} />
                  <Text style={s.transferText}>+{transferMin} min transfer</Text>
                </View>
              )}
            </View>
            {/* Risk icon */}
            <View style={[s.etaRisk, { backgroundColor: riskCfg.bg }]}>
              <Ionicons name={riskCfg.icon} size={24} color={riskCfg.color} />
              <Text style={[s.etaRiskText, { color: riskCfg.color }]}>{risk}</Text>
            </View>
          </View>
        </View>

        {/* ── Risk description ── */}
        {plan && (
          <View style={[s.riskDescCard, { backgroundColor: riskCfg.bg, borderColor: riskCfg.color + '30' }]}>
            <Ionicons name="information-circle" size={16} color={riskCfg.color} />
            <Text style={[s.riskDescText, { color: riskCfg.color }]}>{plan.riskDescription}</Text>
          </View>
        )}

        {/* ── Flight pair ── */}
        {plan && (
          <View style={s.flightPair}>
            <FlightChip
              label="Arriving"
              flight={plan.inboundFlight}
              terminal={plan.inboundTerminal}
              color={C.blue}
            />
            <View style={s.pairArrow}>
              <View style={s.pairArrowLine} />
              <View style={s.pairArrowDot}>
                <Ionicons name="swap-horizontal" size={14} color={C.textMuted} />
              </View>
              <View style={s.pairArrowLine} />
            </View>
            <FlightChip
              label="Departing"
              flight={plan.outboundFlight}
              terminal={plan.outboundTerminal}
              color={C.orange}
            />
          </View>
        )}

        {/* ── Single flight ── */}
        {single && (
          <Section title={`${single.flightNumber} — ${single.airlineName}`} icon="airplane" color={C.blue}>
            <Text style={{ color: C.textSub, fontSize: 13 }}>{single.terminal.terminalFull}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
              <Pill icon="time-outline"  text={`~${single.walkMinutesToGate} min to gate`} color={C.blue} />
              {(single.terminal.amenities ?? []).slice(0,2).map((a, i) => (
                <Pill key={i} icon="star-outline" text={a} color={C.teal} />
              ))}
            </View>
          </Section>
        )}

        {/* ── Step-by-step route ── */}
        {plan && plan.steps && plan.steps.length > 0 && (
          <RouteSection steps={plan.steps} />
        )}

        {/* ── Alerts ── */}
        {(plan?.alerts?.length ?? 0) > 0 && (
          <Section title="Important Alerts" icon="warning-outline" color={C.yellow}>
            {plan!.alerts.map((alert, i) => (
              <AlertRow key={i} text={alert} />
            ))}
          </Section>
        )}

        {/* ── Lounge suggestion ── */}
        {plan?.loungeSuggestion && freeMin >= 40 && (
          <Section title="Recommended Lounge" icon="cafe-outline" color={C.purple}>
            <LoungeCard lounge={plan.loungeSuggestion} freeMin={freeMin} />
          </Section>
        )}

        {/* ── Food suggestion ── */}
        {plan?.foodSuggestion && freeMin >= 12 && (
          <Section title={plan.foodSuggestion.type === 'food' ? 'Where to Eat' : 'Coffee Stop'} icon={plan.foodSuggestion.type === 'food' ? 'restaurant-outline' : 'cafe-outline'} color={C.orange}>
            <FoodCard food={plan.foodSuggestion} />
          </Section>
        )}

        {/* ── All curated recs ── */}
        {(plan?.recommendations?.length ?? 0) > 0 && (
          <Section title="Smart Recommendations" icon="sparkles-outline" color={C.teal}>
            {plan!.recommendations.map(rec => (
              <RecCard key={rec.id} rec={rec} />
            ))}
          </Section>
        )}

        {/* ── Connection tips ── */}
        {(plan?.tips?.length ?? 0) > 0 && (
          <Section title="Terminal Tips" icon="bulb-outline" color={C.orange}>
            {plan!.tips.map((t, i) => (
              <TipRow key={i} text={t} icon="bulb-outline" color={C.orange} />
            ))}
          </Section>
        )}

        {/* ── Traveler social tips ── */}
        {tips.length > 0 && (
          <Section title="What Travelers Say" icon="chatbubbles-outline" color={C.green}>
            {tips.map(t => <SocialTipCard key={t.id} tip={t} />)}
          </Section>
        )}

        <TouchableOpacity style={s.resetBtn} onPress={reset}>
          <Ionicons name="refresh-outline" size={16} color={C.orange} />
          <Text style={s.resetText}>Search another flight</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Label({ text }: { text: string }) {
  return <Text style={s.label}>{text}</Text>;
}

function Pill({ icon, text, color }: { icon: any; text: string; color: string }) {
  return (
    <View style={[p.pill, { borderColor: color + '30', backgroundColor: color + '12' }]}>
      <Ionicons name={icon} size={11} color={color} />
      <Text style={[p.text, { color }]}>{text}</Text>
    </View>
  );
}
const p = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, marginRight: 6, marginTop: 6 },
  text: { fontSize: 11, fontWeight: '700' },
});

function Section({ title, icon, color, children }: { title: string; icon: any; color: string; children: any }) {
  return (
    <View style={sec.wrap}>
      <View style={sec.header}>
        <View style={[sec.iconBox, { backgroundColor: color + '18' }]}>
          <Ionicons name={icon} size={14} color={color} />
        </View>
        <Text style={sec.title}>{title}</Text>
      </View>
      <View style={sec.body}>{children}</View>
    </View>
  );
}
const sec = StyleSheet.create({
  wrap:    { backgroundColor: C.surface, borderRadius: 18, marginBottom: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  header:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  iconBox: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  title:   { fontSize: 14, fontWeight: '800', color: C.text, letterSpacing: -0.2 },
  body:    { padding: 14 },
});

function FlightChip({ label, flight, terminal, color }: { label: string; flight: string; terminal: string; color: string }) {
  return (
    <View style={[fc.card, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Text style={fc.label}>{label}</Text>
      <Text style={[fc.flight, { color }]}>{flight}</Text>
      <View style={[fc.termBadge, { backgroundColor: color + '18' }]}>
        <Text style={[fc.termText, { color }]}>T{terminal}</Text>
      </View>
    </View>
  );
}
const fc = StyleSheet.create({
  card:      { flex: 1, backgroundColor: C.surfaceHi, borderRadius: 16, padding: 14 },
  label:     { fontSize: 10, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  flight:    { fontSize: 20, fontWeight: '900', letterSpacing: -0.5, marginBottom: 8 },
  termBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  termText:  { fontSize: 13, fontWeight: '800' },
});

const STEP_ICONS: Record<string, any> = {
  deplane:  'exit-outline',
  walk:     'walk-outline',
  transfer: 'train-outline',
  customs:  'document-text-outline',
  security: 'shield-checkmark-outline',
  gate:     'location-outline',
  board:    'airplane-outline',
};

const STEP_COLORS: Record<string, string> = {
  deplane:  C.blue,
  walk:     C.green,
  transfer: C.orange,
  customs:  C.purple,
  security: C.red,
  gate:     C.teal,
  board:    C.blue,
};

function SmartStepRow({ step, index, isLast }: { step: RouteStep; index: number; isLast: boolean }) {
  const color    = STEP_COLORS[step.type] ?? C.teal;
  const ionIcon  = STEP_ICONS[step.type]  ?? 'navigate-outline';
  const title    = (step as any).title    ?? (step as any).instruction ?? '';
  const subtitle = (step as any).subtitle ?? (step as any).detail       ?? '';
  const minutes  = (step as any).durationMinutes ?? (step as any).minutes ?? 0;

  return (
    <View style={sr.wrapper}>
      {/* Left spine */}
      <View style={sr.spine}>
        <View style={[sr.iconCircle, { backgroundColor: color + '15', borderColor: color + '35' }]}>
          <Ionicons name={ionIcon} size={22} color={color} />
        </View>
        {!isLast && <View style={[sr.connector, { backgroundColor: color + '25' }]} />}
      </View>

      {/* Card */}
      <View style={[sr.card, { borderLeftColor: color }]}>
        <View style={sr.cardHeader}>
          <View style={[sr.stepBadge, { backgroundColor: color }]}>
            <Text style={sr.stepNum}>{index + 1}</Text>
          </View>
          {minutes > 0 && (
            <View style={[sr.durPill, { backgroundColor: color + '12' }]}>
              <Ionicons name="time-outline" size={11} color={color} />
              <Text style={[sr.durText, { color }]}>{minutes} min</Text>
            </View>
          )}
        </View>
        <Text style={sr.title}>{title}</Text>
        {subtitle.length > 0 && <Text style={sr.sub}>{subtitle}</Text>}
      </View>
    </View>
  );
}
const sr = StyleSheet.create({
  wrapper:    { flexDirection: 'row', gap: 12, marginBottom: 0 },
  spine:      { alignItems: 'center', width: 48 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  connector:  { flex: 1, width: 2, borderRadius: 1, marginVertical: 4, minHeight: 16 },
  card: {
    flex: 1, backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, borderLeftWidth: 3,
    padding: 14, marginBottom: 10,
    ...(Platform.OS === 'web' ? { boxShadow: '0 1px 6px rgba(0,0,0,0.05)' } as any : {}),
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  stepBadge:  { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  stepNum:    { fontSize: 11, fontWeight: '900', color: '#fff' },
  durPill:    { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
  durText:    { fontSize: 12, fontWeight: '800' },
  title:      { fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 4, letterSpacing: -0.2 },
  sub:        { fontSize: 13, color: C.textSub, lineHeight: 18 },
});

// ── Route Section — the star of the result screen ─────────────────────────────
function RouteSection({ steps }: { steps: RouteStep[] }) {
  const total = steps.reduce((s, st) => s + ((st as any).durationMinutes ?? (st as any).minutes ?? 0), 0);

  return (
    <View style={rts.wrap}>
      {/* Header */}
      <View style={rts.header}>
        <View style={[rts.iconBox, { backgroundColor: C.blue + '18' }]}>
          <Ionicons name="map-outline" size={14} color={C.blue} />
        </View>
        <Text style={rts.title}>Step-by-Step Route</Text>
        <View style={rts.totalPill}>
          <Ionicons name="time-outline" size={11} color={C.textMuted} />
          <Text style={rts.totalText}>{total} min total</Text>
        </View>
      </View>

      {/* Step count chips — horizontal strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={rts.chipStrip} contentContainerStyle={{ paddingHorizontal: 16, gap: 6, alignItems: 'center' }}>
        {steps.map((st, i) => {
          const color = STEP_COLORS[st.type] ?? C.teal;
          const icon  = STEP_ICONS[st.type]  ?? 'navigate-outline';
          return (
            <View key={st.id} style={[rts.chip, { backgroundColor: color + '12', borderColor: color + '30' }]}>
              <Ionicons name={icon} size={13} color={color} />
              <Text style={[rts.chipLabel, { color }]}>{i + 1}</Text>
              {i < steps.length - 1 && (
                <View style={[rts.chipArrow, { backgroundColor: color + '30' }]} />
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Step cards */}
      <View style={rts.stepsWrap}>
        {steps.map((step, i) => (
          <SmartStepRow key={step.id} step={step} index={i} isLast={i === steps.length - 1} />
        ))}
      </View>
    </View>
  );
}
const rts = StyleSheet.create({
  wrap:      { backgroundColor: C.surface, borderRadius: 18, marginBottom: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  header:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  iconBox:   { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  title:     { flex: 1, fontSize: 14, fontWeight: '800', color: C.text, letterSpacing: -0.2 },
  totalPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  totalText: { fontSize: 12, color: C.textMuted, fontWeight: '600' },
  chipStrip: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  chip:      { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  chipLabel: { fontSize: 11, fontWeight: '900' },
  chipArrow: { width: 6, height: 1.5, borderRadius: 1, marginLeft: 2 },
  stepsWrap: { padding: 14, paddingBottom: 6 },
});

function AlertRow({ text }: { text: string }) {
  return (
    <View style={al.row}>
      <Ionicons name="warning" size={14} color={C.yellow} />
      <Text style={al.text}>{text}</Text>
    </View>
  );
}
const al = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  text: { flex: 1, fontSize: 13, color: C.yellow, lineHeight: 18, fontWeight: '600' },
});

function TipRow({ text, icon, color }: { text: string; icon: any; color: string }) {
  return (
    <View style={tr.row}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={tr.text}>{text}</Text>
    </View>
  );
}
const tr = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  text: { flex: 1, fontSize: 13, color: C.textSub, lineHeight: 18 },
});

function LoungeCard({ lounge, freeMin }: { lounge: any; freeMin: number }) {
  return (
    <View style={lc.card}>
      <View style={lc.header}>
        <View style={lc.iconWrap}><Ionicons name="bed-outline" size={20} color={C.purple} /></View>
        <View style={{ flex: 1 }}>
          <Text style={lc.name}>{lounge.name}</Text>
          <Text style={lc.location}>{lounge.location}</Text>
        </View>
        <View style={lc.rating}>
          <Ionicons name="star" size={11} color={C.yellow} />
          <Text style={lc.ratingText}>{lounge.rating}</Text>
        </View>
      </View>
      {lounge.accessRequirement && (
        <View style={lc.access}>
          <Ionicons name="card-outline" size={12} color={C.purple} />
          <Text style={lc.accessText}>{lounge.accessRequirement}</Text>
        </View>
      )}
      <Text style={lc.timeNote}>~{lounge.timeNeeded} min visit · {freeMin} min available</Text>
    </View>
  );
}
const lc = StyleSheet.create({
  card:       { backgroundColor: C.bg, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)' },
  header:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  iconWrap:   { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(147,51,234,0.10)', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  name:       { fontSize: 14, fontWeight: '800', color: C.text, marginBottom: 2 },
  location:   { fontSize: 12, color: C.textSub },
  rating:     { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 13, fontWeight: '800', color: C.yellow },
  access:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(147,51,234,0.08)', borderRadius: 8, padding: 8, marginBottom: 8 },
  accessText: { fontSize: 12, color: C.purple, flex: 1 },
  timeNote:   { fontSize: 11, color: C.textMuted, fontWeight: '600' },
});

function FoodCard({ food }: { food: any }) {
  const color = food.type === 'food' ? C.orange : C.teal;
  return (
    <View style={[fdc.card, { borderColor: color + '25' }]}>
      <View style={fdc.header}>
        <View style={fdc.iconWrap}><Ionicons name={food.type === 'food' ? 'restaurant-outline' : 'cafe-outline'} size={18} color={color} /></View>
        <View style={{ flex: 1 }}>
          <Text style={fdc.name}>{food.name}</Text>
          <Text style={fdc.location}>{food.location}</Text>
        </View>
        <View style={fdc.rating}>
          <Ionicons name="star" size={11} color={C.yellow} />
          <Text style={fdc.ratingText}>{food.rating}</Text>
        </View>
      </View>
      <Text style={fdc.reason}>{food.reason}</Text>
      <Text style={[fdc.time, { color }]}>~{food.timeNeeded} min stop</Text>
    </View>
  );
}
const fdc = StyleSheet.create({
  card:       { backgroundColor: C.bg, borderRadius: 12, padding: 12, borderWidth: 1 },
  header:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 6 },
  iconWrap:   { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  name:       { fontSize: 14, fontWeight: '800', color: C.text, marginBottom: 2 },
  location:   { fontSize: 12, color: C.textSub },
  rating:     { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 13, fontWeight: '800', color: C.yellow },
  reason:     { fontSize: 12, color: C.textSub, lineHeight: 17, marginBottom: 6 },
  time:       { fontSize: 11, fontWeight: '700' },
});

function RecCard({ rec }: { rec: SmartRecommendation }) {
  const TYPE_COLORS: Record<SmartRecommendation['type'], string> = {
    lounge: C.purple, coffee: C.teal, food: C.orange,
    rest: C.blue, shop: C.green, wifi: C.yellow,
  };
  const color = TYPE_COLORS[rec.type] ?? C.textSub;
  return (
    <View style={[rc.card, { borderColor: color + '25' }]}>
      <View style={rc.top}>
        <View style={[rc.badge, { backgroundColor: color + '15' }]}>
          <Ionicons name={REC_ICONS[rec.type]} size={13} color={color} />
          <Text style={[rc.badgeType, { color }]}>{rec.type}</Text>
        </View>
        <View style={rc.ratingRow}>
          <Ionicons name="star" size={11} color={C.yellow} />
          <Text style={rc.ratingText}>{rec.rating}</Text>
        </View>
      </View>
      <Text style={rc.name}>{rec.name}</Text>
      <Text style={rc.location}>{rec.location}</Text>
      <Text style={rc.reason}>{rec.reason}</Text>
      {rec.tags.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          {rec.tags.slice(0,4).map(tag => (
            <View key={tag} style={[rc.tag, { backgroundColor: color + '12' }]}>
              <Text style={[rc.tagText, { color }]}>{tag}</Text>
            </View>
          ))}
        </ScrollView>
      )}
      <Text style={[rc.timeNote, { color: color }]}>~{rec.timeNeeded} min</Text>
    </View>
  );
}
const rc = StyleSheet.create({
  card:       { backgroundColor: C.bg, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1 },
  top:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge:      { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeIcon:  { fontSize: 13 },
  badgeType:  { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  ratingRow:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 13, fontWeight: '800', color: C.yellow },
  name:       { fontSize: 14, fontWeight: '800', color: C.text, marginBottom: 2 },
  location:   { fontSize: 12, color: C.textSub, marginBottom: 5 },
  reason:     { fontSize: 12, color: C.textSub, lineHeight: 17 },
  tag:        { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6 },
  tagText:    { fontSize: 10, fontWeight: '700' },
  timeNote:   { fontSize: 11, fontWeight: '700', marginTop: 6 },
});

function SocialTipCard({ tip }: { tip: SocialTip }) {
  const color = tipCategoryColor(tip.category);
  const icon  = tipCategoryIcon(tip.category);
  return (
    <View style={stc.card}>
      <View style={stc.top}>
        <View style={[stc.badge, { backgroundColor: color + '18' }]}>
          <Ionicons name={icon as any} size={12} color={color} />
          <Text style={[stc.cat, { color }]}>{tip.category}</Text>
        </View>
        <View style={stc.score}>
          <Ionicons name="arrow-up" size={10} color={C.textMuted} />
          <Text style={stc.scoreText}>{tip.score.toLocaleString()}</Text>
        </View>
      </View>
      <Text style={stc.title} numberOfLines={2}>{tip.title}</Text>
      {tip.snippet.length > 0 && <Text style={stc.snippet} numberOfLines={3}>{tip.snippet}</Text>}
      <Text style={stc.sub}>r/{tip.subreddit}</Text>
    </View>
  );
}
const stc = StyleSheet.create({
  card:      { backgroundColor: C.bg, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  top:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  badge:     { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  cat:       { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  score:     { flexDirection: 'row', alignItems: 'center', gap: 2 },
  scoreText: { fontSize: 11, color: C.textMuted, fontWeight: '600' },
  title:     { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 3, lineHeight: 18 },
  snippet:   { fontSize: 12, color: C.textSub, lineHeight: 17, marginBottom: 4 },
  sub:       { fontSize: 11, color: C.textMuted },
});

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  center: { alignItems: 'center', justifyContent: 'center', gap: 14 },

  // Entry
  entryScroll: { padding: 18, paddingBottom: 48 },

  header:         { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  headerIcon:     { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle:    { fontSize: 24, fontWeight: '900', color: C.text, letterSpacing: -0.5 },
  headerSub:      { fontSize: 13, color: C.textSub, marginTop: 2 },
  airportBadge:   { paddingHorizontal: 12, paddingVertical: 7 },
  airportBadgeText:{ fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },

  label: { fontSize: 13, fontWeight: '700', color: C.textSub, marginBottom: 7, marginTop: 16, letterSpacing: 0.2 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.surface, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1.5, borderColor: C.borderHi,
    ...(Platform.OS === 'web' ? { boxShadow: '0 1px 4px rgba(0,0,0,0.05)' } as any : {}),
  },
  inputText:  { flex: 1, fontSize: 15, color: C.text, fontWeight: '600' },
  flightFont: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },

  dropdown: {
    backgroundColor: C.surfaceHi, borderRadius: 14, marginTop: 4,
    borderWidth: 1, borderColor: C.borderHi, overflow: 'hidden',
  },
  dropItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  dropCode: { color: C.orange, fontWeight: '800', fontSize: 15, width: 42, paddingTop: 2 },
  dropName: { color: C.text, fontSize: 13, fontWeight: '600' },
  dropCity: { color: C.textMuted, fontSize: 11, marginTop: 1 },

  airportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10, marginBottom: 4 },
  airportChip: {
    alignItems: 'center', paddingHorizontal: 11, paddingVertical: 9,
    backgroundColor: C.surface, borderRadius: 16,
    borderWidth: 1.5, borderColor: C.border, minWidth: 62,
  },
  airportChipIcon: { marginBottom: 3 },
  airportChipCode: { fontSize: 12, fontWeight: '900', color: C.textSub, letterSpacing: 0.2 },
  airportChipCity: { fontSize: 8, color: C.textMuted, marginTop: 1 },

  toggleCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.surface, borderRadius: 14, padding: 14, marginTop: 18,
    borderWidth: 1, borderColor: C.border,
  },
  toggleLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  toggleDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: C.orange },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: C.text },
  toggleSub:   { fontSize: 11, color: C.textMuted, marginTop: 1 },

  metaRow:      { flexDirection: 'row', marginTop: 12 },
  metaCard:     { backgroundColor: C.surface, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.border },
  metaLabel:    { fontSize: 11, fontWeight: '700', color: C.textMuted, marginBottom: 8 },
  metaInputRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  metaInput:    { fontSize: 28, fontWeight: '900', color: C.orange, width: 70 },
  metaUnit:     { fontSize: 14, color: C.textMuted, fontWeight: '600' },
  metaSwitchRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaSwitchLabel: { fontSize: 12, color: C.textSub, flex: 1 },

  riskBanner:   { borderRadius: 14, padding: 14, marginTop: 14, borderWidth: 1 },
  riskLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 4 },
  riskLabel:    { fontSize: 15, fontWeight: '800' },
  riskSub:      { fontSize: 12, color: C.textSub },

  errorRow:  { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(220,38,38,0.07)', borderRadius: 12, padding: 12, marginTop: 12, borderWidth: 1, borderColor: 'rgba(220,38,38,0.25)' },
  errorText: { flex: 1, color: C.red, fontSize: 13, fontWeight: '600' },

  ctaBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 18, paddingVertical: 17, marginTop: 22 },
  ctaBtnText: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },

  demoRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, justifyContent: 'center' },
  demoChip:    { backgroundColor: C.surface, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: C.border },
  demoChipText:{ fontSize: 11, color: C.textMuted, fontWeight: '600' },

  // Loading
  loadingAirportBadge: { width: 90, height: 90, borderRadius: 24, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  loadingEmoji:        { fontSize: 44 },
  loadingTitle:        { fontSize: 18, fontWeight: '700', color: C.text },
  loadingSub:          { fontSize: 13, color: C.textMuted, textAlign: 'center', paddingHorizontal: 24 },

  // Result
  topBar:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:     { width: 36, height: 36, borderRadius: 11, backgroundColor: C.surfaceHi, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: C.text },
  riskPill:    { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  riskPillText:{ fontSize: 11, fontWeight: '800' },

  resultScroll: { padding: 14, paddingBottom: 48 },

  etaCard: {
    backgroundColor: C.surface, borderRadius: 20,
    padding: 20, marginBottom: 12, borderWidth: 1, borderColor: C.border,
    ...(Platform.OS === 'web' ? { boxShadow: '0 2px 12px rgba(0,0,0,0.07)' } as any : { elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 }),
  },
  etaRow:     { flexDirection: 'row', alignItems: 'center', gap: 16 },
  etaMain:    { alignItems: 'center', minWidth: 76 },
  etaBig:     { fontSize: 52, fontWeight: '900', lineHeight: 56, letterSpacing: -2 },
  etaUnit:    { fontSize: 12, color: C.textSub, fontWeight: '600', marginTop: 2 },
  etaDivider: { width: 1.5, height: 52, backgroundColor: C.border },
  etaInfo:    { flex: 1 },
  etaLabel:   { fontSize: 10, color: C.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  etaTerminal:{ fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  transferPill:{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, alignSelf: 'flex-start' },
  transferText:{ fontSize: 11, color: C.yellow, fontWeight: '700' },
  etaRisk:    { alignItems: 'center', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, gap: 4 },
  etaRiskText:{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },

  riskDescCard: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1 },
  riskDescText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },

  flightPair:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  pairArrow:     { alignItems: 'center', width: 28 },
  pairArrowLine: { flex: 1, width: 1.5, backgroundColor: C.border, minHeight: 20 },
  pairArrowDot:  { width: 24, height: 24, borderRadius: 12, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },

  resetBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: C.orange + '60', borderRadius: 16, paddingVertical: 14, marginTop: 8 },
  resetText: { color: C.orange, fontSize: 14, fontWeight: '800' },
});
