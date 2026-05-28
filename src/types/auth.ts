export type NavigationMode = 'walking' | 'wheelchair' | 'running';

export interface UserSettings {
  navigationMode: NavigationMode;
  notifyGateChanges: boolean;
  notifyDelays: boolean;
  notifyBoarding: boolean;
  notifyConnectionRisk: boolean;
  delayThresholdMinutes: number;
  language: string;
  units: 'metric' | 'imperial';
}

export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  preferredAirports: string[];
  savedFlights: string[];
  settings: UserSettings;
  createdAt: Date;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
