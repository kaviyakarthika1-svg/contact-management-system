import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';

/**
 * Small dropdown menu used for "more options" (contact card, group card).
 * Closes on outside click or Escape.
 */
export default function Dropdown({ items, icon = 'more-vertical', label = 'More options', align = 'right' }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function onOutsideClick(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onOutsideClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onOutsideClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className={`dropdown ${align === 'left' ? 'dropdown--left' : ''}`.trim()} ref={rootRef}>
      <button
        type="button"
        className="icon-btn"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name={icon} size={16} />
      </button>
      {open ? (
        <div className="dropdown__menu" role="menu">
          {items.map((item, index) =>
            item.divider ? (
              <div key={`d${index}`} className="dropdown__divider" role="separator" />
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={`dropdown__item ${item.danger ? 'dropdown__item--danger' : ''}`.trim()}
                onClick={() => {
                  setOpen(false);
                  item.onClick?.();
                }}
              >
                {item.icon ? <Icon name={item.icon} size={15} /> : null}
                <span>{item.label}</span>
              </button>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
