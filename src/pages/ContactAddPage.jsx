import { Link, useNavigate } from 'react-router-dom';
import ContactForm from '../components/contacts/ContactForm';
import Icon from '../components/ui/Icon';
import { contactService } from '../services/contactService';
import { useToast } from '../context/ToastContext';
import { useTitle } from '../hooks/useData';
import { fullName } from '../utils/contactUtils';

/** /contacts/add — create a new contact (shared ContactForm). */
export default function ContactAddPage() {
  useTitle('Add contact');
  const navigate = useNavigate();
  const toast = useToast();

  function handleSubmit(values) {
    try {
      const contact = contactService.add(values);
      toast.success('Contact saved', `${fullName(contact)} was added to your address book.`);
      navigate(`/contacts/${contact.id}`);
    } catch {
      toast.error('Could not save', 'Browser storage may be full. Try removing the profile photo.');
    }
  }

  return (
    <div className="page page--narrow">
      <Link to="/contacts" className="back-link">
        <Icon name="arrow-left" size={15} /> Back to contacts
      </Link>
      <header className="page-header">
        <div>
          <h1 className="page-title">Add contact</h1>
          <p className="page-subtitle">Fields marked with * are required — everything else is optional.</p>
        </div>
      </header>
      <div className="panel">
        <ContactForm isEdit={false} onSubmit={handleSubmit} onCancel={() => navigate(-1)} />
      </div>
    </div>
  );
}
