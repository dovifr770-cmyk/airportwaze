import type { NavigationMode } from '../../types/auth';
import type { NavigationRoute, RoutePoint, RouteStep } from '../../types/navigation';

const BASE_SPEED_MPS = 1.4; // average walking speed

const SPEED_MULTIPLIER: Record<NavigationMode, number> = {
  walking:     1.0,
  running:     1.8,
  wheelchair:  0.7,
};

export function calculateWalkingTime(
  distanceMeters: number,
  mode: NavigationMode = 'walking',
  congestionFactor = 1.0
): number {
  const speed = BASE_SPEED_MPS * SPEED_MULTIPLIER[mode];
  return Math.ceil((distanceMeters / speed / 60) * congestionFactor);
}

export type RiskLevel = 'safe' | 'tight' | 'at_risk' | 'impossible';

export function assessConnectionRisk(
  walkingTimeMinutes: number,
  minutesToGateClose: number
): { viable: boolean; riskLevel: RiskLevel } {
  const buffer = minutesToGateClose - walkingTimeMinutes;
  if (buffer < 0)  return { viable: false, riskLevel: 'impossible' };
  if (buffer < 10) return { viable: false, riskLevel: 'at_risk' };
  if (buffer < 25) return { viable: true,  riskLevel: 'tight' };
  return             { viable: true,  riskLevel: 'safe' };
}

export function buildRoute(
  from: RoutePoint,
  to: RoutePoint,
  steps: RouteStep[],
  mode: NavigationMode,
  congestionFactor = 1.0,
  isWheelchairAccessible = true
): NavigationRoute {
  const distance = steps.reduce((sum, s) => sum + s.distance, 0);
  return {
    id: `${from.id}_${to.id}_${Date.now()}`,
    from,
    to,
    distance,
    estimatedWalkingTime: calculateWalkingTime(distance, mode, congestionFactor),
    congestionFactor,
    steps,
    isWheelchairAccessible,
    updatedAt: new Date(),
  };
}
