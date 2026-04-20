import type { Page } from 'playwright';
import { parsePrice } from '../price';
import { SELECTORS } from './selectors';

const EMPTY_STATE_TEXT = 'Er zijn geen resultaten voor de geselecteerde periode of kaart';

export interface RawTrip {
  num: number;
  id: string;
  date: string;
  depTime: string;
  arrTime: string;
  from: string;
  to: string;
  carrier: string;
  price: string;
}

export interface Trip extends RawTrip {
  priceEur: number;
}

export interface ExtractResult {
  trips: Trip[];
  excluded: number;
  totalEur: number;
}

export const waitForTrips = async (page: Page): Promise<boolean> => {
  const trips = page.locator(SELECTORS.tripCheckbox).first();
  const empty = page.getByText(EMPTY_STATE_TEXT);

  const winner = await Promise.race([
    trips.waitFor({ timeout: 15000 }).then(() => 'trips' as const),
    empty.waitFor({ timeout: 15000 }).then(() => 'empty' as const),
  ]);

  return winner === 'trips';
};

export const extractTripsFromPage = async (page: Page): Promise<RawTrip[]> => {
  return page.evaluate((sel) => {
    const trips: RawTrip[] = [];
    let num = 0;

    document.querySelectorAll(sel.tripCheckbox).forEach((cb) => {
      const container = cb.closest(sel.tripContainer);
      if (!container) return;

      const depEl = container.querySelector(sel.routeDeparture);
      const arrEl = container.querySelector(sel.routeArrival);
      const depTime = depEl?.shadowRoot?.querySelector(sel.routeTime)?.getAttribute('datetime') ?? '';
      const from = depEl?.shadowRoot?.querySelector(sel.routeLocation)?.textContent?.trim() ?? '';
      const arrTime = arrEl?.shadowRoot?.querySelector(sel.routeTime)?.getAttribute('datetime') ?? '';
      const to = arrEl?.shadowRoot?.querySelector(sel.routeLocation)?.textContent?.trim() ?? '';

      const price = container.querySelector(sel.tripPrice)?.textContent?.trim() ?? '?';
      const carrier = container.querySelector(sel.tripCarrier)?.textContent?.trim() ?? '?';

      let date = '';
      const dayGroup = cb.closest(sel.dayGroup);
      if (dayGroup) {
        const headerEl = dayGroup.querySelector(sel.dayHeader);
        date = headerEl?.shadowRoot?.textContent?.trim() ?? '';
        if (!date) {
          const allText = dayGroup.shadowRoot?.textContent ?? dayGroup.textContent ?? '';
          const match = allText
            .replace(/\s+/g, ' ')
            .trim()
            .match(/([a-z]+ \d+ [a-z]+ \d+)/i);
          if (match) date = match[1]!;
        }
      }

      num++;
      trips.push({
        num,
        id: (cb as HTMLInputElement).id,
        date,
        depTime,
        arrTime,
        from,
        to,
        carrier,
        price,
      });
    });

    return trips;
  }, SELECTORS);
};

export const processTrips = (rawTrips: RawTrip[], excludeZeroCost = true): ExtractResult => {
  const trips: Trip[] = rawTrips.map((t) => ({ ...t, priceEur: parsePrice(t.price) }));
  const billable = excludeZeroCost ? trips.filter((t) => t.priceEur > 0) : trips;
  const excluded = trips.length - billable.length;
  const totalEur = Math.round(billable.reduce((sum, t) => sum + t.priceEur, 0) * 100) / 100;
  return { trips: billable, excluded, totalEur };
};
