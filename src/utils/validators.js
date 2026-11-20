// Validation helpers shared by the contact form, CSV import and duplicate checks.

export function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/** Digits only, ignoring formatting characters like spaces, dashes, brackets. */
export function phoneDigits(phone) {
  return (phone || '').replace(/\D/g, '');
}

/** True when the string looks like a usable phone number (7–15 digits, optional +). */
export function isValidPhone(phone) {
  const raw = (phone || '').trim();
  if (!raw) return false;
  if (!/^\+?[\d\s()\-]+$/.test(raw)) return false;
  const digits = phoneDigits(raw);
  return digits.length >= 7 && digits.length <= 15;
}

/** Key used for duplicate detection: last 10 digits, so "+91 98765 43210"
 *  and "9876543210" are considered the same number. */
export function normalizePhoneKey(phone) {
  const digits = phoneDigits(phone);
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function isValidWebsite(url) {
  if (!url) return false;
  return /^(https?:\/\/)?[\w-]+(\.[\w-]+)+([/?#][^\s]*)?$/i.test(url.trim());
}

/** Digits suitable for tel:/wa.me links (keeps a leading +). */
export function callableNumber(phone) {
  return (phone || '').replace(/[^\d+]/g, '');
}
