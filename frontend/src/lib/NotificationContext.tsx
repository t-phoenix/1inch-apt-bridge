'use client';

import { CustomNotification } from '@/components/CustomNotification';
import { createContext, ReactNode, useContext, useState } from 'react';

interface Notification {
  id: string;
  title?: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  showSuccess: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    const newNotification = { ...notification, id };
    setNotifications(prev => [...prev, newNotification]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showSuccess = (message: string, title?: string) => {
    showNotification({ message, title, type: 'success' });
  };

  const showInfo = (message: string, title?: string) => {
    showNotification({ message, title, type: 'info' });
  };

  const showWarning = (message: string, title?: string) => {
    showNotification({ message, title, type: 'warning' });
  };

  const showError = (message: string, title?: string) => {
    showNotification({ message, title, type: 'error' });
  };

  const contextValue: NotificationContextType = {
    showNotification,
    showSuccess,
    showInfo,
    showWarning,
    showError,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {notifications.map((notification) => (
        <CustomNotification
          key={notification.id}
          isOpen={true}
          onClose={() => removeNotification(notification.id)}
          title={notification.title}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
        />
      ))}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}