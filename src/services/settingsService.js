import { createStore } from './createStore';
import { KEYS } from './storage';
import { seedSettings } from './seedData';

// App settings: theme preference + demo-data flag. Persisted via the store.
const store = createStore(KEYS.settings, seedSettings);

function get() {
  return store.getSnapshot();
}

function update(patch) {
  store.set((current) => ({ ...current, ...patch }));
}

function getTheme() {
  return get().theme || 'light';
}

function setTheme(theme) {
  update({ theme });
}

export const settingsService = {
  store,
  get,
  update,
  getTheme,
  setTheme,
};
