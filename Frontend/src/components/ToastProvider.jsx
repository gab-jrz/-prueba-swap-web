import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import '../styles/Toast.css';

const ToastContext = createContext(null);

let idSeq = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, message, opts = {}) => {
    const id = ++idSeq;
    const ttl = opts.duration ?? 3000;
    const toast = { id, type, message };
    setToasts((prev) => [...prev, toast]);
    if (ttl > 0) {
      setTimeout(() => remove(id), ttl);
    }
    return id;
  }, [remove]);

  const api = useMemo(() => ({
    success: (msg, opts) => push('success', msg, opts),
    error: (msg, opts) => push('error', msg, opts),
    info: (msg, opts) => push('info', msg, opts),
    remove,
  }), [push, remove]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`} role="status" aria-live="polite">
            <span className="toast-message">{t.message}</span>
            <button className="toast-close" aria-label="Cerrar" onClick={() => remove(t.id)}>×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};
