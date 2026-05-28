// ═══════════════════════════════════════════════════════════
// Voice Assistant — type definitions
// ═══════════════════════════════════════════════════════════

/** Lifecycle state of the voice listener */
export type VoiceState = 'idle' | 'listening' | 'processing' | 'error';

/**
 * Recognized user intent categories.
 * UNKNOWN fires when no pattern matches with enough confidence.
 */
export type VoiceIntent =
  | 'NAVIGATE_TO_GATE'   // "Take me to gate C4"
  | 'REPORT_SECURITY'    // "Report long line at security"
  | 'REPORT_CROWD'       // "Report crowded gate"
  | 'REPORT_ELEVATOR'    // "Report elevator broken"
  | 'REPORT_CLEAR'       // "Report all clear"
  | 'FIND_RESTROOM'      // "Where is the nearest restroom?"
  | 'FIND_FOOD'          // "Where can I eat?"
  | 'FIND_LOUNGE'        // "Find the lounge"
  | 'FIND_GATE'          // "Where is gate B12?"
  | 'CHECK_FLIGHT'       // "What's the status of UA123?"
  | 'CANCEL'             // "Cancel" / "Never mind"
  | 'UNKNOWN';           // No pattern matched

/** Extracted slot values from the utterance */
export interface VoiceEntities {
  /** Gate code, e.g. "C4", "B12" */
  gate?: string;
  /** Terminal string, e.g. "T4" */
  terminal?: string;
  /** Pre-fills the ReportSheet location label */
  locationLabel?: string;
  /** Pre-fills the ReportSheet type selector */
  reportType?: 'security_slow' | 'crowded' | 'elevator_broken' | 'clear_path';
  /** Extracted flight number, e.g. "UA 123" */
  flightNumber?: string;
}

/** A fully parsed voice command ready to dispatch */
export interface VoiceCommand {
  intent: VoiceIntent;
  /** Original transcribed text (un-normalized) */
  raw: string;
  /** 0–1 match confidence */
  confidence: number;
  entities: VoiceEntities;
}

/** What the hook exposes to consumers */
export interface VoiceAssistantReturn {
  voiceState: VoiceState;
  /** Live partial transcription shown while listening */
  partialText: string;
  /** Most recent fully-parsed command (auto-cleared after 8 s) */
  lastCommand: VoiceCommand | null;
  /** Human-readable error description */
  errorMessage: string | null;
  /** Start listening (requests microphone permission if needed) */
  startListening: () => Promise<void>;
  /** Stop the mic and process whatever was captured */
  stopListening: () => Promise<void>;
  /** Toggle: idle/error → start; listening → stop */
  toggle: () => Promise<void>;
  /** Clear last command and any error */
  reset: () => void;
}
