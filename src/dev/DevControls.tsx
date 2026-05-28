/**
 * DevControls — floating dev panel visible only in __DEV__ mode.
 *
 * Usage: tap the "⚙ DEV" chip 1× to open, tap outside to close.
 * Shows scenario shortcuts for the Navigate tab + crowd-report toggles.
 */

import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ScrollView, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons }  from '@expo/vector-icons';
import { MOCK_CONNECTIONS } from './mockData';

interface Props {
  /** Pass the currently selected airport code to show context */
  airportCode?: string;
}

export function DevControls({ airportCode = 'JFK' }: Props) {
  const [open, setOpen] = useState(false);
  const router          = useRouter();

  if (!__DEV__) return null;

  const navigateTo = (inbound: string, outbound: string, date: string) => {
    setOpen(false);
    router.push({
      pathname: '/(tabs)/navigate/dashboard',
      params:   { inbound, outbound, date },
    });
  };

  return (
    <>
      {/* Floating trigger chip */}
      <TouchableOpacity style={styles.chip} onPress={() => setOpen(true)}>
        <Ionicons name="bug-outline" size={12} color="#a78bfa" />
        <Text style={styles.chipText}>DEV</Text>
      </TouchableOpacity>

      {/* Panel modal */}
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaView style={styles.overlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setOpen(false)}
          />

          <View style={styles.panel}>
            {/* Header */}
            <View style={styles.header}>
              <Ionicons name="bug-outline" size={18} color="#a78bfa" />
              <Text style={styles.title}>Dev Controls</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>Airport: {airportCode} · Mock data active</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* ── Navigate scenarios ── */}
              <Text style={styles.sectionLabel}>Connection scenarios</Text>
              {MOCK_CONNECTIONS.map((c) => {
                const scenarioColors: Record<string, { bg: string; text: string }> = {
                  safe:    { bg: '#14532d', text: '#4ade80' },
                  tight:   { bg: '#7c2d12', text: '#fb923c' },
                  at_risk: { bg: '#7f1d1d', text: '#f87171' },
                };
                const col = scenarioColors[c.scenario];
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.scenarioRow}
                    onPress={() => navigateTo(c.inboundNum, c.outboundNum, c.date)}
                  >
                    <View style={[styles.scenarioBadge, { backgroundColor: col.bg }]}>
                      <Text style={[styles.scenarioBadgeText, { color: col.text }]}>
                        {c.scenario.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.scenarioLabel}>{c.label}</Text>
                      <Text style={styles.scenarioSub}>
                        Tap to load on Navigate dashboard
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#475569" />
                  </TouchableOpacity>
                );
              })}

              {/* ── Demo shortcut ── */}
              <Text style={styles.sectionLabel}>Quick demo (MOCK keyword)</Text>
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => navigateTo('MOCK', 'MOCK', new Date().toISOString().slice(0, 10))}
              >
                <Ionicons name="flask-outline" size={16} color="#a78bfa" />
                <Text style={styles.demoBtnText}>
                  Load MOCK route (JFK T4 B12 → C3, 7 steps)
                </Text>
              </TouchableOpacity>

              {/* ── Screen shortcuts ── */}
              <Text style={styles.sectionLabel}>Screen shortcuts</Text>
              {[
                { label: 'Maps  →  Alerts tab',     screen: '/(tabs)/maps'    as any },
                { label: 'Navigate  →  Search',     screen: '/(tabs)/navigate' as any },
                { label: 'Parking',                  screen: '/(tabs)/parking'  as any },
                { label: 'Dashboard',                screen: '/(tabs)'          as any },
              ].map(({ label, screen }) => (
                <TouchableOpacity
                  key={screen}
                  style={styles.linkRow}
                  onPress={() => { setOpen(false); router.push(screen); }}
                >
                  <Ionicons name="navigate-outline" size={14} color="#64748b" />
                  <Text style={styles.linkText}>{label}</Text>
                </TouchableOpacity>
              ))}

              {/* ── Info ── */}
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  This panel is stripped from production builds.{'\n'}
                  Set EXPO_PUBLIC_APP_ENV=production to disable it.
                </Text>
              </View>

              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#1a1535', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: '#4c1d95',
  },
  chipText: { fontSize: 10, fontWeight: '800', color: '#a78bfa' },

  overlay: { flex: 1, justifyContent: 'flex-end' },
  panel: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
    borderTopWidth: 1, borderColor: '#1e293b',
  },
  header:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  title:    { flex: 1, fontSize: 17, fontWeight: '800', color: '#f8fafc' },
  subtitle: { fontSize: 12, color: '#475569', marginBottom: 16 },

  sectionLabel: { fontSize: 10, fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 18, marginBottom: 8 },

  scenarioRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 8 },
  scenarioBadge:     { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  scenarioBadgeText: { fontSize: 10, fontWeight: '800' },
  scenarioLabel:     { fontSize: 13, fontWeight: '600', color: '#f8fafc' },
  scenarioSub:       { fontSize: 11, color: '#475569', marginTop: 2 },

  demoBtn:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1a1535', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#4c1d95' },
  demoBtnText: { flex: 1, fontSize: 13, color: '#a78bfa', fontWeight: '600' },

  linkRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  linkText: { flex: 1, fontSize: 13, color: '#64748b' },

  infoBox:  { backgroundColor: '#1e293b', borderRadius: 10, padding: 12, marginTop: 20 },
  infoText: { fontSize: 11, color: '#334155', lineHeight: 17 },
});
