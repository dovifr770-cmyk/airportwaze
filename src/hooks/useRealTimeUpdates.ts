import { useEffect } from 'react';
import {
  subscribeToFlightUpdates,
  subscribeToCrowdsource,
  subscribeToParkingAvailability,
} from '../services/supabase/realtime';
import { useFlightStore } from '../stores/flightStore';
import { useNavigationStore } from '../stores/navigationStore';
import { useParkingStore } from '../stores/parkingStore';

export function useRealTimeFlights(flightIds: string[]) {
  const updateFlightStatus = useFlightStore((s) => s.updateFlightStatus);

  useEffect(() => {
    const key = flightIds.join(',');
    if (!key) return;
    return subscribeToFlightUpdates(flightIds, (f) => updateFlightStatus(f.id, f));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flightIds.join(',')]);
}

export function useRealTimeCrowdsource(airportCode: string) {
  const addReport = useNavigationStore((s) => s.addCrowdsourceReport);

  useEffect(() => {
    if (!airportCode) return;
    return subscribeToCrowdsource(airportCode, addReport);
  }, [airportCode]);
}

export function useRealTimeParking(airportCode: string) {
  const updateAvailability = useParkingStore((s) => s.updateAvailability);

  useEffect(() => {
    if (!airportCode) return;
    return subscribeToParkingAvailability(airportCode, updateAvailability);
  }, [airportCode]);
}
