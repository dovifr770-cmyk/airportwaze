// ═══════════════════════════════════════════════════════════
// VoiceAssistantButton
// Floating Action Button for the hands-free voice assistant.
//
// Three visual states:
//   idle       — mic icon, dark background, subtle shadow
//   listening  — pulsing animated ring, accent color
//   processing — activity spinner
//
// Position: absolute bottom-right, above the tab bar.
// The <VoiceCommandFeedback> toast sits above this button.
// ═══════════════════════════════════════════════════════════

import React, {
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  StyleSheet,
  Easing,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import type { VoiceState, VoiceCommand } from '../../types/models/voice';
import { VoiceCommandFeedback } from './VoiceCommandFeedback';

// ── Props ─────────────────────────────────────────────────────

export interface VoiceAssistantButtonProps {
  voiceState:  VoiceState;
  partialText: string;
  lastCommand: VoiceCommand | null;
  errorMessage: string | null;
  onToggle:    () => void;
  onDismiss:   () => void;
  /** Extra bottom offset (e.g. to float above a bottom sheet). Default 0 */
  bottomOffset?: number;
}

// ── Pulse animation ───────────────────────────────────────────

function usePulseAnimation(active: boolean) {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scale,   { toValue: 1.9, duration: 800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0,   duration: 800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scale,   { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
          ]),
        ]),
      );
      opacity.setValue(0.5);
      loop.start();
      return () => loop.stop();
    } else {
      scale.setValue(1);
      opacity.setValue(0);
    }
  }, [active, scale, opacity]);

  return { scale, opacity };
}

// ── Idle breathe animation (subtle life to the button) ────────

function useBreatheAnimation() {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.04, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,    duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);

  return scale;
}

// ── Component ─────────────────────────────────────────────────

export function VoiceAssistantButton({
  voiceState,
  partialText,
  lastCommand,
  errorMessage,
  onToggle,
  onDismiss,
  bottomOffset = 0,
}: VoiceAssistantButtonProps) {
  const { t } = useTranslation();

  const isListening  = voiceState === 'listening';
  const isProcessing = voiceState === 'processing';
  const isError      = voiceState === 'error';

  const pulse   = usePulseAnimation(isListening);
  const breathe = useBreatheAnimation();

  // ── Derived styles ──────────────────────────────────────────

  const btnBg = isError
    ? '#7f1d1d'
    : isListening
      ? '#1d4ed8'
      : '#1e293b';

  const ringColor = isListening ? '#3b82f6' : 'transparent';

  // ── Accessibility label ─────────────────────────────────────

  const a11yLabel = isListening
    ? t('voice.stopListening', 'Stop listening')
    : t('voice.tapToSpeak', 'Tap to speak');

  return (
    <View
      style={[styles.container, { bottom: 16 + bottomOffset }]}
      pointerEvents="box-none"
    >
      {/* Feedback toast above the FAB */}
      <VoiceCommandFeedback
        voiceState={voiceState}
        partialText={partialText}
        lastCommand={lastCommand}
        errorMessage={errorMessage}
        onDismiss={onDismiss}
      />

      {/* Hint text — only shown in idle state */}
      {voiceState === 'idle' && (
        <Text style={styles.hint} numberOfLines={1}>
          {t('voice.hint', 'Say "Take me to gate C4"')}
        </Text>
      )}

      {/* FAB wrapper: breathing scale in idle, static otherwise */}
      <Animated.View
        style={[
          styles.fabWrap,
          voiceState === 'idle' && { transform: [{ scale: breathe }] },
        ]}
      >
        {/* Pulse ring — rendered behind the button */}
        <Animated.View
          style={[
            styles.pulseRing,
            {
              borderColor:  ringColor,
              transform:    [{ scale: pulse.scale }],
              opacity:      pulse.opacity,
            },
          ]}
          pointerEvents="none"
        />

        {/* Main FAB */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: btnBg }]}
          onPress={onToggle}
          activeOpacity={0.85}
          accessible
          accessibilityLabel={a11yLabel}
          accessibilityRole="button"
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : isError ? (
            <Ionicons name="warning-outline" size={26} color="#fca5a5" />
          ) : isListening ? (
            <Ionicons name="stop-circle-outline" size={28} color="#fff" />
          ) : (
            <Ionicons name="mic" size={26} color="#94a3b8" />
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────

const FAB_SIZE = 58;
const RING_EXTRA = 20; // how much larger the pulse ring is than the FAB

const styles = StyleSheet.create({
  container: {
    position:       'absolute',
    right:          20,
    alignItems:     'center',
    zIndex:         999,
    // Let touch events pass through the container to content below
  },

  hint: {
    fontSize:        11,
    color:           '#475569',
    fontWeight:      '500',
    marginBottom:    8,
    textAlign:       'center',
    maxWidth:        180,
  },

  fabWrap: {
    width:           FAB_SIZE,
    height:          FAB_SIZE,
    alignItems:      'center',
    justifyContent:  'center',
  },

  pulseRing: {
    position:        'absolute',
    width:           FAB_SIZE + RING_EXTRA,
    height:          FAB_SIZE + RING_EXTRA,
    borderRadius:    (FAB_SIZE + RING_EXTRA) / 2,
    borderWidth:     2,
    top:             -(RING_EXTRA / 2),
    left:            -(RING_EXTRA / 2),
  },

  fab: {
    width:           FAB_SIZE,
    height:          FAB_SIZE,
    borderRadius:    FAB_SIZE / 2,
    alignItems:      'center',
    justifyContent:  'center',
    // Shadow (iOS)
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.35,
    shadowRadius:    8,
    // Elevation (Android)
    elevation:       8,
  },
});
