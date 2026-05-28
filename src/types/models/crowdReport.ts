import type { CrowdReportType, ReportLocationType } from '../database';
import type { GeoCoords } from './airport';

export type { CrowdReportType, ReportLocationType };

// ── Crowd report ──────────────────────────────────────────

export interface CrowdReport {
  id: string;
  userId?: string;
  isAnonymous: boolean;
  // Location context
  airportCode: string;
  airportId?: string;
  terminalId?: string;
  locationType: ReportLocationType;
  locationId?: string;
  locationLabel: string;
  coordinates?: GeoCoords;
  // Payload
  type: CrowdReportType;
  severity: 1 | 2 | 3 | 4 | 5;
  description?: string;
  // Social
  upvotes: number;
  downvotes: number;
  isVerified: boolean;
  // Lifecycle
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface CrowdReportVote {
  id: string;
  reportId: string;
  userId: string;
  vote: 1 | -1;
  createdAt: Date;
}

// ── Crowd signal summary (from materialized view) ─────────

export interface CrowdSignal {
  airportCode: string;
  terminalId?: string;
  locationType: ReportLocationType;
  locationId?: string;
  locationLabel: string;
  reportCount: number;
  avgSeverity: number;
  dominantType: CrowdReportType;
  positiveCount: number;
  negativeCount: number;
  totalUpvotes: number;
  hasVerifiedReport: boolean;
  latestReportAt: Date;
  earliestExpiry: Date;
}

// ── Payload for creating a new report ─────────────────────

export interface CreateCrowdReportInput {
  airportCode: string;
  airportId?: string;
  terminalId?: string;
  locationType: ReportLocationType;
  locationId?: string;
  locationLabel: string;
  coordinates?: GeoCoords;
  type: CrowdReportType;
  severity?: 1 | 2 | 3 | 4 | 5;
  description?: string;
  isAnonymous?: boolean;
}

// ── Severity helpers ──────────────────────────────────────

export const SEVERITY_LABELS: Record<number, string> = {
  1: 'Minor',
  2: 'Mild',
  3: 'Moderate',
  4: 'Significant',
  5: 'Severe',
};

export const REPORT_TYPE_LABELS: Record<CrowdReportType, string> = {
  queue_long:         'Long queue',
  queue_short:        'Short queue',
  queue_closed:       'Queue closed',
  crowded:            'Very crowded',
  empty:              'Not crowded',
  gate_delay:         'Gate delay',
  gate_closed:        'Gate closed',
  gate_changed:       'Gate changed',
  gate_open:          'Gate open',
  security_slow:      'Security slow',
  security_fast:      'Security fast',
  customs_slow:       'Customs slow',
  customs_fast:       'Customs fast',
  baggage_delayed:    'Baggage delayed',
  baggage_arrived:    'Baggage arrived',
  elevator_broken:    'Elevator out',
  escalator_broken:   'Escalator out',
  moving_walkway_off: 'Moving walkway off',
  helpful_info:       'Helpful info',
  clear_path:         'Clear path',
};

export const POSITIVE_REPORT_TYPES = new Set<CrowdReportType>([
  'queue_short', 'empty', 'security_fast', 'customs_fast',
  'baggage_arrived', 'gate_open', 'helpful_info', 'clear_path',
]);

export function isPositiveReport(type: CrowdReportType): boolean {
  return POSITIVE_REPORT_TYPES.has(type);
}
