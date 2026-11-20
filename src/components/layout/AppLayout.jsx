import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import GlobalSearch from './GlobalSearch';
import ShortcutsModal from './ShortcutsModal';
import ScrollToTop from './ScrollToTop';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useTheme } from '../../hooks/useData';

/**
 * Application shell: sidebar + header + routed main content,
 * plus the global search palette and shortcuts dialog.
 */
export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [theme] = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Apply the theme to the document (also set pre-paint in index.html).
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useKeyboardShortcuts({
    onOpenSearch: () => setSearchOpen(true),
    onOpenShortcuts: () => setShortcutsOpen(true),
    onAddContact: useCallback(() => navigate('/contacts/add'), [navigate]),
  });

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="app-main">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenShortcuts={() => setShortcutsOpen(true)}
        />
        <main id="main-content" className="app-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <ScrollToTop />
    </div>
  );
}
