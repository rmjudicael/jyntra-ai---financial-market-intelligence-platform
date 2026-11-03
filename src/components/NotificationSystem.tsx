import React, { createContext, useContext, useCallback, useState, useRef, useEffect, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, Trash2, X } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info';

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // ms, 0 = permanent
}

interface NotificationContextValue {
  notify: (n: Omit<NotificationItem, 'id'>) => void;
  success: (title: string, message?: string, duration?: number) => void;
  error: (title: string, message?: string, duration?: number) => void;
  info: (title: string, message?: string, duration?: number) => void;
  confirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
  notifications: NotificationItem[];
  remove: (id: string) => void;
  isConfirmOpen: boolean;
  confirmData: { title: string; message: string; onConfirm: () => void; onCancel?: () => void } | null;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const TYPE_CONFIG: Record<NotificationType, { icon: ReactNode; color: string; bg: string; border: string }> = {
  success: {
    icon: <CheckCircle2 className="w-5 h-5" />,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  error: {
    icon: <AlertCircle className="w-5 h-5" />,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
  info: {
    icon: <Info className="w-5 h-5" />,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
};

const NotificationSystem: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [confirmData, setConfirmData] = useState<{ title: string; message: string; onConfirm: () => void; onCancel?: () => void } | null>(null);

  const addNotification = useCallback((item: Omit<NotificationItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9);
    const newItem: NotificationItem = { id, ...item };
    setNotifications((prev) => [...prev, newItem]);
    if (item.duration && item.duration > 0) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, item.duration);
    }
    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const success = useCallback((title: string, message?: string, duration = 4000) => {
    addNotification({ type: 'success', title, message, duration });
  }, [addNotification]);

  const error = useCallback((title: string, message?: string, duration = 6000) => {
    addNotification({ type: 'error', title, message, duration });
  }, [addNotification]);

  const info = useCallback((title: string, message?: string, duration = 5000) => {
    addNotification({ type: 'info', title, message, duration });
  }, [addNotification]);

  const confirm = useCallback((title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    setConfirmData({ title, message, onConfirm, onCancel });
  }, []);

  const resolveConfirm = useCallback((confirmed: boolean) => {
    if (confirmData) {
      if (confirmed) {
        confirmData.onConfirm();
      } else if (confirmData.onCancel) {
        confirmData.onCancel();
      }
    }
    setConfirmData(null);
  }, [confirmData]);

  const ctx: NotificationContextValue = {
    notify: addNotification,
    success,
    error,
    info,
    confirm,
    notifications,
    remove: removeNotification,
    isConfirmOpen: confirmData !== null,
    confirmData,
  };

  return (
    <NotificationContext.Provider value={ctx}>
      {children}
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {notifications.map((n) => {
          const cfg = TYPE_CONFIG[n.type];
          return (
            <div
              key={n.id}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-2xl animate-in fade-in slide-in-from-right-2 duration-300 min-w-[320px] max-w-md"
              style={{
                borderColor: cfg.border,
                backgroundColor: cfg.bg,
                color: '#e2e8f0',
              }}
            >
              <div className="flex-shrink-0 mt-0.5">{cfg.icon}</div>
              <div>
                <h4 className={`font-bold text-sm ${cfg.color}`}>{n.title}</h4>
                {n.message && <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>}
              </div>
              <button
                onClick={() => removeNotification(n.id)}
                className="ml-auto shrink-0 rounded p-1 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                aria-label="Fermer la notification"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirmation dialog */}
      {confirmData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => resolveConfirm(false)} />
          <div className="relative rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl animate-in zoom-in duration-200 w-full max-w-md">
            <div className="flex items-start gap-3 mb-4">
              <Trash2 className="w-6 h-6 text-rose-400 shrink-0" />
              <div>
                <h3 className="font-bold text-white text-sm">{confirmData.title}</h3>
                <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{confirmData.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/50">
              <button
                onClick={() => resolveConfirm(false)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => resolveConfirm(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-rose-500 bg-rose-500/10 text-rose-400 text-xs font-medium hover:bg-rose-500/20 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextValue => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
  return ctx;
};

export default NotificationSystem;
