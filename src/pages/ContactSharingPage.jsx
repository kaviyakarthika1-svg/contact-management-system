import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import SectionCard from '../components/ui/SectionCard';
import Avatar from '../components/ui/Avatar';
import Icon from '../components/ui/Icon';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { useContacts } from '../hooks/useData';
import { fullName } from '../utils/contactUtils';
import { useToast } from '../context/ToastContext';

export default function ContactSharingPage() {
  const contacts = useContacts();
  const toast = useToast();
  const [selectedContact, setSelectedContact] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showVCardModal, setShowVCardModal] = useState(false);
  const [vCardContent, setVCardContent] = useState('');

  const contactOptions = useMemo(() => {
    return contacts
      .map((c) => ({ id: c.id, name: fullName(c), phone: c.phone, email: c.email }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [contacts]);

  const handleSelectContact = (contactId) => {
    const contact = contacts.find((c) => c.id === contactId);
    if (contact) setSelectedContact(contact);
  };

  const handleShare = async (contact) => {
    if (!contact) return;

    if (navigator.share) {
      try {
        await navigator.share({ title: fullName(contact), text: fullName(contact), url: window.location.href });
        toast.success('Contact shared successfully');
        return;
      } catch (err) {
        if (err.name !== 'AbortError') console.warn('Share failed:', err);
      }
    }

    const text = `${fullName(contact)}
Phone: ${contact.phone || 'N/A'}
Email: ${contact.email || 'N/A'}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Contact info copied to clipboard');
    } catch (err) {
      toast.error('Unable to copy contact info');
    }
  };

  const handleCopyContact = () => {
    if (!selectedContact) return;
    const text = `${fullName(selectedContact)}
Phone: ${selectedContact.phone || 'N/A'}
Email: ${selectedContact.email || 'N/A'}
Company: ${selectedContact.company || 'N/A'}`;
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Contact info copied to clipboard'))
      .catch(() => toast.error('Unable to copy contact info'));
  };

  const handleDownloadVCard = () => {
    if (!selectedContact || !vCardContent) return;
    const blob = new Blob([vCardContent], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedContact.firstName}_${selectedContact.lastName || ''}.vcf`.replace(/\s+/g, '_');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('vCard downloaded successfully');
  };

  const handleGenerateVCard = () => {
    if (!selectedContact) return;
    const c = selectedContact;
    const firstName = c.firstName || '';
    const lastName = c.lastName || '';
    const fn = `${firstName} ${lastName}`.trim();

    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${fn}`,
      `N:${lastName || ''};${firstName || ''};;;`,
      c.email ? `EMAIL;TYPE=INTERNET:${c.email}` : null,
      c.phone ? `TEL;TYPE=CELL:${c.phone}` : null,
      c.altPhone ? `TEL;TYPE=HOME:${c.altPhone}` : null,
      c.company ? `ORG:${c.company}` : null,
      c.jobTitle ? `TITLE:${c.jobTitle}` : null,
      c.website ? `URL:${c.website}` : null,
      c.address ? `ADR:;;${c.address || ''};${c.city || ''};${c.state || ''};${c.country || ''};;;` : null,
      c.birthday ? `BDAY:${c.birthday}` : null,
      c.notes ? `NOTE:${c.notes}` : null,
      'END:VCARD',
    ].filter(Boolean).join('\n');

    setVCardContent(vcard);
    setShowVCardModal(true);
  };

  const handleGenerateQR = () => {
    if (!selectedContact) return;
    setShowQRModal(true);
  };

  if (contacts.length === 0) {
    return (
      <div className="page">
        <header className="page-header">
          <div>
            <h1 className="page-title">Contact Sharing</h1>
            <p className="page-subtitle">Share contacts with others</p>
          </div>
        </header>

        <SectionCard title="No Contacts" icon="share">
          <EmptyState icon="users" title="No contacts yet" message="Add some contacts first, then you can share them.">
            <Link to="/contacts/add" className="btn btn-primary">
              <Icon name="plus" size={15} /> Add Contact
            </Link>
          </EmptyState>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Contact Sharing</h1>
          <p className="page-subtitle">Share contacts via QR, vCard, or native sharing</p>
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="dashboard-col">
          <SectionCard title="Select Contact" icon="users" subtitle="Choose a contact to share">
            {contactOptions.length === 0 ? (
              <EmptyState icon="users" title="No contacts" message="No contacts available to share." />
            ) : (
              <div className="contact-select-grid">
                {contactOptions.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    className={`contact-select-btn ${selectedContact?.id === contact.id ? 'contact-select-btn--active' : ''}`}
                    onClick={() => handleSelectContact(contact.id)}
                  >
                    <Avatar contact={contacts.find((c) => c.id === contact.id)} size={48} />
                    <span className="contact-select-btn__name">{contact.name}</span>
                    <span className="contact-select-btn__phone">{contact.phone || 'No phone'}</span>
                  </button>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {selectedContact && (
          <div className="dashboard-col dashboard-col--middle">
            <SectionCard title="Share Options" icon="share" subtitle={fullName(selectedContact)}>
              <div className="contact-sharing-preview">
                <div className="contact-sharing-preview__header">
                  <Avatar contact={selectedContact} size={64} />
                  <div className="contact-sharing-preview__info">
                    <h3 className="contact-sharing-preview__name">{fullName(selectedContact)}</h3>
                    {selectedContact.relationship && (
                      <span className="contact-sharing-preview__relationship">{selectedContact.relationship}</span>
                    )}
                  </div>
                </div>

                <div className="contact-sharing-preview__details">
                  {selectedContact.phone && (
                    <a href={`tel:${selectedContact.phone}`} className="contact-sharing-preview__detail">
                      <Icon name="phone" size={16} />{selectedContact.phone}
                    </a>
                  )}
                  {selectedContact.email && (
                    <a href={`mailto:${selectedContact.email}`} className="contact-sharing-preview__detail">
                      <Icon name="mail" size={16} />{selectedContact.email}
                    </a>
                  )}
                  {selectedContact.company && (
                    <span className="contact-sharing-preview__detail">
                      <Icon name="building" size={16} />{selectedContact.company}
                    </span>
                  )}
                  {selectedContact.jobTitle && (
                    <span className="contact-sharing-preview__detail">
                      <Icon name="briefcase" size={16} />{selectedContact.jobTitle}
                    </span>
                  )}
                </div>

                <div className="contact-sharing-preview__actions">
                  <button type="button" className="btn btn-primary" onClick={() => handleShare(selectedContact)}>
                    <Icon name="share-2" size={16} /> Share Contact
                  </button>

                  <div className="share-actions-secondary">
                    <button type="button" className="btn btn-outline" onClick={handleCopyContact}>
                      <Icon name="copy" size={16} /> Copy Contact
                    </button>

                    <button type="button" className="btn btn-outline" onClick={handleGenerateQR}>
                      <Icon name="qrcode" size={16} /> QR Code
                    </button>

                    <button type="button" className="btn btn-outline" onClick={handleGenerateVCard}>
                      <Icon name="file-text" size={16} /> Download vCard
                    </button>

                    <Link to={`/contacts/${selectedContact.id}`} className="btn btn-ghost">
                      <Icon name="arrow-left" size={16} /> Back to Profile
                    </Link>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        <Modal
          open={showQRModal}
          title="QR Code"
          onClose={() => setShowQRModal(false)}
          footer={<button type="button" className="btn btn-primary" onClick={() => setShowQRModal(false)}>Close</button>}
        >
          <div className="qr-modal-content">
            <p className="qr-modal-content__description">Scan this QR code to share contact information.</p>
            <div className="qr-modal-content__canvas">
              <svg width="200" height="200" viewBox="0 0 200 200">
                <rect width="200" height="200" fill="#ffffff" />
                <g fill="#000000">
                  <rect x="0" y="0" width="50" height="50" />
                  <rect x="150" y="0" width="50" height="50" />
                  <rect x="0" y="150" width="50" height="50" />
                </g>
                <rect x="10" y="10" width="30" height="30" fill="#ffffff" />
                <rect x="160" y="10" width="30" height="30" fill="#ffffff" />
                <rect x="10" y="160" width="30" height="30" fill="#ffffff" />
                <rect x="15" y="15" width="20" height="20" fill="#000000" />
                <rect x="165" y="15" width="20" height="20" fill="#000000" />
                <rect x="15" y="165" width="20" height="20" fill="#000000" />
              </svg>
            </div>
            <p className="qr-modal-content__note">This is a demo QR code. In production, use a QR library like qrcode.react.</p>
          </div>
        </Modal>

        <Modal
          open={showVCardModal}
          title="vCard"
          onClose={() => setShowVCardModal(false)}
          footer={<>
            <button type="button" className="btn btn-ghost" onClick={() => setShowVCardModal(false)}>Close</button>
            <button type="button" className="btn btn-primary" onClick={handleDownloadVCard}>
              <Icon name="download" size={15} /> Download vCard
            </button>
          </>}
        >
          <div className="vcard-modal-content">
            <p className="vcard-modal-content__description">Download this contact as a vCard file (.vcf) that can be imported into most contact management apps.</p>
            <pre className="vcard-modal-content__code"><code>{vCardContent || 'No vCard content available'}</code></pre>
          </div>
        </Modal>
      </div>
    </div>
  );
}
