import { parsePrice } from './price';

export interface RawTrip {
  num: number;
  id: string;
  date: string;
  depTime: string;
  arrTime: string;
  from: string;
  to: string;
  carrier: string;
  price: string;
}

export interface Trip extends RawTrip {
  priceEur: number;
}

export interface ExtractResult {
  trips: Trip[];
  excluded: number;
  totalEur: number;
}

export const processTrips = (rawTrips: RawTrip[], excludeZeroCost = true): ExtractResult => {
  const trips: Trip[] = rawTrips.map((trip) => ({ ...trip, priceEur: parsePrice(trip.price) }));
  const billable = excludeZeroCost ? trips.filter((trip) => trip.priceEur > 0) : trips;
  const excluded = trips.length - billable.length;
  const totalEur = Math.round(billable.reduce((sum, trip) => sum + trip.priceEur, 0) * 100) / 100;
  return { trips: billable, excluded, totalEur };
};
