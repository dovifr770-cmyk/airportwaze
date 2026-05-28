// ── LanguagePicker — modal language selector ───────────────
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  I18nManager,
  Animated,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Updates from 'expo-updates';
import {
  SUPPORTED_LANGUAGES,
  RTL_LANGUAGES,
  changeLanguage,
  type SupportedLanguage,
} from '../../i18n';

interface Props {
  visible:  boolean;
  onClose:  () => void;
}

export function LanguagePicker({ visible, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const [changing, setChanging] = useState(false);

  const current = i18n.language as SupportedLanguage;

  async function handleSelect(code: SupportedLanguage) {
    if (code === current || changing) return;

    const willBeRTL  = RTL_LANGUAGES.includes(code);
    const wasRTL     = RTL_LANGUAGES.includes(current);
    const dirChange  = willBeRTL !== wasRTL;

    if (dirChange) {
      Alert.alert(
        t('languages.rtlNote').split('.')[0],          // short title
        t('languages.rtlNote'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: 'OK',
            onPress: async () => {
              setChanging(true);
              try {
                await changeLanguage(code);
                I18nManager.forceRTL(willBeRTL);
                // Reload the JS bundle so RTL direction change takes effect immediately.
                // In Expo Go (__DEV__) reloadAsync() is a no-op — user will see the change on next launch.
                try {
                  await Updates.reloadAsync();
                } catch {
                  onClose();
                }
              } catch {
                onClose();
              } finally {
                setChanging(false);
              }
            },
          },
        ],
      );
    } else {
      setChanging(true);
      try {
        await changeLanguage(code);
      } finally {
        setChanging(false);
        onClose();
      }
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('profile.selectLanguage')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.closeBtn}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>

          {/* Language options */}
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = lang.code === current;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.row, isSelected && styles.rowSelected]}
                onPress={() => handleSelect(lang.code)}
                disabled={changing}
              >
                <View style={styles.rowLeft}>
                  <Text style={styles.flag}>
                    {lang.code === 'en' ? '🇺🇸' : lang.code === 'he' ? '🇮🇱' : '🇪🇸'}
                  </Text>
                  <View>
                    <Text style={[styles.langLabel, isSelected && styles.langLabelSelected]}>
                      {lang.label}
                    </Text>
                    {lang.isRTL && (
                      <Text style={styles.rtlBadge}>RTL</Text>
                    )}
                  </View>
                </View>
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkText}>{t('languages.current')}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {/* RTL note */}
          <Text style={styles.note}>{t('languages.rtlNote')}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 360,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  closeBtn: {
    fontSize: 14,
    color: '#60a5fa',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#0f172a',
  },
  rowSelected: {
    backgroundColor: '#1e3a5f',
    borderWidth: 1,
    borderColor: '#60a5fa',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flag: {
    fontSize: 28,
  },
  langLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
  },
  langLabelSelected: {
    color: '#f1f5f9',
  },
  rtlBadge: {
    fontSize: 10,
    color: '#f59e0b',
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  checkBadge: {
    backgroundColor: '#60a5fa',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  checkText: {
    fontSize: 11,
    color: '#0f172a',
    fontWeight: '700',
  },
  note: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
});
