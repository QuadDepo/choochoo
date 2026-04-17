import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTestSession, type TestSession } from '../../test/helpers/browser';
import { extractTripsFromPage, processTrips, waitForTrips } from './trips';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) =>
  readFileSync(join(here, '..', '..', 'test', 'fixtures', `${name}.html`), 'utf8');

let session: TestSession;

beforeAll(async () => {
  session = await createTestSession();
});

afterAll(async () => {
  await session.close();
});

describe('extractTripsFromPage (fixture)', () => {
  it('extracts all trips with shadow-DOM routes, dates, and prices', async () => {
    await session.page.setContent(fixture('history-with-trips'));

    const raw = await extractTripsFromPage(session.page);

    expect(raw).toHaveLength(4);
    expect(raw[0]).toMatchObject({
      num: 1,
      id: 'declare-HB-trip1',
      depTime: '08:00',
      arrTime: '08:30',
      from: 'Amsterdam CS',
      to: 'Utrecht CS',
      price: '€\u00a05,50',
      date: 'dinsdag 2 januari 2024',
    });
    expect(raw[3]!.price).toBe('€\u00a00,00');
    expect(raw[3]!.date).toBe('vrijdag 5 januari 2024');
  });

  it('processTrips filters zero-cost and totals correctly', async () => {
    await session.page.setContent(fixture('history-with-trips'));
    const raw = await extractTripsFromPage(session.page);
    const result = processTrips(raw);

    expect(result.trips).toHaveLength(3);
    expect(result.excluded).toBe(1);
    expect(result.totalEur).toBe(23.3);
  });
});

describe('waitForTrips (fixture)', () => {
  it('returns false when NS shows the empty-state text', async () => {
    await session.page.setContent(fixture('history-empty'));
    const result = await waitForTrips(session.page);
    expect(result).toBe(false);
  });

  it('returns true when trip checkboxes are present', async () => {
    await session.page.setContent(fixture('history-with-trips'));
    const result = await waitForTrips(session.page);
    expect(result).toBe(true);
  });
});
