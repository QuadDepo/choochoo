import { describe, expect, it } from 'vitest';
import { DEFAULT_DOWNLOADS_DIR } from '../config';
import { defaultPdfPath, pdfFilename, tripsFilename } from './filenames';

const ISO_DATE = /\d{4}-\d{2}-\d{2}/;

describe('pdfFilename', () => {
  it('uses the ns-declaratie prefix and .pdf extension', () => {
    const name = pdfFilename('this-month');
    expect(name).toMatch(/^ns-declaratie-/);
    expect(name).toMatch(/\.pdf$/);
  });

  it('embeds the period and today in ISO format', () => {
    expect(pdfFilename('previous-month')).toMatch(
      new RegExp(`^ns-declaratie-previous-month-${ISO_DATE.source}\\.pdf$`),
    );
  });
});

describe('tripsFilename', () => {
  it('uses the trips prefix and .json extension', () => {
    expect(tripsFilename('this-month')).toMatch(new RegExp(`^trips-this-month-${ISO_DATE.source}\\.json$`));
  });
});

describe('defaultPdfPath', () => {
  it('joins the given downloadsDir with the pdf filename', () => {
    const path = defaultPdfPath('this-month', '/tmp/custom');
    expect(path).toMatch(new RegExp(`^/tmp/custom/ns-declaratie-this-month-${ISO_DATE.source}\\.pdf$`));
  });

  it('falls back to DEFAULT_DOWNLOADS_DIR when no dir provided', () => {
    const path = defaultPdfPath('this-month');
    expect(path.startsWith(DEFAULT_DOWNLOADS_DIR)).toBe(true);
    expect(path).toMatch(/\.pdf$/);
  });
});
