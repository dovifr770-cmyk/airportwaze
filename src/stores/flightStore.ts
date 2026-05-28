import { create } from 'zustand';
import type { Flight, ConnectionFlights } from '../types/flight';

interface FlightStore {
  trackedFlights: Flight[];
  activeConnection: ConnectionFlights | null;
  addTrackedFlight: (flight: Flight) => void;
  removeTrackedFlight: (flightId: string) => void;
  setActiveConnection: (connection: ConnectionFlights | null) => void;
  updateFlightStatus: (flightId: string, updates: Partial<Flight>) => void;
}

export const useFlightStore = create<FlightStore>((set) => ({
  trackedFlights: [],
  activeConnection: null,

  addTrackedFlight: (flight) =>
    set((s) => ({
      trackedFlights: [...s.trackedFlights.filter((f) => f.id !== flight.id), flight],
    })),

  removeTrackedFlight: (flightId) =>
    set((s) => ({ trackedFlights: s.trackedFlights.filter((f) => f.id !== flightId) })),

  setActiveConnection: (connection) => set({ activeConnection: connection }),

  updateFlightStatus: (flightId, updates) =>
    set((s) => ({
      trackedFlights: s.trackedFlights.map((f) =>
        f.id === flightId ? { ...f, ...updates } : f
      ),
    })),
}));
