import { describe, it, expect } from 'vitest';
import { PERIODS, isPeriod, assertPeriod } from './periods';

describe('isPeriod', () => {
  it('returns true for valid periods', () => {
    for (const period of PERIODS) {
      expect(isPeriod(period)).toBe(true);
    }
  });

  it('returns false for invalid strings', () => {
    expect(isPeriod('bogus')).toBe(false);
    expect(isPeriod('')).toBe(false);
    expect(isPeriod('This-Month')).toBe(false);
  });
});

describe('assertPeriod', () => {
  it('returns the period when valid', () => {
    expect(assertPeriod('this-month')).toBe('this-month');
  });

  it('throws with the list of valid periods when invalid', () => {
    expect(() => assertPeriod('bogus')).toThrow(/Invalid period "bogus"/);
    expect(() => assertPeriod('bogus')).toThrow(/this-month, previous-month/);
  });
});
