import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Avatar from '../components/ui/Avatar';
import Icon from '../components/ui/Icon';
import TagBadge from '../components/ui/TagBadge';
import SectionCard from '../components/ui/SectionCard';
import EmptyState from '../components/ui/EmptyState';
import ProgressBar from '../components/ui/ProgressBar';
import NoteSection from '../components/contacts/NoteSection';
import ActivityTimeline from '../components/activity/ActivityTimeline';
import ReminderCard from '../components/reminders/ReminderCard';
import ReminderFormModal from '../components/reminders/ReminderFormModal';
import Dropdown from '../components/ui/Dropdown';
import {
  useActivities, useContacts, useGroups, useReminders, useInteractions, useEvents, useTitle,
} from '../hooks/useData';
import { contactService } from '../services/contactService';
import { reminderService } from '../services/reminderService';
import { interactionService } from '../services/interactionService';
import { eventService } from '../services/eventService';
import { exportContactAsVCard, contactToSharePayload } from '../services/vCardService';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import {
  birthdayCountdown,
  daysSinceLastContact,
  fullName,
  lastContactLabel,
  mailtoLink,
  mapsLink,
  profileCompleteness,
  smsLink,
  telLink,
  whatsappLink,
} from '../utils/contactUtils';
import { ageFromBirthday, formatDate, formatTimestamp, upcomingBirthday, timeAgo, relativeDayLabel } from '../utils/dateUtils';
import { nextReminderForContact } from '../utils/reminderUtils';

export default function ContactDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const contacts = useContacts();
  const groups = useGroups();
  const reminders = useReminders();
  const activities = useActivities();
  const interactions = useInteractions();
  const events = useEvents();

  const [reminderModal, setReminderModal] = useState({ open: false, reminder: null, contactId: null });

  const contact = contacts.find((c) => c.id === id);
  const group = groups.find((g) => g.id === contact?.groupId);

  useTitle(contact ? fullName(contact) : 'Contact');

  // Track "recently viewed" when this profile is opened.
  useEffect(() => {
    if (contact) contactService.recordView(contact.id);
  }, [contact]);

  const completeness = useMemo(() => (contact ? profileCompleteness(contact) : { percent: 0, missing: [] }), [contact]);
  const contactReminders = useMemo(
    () => reminders.filter((r) => r.contactId === id),
    [reminders, id],
  );
  const contactActivities = useMemo(
    () => activities.filter((a) => a.contactId === id).slice(0, 12),
    [activities, id],
  );
  const contactInteractions = useMemo(
    () => interactions.filter((i) => i.contactId === id).slice(0, 10),
    [interactions, id],
  );
  const contactEvents = useMemo(
    () => events.filter((e) => e.contactId === id),
    [events, id],
  );
  const nextReminder = useMemo(() => nextReminderForContact(reminders, id), [reminders, id]);

  function recordInteraction(channel) {
    contactService.logInteraction(id, channel);
  }

  function handleExportVCard() {
    if (!contact) return;
    const ok = exportContactAsVCard(contact);
    if (ok) {
      toast.success('vCard exported', `Downloaded ${fullName(contact)}.vcf`);
    }
  }

  async function handleShare() {
    if (!contact) return;
    const payload = contactToSharePayload(contact);
    if (navigator.share) {
      try {
        await navigator.share(payload);
        toast.success('Contact shared');
      } catch (err) {
        if (err.name !== 'AbortError') {
          toast.error('Share failed', 'Could not open share dialog');
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(payload.text);
        toast.success('Contact copied to clipboard');
      } catch {
        toast.error('Share unavailable', 'Your browser does not support sharing');
      }
    }
  }

  async function handleDelete() {
    const ok = await confirm({
      title: 'Delete contact?',
      message: `${contact ? fullName(contact) : 'This contact'} and all their reminders will be permanently removed. This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    contactService.remove(id);
    toast.success('Contact deleted', fullName(contact));
    navigate('/contacts');
  }

  const reminderHandlers = {
    complete(reminder) {
      const updated = reminderService.toggleComplete(reminder.id);
      toast.success(updated.completed ? 'Reminder completed' : 'Reminder reopened', updated.title);
    },
    edit(reminder) {
      setReminderModal({ open: true, reminder, contactId: null });
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

  if (!contact) {
    return (
      <div className="page">
        <EmptyState icon="alert" title="Contact not found" message="It may have been deleted or the link is out of date.">
          <Link to="/contacts" className="btn btn-primary">
            <Icon name="users" size={15} /> All contacts
          </Link>
        </EmptyState>
      </div>
    );
  }

  const birthdayInfo = contact.birthday ? upcomingBirthday(contact.birthday) : null;
  const age = contact.birthday ? ageFromBirthday(contact.birthday) : null;

  return (
    <div className="page">
      <Link to="/contacts" className="back-link">
        <Icon name="arrow-left" size={15} /> Back to contacts
      </Link>

      {/* Hero / profile header */}
      <section className="profile-hero">
        <div className="profile-hero__main">
          <Avatar contact={contact} size={92} />
          <div className="profile-hero__identity">
            <div className="profile-hero__name-row">
              <h1 className="profile-hero__name">{fullName(contact)}</h1>
              {contact.favorite ? (
                <button
                  type="button"
                  className="icon-btn icon-btn--starred"
                  aria-label="Remove from favorites"
                  title="Remove from favorites"
                  onClick={() => {
                    contactService.toggleFavorite(contact.id);
                    toast.success('Removed from favorites');
                  }}
                >
                  <Icon name="star" size={18} />
                </button>
              ) : null}
              {contact.important ? (
                <span className="badge badge--important" title="Important contact">
                  <Icon name="shield" size={12} /> Important
                </span>
              ) : null}
            </div>
            <p className="profile-hero__role">
              {[contact.jobTitle, contact.company].filter(Boolean).join(' · ') || 'No job details yet'}
            </p>
            <div className="profile-hero__badges">
              {group ? (
                <span className="badge" style={{ '--badge-color': group.color }}>
                  <Icon name="folder" size={11} /> {group.name}
                </span>
              ) : null}
              {contact.relationship ? (
                <span className="badge badge--muted">{contact.relationship}</span>
              ) : null}
              {(contact.tags || []).map((tag) => (
                <TagBadge key={tag} tag={tag} />
              ))}
            </div>
          </div>
        </div>
        <div className="profile-hero__actions">
          <Dropdown
            items={[
              { label: 'Edit contact', icon: 'edit', onClick: () => navigate(`/contacts/${contact.id}/edit`) },
              { label: 'Add reminder', icon: 'bell', onClick: () => setReminderModal({ open: true, reminder: null, contactId: contact.id }) },
              {
                label: contact.important ? 'Remove important flag' : 'Mark as important',
                icon: 'shield',
                onClick: () => {
                  contactService.setImportant(contact.id, !contact.important);
                  toast.info(contact.important ? 'Removed important flag' : 'Marked as important');
                },
              },
              { label: 'Toggle favorite', icon: 'star', onClick: () => contactService.toggleFavorite(contact.id) },
              { divider: true },
              { label: 'Delete contact', icon: 'trash', danger: true, onClick: handleDelete },
            ]}
            label="More options"
          />
        </div>
      </section>
      {/* Primary action buttons - flexbox with gap */}
      <div className="details-actions">
        <a
          className="btn-action btn-action--call"
          href={telLink(contact.phone)}
          onClick={() => recordInteraction('called')}
        >
          <Icon name="phone" size={15} />
          <span>Call</span>
        </a>
        <a
          className="btn-action btn-action--sms"
          href={smsLink(contact.phone)}
          onClick={() => recordInteraction('messaged')}
        >
          <Icon name="message" size={15} />
          <span>Message</span>
        </a>
        {contact.email ? (
          <a
            className="btn-action btn-action--email"
            href={mailtoLink(contact.email)}
            onClick={() => recordInteraction('emailed')}
          >
            <Icon name="mail" size={15} />
            <span>Email</span>
          </a>
        ) : null}
        <a
          className="btn-action btn-action--whatsapp"
          href={whatsappLink(contact.phone)}
          onClick={() => recordInteraction('whatsapp')}
          target="_blank"
          rel="noreferrer"
        >
          <Icon name="whatsapp" size={15} />
          <span>WhatsApp</span>
        </a>
        {(contact.address || contact.city) ? (
          <a
            className="btn-action btn-action--map"
            href={mapsLink(contact)}
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="map-pin" size={15} />
            <span>Map</span>
          </a>
        ) : null}
        <a
          className="btn-action btn-action--edit"
          href="#"
          onClick={(e) => { e.preventDefault(); navigate(`/contacts/${contact.id}/edit`); }}
        >
          <Icon name="edit" size={15} />
          <span>Edit</span>
        </a>
      </div>

      {/* Content grid */}
      <div className="details-grid">
        <div className="details-col details-col--main">
          {/* Contact details */}
          <SectionCard title="Contact details" icon="user">
            <dl className="detail-list">
              {contact.phone ? (
                <div className="detail-row">
                  <dt><Icon name="phone" size={14} /> Phone</dt>
                  <dd>
                    <a href={telLink(contact.phone)} onClick={() => recordInteraction('called')}>{contact.phone}</a>
                  </dd>
                </div>
              ) : null}
              {contact.altPhone ? (
                <div className="detail-row">
                  <dt><Icon name="phone" size={14} /> Alternate</dt>
                  <dd>
                    <a href={telLink(contact.altPhone)} onClick={() => recordInteraction('called')}>{contact.altPhone}</a>
                  </dd>
                </div>
              ) : null}
              {contact.email ? (
                <div className="detail-row">
                  <dt><Icon name="mail" size={14} /> Email</dt>
                  <dd>
                    <a href={mailtoLink(contact.email)} onClick={() => recordInteraction('emailed')}>{contact.email}</a>
                  </dd>
                </div>
              ) : null}
              {contact.website ? (
                <div className="detail-row">
                  <dt><Icon name="globe" size={14} /> Website</dt>
                  <dd>
                    <a
                      href={/^https?:\/\//i.test(contact.website) ? contact.website : `https://${contact.website}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {contact.website}
                    </a>
                  </dd>
                </div>
              ) : null}
              {contact.address || contact.city ? (
                <div className="detail-row">
                  <dt><Icon name="map-pin" size={14} /> Address</dt>
                  <dd>
                    <a href={mapsLink(contact)} target="_blank" rel="noreferrer">
                      {[contact.address, contact.city].filter(Boolean).join(', ')}
                    </a>
                  </dd>
                </div>
              ) : null}
              {contact.birthday ? (
                <div className="detail-row">
                  <dt><Icon name="cake" size={14} /> Birthday</dt>
                  <dd>
                    {formatDate(contact.birthday)}
                    {age ? <span className="detail-muted"> · {age} years old</span> : null}
                    {birthdayInfo ? (
                      <span className={`detail-countdown ${birthdayInfo.daysUntil === 0 ? 'detail-countdown--today' : ''}`.trim()}>
                        {birthdayInfo.daysUntil === 0 ? ' 🎂 Today!' : birthdayInfo.daysUntil === 1 ? ' · Tomorrow' : ` · In ${birthdayInfo.daysUntil} days`}
                      </span>
                    ) : null}
                  </dd>
                </div>
              ) : null}
              <div className="detail-row">
                <dt><Icon name="clock" size={14} /> Last interaction</dt>
                <dd>{lastContactLabel(contact)}</dd>
              </div>
            </dl>
          </SectionCard>

          {/* Contact Insights */}
          <SectionCard title="Contact Insights" icon="activity">
            <div className="insights-card">
              <div className="insights-row">
                <span className="insights-label">Last interaction</span>
                <span className="insights-value">
                  {contactInteractions.length > 0
                    ? `${contactInteractions[0].type} · ${timeAgo(contactInteractions[0].timestamp)}`
                    : 'No interactions yet'}
                </span>
              </div>
              <div className="insights-row">
                <span className="insights-label">Preferred contact</span>
                <span className="insights-value insights-value--highlight">
                  {contact.phone ? 'Phone' : contact.email ? 'Email' : 'Not set'}
                </span>
              </div>
              <div className="insights-row">
                <span className="insights-label">Total interactions</span>
                <span className="insights-value">{contactInteractions.length}</span>
              </div>
              <div className="insights-row">
                <span className="insights-label">Relationship</span>
                <span className="insights-value">{contact.relationship || 'Not specified'}</span>
              </div>
              <div className="insights-row">
                <span className="insights-label">Upcoming event</span>
                <span className="insights-value">
                  {contactEvents.length > 0
                    ? `${contactEvents[0].title} · ${relativeDayLabel(contactEvents[0].date)}`
                    : 'No upcoming events'}
                </span>
              </div>
            </div>
          </SectionCard>

          {/* Communication History (Interactions) */}
          {contactInteractions.length > 0 ? (
            <SectionCard title="Communication history" subtitle={`${contactInteractions.length} interactions`} icon="phone">
              <div className="timeline">
                {contactInteractions.map((interaction) => {
                  const date = new Date(interaction.timestamp);
                  const dateStr = date.toLocaleDateString(undefined, {
                    weekday: 'short', day: 'numeric', month: 'short',
                  });
                  const timeStr = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

                  return (
                    <div key={interaction.id} className="timeline__item">
                      <div className="timeline__icon">
                        <Icon
                          name={
                            interaction.type === 'call' ? 'phone' :
                            interaction.type === 'email' ? 'mail' :
                            interaction.type === 'meeting' ? 'users' :
                            interaction.type === 'whatsapp' ? 'whatsapp' :
                            'message'
                          }
                          size={16}
                        />
                      </div>
                      <div className="timeline__content">
                        <div className="timeline__header">
                          <span className="timeline__type">{interaction.type}</span>
                          <span className="timeline__time">{dateStr} · {timeStr}</span>
                        </div>
                        {interaction.description && (
                          <p className="timeline__description">{interaction.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          ) : null}

          {/* Events for this contact */}
          {contactEvents.length > 0 ? (
            <SectionCard title="Important dates" subtitle={`${contactEvents.length} events`} icon="calendar">
              <div className="event-list">
                {contactEvents.map((event) => {
                  const eventDate = new Date(event.date);
                  const daysUntil = Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24));

                  return (
                    <div key={event.id} className="event-card event-card--compact">
                      <div className="event-card__date">
                        <span className="event-card__day">{eventDate.getDate()}</span>
                        <span className="event-card__month">
                          {eventDate.toLocaleDateString(undefined, { month: 'short' })}
                        </span>
                      </div>
                      <div className="event-card__content">
                        <span className="event-card__title">{event.title}</span>
                        {event.notes && <p className="event-card__notes">{event.notes}</p>}
                        <span className="event-card__time">
                          {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          ) : null}

          {/* Reminders */}
          <SectionCard
            title="Reminders"
            subtitle={nextReminder ? `Next: ${nextReminder.title}` : 'No upcoming reminders'}
            icon="bell"
            action={
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setReminderModal({ open: true, reminder: null, contactId: contact.id })}>
                <Icon name="plus" size={13} /> Add reminder
              </button>
            }
          >
            {contactReminders.length === 0 ? (
              <EmptyState icon="bell" title="No reminders" message="Add a reminder for a call, follow-up or birthday." />
            ) : (
              <div className="stack">
                {contactReminders.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    contact={contact}
                    onComplete={reminderHandlers.complete}
                    onEdit={reminderHandlers.edit}
                    onDelete={reminderHandlers.remove}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          {/* Notes */}
          <SectionCard title="Notes" icon="note">
            <NoteSection contact={contact} />
          </SectionCard>

          {/* Recent activity for this contact */}
          <SectionCard title="Recent activity" subtitle="Everything that happened with this contact" icon="activity">
            <ActivityTimeline activities={contactActivities} emptyMessage="No activity recorded for this contact yet." />
          </SectionCard>
        </div>

        <div className="details-col details-col--side">
          {/* Insights */}
          <SectionCard title="Contact insights" icon="sparkles">
            <div className="insight">
              <div className="insight__row">
                <span className="insight__label">Profile completeness</span>
                <span className="insight__value">{completeness.percent}%</span>
              </div>
              <ProgressBar
                value={completeness.percent}
                tone={completeness.percent >= 80 ? 'success' : completeness.percent >= 50 ? 'warning' : 'danger'}
              />
              {completeness.missing.length > 0 ? (
                <p className="insight__missing">
                  Missing: {completeness.missing.slice(0, 3).join(', ')}
                  {completeness.missing.length > 3 ? ` +${completeness.missing.length - 3} more` : ''}
                </p>
              ) : (
                <p className="insight__missing insight__missing--ok">Complete profile 🎉</p>
              )}
            </div>
            <dl className="insight-list">
              <div className="insight__row">
                <span className="insight__label">Group</span>
                <span className="insight__value">{group ? group.name : 'No group'}</span>
              </div>
              <div className="insight__row">
                <span className="insight__label">Relationship</span>
                <span className="insight__value">{contact.relationship || 'Not set'}</span>
              </div>
              <div className="insight__row">
                <span className="insight__label">Last interaction</span>
                <span className="insight__value">{lastContactLabel(contact)}</span>
              </div>
              {nextReminder ? (
                <div className="insight__row">
                  <span className="insight__label">Upcoming reminder</span>
                  <span className="insight__value">{nextReminder.title}</span>
                </div>
              ) : null}
              <div className="insight__row">
                <span className="insight__label">Contact added</span>
                <span className="insight__value">{formatTimestamp(contact.createdAt)}</span>
              </div>
            </dl>
          </SectionCard>
        </div>
      </div>

      <ReminderFormModal
        open={reminderModal.open}
        onClose={() => setReminderModal({ open: false, reminder: null, contactId: null })}
        reminder={reminderModal.reminder}
        preselectContactId={reminderModal.contactId || contact.id}
      />
    </div>
  );
}

