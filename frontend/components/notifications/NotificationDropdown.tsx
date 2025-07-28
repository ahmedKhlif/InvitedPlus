'use client';

import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import {
  CheckIcon,
  TrashIcon,
  ArrowPathIcon,
  EyeIcon,
  XMarkIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { 
  Notification, 
  getNotificationIcon, 
  getNotificationColor, 
  formatNotificationTime 
} from '@/lib/services/notifications';

interface NotificationDropdownProps {
  notifications: Notification[];
  isLoading: boolean;
  unreadCount: number;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (notificationId: string) => void;
  onRefresh: () => void;
  onClose: () => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
}

export default function NotificationDropdown({
  notifications,
  isLoading,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onRefresh,
  onClose,
  buttonRef
}: NotificationDropdownProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    setMounted(true);

    // Calculate position based on button position
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8, // 8px below the button
        right: window.innerWidth - rect.right // Align right edge
      });
    }
  }, [buttonRef]);

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }

    // Navigate to action URL if provided
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      onClose();
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    console.log('🔵 Mark as read clicked:', notificationId);
    onMarkAsRead(notificationId);
  };

  const handleDelete = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    console.log('🔴 Delete clicked:', notificationId);
    onDeleteNotification(notificationId);
  };

  if (!mounted) return null;

  const dropdownContent = (
    <div
      className="notification-dropdown-force-top fixed w-96 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-96 overflow-hidden"
      style={{
        zIndex: 999999,
        top: position.top,
        right: position.right
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {unreadCount} new
              </span>
            )}
          </h3>
          <div className="flex items-center space-x-2">
            {/* Refresh Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log('🔄 Refresh clicked');
                onRefresh();
              }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Refresh notifications"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            
            {/* Mark All Read Button */}
            {unreadCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('✅ Mark all as read clicked');
                  onMarkAllAsRead();
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                title="Mark all as read"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
            )}
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Close"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <ArrowPathIcon className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <BellIcon className="h-12 w-12 text-gray-300 mb-2" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start space-x-3">
                  {/* Notification Icon */}
                  <div className={`flex-shrink-0 text-lg ${getNotificationColor(notification.priority)}`}>
                    {(() => {
                      const IconComponent = getNotificationIcon(notification.type);
                      return <IconComponent className="h-5 w-5" />;
                    })()}
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </p>
                        <p className={`text-sm mt-1 ${
                          !notification.isRead ? 'text-gray-700' : 'text-gray-500'
                        }`}>
                          {notification.message}
                        </p>
                        
                        {/* Additional Info */}
                        <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                          <span>{formatNotificationTime(notification.createdAt)}</span>
                          {notification.fromUser && (
                            <span>from {notification.fromUser.name}</span>
                          )}
                          {notification.event && (
                            <span>• {notification.event.title}</span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1 ml-2">
                        {!notification.isRead && (
                          <button
                            onClick={(e) => handleMarkAsRead(e, notification.id)}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded"
                            title="Mark as read"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(e, notification.id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                          title="Delete notification"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => {
              router.push('/notifications');
              onClose();
            }}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );

  return createPortal(dropdownContent, document.body);
}
