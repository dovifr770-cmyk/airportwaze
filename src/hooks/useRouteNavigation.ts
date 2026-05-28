import { useState, useCallback } from 'react';
import type { EnrichedStep } from '../services/navigation/connectionEngine';

export interface RouteNavigationState {
  currentIndex:   number;
  currentStep:    EnrichedStep | null;
  nextStep:       EnrichedStep | null;
  prevStep:       EnrichedStep | null;
  totalSteps:     number;
  progress:       number;   // 0 → 1
  isFirstStep:    boolean;
  isLastStep:     boolean;
  isComplete:     boolean;
  completedCount: number;
  advance:        () => void;
  goBack:         () => void;
  jumpTo:         (index: number) => void;
  restart:        () => void;
}

/**
 * Manages step-by-step progress through a ConnectionRoute.
 * Stateless with respect to the route itself — pass in steps,
 * get back the current position and navigation callbacks.
 */
export function useRouteNavigation(steps: EnrichedStep[]): RouteNavigationState {
  const [currentIndex, setCurrentIndex] = useState(0);

  const clamp = (n: number) => Math.max(0, Math.min(n, steps.length - 1));

  const advance = useCallback(
    () => setCurrentIndex((i) => clamp(i + 1)),
    [steps.length],
  );

  const goBack = useCallback(
    () => setCurrentIndex((i) => clamp(i - 1)),
    [],
  );

  const jumpTo = useCallback(
    (index: number) => setCurrentIndex(clamp(index)),
    [steps.length],
  );

  const restart = useCallback(() => setCurrentIndex(0), []);

  const isLastStep    = currentIndex === steps.length - 1;
  const isComplete    = steps.length > 0 && currentIndex >= steps.length;

  return {
    currentIndex,
    currentStep:    steps[currentIndex]     ?? null,
    nextStep:       steps[currentIndex + 1] ?? null,
    prevStep:       steps[currentIndex - 1] ?? null,
    totalSteps:     steps.length,
    progress:       steps.length > 0 ? currentIndex / (steps.length - 1) : 0,
    isFirstStep:    currentIndex === 0,
    isLastStep,
    isComplete,
    completedCount: currentIndex,
    advance,
    goBack,
    jumpTo,
    restart,
  };
}
