import { supabase } from './client';
import type { Flight } from '../../types/flight';
import type { CrowdsourceReport } from '../../types/navigation';

export function subscribeToFlightUpdates(
  flightIds: string[],
  onUpdate: (flight: Partial<Flight> & { id: string }) => void
) {
  if (flightIds.length === 0) return () => {};

  const channel = supabase
    .channel('flight-updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'flights',
        filter: `id=in.(${flightIds.join(',')})`,
      },
      (payload) => onUpdate(payload.new as Flight)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export function subscribeToCrowdsource(
  airportCode: string,
  onReport: (report: CrowdsourceReport) => void
) {
  const channel = supabase
    .channel(`crowdsource-${airportCode}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'crowdsource_reports',
        filter: `airport_code=eq.${airportCode}`,
      },
      (payload) => onReport(payload.new as CrowdsourceReport)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export function subscribeToParkingAvailability(
  airportCode: string,
  onUpdate: (lotId: string, available: number) => void
) {
  const channel = supabase
    .channel(`parking-${airportCode}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'parking_lots',
        filter: `airport_code=eq.${airportCode}`,
      },
      (payload) => onUpdate(payload.new.id, payload.new.available_spaces)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
