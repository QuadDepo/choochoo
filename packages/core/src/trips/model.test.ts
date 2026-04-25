import { describe, expect, it } from 'vitest';
import type { RawTrip } from './model';
import { processTrips } from './model';

const makeTrip = (num: number, price: string): RawTrip => ({
  num,
  id: `declare-HB-${num}`,
  date: '',
  depTime: '',
  arrTime: '',
  from: '',
  to: '',
  carrier: 'NS',
  price,
});

describe('processTrips', () => {
  it('parses prices and computes total', () => {
    const raw = [makeTrip(1, '€\u00a08,50'), makeTrip(2, '€\u00a03,20')];
    const result = processTrips(raw);
    expect(result.trips).toHaveLength(2);
    expect(result.totalEur).toBe(11.7);
    expect(result.excluded).toBe(0);
  });

  it('excludes zero-cost trips by default', () => {
    const raw = [makeTrip(1, '€\u00a08,50'), makeTrip(2, '€\u00a00,00')];
    const result = processTrips(raw);
    expect(result.trips).toHaveLength(1);
    expect(result.excluded).toBe(1);
    expect(result.totalEur).toBe(8.5);
  });

  it('keeps zero-cost trips when excludeZeroCost is false', () => {
    const raw = [makeTrip(1, '€\u00a08,50'), makeTrip(2, '€\u00a00,00')];
    const result = processTrips(raw, false);
    expect(result.trips).toHaveLength(2);
    expect(result.excluded).toBe(0);
  });

  it('rounds totals to 2 decimals (avoids float drift)', () => {
    const raw = [makeTrip(1, '€\u00a00,10'), makeTrip(2, '€\u00a00,20')];
    const result = processTrips(raw);
    expect(result.totalEur).toBe(0.3);
  });
});
