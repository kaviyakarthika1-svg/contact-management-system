// Date helpers used across the app. All functions take/return ISO strings
// ("YYYY-MM-DD") or ISO timestamps, never Date objects, to keep the data
// layer serializable.

export const DAY_MS = 24 * 60 * 60 * 1000;

export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function todayISO() {
  return toISODate(new Date());
}

export function dateInDays(days) {
  return toISODate(new Date(Date.now() + days * DAY_MS));
}

export function timestampInDays(days) {
  return new Date(Date.now() + days * DAY_MS).toISOString();
}

export function timestampHoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

/** ISO timestamp for `days` days ago (0 = today). */
export function daysAgoISO(days) {
  return timestampInDays(-days);
}

export function parseISODate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function diffInDays(fromDate, toDate) {
  return Math.round((toDate.getTime() - fromDate.getTime()) / DAY_MS);
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(iso) {
  const d = parseISODate(iso);
  return d ? isSameDay(d, startOfToday()) : false;
}

/** "Sat, 14 Aug 1996" style short date. */
export function formatDate(iso) {
  const d = parseISODate(iso);
  if (!d) return '—';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Compact date for dense UIs: "14 Aug 1996". */
export function formatDateShort(iso) {
  const d = parseISODate(iso);
  if (!d) return '—';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTimestamp(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** Friendly relative time: "just now", "5m ago", "3h ago", "2d ago", "14 Aug". */
export function timeAgo(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDateShort(new Date(iso).toISOString().slice(0, 10));
}

/** Relative day bucket for the activity timeline / reminder lists. */
export function relativeDayLabel(iso) {
  if (!iso) return '';
  const d = iso.length === 10 ? parseISODate(iso) : new Date(iso);
  if (!d) return '';
  const today = startOfToday();
  if (isSameDay(d, today)) return 'Today';
  if (isSameDay(d, new Date(today.getTime() - DAY_MS))) return 'Yesterday';
  if (isSameDay(d, new Date(today.getTime() + DAY_MS))) return 'Tomorrow';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
}

/**
 * Next occurrence of a birthday (month/day) and how many days remain.
 * Returns { nextDate, daysUntil } where 0 means "today".
 */
export function upcomingBirthday(birthdayISO) {
  const b = parseISODate(birthdayISO);
  if (!b) return null;
  const today = startOfToday();
  let next = new Date(today.getFullYear(), b.getMonth(), b.getDate());
  if (next.getTime() < today.getTime()) {
    next = new Date(today.getFullYear() + 1, b.getMonth(), b.getDate());
  }
  const daysUntil = diffInDays(today, next);
  return { nextDate: next, daysUntil };
}

/** Age in whole years as of today. */
export function ageFromBirthday(birthdayISO) {
  const b = parseISODate(birthdayISO);
  if (!b) return null;
  const today = new Date();
  let age = today.getFullYear() - b.getFullYear();
  const beforeBirthday =
    today.getMonth() < b.getMonth() ||
    (today.getMonth() === b.getMonth() && today.getDate() < b.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

/** "YYYY-MM" key used by the dashboard "contacts added per month" chart. */
export function monthKey(iso) {
  return iso ? iso.slice(0, 7) : '';
}

export function formatMonthLabel(key) {
  if (!key) return '';
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'short' });
}

/** True when the ISO timestamp falls within the last `days` days. */
export function isWithinDays(iso, days) {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() <= days * DAY_MS;
}
