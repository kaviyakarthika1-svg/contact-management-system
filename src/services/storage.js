// Namespaced, JSON-safe localStorage access used by every service.
// Components should never touch localStorage directly — always go through a service.

const PREFIX = 'cms:v1:';

export const KEYS = {
  contacts: 'contacts',
  groups: 'groups',
  reminders: 'reminders',
  activities: 'activities',
  settings: 'settings',
  recentlyViewed: 'recentlyViewed',
  interactions: 'interactions',
  events: 'events',
};

export function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage may be full or unavailable — fail silently rather than break the UI.
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

/** Remove every key that belongs to this app (used by Settings → Clear all data). */
export function clearAll() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIX))
    .forEach((k) => localStorage.removeItem(k));
}

/**
 * Trigger a browser download for the given content.
 * Used for CSV exports, vCard downloads, etc.
 */
export function downloadFile(filename, content, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
