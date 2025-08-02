'use client';

import React, { useState } from 'react';
import { TrashIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/lib/contexts/ToastContext';

interface MessageActionsProps {
  messageId: string;
  isOwnMessage: boolean;
  isEventMessage?: boolean;
  onDelete: (messageId: string) => Promise<void>;
  className?: string;
}

const MessageActions: React.FC<MessageActionsProps> = ({
  messageId,
  isOwnMessage,
  isEventMessage = false,
  onDelete,
  className = ''
}) => {
  const [showActions, setShowActions] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { showSuccess, showError } = useToast();

  // Only show delete option for own messages
  if (!isOwnMessage) {
    return null;
  }

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setDeleting(true);
    try {
      await onDelete(messageId);
      showSuccess('Message deleted successfully');
      setShowConfirm(false);
      setShowActions(false);
    } catch (error: any) {
      console.error('Failed to delete message:', error);
      showError(error.response?.data?.message || 'Failed to delete message');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setShowActions(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Actions Trigger */}
      <button
        onClick={() => setShowActions(!showActions)}
        className="
          opacity-0 group-hover:opacity-100 
          p-1 rounded-full 
          hover:bg-gray-200 hover:bg-opacity-50 
          transition-all duration-200
          text-gray-500 hover:text-gray-700
        "
        title="Message options"
      >
        <EllipsisVerticalIcon className="h-4 w-4" />
      </button>

      {/* Actions Dropdown */}
      {showActions && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowActions(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="
            absolute right-0 top-full mt-1 z-20
            bg-white rounded-lg shadow-lg border border-gray-200
            min-w-[120px] py-1
          ">
            {!showConfirm ? (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="
                  w-full px-3 py-2 text-left text-sm
                  text-red-600 hover:bg-red-50
                  flex items-center space-x-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                "
              >
                <TrashIcon className="h-4 w-4" />
                <span>Delete message</span>
              </button>
            ) : (
              <div className="px-3 py-2">
                <p className="text-xs text-gray-600 mb-2">
                  Delete this message?
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="
                      px-2 py-1 text-xs
                      bg-red-600 text-white rounded
                      hover:bg-red-700
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors
                    "
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={deleting}
                    className="
                      px-2 py-1 text-xs
                      bg-gray-300 text-gray-700 rounded
                      hover:bg-gray-400
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors
                    "
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MessageActions;
