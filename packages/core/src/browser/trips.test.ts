import { describe, it, expect } from 'vitest';
import { parsePrice, processTrips } from './trips';
import type { RawTrip } from './trips';

describe('parsePrice', () => {
  it('parses Dutch format with €, non-breaking space, comma decimal', () => {
    expect(parsePrice('€\u00a08,50')).toBe(8.5);
  });

  it('parses regular space', () => {
    expect(parsePrice('€ 12,34')).toBe(12.34);
  });

  it('returns 0 for empty string', () => {
    expect(parsePrice('')).toBe(0);
  });

  it('returns 0 for zero price', () => {
    expect(parsePrice('€\u00a00,00')).toBe(0);
  });

  it('returns 0 for unparseable input', () => {
    expect(parsePrice('?')).toBe(0);
  });
});

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
