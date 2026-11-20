import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import Tabs from '../components/ui/Tabs';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import ReminderCard from '../components/reminders/ReminderCard';
import ReminderFormModal from '../components/reminders/ReminderFormModal';
import { useContacts, useReminders, useSkeleton, useTitle } from '../hooks/useData';
import { reminderService } from '../services/reminderService';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { categorizeReminders } from '../utils/reminderUtils';

const TABS = [
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'completed', label: 'Completed' },
];

/** /reminders — today / upcoming / overdue / completed buckets. */
export default function RemindersPage() {
  useTitle('Reminders');
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const loading = useSkeleton();

  const reminders = useReminders();
  const contacts = useContacts();
  const [tab, setTab] = useState('today');
  const [modal, setModal] = useState({ open: false, reminder: null, contactId: null });

  const buckets = useMemo(() => categorizeReminders(reminders), [reminders]);
  const contactById = useMemo(() => {
    const map = {};
    contacts.forEach((c) => { map[c.id] = c; });
    return map;
  }, [contacts]);

  const currentList = buckets[tab] || [];

  function handleComplete(reminder) {
    const updated = reminderService.toggleComplete(reminder.id);
    toast.success(updated.completed ? 'Reminder completed' : 'Reminder reopened', updated.title);
  }

  function handleEdit(reminder) {
    setModal({ open: true, reminder, contactId: null });
  }

  async function handleDelete(reminder) {
    const ok = await confirm({
      title: 'Delete reminder?',
      message: `"${reminder.title}" will be removed permanently.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    reminderService.remove(reminder.id);
    toast.success('Reminder deleted');
  }

  if (loading) {
    return (
      <div className="page">
        <Skeleton rows={5} />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Reminders</h1>
          <p className="page-subtitle">Never miss a call, follow-up or birthday</p>
        </div>
        <div className="page-header__actions">
          <button type="button" className="btn btn-primary" onClick={() => setModal({ open: true, reminder: null, contactId: null })}>
            <Icon name="plus" size={15} /> New reminder
          </button>
        </div>
      </header>

      <Tabs
        tabs={[
          { ...TABS[0], count: buckets.today.length },
          { ...TABS[1], count: buckets.upcoming.length },
          { ...TABS[2], count: buckets.overdue.length },
          { ...TABS[3], count: buckets.completed.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="stack mt">
        {currentList.length === 0 ? (
          <EmptyState
            icon="check-circle"
            title={tab === 'completed' ? 'Nothing completed yet' : `No ${tab} reminders`}
            message={tab === 'today' ? 'Everything due today will show here.' : 'When you create reminders they will appear here.'}
          >
            <button type="button" className="btn btn-primary" onClick={() => setModal({ open: true, reminder: null, contactId: null })}>
              <Icon name="plus" size={14} /> Create a reminder
            </button>
          </EmptyState>
        ) : (
          currentList.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              contact={contactById[reminder.contactId]}
              onComplete={handleComplete}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      <ReminderFormModal
        open={modal.open}
        onClose={() => setModal({ open: false, reminder: null, contactId: null })}
        reminder={modal.reminder}
        preselectContactId={modal.contactId}
      />
    </div>
  );
}
