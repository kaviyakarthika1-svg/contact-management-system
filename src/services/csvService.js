import { activityService } from './activityService';
import { formatDateShort } from '../utils/dateUtils';
import { fullName } from '../utils/contactUtils';

// CSV import/export. Export produces a file that can be re-imported 1:1.
// The parser is a small RFC-4180-style tokenizer that handles quoted cells,
// commas and newlines inside values.

const EXPORT_HEADERS = [
  'firstName', 'lastName', 'phone', 'altPhone', 'email', 'company',
  'jobTitle', 'address', 'city', 'website', 'birthday', 'group',
  'tags', 'relationship', 'favorite',
];

function escapeCell(value) {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function csvRow(cells) {
  return cells.map(escapeCell).join(',');
}

/** Build a CSV string from contacts; groupNameById resolves group names. */
export function contactsToCSV(contacts, groupNameById) {
  const header = csvRow(EXPORT_HEADERS);
  const lines = (contacts || []).map((c) =>
    csvRow([
      c.firstName, c.lastName, c.phone, c.altPhone, c.email, c.company,
      c.jobTitle, c.address, c.city, c.website, c.birthday || '',
      groupNameById ? groupNameById(c.groupId) : '',
      (c.tags || []).join(', '),
      c.relationship || '',
      c.favorite ? 'yes' : '',
    ]),
  );
  return [header, ...lines].join('\r\n');
}

/** Trigger a client-side file download. */
export function downloadFile(filename, content, mime = 'text/csv;charset=utf-8;') {
  try {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

/** Export all contacts; returns the number exported (0 when it failed). */
export function exportContacts(contacts, groupNameById) {
  if (!contacts || contacts.length === 0) return 0;
  const csv = contactsToCSV(contacts, groupNameById);
  const stamp = formatDateShort(new Date().toISOString().slice(0, 10)).replace(/\s/g, '-');
  const ok = downloadFile(`connectsphere-contacts-${stamp}.csv`, csv);
  if (ok) {
    activityService.log({
      type: 'exported',
      message: `Exported ${contacts.length} contact${contacts.length === 1 ? '' : 's'} to CSV`,
    });
  }
  return ok ? contacts.length : 0;
}

/**
 * Parse CSV text into an array of rows (arrays of cell strings).
 * Handles quoted cells, escaped quotes, commas and CRLF inside quotes.
 */
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') { cell += '"'; i += 1; } else inQuotes = false;
      } else cell += char;
      continue;
    }
    if (char === '"') { inQuotes = true; continue; }
    if (char === ',') { row.push(cell); cell = ''; continue; }
    if (char === '\r') continue;
    if (char === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; continue; }
    cell += char;
  }
  if (cell.length > 0 || row.length > 0) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((cellValue) => cellValue.trim() !== ''));
}

const HEADER_ALIASES = {
  firstname: 'firstName', 'first name': 'firstName', 'first_name': 'firstName',
  lastname: 'lastName', 'last name': 'lastName', 'last_name': 'lastName',
  name: 'name',
  phone: 'phone', 'phone number': 'phone', mobile: 'phone', 'mobile number': 'phone',
  altphone: 'altPhone', 'alternate phone': 'altPhone', 'alt phone': 'altPhone',
  email: 'email', 'e-mail': 'email',
  company: 'company', organisation: 'company', organization: 'company',
  jobtitle: 'jobTitle', 'job title': 'jobTitle', title: 'jobTitle', designation: 'jobTitle',
  address: 'address',
  city: 'city',
  website: 'website', url: 'website',
  birthday: 'birthday', dob: 'birthday', 'date of birth': 'birthday',
  group: 'group',
  tags: 'tags', tag: 'tags',
  relationship: 'relationship',
  favorite: 'favorite', favourite: 'favorite',
};

/** Split "Full Name" into first/last when no dedicated columns exist. */
function splitName(full) {
  const parts = (full || '').trim().split(/\s+/);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/**
 * Convert raw CSV text into importable contact values.
 * Returns { rows: [...values], invalid: [{ row, name, errors }] }.
 */
export function csvToContacts(text) {
  const parsed = parseCSV(text);
  if (parsed.length < 2) {
    return { rows: [], invalid: [], error: 'The file needs a header row and at least one contact row.' };
  }

  const headers = parsed[0].map((h) => HEADER_ALIASES[h.trim().toLowerCase()] || h.trim().toLowerCase());
  const rows = [];
  const invalid = [];

  parsed.slice(1).forEach((cells, index) => {
    const record = {};
    headers.forEach((key, i) => { record[key] = (cells[i] || '').trim(); });

    // Accept a single "name" column as a fallback.
    if (!record.firstName && !record.lastName && record.name) {
      const split = splitName(record.name);
      record.firstName = split.firstName;
      record.lastName = split.lastName;
    }

    const errors = [];
    if (!record.firstName && !record.lastName) errors.push('Missing name');
    if (!record.phone) errors.push('Missing phone');
    if (record.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(record.email)) errors.push('Invalid email format');
    if (record.birthday && !/^\d{4}-\d{2}-\d{2}$/.test(record.birthday)) errors.push('Birthday must be YYYY-MM-DD');

    if (errors.length) {
      invalid.push({ row: index + 2, name: `${record.firstName || ''} ${record.lastName || ''}`.trim() || 'Unnamed row', errors });
      return;
    }

    rows.push({
      firstName: record.firstName,
      lastName: record.lastName,
      phone: record.phone,
      altPhone: record.altPhone || '',
      email: record.email || '',
      company: record.company || '',
      jobTitle: record.jobTitle || '',
      address: record.address || '',
      city: record.city || '',
      website: record.website || '',
      birthday: record.birthday || '',
      group: record.group || '',
      tags: record.tags ? record.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      relationship: record.relationship || '',
      favorite: /^(yes|true|1)$/i.test(record.favorite || ''),
    });
  });

  return { rows, invalid, error: null };
}

/** Read a File as text (used by the import UI). */
export function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsText(file);
  });
}

/** Full name helper re-exported for the import preview UI. */
export { fullName };

