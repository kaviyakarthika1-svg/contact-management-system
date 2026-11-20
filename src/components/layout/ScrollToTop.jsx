import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Scrolls the main content area back to the top on route change. */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.querySelector('.app-content')?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return null;
}
