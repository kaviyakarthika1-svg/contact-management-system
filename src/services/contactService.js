import { createStore } from './createStore';
import { load, save, KEYS } from './storage';
import { seedContacts, seedRecentlyViewed } from './seedData';
import { uid } from '../utils/id';
import { activityService } from './activityService';
import { reminderService } from './reminderService';
import { contactMatchesQuery, fullName } from '../utils/contactUtils';
import { isValidPhone, isValidEmail, normalizePhoneKey } from '../utils/validators';

// The central contact data service. ALL contact mutations go through here so
// that activity logging and localStorage persistence stay in one place.
// Components never call localStorage directly — they call these functions.

const store = createStore(KEYS.contacts, seedContacts);

/** Recently viewed is a separate small collection: [{ contactId, at }]. */
export const viewedStore = createStore(KEYS.recentlyViewed, seedRecentlyViewed);

/**
 * Wrapper that enriches raw viewed entries with the full contact object.
 * Components subscribe to this instead of viewedStore directly so they
 * always receive { contactId, at, contact } tuples and never crash on
 * missing contacts (e.g. after a contact is deleted).
 *
 * The getSnapshot() method returns a stable reference when the underlying
 * data hasn't changed, to comply with useSyncExternalStore's contract.
 */
let cachedEnrichedSnapshot = null;
let cachedRawSnapshot = null;

const recentlyViewedEnrichedStore = {
  key: KEYS.recentlyViewed,
  subscribe(listener) {
    return viewedStore.subscribe(listener);
  },
  getSnapshot() {
    const raw = viewedStore.getSnapshot();
    // Return cached result if underlying data hasn't changed
    if (cachedRawSnapshot === raw && cachedEnrichedSnapshot !== null) {
      return cachedEnrichedSnapshot;
    }
    cachedRawSnapshot = raw;
    cachedEnrichedSnapshot = getRecentlyViewed();
    return cachedEnrichedSnapshot;
  },
};

const nowISO = () => new Date().toISOString();

function getAll() {
  return store.getSnapshot();
}

function getById(id) {
  return store.getSnapshot().find((c) => c.id === id) || null;
}

function getFavorites() {
  return store.getSnapshot().filter((c) => c.favorite);
}

function getContactsInGroup(groupId) {
  return store.getSnapshot().filter((c) => c.groupId === groupId);
}

/** Build a normalised contact object from form/CSV values. */
function buildContact(values) {
  return {
    id: uid('c'),
    firstName: (values.firstName || '').trim(),
    lastName: (values.lastName || '').trim(),
    phone: (values.phone || '').trim(),
    altPhone: (values.altPhone || '').trim(),
    email: (values.email || '').trim(),
    company: (values.company || '').trim(),
    jobTitle: (values.jobTitle || '').trim(),
    address: (values.address || '').trim(),
    city: (values.city || '').trim(),
    website: (values.website || '').trim(),
    birthday: values.birthday || '',
    groupId: values.groupId || '',
    tags: Array.isArray(values.tags) ? values.tags.map((t) => t.trim()).filter(Boolean) : [],
    relationship: values.relationship || '',
    notes: [],
    avatar: values.avatar || null,
    favorite: Boolean(values.favorite),
    important: Boolean(values.important),
    lastContactedAt: values.lastContactedAt || null,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
}

/** Add a contact and record activity. */
function add(values) {
  const contact = buildContact(values);
  store.set((list) => [...list, contact]);
  activityService.log({
    type: 'added',
    message: `Added ${fullName(contact)} to contacts`,
    contactId: contact.id,
    contactName: fullName(contact),
  });
  return contact;
}

/** Internal patch helper — no activity logging. */
function patchContact(id, changes) {
  let updated = null;
  store.set((list) =>
    list.map((c) => {
      if (c.id !== id) return c;
      updated = { ...c, ...changes, updatedAt: nowISO() };
      return updated;
    }),
  );
  return updated;
}

/** Update a contact and record activity. */
function update(id, patch) {
  const updated = patchContact(id, patch);
  if (updated) {
    activityService.log({
      type: 'updated',
      message: `Updated ${fullName(updated)}`,
      contactId: updated.id,
      contactName: fullName(updated),
    });
  }
  return updated;
}

/** Delete a contact, its reminders and record activity. */
function remove(id) {
  const contact = getById(id);
  if (!contact) return null;
  store.set((list) => list.filter((c) => c.id !== id));
  reminderService.removeForContact(id);
  viewedStore.set((list) => list.filter((v) => v.contactId !== id));
  activityService.log({
    type: 'deleted',
    message: `Deleted ${fullName(contact)}`,
    contactName: fullName(contact),
  });
  return contact;
}

/* ------------------------------------------------------------------ */
/* Favorites & important flag                                          */
/* ------------------------------------------------------------------ */

function toggleFavorite(id) {
  const contact = getById(id);
  if (!contact) return null;
  const updated = patchContact(id, { favorite: !contact.favorite });
  activityService.log({
    type: updated.favorite ? 'favorite' : 'unfavorite',
    message: updated.favorite
      ? `Marked ${fullName(updated)} as a favorite`
      : `Removed ${fullName(updated)} from favorites`,
    contactId: updated.id,
    contactName: fullName(updated),
  });
  return updated;
}

function setImportant(id, important) {
  const updated = patchContact(id, { important: Boolean(important) });
  if (updated) {
    activityService.log({
      type: 'important',
      message: important
        ? `Marked ${fullName(updated)} as important`
        : `Removed the important flag from ${fullName(updated)}`,
      contactId: updated.id,
      contactName: fullName(updated),
    });
  }
  return updated;
}

/* ------------------------------------------------------------------ */
/* Duplicate detection                                                 */
/* ------------------------------------------------------------------ */

/** Contacts whose phone OR email matches (excluding `exceptId`). */
function findDuplicates({ phone, email }, exceptId = null) {
  const normPhone = phone ? normalizePhoneKey(phone) : '';
  const normEmail = (email || '').trim().toLowerCase();
  if (!normPhone && !normEmail) return [];
  return store.getSnapshot().filter((c) => {
    if (exceptId && c.id === exceptId) return false;
    const samePhone = normPhone && c.phone && normalizePhoneKey(c.phone) === normPhone;
    const sameEmail = normEmail && (c.email || '').toLowerCase() === normEmail;
    return samePhone || sameEmail;
  });
}

/* ------------------------------------------------------------------ */
/* Notes                                                               */
/* ------------------------------------------------------------------ */

function addNote(contactId, text) {
  const trimmed = (text || '').trim();
  if (!trimmed) return null;
  const item = { id: uid('n'), text: trimmed, createdAt: nowISO(), updatedAt: nowISO() };
  const contact = getById(contactId);
  if (!contact) return null;
  patchContact(contactId, { notes: [...(contact.notes || []), item] });
  activityService.log({
    type: 'note-added',
    message: 'Note added',
    contactId,
    contactName: fullName(contact),
  });
  return item;
}

function updateNote(contactId, noteId, text) {
  const contact = getById(contactId);
  if (!contact) return null;
  const notes = (contact.notes || []).map((n) =>
    n.id === noteId ? { ...n, text: (text || '').trim(), updatedAt: nowISO() } : n,
  );
  patchContact(contactId, { notes });
  activityService.log({
    type: 'note-updated',
    message: 'Note updated',
    contactId,
    contactName: fullName(contact),
  });
  return notes;
}

function deleteNote(contactId, noteId) {
  const contact = getById(contactId);
  if (!contact) return null;
  patchContact(contactId, { notes: (contact.notes || []).filter((n) => n.id !== noteId) });
  activityService.log({
    type: 'note-deleted',
    message: 'Note deleted',
    contactId,
    contactName: fullName(contact),
  });
  return true;
}

/* ------------------------------------------------------------------ */
/* Interactions (tel/mail/whatsapp/sms clicks) & recently viewed       */
/* ------------------------------------------------------------------ */

const CHANNEL_ACTIVITY = {
  called: { type: 'called', message: (name) => `Clicked call for ${name}` },
  messaged: { type: 'messaged', message: (name) => `Clicked message for ${name}` },
  emailed: { type: 'emailed', message: (name) => `Clicked email for ${name}` },
  whatsapp: { type: 'whatsapp', message: (name) => `Opened WhatsApp chat with ${name}` },
};

/** Record an interaction (call/email/etc) → updates "last contacted" + activity. */
function logInteraction(contactId, channel) {
  const meta = CHANNEL_ACTIVITY[channel];
  if (!meta) return;
  const contact = getById(contactId);
  if (!contact) return;
  patchContact(contactId, { lastContactedAt: nowISO() });
  activityService.log({
    type: meta.type,
    message: meta.message(fullName(contact)),
    contactId,
    contactName: fullName(contact),
  });
}

/** Track the last contacts opened (dashboard → "Recently Viewed"). */
function recordView(contactId) {
  const viewed = viewedStore.getSnapshot();
  const recent = viewed[0];
  // Avoid duplicate bursts (StrictMode double-effects / rapid clicks).
  if (recent && recent.contactId === contactId && Date.now() - new Date(recent.at).getTime() < 5000) {
    return;
  }
  const next = [{ contactId, at: nowISO() }, ...viewed.filter((v) => v.contactId !== contactId)].slice(0, 10);
  viewedStore.set(next);
}

function getRecentlyViewed(limit = 6) {
  return viewedStore
    .getSnapshot()
    .map((v) => ({ ...v, contact: getById(v.contactId) }))
    .filter((v) => v.contact)
    .slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Search & import                                                     */
/* ------------------------------------------------------------------ */

function groupNameById(groupId) {
  // Groups are resolved by the caller to keep this service decoupled;
  // search accepts an optional name for group matching.
  return groupId || '';
}

/** Filter + sort contacts using the shared matching helper. */
function searchContacts(contacts, query, groupNameResolver = groupNameById) {
  return (contacts || []).filter((c) => contactMatchesQuery(c, query, groupNameResolver(c.groupId)));
}

/**
 * Import rows coming from the CSV importer.
 * Skips invalid rows and duplicates; returns a summary for the UI.
 */
function importContacts(rows, { skipDuplicates = true } = {}) {
  let added = 0;
  const duplicates = [];
  const invalid = [];

  (rows || []).forEach((row, index) => {
    const errors = [];
    if (!row.firstName?.trim() && !row.lastName?.trim()) errors.push('Name is required');
    if (!isValidPhone(row.phone || '')) errors.push('Valid phone is required');
    if (row.email && !isValidEmail(row.email)) errors.push('Invalid email');
    if (errors.length) {
      invalid.push({ row: index + 1, name: `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'Unnamed', errors });
      return;
    }
    const dupes = findDuplicates({ phone: row.phone, email: row.email });
    if (dupes.length && skipDuplicates) {
      duplicates.push({ row: index + 1, name: `${row.firstName} ${row.lastName}`.trim(), matched: fullName(dupes[0]) });
      return;
    }
    add({
      ...row,
      tags: Array.isArray(row.tags) ? row.tags : String(row.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
    });
    added += 1;
  });

  if (added > 0 || (rows || []).length > 0) {
    activityService.log({
      type: 'imported',
      message: `Imported ${added} contact${added === 1 ? '' : 's'} from CSV`,
    });
  }
  return { added, duplicates, invalid };
}

/* ------------------------------------------------------------------ */
/* Group helpers (used by groupService)                                */
/* ------------------------------------------------------------------ */

/** Move all contacts out of a group (when the group is deleted). */
function clearGroup(groupId) {
  const affected = store.getSnapshot().filter((c) => c.groupId === groupId);
  store.set((list) => list.map((c) => (c.groupId === groupId ? { ...c, groupId: '' } : c)));
  return affected.length;
}

export const contactService = {
  store,
  viewedStore,
  getAll,
  getById,
  getFavorites,
  getContactsInGroup,
  add,
  update,
  remove,
  toggleFavorite,
  setImportant,
  findDuplicates,
  addNote,
  updateNote,
  deleteNote,
  logInteraction,
  recordView,
  getRecentlyViewed,
  searchContacts,
  importContacts,
  clearGroup,
};

// Re-export for convenience in hooks that subscribe to recently-viewed data.
export { viewedStore as recentlyViewedStore, recentlyViewedEnrichedStore, save, load, KEYS };


