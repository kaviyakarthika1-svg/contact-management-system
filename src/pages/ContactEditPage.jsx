import { Link, useNavigate, useParams } from 'react-router-dom';
import ContactForm from '../components/contacts/ContactForm';
import EmptyState from '../components/ui/EmptyState';
import Icon from '../components/ui/Icon';
import { contactService } from '../services/contactService';
import { useToast } from '../context/ToastContext';
import { useContacts, useTitle } from '../hooks/useData';
import { fullName } from '../utils/contactUtils';

/** /contacts/:id/edit — edit an existing contact (reuses ContactForm). */
export default function ContactEditPage() {
  useTitle('Edit contact');
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const contacts = useContacts();
  const contact = contacts.find((c) => c.id === id);

  function handleSubmit(values) {
    try {
      contactService.update(id, values);
      toast.success('Changes saved', `${fullName(contact)} was updated.`);
      navigate(`/contacts/${id}`);
    } catch {
      toast.error('Could not save', 'Browser storage may be full. Try removing the profile photo.');
    }
  }

  if (!contact) {
    return (
      <div className="page page--narrow">
        <EmptyState icon="alert" title="Contact not found" message="It may have been deleted or the link is outdated.">
          <Link to="/contacts" className="btn btn-primary">
            <Icon name="users" size={15} /> All contacts
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="page page--narrow">
      <Link to={`/contacts/${id}`} className="back-link">
        <Icon name="arrow-left" size={15} /> Back to {fullName(contact).split(' ')[0] || 'contact'}
      </Link>
      <header className="page-header">
        <div>
          <h1 className="page-title">Edit contact</h1>
          <p className="page-subtitle">Update any detail — changes are saved to your browser.</p>
        </div>
      </header>
      <div className="panel">
        <ContactForm
          isEdit
          initial={contact}
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/contacts/${id}`)}
        />
      </div>
    </div>
  );
}
