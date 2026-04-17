import { describe, it, expect } from 'vitest';
import { pdfFilename, tripsFilename } from './filenames';

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
    expect(tripsFilename('this-month')).toMatch(
      new RegExp(`^trips-this-month-${ISO_DATE.source}\\.json$`),
    );
  });
});
