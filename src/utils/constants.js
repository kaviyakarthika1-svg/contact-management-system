// Shared constants: label metadata, suggestion lists and the activity type
// registry used by the timeline, header icons and filters.

export const RELATIONSHIPS = [
  'Friend',
  'Family',
  'Classmate',
  'Teacher',
  'Client',
  'Colleague',
  'Other',
];

export const PRIORITIES = [
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
];

export const TAG_SUGGESTIONS = ['VIP', 'Urgent', 'Client', 'College', 'Project', 'Personal', 'Work'];

export const GROUP_COLORS = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b',
];

/**
 * Activity registry — every activity type maps to an icon + short label.
 * Used by the timeline, the Activity page filters and the dashboard.
 */
export const ACTIVITY_META = {
  added:          { icon: 'user-plus',   label: 'Contact added',        tone: 'success' },
  updated:        { icon: 'edit',        label: 'Contact updated',      tone: 'info' },
  deleted:        { icon: 'trash',       label: 'Contact deleted',      tone: 'danger' },
  favorite:       { icon: 'star',        label: 'Marked as favorite',   tone: 'warning' },
  unfavorite:     { icon: 'star',        label: 'Removed from favorites', tone: 'muted' },
  important:      { icon: 'shield',      label: 'Marked as important',  tone: 'warning' },
  'note-added':     { icon: 'note',        label: 'Note added',           tone: 'info' },
  'note-updated':   { icon: 'note',        label: 'Note updated',         tone: 'info' },
  'note-deleted':   { icon: 'note',        label: 'Note deleted',         tone: 'muted' },
  'reminder-created':   { icon: 'bell',    label: 'Reminder created',     tone: 'info' },
  'reminder-updated':   { icon: 'bell',    label: 'Reminder updated',     tone: 'info' },
  'reminder-completed': { icon: 'check',   label: 'Reminder completed',   tone: 'success' },
  'reminder-deleted':   { icon: 'bell',    label: 'Reminder deleted',     tone: 'muted' },
  called:         { icon: 'phone',       label: 'Call clicked',         tone: 'success' },
  messaged:       { icon: 'message',     label: 'Message clicked',      tone: 'info' },
  emailed:        { icon: 'mail',        label: 'Email clicked',        tone: 'info' },
  whatsapp:       { icon: 'whatsapp',    label: 'WhatsApp clicked',     tone: 'success' },
  viewed:         { icon: 'eye',         label: 'Profile viewed',       tone: 'muted' },
  'group-created':   { icon: 'folder-plus', label: 'Group created',     tone: 'info' },
  'group-renamed':   { icon: 'folder',      label: 'Group renamed',     tone: 'info' },
  'group-deleted':   { icon: 'folder',      label: 'Group deleted',     tone: 'danger' },
  imported:       { icon: 'upload',      label: 'Contacts imported',    tone: 'success' },
  exported:       { icon: 'download',    label: 'Contacts exported',    tone: 'info' },
};

/** Groups of activity types used by the Activity page filter chips. */
export const ACTIVITY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'contacts', label: 'Contacts', types: ['added', 'updated', 'deleted', 'viewed'] },
  { id: 'favorites', label: 'Favorites', types: ['favorite', 'unfavorite', 'important'] },
  { id: 'reminders', label: 'Reminders', types: ['reminder-created', 'reminder-updated', 'reminder-completed', 'reminder-deleted'] },
  { id: 'notes', label: 'Notes', types: ['note-added', 'note-updated', 'note-deleted'] },
  { id: 'interactions', label: 'Interactions', types: ['called', 'messaged', 'emailed', 'whatsapp'] },
];

export const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], description: 'Open global search' },
  { keys: ['N'], description: 'Add a new contact' },
  { keys: ['Esc'], description: 'Close dialogs and menus' },
  { keys: ['?'], description: 'Show keyboard shortcuts' },
];
