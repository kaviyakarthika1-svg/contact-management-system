/** Returns the platform modifier label for the shortcut hint (Ctrl on Win/Linux, ⌘ on Mac). */
export function useKeyboardShortcutHint() {
  if (typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent)) {
    return '⌘';
  }
  return 'Ctrl';
}
