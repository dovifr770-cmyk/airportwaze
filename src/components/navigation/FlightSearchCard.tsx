import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface Props {
  onSearch: (inbound: string, outbound: string, date: string) => void;
  isLoading?: boolean;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function FlightSearchCard({ onSearch, isLoading }: Props) {
  const { t } = useTranslation();
  const [inbound,  setInbound]  = useState('');
  const [outbound, setOutbound] = useState('');
  const [date,     setDate]     = useState(todayISO());

  const canSearch = inbound.trim().length >= 2 && outbound.trim().length >= 2;

  const handleSwap = () => {
    setInbound(outbound);
    setOutbound(inbound);
  };

  const handleSearch = () => {
    if (!canSearch) return;
    onSearch(inbound.trim(), outbound.trim(), date);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t('navigate.searchTitle')}</Text>

      {/* Inbound */}
      <View style={styles.inputGroup}>
        <View style={[styles.iconBadge, { backgroundColor: '#1e3a5f' }]}>
          <Ionicons name="airplane-outline" size={16} color="#60a5fa" style={{ transform: [{ rotate: '90deg' }] }} />
        </View>
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>{t('navigate.arrivingFlight')}</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. UA 123"
            placeholderTextColor="#475569"
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="next"
            value={inbound}
            onChangeText={setInbound}
          />
        </View>
      </View>

      {/* Swap button */}
      <TouchableOpacity style={styles.swapBtn} onPress={handleSwap}>
        <Ionicons name="swap-vertical" size={18} color="#60a5fa" />
      </TouchableOpacity>

      {/* Outbound */}
      <View style={styles.inputGroup}>
        <View style={[styles.iconBadge, { backgroundColor: '#14532d' }]}>
          <Ionicons name="airplane" size={16} color="#4ade80" style={{ transform: [{ rotate: '-45deg' }] }} />
        </View>
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>{t('navigate.departingFlight')}</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. DL 456"
            placeholderTextColor="#475569"
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
            value={outbound}
            onChangeText={setOutbound}
            onSubmitEditing={handleSearch}
          />
        </View>
      </View>

      {/* Date */}
      <View style={styles.inputGroup}>
        <View style={[styles.iconBadge, { backgroundColor: '#1e293b' }]}>
          <Ionicons name="calendar-outline" size={16} color="#94a3b8" />
        </View>
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>{t('navigate.datePlaceholder')}</Text>
          <TextInput
            style={styles.input}
            placeholder={todayISO()}
            placeholderTextColor="#475569"
            keyboardType="numbers-and-punctuation"
            returnKeyType="done"
            value={date}
            onChangeText={setDate}
          />
        </View>
      </View>

      {/* Demo shortcut */}
      <TouchableOpacity
        style={styles.demoBtn}
        onPress={() => { setInbound('MOCK'); setOutbound('MOCK'); }}
      >
        <Ionicons name="flask-outline" size={13} color="#a78bfa" />
        <Text style={styles.demoBtnText}>{t('navigate.loadDemo')}</Text>
      </TouchableOpacity>

      {/* Search */}
      <TouchableOpacity
        style={[styles.searchBtn, (!canSearch || isLoading) && styles.searchBtnDisabled]}
        onPress={handleSearch}
        disabled={!canSearch || isLoading}
        activeOpacity={0.85}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="navigate" size={18} color="#fff" />
            <Text style={styles.searchBtnText}>{t('navigate.findRoute')}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card:            { backgroundColor: '#1e293b', borderRadius: 20, padding: 20 },
  cardTitle:       { fontSize: 14, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 20 },
  inputGroup:      { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBadge:       { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  inputWrap:       { flex: 1 },
  inputLabel:      { fontSize: 11, color: '#475569', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    borderWidth: 1,
    borderColor: '#334155',
  },
  swapBtn: {
    alignSelf: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 8,
    marginVertical: -4,
    zIndex: 1,
    borderWidth: 1,
    borderColor: '#334155',
  },
  demoBtn:         { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', marginTop: 4, marginBottom: 16 },
  demoBtnText:     { color: '#a78bfa', fontSize: 12, fontWeight: '600' },
  searchBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  searchBtnDisabled: { opacity: 0.45 },
  searchBtnText:     { color: '#fff', fontSize: 16, fontWeight: '700' },
});
