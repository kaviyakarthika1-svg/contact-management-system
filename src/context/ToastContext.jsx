import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import Icon from '../components/ui/Icon';

// Toast notification system. Any component can call:
//   const toast = useToast();
//   toast.success('Saved', 'The contact was added.');

const ToastContext = createContext(null);
let nextToastId = 1;

const TONES = {
  success: { icon: 'check', className: 'toast--success' },
  error: { icon: 'alert', className: 'toast--error' },
  info: { icon: 'info', className: 'toast--info' },
  warning: { icon: 'alert-triangle', className: 'toast--warning' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const push = useCallback((tone, title, message) => {
    const id = nextToastId;
    nextToastId += 1;
    setToasts((list) => [...list.slice(-3), { id, tone, title, message }]);
    timers.current[id] = setTimeout(() => dismiss(id), 4200);
  }, [dismiss]);

  const api = useMemo(
    () => ({
      success: (title, message) => push('success', title, message),
      error: (title, message) => push('error', title, message),
      info: (title, message) => push('info', title, message),
      warning: (title, message) => push('warning', title, message),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => {
          const tone = TONES[t.tone] || TONES.info;
          return (
            <div key={t.id} className={`toast ${tone.className}`}>
              <span className="toast__icon">
                <Icon name={tone.icon} size={16} />
              </span>
              <div className="toast__body">
                <p className="toast__title">{t.title}</p>
                {t.message ? <p className="toast__message">{t.message}</p> : null}
              </div>
              <button
                type="button"
                className="toast__close"
                aria-label="Dismiss notification"
                onClick={() => dismiss(t.id)}
              >
                <Icon name="x" size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
