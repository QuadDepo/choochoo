import { describe, it, expect } from 'vitest';
import { buildHistoryUrl } from './urls';

describe('buildHistoryUrl', () => {
  const cardId = '5c803f52-8f8a-482c-8253-fadba3ad3cfe';

  it('defaults to this-month when no period given', () => {
    expect(buildHistoryUrl(cardId)).toBe(
      `https://www.ns.nl/mijnns#/reishistorie?card=${cardId}&period=this-month`,
    );
  });

  it('includes the given period', () => {
    expect(buildHistoryUrl(cardId, 'previous-month')).toBe(
      `https://www.ns.nl/mijnns#/reishistorie?card=${cardId}&period=previous-month`,
    );
  });

  it('includes the card id as a query param', () => {
    const url = buildHistoryUrl(cardId, 'past-year');
    expect(url).toContain(`card=${cardId}`);
    expect(url).toContain('period=past-year');
  });

  it('accepts a custom range period string', () => {
    expect(buildHistoryUrl(cardId, '01-02-2026-to-28-02-2026')).toBe(
      `https://www.ns.nl/mijnns#/reishistorie?card=${cardId}&period=01-02-2026-to-28-02-2026`,
    );
  });
});
