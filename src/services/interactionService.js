import { createStore } from './createStore';
import { load, save, KEYS } from './storage';
import { seedInteractions } from './seedData';
import { uid } from '../utils/id';
import { contactService } from './contactService';

// Interaction history: phone calls, messages, emails, meetings, etc.
const store = createStore(KEYS.interactions, seedInteractions);

function getAll() {
  return store.getSnapshot();
}

function getForContact(contactId) {
  return store.getSnapshot().filter((i) => i.contactId === contactId);
}

function add(interaction) {
  const entry = {
    id: uid('i'),
    ...interaction,
    timestamp: interaction.timestamp || new Date().toISOString(),
  };
  store.set((list) => [entry, ...list]);
  contactService.recordView(entry.contactId);
  return entry;
}

function remove(id) {
  store.set((list) => list.filter((i) => i.id !== id));
}

function clear() {
  store.set([]);
}

export const interactionService = {
  store,
  getAll,
  getForContact,
  add,
  remove,
  clear,
};