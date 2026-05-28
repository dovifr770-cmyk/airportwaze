// ── Web stub for useVoiceAssistant ───────────────────────────
// Speech recognition via @react-native-voice/voice requires a native
// binary and is not available in the browser. All functions are no-ops.
import type { VoiceAssistantReturn } from '../types/models/voice';

export function useVoiceAssistant(
  _options: { locale?: string; ttsEnabled?: boolean; onCommand?: (cmd: any) => void } = {}
): VoiceAssistantReturn {
  return {
    voiceState:    'idle',
    partialText:   '',
    lastCommand:   null,
    errorMessage:  null,
    startListening: async () => {},
    stopListening:  async () => {},
    toggle:         async () => {},
    reset:          () => {},
  };
}
