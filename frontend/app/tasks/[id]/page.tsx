'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import {
  ArrowLeftIcon,
  CalendarIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import ImageGallery from '@/components/common/ImageGallery';
import CompleteTaskModal from '@/components/tasks/CompleteTaskModal';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { authService } from '@/lib/services';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  images?: string[];
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
  event: {
    id: string;
    title: string;
  };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  completionNote?: string;
  completionImages?: string[];
}

export default function TaskDetailPage() {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;
  const { user, canManageTask, canDeleteTask } = usePermissions();

  useEffect(() => {
    if (taskId) {
      fetchTask();
    }
    fetchCurrentUser();
  }, [taskId]);

  const fetchCurrentUser = async () => {
    try {
      const response = await authService.getProfile();
      setCurrentUser(response.user);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const fetchTask = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tasks/${taskId}`);
      setTask(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch task');
      if (err.response?.status === 401) {
        router.push('/auth/login');
      } else if (err.response?.status === 404) {
        router.push('/tasks');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      await api.delete(`/tasks/${taskId}`);
      router.push('/tasks');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete task');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const updateTaskStatus = async (newStatus: string) => {
    if (!task || !canMoveTaskToStatus(task, newStatus)) {
      setError(`You cannot move this task to ${newStatus.replace('_', ' ').toLowerCase()}`);
      return;
    }

    try {
      const response = await api.patch(`/tasks/${taskId}`, { status: newStatus });
      setTask(response.data);
      setError(''); // Clear any previous errors

      // Trigger global task statistics refresh
      localStorage.setItem('taskStatsRefresh', Date.now().toString());
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update task status');
    }
  };

  const handleTaskCompleted = async () => {
    try {
      // Refresh task data to show completion details
      await fetchTask();
      setShowCompleteModal(false);

      // Show success message
      setSuccessMessage('Task completed successfully!');
      setError('');

      // Trigger global task statistics refresh
      localStorage.setItem('taskStatsRefresh', Date.now().toString());

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Failed to refresh task after completion:', err);
    }
  };

  // Check if user can complete this task
  const canCompleteTask = (task: Task) => {
    if (!currentUser) return false;

    // Task must not be already completed
    if (task.status === 'COMPLETED') return false;

    // Check if user is assignee, creator, organizer, or event attendee
    const isAssignee = task.assignee?.id === currentUser.id;
    const isCreator = task.createdBy.id === currentUser.id;
    // Note: We'd need to check if user is organizer or attendee of the event
    // For now, allowing assignee and creator

    return isAssignee || isCreator || currentUser.role === 'ADMIN';
  };

  // Check if user can edit task details (not just status)
  const canEditTaskDetails = (task: Task) => {
    if (!currentUser) return false;

    if (currentUser.role === 'ADMIN') return true;
    if (currentUser.role === 'ORGANIZER') {
      // Organizers can edit tasks they created
      return task.createdBy.id === currentUser.id;
    }
    // Guests cannot edit task details, only status
    return false;
  };

  // Check if user can edit completion details
  const canEditCompletionDetails = (task: Task) => {
    if (!currentUser) return false;

    if (currentUser.role === 'ADMIN') return true;

    // Event organizers can edit completion details for any task in their event
    if (currentUser.role === 'ORGANIZER') {
      return task.createdBy.id === currentUser.id;
    }

    // Task assignees can edit completion details for tasks they completed
    if (currentUser.role === 'GUEST') {
      return task.assignee?.id === currentUser.id && task.status === 'COMPLETED';
    }

    return false;
  };

  // Check if user can move task to specific status (workflow rules)
  const canMoveTaskToStatus = (task: Task, newStatus: string) => {
    if (!currentUser) return false;

    // Admin can do anything
    if (currentUser.role === 'ADMIN') return true;

    // Only task creators and event organizers can cancel tasks
    if (newStatus === 'CANCELLED') {
      return task.createdBy.id === currentUser.id || currentUser.role === 'ORGANIZER';
    }

    // For assignees (GUEST role), enforce forward-only workflow
    if (currentUser.role === 'GUEST' && task.assignee?.id === currentUser.id) {
      const statusOrder = ['TODO', 'IN_PROGRESS', 'COMPLETED'];
      const currentIndex = statusOrder.indexOf(task.status);
      const newIndex = statusOrder.indexOf(newStatus);

      // Can only move forward in the workflow
      return newIndex > currentIndex;
    }

    // Organizers can move tasks freely if they're the creator or assignee
    if (currentUser.role === 'ORGANIZER') {
      return task.assignee?.id === currentUser.id || task.createdBy.id === currentUser.id;
    }

    return false;
  };

  // Check if user can update task status (simpler than full completion)
  const canUpdateTaskStatus = (task: Task) => {
    if (!currentUser) return false;

    if (currentUser.role === 'ADMIN') return true;
    if (currentUser.role === 'ORGANIZER') {
      return task.assignee?.id === currentUser.id || task.createdBy.id === currentUser.id;
    }
    if (currentUser.role === 'GUEST') {
      return task.assignee?.id === currentUser.id;
    }
    return false;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600 bg-red-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-100';
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-100';
      case 'TODO': return 'text-gray-600 bg-gray-100';
      case 'CANCELLED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading task...</div>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <Link href="/tasks" className="text-blue-600 hover:text-blue-800">
            Back to Tasks
          </Link>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Task not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link
                href="/tasks"
                className="mr-4 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <ClipboardDocumentListIcon className="h-6 w-6 mr-2 text-blue-600" />
                  Task Details
                </h1>
              </div>
            </div>
            <div className="flex space-x-3">
              {/* Complete Task Button */}
              {canCompleteTask(task) && (
                <button
                  onClick={() => setShowCompleteModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Complete Task
                </button>
              )}

              {/* Edit Button - Only for task creators/organizers */}
              {canEditTaskDetails(task) && (
                <Link
                  href={`/tasks/${task.id}/edit`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              )}

              {/* Delete Button - Only for task creators/organizers */}
              {canEditTaskDetails(task) && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded mb-6">
            {successMessage}
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            {/* Title and Status */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">{task.title}</h2>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                    {task.priority} Priority
                  </span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  {task.dueDate && isOverdue(task.dueDate) && task.status !== 'COMPLETED' && (
                    <span className="flex items-center text-red-600 text-sm font-medium">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      Overdue
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
              </div>
            )}

            {/* Task Images */}
            {task.images && task.images.length > 0 && (
              <div className="mb-6">
                <ImageGallery
                  images={task.images}
                  title="Task Images"
                />
              </div>
            )}

            {/* Task Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Task Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <span className="text-sm text-gray-500">Event:</span>
                      <p className="font-medium">{task.event.title}</p>
                    </div>
                  </div>
                  
                  {task.assignee && (
                    <div className="flex items-center">
                      <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <span className="text-sm text-gray-500">Assigned to:</span>
                        <p className="font-medium">{task.assignee.name}</p>
                        <p className="text-sm text-gray-500">{task.assignee.email}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <span className="text-sm text-gray-500">Created by:</span>
                      <p className="font-medium">{task.createdBy.name}</p>
                      <p className="text-sm text-gray-500">{task.createdBy.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Dates</h3>
                <div className="space-y-3">
                  {task.dueDate && (
                    <div className="flex items-center">
                      <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <span className="text-sm text-gray-500">Due date:</span>
                        <p className="font-medium">{formatDate(task.dueDate)}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <span className="text-sm text-gray-500">Created:</span>
                      <p className="font-medium">{formatDate(task.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <span className="text-sm text-gray-500">Last updated:</span>
                      <p className="font-medium">{formatDate(task.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Completion Details */}
            {task.status === 'COMPLETED' && task.completedBy && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Completion Details</h3>
                  {/* Edit Completion Button - For assignees who completed it, organizers, and task creators */}
                  {canEditCompletionDetails(task) && (
                    <button
                      onClick={() => setShowCompleteModal(true)}
                      className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit Completion
                    </button>
                  )}
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
                      <div>
                        <span className="text-sm text-green-700">Completed by:</span>
                        <p className="font-medium text-green-900">{task.completedBy.name}</p>
                        <p className="text-sm text-green-700">{task.completedBy.email}</p>
                      </div>
                    </div>

                    {task.completedAt && (
                      <div className="flex items-center">
                        <CalendarIcon className="h-5 w-5 text-green-600 mr-3" />
                        <div>
                          <span className="text-sm text-green-700">Completed on:</span>
                          <p className="font-medium text-green-900">{formatDate(task.completedAt)}</p>
                        </div>
                      </div>
                    )}

                    {task.completionNote && (
                      <div className="mt-3">
                        <span className="text-sm text-green-700">Completion Note:</span>
                        <p className="mt-1 text-green-900 whitespace-pre-wrap">{task.completionNote}</p>
                      </div>
                    )}
                  </div>

                  {/* Completion Images */}
                  {task.completionImages && task.completionImages.length > 0 && (
                    <div className="mt-4">
                      <ImageGallery
                        images={task.completionImages}
                        title="Completion Proof"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}


          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Task</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this task? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Task Modal */}
      <CompleteTaskModal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        task={task}
        onTaskCompleted={handleTaskCompleted}
      />
    </div>
  );
}
