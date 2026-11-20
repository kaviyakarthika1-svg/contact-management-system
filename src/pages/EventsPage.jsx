import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SectionCard from '../components/ui/SectionCard';
import Avatar from '../components/ui/Avatar';
import Icon from '../components/ui/Icon';
import EmptyState from '../components/ui/EmptyState';
import { useEvents } from '../hooks/useData';
import { useContacts } from '../hooks/useData';
import { fullName } from '../utils/contactUtils';
import { formatDate, timeAgo } from '../utils/dateUtils';

const EVENT_TYPES = [
  { id: 'birthday', label: 'Birthday', icon: 'cake' },
  { id: 'anniversary', label: 'Anniversary', icon: 'heart' },
  { id: 'meeting', label: 'Meeting', icon: 'meeting' },
  { id: 'custom', label: 'Custom Event', icon: 'calendar' },
];

export default function EventsPage() {
  const events = useEvents();
  const contacts = useContacts();
  const [filter, setFilter] = useState('upcoming');

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const categorized = useMemo(() => {
    const upcoming = [];
    const todayEvents = [];
    const thisWeek = [];
    const later = [];

    events.forEach((event) => {
      const eventDate = new Date(event.date);
      const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      const daysDiff = Math.floor((eventDay - today) / (1000 * 60 * 60 * 24));

      if (daysDiff < 0) return;

      const contact = event.contactId
        ? contacts.find((c) => c.id === event.contactId) || null
        : null;

      const entry = {
        ...event,
        daysUntil: daysDiff,
        eventDate,
        contact,
      };

      if (daysDiff === 0) {
        todayEvents.push(entry);
      } else if (daysDiff <= 7) {
        thisWeek.push(entry);
      } else {
        upcoming.push(entry);
      }
    });

    return {
      today: todayEvents.sort((a, b) => a.eventDate - b.eventDate),
      thisWeek: thisWeek.sort((a, b) => a.eventDate - b.eventDate),
      upcoming: upcoming.sort((a, b) => a.eventDate - b.eventDate),
      later: later.sort((a, b) => a.eventDate - b.eventDate),
    };
  }, [events, contacts]);

  const getFilterData = () => {
    switch (filter) {
      case 'today':
        return categorized.today;
      case 'this-week':
        return categorized.thisWeek;
      case 'upcoming':
        return categorized.upcoming.slice(0, 10);
      case 'later':
        return categorized.later;
      default:
        return [];
    }
  };

  const getEventIcon = (type) => {
    const et = EVENT_TYPES.find((e) => e.id === type);
    return et ? et.icon : 'calendar';
  };

  const getEventLabel = (type) => {
    const et = EVENT_TYPES.find((e) => e.id === type);
    return et ? et.label : type;
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Events</h1>
          <p className="page-subtitle">Important dates and upcoming events</p>
        </div>
      </header>

      <div className="event-filters">
        {['today', 'this-week', 'upcoming', 'later'].map((f) => (
          <button
            key={f}
            type="button"
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter(f)}
          >
            {f === 'today' ? 'Today' : f === 'this-week' ? 'This Week' : f === 'upcoming' ? 'Upcoming' : 'Later'}
          </button>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-col">
          {getFilterData().length === 0 ? (
            <SectionCard title="Events" icon="calendar">
              <EmptyState
                icon="calendar"
                title="No events"
                message={filter === 'today' ? 'Nothing scheduled for today.' :
                  filter === 'this-week' ? 'No events this week.' :
                  'No upcoming events to display.'}
              />
            </SectionCard>
          ) : (
            <SectionCard title="Upcoming Events" subtitle={`${getFilterData().length} events`} icon="calendar">
              <div className="event-list">
                {getFilterData().map((event) => {
                  const eventDate = new Date(event.date);
                  const day = eventDate.getDate();
                  const month = eventDate.toLocaleDateString(undefined, { month: 'short' });
                  const time = eventDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

                  return (
                    <div key={event.id} className="event-card">
                      <div className="event-card__date">
                        <span className="event-card__day">{day}</span>
                        <span className="event-card__month">{month}</span>
                      </div>
                      <div className="event-card__content">
                        <div className="event-card__header">
                          <Icon name={getEventIcon(event.type)} size={14} />
                          <span className="event-card__type-label">{getEventLabel(event.type)}</span>
                          <span className="event-card__title">{event.title}</span>
                          {event.contact && (
                            <Link to={`/contacts/${event.contact.id}`} className="event-card__contact">
                              <Avatar contact={event.contact} size={18} />
                              {fullName(event.contact)}
                            </Link>
                          )}
                        </div>
                        {event.notes && (
                          <p className="event-card__notes">{event.notes}</p>
                        )}
                        <div className="event-card__footer">
                          <span className="event-card__date-label">
                            {event.daysUntil === 0 ? 'Today' :
                             event.daysUntil === 1 ? 'Tomorrow' :
                             `${event.daysUntil} days`}
                          </span>
                          <span className="event-card__time">{time}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
