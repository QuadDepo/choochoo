import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Page } from 'playwright';
import { parsePrice } from '../price';
import { SELECTORS } from './selectors';

export type Selection = 'paid' | 'all' | number[];

export class NsDownloadError extends Error {
  name = 'NsDownloadError';
}

export const parseSelection = (input: string): Selection => {
  if (input === 'paid' || input === 'all') return input;
  const nums = input.split(',').map((part) => {
    const trimmed = part.trim();
    const num = parseInt(trimmed, 10);
    if (Number.isNaN(num) || num <= 0 || String(num) !== trimmed) {
      throw new NsDownloadError(`Invalid trip number: "${trimmed}"`);
    }
    return num;
  });
  if (nums.length === 0) throw new NsDownloadError('Empty selection.');
  return nums;
};

const clickDeclaratiesRadio = async (page: Page) => {
  const clicked = await page.evaluate((sel) => {
    let count = 0;
    document.querySelectorAll<HTMLInputElement>(sel.allRadios).forEach((radio) => {
      const label = radio.closest('label') ?? document.querySelector(`label[for="${radio.id}"]`);
      if (label?.textContent?.toLowerCase().includes(sel.declaratiesLabel)) {
        radio.click();
        count++;
      }
    });
    return count;
  }, SELECTORS);
  if (clicked === 0) {
    throw new NsDownloadError('Could not find the declaration radio button.');
  }
};

const clickTripsByIndex = async (page: Page, nums: number[]) => {
  await page.evaluate(
    ({ sel, nums: tripNums }) => {
      document.querySelectorAll<HTMLInputElement>(sel.tripCheckbox).forEach((cb, index) => {
        if (tripNums.includes(index + 1) && !cb.checked) cb.click();
      });
    },
    { sel: SELECTORS, nums },
  );
};

/** Read price strings in DOM order so the real parsePrice can decide what's billable in Node. */
const readPriceTexts = async (page: Page): Promise<string[]> =>
  page.evaluate(
    (sel) =>
      Array.from(document.querySelectorAll(sel.tripCheckbox)).map((cb) => {
        const container = cb.closest(sel.tripContainer);
        return container?.querySelector(sel.tripPrice)?.textContent ?? '';
      }),
    SELECTORS,
  );

export const configureDownload = async (page: Page, selection: Selection): Promise<void> => {
  await page.evaluate(() => window.scrollBy(0, 500));

  if (selection === 'all') {
    await page.evaluate((sel) => {
      document.querySelector<HTMLInputElement>(sel.downloadAllRadio)?.click();
    }, SELECTORS);
    return;
  }

  if (selection === 'paid') {
    const priceTexts = await readPriceTexts(page);
    const paidNums = priceTexts
      .map((text, index) => ({ num: index + 1, eur: parsePrice(text) }))
      .filter((trip) => trip.eur > 0)
      .map((trip) => trip.num);

    if (paidNums.length === 0) throw new NsDownloadError('No paid trips to select.');

    await clickTripsByIndex(page, paidNums);
    await clickDeclaratiesRadio(page);
    return;
  }

  if (Array.isArray(selection)) {
    if (selection.length === 0) throw new NsDownloadError('Empty trip selection.');
    await clickTripsByIndex(page, selection);
    await clickDeclaratiesRadio(page);
    return;
  }

  const _exhaustive: never = selection;
  throw new NsDownloadError(`Invalid selection: ${String(_exhaustive)}`);
};

export const downloadPdf = async (page: Page, outputPath: string): Promise<string> => {
  mkdirSync(dirname(outputPath), { recursive: true });

  const downloadPromise = page.waitForEvent('download', { timeout: 30000 });

  await page.evaluate((sel) => {
    const btn = document.querySelector(sel.downloadButton) as HTMLElement | null;
    const inner = btn?.shadowRoot?.querySelector('button');
    (inner ?? btn)?.click();
  }, SELECTORS);

  const download = await downloadPromise;
  await download.saveAs(outputPath);
  return outputPath;
};
