/**
 * Best-effort phone-number handling for imported contacts. There is no
 * phone-number library in the project and no reliable signal for a contact's
 * country, so normalization is intentionally shallow: strip formatting, keep
 * a leading `+` if present, and compare by trailing digits so the same number
 * still matches whether or not a country code was captured.
 */

/** "(0300) 123-4567" → "03001234567"; "+92 300 123 4567" → "+923001234567". */
// export const normalizePhone = (raw: string): string => {
//   const trimmed = raw.trim();
//   const hasPlus = trimmed.startsWith('+');
//   const digits = trimmed.replace(/\D/g, '');
//   return digits ? `${hasPlus ? '+' : ''}${digits}` : '';
// };

/** Trailing 10 digits, used as a country-code-agnostic dedupe key. */
export const phoneMatchKey = (raw: string): string => {
  const digits = normalizePhone(raw).replace(/\D/g, '');
  return digits.slice(-10);
};

import { E164_PHONE } from '@constants';

/** Pakistan's country calling code, without the leading `+`. */
export const PK_DIAL_CODE = '92';

/**
 * The shortest national number worth treating as complete. Pakistani mobiles
 * are 10 digits after the trunk `0` (`3001234567`), and this also guards the
 * country-code check below from firing on a number that merely starts with 92.
 */
const MIN_NATIONAL_DIGITS = 9;

/** Strips everything a human might type as separators: spaces, dashes, parens. */
const digitsOnly = (value: string): string => value.replace(/\D/g, '');

/**
 * Anything a user might type → E.164, or '' when there is nothing to convert.
 *
 * Accepted, all yielding `+923001234567`:
 *   `03001234567`     national with the trunk 0
 *   `3001234567`      national without it
 *   `+923001234567`   already E.164
 *   `923001234567`    country code, no plus
 *   `00923001234567`  international access code
 *   `0300 123 4567`   any of the above with separators
 *
 * A number that already carries a `+` is trusted as-is, so a non-Pakistani
 * number typed in full is never rewritten to `+92`.
 */
export function normalizePhone(value: string, dialCode = PK_DIAL_CODE): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  // An explicit `+` means the user gave a country code; don't second-guess it.
  if (trimmed.startsWith('+')) {
    const digits = digitsOnly(trimmed);
    return digits ? `+${digits}` : '';
  }

  let digits = digitsOnly(trimmed);
  if (!digits) return '';

  // `00` is the international access code — the written form of `+`.
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
    return digits ? `+${digits}` : '';
  }

  // Already carries the country code, just without the plus. The length guard
  // keeps a national number that happens to begin with 92 out of this branch.
  if (
    digits.startsWith(dialCode) &&
    digits.length >= dialCode.length + MIN_NATIONAL_DIGITS
  ) {
    return `+${digits}`;
  }

  // National form: drop the trunk prefix, which is never part of E.164.
  return `+${dialCode}${digits.replace(/^0+/, '')}`;
}

/**
 * E.164 (or anything else) → the national digits to show in a field that
 * already renders `+92` as a fixed prefix. `+923001234567` → `3001234567`.
 */
export function toNationalPhone(value: string, dialCode = PK_DIAL_CODE): string {
  const digits = digitsOnly(value);
  if (!digits) return '';
  const withoutCode = digits.startsWith(dialCode)
    ? digits.slice(dialCode.length)
    : digits;
  return withoutCode.replace(/^0+/, '');
}

/** Digits in a full Pakistani number: the 92 code plus a 10-digit mobile. */
const PK_TOTAL_DIGITS = 12;

/**
 * Shortest plausible international number, digits included. Only used for
 * non-+92 numbers, where the national length varies by country.
 */
const MIN_INTERNATIONAL_DIGITS = 8;

/**
 * True when `value` normalises to something the API will accept. A blank value
 * is valid: phone is optional everywhere, and callers omit it rather than
 * sending '' (which fails the server's E.164 check instead of clearing it).
 *
 * E.164 alone is too permissive to validate against — it allows 2–15 digits, so
 * a half-typed `0300` becomes a "valid" `+92300` that the server also accepts
 * and stores. Pakistani numbers are therefore length-checked exactly, and
 * foreign ones against a floor.
 */
export function isValidPhone(value: string): boolean {
  const normalized = normalizePhone(value);
  if (!normalized) return true;
  if (!E164_PHONE.test(normalized)) return false;

  const digits = normalized.slice(1);
  return digits.startsWith(PK_DIAL_CODE)
    ? digits.length === PK_TOTAL_DIGITS
    : digits.length >= MIN_INTERNATIONAL_DIGITS;
}
