'use client';

import { useState } from 'react';
import {
  CalendarIcon,
  UserIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChatBubbleLeftIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import CompleteTaskModal from './CompleteTaskModal';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  completedBy?: {
    id: string;
    name: string;
    email: string;
  };
  completedAt?: string;
  completionNote?: string;
  completionImages?: string[];
  event: {
    id: string;
    title: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onStatusChange?: (taskId: string, newStatus: string) => void;
  onTaskCompleted?: () => void;
  isDragging?: boolean;
}

export default function TaskCard({ task, onEdit, onDelete, onStatusChange, onTaskCompleted, isDragging }: TaskCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT':
      case 'HIGH':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';
  const isDueSoon = task.dueDate && new Date(task.dueDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000) && task.status !== 'COMPLETED';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    if (diffDays <= 7) return `In ${diffDays} days`;
    
    return date.toLocaleDateString();
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 cursor-move hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50 rotate-2' : ''
      } ${isOverdue ? 'border-l-4 border-l-red-500' : isDueSoon ? 'border-l-4 border-l-yellow-500' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{task.title}</h4>
        {showActions && (
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={() => onEdit(task)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(task.id)}
                className="p-1 text-gray-400 hover:text-red-600"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}

      {/* Priority Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
          {getPriorityIcon(task.priority)}
          <span className="ml-1">{task.priority}</span>
        </span>
        
        {/* Event Badge */}
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          {task.event.title}
        </span>
      </div>

      {/* Due Date */}
      {task.dueDate && (
        <div className={`flex items-center mb-2 text-xs ${
          isOverdue ? 'text-red-600' : isDueSoon ? 'text-yellow-600' : 'text-gray-500'
        }`}>
          <CalendarIcon className="h-4 w-4 mr-1" />
          <span>{formatDate(task.dueDate)}</span>
          {isOverdue && <span className="ml-1 font-medium">(Overdue)</span>}
          {isDueSoon && !isOverdue && <span className="ml-1 font-medium">(Due Soon)</span>}
        </div>
      )}

      {/* Assignee */}
      {task.assignee && (
        <div className="flex items-center mb-2 text-xs text-gray-500">
          <UserIcon className="h-4 w-4 mr-1" />
          <span>{task.assignee.name}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center text-xs text-gray-400">
          <ClockIcon className="h-3 w-3 mr-1" />
          <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
        </div>
        
        {/* Task Actions */}
        <div className="flex items-center space-x-2">
          {/* Complete Task Button */}
          {task.status !== 'COMPLETED' && (
            <button
              onClick={() => setShowCompleteModal(true)}
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 border border-green-200 rounded hover:bg-green-200 transition-colors"
              title="Complete task with details"
            >
              <CheckIcon className="h-3 w-3 mr-1" />
              Complete
            </button>
          )}

          {/* Quick Complete (fallback) */}
          {onStatusChange && task.status !== 'COMPLETED' && !showCompleteModal && (
            <button
              onClick={() => onStatusChange(task.id, 'COMPLETED')}
              className="text-xs text-green-600 hover:text-green-800 font-medium"
              title="Quick complete without details"
            >
              Quick Complete
            </button>
          )}
        </div>
      </div>

      {/* Progress Indicator for IN_PROGRESS tasks */}
      {task.status === 'IN_PROGRESS' && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div className="bg-blue-600 h-1 rounded-full" style={{ width: '60%' }}></div>
          </div>
        </div>
      )}

      {/* Completion Details */}
      {task.status === 'COMPLETED' && (task.completedBy || task.completionNote || task.completionImages?.length) && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center mb-2">
            <CheckIcon className="h-4 w-4 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-800">
              Completed by {task.completedBy?.name || 'Unknown'}
            </span>
            {task.completedAt && (
              <span className="text-xs text-green-600 ml-2">
                on {new Date(task.completedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {task.completionNote && (
            <p className="text-sm text-green-700 mb-2">{task.completionNote}</p>
          )}

          {task.completionImages && task.completionImages.length > 0 && (
            <div className="flex space-x-2 overflow-x-auto">
              {task.completionImages.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Completion proof ${index + 1}`}
                  className="h-16 w-16 object-cover rounded border border-green-300 flex-shrink-0"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Complete Task Modal */}
      <CompleteTaskModal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        task={task}
        onTaskCompleted={() => {
          setShowCompleteModal(false);
          onTaskCompleted?.();
        }}
      />
    </div>
  );
}
