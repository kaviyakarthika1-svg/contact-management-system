import { createStore } from './createStore';
import { load, save, KEYS } from './storage';
import { seedEvents } from './seedData';
import { uid } from '../utils/id';

// Events: birthdays, anniversaries, meetings, custom events
const store = createStore(KEYS.events, seedEvents);

function getAll() {
  return store.getSnapshot();
}

function getUpcoming(limit = 10) {
  const now = new Date();
  return store.getSnapshot()
    .filter((e) => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, limit);
}

function getForContact(contactId) {
  return store.getSnapshot().filter((e) => e.contactId === contactId);
}

function add(event) {
  const entry = {
    id: uid('e'),
    ...event,
    date: event.date,
    timestamp: new Date().toISOString(),
  };
  store.set((list) => [entry, ...list]);
  return entry;
}

function remove(id) {
  store.set((list) => list.filter((e) => e.id !== id));
}

function clear() {
  store.set([]);
}

export const eventService = {
  store,
  getAll,
  getUpcoming,
  getForContact,
  add,
  remove,
  clear,
};