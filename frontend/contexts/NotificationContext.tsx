'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Notification, NotificationType, NotificationPriority } from '@/lib/services/notifications';
import ToastNotification from '@/components/notifications/ToastNotification';

interface NotificationContextType {
  showToast: (notification: Notification) => void;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface ToastState {
  id: string;
  notification: Notification;
}

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const router = useRouter();

  const showToast = useCallback((notification: Notification) => {
    const toastId = `toast-${notification.id}-${Date.now()}`;
    
    setToasts(prev => [
      ...prev,
      {
        id: toastId,
        notification
      }
    ]);

    // Auto remove after 10 seconds as fallback
    setTimeout(() => {
      hideToast(toastId);
    }, 10000);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const handleToastAction = useCallback((notification: Notification) => {
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  }, [router]);

  const value: NotificationContextType = {
    showToast,
    hideToast,
    clearAllToasts
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{
              transform: `translateY(${index * 10}px)`,
              zIndex: 50 - index
            }}
          >
            <ToastNotification
              notification={toast.notification}
              onClose={() => hideToast(toast.id)}
              onAction={() => handleToastAction(toast.notification)}
              autoClose={true}
              duration={5000}
            />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Hook for triggering notifications from anywhere in the app
export function useNotificationTrigger() {
  const { showToast } = useNotifications();

  const triggerNotification = useCallback((
    title: string,
    message: string,
    type: Notification['type'] = NotificationType.SYSTEM_ANNOUNCEMENT,
    priority: Notification['priority'] = NotificationPriority.NORMAL,
    actionUrl?: string
  ) => {
    const notification: Notification = {
      id: `local-${Date.now()}`,
      title,
      message,
      type,
      priority,
      isRead: false,
      userId: '',
      actionUrl,
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    showToast(notification);
  }, [showToast]);

  return { triggerNotification };
}
