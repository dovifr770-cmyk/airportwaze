// ═══════════════════════════════════════════════════════════
// VoiceCommandFeedback
// Animated pill that appears above the FAB to show:
//   • Partial transcript while listening
//   • "Processing…" while parsing
//   • Recognized intent + entity summary
//   • Error message
//
// Fades in on appearance, fades out when dismissed.
// ═══════════════════════════════════════════════════════════

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import type { VoiceState, VoiceCommand, VoiceIntent } from '../../types/models/voice';

// ── Intent display metadata ───────────────────────────────────

const INTENT_META: Record<
  VoiceIntent,
  { icon: string; color: string; labelKey: string }
> = {
  NAVIGATE_TO_GATE: { icon: 'navigate',           color: '#3b82f6', labelKey: 'voice.intentNavigate'  },
  FIND_GATE:        { icon: 'location-outline',    color: '#60a5fa', labelKey: 'voice.intentFindGate'  },
  REPORT_SECURITY:  { icon: 'shield-outline',      color: '#fb923c', labelKey: 'voice.intentSecurity'  },
  REPORT_CROWD:     { icon: 'people-outline',      color: '#fb923c', labelKey: 'voice.intentCrowd'     },
  REPORT_ELEVATOR:  { icon: 'construct-outline',   color: '#fb923c', labelKey: 'voice.intentElevator'  },
  REPORT_CLEAR:     { icon: 'checkmark-circle-outline', color: '#34d399', labelKey: 'voice.intentClear' },
  FIND_RESTROOM:    { icon: 'water-outline',       color: '#a78bfa', labelKey: 'voice.intentRestroom'  },
  FIND_FOOD:        { icon: 'restaurant-outline',  color: '#fbbf24', labelKey: 'voice.intentFood'      },
  FIND_LOUNGE:      { icon: 'cafe-outline',        color: '#c084fc', labelKey: 'voice.intentLounge'    },
  CHECK_FLIGHT:     { icon: 'airplane-outline',    color: '#38bdf8', labelKey: 'voice.intentFlight'    },
  CANCEL:           { icon: 'close-circle-outline',color: '#64748b', labelKey: 'voice.intentCancel'    },
  UNKNOWN:          { icon: 'help-circle-outline', color: '#ef4444', labelKey: 'voice.intentUnknown'   },
};

// ── Props ─────────────────────────────────────────────────────

interface Props {
  voiceState:   VoiceState;
  partialText:  string;
  lastCommand:  VoiceCommand | null;
  errorMessage: string | null;
  onDismiss:    () => void;
}

// ── Component ─────────────────────────────────────────────────

export function VoiceCommandFeedback({
  voiceState,
  partialText,
  lastCommand,
  errorMessage,
  onDismiss,
}: Props) {
  const { t } = useTranslation();
  const opacity = useRef(new Animated.Value(0)).current;

  // Determine visibility
  const shouldShow =
    voiceState === 'listening'  ||
    voiceState === 'processing' ||
    voiceState === 'error'      ||
    (voiceState === 'idle' && !!lastCommand);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue:         shouldShow ? 1 : 0,
      duration:        200,
      useNativeDriver: true,
    }).start();
  }, [shouldShow, opacity]);

  if (!shouldShow && !lastCommand && !errorMessage) return null;

  // ── Content derivation ────────────────────────────────────

  let content: React.ReactNode = null;

  if (voiceState === 'error' && errorMessage) {
    content = (
      <View style={styles.row}>
        <Ionicons name="warning-outline" size={16} color="#f87171" />
        <Text style={[styles.mainText, { color: '#f87171' }]} numberOfLines={2}>
          {errorMessage}
        </Text>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={16} color="#64748b" />
        </TouchableOpacity>
      </View>
    );
  } else if (voiceState === 'listening') {
    content = (
      <View style={styles.row}>
        {/* Animated dots */}
        <Ionicons name="mic" size={14} color="#3b82f6" />
        <Text style={[styles.mainText, { color: '#93c5fd', flex: 1 }]} numberOfLines={1}>
          {partialText || t('voice.listening', 'Listening…')}
        </Text>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="stop-circle-outline" size={16} color="#64748b" />
        </TouchableOpacity>
      </View>
    );
  } else if (voiceState === 'processing') {
    content = (
      <View style={styles.row}>
        <Ionicons name="hourglass-outline" size={14} color="#94a3b8" />
        <Text style={[styles.mainText, { color: '#94a3b8' }]}>
          {t('voice.processing', 'Processing…')}
        </Text>
      </View>
    );
  } else if (lastCommand) {
    const meta    = INTENT_META[lastCommand.intent];
    const isError = lastCommand.intent === 'UNKNOWN';

    // Build subtitle: gate entity, flight, etc.
    let subtitle = '';
    if (lastCommand.entities.gate)         subtitle = `Gate ${lastCommand.entities.gate}`;
    else if (lastCommand.entities.flightNumber) subtitle = lastCommand.entities.flightNumber;
    else if (lastCommand.entities.locationLabel) subtitle = lastCommand.entities.locationLabel;

    content = (
      <View style={styles.row}>
        <Ionicons name={meta.icon as any} size={16} color={meta.color} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.mainText, { color: isError ? '#f87171' : '#f8fafc' }]} numberOfLines={1}>
            {t(meta.labelKey, meta.labelKey)}
            {subtitle ? ` — ${subtitle}` : ''}
          </Text>
          {isError && (
            <Text style={styles.subText}>
              {t('voice.tryAgain', 'Tap the mic and try again')}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={16} color="#475569" />
        </TouchableOpacity>
      </View>
    );
  }

  if (!content) return null;

  return (
    <Animated.View style={[styles.pill, { opacity }]} pointerEvents="box-none">
      {content}
    </Animated.View>
  );
}

// ── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pill: {
    backgroundColor: '#0f172a',
    borderRadius:    16,
    paddingHorizontal: 14,
    paddingVertical:   10,
    marginBottom:    10,
    maxWidth:        280,
    borderWidth:     1,
    borderColor:     '#1e293b',
    // Shadow (iOS)
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.4,
    shadowRadius:    6,
    elevation:       5,
  },
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            8,
  },
  mainText: {
    fontSize:    13,
    fontWeight:  '600',
    color:       '#f8fafc',
  },
  subText: {
    fontSize:    11,
    color:       '#64748b',
    marginTop:   2,
  },
});
