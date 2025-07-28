'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { 
  Notification, 
  getNotificationIcon, 
  getNotificationColor 
} from '@/lib/services/notifications';

interface ToastNotificationProps {
  notification: Notification;
  onClose: () => void;
  onAction?: () => void;
  autoClose?: boolean;
  duration?: number;
}

export default function ToastNotification({
  notification,
  onClose,
  onAction,
  autoClose = true,
  duration = 5000
}: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto close
    let autoCloseTimer: NodeJS.Timeout;
    if (autoClose) {
      autoCloseTimer = setTimeout(() => {
        handleClose();
      }, duration);
    }

    return () => {
      clearTimeout(timer);
      if (autoCloseTimer) clearTimeout(autoCloseTimer);
    };
  }, [autoClose, duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    handleClose();
  };

  const getPriorityStyles = () => {
    switch (notification.priority) {
      case 'URGENT':
        return 'border-l-red-500 bg-red-50';
      case 'HIGH':
        return 'border-l-orange-500 bg-orange-50';
      case 'NORMAL':
        return 'border-l-blue-500 bg-blue-50';
      case 'LOW':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 w-96 max-w-sm
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isLeaving 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
        }
      `}
    >
      <div className={`
        bg-white rounded-lg shadow-lg border-l-4 ${getPriorityStyles()}
        p-4 relative
      `}>
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="flex items-start space-x-3 pr-6">
          {/* Icon */}
          <div className={`flex-shrink-0 text-xl ${getNotificationColor(notification.priority)}`}>
            {React.createElement(getNotificationIcon(notification.type), { className: "h-5 w-5" })}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">
              {notification.title}
            </h4>
            <p className="text-sm text-gray-700 mb-2">
              {notification.message}
            </p>

            {/* Additional Info */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {notification.fromUser && (
                  <span>from {notification.fromUser.name}</span>
                )}
                {notification.event && (
                  <span className="ml-2">• {notification.event.title}</span>
                )}
              </div>

              {/* Action Button */}
              {notification.actionUrl && (
                <button
                  onClick={handleAction}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  View
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar for Auto Close */}
        {autoClose && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all ease-linear"
              style={{
                animation: `shrink ${duration}ms linear`,
                transformOrigin: 'left'
              }}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}</style>
    </div>
  );
}
