import { useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import TagBadge from '../ui/TagBadge';
import Dropdown from '../ui/Dropdown';
import EmptyState from '../ui/EmptyState';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import { contactService } from '../../services/contactService';
import {
  fullName,
  mailtoLink,
  mapsLink,
  needsFollowUp,
  telLink,
  whatsappLink,
} from '../../utils/contactUtils';
import { timeAgo } from '../../utils/dateUtils';

/**
 * Interactive contact card with "smart actions":
 * - phone → tel: link, email → mailto:, WhatsApp → wa.me, address → Google Maps
 * - avatar/name → contact details page
 * - star → instant favorite toggle
 * - ⋮ menu → view / edit / reminder / important / delete (with confirm)
 * Clicking call/email/WhatsApp also records the interaction as activity.
 */
export default function ContactCard({ contact, groups = [], variant = 'grid', onAddReminder }) {
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const group = useMemo(() => groups.find((g) => g.id === contact.groupId), [groups, contact.groupId]);

  const handleCall = useCallback(() => {
    contactService.logInteraction(contact.id, 'called');
  }, [contact.id]);

  const handleEmail = useCallback(() => {
    contactService.logInteraction(contact.id, 'emailed');
  }, [contact.id]);

  const handleWhatsApp = useCallback(() => {
    contactService.logInteraction(contact.id, 'whatsapp');
  }, [contact.id]);

  const handleFavorite = useCallback(() => {
    const updated = contactService.toggleFavorite(contact.id);
    toast.success(updated.favorite ? 'Added to favorites' : 'Removed from favorites', fullName(updated));
  }, [contact.id, toast]);

  const handleImportant = useCallback(() => {
    contactService.setImportant(contact.id, !contact.important);
    toast.info(contact.important ? 'Removed important flag' : 'Marked as important', fullName(contact));
  }, [contact, toast]);

  const handleDelete = useCallback(async () => {
    const ok = await confirm({
      title: 'Delete contact?',
      message: `${fullName(contact)} and all their reminders will be permanently removed.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    contactService.remove(contact.id);
    toast.success('Contact deleted', fullName(contact));
  }, [contact, confirm, toast]);

  const menuItems = [
    { label: 'View details', icon: 'user', onClick: () => navigate(`/contacts/${contact.id}`) },
    { label: 'Edit contact', icon: 'edit', onClick: () => navigate(`/contacts/${contact.id}/edit`) },
    { label: 'Add reminder', icon: 'bell', onClick: () => onAddReminder?.(contact) },
    {
      label: contact.important ? 'Remove important flag' : 'Mark as important',
      icon: 'shield',
      onClick: handleImportant,
    },
    { divider: true },
    { label: 'Delete', icon: 'trash', danger: true, onClick: handleDelete },
  ];

  /* ----------------------------- Row variant ----------------------------- */
  if (variant === 'row') {
    return (
      <article className="contact-row">
        <Link to={`/contacts/${contact.id}`} className="contact-row__identity">
          <Avatar contact={contact} size={42} />
          <span className="contact-row__name-wrap">
            <span className="contact-row__name">{fullName(contact)}</span>
            <span className="contact-row__sub">
              {[contact.jobTitle, contact.company].filter(Boolean).join(' · ') || '—'}
            </span>
          </span>
        </Link>
        <a href={telLink(contact.phone)} onClick={handleCall} className="contact-row__value">
          {contact.phone}
        </a>
        <a
          href={contact.email ? mailtoLink(contact.email) : undefined}
          onClick={handleEmail}
          className={`contact-row__value ${contact.email ? '' : 'is-empty'}`.trim()}
        >
          {contact.email || '—'}
        </a>
        <span className="contact-row__group">
          {group ? (
            <span className="badge" style={{ '--badge-color': group.color }}>
              {group.name}
            </span>
          ) : (
            <span className="badge badge--muted">No group</span>
          )}
        </span>
        <div className="contact-row__actions">
          {contact.email ? (
            <a className="icon-btn" href={mailtoLink(contact.email)} onClick={handleEmail} aria-label={`Email ${fullName(contact)}`} title="Email">
              <Icon name="mail" size={15} />
            </a>
          ) : null}
          <a
            className="icon-btn icon-btn--whatsapp"
            href={whatsappLink(contact.phone)}
            onClick={handleWhatsApp}
            target="_blank"
            rel="noreferrer"
            aria-label={`WhatsApp ${fullName(contact)}`}
            title="WhatsApp"
          >
            <Icon name="whatsapp" size={15} />
          </a>
          <button
            type="button"
            className={`icon-btn ${contact.favorite ? 'icon-btn--starred' : ''}`.trim()}
            aria-label={contact.favorite ? `Remove ${fullName(contact)} from favorites` : `Add ${fullName(contact)} to favorites`}
            title="Favorite"
            onClick={handleFavorite}
          >
            <Icon name="star" size={15} />
          </button>
          <Dropdown items={menuItems} label={`Options for ${fullName(contact)}`} />
        </div>
      </article>
    );
  }

  /* ----------------------------- Grid variant ---------------------------- */
  return (
    <article className="contact-card">
      <div className="contact-card__top">
        <Link to={`/contacts/${contact.id}`} className="contact-card__identity" aria-label={`Open ${fullName(contact)}`}>
          <Avatar contact={contact} size={48} />
          <span className="contact-card__name-wrap">
            <span className="contact-card__name">{fullName(contact)}</span>
            <span className="contact-card__sub">
              {[contact.jobTitle, contact.company].filter(Boolean).join(' · ') || 'No job details yet'}
            </span>
          </span>
        </Link>
        <div className="contact-card__flags">
          {contact.important ? (
            <span className="badge badge--important" title="Important contact">
              <Icon name="shield" size={11} /> Important
            </span>
          ) : null}
          <button
            type="button"
            className={`icon-btn ${contact.favorite ? 'icon-btn--starred' : ''}`.trim()}
            aria-label={contact.favorite ? `Remove ${fullName(contact)} from favorites` : `Add ${fullName(contact)} to favorites`}
            aria-pressed={contact.favorite}
            title="Favorite"
            onClick={handleFavorite}
          >
            <Icon name="star" size={16} />
          </button>
          <Dropdown items={menuItems} label={`Options for ${fullName(contact)}`} />
        </div>
      </div>

      <div className="contact-card__tags">
        {group ? (
          <span className="badge" style={{ '--badge-color': group.color }}>
            {group.name}
          </span>
        ) : null}
        {(contact.tags || []).slice(0, 3).map((tag) => (
          <TagBadge key={tag} tag={tag} />
        ))}
        {needsFollowUp(contact) ? (
          <span
            className="badge badge--warning"
            title={contact.lastContactedAt ? `Last contacted ${timeAgo(contact.lastContactedAt)}` : 'Never contacted'}
          >
            <Icon name="clock" size={11} /> Follow up
          </span>
        ) : null}
      </div>

      <div className="contact-card__details">
        <a href={telLink(contact.phone)} onClick={handleCall} className="contact-card__line" title="Call">
          <Icon name="phone" size={14} />
          <span>{contact.phone}</span>
        </a>
        {contact.email ? (
          <a href={mailtoLink(contact.email)} onClick={handleEmail} className="contact-card__line" title="Email">
            <Icon name="mail" size={14} />
            <span>{contact.email}</span>
          </a>
        ) : null}
        {contact.address || contact.city ? (
          <a href={mapsLink(contact)} target="_blank" rel="noreferrer" className="contact-card__line" title="Open in Google Maps">
            <Icon name="map-pin" size={14} />
            <span>{[contact.address, contact.city].filter(Boolean).join(', ')}</span>
          </a>
        ) : null}
      </div>

      <footer className="contact-card__footer">
        <a className="icon-btn icon-btn--call" href={telLink(contact.phone)} onClick={handleCall} aria-label={`Call ${fullName(contact)}`} title="Call">
          <Icon name="phone" size={15} />
        </a>
        {contact.email ? (
          <a className="icon-btn icon-btn--mail" href={mailtoLink(contact.email)} onClick={handleEmail} aria-label={`Email ${fullName(contact)}`} title="Email">
            <Icon name="mail" size={15} />
          </a>
        ) : null}
        <a
          className="icon-btn icon-btn--whatsapp"
          href={whatsappLink(contact.phone)}
          onClick={handleWhatsApp}
          target="_blank"
          rel="noreferrer"
          aria-label={`WhatsApp ${fullName(contact)}`}
          title="WhatsApp"
        >
          <Icon name="whatsapp" size={15} />
        </a>
        <span className="contact-card__spacer" />
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate(`/contacts/${contact.id}`)}>
          View
          <Icon name="chevron-right" size={14} />
        </button>
      </footer>
    </article>
  );
}

/** Shared empty state for filtered contact lists. */
export function ContactsEmptyState({ hasFilters, onAdd, onClearFilters }) {
  if (hasFilters) {
    return (
      <EmptyState
        icon="search"
        title="No matching contacts"
        message="Try a different search term or clear the filters to see everyone."
      >
        <button type="button" className="btn btn-outline" onClick={onClearFilters}>
          <Icon name="refresh" size={15} /> Clear filters
        </button>
      </EmptyState>
    );
  }
  return (
    <EmptyState
      icon="users"
      title="No contacts yet"
      message="Add your first contact to get started — you can also import a CSV file."
    >
      <button type="button" className="btn btn-primary" onClick={onAdd}>
        <Icon name="plus" size={15} /> Add contact
      </button>
    </EmptyState>
  );
}



