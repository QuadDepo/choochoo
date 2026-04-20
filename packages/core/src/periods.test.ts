import { describe, expect, it } from 'vitest';
import { assertPeriod, assertPeriodOrRange, isPeriod, isPeriodRange, PERIODS, periodFromRange } from './periods';

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

describe('isPeriodRange', () => {
  it('matches the NS DD-MM-YYYY-to-DD-MM-YYYY format', () => {
    expect(isPeriodRange('01-02-2026-to-28-02-2026')).toBe(true);
    expect(isPeriodRange('31-12-2024-to-01-01-2025')).toBe(true);
  });

  it('rejects other shapes', () => {
    expect(isPeriodRange('01-02-2026')).toBe(false);
    expect(isPeriodRange('2026-02-01-to-2026-02-28')).toBe(false);
    expect(isPeriodRange('this-month')).toBe(false);
    expect(isPeriodRange('')).toBe(false);
    expect(isPeriodRange('1-2-2026-to-28-2-2026')).toBe(false);
  });
});

describe('periodFromRange', () => {
  it('builds the NS format from valid DD-MM-YYYY inputs', () => {
    expect(periodFromRange('01-02-2026', '28-02-2026')).toBe('01-02-2026-to-28-02-2026');
  });

  it('rejects fundamentally wrong formats', () => {
    expect(() => periodFromRange('2026-02-01', '28-02-2026')).toThrow(/Invalid from date/);
    expect(() => periodFromRange('01-02-2026', '2026/02/28')).toThrow(/Invalid to date/);
  });

  it('normalizes missing zero-padding', () => {
    expect(periodFromRange('1-2-2026', '28-2-2026')).toBe('01-02-2026-to-28-02-2026');
  });

  it('rejects invalid calendar dates (e.g. Feb 30)', () => {
    expect(() => periodFromRange('30-02-2026', '01-03-2026')).toThrow(/Invalid from date/);
    expect(() => periodFromRange('01-01-2026', '31-04-2026')).toThrow(/Invalid to date/);
  });

  it('rejects when from is after to', () => {
    expect(() => periodFromRange('01-03-2026', '01-02-2026')).toThrow(
      /"from" \(01-03-2026\) must be on or before "to" \(01-02-2026\)/,
    );
  });

  it('accepts same-day ranges', () => {
    expect(periodFromRange('15-02-2026', '15-02-2026')).toBe('15-02-2026-to-15-02-2026');
  });

  it('rejects from dates in the future', () => {
    expect(() => periodFromRange('01-01-2099', '02-01-2099')).toThrow(/"from" \(01-01-2099\) cannot be in the future/);
  });

  it('rejects to dates in the future', () => {
    expect(() => periodFromRange('01-01-2020', '02-01-2099')).toThrow(/"to" \(02-01-2099\) cannot be in the future/);
  });
});

describe('assertPeriodOrRange', () => {
  it('accepts predefined periods', () => {
    expect(assertPeriodOrRange('this-month')).toBe('this-month');
  });

  it('accepts the NS range format', () => {
    expect(assertPeriodOrRange('01-02-2026-to-28-02-2026')).toBe('01-02-2026-to-28-02-2026');
  });

  it('throws on anything else', () => {
    expect(() => assertPeriodOrRange('bogus')).toThrow(/Invalid period "bogus"/);
    expect(() => assertPeriodOrRange('2026-02-01')).toThrow(/Invalid period/);
  });

  it('rejects shape-valid but calendar-invalid ranges', () => {
    expect(() => assertPeriodOrRange('30-02-2026-to-01-03-2026')).toThrow(/Invalid from date/);
    expect(() => assertPeriodOrRange('01-01-2020-to-99-99-2020')).toThrow(/Invalid to date/);
  });

  it('rejects shape-valid ranges that are in the future', () => {
    expect(() => assertPeriodOrRange('01-01-2099-to-02-01-2099')).toThrow(/cannot be in the future/);
  });
});
