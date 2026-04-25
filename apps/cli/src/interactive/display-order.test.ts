import type { Trip, TripGroup } from '@choochoo/core';
import { describe, expect, it } from 'vitest';
import { orderGroupsForDisplay } from './display-order';

const makeTrip = (num: number): Trip => ({
  num,
  id: `declare-HB-${num}`,
  date: 'dinsdag 2 januari 2024',
  depTime: '08:00',
  arrTime: '08:30',
  from: 'A',
  to: 'B',
  carrier: 'NS',
  price: '€ 1,00',
  priceEur: 1,
});

const groups: TripGroup[] = [
  { date: 'dinsdag 2 januari 2024', trips: [makeTrip(1), makeTrip(2)] },
  { date: 'vrijdag 5 januari 2024', trips: [makeTrip(3), makeTrip(4)] },
];

describe('orderGroupsForDisplay', () => {
  it('returns the input untouched when tripOrder is desc', () => {
    const result = orderGroupsForDisplay(groups, 'desc');
    expect(result).toBe(groups);
  });

  it('reverses both group order and trip order when tripOrder is asc', () => {
    const result = orderGroupsForDisplay(groups, 'asc');
    expect(result.map((group) => group.date)).toEqual(['vrijdag 5 januari 2024', 'dinsdag 2 januari 2024']);
    expect(result[0]?.trips.map((trip) => trip.num)).toEqual([4, 3]);
    expect(result[1]?.trips.map((trip) => trip.num)).toEqual([2, 1]);
  });

  it('does not mutate the input array or its groups when reversing', () => {
    const snapshot = groups.map((group) => ({ date: group.date, nums: group.trips.map((trip) => trip.num) }));
    orderGroupsForDisplay(groups, 'asc');
    expect(groups.map((group) => ({ date: group.date, nums: group.trips.map((trip) => trip.num) }))).toEqual(snapshot);
  });

  it('returns an empty array when no groups are given', () => {
    expect(orderGroupsForDisplay([], 'asc')).toEqual([]);
    expect(orderGroupsForDisplay([], 'desc')).toEqual([]);
  });
});
