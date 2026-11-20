import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import SectionCard from '../components/ui/SectionCard';
import Avatar from '../components/ui/Avatar';
import Icon from '../components/ui/Icon';
import EmptyState from '../components/ui/EmptyState';
import { useInteractions } from '../hooks/useData';
import { interactionService } from '../services/interactionService';
import { useContacts } from '../hooks/useData';
import { fullName } from '../utils/contactUtils';
import { timeAgo, formatTimestamp } from '../utils/dateUtils';
import { ACTIVITY_META } from '../utils/constants';

const INTERACTION_TYPES = [
  { id: 'call', label: 'Phone Call', icon: 'phone' },
  { id: 'message', label: 'Message', icon: 'message' },
  { id: 'email', label: 'Email', icon: 'mail' },
  { id: 'meeting', label: 'Meeting', icon: 'meeting' },
  { id: 'video-call', label: 'Video Call', icon: 'video' },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp' },
  { id: 'other', label: 'Other', icon: 'chat' },
];

/** 可视化互动历史时间线 */
export default function InteractionsPage() {
  const interactions = useInteractions();
  const contacts = useContacts();

  const groupedByType = useMemo(() => {
    const map = {};
    INTERACTION_TYPES.forEach((type) => {
      map[type.id] = [];
    });
    interactions.forEach((i) => {
      if (map[i.type]) {
        map[i.type].push(i);
      } else {
        map['other'].push(i);
      }
    });
    return map;
  }, [interactions]);

  const totalByType = useMemo(() => {
    return INTERACTION_TYPES.map((type) => ({
      type: type.id,
      label: type.label,
      icon: type.icon,
      count: groupedByType[type.id]?.length || 0,
    })).filter((t) => t.count > 0).sort((a, b) => b.count - a.count);
  }, [groupedByType]);

  const getContactName = (contactId) => {
    if (!contactId) return 'Unknown';
    const contact = contacts.find((c) => c.id === contactId);
    return contact ? fullName(contact) : 'Unknown contact';
  };

  const getContact = (contactId) => {
    if (!contactId) return null;
    return contacts.find((c) => c.id === contactId) || null;
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Interactions</h1>
          <p className="page-subtitle">Communication history with your contacts</p>
        </div>
      </header>

      {/* Summary by type */}
      {totalByType.length > 0 && (
        <div className="stats-grid">
          {totalByType.map(({ type, label, icon, count }) => (
            <div key={type} className="stats-card stats-card--compact">
              <span className="stats-card__icon">
                <Icon name={icon} size={20} />
              </span>
              <span className="stats-card__value">{count}</span>
              <span className="stats-card__label">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Timeline */}
      <div className="dashboard-grid">
        <div className="dashboard-col">
          {interactions.length === 0 ? (
            <SectionCard title="Interaction History" icon="history">
              <EmptyState
                icon="history"
                title="No interactions yet"
                message="When you call, message, or email a contact, it will appear here."
              />
            </SectionCard>
          ) : (
            <SectionCard title="Timeline" subtitle={`${interactions.length} interactions`} icon="history">
              <div className="timeline">
                {interactions.map((interaction) => {
                  const contact = getContact(interaction.contactId);
                  const meta = ACTIVITY_META[interaction.type] || { icon: 'chat', tone: 'muted' };
                  const date = new Date(interaction.timestamp);
                  const dateStr = date.toLocaleDateString(undefined, {
                    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                  });

                  return (
                    <div key={interaction.id} className="timeline__item">
                      <div className="timeline__icon">
                        <Icon name={meta.icon || 'chat'} size={16} tone={meta.tone} />
                      </div>
                      <div className="timeline__content">
                        <div className="timeline__header">
                          <span className="timeline__title">
                            {contact ? (
                              <Link to={`/contacts/${contact.id}`} className="timeline__link">
                                {fullName(contact)}
                              </Link>
                            ) : (
                              <span className="timeline__link">Unknown</span>
                            )}
                          </span>
                          <span className="timeline__type">{interaction.type}</span>
                        </div>
                        {interaction.description && (
                          <p className="timeline__description">{interaction.description}</p>
                        )}
                        <span className="timeline__time">
                          {formatTimestamp(interaction.timestamp)}
                        </span>
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