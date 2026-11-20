import { useEffect } from 'react';

/**
 * Global keyboard shortcuts:
 *   Ctrl/Cmd + K → open global search
 *   N            → add a new contact (when not typing in a field)
 *   ?            → show the shortcuts help dialog
 * Escape is handled by the individual modals/dropdowns.
 */
export function useKeyboardShortcuts({ onOpenSearch, onOpenShortcuts, onAddContact }) {
  useEffect(() => {
    function handleKeyDown(event) {
      const target = event.target;
      const isTyping =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);

      // Ctrl/Cmd + K — global search (works even while typing).
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onOpenSearch?.();
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTyping) return;

      if (event.key === 'n' || event.key === 'N') {
        event.preventDefault();
        onAddContact?.();
      } else if (event.key === '?') {
        event.preventDefault();
        onOpenShortcuts?.();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearch, onOpenShortcuts, onAddContact]);
}
