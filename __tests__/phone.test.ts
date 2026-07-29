/**
 * The phone helpers are the one place where what the user types and what the
 * API demands genuinely differ, so the conversion table is pinned here.
 */

import { isValidPhone, normalizePhone, toNationalPhone } from '../src/utils/phone';

describe('normalizePhone', () => {
  it.each([
    ['03001234567', 'national with trunk 0'],
    ['3001234567', 'national without trunk 0'],
    ['+923001234567', 'already E.164'],
    ['923001234567', 'country code, no plus'],
    ['00923001234567', 'international access code'],
    ['0300 123 4567', 'spaces'],
    ['0300-1234567', 'dashes'],
    ['(0300) 1234567', 'parentheses'],
    [' 03001234567 ', 'surrounding whitespace'],
  ])('maps %s (%s) to +923001234567', input => {
    expect(normalizePhone(input)).toBe('+923001234567');
  });

  it('returns empty for a blank or digitless value', () => {
    expect(normalizePhone('')).toBe('');
    expect(normalizePhone('   ')).toBe('');
    expect(normalizePhone('abc')).toBe('');
  });

  it('leaves a number that already carries a country code alone', () => {
    expect(normalizePhone('+447911123456')).toBe('+447911123456');
  });
});

describe('toNationalPhone', () => {
  it('strips the country code for display beside a +92 prefix', () => {
    expect(toNationalPhone('+923001234567')).toBe('3001234567');
  });

  it('round-trips back through normalizePhone', () => {
    expect(normalizePhone(toNationalPhone('+923001234567'))).toBe('+923001234567');
  });

  it('returns empty when there is no number on file', () => {
    expect(toNationalPhone('')).toBe('');
  });
});

describe('isValidPhone', () => {
  it('accepts a blank value, since phone is optional everywhere', () => {
    expect(isValidPhone('')).toBe(true);
  });

  it.each(['03001234567', '3001234567', '+923001234567', '0300 123 4567'])(
    'accepts %s',
    input => {
      expect(isValidPhone(input)).toBe(true);
    },
  );

  // E.164 alone allows 2-15 digits, so these would otherwise pass and be stored.
  it.each(['0300', '0300123', '030012345678999'])(
    'rejects %s on length',
    input => {
      expect(isValidPhone(input)).toBe(false);
    },
  );

  it('applies a looser floor to non-Pakistani numbers', () => {
    expect(isValidPhone('+447911123456')).toBe(true);
    expect(isValidPhone('+44791')).toBe(false);
  });
});
