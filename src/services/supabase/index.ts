// Barrel export for all Supabase services
export { supabase }              from './client';
export { authService }           from './auth';
export { airportsService }       from './airports.service';
export { poisService }           from './pois.service';
export { parkingService }        from './parking.service';
export { crowdReportsService }   from './crowdReports.service';
export { flightsService }        from './flights.service';
export { connectionsService }    from './connections.service';
export {
  subscribeToFlightUpdates,
  subscribeToCrowdsource,
  subscribeToParkingAvailability,
}                                from './realtime';
