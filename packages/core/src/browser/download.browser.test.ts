import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestSession, type TestSession } from '../../test/helpers/browser';
import { configureDownload, NsDownloadError } from './download';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => readFileSync(join(here, '..', '..', 'test', 'fixtures', `${name}.html`), 'utf8');

let session: TestSession;

beforeAll(async () => {
  session = await createTestSession();
});

afterAll(async () => {
  await session.close();
});

beforeEach(async () => {
  await session.page.setContent(fixture('download-form'));
});

const checkboxStates = () =>
  session.page.$$eval('input[id^="declare-HB-"]', (els) =>
    (els as HTMLInputElement[]).map((e) => ({ id: e.id, checked: e.checked })),
  );

const isChecked = (selector: string) => session.page.$eval(selector, (el) => (el as HTMLInputElement).checked);

describe('configureDownload (fixture)', () => {
  it('"all" mode clicks the downloadAllTransactions radio', async () => {
    await configureDownload(session.page, 'all');
    expect(await isChecked('#downloadAllTransactions')).toBe(true);
  });

  it('"paid" mode checks only non-zero-cost trips and the declaraties radio', async () => {
    await configureDownload(session.page, 'paid');

    expect(await checkboxStates()).toEqual([
      { id: 'declare-HB-trip1', checked: true },
      { id: 'declare-HB-trip2', checked: true },
      { id: 'declare-HB-trip3', checked: false },
      { id: 'declare-HB-trip4', checked: true },
    ]);
    expect(await isChecked('#declaraties')).toBe(true);
  });

  it('array mode checks only the specified trip numbers (1-based) and the declaraties radio', async () => {
    await configureDownload(session.page, [1, 3]);

    expect(await checkboxStates()).toEqual([
      { id: 'declare-HB-trip1', checked: true },
      { id: 'declare-HB-trip2', checked: false },
      { id: 'declare-HB-trip3', checked: true },
      { id: 'declare-HB-trip4', checked: false },
    ]);
    expect(await isChecked('#declaraties')).toBe(true);
  });

  it('throws NsDownloadError for an empty trip selection', async () => {
    await expect(configureDownload(session.page, [])).rejects.toThrow(NsDownloadError);
  });

  it('throws NsDownloadError when the declaraties radio is missing', async () => {
    await session.page.setContent(fixture('download-form-no-declaraties'));
    await expect(configureDownload(session.page, [1])).rejects.toThrow(/declaration radio button/);
  });
});
