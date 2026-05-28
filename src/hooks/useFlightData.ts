import { useQuery } from '@tanstack/react-query';
import { flightService } from '../services/flights/aviationstack';

export function useFlightByNumber(flightNumber: string, date?: string) {
  return useQuery({
    queryKey: ['flight', flightNumber, date],
    queryFn: () => flightService.getByNumber(flightNumber, date),
    enabled: !!flightNumber,
    staleTime: 1000 * 60 * 2,  // 2 min — flight data changes often
  });
}

export function useFlightsByRoute(origin: string, destination: string, date: string) {
  return useQuery({
    queryKey: ['flights', origin, destination, date],
    queryFn: () => flightService.getByRoute(origin, destination, date),
    enabled: !!(origin && destination && date),
    staleTime: 1000 * 60 * 5,
  });
}
