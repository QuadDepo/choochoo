import type { Trip } from './trips';

export interface TripGroup {
  date: string;
  trips: Trip[];
}

/** Groups trips by their raw date string, preserving first-seen order. */
export const groupTripsByDate = (trips: Trip[]): TripGroup[] => {
  const byDate = new Map<string, TripGroup>();
  for (const trip of trips) {
    let group = byDate.get(trip.date);
    if (!group) {
      group = { date: trip.date, trips: [] };
      byDate.set(trip.date, group);
    }
    group.trips.push(trip);
  }
  return [...byDate.values()];
};
