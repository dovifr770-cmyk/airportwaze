import { create } from 'zustand';
import type { ParkingLot } from '../types/airport';

interface ParkingStore {
  lots: ParkingLot[];
  selectedLotId: string | null;
  isLoading: boolean;
  setLots: (lots: ParkingLot[]) => void;
  updateAvailability: (lotId: string, available: number) => void;
  selectLot: (id: string | null) => void;
}

export const useParkingStore = create<ParkingStore>((set) => ({
  lots: [],
  selectedLotId: null,
  isLoading: false,

  setLots: (lots) => set({ lots }),

  updateAvailability: (lotId, available) =>
    set((s) => ({
      lots: s.lots.map((l) =>
        l.id === lotId ? { ...l, availableSpaces: available } : l
      ),
    })),

  selectLot: (id) => set({ selectedLotId: id }),
}));
