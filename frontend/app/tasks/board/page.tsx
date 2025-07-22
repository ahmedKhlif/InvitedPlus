'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import CreateTaskModal from '@/components/tasks/CreateTaskModal';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { authService } from '@/lib/services';
import { 
  PlusIcon, 
  ArrowLeftIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  UserIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

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
  event: {
    id: string;
    title: string;
  };
  createdAt: string;
  updatedAt: string;
}

const statusColumns = [
  { key: 'TODO', title: 'To Do', color: 'bg-gray-100 border-gray-300' },
  { key: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-100 border-blue-300' },
  { key: 'COMPLETED', title: 'Completed', color: 'bg-green-100 border-green-300' },
  { key: 'CANCELLED', title: 'Cancelled', color: 'bg-red-100 border-red-300' },
];

export default function TaskBoardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const router = useRouter();
  const { canCreateTask } = usePermissions();

  useEffect(() => {
    fetchTasks();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await authService.getProfile();
      setCurrentUser(response.user);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tasks?limit=100');
      setTasks(response.data.tasks);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch tasks');
      if (err.response?.status === 401) {
        router.push('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await api.patch(`/tasks/${taskId}`, { status: newStatus });
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: response.data.status } : task
      ));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update task status');
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedTask) {
      const task = tasks.find(t => t.id === draggedTask);
      if (task && task.status !== newStatus && canUpdateTask(task)) {
        updateTaskStatus(draggedTask, newStatus);
      }
      setDraggedTask(null);
    }
  };

  // Check if user can update a specific task
  const canUpdateTask = (task: Task) => {
    if (!currentUser) return false;

    if (currentUser.role === 'ADMIN') return true;
    if (currentUser.role === 'ORGANIZER') {
      // Organizers can update tasks in their events or their own tasks
      return task.assignee?.id === currentUser.id || task.createdBy.id === currentUser.id;
    }
    if (currentUser.role === 'GUEST') {
      // Guests can only update their own assigned tasks (status only)
      return task.assignee?.id === currentUser.id;
    }
    return false;
  };

  // Check if user can edit task details (not just status)
  const canEditTask = (task: Task) => {
    if (!currentUser) return false;

    if (currentUser.role === 'ADMIN') return true;
    if (currentUser.role === 'ORGANIZER') {
      // Organizers can edit tasks they created or in their events
      return task.createdBy.id === currentUser.id;
    }
    // Guests cannot edit task details
    return false;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'border-l-red-500';
      case 'HIGH': return 'border-l-orange-500';
      case 'MEDIUM': return 'border-l-yellow-500';
      case 'LOW': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link
                href="/tasks"
                className="mr-4 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <ClipboardDocumentListIcon className="h-8 w-8 mr-3 text-blue-600" />
                  Task Board
                </h1>
                <p className="text-gray-600">Drag and drop tasks to update their status</p>
              </div>
            </div>
            {canCreateTask() && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Task
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {statusColumns.map((column) => (
            <div
              key={column.key}
              className={`rounded-lg border-2 border-dashed ${column.color} min-h-[400px] lg:min-h-[600px]`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.key)}
            >
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-4 flex items-center justify-between">
                  {column.title}
                  <span className="bg-gray-200 text-gray-700 text-sm px-2 py-1 rounded-full">
                    {getTasksByStatus(column.key).length}
                  </span>
                </h3>
                
                <div className="space-y-3">
                  {getTasksByStatus(column.key).map((task) => (
                    <div
                      key={task.id}
                      draggable={canUpdateTask(task)}
                      onDragStart={(e) => canUpdateTask(task) ? handleDragStart(e, task.id) : e.preventDefault()}
                      className={`bg-white rounded-lg shadow-sm border-l-4 ${getPriorityColor(task.priority)} p-4 ${canUpdateTask(task) ? 'cursor-move' : 'cursor-default'} hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 text-sm leading-tight">
                          {task.title}
                        </h4>
                        <span className="text-xs text-gray-500 ml-2">
                          {task.priority}
                        </span>
                      </div>
                      
                      {task.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {task.event.title}
                        </div>
                        {task.dueDate && (
                          <div className={`flex items-center ${
                            isOverdue(task.dueDate) && task.status !== 'COMPLETED' 
                              ? 'text-red-600' 
                              : ''
                          }`}>
                            {isOverdue(task.dueDate) && task.status !== 'COMPLETED' && (
                              <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                            )}
                            {formatDate(task.dueDate)}
                          </div>
                        )}
                      </div>
                      
                      {task.assignee && (
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <UserIcon className="h-3 w-3 mr-1" />
                          {task.assignee.name}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex space-x-2">
                          {canEditTask(task) && (
                            <button
                              onClick={() => router.push(`/tasks/${task.id}/edit`)}
                              className="text-green-600 hover:text-green-800 text-xs font-medium"
                            >
                              Edit
                            </button>
                          )}
                          {!canUpdateTask(task) && (
                            <span className="text-xs text-gray-400">
                              {currentUser?.role === 'GUEST' ? 'View Only' : 'Read Only'}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => router.push(`/tasks/${task.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTaskCreated={fetchTasks}
      />
    </div>
  );
}
