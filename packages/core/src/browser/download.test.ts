import { describe, expect, it } from 'vitest';
import { NsDownloadError, parseSelection } from './download';

describe('parseSelection', () => {
  it('returns "paid" verbatim', () => {
    expect(parseSelection('paid')).toBe('paid');
  });

  it('returns "all" verbatim', () => {
    expect(parseSelection('all')).toBe('all');
  });

  it('parses comma-separated trip numbers', () => {
    expect(parseSelection('1,2,3')).toEqual([1, 2, 3]);
  });

  it('trims whitespace around numbers', () => {
    expect(parseSelection('1, 2 , 3')).toEqual([1, 2, 3]);
  });

  it.each(['', '0', '-1', '1.5', '1,2,', 'abc', '1, ,3'])('throws NsDownloadError for invalid input %p', (input) => {
    expect(() => parseSelection(input)).toThrow(NsDownloadError);
  });

  it('throws error for zero (must be positive)', () => {
    expect(() => parseSelection('0')).toThrow(/Invalid trip number: "0"/);
  });

  it('throws error for negatives', () => {
    expect(() => parseSelection('-1')).toThrow(/Invalid trip number: "-1"/);
  });

  it('throws error for floats', () => {
    expect(() => parseSelection('1.5')).toThrow(/Invalid trip number: "1.5"/);
  });
});
