import Modal from '../ui/Modal';
import { SHORTCUTS } from '../../utils/constants';

/** Keyboard shortcuts help dialog (opened with "?" or from the header). */
export default function ShortcutsModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts" width={420}>
      <ul className="shortcuts">
        {SHORTCUTS.map((shortcut) => (
          <li key={shortcut.description} className="shortcuts__row">
            <span className="shortcuts__keys">
              {shortcut.keys.map((key) => (
                <kbd key={key}>{key}</kbd>
              ))}
            </span>
            <span>{shortcut.description}</span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
