import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ContactFilterBar from '../components/contacts/ContactFilterBar';
import ContactList from '../components/contacts/ContactList';
import { ContactsEmptyState } from '../components/contacts/ContactCard';
import ImportModal from '../components/contacts/ImportModal';
import ReminderFormModal from '../components/reminders/ReminderFormModal';
import Icon from '../components/ui/Icon';
import Skeleton from '../components/ui/Skeleton';
import { useContacts, useGroups, useReminders, useSkeleton, useTitle } from '../hooks/useData';
import { sortContacts, wasAddedRecently } from '../utils/contactUtils';

const DEFAULT_FILTERS = {
  query: '',
  group: 'all',
  tag: 'all',
  quick: new Set(),
  sort: 'name-asc',
  view: 'grid',
};

/** /contacts — search, filter, sort and manage all contacts. */
export default function ContactsPage() {
  useTitle('Contacts');
  const navigate = useNavigate();
  const contacts = useContacts();
  const groups = useGroups();
  const reminders = useReminders();
  const loading = useSkeleton();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState(() => ({
    ...DEFAULT_FILTERS,
    group: searchParams.get('group') || 'all',
  }));
  const [importOpen, setImportOpen] = useState(searchParams.get('import') === '1');
  const [reminderModal, setReminderModal] = useState({ open: false, reminder: null, contactId: null });

  // Open the import dialog when arriving via /contacts?import=1 (quick action).
  useEffect(() => {
    if (searchParams.get('import') === '1') {
      setImportOpen(true);
      searchParams.delete('import');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const contactIdsWithReminders = useMemo(
    () => new Set(reminders.filter((r) => !r.completed).map((r) => r.contactId)),
    [reminders],
  );

  const allTags = useMemo(() => {
    const tags = new Set();
    contacts.forEach((c) => (c.tags || []).forEach((t) => tags.add(t)));
    return [...tags].sort();
  }, [contacts]);

  const visible = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    let list = contacts.filter((contact) => {
      // text search across name/phone/email/company/group
      if (query) {
        const groupName = groups.find((g) => g.id === contact.groupId)?.name || '';
        const haystack = [
          contact.firstName, contact.lastName, contact.phone, contact.altPhone,
          contact.email, contact.company, contact.jobTitle, groupName, ...(contact.tags || []),
        ].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      // group filter
      if (filters.group !== 'all' && contact.groupId !== filters.group) return false;
      // tag filter
      if (filters.tag !== 'all' && !(contact.tags || []).includes(filters.tag)) return false;
      // quick filters (AND-ed)
      for (const quick of filters.quick) {
        if (quick === 'favorites' && !contact.favorite) return false;
        if (quick === 'recent' && !wasAddedRecently(contact, 30)) return false;
        if (quick === 'reminder' && !contactIdsWithReminders.has(contact.id)) return false;
        if (quick === 'email' && !contact.email) return false;
        if (quick === 'phone' && !contact.phone) return false;
      }
      return true;
    });
    return sortContacts(list, filters.sort);
  }, [contacts, groups, filters, contactIdsWithReminders]);

  const hasFilters =
    filters.query.trim() !== '' || filters.group !== 'all' || filters.tag !== 'all' || filters.quick.size > 0;

  if (loading) {
    return (
      <div className="page">
        <Skeleton rows={8} />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="page-subtitle">{contacts.length} people in your address book</p>
        </div>
        <div className="page-header__actions">
          <button type="button" className="btn btn-outline" onClick={() => setImportOpen(true)}>
            <Icon name="upload" size={15} /> Import
          </button>
          <Link to="/contacts/add" className="btn btn-primary">
            <Icon name="plus" size={15} /> Add contact
          </Link>
        </div>
      </header>

      <ContactFilterBar
        filters={filters}
        onChange={setFilters}
        groups={groups}
        tags={allTags}
        resultCount={visible.length}
        totalCount={contacts.length}
      />

      {visible.length === 0 ? (
        <ContactsEmptyState
          hasFilters={hasFilters}
          onAdd={() => navigate('/contacts/add')}
          onClearFilters={() => setFilters({ ...DEFAULT_FILTERS, view: filters.view })}
        />
      ) : (
        <ContactList
          contacts={visible}
          groups={groups}
          view={filters.view}
          onAddReminder={(contact) => setReminderModal({ open: true, reminder: null, contactId: contact.id })}
        />
      )}

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
      <ReminderFormModal
        open={reminderModal.open}
        onClose={() => setReminderModal({ open: false, reminder: null, contactId: null })}
        preselectContactId={reminderModal.contactId}
      />
    </div>
  );
}
