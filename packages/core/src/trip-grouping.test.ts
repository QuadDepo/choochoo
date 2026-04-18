import { describe, it, expect } from 'vitest';
import { groupTripsByDate } from './trip-grouping';
import type { Trip } from './browser/trips';

const makeTrip = (num: number, date: string): Trip => ({
  num,
  id: `declare-HB-${num}`,
  date,
  depTime: '08:00',
  arrTime: '08:30',
  from: 'A',
  to: 'B',
  carrier: 'NS',
  price: '€ 1,00',
  priceEur: 1,
});

describe('groupTripsByDate', () => {
  it('groups trips sharing the same raw date', () => {
    const trips = [
      makeTrip(1, 'dinsdag 2 januari 2024'),
      makeTrip(2, 'dinsdag 2 januari 2024'),
      makeTrip(3, 'vrijdag 5 januari 2024'),
    ];
    const groups = groupTripsByDate(trips);
    expect(groups).toHaveLength(2);
    expect(groups[0]!.trips.map((trip) => trip.num)).toEqual([1, 2]);
    expect(groups[1]!.trips.map((trip) => trip.num)).toEqual([3]);
  });

  it('preserves first-seen order of dates', () => {
    const trips = [
      makeTrip(1, 'vrijdag 5 januari 2024'),
      makeTrip(2, 'dinsdag 2 januari 2024'),
      makeTrip(3, 'vrijdag 5 januari 2024'),
    ];
    const groups = groupTripsByDate(trips);
    expect(groups.map((group) => group.date)).toEqual([
      'vrijdag 5 januari 2024',
      'dinsdag 2 januari 2024',
    ]);
  });

  it('returns empty array for no trips', () => {
    expect(groupTripsByDate([])).toEqual([]);
  });
});
