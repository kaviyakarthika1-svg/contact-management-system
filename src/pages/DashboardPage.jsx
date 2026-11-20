import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SectionCard from '../components/ui/SectionCard';
import StatsCard from '../components/ui/StatsCard';
import Avatar from '../components/ui/Avatar';
import Icon from '../components/ui/Icon';
import EmptyState from '../components/ui/EmptyState';
import MiniBarChart from '../components/ui/MiniBarChart';
import ProgressBar from '../components/ui/ProgressBar';
import Skeleton from '../components/ui/Skeleton';
import ReminderCard from '../components/reminders/ReminderCard';
import ReminderFormModal from '../components/reminders/ReminderFormModal';
import { useContacts, useGroups, useReminders, useActivities, useRecentlyViewed, useInteractions, useEvents, useSkeleton, useTitle } from '../hooks/useData';
import { contactService } from '../services/contactService';
import { groupService } from '../services/groupService';
import { reminderService } from '../services/reminderService';
import { exportContacts } from '../services/csvService';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import {
  fullName,
  birthdayCountdown,
  needsFollowUp,
  daysSinceLastContact,
  profileCompleteness,
} from '../utils/contactUtils';
import { remindersNeedingAttention, isOverdue } from '../utils/reminderUtils';
import { monthKey, formatMonthLabel, timeAgo, formatDate } from '../utils/dateUtils';
import { ACTIVITY_META, RELATIONSHIPS } from '../utils/constants';

export default function DashboardPage() {
  useTitle('Dashboard');
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const { complete: handleCompleteReminder, remove: handleDeleteReminder } = makeReminderHandlers(toast, confirm);
  const loading = useSkeleton();

  const contacts = useContacts();
  const groups = useGroups();
  const reminders = useReminders();
  const activities = useActivities();
  const recentlyViewed = useRecentlyViewed();
  const interactions = useInteractions();
  const events = useEvents();

  const [reminderModal, setReminderModal] = useState({ open: false, reminder: null, contactId: null });

  const groupNameById = useMemo(() => {
    const map = {};
    groups.forEach((g) => { map[g.id] = g; });
    return map;
  }, [groups]);

  /* --------------------------- Derived data --------------------------- */
  const stats = useMemo(() => ({
    total: contacts.length,
    favorites: contacts.filter((c) => c.favorite).length,
    thisWeek: contacts.filter((c) => wasAddedDaysAgo(c, 7)).length,
    thisMonth: contacts.filter((c) => wasAddedDaysAgo(c, 30)).length,
    upcomingBirthdays: contacts
      .map((contact) => ({ contact, days: birthdayCountdown(contact) }))
      .filter((item) => item.days !== null && item.days <= 30)
      .sort((a, b) => a.days - b.days),
    attention: remindersNeedingAttention(reminders),
  }), [contacts, reminders]);

  const recentlyAdded = useMemo(
    () => [...contacts].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5),
    [contacts],
  );

  const monthlyChart = useMemo(() => {
    // Build YYYY-MM keys for the last 6 months directly from Date math so the
    // buckets always line up with the keys derived from contact.createdAt.
    const now = new Date();
    const keys = [];
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    }
    return keys.map((key) => ({
      label: formatMonthLabel(key),
      value: contacts.filter((c) => monthKey(c.createdAt || '') === key).length,
    }));
  }, [contacts]);

  const groupDist = useMemo(() => {
    const counts = groupService.countContacts(contacts);
    return groups
      .map((group) => ({ group, count: counts[group.id] || 0 }))
      .sort((a, b) => b.count - a.count);
  }, [contacts, groups]);
  const maxGroupCount = Math.max(1, ...groupDist.map((g) => g.count));

  // Relationship distribution
  const relationshipDist = useMemo(() => {
    const counts = {};
    RELATIONSHIPS.forEach((r) => { counts[r] = 0; });
    counts['Other'] = 0;
    contacts.forEach((c) => {
      const rel = c.relationship || 'Other';
      counts[rel] = (counts[rel] || 0) + 1;
    });
    return RELATIONSHIPS.concat(['Other'])
      .map((r) => ({ relationship: r, count: counts[r] || 0 }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [contacts]);

  // Contact health (profile completeness)
  const contactHealth = useMemo(() => {
    let complete = 0;
    let mostlyComplete = 0;
    let needsInfo = 0;
    contacts.forEach((c) => {
      const { percent } = profileCompleteness(c);
      if (percent >= 80) complete++;
      else if (percent >= 50) mostlyComplete++;
      else needsInfo++;
    });
    return { complete, mostlyComplete, needsInfo };
  }, [contacts]);

  // Upcoming events
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5)
      .map((event) => ({
        ...event,
        contact: event.contactId ? contacts.find((c) => c.id === event.contactId) : null,
        daysUntil: Math.ceil((new Date(event.date) - now) / (1000 * 60 * 60 * 24)),
      }));
  }, [events, contacts]);

  /**
   * "People you may want to contact" — scored blend of:
   * contacts with upcoming reminders, not contacted in 3+ weeks, never contacted.
   */
  const suggestions = useMemo(() => {
    const activeReminderContacts = new Set(reminders.filter((r) => !r.completed).map((r) => r.contactId));
    return contacts
      .map((contact) => {
        let score = 0;
        if (activeReminderContacts.has(contact.id)) score += 3;
        if (needsFollowUp(contact)) score += 2;
        if (daysSinceLastContact(contact) === Infinity) score += 1;
        return { contact, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [contacts, reminders]);

  /* --------------------------- Quick actions --------------------------- */
  function handleExport() {
    const count = exportContacts(contactService.getAll(), (id) => groupService.getNameById(id));
    if (count > 0) toast.success('Export ready', `${count} contacts saved as CSV.`);
    else toast.warning('Nothing to export', 'Add some contacts first.');
  }

  if (loading) {
    return (
      <div className="page">
        <Skeleton rows={6} />
      </div>
    );
  }

  const mainContent = (
    <>
      {/* Quick actions */}
      <div className="quick-actions">
        <Link to="/contacts/add" className="quick-action">
          <Icon name="user-plus" size={20} />
          <span>Add Contact</span>
        </Link>
        <Link to="/contacts" className="quick-action">
          <Icon name="search" size={20} />
          <span>Find Contact</span>
        </Link>
        <Link to="/contact-sharing" className="quick-action">
          <Icon name="share-2" size={20} />
          <span>Share Contact</span>
        </Link>
        <Link to="/contacts?import=1" className="quick-action">
          <Icon name="upload" size={20} />
          <span>Import Contacts</span>
        </Link>
      </div>

      {/* Relationship overview */}
      {relationshipDist.length > 0 && (
        <SectionCard title="Relationship Overview" subtitle="Contacts by relationship type" icon="users">
          <div className="relationship-grid">
            {relationshipDist.map(({ relationship, count }) => (
              <Link
                key={relationship}
                to={`/people?relationship=${encodeURIComponent(relationship)}`}
                className="relationship-item"
              >
                <span className="relationship-item__count">{count}</span>
                <span className="relationship-item__label">{relationship}</span>
              </Link>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Contact health */}
      <SectionCard title="Contact Health" subtitle="Profile completeness overview" icon="activity">
        <div className="health-grid">
          <div className="health-item health-item--success">
            <Icon name="check-circle" size={20} />
            <span className="health-item__count">{contactHealth.complete}</span>
            <span className="health-item__label">Complete</span>
          </div>
          <div className="health-item health-item--warning">
            <Icon name="alert-circle" size={20} />
            <span className="health-item__count">{contactHealth.mostlyComplete}</span>
            <span className="health-item__label">Mostly Complete</span>
          </div>
          <div className="health-item health-item--danger">
            <Icon name="x-circle" size={20} />
            <span className="health-item__count">{contactHealth.needsInfo}</span>
            <span className="health-item__label">Needs Information</span>
          </div>
        </div>
      </SectionCard>

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <SectionCard title="Upcoming Events" subtitle="Important dates and events" icon="calendar">
          <div className="event-list">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="event-card event-card--compact">
                <div className="event-card__date">
                  <span className="event-card__day">{new Date(event.date).getDate()}</span>
                  <span className="event-card__month">
                    {new Date(event.date).toLocaleDateString(undefined, { month: 'short' })}
                  </span>
                </div>
                <div className="event-card__content">
                  <span className="event-card__title">{event.title}</span>
                  {event.contact && (
                    <Link to={`/contacts/${event.contact.id}`} className="event-card__contact">
                      {fullName(event.contact)}
                    </Link>
                  )}
                  <span className="event-card__time">
                    {event.daysUntil === 0 ? 'Today' : event.daysUntil === 1 ? 'Tomorrow' : `In ${event.daysUntil} days`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

    </>
  );

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your contacts at a glance — {formatTodayLabel()}</p>
        </div>
        <div className="page-header__actions">
          <button type="button" className="btn btn-outline" onClick={() => navigate('/contacts?import=1')}>
            <Icon name="upload" size={15} /> Import
          </button>
          <button type="button" className="btn btn-outline" onClick={handleExport}>
            <Icon name="download" size={15} /> Export
          </button>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/contacts/add')}>
            <Icon name="plus" size={15} /> Add contact
          </button>
        </div>
      </header>

      {/* Stat tiles */}
      <div className="stats-grid">
        <StatsCard icon="users" tone="primary" label="Total contacts" value={stats.total} onClick={() => navigate('/contacts')} />
        <StatsCard icon="star" tone="warning" label="Favorites" value={stats.favorites} onClick={() => navigate('/favorites')} />
        <StatsCard icon="bell" tone="info" label="Reminders due" value={stats.attention.length} hint="Today + overdue" onClick={() => navigate('/reminders')} />
        <StatsCard icon="cake" tone="danger" label="Birthdays ahead" value={stats.upcomingBirthdays.length} hint="Next 30 days" />
        <StatsCard icon="folder" tone="success" label="Groups" value={groups.length} onClick={() => navigate('/groups')} />
        <StatsCard icon="zap" tone="primary" label="Added this month" value={stats.thisMonth} hint={`${stats.thisWeek} this week`} />
      </div>

      <div className="dashboard-grid">
        {/* Left column */}
        <div className="dashboard-col">
          <SectionCard
            title="Reminders needing attention"
            subtitle="Overdue and due today"
            icon="bell"
            action={<Link className="btn btn-ghost btn-sm" to="/reminders">All reminders</Link>}
          >
            {stats.attention.length === 0 ? (
              <EmptyState icon="check-circle" title="You're all caught up" message="No reminders are due right now.">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setReminderModal({ open: true, reminder: null, contactId: null })}>
                  <Icon name="plus" size={14} /> New reminder
                </button>
              </EmptyState>
            ) : (
              <div className="stack">
                {stats.attention.slice(0, 4).map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    contact={contacts.find((c) => c.id === reminder.contactId)}
                    onComplete={handleCompleteReminder}
                    onEdit={(r) => setReminderModal({ open: true, reminder: r, contactId: null })}
                    onDelete={handleDeleteReminder}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="People you may want to contact" subtitle="Based on reminders and follow-ups" icon="sparkles">
            {suggestions.length === 0 ? (
              <p className="section-card__empty">Everyone is up to date. Nice work!</p>
            ) : (
              <ul className="suggest-list">
                {suggestions.map(({ contact }) => (
                  <li key={contact.id} className="suggest-list__item">
                    <Link to={`/contacts/${contact.id}`} className="suggest-list__identity">
                      <Avatar contact={contact} size={38} />
                      <span>
                        <span className="suggest-list__name">{fullName(contact)}</span>
                        <span className="suggest-list__reason">
                          {daysSinceLastContact(contact) === Infinity
                            ? 'Never contacted yet'
                            : `Last contacted ${daysSinceLastContact(contact)} days ago`}
                        </span>
                      </span>
                    </Link>
                    <div className="suggest-list__actions">
                      {contact.phone ? (
                        <a
                          className="icon-btn icon-btn--call"
                          href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}
                          aria-label={`Call ${fullName(contact)}`}
                          onClick={() => contactService.logInteraction(contact.id, 'called')}
                        >
                          <Icon name="phone" size={14} />
                        </a>
                      ) : null}
                      <Link className="icon-btn" to={`/contacts/${contact.id}`} aria-label={`Open ${fullName(contact)}`}>
                        <Icon name="chevron-right" size={14} />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Recently added"
            subtitle="Latest additions to your address book"
            icon="user-plus"
            action={<Link className="btn btn-ghost btn-sm" to="/contacts">View all</Link>}
          >
            {recentlyAdded.length === 0 ? (
              <EmptyState icon="users" title="No contacts yet" message="Add your first contact to get started.">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/contacts/add')}>
                  <Icon name="plus" size={14} /> Add contact
                </button>
              </EmptyState>
            ) : (
              <ul className="mini-list">
                {recentlyAdded.map((contact) => (
                  <li key={contact.id}>
                    <Link to={`/contacts/${contact.id}`} className="mini-list__item">
                      <Avatar contact={contact} size={34} />
                      <span className="mini-list__text">
                        <span className="mini-list__name">{fullName(contact)}</span>
                        <span className="mini-list__meta">
                          {[contact.jobTitle, groupNameById[contact.groupId]?.name].filter(Boolean).join(' · ') || '—'}
                        </span>
                      </span>
                      <span className="mini-list__time">{timeAgo(contact.createdAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="dashboard-col">
          <SectionCard title="Upcoming birthdays" subtitle="Next 30 days" icon="cake">
            {stats.upcomingBirthdays.length === 0 ? (
              <p className="section-card__empty">No birthdays in the next 30 days.</p>
            ) : (
              <ul className="birthday-list">
                {stats.upcomingBirthdays.map(({ contact, days }) => (
                  <li key={contact.id} className="birthday-list__item">
                    <Avatar contact={contact} size={38} />
                    <div className="birthday-list__text">
                      <Link to={`/contacts/${contact.id}`} className="birthday-list__name">
                        {fullName(contact)}
                      </Link>
                      <span className="birthday-list__date">
                        {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setReminderModal({ open: true, reminder: null, contactId: contact.id })}
                      title="Create a birthday reminder"
                    >
                      <Icon name="bell" size={13} /> Remind
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Recently viewed" subtitle="Contacts you opened last" icon="eye">
            {recentlyViewed.length === 0 ? (
              <p className="section-card__empty">Contacts you open will appear here.</p>
            ) : (
              <ul className="mini-list">
                {recentlyViewed
                  .filter((item) => item.contact)
                  .map(({ contact, at }) => (
                    <li key={contact.id}>
                      <Link to={`/contacts/${contact.id}`} className="mini-list__item">
                        <Avatar contact={contact} size={34} />
                        <span className="mini-list__text">
                          <span className="mini-list__name">{fullName(contact)}</span>
                          <span className="mini-list__meta">
                            {[contact.jobTitle, contact.company].filter(Boolean).join(' · ') || '—'}
                          </span>
                        </span>
                        <span className="mini-list__time">{timeAgo(at)}</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Contacts added" subtitle="Last 6 months" icon="activity">
            <MiniBarChart data={monthlyChart} />
          </SectionCard>

          <SectionCard title="Group distribution" icon="folder" action={<Link className="btn btn-ghost btn-sm" to="/groups">Manage</Link>}>
            <ul className="dist-list">
              {groupDist.map(({ group, count }) => (
                <li key={group.id} className="dist-list__item">
                  <span className="dist-list__label">
                    <span className="dist-list__dot" style={{ backgroundColor: group.color }} />
                    {group.name}
                  </span>
                  <div className="dist-list__track">
                    <div className="dist-list__bar" style={{ width: `${(count / maxGroupCount) * 100}%`, backgroundColor: group.color }} />
                  </div>
                  <span className="dist-list__count">{count}</span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Latest activity" icon="activity" action={<Link className="btn btn-ghost btn-sm" to="/activity">View all</Link>}>
            {activities.length === 0 ? (
              <p className="section-card__empty">No activity recorded yet.</p>
            ) : (
              <ul className="mini-list">
                {activities.slice(0, 5).map((activity) => {
                  const meta = ACTIVITY_META[activity.type] || {};
                  return (
                    <li key={activity.id} className="activity-line">
                      <span className={`activity-line__icon activity-line__icon--${meta.tone || 'muted'}`}>
                        <Icon name={meta.icon || 'activity'} size={13} />
                      </span>
                      <span className="activity-line__text">
                        {activity.message}
                        {activity.contactId ? (
                          <Link to={`/contacts/${activity.contactId}`} className="activity-line__link">
                            {activity.contactName}
                          </Link>
                        ) : null}
                      </span>
                      <span className="activity-line__time">{timeAgo(activity.timestamp)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>

      <ReminderFormModal
        open={reminderModal.open}
        onClose={() => setReminderModal({ open: false, reminder: null, contactId: null })}
        reminder={reminderModal.reminder}
        preselectContactId={reminderModal.contactId}
      />
    </div>
  );
}

/* ------------------------------ helpers ------------------------------ */

/** Reminder complete toggle with toast feedback. */
function makeReminderHandlers(toast, confirm) {
  return {
    complete(reminder) {
      const updated = reminderService.toggleComplete(reminder.id);
      toast.success(updated.completed ? 'Reminder completed' : 'Reminder reopened', updated.title);
    },
    async remove(reminder) {
      const ok = await confirm({
        title: 'Delete reminder?',
        message: `"${reminder.title}" will be removed permanently.`,
        confirmLabel: 'Delete',
        danger: true,
      });
      if (!ok) return;
      reminderService.remove(reminder.id);
      toast.success('Reminder deleted');
    },
  };
}

function wasAddedDaysAgo(contact, days) {
  return Date.now() - new Date(contact.createdAt).getTime() <= days * 86400000;
}

function formatTodayLabel() {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}
