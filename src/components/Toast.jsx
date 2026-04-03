import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

const ICONS = {
  success: <CheckCircle size={20} />,
  warning: <AlertTriangle size={20} />,
  error: <XCircle size={20} />,
  info: <Info size={20} />,
};

const COLORS = {
  success: { bg: 'var(--accent-green)', shadow: 'rgba(16, 185, 129, 0.4)' },
  warning: { bg: 'var(--accent-yellow)', shadow: 'rgba(234, 179, 8, 0.4)' },
  error: { bg: 'var(--accent-red)', shadow: 'rgba(239, 68, 68, 0.4)' },
  info: { bg: 'var(--accent-blue)', shadow: 'rgba(59, 130, 246, 0.4)' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const resolveRef = useRef(null);

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showConfirm = useCallback((message, { title = 'Confirmação', confirmText = 'Confirmar', cancelText = 'Cancelar', type = 'warning' } = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setConfirmDialog({ message, title, confirmText, cancelText, type });
    });
  }, []);

  const handleConfirm = useCallback((result) => {
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
    setConfirmDialog(null);
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast, confirm: showConfirm }}>
      {children}

      {/* Toasts */}
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: 10,
        zIndex: 10000,
        pointerEvents: 'none',
      }}>
        <AnimatePresence>
          {toasts.map((t) => {
            const color = COLORS[t.type] || COLORS.info;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 40, scale: 0.92, x: 20 }}
                animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                exit={{ opacity: 0, x: 60, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                style={{
                  background: color.bg,
                  color: '#fff',
                  padding: '14px 20px',
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  boxShadow: `0 8px 32px ${color.shadow}`,
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  minWidth: 280,
                  maxWidth: 420,
                }}
                onClick={() => removeToast(t.id)}
              >
                {ICONS[t.type]}
                <span style={{ flex: 1 }}>{t.message}</span>
                <X size={14} style={{ opacity: 0.7 }} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Confirm Dialog */}
      <AnimatePresence>
        {confirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10001,
            }}
            onClick={() => handleConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: '32px',
                maxWidth: 440,
                width: '90%',
                boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: confirmDialog.type === 'danger'
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'rgba(234, 179, 8, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: confirmDialog.type === 'danger' ? 'var(--accent-red)' : 'var(--accent-yellow)',
                  flexShrink: 0,
                }}>
                  <AlertTriangle size={22} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {confirmDialog.title}
                </h3>
              </div>

              <p style={{
                color: 'var(--text-secondary)',
                fontSize: 14,
                lineHeight: 1.6,
                marginBottom: 28,
                paddingLeft: 58,
              }}>
                {confirmDialog.message}
              </p>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  className="btn"
                  onClick={() => handleConfirm(false)}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    padding: '10px 20px',
                    fontWeight: 600,
                    borderRadius: 10,
                  }}
                >
                  {confirmDialog.cancelText}
                </button>
                <button
                  className="btn"
                  onClick={() => handleConfirm(true)}
                  style={{
                    background: confirmDialog.type === 'danger' ? 'var(--accent-red)' : 'var(--accent-blue)',
                    color: '#fff',
                    padding: '10px 20px',
                    fontWeight: 600,
                    borderRadius: 10,
                    boxShadow: confirmDialog.type === 'danger'
                      ? '0 4px 12px rgba(239, 68, 68, 0.3)'
                      : '0 4px 12px rgba(59, 130, 246, 0.3)',
                  }}
                >
                  {confirmDialog.confirmText}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext);
}
