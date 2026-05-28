import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../src/stores/authStore';
import { LanguagePicker } from '../../../src/components/ui/LanguagePicker';

export default function ProfileScreen() {
  const { t, i18n }       = useTranslation();
  const { user, signOut } = useAuthStore();
  const [langPickerOpen, setLangPickerOpen] = useState(false);

  const handleSignOut = () => {
    Alert.alert(t('profile.signOutTitle'), t('profile.signOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.signOut'),
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  // Label shown for current language in the row value
  const currentLangLabel =
    i18n.language === 'he' ? 'עברית' :
    i18n.language === 'es' ? 'Español' :
    'English';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.fullName?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={styles.name}>{user?.fullName ?? t('dashboard.defaultUser')}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Settings rows */}
        <Text style={styles.sectionTitle}>{t('profile.preferences')}</Text>
        <SettingRow
          icon="walk"
          label={t('profile.navigationMode')}
          value={user?.settings.navigationMode ?? 'walking'}
        />
        <SettingRow
          icon="notifications"
          label={t('profile.gateAlerts')}
          value={user?.settings.notifyGateChanges ? t('profile.on') : t('profile.off')}
        />
        <SettingRow
          icon="time"
          label={t('profile.delayThreshold')}
          value={t('profile.minuteThreshold', { count: user?.settings.delayThresholdMinutes ?? 30 })}
        />
        <SettingRow
          icon="globe"
          label={t('profile.units')}
          value={user?.settings.units ?? 'metric'}
        />

        {/* Language row — tappable */}
        <TouchableOpacity
          style={styles.row}
          onPress={() => setLangPickerOpen(true)}
          activeOpacity={0.75}
        >
          <Ionicons name="language-outline" size={18} color="#60a5fa" style={styles.rowIcon} />
          <Text style={styles.rowLabel}>{t('profile.language')}</Text>
          <Text style={styles.rowValue}>{currentLangLabel}</Text>
          <Ionicons name="chevron-forward" size={14} color="#475569" style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>{t('profile.savedAirports')}</Text>
        {(user?.preferredAirports ?? []).length > 0 ? (
          user!.preferredAirports.map((code) => (
            <SettingRow key={code} icon="airplane" label={code} value="" />
          ))
        ) : (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>{t('profile.noAirports')}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#f87171" />
          <Text style={styles.signOutText}>{t('profile.signOut')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Language picker modal */}
      <LanguagePicker
        visible={langPickerOpen}
        onClose={() => setLangPickerOpen(false)}
      />
    </SafeAreaView>
  );
}

function SettingRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color="#60a5fa" style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0f172a' },
  scroll:       { padding: 20, paddingBottom: 40 },
  avatarSection:{ alignItems: 'center', marginBottom: 36 },
  avatar:       {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#1d4ed8', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText:   { fontSize: 32, fontWeight: '800', color: '#fff' },
  name:         { fontSize: 22, fontWeight: '700', color: '#f8fafc', marginBottom: 4 },
  email:        { fontSize: 14, color: '#64748b' },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: '#475569',
    letterSpacing: 0.8, textTransform: 'uppercase',
    marginBottom: 8, marginTop: 20,
  },
  row: {
    backgroundColor: '#1e293b', borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 8,
  },
  rowIcon:      { marginRight: 14 },
  rowLabel:     { flex: 1, color: '#cbd5e1', fontSize: 15 },
  rowValue:     { color: '#64748b', fontSize: 14, textTransform: 'capitalize' },
  emptyRow:     { backgroundColor: '#1e293b', borderRadius: 14, padding: 16, marginBottom: 8 },
  emptyText:    { color: '#334155', fontSize: 14 },
  signOutBtn:   {
    marginTop: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#7f1d1d', borderRadius: 14, padding: 16,
  },
  signOutText:  { color: '#f87171', fontWeight: '700', fontSize: 16 },
});
