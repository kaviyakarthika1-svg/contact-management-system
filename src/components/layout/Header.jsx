import { useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';
import { useTheme } from '../../hooks/useData';
import { useKeyboardShortcutHint } from './headerHelpers';

/** Top bar: mobile menu, global search trigger, theme toggle, quick add. */
export default function Header({ onMenuClick, onOpenSearch, onOpenShortcuts }) {
  const navigate = useNavigate();
  const [theme, setTheme] = useTheme();
  const modKey = useKeyboardShortcutHint();

  return (
    <header className="header">
      <button
        type="button"
        className="icon-btn header__menu"
        aria-label="Open navigation menu"
        onClick={onMenuClick}
      >
        <Icon name="menu" size={20} />
      </button>

      <button type="button" className="header__search" onClick={onOpenSearch}>
        <Icon name="search" size={16} />
        <span>Search contacts…</span>
        <kbd className="header__kbd">
          <span className="header__kbd-text">{modKey}</span>K
        </kbd>
      </button>


      <div className="header__actions">
        <button
          type="button"
          className="icon-btn"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (?)"
          onClick={onOpenShortcuts}
        >
          <Icon name="keyboard" size={18} />
        </button>
        <button type="button" className="btn btn-primary btn-sm header__add" onClick={() => navigate('/contacts/add')}>
          <Icon name="plus" size={16} />
          <span>Add</span>
        </button>
      </div>
    </header>
  );
}
