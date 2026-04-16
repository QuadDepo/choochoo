import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Page } from 'playwright';
import { SELECTORS } from './selectors';

export type Selection = 'paid' | 'all' | number[];

export class NsDownloadError extends Error {
  name = 'NsDownloadError';
}

export const parseSelection = (input: string): Selection => {
  if (input === 'paid' || input === 'all') return input;
  const nums = input.split(',').map((n) => {
    const trimmed = n.trim();
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
  await page.evaluate((sel) => {
    document.querySelectorAll<HTMLInputElement>(sel.allRadios).forEach((radio) => {
      const label = radio.closest('label') ?? document.querySelector(`label[for="${radio.id}"]`);
      if (label?.textContent?.toLowerCase().includes(sel.declaratiesLabel)) {
        radio.click();
      }
    });
  }, SELECTORS);
};

export const configureDownload = async (page: Page, selection: Selection): Promise<void> => {
  await page.evaluate(() => window.scrollBy(0, 500));

  if (selection === 'all') {
    await page.evaluate((sel) => {
      document.querySelector<HTMLInputElement>(sel.downloadAllRadio)?.click();
    }, SELECTORS);
    return;
  }

  if (selection === 'paid') {
    await page.evaluate((sel) => {
      document.querySelectorAll<HTMLInputElement>(sel.tripCheckbox).forEach((cb) => {
        const container = cb.closest(sel.tripContainer);
        if (!container) return;
        // Mirror of parsePrice() — must be inline since page.evaluate runs in the browser.
        const priceText = container.querySelector(sel.tripPrice)?.textContent?.replace(/\u00a0/g, '').trim() ?? '0';
        const price = parseFloat(priceText.replace('€', '').replace(',', '.').trim()) || 0;
        if (price > 0 && !cb.checked) cb.click();
      });
    }, SELECTORS);
    await clickDeclaratiesRadio(page);
    return;
  }

  if (Array.isArray(selection)) {
    if (selection.length === 0) throw new NsDownloadError('Empty trip selection.');
    await page.evaluate(({ sel, nums }) => {
      document.querySelectorAll<HTMLInputElement>(sel.tripCheckbox).forEach((cb, i) => {
        if (nums.includes(i + 1) && !cb.checked) cb.click();
      });
    }, { sel: SELECTORS, nums: selection });
    await clickDeclaratiesRadio(page);
    return;
  }

  const _exhaustive: never = selection;
  throw new NsDownloadError(`Invalid selection: ${_exhaustive as string}`);
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
