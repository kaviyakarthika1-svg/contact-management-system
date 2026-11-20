import { createStore } from './createStore';
import { KEYS } from './storage';
import { seedReminders } from './seedData';
import { uid } from '../utils/id';
import { activityService } from './activityService';

// Reminders are always tied to a contact, with a date/time and priority.
const store = createStore(KEYS.reminders, seedReminders);

function getAll() {
  return store.getSnapshot();
}

function getById(id) {
  return store.getSnapshot().find((r) => r.id === id) || null;
}

function getForContact(contactId) {
  return store
    .getSnapshot()
    .filter((r) => r.contactId === contactId)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}

function add({ contactId, title, date, time, priority = 'medium', notes = '' }) {
  const reminder = {
    id: uid('r'),
    contactId,
    title: title.trim(),
    date,
    time,
    priority,
    notes: notes.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  store.set((list) => [...list, reminder]);
  activityService.log({
    type: 'reminder-created',
    message: `Reminder: ${reminder.title}`,
    contactId,
  });
  return reminder;
}

function update(id, patch) {
  let updated = null;
  store.set((list) =>
    list.map((r) => {
      if (r.id !== id) return r;
      updated = { ...r, ...patch, title: (patch.title ?? r.title).trim() };
      return updated;
    }),
  );
  if (updated) {
    activityService.log({
      type: 'reminder-updated',
      message: `Updated reminder: ${updated.title}`,
      contactId: updated.contactId,
    });
  }
  return updated;
}

function toggleComplete(id) {
  let updated = null;
  store.set((list) =>
    list.map((r) => {
      if (r.id !== id) return r;
      updated = { ...r, completed: !r.completed, completedAt: !r.completed ? new Date().toISOString() : null };
      return updated;
    }),
  );
  if (updated) {
    activityService.log({
      type: updated.completed ? 'reminder-completed' : 'reminder-created',
      message: updated.completed ? `Completed: ${updated.title}` : `Reopened: ${updated.title}`,
      contactId: updated.contactId,
    });
  }
  return updated;
}

/** Remove a reminder. */
function remove(id) {
  const reminder = getById(id);
  store.set((list) => list.filter((r) => r.id !== id));
  if (reminder) {
    activityService.log({
      type: 'reminder-deleted',
      message: `Deleted reminder: ${reminder.title}`,
      contactId: reminder.contactId,
    });
  }
}

/** Remove all reminders for a contact (called when a contact is deleted). */
function removeForContact(contactId) {
  store.set((list) => list.filter((r) => r.contactId !== contactId));
}

export const reminderService = {
  store,
  getAll,
  getById,
  getForContact,
  add,
  update,
  toggleComplete,
  remove,
  removeForContact,
};
