import { useEffect, useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import Field from '../ui/Field';
import { useContacts } from '../../hooks/useData';
import { fullName } from '../../utils/contactUtils';
import { PRIORITIES } from '../../utils/constants';
import { reminderService } from '../../services/reminderService';
import { todayISO } from '../../utils/dateUtils';
import { useToast } from '../../context/ToastContext';

/**
 * Create/edit reminder dialog. When `preselectContactId` is set (opened from
 * a contact card/details), that contact is locked in.
 */
export default function ReminderFormModal({ open, onClose, reminder = null, preselectContactId = null }) {
  const contacts = useContacts();
  const toast = useToast();
  const isEdit = Boolean(reminder);

  const [form, setForm] = useState({
    contactId: preselectContactId || '',
    title: '',
    date: todayISO(),
    time: '10:00',
    priority: 'medium',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (reminder) {
      setForm({
        contactId: reminder.contactId || '',
        title: reminder.title || '',
        date: reminder.date || todayISO(),
        time: reminder.time || '10:00',
        priority: reminder.priority || 'medium',
        notes: reminder.notes || '',
      });
    } else {
      setForm({
        contactId: preselectContactId || '',
        title: '',
        date: todayISO(),
        time: '10:00',
        priority: 'medium',
        notes: '',
      });
    }
  }, [open, reminder, preselectContactId]);

  const sortedContacts = useMemo(
    () =>
      [...contacts].sort((a, b) =>
        fullName(a).localeCompare(fullName(b)),
      ),
    [contacts],
  );

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!form.contactId) nextErrors.contactId = 'Choose a contact';
    if (!form.title.trim()) nextErrors.title = 'Reminder title is required';
    if (!form.date) nextErrors.date = 'Pick a date';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (isEdit) {
      reminderService.update(reminder.id, {
        contactId: form.contactId,
        title: form.title,
        date: form.date,
        time: form.time,
        priority: form.priority,
        notes: form.notes,
      });
      toast.success('Reminder updated', form.title);
    } else {
      reminderService.add(form);
      toast.success('Reminder created', form.title);
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit reminder' : 'New reminder'} width={480}>
      <form className="form" onSubmit={handleSubmit} noValidate>
        <Field id="reminder-contact" label="Contact" required error={errors.contactId}>
          <select
            id="reminder-contact"
            className="input select"
            value={form.contactId}
            onChange={(event) => setForm({ ...form, contactId: event.target.value })}
          >
            <option value="">Select a contact…</option>
            {sortedContacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {fullName(contact)}
              </option>
            ))}
          </select>
        </Field>

        <Field id="reminder-title" label="Reminder" required error={errors.title}>
          <input
            id="reminder-title"
            className="input"
            type="text"
            placeholder="e.g. Call John tomorrow"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
        </Field>

        <div className="form__grid form__grid--2">
          <Field id="reminder-date" label="Date" required error={errors.date}>
            <input
              id="reminder-date"
              className="input"
              type="date"
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
            />
          </Field>
          <Field id="reminder-time" label="Time">
            <input
              id="reminder-time"
              className="input"
              type="time"
              value={form.time}
              onChange={(event) => setForm({ ...form, time: event.target.value })}
            />
          </Field>
        </div>

        <Field id="reminder-priority" label="Priority">
          <select
            id="reminder-priority"
            className="input select"
            value={form.priority}
            onChange={(event) => setForm({ ...form, priority: event.target.value })}
          >
            {PRIORITIES.map((priority) => (
              <option key={priority.id} value={priority.id}>
                {priority.label}
              </option>
            ))}
          </select>
        </Field>

        <Field id="reminder-notes" label="Notes" hint="Optional details for this reminder.">
          <textarea
            id="reminder-notes"
            className="input textarea"
            rows={3}
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
        </Field>

        <div className="modal__footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {isEdit ? 'Save changes' : 'Create reminder'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
