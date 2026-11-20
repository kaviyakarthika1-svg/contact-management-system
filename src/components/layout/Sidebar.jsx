import { NavLink } from 'react-router-dom';
import Icon from '../ui/Icon';
import { useContacts, useInteractions, useEvents, useReminders } from '../../hooks/useData';
import { remindersNeedingAttention } from '../../utils/reminderUtils';
import { version } from '../../../package.json';

const NAV_ITEMS = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/contacts', icon: 'users', label: 'Contacts' },
  { to: '/favorites', icon: 'star', label: 'Favorites' },
  { to: '/reminders', icon: 'bell', label: 'Reminders' },
  { to: '/people', icon: 'users', label: 'People' },
  { to: '/interactions', icon: 'history', label: 'Interactions' },
  { to: '/events', icon: 'calendar', label: 'Events' },
  { to: '/contact-sharing', icon: 'share-2', label: 'Sharing' },
  { to: '/activity', icon: 'activity', label: 'Activity' },
];

/** App sidebar with the main navigation. Becomes an off-canvas drawer on mobile. */
export default function Sidebar({ open, onClose }) {
  const contacts = useContacts();
  const reminders = useReminders();
  const attention = remindersNeedingAttention(reminders).length;

  const counts = {
    '/contacts': contacts.length,
    '/reminders': attention || null,
  };

  return (
    <>
      {/* Dimmed backdrop behind the mobile drawer */}
      <div
        className={`sidebar-backdrop ${open ? 'sidebar-backdrop--open' : ''}`.trim()}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`.trim()} aria-label="Main navigation">
        <div className="sidebar__brand">
          <span className="sidebar__logo" aria-hidden="true">
            <Icon name="users" size={19} />
          </span>
          <div className="sidebar__brand-text">
            <span className="sidebar__name">ConnectSphere</span>
            <span className="sidebar__tagline">Contact Management</span>
          </div>
          <button type="button" className="icon-btn sidebar__close" aria-label="Close menu" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`.trim()}
              onClick={onClose}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
              {counts[item.to] ? <span className="sidebar__badge">{counts[item.to]}</span> : null}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <NavLink to="/contacts/add" className="btn btn-primary sidebar__cta" onClick={onClose}>
            <Icon name="user-plus" size={16} />
            Add Contact
          </NavLink>
          <p className="sidebar__version">ConnectSphere v{version} · Data stays in your browser</p>
        </div>
      </aside>
    </>
  );
}
