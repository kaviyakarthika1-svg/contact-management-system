import { clearAll, load, save, KEYS } from './storage';
import {
  seedContacts,
  seedGroups,
  seedReminders,
  seedActivities,
  seedRecentlyViewed,
} from './seedData';

/**
 * Data bootstrap: decides between demo data and an empty start.
 *
 * - First visit → demo data is written so the app looks complete.
 * - Settings → "Clear all data" → empty start (demo: false).
 * - Settings → "Restore demo data" → demo data again (demo: true).
 */

function currentTheme() {
  const settings = load(KEYS.settings, null);
  return settings?.theme === 'dark' ? 'dark' : 'light';
}

export function ensureSeeded() {
  const settings = load(KEYS.settings, null);
  if (settings && settings.seeded === true) return; // already initialised

  const useDemo = !settings || settings.demo !== false;
  if (useDemo) {
    save(KEYS.contacts, seedContacts());
    save(KEYS.groups, seedGroups());
    save(KEYS.reminders, seedReminders());
    save(KEYS.activities, seedActivities());
    save(KEYS.recentlyViewed, seedRecentlyViewed());
  } else {
    save(KEYS.contacts, []);
    save(KEYS.groups, []);
    save(KEYS.reminders, []);
    save(KEYS.activities, []);
    save(KEYS.recentlyViewed, []);
  }
  save(KEYS.settings, { theme: currentTheme(), demo: useDemo, seeded: true });
}

/** Wipe everything and load the demo dataset again. */
export function resetDemoData() {
  clearAll();
  save(KEYS.settings, { theme: currentTheme(), demo: true, seeded: true });
  window.location.reload();
}

/** Wipe everything and start with an empty address book. */
export function clearAllData() {
  clearAll();
  save(KEYS.settings, { theme: currentTheme(), demo: false, seeded: true });
  window.location.reload();
}
