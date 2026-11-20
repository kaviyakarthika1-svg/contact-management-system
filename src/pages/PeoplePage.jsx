import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SectionCard from '../components/ui/SectionCard';
import Avatar from '../components/ui/Avatar';
import Icon from '../components/ui/Icon';
import EmptyState from '../components/ui/EmptyState';
import { useContacts } from '../hooks/useData';
import { fullName, daysSinceLastContact } from '../utils/contactUtils';
import { timeAgo } from '../utils/dateUtils';
import { RELATIONSHIPS } from '../utils/constants';

/**
 * /people — explore contacts by relationship type.
 * Click a relationship filter to see only those contacts.
 */

export default function PeoplePage() {
  const contacts = useContacts();
  // Active relationship filter lives in the URL (?relationship=Family) so the
  // dashboard "Relationship Overview" cards deep-link straight into People.
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = searchParams.get('relationship');

  function setActiveFilter(relationship) {
    if (relationship) setSearchParams({ relationship });
    else setSearchParams({});
  }

  const grouped = useMemo(() => {
    const map = {};
    RELATIONSHIPS.forEach((rel) => {
      map[rel] = [];
    });
    map['Other'] = [];

    contacts.forEach((c) => {
      const rel = c.relationship || 'Other';
      if (map[rel]) {
        map[rel].push(c);
      } else {
        map['Other'].push(c);
      }
    });

    // Sort each group by name
    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => fullName(a).localeCompare(fullName(b)));
    });

    return map;
  }, [contacts]);

  const relationshipCounts = useMemo(() => {
    return RELATIONSHIPS.map((rel) => ({
      relationship: rel,
      count: grouped[rel]?.length || 0,
    })).concat([{ relationship: 'Other', count: grouped['Other']?.length || 0 }]);
  }, [grouped]);

  const filteredGroups = useMemo(() => {
    if (!activeFilter) return grouped;
    const result = {};
    result[activeFilter] = grouped[activeFilter] || [];
    return result;
  }, [grouped, activeFilter]);

  const hasAnyContacts = contacts.length > 0;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">People</h1>
          <p className="page-subtitle">Contacts organized by relationship</p>
        </div>
      </header>

      {/* Relationship filter buttons */}
      <div className="people-filters">
        <button
          type="button"
          className={`people-filter-btn ${activeFilter === null ? 'active' : ''}`}
          onClick={() => setActiveFilter(null)}
        >
          All ({contacts.length})
        </button>
        {relationshipCounts.map(({ relationship, count }) => (
          <button
            key={relationship}
            type="button"
            className={`people-filter-btn ${activeFilter === relationship ? 'active' : ''}`}
            onClick={() => setActiveFilter(relationship)}
            disabled={count === 0}
          >
            {relationship} ({count})
          </button>
        ))}
      </div>

      {/* Grouped contact lists */}
      <div className="dashboard-grid">
        <div className="dashboard-col">
          {!hasAnyContacts ? (
            <SectionCard title="People" icon="users">
              <EmptyState
                icon="users"
                title="No contacts yet"
                message="Add contacts with relationship types to see them organized here."
              />
            </SectionCard>
          ) : (
            Object.entries(filteredGroups).map(([relationship, people]) => {
              if (people.length === 0 && activeFilter !== relationship) return null;
              if (people.length === 0 && activeFilter === relationship) {
                return (
                  <SectionCard key={relationship} title={relationship} icon="users">
                    <EmptyState
                      icon="users"
                      title={`No ${relationship.toLowerCase()} contacts`}
                      message={`You haven't added any contacts with the "${relationship}" relationship type yet.`}
                    />
                  </SectionCard>
                );
              }

              return (
                <div key={relationship} className="people-group">
                  <h3 className="people-group-title">{relationship} ({people.length})</h3>
                  <ul className="mini-list">
                    {people.map((contact) => {
                      const lastContacted = contact.lastContactedAt
                        ? daysSinceLastContact(contact)
                        : Infinity;

                      return (
                        <li key={contact.id} className="mini-list__item--contact">
                          <Link to={`/contacts/${contact.id}`} className="mini-list__item">
                            <Avatar contact={contact} size={34} />
                            <span className="mini-list__text">
                              <span className="mini-list__name">{fullName(contact)}</span>
                              <span className="mini-list__meta">
                                {[contact.jobTitle, contact.company].filter(Boolean).join(' · ') || '—'}
                              </span>
                            </span>
                            <span className="mini-list__time">
                              {lastContacted === Infinity ? 'Never' : `${lastContacted}d ago`}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
