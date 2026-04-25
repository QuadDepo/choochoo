import type { Trip } from '@choochoo/core';
import { describe, expect, it } from 'vitest';
import { formatDMY, formatRow, pad, startOfDay } from './formatters';

const makeTrip = (overrides: Partial<Trip> = {}): Trip => ({
  num: 1,
  id: 'declare-HB-1',
  date: 'dinsdag 2 januari 2024',
  depTime: '08:00',
  arrTime: '08:30',
  from: 'Amsterdam',
  to: 'Utrecht',
  carrier: 'NS',
  price: '€ 8,50',
  priceEur: 8.5,
  ...overrides,
});

describe('formatRow', () => {
  it('produces a fixed-width row with time, route, and price', () => {
    const row = formatRow(makeTrip());
    expect(row).toBe('08:00 │ Amsterdam → Utrecht                │   €8.50');
  });

  it('truncates long routes to the column width', () => {
    const row = formatRow(makeTrip({ from: 'Schiphol Airport', to: 'Rotterdam Centraal' }));
    expect(row).toContain('08:00 │ ');
    // route segment between the separators is exactly ROUTE_WIDTH (34) characters
    const routeSegment = row.split(' │ ')[1];
    expect(routeSegment).toHaveLength(34);
  });

  it('right-pads the price to the price column width', () => {
    const row = formatRow(makeTrip({ priceEur: 1 }));
    expect(row.endsWith('  €1.00')).toBe(true);
  });
});

describe('pad', () => {
  it('left-pads single digits with zero', () => {
    expect(pad(1)).toBe('01');
    expect(pad(9)).toBe('09');
  });

  it('leaves two-digit values unchanged', () => {
    expect(pad(10)).toBe('10');
    expect(pad(31)).toBe('31');
  });
});

describe('formatDMY', () => {
  it('formats a date as DD-MM-YYYY', () => {
    expect(formatDMY(new Date(2024, 0, 2))).toBe('02-01-2024');
  });

  it('uses zero-padded month and day', () => {
    expect(formatDMY(new Date(2024, 8, 5))).toBe('05-09-2024');
  });
});

describe('startOfDay', () => {
  it('zeroes out the time portion', () => {
    const result = startOfDay(new Date(2024, 5, 15, 13, 47, 30, 500));
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(15);
  });
});
