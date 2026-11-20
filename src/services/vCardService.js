import { downloadFile } from './storage';

/**
 * Generate a vCard (VCF) string from a contact object.
 * Follows vCard 3.0 format for maximum compatibility.
 */
export function contactToVCard(contact) {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${contact.firstName} ${contact.lastName}`.trim(),
    `N:${contact.lastName || ''};${contact.firstName || ''};;;`,
  ];

  if (contact.company) lines.push(`ORG:${contact.company}`);
  if (contact.jobTitle) lines.push(`TITLE:${contact.jobTitle}`);
  if (contact.phone) lines.push(`TEL;TYPE=CELL:${contact.phone}`);
  if (contact.altPhone) lines.push(`TEL;TYPE=WORK:${contact.altPhone}`);
  if (contact.email) lines.push(`EMAIL;TYPE=INTERNET:${contact.email}`);
  if (contact.website) lines.push(`URL:${contact.website}`);
  if (contact.address || contact.city) {
    const addr = `${contact.address || ''};${contact.city || ''};;`;
    lines.push(`ADR;TYPE=HOME:;;${addr}`);
  }
  if (contact.birthday) {
    const bday = contact.birthday.replace(/-/g, '');
    lines.push(`BDAY:${bday}`);
  }
  if (contact.notes) lines.push(`NOTE:${contact.notes}`);
  if (contact.relationship) lines.push(`CATEGORIES:${contact.relationship}`);

  lines.push('END:VCARD');
  return lines.join('\r\n');
}

/**
 * Download a contact as a .vcf file.
 */
export function exportContactAsVCard(contact) {
  const vcard = contactToVCard(contact);
  const filename = `${contact.firstName}-${contact.lastName}`.replace(/\s+/g, '-').toLowerCase() || 'contact';
  return downloadFile(`${filename}.vcf`, vcard, 'text/vcard');
}

/**
 * Generate a shareable contact payload for Web Share API or QR codes.
 */
export function contactToSharePayload(contact) {
  return {
    title: `${contact.firstName} ${contact.lastName}`.trim(),
    text: [
      contact.phone && `📞 ${contact.phone}`,
      contact.email && `✉️ ${contact.email}`,
      contact.company && `🏢 ${contact.company}`,
      contact.website && `🌐 ${contact.website}`,
    ].filter(Boolean).join('\n'),
    url: contact.website || undefined,
  };
}