import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import { useContacts, useGroups } from '../../hooks/useData';
import { contactMatchesQuery, fullName, sortContacts } from '../../utils/contactUtils';

/**
 * Global search palette (Ctrl/Cmd + K). Searches across name, phone, email,
 * company, tags and groups; keyboard navigable with ↑ ↓ and Enter.
 */
export default function GlobalSearch({ open, onClose }) {
  const navigate = useNavigate();
  const contacts = useContacts();
  const groups = useGroups();

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  const groupNameById = useMemo(() => {
    const map = {};
    groups.forEach((g) => { map[g.id] = g.name; });
    return map;
  }, [groups]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sortContacts(contacts, 'name-asc').slice(0, 6);
    return sortContacts(contacts, 'name-asc')
      .filter((c) => contactMatchesQuery(c, q, groupNameById[c.groupId] || ''))
      .slice(0, 8);
  }, [contacts, query, groupNameById]);

  // Reset state and focus the input each time the palette opens.
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open]);

  function go(contact) {
    onClose();
    navigate(`/contacts/${contact.id}`);
  }

  function onKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault();
      go(results[activeIndex]);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Global search" width={520}>
      <div className="global-search" onKeyDown={onKeyDown}>
        <div className="global-search__input-wrap">
          <Icon name="search" size={17} />
          <input
            ref={inputRef}
            type="search"
            className="global-search__input"
            placeholder="Search name, phone, email, company, tag or group…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            aria-label="Search contacts"
          />
        </div>

        <div className="global-search__results" role="listbox" aria-label="Search results">
          {results.length === 0 ? (
            <p className="global-search__empty">
              No contacts match “{query.trim()}”. Try a different name, phone or company.
            </p>
          ) : (
            results.map((contact, index) => (
              <button
                key={contact.id}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={`global-search__item ${index === activeIndex ? 'global-search__item--active' : ''}`.trim()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => go(contact)}
              >
                <Avatar contact={contact} size={36} />
                <span className="global-search__text">
                  <span className="global-search__name">{fullName(contact)}</span>
                  <span className="global-search__meta">
                    {[contact.phone, contact.email || contact.company].filter(Boolean).join(' · ')}
                  </span>
                </span>
                {contact.favorite ? <Icon name="star" size={14} className="global-search__star" /> : null}
              </button>
            ))
          )}
        </div>

        <p className="global-search__hint">
          <kbd>↑</kbd> <kbd>↓</kbd> to navigate · <kbd>Enter</kbd> to open · <kbd>Esc</kbd> to close
        </p>
      </div>
    </Modal>
  );
}
