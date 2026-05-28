import { useState, useRef, useEffect } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  TextInput, Switch, Animated, Easing, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { CreateCrowdReportInput, CrowdReportType, ReportLocationType } from '../../types/models/crowdReport';
import { SEVERITY_LABELS } from '../../types/models/crowdReport';
import { severityColor } from '../../services/navigation/crowdDelayEngine';

// ── Preset shape ──────────────────────────────────────────

interface Preset {
  id:           string;
  label:        string;
  subLabel:     string;
  emoji:        string;
  type:         CrowdReportType;
  locationType: ReportLocationType;
  defaultSev:   1 | 2 | 3 | 4 | 5;
  color:        string;
}

// ── Props ─────────────────────────────────────────────────

interface Props {
  visible:      boolean;
  airportCode:  string;
  /** Pre-fill with the location label from the map pin drop / GPS */
  initialLocation?: string;
  /** Pre-select a report type (e.g. from a voice command) */
  initialType?: CrowdReportType;
  onSubmit:     (input: CreateCrowdReportInput) => Promise<void>;
  onClose:      () => void;
}

// ══════════════════════════════════════════════════════════

export function ReportSheet({ visible, airportCode, initialLocation = '', initialType, onSubmit, onClose }: Props) {
  const { t } = useTranslation();

  // Build presets inside the component so they react to language changes
  const PRESETS: Preset[] = [
    {
      id: 'security',
      label:       t('crowd.securityLabel'),
      subLabel:    t('crowd.securitySub'),
      emoji:       '🔴',
      type:        'security_slow',
      locationType:'security',
      defaultSev:  4,
      color:       '#f87171',
    },
    {
      id: 'gate',
      label:       t('crowd.gateLabel'),
      subLabel:    t('crowd.gateSub'),
      emoji:       '👥',
      type:        'crowded',
      locationType:'gate',
      defaultSev:  3,
      color:       '#fb923c',
    },
    {
      id: 'passport',
      label:       t('crowd.passportLabel'),
      subLabel:    t('crowd.passportSub'),
      emoji:       '🛂',
      type:        'customs_slow',
      locationType:'passport_control',
      defaultSev:  4,
      color:       '#f87171',
    },
    {
      id: 'elevator',
      label:       t('crowd.elevatorLabel'),
      subLabel:    t('crowd.elevatorSub'),
      emoji:       '⚠️',
      type:        'elevator_broken',
      locationType:'elevator',
      defaultSev:  3,
      color:       '#fbbf24',
    },
    {
      id: 'clear',
      label:       t('crowd.clearLabel'),
      subLabel:    t('crowd.clearSub'),
      emoji:       '✅',
      type:        'clear_path',
      locationType:'general',
      defaultSev:  1,
      color:       '#4ade80',
    },
  ];

  // ── State ─────────────────────────────────────────────────
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [severity,       setSeverity]       = useState<1|2|3|4|5>(3);
  const [locationLabel,  setLocationLabel]  = useState(initialLocation);
  const [description,    setDescription]    = useState('');
  const [isAnonymous,    setIsAnonymous]    = useState(true);
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [submitted,      setSubmitted]      = useState(false);

  // ── Slide-up animation ────────────────────────────────────
  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      // Auto-select preset when opened via voice command
      const presetMatch = initialType
        ? PRESETS.find(p => p.type === initialType) ?? null
        : null;

      setSelectedPreset(presetMatch);
      setSeverity(presetMatch?.defaultSev ?? 3);
      setLocationLabel(initialLocation);
      setDescription('');
      setIsAnonymous(true);
      setIsSubmitting(false);
      setSubmitted(false);

      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 20,
        stiffness: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, initialLocation, initialType]);

  // ── Handlers ──────────────────────────────────────────────
  const handlePresetPress = (preset: Preset) => {
    setSelectedPreset(preset);
    setSeverity(preset.defaultSev);
  };

  const handleSubmit = async () => {
    if (!selectedPreset || !locationLabel.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        airportCode,
        locationType:  selectedPreset.locationType,
        locationLabel: locationLabel.trim(),
        type:          selectedPreset.type,
        severity,
        description:   description.trim() || undefined,
        isAnonymous,
      });
      setSubmitted(true);
      setTimeout(onClose, 1_500);
    } catch {
      setIsSubmitting(false);
    }
  };

  const canSubmit = !!selectedPreset && locationLabel.trim().length >= 2 && !isSubmitting;

  // ── Render ─────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Backdrop */}
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* ── Success state ── */}
          {submitted ? (
            <View style={styles.successState}>
              <Text style={styles.successEmoji}>🎉</Text>
              <Text style={styles.successTitle}>{t('crowd.successTitle')}</Text>
              <Text style={styles.successSub}>{t('crowd.successSub')}</Text>
            </View>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>{t('crowd.reportTitle')}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color="#64748b" />
                </TouchableOpacity>
              </View>
              <Text style={styles.subtitle}>
                {t('crowd.whatHappening', { airport: '' })}
                <Text style={styles.airportChip}>{airportCode}</Text>
                {'?'}
              </Text>

              {/* ── Preset buttons ── */}
              <View style={styles.presetGrid}>
                {PRESETS.map((p) => {
                  const isSelected = selectedPreset?.id === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.presetBtn,
                        isSelected && { borderColor: p.color, backgroundColor: p.color + '18' },
                      ]}
                      onPress={() => handlePresetPress(p)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.presetEmoji}>{p.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.presetLabel, isSelected && { color: p.color }]}>
                          {p.label}
                        </Text>
                        <Text style={styles.presetSub}>{p.subLabel}</Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={16} color={p.color} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ── Location label ── */}
              <Text style={styles.sectionLabel}>{t('crowd.whereExactly')}</Text>
              <View style={styles.inputRow}>
                <Ionicons name="location-outline" size={18} color="#64748b" />
                <TextInput
                  style={styles.input}
                  placeholder={t('crowd.locationPlaceholder')}
                  placeholderTextColor="#475569"
                  value={locationLabel}
                  onChangeText={setLocationLabel}
                  returnKeyType="done"
                />
              </View>

              {/* ── Severity ── */}
              {selectedPreset && selectedPreset.id !== 'clear' && (
                <>
                  <Text style={styles.sectionLabel}>
                    {t('crowd.howBad')}{' '}
                    <Text style={{ color: severityColor(severity) }}>
                      {SEVERITY_LABELS[severity]}
                    </Text>
                  </Text>
                  <View style={styles.severityRow}>
                    {([1, 2, 3, 4, 5] as const).map((n) => (
                      <TouchableOpacity
                        key={n}
                        style={[
                          styles.sevBtn,
                          severity === n && { backgroundColor: severityColor(n), borderColor: severityColor(n) },
                        ]}
                        onPress={() => setSeverity(n)}
                      >
                        <Text style={[styles.sevNum, severity === n && styles.sevNumActive]}>{n}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.sevLabels}>
                    <Text style={styles.sevLabelText}>{t('crowd.severityMinor')}</Text>
                    <Text style={styles.sevLabelText}>{t('crowd.severitySevere')}</Text>
                  </View>
                </>
              )}

              {/* ── Optional description ── */}
              <Text style={styles.sectionLabel}>{t('crowd.addNote')}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t('crowd.notePlaceholder')}
                placeholderTextColor="#475569"
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
              />

              {/* ── Anonymous toggle ── */}
              <View style={styles.anonRow}>
                <View>
                  <Text style={styles.anonLabel}>{t('crowd.submitAnonymously')}</Text>
                  <Text style={styles.anonSub}>{t('crowd.anonymousSub')}</Text>
                </View>
                <Switch
                  value={isAnonymous}
                  onValueChange={setIsAnonymous}
                  trackColor={{ true: '#3b82f6', false: '#334155' }}
                  thumbColor="#f8fafc"
                />
              </View>

              {/* ── Submit ── */}
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  !canSubmit && styles.submitBtnDisabled,
                  selectedPreset && { backgroundColor: selectedPreset.color + 'dd' },
                ]}
                onPress={handleSubmit}
                disabled={!canSubmit}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="megaphone-outline" size={18} color="#fff" />
                    <Text style={styles.submitBtnText}>{t('crowd.submitReport')}</Text>
                  </>
                )}
              </TouchableOpacity>
              <View style={{ height: 24 }} />
            </ScrollView>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: 'flex-end', backgroundColor: '#000000aa' },
  sheet: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    maxHeight: '90%',
  },
  handle: { width: 40, height: 4, backgroundColor: '#334155', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },

  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12 },
  title:      { fontSize: 20, fontWeight: '800', color: '#f8fafc' },
  closeBtn:   { padding: 4 },
  subtitle:   { fontSize: 13, color: '#64748b', marginBottom: 20 },
  airportChip:{ color: '#60a5fa', fontWeight: '700' },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 16 },

  presetGrid: { gap: 8 },
  presetBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#334155',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  presetEmoji:  { fontSize: 22, width: 30 },
  presetLabel:  { fontSize: 14, fontWeight: '700', color: '#f8fafc' },
  presetSub:    { fontSize: 11, color: '#475569', marginTop: 2 },

  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0f172a', borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#334155' },
  input: {
    flex: 1, color: '#f8fafc', fontSize: 15, paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  textArea: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
    height: 80,
    textAlignVertical: 'top',
    flex: undefined,
  },

  severityRow:  { flexDirection: 'row', gap: 8 },
  sevBtn: {
    flex: 1, height: 40, borderRadius: 10,
    backgroundColor: '#0f172a', borderWidth: 1.5, borderColor: '#334155',
    alignItems: 'center', justifyContent: 'center',
  },
  sevNum:       { fontSize: 15, fontWeight: '700', color: '#64748b' },
  sevNumActive: { color: '#fff' },
  sevLabels:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  sevLabelText: { fontSize: 10, color: '#475569', fontWeight: '500' },

  anonRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  anonLabel:{ fontSize: 14, fontWeight: '600', color: '#f8fafc' },
  anonSub:  { fontSize: 12, color: '#475569', marginTop: 2 },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#3b82f6', borderRadius: 16, paddingVertical: 16, marginTop: 20,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText:     { color: '#fff', fontSize: 17, fontWeight: '800' },

  successState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  successEmoji: { fontSize: 52 },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#f8fafc' },
  successSub:   { fontSize: 14, color: '#64748b' },
});
