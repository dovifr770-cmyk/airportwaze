import { create } from 'zustand';
import type { NavigationRoute, CrowdsourceReport } from '../types/navigation';
import type { NavigationMode } from '../types/auth';

interface NavigationStore {
  activeRoute: NavigationRoute | null;
  navigationMode: NavigationMode;
  crowdsourceReports: CrowdsourceReport[];
  isNavigating: boolean;
  startNavigation: (route: NavigationRoute) => void;
  stopNavigation: () => void;
  setNavigationMode: (mode: NavigationMode) => void;
  addCrowdsourceReport: (report: CrowdsourceReport) => void;
  removeCrowdsourceReport: (id: string) => void;
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  activeRoute: null,
  navigationMode: 'walking',
  crowdsourceReports: [],
  isNavigating: false,

  startNavigation: (route) => set({ activeRoute: route, isNavigating: true }),

  stopNavigation: () => set({ activeRoute: null, isNavigating: false }),

  setNavigationMode: (mode) => set({ navigationMode: mode }),

  addCrowdsourceReport: (report) =>
    set((s) => ({
      crowdsourceReports: [
        report,
        ...s.crowdsourceReports.filter((r) => r.id !== report.id),
      ].slice(0, 100),
    })),

  removeCrowdsourceReport: (id) =>
    set((s) => ({
      crowdsourceReports: s.crowdsourceReports.filter((r) => r.id !== id),
    })),
}));
