import { describe, it, expect } from 'vitest';
import { parsePrice, formatPriceEur } from './price';

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

describe('formatPriceEur', () => {
  it('formats with € prefix and two decimals', () => {
    expect(formatPriceEur(8.5)).toBe('€8.50');
  });

  it('pads whole numbers to two decimals', () => {
    expect(formatPriceEur(12)).toBe('€12.00');
  });

  it('rounds to two decimals', () => {
    expect(formatPriceEur(0.005)).toBe('€0.01');
  });

  it('handles zero', () => {
    expect(formatPriceEur(0)).toBe('€0.00');
  });
});
