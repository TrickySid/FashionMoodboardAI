import React, { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={styles.container} aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div key={t.id} style={styles.toast(t.type)}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

const styles = {
  container: {
    position: 'fixed',
    top: 20,
    right: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    zIndex: 9999,
    width: 320,
    pointerEvents: 'none'
  },
  toast: (type) => ({
    padding: '12px 14px',
    borderRadius: 8,
    fontSize: 14,
    color: '#0b1220',
    background: type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#e9f0ff',
    border: '1px solid',
    borderColor: type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee0ff',
    boxShadow: '0 2px 8px rgba(0,0,0,.15)'
  }),
};
