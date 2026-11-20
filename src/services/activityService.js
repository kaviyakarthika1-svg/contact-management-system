import { createStore } from './createStore';
import { KEYS } from './storage';
import { seedActivities } from './seedData';
import { uid } from '../utils/id';

// Append-only activity log, capped so localStorage stays small.
const MAX_ACTIVITIES = 250;

const store = createStore(KEYS.activities, seedActivities);

/**
 * Record an activity entry.
 * @param {object} entry { type, message, contactId?, contactName? }
 */
function log(entry) {
  const { type, message = '', contactId = null, contactName = '' } = entry;
  const item = {
    id: uid('a'),
    type,
    message,
    contactId,
    contactName,
    timestamp: new Date().toISOString(),
  };
  store.set((list) => [item, ...list].slice(0, MAX_ACTIVITIES));
}

function getAll() {
  return store.getSnapshot();
}

function getForContact(contactId) {
  return store.getSnapshot().filter((a) => a.contactId === contactId);
}

/** Remove every activity entry (Settings → clear activity). */
function clearActivities() {
  store.set([]);
}

export const activityService = {
  store,
  log,
  getAll,
  getForContact,
  clearActivities,
};
