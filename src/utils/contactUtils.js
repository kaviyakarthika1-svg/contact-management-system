import { callableNumber } from './validators';
import { upcomingBirthday, isWithinDays } from './dateUtils';

// Domain helpers for contacts: display names, search matching, link builders,
// profile completeness scoring and sorting.

export function fullName(contact) {
  if (!contact) return '';
  return `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
}

export function initials(contact) {
  const first = (contact?.firstName || '').trim();
  const last = (contact?.lastName || '').trim();
  const a = first.charAt(0);
  const b = last.charAt(0);
  return `${a}${b || (first.charAt(1) || '')}`.toUpperCase() || '?';
}

const AVATAR_COLORS = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#3b82f6', '#84cc16', '#d946ef',
];

/** Deterministic avatar background color from the contact's name. */
export function avatarColor(name) {
  let hash = 0;
  const str = name || '';
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/* ------------------------------------------------------------------ */
/* Link builders (tel:, sms:, mailto:, WhatsApp, Google Maps)          */
/* ------------------------------------------------------------------ */

export function telLink(phone) {
  return `tel:${callableNumber(phone)}`;
}

export function smsLink(phone) {
  return `sms:${callableNumber(phone)}`;
}

export function mailtoLink(email) {
  return `mailto:${email || ''}`;
}

export function whatsappLink(phone) {
  const digits = callableNumber(phone).replace(/\+/g, '');
  return `https://wa.me/${digits}`;
}

export function mapsLink(contact) {
  const parts = [contact?.address, contact?.city].filter(Boolean);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(', '))}`;
}

/* ------------------------------------------------------------------ */
/* Search & filtering                                                  */
/* ------------------------------------------------------------------ */

/** Case-insensitive "contains" match across the fields global search covers. */
export function contactMatchesQuery(contact, query, groupName = '') {
  const q = (query || '').trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    contact.firstName,
    contact.lastName,
    contact.phone,
    contact.altPhone,
    contact.email,
    contact.company,
    contact.jobTitle,
    contact.city,
    groupName,
    contact.relationship,
    ...(contact.tags || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

/* ------------------------------------------------------------------ */
/* Insights                                                            */
/* ------------------------------------------------------------------ */

const COMPLETENESS_FIELDS = [
  { key: 'email', label: 'Email', weight: 12 },
  { key: 'company', label: 'Company', weight: 8 },
  { key: 'jobTitle', label: 'Job title', weight: 6 },
  { key: 'address', label: 'Address', weight: 8 },
  { key: 'city', label: 'City', weight: 4 },
  { key: 'website', label: 'Website', weight: 5 },
  { key: 'birthday', label: 'Birthday', weight: 12 },
  { key: 'groupId', label: 'Group', weight: 8 },
  { key: 'tags', label: 'Tags', weight: 7 },
  { key: 'relationship', label: 'Relationship', weight: 8 },
  { key: 'notes', label: 'Notes', weight: 7 },
  { key: 'avatar', label: 'Photo', weight: 5 },
];

/**
 * Profile completeness: base 20% for the required fields (name + phone),
 * plus weighted optional fields. Returns { percent, missing[] }.
 */
export function profileCompleteness(contact) {
  if (!contact) return { percent: 0, missing: [] };
  let percent = 20;
  const missing = [];
  COMPLETENESS_FIELDS.forEach((field) => {
    const value = contact[field.key];
    const filled = Array.isArray(value) ? value.length > 0 : Boolean(value && String(value).trim());
    if (filled) percent += field.weight;
    else missing.push(field.label);
  });
  return { percent: Math.min(100, percent), missing };
}

/** Days since the last interaction (call/email/etc). Infinity if never. */
export function daysSinceLastContact(contact) {
  if (!contact?.lastContactedAt) return Infinity;
  return Math.floor((Date.now() - new Date(contact.lastContactedAt).getTime()) / 86400000);
}

/** Human label for the "last interaction" insight. */
export function lastContactLabel(contact) {
  if (!contact?.lastContactedAt) return 'Never contacted';
  const days = daysSinceLastContact(contact);
  if (days <= 0) return 'Contacted today';
  if (days === 1) return 'Contacted yesterday';
  if (days < 30) return `Contacted ${days} days ago`;
  return 'Not contacted recently';
}

export function needsFollowUp(contact) {
  const days = daysSinceLastContact(contact);
  return days >= 21;
}

/* ------------------------------------------------------------------ */
/* Sorting & misc                                                      */
/* ------------------------------------------------------------------ */

export const SORT_OPTIONS = [
  { id: 'name-asc', label: 'Name (A → Z)' },
  { id: 'name-desc', label: 'Name (Z → A)' },
  { id: 'newest', label: 'Recently added' },
  { id: 'contacted', label: 'Recently contacted' },
];

export function sortContacts(contacts, sortId) {
  const list = [...(contacts || [])];
  switch (sortId) {
    case 'name-asc':
      return list.sort((a, b) => fullName(a).localeCompare(fullName(b)));
    case 'name-desc':
      return list.sort((a, b) => fullName(b).localeCompare(fullName(a)));
    case 'contacted':
      return list.sort((a, b) => {
        const av = a.lastContactedAt ? new Date(a.lastContactedAt).getTime() : 0;
        const bv = b.lastContactedAt ? new Date(b.lastContactedAt).getTime() : 0;
        return bv - av;
      });
    case 'newest':
    default:
      return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

/** Days remaining until the next birthday (null when unknown). */
export function birthdayCountdown(contact) {
  if (!contact?.birthday) return null;
  const info = upcomingBirthday(contact.birthday);
  return info ? info.daysUntil : null;
}

export function wasAddedRecently(contact, days = 30) {
  return isWithinDays(contact?.createdAt, days);
}

