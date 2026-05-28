// ═══════════════════════════════════════════════════════════
// useVoiceAssistant
// Thin state-machine wrapper around @react-native-voice/voice
// + expo-speech TTS.  Pure React hook — no side effects beyond
// the mic and speaker.
//
// Compatibility note:
//   @react-native-voice/voice requires a custom dev-client build
//   (or bare workflow). It will NOT work inside Expo Go.
//   See: https://github.com/react-native-voice/voice
// ═══════════════════════════════════════════════════════════

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { Platform, PermissionsAndroid } from 'react-native';

// Graceful fallback when native module is not linked (e.g. Expo Go)
let Voice: any = null;
try {
  Voice = require('@react-native-voice/voice').default;
} catch {
  // Not available in Expo Go — all voice features will silently no-op
}
import * as Speech from 'expo-speech';

import { parseVoiceCommand } from '../services/voice/voiceCommandParser';
import type {
  VoiceState,
  VoiceCommand,
  VoiceAssistantReturn,
} from '../types/models/voice';

// ── Constants ────────────────────────────────────────────────

/** Auto-clear lastCommand N ms after it fires */
const COMMAND_TTL_MS = 8_000;
/** Safety stop if onSpeechEnd never fires */
const LISTEN_TIMEOUT_MS = 12_000;

// ── Microphone permission ─────────────────────────────────────

async function requestMicPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    // iOS: permission declared in app.json infoPlist;
    // the system prompt appears automatically on first mic access.
    return true;
  }
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    {
      title:         'Microphone Permission',
      message:       'AirportWaze needs microphone access for voice commands.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

// ── Hook options ──────────────────────────────────────────────

export interface UseVoiceAssistantOptions {
  /**
   * BCP-47 locale hint for the recogniser.
   * Maps from i18n language code: en → 'en-US', he → 'he-IL', es → 'es-ES'.
   */
  locale?: string;
  /** Whether to play expo-speech TTS confirmations (default: true) */
  ttsEnabled?: boolean;
  /**
   * Called synchronously once a command is parsed.
   * Use this to trigger navigation, open modals, etc.
   */
  onCommand?: (cmd: VoiceCommand) => void;
}

// ── TTS confirmation builder ──────────────────────────────────

function buildConfirmation(cmd: VoiceCommand): string {
  switch (cmd.intent) {
    case 'NAVIGATE_TO_GATE':
      return cmd.entities.gate
        ? `Routing to Gate ${cmd.entities.gate}`
        : 'Opening route planner';
    case 'FIND_GATE':
      return cmd.entities.gate
        ? `Locating Gate ${cmd.entities.gate} on the map`
        : 'Showing gates on map';
    case 'REPORT_SECURITY':
      return 'Opening security report';
    case 'REPORT_CROWD':
      return 'Opening crowd report';
    case 'REPORT_ELEVATOR':
      return 'Opening elevator report';
    case 'REPORT_CLEAR':
      return 'Submitting all-clear report';
    case 'FIND_RESTROOM':
      return 'Highlighting restrooms on the map';
    case 'FIND_FOOD':
      return 'Showing food options near you';
    case 'FIND_LOUNGE':
      return 'Locating airport lounges';
    case 'CHECK_FLIGHT':
      return cmd.entities.flightNumber
        ? `Checking status of flight ${cmd.entities.flightNumber}`
        : 'Opening flight status';
    case 'CANCEL':
      return 'Cancelled';
    default:
      return "Sorry, I didn't understand that. Please try again.";
  }
}

// ── Hook ──────────────────────────────────────────────────────

export function useVoiceAssistant(
  options: UseVoiceAssistantOptions = {},
): VoiceAssistantReturn {
  const {
    locale     = 'en-US',
    ttsEnabled = true,
    onCommand,
  } = options;

  const [voiceState,    setVoiceState]    = useState<VoiceState>('idle');
  const [partialText,   setPartialText]   = useState('');
  const [lastCommand,   setLastCommand]   = useState<VoiceCommand | null>(null);
  const [errorMessage,  setErrorMessage]  = useState<string | null>(null);

  // Use refs for mutable values that shouldn't re-trigger the event registration
  const localeRef      = useRef(locale);
  const ttsEnabledRef  = useRef(ttsEnabled);
  const onCommandRef   = useRef(onCommand);
  const clearCmdTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listenTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isListeningRef = useRef(false);

  // Keep refs in sync with latest props
  useEffect(() => { localeRef.current     = locale;     }, [locale]);
  useEffect(() => { ttsEnabledRef.current = ttsEnabled; }, [ttsEnabled]);
  useEffect(() => { onCommandRef.current  = onCommand;  }, [onCommand]);

  // ── Helpers ──────────────────────────────────────────────────

  const clearListenTimer = useCallback(() => {
    if (listenTimer.current) {
      clearTimeout(listenTimer.current);
      listenTimer.current = null;
    }
  }, []);

  const scheduleCommandClear = useCallback(() => {
    if (clearCmdTimer.current) clearTimeout(clearCmdTimer.current);
    clearCmdTimer.current = setTimeout(() => {
      setLastCommand(null);
    }, COMMAND_TTL_MS);
  }, []);

  const speak = useCallback((text: string) => {
    if (!ttsEnabledRef.current) return;
    Speech.stop();
    Speech.speak(text, { language: localeRef.current, rate: 0.9, pitch: 1.0 });
  }, []);

  // ── Voice event setup (register once, use refs for latest callbacks) ──

  useEffect(() => {
    if (!Voice) return; // Native module not available (e.g. Expo Go)

    Voice.onSpeechStart = () => {
      isListeningRef.current = true;
      setVoiceState('listening');
      setPartialText('');
      setErrorMessage(null);
    };

    Voice.onSpeechPartialResults = (e: any) => {
      const partial = e.value?.[0];
      if (partial) setPartialText(partial);
    };

    Voice.onSpeechResults = (e: any) => {
      clearListenTimer();
      isListeningRef.current = false;
      const transcript = e.value?.[0] ?? '';

      if (!transcript.trim()) {
        setVoiceState('idle');
        setPartialText('');
        return;
      }

      setVoiceState('processing');
      setPartialText(transcript);

      const cmd = parseVoiceCommand(transcript);
      setLastCommand(cmd);
      scheduleCommandClear();
      speak(buildConfirmation(cmd));
      onCommandRef.current?.(cmd);

      setTimeout(() => setVoiceState('idle'), 400);
    };

    Voice.onSpeechError = (e: any) => {
      clearListenTimer();
      isListeningRef.current = false;
      const code = String(e.error?.code ?? '');

      if (code === '7' || code === '') {
        setVoiceState('idle');
        setPartialText('');
      } else {
        setErrorMessage(e.error?.message ?? 'Voice recognition error');
        setVoiceState('error');
      }
    };

    Voice.onSpeechEnd = () => {
      clearListenTimer();
      setVoiceState(s => (s === 'listening' ? 'processing' : s));
    };

    return () => {
      Voice?.destroy().catch(() => {});
      clearListenTimer();
      if (clearCmdTimer.current) clearTimeout(clearCmdTimer.current);
    };
  }, []); // intentionally empty — all live values read via refs

  // ── Public actions ────────────────────────────────────────────

  const startListening = useCallback(async () => {
    if (!Voice) {
      setErrorMessage('Voice recognition not available in this environment.');
      setVoiceState('error');
      return;
    }
    if (isListeningRef.current) return;

    const permitted = await requestMicPermission();
    if (!permitted) {
      setErrorMessage('Microphone permission denied. Please enable it in Settings.');
      setVoiceState('error');
      return;
    }

    setErrorMessage(null);
    setPartialText('');

    try {
      await Voice.start(localeRef.current);

      // Safety timeout: auto-stop if voice engine never fires onSpeechEnd
      listenTimer.current = setTimeout(async () => {
        if (isListeningRef.current) {
          isListeningRef.current = false;
          try { await Voice.stop(); } catch { /* ignore */ }
          setVoiceState('idle');
        }
      }, LISTEN_TIMEOUT_MS);
    } catch (err: any) {
      setErrorMessage(err?.message ?? 'Could not start voice recognition');
      setVoiceState('error');
    }
  }, []);

  const stopListening = useCallback(async () => {
    clearListenTimer();
    isListeningRef.current = false;
    try {
      await Voice?.stop();
    } catch {
      setVoiceState('idle');
    }
  }, [clearListenTimer]);

  const toggle = useCallback(async () => {
    if (voiceState === 'listening') {
      await stopListening();
    } else if (voiceState === 'idle' || voiceState === 'error') {
      await startListening();
    }
  }, [voiceState, startListening, stopListening]);

  const reset = useCallback(() => {
    if (clearCmdTimer.current) clearTimeout(clearCmdTimer.current);
    setLastCommand(null);
    setErrorMessage(null);
    setPartialText('');
    setVoiceState('idle');
  }, []);

  return {
    voiceState,
    partialText,
    lastCommand,
    errorMessage,
    startListening,
    stopListening,
    toggle,
    reset,
  };
}
