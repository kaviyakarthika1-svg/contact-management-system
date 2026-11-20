import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Avatar from '../components/ui/Avatar';
import Icon from '../components/ui/Icon';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import ContactList from '../components/contacts/ContactList';
import ReminderFormModal from '../components/reminders/ReminderFormModal';
import { useContacts, useGroups, useSkeleton, useTitle } from '../hooks/useData';
import { useState } from 'react';
import { fullName } from '../utils/contactUtils';
import { useToast } from '../context/ToastContext';
import { contactService } from '../services/contactService';

/** /favorites — favorite contacts with quick call/email/WhatsApp actions. */
export default function FavoritesPage() {
  useTitle('Favorites');
  const navigate = useNavigate();
  const toast = useToast();
  const loading = useSkeleton();

  const contacts = useContacts();
  const groups = useGroups();
  const [reminderModal, setReminderModal] = useState({ open: false, contactId: null });

  const favorites = useMemo(() => contacts.filter((c) => c.favorite), [contacts]);

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
          <h1 className="page-title">Favorites</h1>
          <p className="page-subtitle">{favorites.length} favorite contact{favorites.length === 1 ? '' : 's'}</p>
        </div>
        <div className="page-header__actions">
          <button type="button" className="btn btn-outline" onClick={() => navigate('/contacts')}>
            <Icon name="users" size={15} /> All contacts
          </button>
          <Link to="/contacts/add" className="btn btn-primary">
            <Icon name="plus" size={15} /> Add contact
          </Link>
        </div>
      </header>

      {favorites.length === 0 ? (
        <EmptyState
          icon="star"
          title="No favorites yet"
          message="Tap the star on any contact card to keep them here for quick access."
        >
          <button type="button" className="btn btn-primary" onClick={() => navigate('/contacts')}>
            <Icon name="users" size={15} /> Browse contacts
          </button>
        </EmptyState>
      ) : (
        <ContactList
          contacts={favorites}
          groups={groups}
          view="grid"
          onAddReminder={(contact) => setReminderModal({ open: true, contactId: contact.id })}
        />
      )}

      <ReminderFormModal
        open={reminderModal.open}
        onClose={() => setReminderModal({ open: false, contactId: null })}
        preselectContactId={reminderModal.contactId}
      />
    </div>
  );
}
