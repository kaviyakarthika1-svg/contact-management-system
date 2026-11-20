import { load, save } from './storage';

/**
 * A minimal external store compatible with React's useSyncExternalStore.
 * Each service gets its own store; data is cached in memory and mirrored
 * to localStorage on every write. Subscribers are notified after writes so
 * every mounted component stays in sync automatically.
 */
export function createStore(key, seed) {
  let data = load(key, null);
  if (data === null || data === undefined) {
    data = typeof seed === 'function' ? seed() : seed;
    save(key, data);
  }

  const listeners = new Set();

  return {
    key,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      return data;
    },
    /** Accepts a value or an updater function, persists and notifies. */
    set(updater) {
      const next = typeof updater === 'function' ? updater(data) : updater;
      data = next;
      save(key, next);
      listeners.forEach((listener) => listener());
    },
    /** Force a re-read from storage (used after data resets). */
    refresh() {
      data = load(key, null);
      listeners.forEach((listener) => listener());
    },
  };
}
