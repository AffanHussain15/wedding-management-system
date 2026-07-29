/**
 * Best-effort phone-number handling for imported contacts. There is no
 * phone-number library in the project and no reliable signal for a contact's
 * country, so normalization is intentionally shallow: strip formatting, keep
 * a leading `+` if present, and compare by trailing digits so the same number
 * still matches whether or not a country code was captured.
 */

/** "(0300) 123-4567" → "03001234567"; "+92 300 123 4567" → "+923001234567". */
export const normalizePhone = (raw: string): string => {
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return digits ? `${hasPlus ? '+' : ''}${digits}` : '';
};

/** Trailing 10 digits, used as a country-code-agnostic dedupe key. */
export const phoneMatchKey = (raw: string): string => {
  const digits = normalizePhone(raw).replace(/\D/g, '');
  return digits.slice(-10);
};
