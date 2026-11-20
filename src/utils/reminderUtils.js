// Helpers for categorizing reminders into dashboard/page buckets.

import { parseISODate, isToday as isTodayDate, startOfToday } from './dateUtils';

/** True when a reminder is not completed and its date+time is in the past. */
export function isOverdue(reminder) {
  if (!reminder || reminder.completed) return false;
  const d = parseISODate(reminder.date);
  if (!d) return false;
  const today = startOfToday();
  if (d.getTime() < today.getTime()) return true;
  if (!isTodayDate(reminder.date) || !reminder.time) return false;
  const [h, m] = reminder.time.split(':').map(Number);
  const now = new Date();
  return now.getHours() > h || (now.getHours() === h && now.getMinutes() > m);
}

/** Buckets used by the Reminders page and the dashboard. */
export function categorizeReminders(reminders) {
  const today = [];
  const upcoming = [];
  const overdue = [];
  const completed = [];

  (reminders || []).forEach((reminder) => {
    if (reminder.completed) {
      completed.push(reminder);
      return;
    }
    if (isOverdue(reminder)) {
      overdue.push(reminder);
      return;
    }
    if (isTodayDate(reminder.date)) today.push(reminder);
    else upcoming.push(reminder);
  });

  const byDateTime = (a, b) =>
    `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`);

  return {
    today: today.sort(byDateTime),
    upcoming: upcoming.sort(byDateTime),
    overdue: overdue.sort(byDateTime),
    completed: completed.sort((a, b) => new Date(b.completedAt || b.date) - new Date(a.completedAt || a.date)),
  };
}

/** Reminders due today or overdue — surfaced on the dashboard. */
export function remindersNeedingAttention(reminders) {
  const { today, overdue } = categorizeReminders(reminders);
  return [...overdue, ...today];
}

/** Next incomplete reminder for a contact (used on the details page). */
export function nextReminderForContact(reminders, contactId) {
  const list = (reminders || [])
    .filter((r) => r.contactId === contactId && !r.completed)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  return list[0] || null;
}
