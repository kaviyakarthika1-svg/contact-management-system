import ContactCard from './ContactCard';

/**
 * Reusable contact grid/list. Cards own their actions, so the list only
 * decides layout (grid of cards vs compact rows).
 */
export default function ContactList({ contacts, groups = [], view = 'grid', onAddReminder }) {
  if (contacts.length === 0) return null;

  if (view === 'list') {
    return (
      <div className="contact-rows" role="list">
        <div className="contact-rows__head" aria-hidden="true">
          <span>Contact</span>
          <span>Phone</span>
          <span>Email</span>
          <span>Group</span>
          <span className="contact-rows__head-actions">Actions</span>
        </div>
        {contacts.map((contact) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            groups={groups}
            variant="row"
            onAddReminder={onAddReminder}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="contact-grid">
      {contacts.map((contact) => (
        <ContactCard key={contact.id} contact={contact} groups={groups} onAddReminder={onAddReminder} />
      ))}
    </div>
  );
}
