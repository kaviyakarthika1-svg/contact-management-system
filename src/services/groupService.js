import { createStore } from './createStore';
import { KEYS } from './storage';
import { seedGroups } from './seedData';
import { uid } from '../utils/id';
import { GROUP_COLORS } from '../utils/constants';
import { activityService } from './activityService';
import { contactService } from './contactService';

// Groups are simple labeled buckets; each contact stores its groupId.
const store = createStore(KEYS.groups, seedGroups);

function getAll() {
  return store.getSnapshot();
}

function getById(id) {
  return store.getSnapshot().find((g) => g.id === id) || null;
}

function getNameById(id) {
  return getById(id)?.name || '';
}

function add(name, color) {
  const group = {
    id: uid('g'),
    name: (name || '').trim(),
    color: color || GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)],
    createdAt: new Date().toISOString(),
  };
  store.set((list) => [...list, group]);
  activityService.log({ type: 'group-created', message: `Created group "${group.name}"` });
  return group;
}

function rename(id, name) {
  let updated = null;
  store.set((list) =>
    list.map((g) => {
      if (g.id !== id) return g;
      updated = { ...g, name: (name || '').trim() };
      return updated;
    }),
  );
  if (updated) {
    activityService.log({ type: 'group-renamed', message: `Renamed a group to "${updated.name}"` });
  }
  return updated;
}

/** Delete a group and move its contacts to "No group". */
function remove(id) {
  const group = getById(id);
  if (!group) return null;
  const affected = contactService.clearGroup(id);
  store.set((list) => list.filter((g) => g.id !== id));
  activityService.log({
    type: 'group-deleted',
    message: `Deleted group "${group.name}"${affected ? ` (${affected} contacts moved to No group)` : ''}`,
  });
  return group;
}

/** Contact count per group id — used by cards and the dashboard. */
function countContacts(contacts) {
  const counts = {};
  (contacts || []).forEach((c) => {
    if (c.groupId) counts[c.groupId] = (counts[c.groupId] || 0) + 1;
  });
  return counts;
}

export const groupService = {
  store,
  getAll,
  getById,
  getNameById,
  add,
  rename,
  remove,
  countContacts,
};
