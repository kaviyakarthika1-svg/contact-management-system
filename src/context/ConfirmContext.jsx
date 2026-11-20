import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import Modal from '../components/ui/Modal';
import Icon from '../components/ui/Icon';

// Confirmation dialog system. Usage:
//   const confirm = useConfirm();
//   const ok = await confirm({ title, message, confirmLabel: 'Delete', danger: true });

const ConfirmContext = createContext(null);

const DEFAULTS = {
  title: 'Are you sure?',
  message: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  danger: false,
};

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({ ...DEFAULTS, ...options });
    });
  }, []);

  const close = useCallback((result) => {
    setDialog(null);
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
  }, []);

  const api = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={api}>
      {children}
      {dialog ? (
        <Modal open onClose={() => close(false)} title={dialog.title} width={430}>
          <div className={`confirm ${dialog.danger ? 'confirm--danger' : ''}`}>
            {dialog.danger ? (
              <span className="confirm__icon">
                <Icon name="alert-triangle" size={22} />
              </span>
            ) : null}
            <p className="confirm__message">{dialog.message || 'This action cannot be undone.'}</p>
            <div className="modal__footer">
              <button type="button" className="btn btn-ghost" onClick={() => close(false)}>
                {dialog.cancelLabel}
              </button>
              <button
                type="button"
                className={`btn ${dialog.danger ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => close(true)}
                autoFocus
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
